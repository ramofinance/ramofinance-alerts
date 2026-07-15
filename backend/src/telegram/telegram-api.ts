import { env } from "../config/env";
import { logger } from "../utils/logger";

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

export const answerTelegramCallbackQuery = async (
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
