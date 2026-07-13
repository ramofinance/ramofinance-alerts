import { Router } from "express";
import {
  getPriceHistoryController,
  processPriceUpdateController
} from "./price-engine.controller";

export const priceEngineRoutes = Router();

priceEngineRoutes.get("/api/prices/:symbol/history", getPriceHistoryController);
priceEngineRoutes.post("/api/prices/update", processPriceUpdateController);
