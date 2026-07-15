import type { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { telegramText } from "./telegram.i18n";

export const buildStartReplyMarkup = (language: PreferredLanguage) => {
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

export const buildLanguageReplyMarkup = () => {
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
