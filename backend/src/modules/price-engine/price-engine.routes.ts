import { Router } from "express";
import { processPriceUpdateController } from "./price-engine.controller";

export const priceEngineRoutes = Router();

priceEngineRoutes.post("/api/prices/update", processPriceUpdateController);
