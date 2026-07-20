import type { RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { userService } from "../modules/users/user.service";
import { verifyTelegramMiniAppInitData } from "./telegram-mini-app-auth";
import { resolveTelegramLanguage } from "./telegram.i18n";
import { telegramService } from "./telegram.service";
import type { TelegramUpdate } from "./telegram.types";

export const telegramWebhookController: RequestHandler = async (req, res, next) => {
  try {
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const secretToken = req.header("x-telegram-bot-api-secret-token");

      if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
        throw new AppError("Invalid Telegram webhook secret", 401);
      }
    }

    const result = await telegramService.processUpdate(req.body as TelegramUpdate);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const telegramStatusController: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    data: {
      appName: "RAMOFINANCE Alerts",
      botUsername: env.TELEGRAM_BOT_USERNAME,
      hasBotToken: Boolean(env.TELEGRAM_BOT_TOKEN),
      hasWebAppUrl: Boolean(env.TELEGRAM_WEBAPP_URL),
      hasWebhookSecret: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
      supportedLanguages: ["FA", "EN"],
      defaultFallbackLanguage: "EN",
      persianAutoDetect: true,
      userCanChangeLanguage: true
    }
  });
};


export const telegramMeController: RequestHandler = async (req, res, next) => {
  try {
    const initDataHeader = req.header("x-telegram-init-data") ?? "";
    const initData = verifyTelegramMiniAppInitData(initDataHeader);

    if (!initData.user?.id) {
      throw new AppError("Telegram user is required", 401);
    }

    const telegramUser = initData.user;

    const user = await userService.recordMiniAppOpen({
      telegramId: String(telegramUser.id),
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code
    });

    const language = resolveTelegramLanguage(
      user.preferredLanguage,
      telegramUser.language_code
    );

    res.json({
      success: true,
      data: {
        user,
        language,
        authDate: initData.authDate
      }
    });
  } catch (error) {
    next(error);
  }
};


export const telegramActivityController: RequestHandler = async (req, res, next) => {
  try {
    const initDataHeader = req.header("x-telegram-init-data") ?? "";
    const initData = verifyTelegramMiniAppInitData(initDataHeader);

    if (!initData.user?.id) {
      throw new AppError("Telegram user is required", 401);
    }

    await userService.touchMiniAppActivity(String(initData.user.id));

    res.json({
      success: true
    });
  } catch (error) {
    next(error);
  }
};

export const telegramAdminStatsController: RequestHandler = async (req, res, next) => {
  try {
    const initDataHeader = req.header("x-telegram-init-data") ?? "";
    const initData = verifyTelegramMiniAppInitData(initDataHeader);

    if (!initData.user?.id) {
      throw new AppError("Telegram user is required", 401);
    }

    const user = await userService.getUserByTelegramId(String(initData.user.id));

    if (user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403);
    }

    const stats = await userService.getMiniAppStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
