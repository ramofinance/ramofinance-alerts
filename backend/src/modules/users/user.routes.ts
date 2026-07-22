import { Router } from "express";
import {
  addUserFavoriteMarketController,
  getUserByIdController,
  listUserFavoriteMarketsController,
  listUsersController,
  removeUserFavoriteMarketController,
  setUserActiveController,
  setUserPreferredLanguageController,
  upsertTelegramUserController
} from "./user.controller";

export const userRoutes = Router();

userRoutes.get("/api/users", listUsersController);
userRoutes.post("/api/users/telegram", upsertTelegramUserController);
userRoutes.get("/api/users/:id/favorites", listUserFavoriteMarketsController);
userRoutes.post("/api/users/:id/favorites/:marketId", addUserFavoriteMarketController);
userRoutes.delete("/api/users/:id/favorites/:marketId", removeUserFavoriteMarketController);
userRoutes.get("/api/users/:id", getUserByIdController);
userRoutes.patch("/api/users/:id/active", setUserActiveController);
userRoutes.patch("/api/users/:id/language", setUserPreferredLanguageController);
