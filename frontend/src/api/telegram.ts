import { apiGet, apiPost } from "./http-client";
import type { MiniAppStats, TelegramMe } from "../types/api";

export const getTelegramMe = (initData: string) => {
  return apiGet<TelegramMe>("/api/telegram/me", {
    headers: {
      "X-Telegram-Init-Data": initData
    }
  });
};


export const sendTelegramActivity = (initData: string) => {
  return apiPost<void, Record<string, never>>(
    "/api/telegram/activity",
    {},
    {
      headers: {
        "X-Telegram-Init-Data": initData
      }
    }
  );
};

export const getTelegramAdminStats = (initData: string) => {
  return apiGet<MiniAppStats>("/api/telegram/admin/stats", {
    headers: {
      "X-Telegram-Init-Data": initData
    }
  });
};
