import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";
import { createTelegramChatInviteLink, sendTelegramMessage } from "../../telegram/telegram-api";
import { buildRadarReplyMarkup } from "../../telegram/telegram-markup";
import type { TelegramChat, TelegramChatMemberUpdated } from "../../telegram/telegram.types";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";

// Radar unlock: whoever brings RADAR_REFERRAL_REQUIRED people into the community channel through their own
// personal invite link gets radarPreviewAccess. Telegram tells the bot about each join/leave (chat_member updates,
// which need the bot to be an admin of the channel) and says which invite link the person used.

const channelHandle = () =>
  env.RADAR_REFERRAL_CHANNEL.trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
const isNumericChannel = () => /^-?\d+$/.test(channelHandle());
const channelChatId = () => (isNumericChannel() ? channelHandle() : `@${channelHandle()}`);
const channelUrl = () => (isNumericChannel() ? null : `https://t.me/${channelHandle()}`);

const isReferralChannel = (chat: TelegramChat) =>
  isNumericChannel()
    ? String(chat.id) === channelHandle()
    : chat.username?.toLowerCase() === channelHandle().toLowerCase();

const MEMBER_STATUSES = new Set(["member", "administrator", "creator"]);
const GONE_STATUSES = new Set(["left", "kicked"]);

const isJoin = (update: TelegramChatMemberUpdated) =>
  GONE_STATUSES.has(update.old_chat_member.status) && update.new_chat_member.status === "member";
const isLeave = (update: TelegramChatMemberUpdated) =>
  MEMBER_STATUSES.has(update.old_chat_member.status) && GONE_STATUSES.has(update.new_chat_member.status);

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const activeCount = (inviterUserId: string) =>
  prisma.radarReferralJoin.count({ where: { inviterUserId, leftAt: null } });

export const radarReferralService = {
  async progress(userId: string) {
    const [link, joined] = await Promise.all([
      prisma.radarReferralLink.findUnique({ where: { userId } }),
      activeCount(userId)
    ]);

    return {
      required: env.RADAR_REFERRAL_REQUIRED,
      joined,
      link: link?.inviteLink ?? null,
      channelUrl: channelUrl()
    };
  },

  // One personal link per user, created the first time they ask for it.
  async ensureLink(user: { id: string; telegramId?: string | null }) {
    const existing = await prisma.radarReferralLink.findUnique({ where: { userId: user.id } });
    if (existing) return existing.inviteLink;

    const created = await createTelegramChatInviteLink(
      channelChatId(),
      `ref-${user.telegramId ?? user.id.slice(0, 8)}`
    );
    if (!created) throw new AppError("The invite link is temporarily unavailable", 503);

    try {
      const row = await prisma.radarReferralLink.create({
        data: { userId: user.id, inviteLink: created }
      });
      return row.inviteLink;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const row = await prisma.radarReferralLink.findUnique({ where: { userId: user.id } });
        if (row) return row.inviteLink;
      }
      throw error;
    }
  },

  async unlockIfReady(inviterUserId: string) {
    const joined = await activeCount(inviterUserId);
    if (joined < env.RADAR_REFERRAL_REQUIRED) return false;

    // Only the request that really flips the flag sends the congratulation message.
    const granted = await prisma.user.updateMany({
      where: { id: inviterUserId, radarPreviewAccess: false },
      data: { radarPreviewAccess: true }
    });
    if (!granted.count) return false;

    const inviter = await prisma.user.findUnique({ where: { id: inviterUserId } });
    if (inviter?.telegramId) {
      const required = env.RADAR_REFERRAL_REQUIRED;
      await sendTelegramMessage(
        Number(inviter.telegramId),
        `🎉 ${required} people joined the channel through your link. Radar access is now active for you.\n\n` +
          `تبریک! ${required} نفر با لینک تو عضو کانال شدند و دسترسی رادار برایت فعال شد.`,
        buildRadarReplyMarkup()
      );
    }
    return true;
  },

  // Never throws: Telegram retries a failed webhook again and again, which would clog the update queue.
  async handleChatMember(update: TelegramChatMemberUpdated) {
    try {
      if (!isReferralChannel(update.chat)) {
        return { processed: false, reason: "Not the referral channel" };
      }

      const invited = update.new_chat_member.user;
      if (invited.is_bot) return { processed: false, reason: "Bots are not counted" };
      const invitedId = String(invited.id);

      if (isLeave(update)) {
        const result = await prisma.radarReferralJoin.updateMany({
          where: { invitedTelegramId: invitedId, leftAt: null },
          data: { leftAt: new Date() }
        });
        return { processed: true, event: "leave", updated: result.count };
      }

      if (!isJoin(update)) return { processed: false, reason: "Not a join or leave" };

      const inviteLink = update.invite_link?.invite_link;
      if (!inviteLink) {
        return { processed: true, event: "join", counted: false, reason: "Joined without a personal link" };
      }

      const owner = await prisma.radarReferralLink.findUnique({ where: { inviteLink } });
      if (!owner) return { processed: true, event: "join", counted: false, reason: "Not a personal link" };

      const inviter = await prisma.user.findUnique({ where: { id: owner.userId } });
      if (!inviter || inviter.telegramId === invitedId) {
        return { processed: true, event: "join", counted: false, reason: "Own link or unknown inviter" };
      }

      // A person counts once, ever, for the first link they used. Coming back through the same
      // inviter's link only restores that same count; it never counts twice.
      const previous = await prisma.radarReferralJoin.findUnique({ where: { invitedTelegramId: invitedId } });
      if (!previous) {
        try {
          await prisma.radarReferralJoin.create({
            data: { inviterUserId: inviter.id, invitedTelegramId: invitedId }
          });
        } catch (error) {
          if (!isUniqueViolation(error)) throw error;
        }
      } else if (previous.inviterUserId === inviter.id && previous.leftAt) {
        await prisma.radarReferralJoin.update({ where: { id: previous.id }, data: { leftAt: null } });
      } else {
        return { processed: true, event: "join", counted: false, reason: "Already counted" };
      }

      const unlocked = await radarReferralService.unlockIfReady(inviter.id);
      return { processed: true, event: "join", counted: true, unlocked };
    } catch (error) {
      logger.error({ err: error }, "Failed to process channel member update");
      return { processed: false, reason: "Internal error" };
    }
  }
};
