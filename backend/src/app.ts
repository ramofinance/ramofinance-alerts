import express from "express";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { healthRoutes } from "./routes/health.routes";

export const createServer = () => {
  const app = express();

  app.use(express.json());

  app.use(healthRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
