import { Router } from "express";
import {
  createSubscriptionController,
  deleteSubscriptionController,
  getSubscriptionByIdController,
  listSubscriptionsController,
  updateSubscriptionController
} from "./subscription.controller";
import { requireAdmin, requireTelegramAuth } from "../../middleware/telegram-auth";

export const subscriptionRoutes = Router();

subscriptionRoutes.use("/api/subscriptions", requireTelegramAuth, requireAdmin);

subscriptionRoutes.get("/api/subscriptions", listSubscriptionsController);
subscriptionRoutes.post("/api/subscriptions", createSubscriptionController);
subscriptionRoutes.get("/api/subscriptions/:id", getSubscriptionByIdController);
subscriptionRoutes.patch("/api/subscriptions/:id", updateSubscriptionController);
subscriptionRoutes.delete("/api/subscriptions/:id", deleteSubscriptionController);
