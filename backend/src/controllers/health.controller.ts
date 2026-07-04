import type { RequestHandler } from "express";

export const healthCheckController: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    status: "ok"
  });
};
