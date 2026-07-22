import { TelegramNotificationStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { sendTelegramMessage } from "../../telegram/telegram-api";
import { logger } from "../../utils/logger";

const WORKER_INTERVAL_MS = 5000;
const RETRY_DELAY_MS = 30000;
const MAX_SEND_ATTEMPTS = 3;
const STALE_LOCK_MS = 120000;
const ALLOWED_INTERVALS = new Set([30, 60, 120, 300, 600]);

let workerTimer: NodeJS.Timeout | undefined;
let workerRunning = false;

type ScheduleTelegramAlertNotificationsInput = {
  alertId: string;
  userId: string;
  telegramId: string;
  message: string;
  repeatCount: number;
  intervalSeconds: number;
};

const normalizeRepeatCount = (value: number) => {
  return Math.min(Math.max(Math.trunc(value), 1), 5);
};

const normalizeIntervalSeconds = (value: number) => {
  return ALLOWED_INTERVALS.has(value) ? value : 60;
};

export const scheduleTelegramAlertNotifications = async (
  input: ScheduleTelegramAlertNotificationsInput
) => {
  const repeatCount = normalizeRepeatCount(input.repeatCount);
  const intervalSeconds = normalizeIntervalSeconds(
    input.intervalSeconds
  );
  const now = Date.now();

  await prisma.telegramAlertNotification.createMany({
    data: Array.from({ length: repeatCount }, (_, index) => ({
      alertId: input.alertId,
      userId: input.userId,
      telegramId: input.telegramId,
      message:
        repeatCount > 1
          ? `${input.message}\n\n🔁 ${index + 1}/${repeatCount}`
          : input.message,
      sequence: index + 1,
      totalCount: repeatCount,
      scheduledAt: new Date(now + index * intervalSeconds * 1000)
    })),
    skipDuplicates: true
  });

  void processDueTelegramAlertNotifications();
};

export const processDueTelegramAlertNotifications = async () => {
  if (workerRunning) {
    return;
  }

  workerRunning = true;

  try {
    const now = new Date();
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS);

    const jobs = await prisma.telegramAlertNotification.findMany({
      where: {
        OR: [
          {
            status: TelegramNotificationStatus.PENDING,
            scheduledAt: {
              lte: now
            }
          },
          {
            status: TelegramNotificationStatus.SENDING,
            lockedAt: {
              lte: staleBefore
            }
          }
        ]
      },
      orderBy: {
        scheduledAt: "asc"
      },
      take: 25
    });

    for (const job of jobs) {
      const claimed = await prisma.telegramAlertNotification.updateMany({
        where: {
          id: job.id,
          OR: [
            {
              status: TelegramNotificationStatus.PENDING
            },
            {
              status: TelegramNotificationStatus.SENDING,
              lockedAt: {
                lte: staleBefore
              }
            }
          ]
        },
        data: {
          status: TelegramNotificationStatus.SENDING,
          lockedAt: new Date()
        }
      });

      if (claimed.count === 0) {
        continue;
      }

      let sent = false;
      let reason: string | undefined;

      try {
        const result = await sendTelegramMessage(
          job.telegramId,
          job.message
        );

        sent = result.sent;
        reason = result.sent ? undefined : result.reason;
      } catch (error) {
        reason =
          error instanceof Error
            ? error.message
            : "Unknown Telegram send error";
      }

      if (sent) {
        await prisma.telegramAlertNotification.update({
          where: {
            id: job.id
          },
          data: {
            status: TelegramNotificationStatus.SENT,
            attempts: {
              increment: 1
            },
            sentAt: new Date(),
            lockedAt: null,
            lastError: null
          }
        });

        continue;
      }

      const nextAttempts = job.attempts + 1;
      const permanentlyFailed =
        nextAttempts >= MAX_SEND_ATTEMPTS;

      await prisma.telegramAlertNotification.update({
        where: {
          id: job.id
        },
        data: {
          status: permanentlyFailed
            ? TelegramNotificationStatus.FAILED
            : TelegramNotificationStatus.PENDING,
          attempts: nextAttempts,
          lastError: reason?.slice(0, 2000),
          lockedAt: null,
          scheduledAt: permanentlyFailed
            ? job.scheduledAt
            : new Date(Date.now() + RETRY_DELAY_MS)
        }
      });

      logger.warn(
        {
          notificationId: job.id,
          alertId: job.alertId,
          attempts: nextAttempts,
          reason
        },
        permanentlyFailed
          ? "Telegram notification permanently failed"
          : "Telegram notification will be retried"
      );
    }
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : error
      },
      "Telegram notification worker failed"
    );
  } finally {
    workerRunning = false;
  }
};

export const startTelegramAlertNotificationWorker = () => {
  if (workerTimer) {
    return;
  }

  void processDueTelegramAlertNotifications();

  workerTimer = setInterval(() => {
    void processDueTelegramAlertNotifications();
  }, WORKER_INTERVAL_MS);

  logger.info("Telegram alert notification worker started");
};

export const stopTelegramAlertNotificationWorker = () => {
  if (!workerTimer) {
    return;
  }

  clearInterval(workerTimer);
  workerTimer = undefined;
};
