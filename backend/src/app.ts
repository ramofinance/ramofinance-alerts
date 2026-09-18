import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { alertRoutes } from "./modules/alerts/alert.routes";
import { lineRoutes } from "./modules/lines/line.routes";
import { marketRoutes } from "./modules/markets/market.routes";
import { priceEngineRoutes } from "./modules/price-engine/price-engine.routes";
import { subscriptionRoutes } from "./modules/subscriptions/subscription.routes";
import { telegramRoutes } from "./telegram/telegram.routes";
import { userRoutes } from "./modules/users/user.routes";
import { healthRoutes } from "./routes/health.routes";
import { radarRoutes } from "./modules/radar/radar.routes";
import { env } from "./config/env";

export const createServer = () => {
  const app = express();

  app.use(helmet());
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed"));
    }
  }));
  app.use(compression() as unknown as express.RequestHandler);
  app.use(express.json({ limit: "100kb" }));

  app.use(healthRoutes);
  app.use(alertRoutes);
  app.use(lineRoutes);
  app.use(marketRoutes);
  app.use(priceEngineRoutes);
  if (env.BILLING_ENABLED) {
    app.use(subscriptionRoutes);
  }
  app.use(userRoutes);
  app.use(radarRoutes);
  app.use(telegramRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
