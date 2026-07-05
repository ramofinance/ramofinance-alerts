import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { alertRoutes } from "./modules/alerts/alert.routes";
import { lineRoutes } from "./modules/lines/line.routes";
import { marketRoutes } from "./modules/markets/market.routes";
import { subscriptionRoutes } from "./modules/subscriptions/subscription.routes";
import { userRoutes } from "./modules/users/user.routes";
import { healthRoutes } from "./routes/health.routes";

export const createServer = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  app.use(healthRoutes);
  app.use(alertRoutes);
  app.use(lineRoutes);
  app.use(marketRoutes);
  app.use(subscriptionRoutes);
  app.use(userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
