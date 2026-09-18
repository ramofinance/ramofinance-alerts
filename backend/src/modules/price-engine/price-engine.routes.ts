import { Router } from "express";
import {
  getPriceHistoryController,
  processPriceUpdateController
} from "./price-engine.controller";
import { requireAdmin, requireTelegramAuth } from "../../middleware/telegram-auth";

export const priceEngineRoutes = Router();

priceEngineRoutes.get("/api/prices/:symbol/history", getPriceHistoryController);
priceEngineRoutes.post(
  "/api/prices/update",
  requireTelegramAuth,
  requireAdmin,
  processPriceUpdateController
);
