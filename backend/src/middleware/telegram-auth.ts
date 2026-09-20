import { isAdminIdentity } from "../security/admin-identity";
import type { RequestHandler } from "express";
import { userService } from "../modules/users/user.service";
import { verifyTelegramMiniAppInitData } from "../telegram/telegram-mini-app-auth";
import { AppError } from "../utils/app-error";

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

export const requireTelegramAuth: RequestHandler = async (req, res, next) => {
  try {
    const initData = verifyTelegramMiniAppInitData(
      req.header("x-telegram-init-data") ?? ""
    );

    if (!initData.user?.id || !initData.authDate) {
      throw new AppError("Telegram authentication is required", 401);
    }

    const ageSeconds = Math.floor(Date.now() / 1000) - initData.authDate;

    if (ageSeconds < -60 || ageSeconds > MAX_INIT_DATA_AGE_SECONDS) {
      throw new AppError("Telegram authentication has expired", 401);
    }

    const user = await userService.getUserByTelegramId(
      String(initData.user.id)
    );

    if (!user.isActive) {
      throw new AppError("User is inactive", 403);
    }

    res.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const user = res.locals.authUser;

  if (!user || !isAdminIdentity(user)) {
    next(new AppError("Admin access is required", 403));
    return;
  }

  next();
};

export const requireSelfOrAdmin: RequestHandler = (req, res, next) => {
  const user = res.locals.authUser;

  if (!user || (!isAdminIdentity(user) && user.id !== req.params.id)) {
    next(new AppError("Access denied", 403));
    return;
  }

  next();
};
