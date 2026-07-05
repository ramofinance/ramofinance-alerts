import { Router } from "express";
import {
  createAlertController,
  deleteAlertController,
  getAlertByIdController,
  listAlertsController,
  updateAlertStatusController
} from "./alert.controller";

export const alertRoutes = Router();

alertRoutes.get("/api/alerts", listAlertsController);
alertRoutes.post("/api/alerts", createAlertController);
alertRoutes.get("/api/alerts/:id", getAlertByIdController);
alertRoutes.patch("/api/alerts/:id/status", updateAlertStatusController);
alertRoutes.delete("/api/alerts/:id", deleteAlertController);
