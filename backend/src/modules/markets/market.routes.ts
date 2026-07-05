import { Router } from "express";
import {
  getMarketByIdController,
  listMarketsController
} from "./market.controller";

export const marketRoutes = Router();

marketRoutes.get("/api/markets", listMarketsController);
marketRoutes.get("/api/markets/:id", getMarketByIdController);
