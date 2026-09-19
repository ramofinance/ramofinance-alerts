import type { PreferredLanguage } from "@prisma/client";
import { env } from "../config/env";
import { telegramText } from "./telegram.i18n";

const WEBAPP_VERSION = "3.3.0";

const buildWebAppUrl = (service?: "radar") => {
  if (!env.TELEGRAM_WEBAPP_URL) return undefined;

  const url = new URL(env.TELEGRAM_WEBAPP_URL);
  url.searchParams.set("v", WEBAPP_VERSION);

  if (service) {
    url.searchParams.set("service", service);
  } else {
    url.searchParams.delete("service");
  }

  return url.toString();
};

export const buildStartReplyMarkup = (language: PreferredLanguage) => {
  const url = buildWebAppUrl();
  if (!url) return undefined;

  return {
    inline_keyboard: [[{
      text: telegramText.openHubButton(language),
      web_app: { url }
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
  const url = buildWebAppUrl("radar");
  if (!url) return undefined;

  return {
    inline_keyboard: [[{
      text: "🔎 Open Radar | باز کردن رادار",
      web_app: { url }
    }]]
  };
};
