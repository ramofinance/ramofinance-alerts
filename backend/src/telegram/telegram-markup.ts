import type { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { telegramText } from "./telegram.i18n";

export const buildStartReplyMarkup = (language: PreferredLanguage) => {
  if (!env.TELEGRAM_WEBAPP_URL) return undefined;
  return {
    inline_keyboard: [[{
      text: telegramText.openHubButton(language),
      web_app: { url: env.TELEGRAM_WEBAPP_URL }
    }]]
  };
};

export const buildLanguageReplyMarkup = () => ({
  inline_keyboard: [
    [
      { text: "فارسی 🇮🇷", callback_data: "language:FA" },
      { text: "English 🇬🇧", callback_data: "language:EN" }
    ],
    [
      { text: "العربية", callback_data: "language:AR" },
      { text: "Español", callback_data: "language:ES" }
    ],
    [{ text: "简体中文", callback_data: "language:ZH" }]
  ]
});

export const buildRadarReplyMarkup = () => {
  if (!env.TELEGRAM_WEBAPP_URL) return undefined;
  const url = new URL(env.TELEGRAM_WEBAPP_URL);
  url.searchParams.set("service", "radar");
  url.searchParams.set("v", "3.2.2");

  return {
    inline_keyboard: [[{
      text: "🔎 Open Radar | باز کردن رادار",
      web_app: { url: url.toString() }
    }]]
  };
};
