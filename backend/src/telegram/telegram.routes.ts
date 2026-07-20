import { Router } from "express";
import {
  telegramActivityController,
  telegramAdminStatsController,
  telegramMeController,
  telegramStatusController,
  telegramWebhookController
} from "./telegram.controller";

export const telegramRoutes = Router();

telegramRoutes.get("/api/telegram/status", telegramStatusController);
telegramRoutes.get("/api/telegram/me", telegramMeController);
telegramRoutes.post("/api/telegram/activity", telegramActivityController);
telegramRoutes.get("/api/telegram/admin/stats", telegramAdminStatsController);
telegramRoutes.post("/api/telegram/webhook", telegramWebhookController);
