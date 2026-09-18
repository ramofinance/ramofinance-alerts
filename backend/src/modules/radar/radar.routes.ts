import { Router } from "express";
import { requireAdmin, requireTelegramAuth } from "../../middleware/telegram-auth";
import { radarScanController, radarSettingsController, radarSignalsController, radarStatusController, radarTestController } from "./radar.controller";

export const radarRoutes = Router();
radarRoutes.use("/api/radar", requireTelegramAuth);
radarRoutes.get("/api/radar/status", radarStatusController);
radarRoutes.get("/api/radar/signals", radarSignalsController);
radarRoutes.patch("/api/radar/settings", radarSettingsController);
radarRoutes.post("/api/radar/test-notification", radarTestController);
radarRoutes.post("/api/radar/scan", requireAdmin, radarScanController);
