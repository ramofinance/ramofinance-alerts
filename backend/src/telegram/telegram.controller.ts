import type { RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
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
