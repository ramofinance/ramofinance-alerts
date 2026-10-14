import type { PreferredLanguage } from "../types/api";

const notes: Record<string, string> = {
  FA: "شما به این سرویس دسترسی ندارید",
  AR: "ليس لديك صلاحية الوصول إلى هذه الخدمة",
  ES: "No tienes acceso a este servicio",
  ZH: "您没有访问此服务的权限"
};

export const getRadarLockedNote = (language: PreferredLanguage | null): string =>
  (language && notes[language]) || "You don't have access to this service";
