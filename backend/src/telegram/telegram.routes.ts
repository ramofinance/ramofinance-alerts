import { Router } from "express";
import {
  telegramMeController,
  telegramStatusController,
  telegramWebhookController
} from "./telegram.controller";

export const telegramRoutes = Router();

telegramRoutes.get("/api/telegram/status", telegramStatusController);
telegramRoutes.get("/api/telegram/me", telegramMeController);
telegramRoutes.post("/api/telegram/webhook", telegramWebhookController);
