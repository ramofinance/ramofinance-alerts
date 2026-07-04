import { Router } from "express";
import { healthCheckController } from "../controllers/health.controller";

export const healthRoutes = Router();

healthRoutes.get("/health", healthCheckController);
