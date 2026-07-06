import { Router } from "express";
import {
  telegramStatusController,
  telegramWebhookController
} from "./telegram.controller";

export const telegramRoutes = Router();

telegramRoutes.get("/api/telegram/status", telegramStatusController);
telegramRoutes.post("/api/telegram/webhook", telegramWebhookController);
