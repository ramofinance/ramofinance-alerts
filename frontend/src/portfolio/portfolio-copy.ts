import type { PreferredLanguage } from "../types/api";

const en = {
  cardTitle: "Portfolio",
  cardDescription: "All your wallets in one place. View-only, free.",
  title: "Portfolio",
  total: "Total balance",
  h24: "24h",
  byWallet: "By wallet",
  byNetwork: "By network",
  other: "Other",
  refresh: "Refresh",
  refreshing: "Refreshing…",
  updated: "Updated",
  sample: "Preview with sample numbers. Live balances are coming soon.",
  addTitle: "Add a wallet",
  addressPlaceholder: "Paste a wallet address",
  labelPlaceholder: "Name (optional)",
  add: "Add",
  remove: "Remove wallet",
  invalid: "This isn't a supported wallet address.",
  duplicate: "This wallet is already in your list.",
  limit: "You can track up to 20 wallets.",
  emptyTitle: "No wallets yet",
  emptyText: "Add a wallet address to see its balance. One EVM address covers all 10 EVM networks.",
  supported: "Supported networks",
  assets: "assets",
  soon: "Not available for this network yet",
  unavailable: "Couldn't load this wallet. Try Refresh.",
  refreshFailed: "Couldn't refresh. Showing your last saved data.",
  sessionExpired: "Your Telegram session expired. Close the Mini App completely and open it again.",
  privacy: "View-only. Your wallet list is kept in your Telegram account, not on our servers.",
  seedWarning: "Never enter a seed phrase or private key."
};

const fa: typeof en = {
  cardTitle: "پورتفولیو",
  cardDescription: "همه‌ی کیف‌پول‌هایتان یکجا. فقط مشاهده، رایگان.",
  title: "پورتفولیو",
  total: "مجموع دارایی",
  h24: "۲۴ ساعت",
  byWallet: "به تفکیک کیف‌پول",
  byNetwork: "به تفکیک شبکه",
  other: "سایر",
  refresh: "به‌روزرسانی",
  refreshing: "در حال به‌روزرسانی…",
  updated: "آخرین به‌روزرسانی",
  sample: "پیش‌نمایش با اعداد نمونه. موجودی زنده به‌زودی اضافه می‌شود.",
  addTitle: "افزودن کیف‌پول",
  addressPlaceholder: "آدرس کیف‌پول را بچسبانید",
  labelPlaceholder: "نام (اختیاری)",
  add: "افزودن",
  remove: "حذف کیف‌پول",
  invalid: "این آدرس معتبر یا پشتیبانی‌شده نیست.",
  duplicate: "این کیف‌پول قبلاً در لیست هست.",
  limit: "حداکثر ۲۰ کیف‌پول می‌توانید ردیابی کنید.",
  emptyTitle: "هنوز کیف‌پولی اضافه نشده",
  emptyText: "برای دیدن موجودی، آدرس یک کیف‌پول اضافه کنید. یک آدرس EVM هر ۱۰ شبکه‌ی EVM را پوشش می‌دهد.",
  supported: "شبکه‌های پشتیبانی‌شده",
  assets: "دارایی",
  soon: "برای این شبکه هنوز در دسترس نیست",
  unavailable: "بارگذاری این کیف‌پول ممکن نشد. دوباره به‌روزرسانی کنید.",
  refreshFailed: "به‌روزرسانی انجام نشد. آخرین داده‌ی ذخیره‌شده نمایش داده می‌شود.",
  sessionExpired: "نشست تلگرام منقضی شده. مینی‌اپ را کامل ببندید و دوباره باز کنید.",
  privacy: "فقط مشاهده. لیست کیف‌پول‌ها در حساب تلگرام خودتان می‌ماند و روی سرورهای ما ذخیره نمی‌شود.",
  seedWarning: "هرگز seed phrase یا کلید خصوصی وارد نکنید."
};

export type PortfolioCopy = typeof en;

// Languages without a translation yet (AR, ES, ZH) fall back to English.
export const getPortfolioCopy = (language: PreferredLanguage | null): PortfolioCopy =>
  language === "FA" ? fa : en;
