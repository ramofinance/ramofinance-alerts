import { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { userService } from "../modules/users/user.service";
import { logger } from "../utils/logger";
import { resolveTelegramLanguage, telegramText } from "./telegram.i18n";
import type { TelegramUpdate } from "./telegram.types";

const telegramApiUrl = (method: string) => {
  return `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
};

export const sendTelegramMessage = async (
  chatId: number | string,
  text: string,
  replyMarkup?: object
) => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn("Telegram bot token is not configured");

    return {
      sent: false,
      reason: "TELEGRAM_BOT_TOKEN is not configured"
    };
  }

  const response = await fetch(telegramApiUrl("sendMessage"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    logger.error(
      {
        status: response.status,
        errorText
      },
      "Failed to send Telegram message"
    );

    return {
      sent: false,
      reason: errorText
    };
  }

  return {
    sent: true
  };
};

const answerTelegramCallbackQuery = async (
  callbackQueryId: string,
  text?: string
) => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return {
      sent: false,
      reason: "TELEGRAM_BOT_TOKEN is not configured"
    };
  }

  const response = await fetch(telegramApiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    logger.error(
      {
        status: response.status,
        errorText
      },
      "Failed to answer Telegram callback query"
    );

    return {
      sent: false,
      reason: errorText
    };
  }

  return {
    sent: true
  };
};

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
