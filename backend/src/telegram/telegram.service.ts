import { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { userService } from "../modules/users/user.service";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage
} from "./telegram-api";
import { resolveTelegramLanguage, telegramText } from "./telegram.i18n";
import type { TelegramUpdate } from "./telegram.types";

const buildStartReplyMarkup = (language: PreferredLanguage) => {
  if (!env.TELEGRAM_WEBAPP_URL) {
    return undefined;
  }

  return {
    inline_keyboard: [
      [
        {
          text: telegramText.openAppButton(language),
          web_app: {
            url: env.TELEGRAM_WEBAPP_URL
          }
        }
      ]
    ]
  };
};

const buildLanguageReplyMarkup = () => {
  return {
    inline_keyboard: [
      [
        {
          text: "فارسی 🇮🇷",
          callback_data: "language:FA"
        },
        {
          text: "English 🇬🇧",
          callback_data: "language:EN"
        }
      ]
    ]
  };
};

export const telegramService = {
  async processUpdate(update: TelegramUpdate) {
    const callbackQuery = update.callback_query;

    if (callbackQuery?.from) {
      const telegramUser = callbackQuery.from;

      const user = await userService.upsertTelegramUser({
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

      if (callbackQuery.data === "language:FA" || callbackQuery.data === "language:EN") {
        const preferredLanguage =
          callbackQuery.data === "language:FA"
            ? PreferredLanguage.FA
            : PreferredLanguage.EN;

        const updatedUser = await userService.setUserPreferredLanguage(
          user.id,
          preferredLanguage
        );

        const callbackAnswerResult = await answerTelegramCallbackQuery(
          callbackQuery.id,
          telegramText.languageChangedMessage(preferredLanguage)
        );

        const sendResult = callbackQuery.message
          ? await sendTelegramMessage(
              callbackQuery.message.chat.id,
              telegramText.languageChangedMessage(preferredLanguage)
            )
          : {
              sent: false,
              reason: "Callback query message is not available"
            };

        return {
          processed: true,
          command: "set_language_callback",
          language: preferredLanguage,
          user: updatedUser,
          callbackAnswerResult,
          sendResult
        };
      }

      const callbackAnswerResult = await answerTelegramCallbackQuery(
        callbackQuery.id,
        telegramText.fallbackMessage(language)
      );

      return {
        processed: true,
        command: "unsupported_callback",
        language,
        user,
        callbackAnswerResult
      };
    }

    const message = update.message;

    if (!message?.from) {
      return {
        processed: false,
        reason: "Unsupported Telegram update"
      };
    }

    const telegramUser = message.from;

    const user = await userService.upsertTelegramUser({
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
