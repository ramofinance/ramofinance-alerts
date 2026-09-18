import type { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { telegramText } from "./telegram.i18n";

export const buildStartReplyMarkup = (language: PreferredLanguage) => {
  if (!env.TELEGRAM_WEBAPP_URL) {
    return undefined;
  }

  const alertsUrl = new URL(env.TELEGRAM_WEBAPP_URL);
  alertsUrl.searchParams.set("service", "alerts");

  return {
    inline_keyboard: [
      [
        {
          text: telegramText.openCryptoFlowButton(language),
          web_app: {
            url: env.CRYPTOFLOW_URL
          }
        }
      ],
      [
        {
          text: telegramText.openAlertsButton(language),
          web_app: {
            url: alertsUrl.toString()
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
