import { Router } from "express";
import {
  getUserByIdController,
  listUsersController,
  setUserActiveController,
  setUserPreferredLanguageController,
  upsertTelegramUserController
} from "./user.controller";

export const userRoutes = Router();

userRoutes.get("/api/users", listUsersController);
userRoutes.post("/api/users/telegram", upsertTelegramUserController);
userRoutes.get("/api/users/:id", getUserByIdController);
userRoutes.patch("/api/users/:id/active", setUserActiveController);
userRoutes.patch("/api/users/:id/language", setUserPreferredLanguageController);
