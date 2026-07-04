import type { ErrorRequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isAppError = error instanceof AppError;

  const statusCode = isAppError ? error.statusCode : 500;

  const message =
    env.NODE_ENV === "production" && !isAppError
      ? "Internal server error"
      : error.message;

  logger.error({ error }, message);

  res.status(statusCode).json({
    success: false,
    error: {
      message
    }
  });
};
