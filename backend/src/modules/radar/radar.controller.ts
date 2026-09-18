import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { radarService, runRadarScan } from "./radar.service";

const settingsSchema = z.object({ enabled: z.boolean(), minimumScore: z.number().int().min(60).max(95) });

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
    const user = await radarService.updateSettings(res.locals.authUser.id, parsed.data.enabled, parsed.data.minimumScore);
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
