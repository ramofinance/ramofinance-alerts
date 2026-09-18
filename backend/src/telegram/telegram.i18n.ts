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
  if (preferredLanguage) return preferredLanguage;
  const code = telegramLanguageCode?.toLowerCase() ?? "";
  if (code.startsWith("fa")) return PreferredLanguage.FA;
  if (code.startsWith("ar")) return PreferredLanguage.AR;
  if (code.startsWith("es")) return PreferredLanguage.ES;
  if (code.startsWith("zh")) return PreferredLanguage.ZH;
  return PreferredLanguage.EN;
};

const copy = {
  FA: {
    start: ["سلام 👋", "به <b>RAMO Finance</b> خوش آمدی.", "", "از داخل مینی‌اپ، سرویس موردنظرت را انتخاب کن:", "📊 CryptoFlow برای تحلیل جریان بازار", "🔔 هشدار قیمت برای دریافت اعلان تلگرام", "", "برای تغییر زبان: /language"].join("\n"),
    choose: "زبان موردنظرت را انتخاب کن:", changed: "زبان با موفقیت روی فارسی تنظیم شد ✅",
    fallback: "پیامت دریافت شد. برای شروع /start و برای تغییر زبان /language را بزن.", open: "باز کردن RAMO Finance",
    triggered: "🚨 هشدار فعال شد", market: "بازار", title: "عنوان", condition: "شرط", current: "قیمت فعلی", untitled: "بدون عنوان"
  },
  EN: {
    start: ["Welcome to <b>RAMO Finance</b> 👋", "", "Open the Mini App and choose a service:", "📊 CryptoFlow for market-flow intelligence", "🔔 Price Alerts for Telegram notifications", "", "Change language: /language"].join("\n"),
    choose: "Choose your preferred language:", changed: "Language changed to English ✅",
    fallback: "Message received. Use /start to begin or /language to change language.", open: "Open RAMO Finance",
    triggered: "🚨 Alert triggered", market: "Market", title: "Title", condition: "Condition", current: "Current price", untitled: "Untitled"
  },
  AR: {
    start: ["مرحباً بك في <b>RAMO Finance</b> 👋", "", "افتح التطبيق المصغر واختر الخدمة:", "📊 CryptoFlow لتحليل تدفق السوق", "🔔 تنبيهات الأسعار عبر تيليجرام", "", "لتغيير اللغة: /language"].join("\n"),
    choose: "اختر لغتك المفضلة:", changed: "تم تغيير اللغة إلى العربية ✅",
    fallback: "تم استلام رسالتك. استخدم /start للبدء أو /language لتغيير اللغة.", open: "فتح RAMO Finance",
    triggered: "🚨 تم تفعيل التنبيه", market: "السوق", title: "العنوان", condition: "الشرط", current: "السعر الحالي", untitled: "بدون عنوان"
  },
  ES: {
    start: ["Te damos la bienvenida a <b>RAMO Finance</b> 👋", "", "Abre la Mini App y elige un servicio:", "📊 CryptoFlow para analizar el flujo del mercado", "🔔 Alertas de precios por Telegram", "", "Cambiar idioma: /language"].join("\n"),
    choose: "Elige tu idioma:", changed: "Idioma cambiado a español ✅",
    fallback: "Mensaje recibido. Usa /start para comenzar o /language para cambiar el idioma.", open: "Abrir RAMO Finance",
    triggered: "🚨 Alerta activada", market: "Mercado", title: "Título", condition: "Condición", current: "Precio actual", untitled: "Sin título"
  },
  ZH: {
    start: ["欢迎使用 <b>RAMO Finance</b> 👋", "", "打开小程序并选择服务：", "📊 CryptoFlow 市场资金流分析", "🔔 Telegram 价格提醒", "", "更改语言：/language"].join("\n"),
    choose: "选择你的语言：", changed: "语言已切换为简体中文 ✅",
    fallback: "已收到消息。使用 /start 开始，或使用 /language 更改语言。", open: "打开 RAMO Finance",
    triggered: "🚨 提醒已触发", market: "市场", title: "标题", condition: "条件", current: "当前价格", untitled: "无标题"
  }
} satisfies Record<PreferredLanguage, Record<string, string>>;

const t = (language: PreferredLanguage) => copy[language];

export const telegramText = {
  startMessage: (language: PreferredLanguage) => t(language).start,
  languageMenuMessage: (language: PreferredLanguage) => t(language).choose,
  languageChangedMessage: (language: PreferredLanguage) => t(language).changed,
  fallbackMessage: (language: PreferredLanguage) => t(language).fallback,
  openHubButton: (language: PreferredLanguage) => t(language).open,
  alertTriggeredMessage(
    language: PreferredLanguage,
    input: { symbol: string; direction: string; targetPrice: string; currentPrice: number; title?: string | null }
  ) {
    const value = t(language);
    const symbol = escapeHtml(input.symbol);
    const title = escapeHtml(input.title ?? value.untitled);
    return [
      value.triggered, "", `${value.market}: <b>${symbol}</b>`, `${value.title}: ${title}`,
      `${value.condition}: ${input.direction} ${input.targetPrice}`, `${value.current}: ${input.currentPrice}`
    ].join("\n");
  }
};
