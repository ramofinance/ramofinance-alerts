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

// Creates a personal invite link for a channel. The bot must be an admin of the channel with the "Add Subscribers" right.
export const createTelegramChatInviteLink = async (
  chatId: number | string,
  name: string
): Promise<string | null> => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn("Telegram bot token is not configured");
    return null;
  }

  const response = await fetch(telegramApiUrl("createChatInviteLink"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      name: name.slice(0, 32)
    })
  });

  const body = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: { invite_link?: string }; description?: string }
    | null;

  if (!response.ok || !body?.ok || !body.result?.invite_link) {
    logger.error(
      {
        status: response.status,
        description: body?.description
      },
      "Failed to create Telegram invite link"
    );
    return null;
  }

  return body.result.invite_link;
};
