import { PreferredLanguage } from "@prisma/client";
import { userService } from "../modules/users/user.service";
import { sendTelegramMessage } from "./telegram-api";
import { handleTelegramCallbackQuery } from "./telegram-callback-handler";
import { telegramText } from "./telegram.i18n";
import {
  buildLanguageReplyMarkup,
  buildRadarReplyMarkup,
  buildStartReplyMarkup
} from "./telegram-markup";
import type { TelegramUpdate } from "./telegram.types";
import { upsertTelegramUserContext } from "./telegram-user-context";
import { handleAdminTextCommand } from "./telegram-admin-access";
import { radarAccessService } from "../modules/radar/radar-access.service";
import { radarService } from "../modules/radar/radar.service";

export const telegramService = {
  async processUpdate(update: TelegramUpdate) {
    const callbackQuery = update.callback_query;

    if (callbackQuery?.from) {
      return handleTelegramCallbackQuery(callbackQuery);
    }

    const message = update.message;

    if (!message?.from) {
      return {
        processed: false,
        reason: "Unsupported Telegram update"
      };
    }

    const telegramUser = message.from;

    const { user, language } = await upsertTelegramUserContext(
      telegramUser
    );

    if (message.text?.startsWith("/start")) {
      await userService.recordBotStart(
        String(telegramUser.id),
        user.firstBotStartedAt
      );

      const inviteToken = message.text.match(/^\/start(?:@\w+)?\s+radar_([A-Za-z0-9_-]+)$/)?.[1];
      if (inviteToken) {
        const granted = await radarAccessService.redeemInvite(inviteToken, user.id);
        const inviteMessage = granted
          ? "✅ Radar access has been activated for your account.\n\nدسترسی رادار برای حساب شما فعال شد."
          : "⚠️ This invitation link is invalid, expired, or already used.\n\nاین لینک دعوت نامعتبر، منقضی یا قبلاً استفاده شده است.";
        const sendResult = await sendTelegramMessage(
          message.chat.id,
          inviteMessage,
          granted ? buildRadarReplyMarkup() : buildStartReplyMarkup(language)
        );
        return { processed: true, command: "radar_invite", language, user, sendResult };
      }

      const sendResult = await sendTelegramMessage(
        message.chat.id,
        telegramText.startMessage(language),
        buildStartReplyMarkup(language)
      );

      return {
        processed: true,
        command: "start",
        language,
        user,
        sendResult
      };
    }

    if (message.text) {
      const adminResult = await handleAdminTextCommand(
        message.text,
        message.chat.id,
        user
      );
      if (adminResult) {
        return { processed: true, command: "admin", language, user, sendResult: adminResult };
      }
    }

    if (message.text?.match(/^\/radar(?:@\w+)?(?:\s|$)/i)) {
      const status = radarService.status(user);
      const account = user.username ? `@${user.username}` : String(telegramUser.id);
      const sendResult = await sendTelegramMessage(
        message.chat.id,
        status.enabled
          ? `✅ Radar access is active for <b>${account}</b>.\n\nدسترسی رادار برای این حساب فعال است. از دکمه زیر مستقیماً وارد شو.`
          : `⛔️ Radar access is not active for <b>${account}</b>.\n\nدسترسی رادار برای این حساب فعال نیست. لینک دعوت باید با همین حساب باز شود.`,
        status.enabled ? buildRadarReplyMarkup() : undefined
      );
      return { processed: true, command: "radar", language, user, sendResult };
    }

    if (message.text?.startsWith("/language")) {
      const sendResult = await sendTelegramMessage(
        message.chat.id,
        telegramText.languageMenuMessage(language),
        buildLanguageReplyMarkup()
      );

      return {
        processed: true,
        command: "language",
        language,
        user,
        sendResult
      };
    }

    const languageCommands: Partial<Record<string, PreferredLanguage>> = {
      "/fa": PreferredLanguage.FA,
      "/en": PreferredLanguage.EN,
      "/ar": PreferredLanguage.AR,
      "/es": PreferredLanguage.ES,
      "/zh": PreferredLanguage.ZH
    };
    const commandLanguage = message.text ? languageCommands[message.text] : undefined;

    if (commandLanguage) {
      const preferredLanguage = commandLanguage;

      const updatedUser = await userService.setUserPreferredLanguage(
        user.id,
        preferredLanguage
      );

      const sendResult = await sendTelegramMessage(
        message.chat.id,
        telegramText.languageChangedMessage(preferredLanguage)
      );

      return {
        processed: true,
        command: "set_language",
        language: preferredLanguage,
        user: updatedUser,
        sendResult
      };
    }

    const sendResult = await sendTelegramMessage(
      message.chat.id,
      telegramText.fallbackMessage(language)
    );

    return {
      processed: true,
      language,
      user,
      sendResult
    };
  }
};
