import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { radarService, runRadarScan } from "./radar.service";

const zeroable = (max = 10_000_000_000_000) => z.number().min(0).max(max);

const settingsSchema = z.object({
  enabled: z.boolean(),
  minimumScore: z.number().int().min(60).max(95),
  includeLowCap: z.boolean(),
  includeMidCap: z.boolean(),
  includeHighCap: z.boolean(),
  includeDex: z.boolean(),
  includeCex: z.boolean(),
  minTurnoverPercent: z.number().min(0).max(1000),
  minPriceChange24h: z.number().min(-100).max(10000),
  minTradeCount24h: z.number().int().min(0).max(2_000_000_000),
  minDexUniqueBuyers24h: z.number().int().min(0).max(100_000_000),
  minBuyImbalancePercent: z.number().min(0).max(100),
  minDexLiquidityUsd: zeroable(),
  minDexVolumeUsd: zeroable(),
  minShortLiquidationUsd: zeroable(),
  minShortSqueezeDepth: z.number().int().min(0).max(100)
}).superRefine((value, ctx) => {
  if (!value.includeLowCap && !value.includeMidCap && !value.includeHighCap) {
    ctx.addIssue({ code: "custom", path: ["includeLowCap"], message: "Select at least one market-cap range" });
  }
  if (!value.includeDex && !value.includeCex) {
    ctx.addIssue({ code: "custom", path: ["includeDex"], message: "Enable at least one market source (DEX or CEX)" });
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
