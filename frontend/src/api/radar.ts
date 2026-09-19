import { apiGet, apiPatch, apiPost } from "./http-client";
import type { RadarSignal, RadarStatus, User } from "../types/api";

const telegramOptions = (initData?: string) => initData
  ? { headers: { "X-Telegram-Init-Data": initData } }
  : undefined;

export const getRadarStatus = (initData?: string) =>
  apiGet<RadarStatus>("/api/radar/status", telegramOptions(initData));

export const getRadarSignals = (initData?: string) =>
  apiGet<RadarSignal[]>("/api/radar/signals?limit=20", telegramOptions(initData));

export const updateRadarSettings = (enabled: boolean, minimumScore: number, initData?: string) =>
  apiPatch<User, { enabled: boolean; minimumScore: number }>(
    "/api/radar/settings",
    { enabled, minimumScore },
    telegramOptions(initData)
  );

export const sendRadarTestNotification = (initData?: string) =>
  apiPost<{ sent: boolean }, Record<string, never>>(
    "/api/radar/test-notification",
    {},
    telegramOptions(initData)
  );

export const runRadarScan = (initData?: string) =>
  apiPost<{ created: number; candidates: number }, Record<string, never>>(
    "/api/radar/scan",
    {},
    telegramOptions(initData)
  );
