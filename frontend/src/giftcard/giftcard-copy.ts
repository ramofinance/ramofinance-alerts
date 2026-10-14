import type { PreferredLanguage } from "../types/api";

const en = {
  cardTitle: "Gift Cards",
  cardDescription: "Send a crypto gift card on Telegram to someone you love ❤️"
};

const fa: typeof en = {
  cardTitle: "کارت هدیه",
  cardDescription: "یک کارت هدیه کریپتو در تلگرام بفرست برای کسی که دوستش داری❤️"
};

const ar: typeof en = {
  cardTitle: "بطاقات الهدايا",
  cardDescription: "أرسل بطاقة هدية بالعملات الرقمية عبر تيليجرام لمن تحب ❤️"
};

const es: typeof en = {
  cardTitle: "Tarjetas de regalo",
  cardDescription: "Envía una tarjeta de regalo cripto por Telegram a alguien que quieras ❤️"
};

const zh: typeof en = {
  cardTitle: "礼品卡",
  cardDescription: "通过 Telegram 给你爱的人发送一张加密礼品卡 ❤️"
};

export type GiftCardCopy = typeof en;

export const getGiftCardCopy = (language: PreferredLanguage | null): GiftCardCopy => {
  if (language === "FA") return fa;
  if (language === "AR") return ar;
  if (language === "ES") return es;
  if (language === "ZH") return zh;
  return en;
};
