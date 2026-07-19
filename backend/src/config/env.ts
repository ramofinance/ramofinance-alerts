import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().optional(),
  BACKEND_PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1).optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().default("ramofinancebot"),
  TELEGRAM_WEBAPP_URL: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  JWT_SECRET: z.string().optional(),

  WS_PORT: z.coerce.number().int().positive().default(4000),

  PRICE_POLLING_ENABLED: booleanFromEnv.default(false),
  PRICE_POLLING_INTERVAL_MS: z.coerce.number().int().positive().default(30000)
});

export const env = envSchema.parse(process.env);
