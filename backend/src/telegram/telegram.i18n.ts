import { PreferredLanguage } from "@prisma/client";

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
        "به <b>RAMOFINANCE Alerts</b> خوش اومدی.",
        "",
        "اینجا می‌تونی برای بازارهای مالی هشدار قیمت بسازی و وضعیتشون رو realtime ببینی.",
        "",
        "زبان فعلی: فارسی",
        "برای تغییر زبان بنویس: /language"
      ].join("\n");
    }

    return [
      "Welcome to <b>RAMOFINANCE Alerts</b> 👋",
      "",
      "Create realtime alerts for financial markets and track them live.",
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

  openAppButton(language: PreferredLanguage) {
    if (language === PreferredLanguage.FA) {
      return "باز کردن RAMOFINANCE Alerts";
    }

    return "Open RAMOFINANCE Alerts";
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
    if (language === PreferredLanguage.FA) {
      return [
        "🚨 هشدار فعال شد",
        "",
        `بازار: <b>${input.symbol}</b>`,
        `عنوان: ${input.title ?? "بدون عنوان"}`,
        `شرط: ${input.direction} ${input.targetPrice}`,
        `قیمت فعلی: ${input.currentPrice}`
      ].join("\n");
    }

    return [
      "🚨 Alert triggered",
      "",
      `Market: <b>${input.symbol}</b>`,
      `Title: ${input.title ?? "Untitled"}`,
      `Condition: ${input.direction} ${input.targetPrice}`,
      `Current price: ${input.currentPrice}`
    ].join("\n");
  }
};
