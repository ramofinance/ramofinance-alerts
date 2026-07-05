import { Router } from "express";
import {
  createSubscriptionController,
  deleteSubscriptionController,
  getSubscriptionByIdController,
  listSubscriptionsController,
  updateSubscriptionController
} from "./subscription.controller";

export const subscriptionRoutes = Router();

subscriptionRoutes.get("/api/subscriptions", listSubscriptionsController);
subscriptionRoutes.post("/api/subscriptions", createSubscriptionController);
subscriptionRoutes.get("/api/subscriptions/:id", getSubscriptionByIdController);
subscriptionRoutes.patch("/api/subscriptions/:id", updateSubscriptionController);
subscriptionRoutes.delete("/api/subscriptions/:id", deleteSubscriptionController);
