import { PreferredLanguage } from "@prisma/client";
import { userService } from "../modules/users/user.service";
import { sendTelegramMessage } from "./telegram-api";
import { handleTelegramCallbackQuery } from "./telegram-callback-handler";
import { telegramText } from "./telegram.i18n";
import {
  buildLanguageReplyMarkup,
  buildStartReplyMarkup
} from "./telegram-markup";
import type { TelegramUpdate } from "./telegram.types";
import { upsertTelegramUserContext } from "./telegram-user-context";

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

    if (message.text === "/fa" || message.text === "/en") {
      const preferredLanguage =
        message.text === "/fa" ? PreferredLanguage.FA : PreferredLanguage.EN;

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
