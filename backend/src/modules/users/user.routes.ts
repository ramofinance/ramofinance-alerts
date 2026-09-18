import { Router } from "express";
import {
  addUserFavoriteMarketController,
  getUserByIdController,
  listUserFavoriteMarketsController,
  listUsersController,
  removeUserFavoriteMarketController,
  setUserAlertNotificationSettingsController,
  setUserActiveController,
  setUserPreferredLanguageController,
  upsertTelegramUserController
} from "./user.controller";
import {
  requireAdmin,
  requireSelfOrAdmin,
  requireTelegramAuth
} from "../../middleware/telegram-auth";

export const userRoutes = Router();

userRoutes.use("/api/users", requireTelegramAuth);
userRoutes.get("/api/users", requireAdmin, listUsersController);
userRoutes.post("/api/users/telegram", requireAdmin, upsertTelegramUserController);
userRoutes.get("/api/users/:id/favorites", requireSelfOrAdmin, listUserFavoriteMarketsController);
userRoutes.post("/api/users/:id/favorites/:marketId", requireSelfOrAdmin, addUserFavoriteMarketController);
userRoutes.delete("/api/users/:id/favorites/:marketId", requireSelfOrAdmin, removeUserFavoriteMarketController);
userRoutes.patch(
  "/api/users/:id/notification-settings",
  requireSelfOrAdmin,
  setUserAlertNotificationSettingsController
);
userRoutes.get("/api/users/:id", requireSelfOrAdmin, getUserByIdController);
userRoutes.patch("/api/users/:id/active", requireAdmin, setUserActiveController);
userRoutes.patch("/api/users/:id/language", requireSelfOrAdmin, setUserPreferredLanguageController);
