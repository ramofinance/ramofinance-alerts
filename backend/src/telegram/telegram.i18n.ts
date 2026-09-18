import { PreferredLanguage } from "@prisma/client";

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export const resolveTelegramLanguage = (
  preferredLanguage?: PreferredLanguage | null,
  telegramLanguageCode?: string
): PreferredLanguage => {
  if (preferredLanguage) {
    return preferredLanguage;
  }

  if (telegramLanguageCode?.toLowerCase().startsWith("fa")) {
    return PreferredLanguage.FA;
  }

  return PreferredLanguage.EN;
};

export const telegramText = {
  startMessage(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return [
        "سلام 👋",
        "به <b>RAMO FINANCE</b> خوش اومدی.",
        "",
        "یکی از خدمات زیر را انتخاب کن:",
        "📊 CryptoFlow برای تحلیل جریان بازار",
        "🔔 Price Alerts برای ساخت هشدار قیمت",
        "",
        "زبان فعلی: فارسی",
        "برای تغییر زبان بنویس: /language"
      ].join("\n");
    }

    return [
      "Welcome to <b>RAMO FINANCE</b> 👋",
      "",
      "Choose a service:",
      "📊 CryptoFlow for market-flow intelligence",
      "🔔 Price Alerts for Telegram price notifications",
      "",
      "Current language: English",
      "To change language, send: /language"
    ].join("\n");
  },

  languageMenuMessage(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "زبان موردنظرت رو انتخاب کن:";
    }

    return "Choose your preferred language:";
  },

  languageChangedMessage(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "زبان با موفقیت روی فارسی تنظیم شد ✅";
    }

    return "Language changed to English successfully ✅";
  },

  fallbackMessage(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "پیامت دریافت شد. برای شروع از /start استفاده کن یا برای تغییر زبان /language رو بزن.";
    }

    return "Message received. Use /start to get started or /language to change language.";
  },

  openCryptoFlowButton(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "📊 کریپتوفلو";
    }

    return "📊 Open CryptoFlow";
  },

  openAlertsButton(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "🔔 هشدار قیمت";
    }

    return "🔔 Price Alerts";
  },

  alertTriggeredMessage(
    language: PreferredLanguage,
    input: {
      symbol: string;
      direction: string;
      targetPrice: string;
      currentPrice: number;
      title?: string | null;
    }
  ) {
    const symbol = escapeHtml(input.symbol);
    const title = escapeHtml(input.title ?? (language === PreferredLanguage.FA ? "بدون عنوان" : "Untitled"));

    if (language === PreferredLanguage.FA) {
      return [
        "🚨 هشدار فعال شد",
        "",
        `بازار: <b>${symbol}</b>`,
        `عنوان: ${title}`,
        `شرط: ${input.direction} ${input.targetPrice}`,
        `قیمت فعلی: ${input.currentPrice}`
      ].join("\n");
    }

    return [
      "🚨 Alert triggered",
      "",
      `Market: <b>${symbol}</b>`,
      `Title: ${title}`,
      `Condition: ${input.direction} ${input.targetPrice}`,
      `Current price: ${input.currentPrice}`
    ].join("\n");
  }
};
