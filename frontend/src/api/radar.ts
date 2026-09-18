import { apiGet, apiPatch, apiPost } from "./http-client";
import type { RadarSignal, RadarStatus, User } from "../types/api";

export const getRadarStatus = () => apiGet<RadarStatus>("/api/radar/status");
export const getRadarSignals = () => apiGet<RadarSignal[]>("/api/radar/signals?limit=20");
export const updateRadarSettings = (enabled: boolean, minimumScore: number) =>
  apiPatch<User, { enabled: boolean; minimumScore: number }>("/api/radar/settings", { enabled, minimumScore });
export const sendRadarTestNotification = () => apiPost<{ sent: boolean }, Record<string, never>>("/api/radar/test-notification", {});
export const runRadarScan = () => apiPost<{ created: number; candidates: number }, Record<string, never>>("/api/radar/scan", {});
