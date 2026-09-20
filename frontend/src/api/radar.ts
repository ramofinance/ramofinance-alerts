import { apiGet, apiPatch, apiPost } from "./http-client";
import type { RadarSignal, RadarStatus, User } from "../types/api";

const telegramOptions = (initData?: string) => initData
  ? { headers: { "X-Telegram-Init-Data": initData } }
  : undefined;

export const getRadarStatus = (initData?: string) =>
  apiGet<RadarStatus>("/api/radar/status", telegramOptions(initData));

export const getRadarSignals = (initData?: string) =>
  apiGet<RadarSignal[]>("/api/radar/signals?limit=20", telegramOptions(initData));

export type RadarSettingsInput = {
  enabled: boolean;
  minimumScore: number;
  includeLowCap: boolean;
  includeMidCap: boolean;
  includeHighCap: boolean;
  includeDex: boolean;
  includeCex: boolean;
  minTurnoverPercent: number;
  minPriceChange24h: number;
  minTradeCount24h: number;
  minDexUniqueBuyers24h: number;
  minBuyImbalancePercent: number;
  minDexLiquidityUsd: number;
  minDexVolumeUsd: number;
  minShortLiquidationUsd: number;
  minShortSqueezeDepth: number;
};

export const updateRadarSettings = (settings: RadarSettingsInput, initData?: string) =>
  apiPatch<User, RadarSettingsInput>(
    "/api/radar/settings",
    settings,
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
