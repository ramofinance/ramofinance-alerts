import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { radarService, runRadarScan } from "./radar.service";

const zeroable = (max = 10_000_000_000_000) => z.number().min(0).max(max);

const settingsSchema = z.object({
  enabled: z.boolean(),
  minimumScore: z.number().int().min(60).max(95),
  minMarketCap: zeroable(),
  maxMarketCap: zeroable().nullable(),
  minTurnoverPercent: z.number().min(0).max(1000),
  minVolumeAcceleration: z.number().min(0).max(1000),
  minPriceChange24h: z.number().min(-100).max(10000),
  minTradeCount24h: z.number().int().min(0).max(2_000_000_000),
  minTurnover72hPercent: z.number().min(0).max(5000),
  minBuyImbalancePercent: z.number().min(0).max(100),
  minWhaleBuyVolumeUsd: zeroable(),
  minBidWallImbalancePercent: z.number().min(0).max(100),
  minOpenInterestChangePercent: z.number().min(0).max(10000),
  minDexTurnoverPercent: z.number().min(0).max(5000),
  minDexLiquidityUsd: zeroable(),
  minDexBuyImbalancePercent: z.number().min(0).max(100),
  minShortLiquidationUsd: zeroable(),
  maxFundingRatePercent: z.number().min(0).max(100),
  minOnchainWhaleUsd: zeroable(),
  minExchangeOutflowUsd: zeroable(),
  minCexConfirmations: z.number().int().min(0).max(3),
  minChannelConfirmations: z.number().int().min(0).max(10)
}).superRefine((value, ctx) => {
  if (value.maxMarketCap !== null && value.maxMarketCap > 0 && value.maxMarketCap < value.minMarketCap) {
    ctx.addIssue({ code: "custom", path: ["maxMarketCap"], message: "Maximum market cap must be 0 (no limit) or greater than/equal to minimum market cap" });
  }
});

const assertAvailable = (user: { role: UserRole; radarPreviewAccess: boolean }) => {
  const status = radarService.status(user);
  if (!status.enabled) throw new AppError("Radar is not available", 404);
  return status;
};

export const radarStatusController: RequestHandler = async (_req, res, next) => {
  try { res.json({ success: true, data: radarService.status(res.locals.authUser) }); } catch (error) { next(error); }
};

export const radarSignalsController: RequestHandler = async (req, res, next) => {
  try {
    assertAvailable(res.locals.authUser);
    const items = await radarService.listSignals(Number(req.query.limit) || 20);
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const radarSettingsController: RequestHandler = async (req, res, next) => {
  try {
    assertAvailable(res.locals.authUser);
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? "Invalid settings", 400);
    const user = await radarService.updateSettings(res.locals.authUser.id, parsed.data);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const radarTestController: RequestHandler = async (_req, res, next) => {
  try {
    assertAvailable(res.locals.authUser);
    const result = await radarService.sendTest(res.locals.authUser.id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const radarScanController: RequestHandler = async (_req, res, next) => {
  try { res.json({ success: true, data: await runRadarScan() }); } catch (error) { next(error); }
};
