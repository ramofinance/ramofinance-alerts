import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import type { TelegramUser } from "./telegram.types";

export type TelegramMiniAppInitData = {
  user?: TelegramUser;
  authDate?: number;
};

const safeCompareHex = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyTelegramMiniAppInitData = (
  initData: string
): TelegramMiniAppInitData => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new AppError("Telegram bot token is not configured", 500);
  }

  if (!initData) {
    throw new AppError("Telegram init data is required", 401);
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new AppError("Telegram init data hash is required", 401);
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(env.TELEGRAM_BOT_TOKEN)
    .digest();

  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeCompareHex(calculatedHash, hash)) {
    throw new AppError("Invalid Telegram init data", 401);
  }

  const userRaw = params.get("user");
  const authDateRaw = params.get("auth_date");

  return {
    user: userRaw ? (JSON.parse(userRaw) as TelegramUser) : undefined,
    authDate: authDateRaw ? Number(authDateRaw) : undefined
  };
};
