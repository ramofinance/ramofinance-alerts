import { apiGet } from "./http-client";
import type { TelegramMe } from "../types/api";

export const getTelegramMe = (initData: string) => {
  return apiGet<TelegramMe>("/api/telegram/me", {
    headers: {
      "X-Telegram-Init-Data": initData
    }
  });
};
