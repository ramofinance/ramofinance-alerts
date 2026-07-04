import express from "express";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export const createServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok"
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
