import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { healthRoutes } from "./routes/health.routes";

export const createServer = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  app.use(healthRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
