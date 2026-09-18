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
  TELEGRAM_ADMIN_USERNAMES: z.string().default("ramoadmin"),

  CRYPTOFLOW_URL: z.string().url().default("https://cryptoflow.ramo-fin-group.workers.dev/"),
  ALLOWED_ORIGINS: z.string().default(""),
  BILLING_ENABLED: booleanFromEnv.default(false),

  JWT_SECRET: z.string().optional(),

  WS_PORT: z.coerce.number().int().positive().default(4000),

  FINNHUB_API_KEY: z.string().min(1).optional(),
  PRICE_POLLING_ENABLED: booleanFromEnv.default(false),
  PRICE_POLLING_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
  RADAR_ENABLED: booleanFromEnv.default(true),
  RADAR_PUBLIC_ENABLED: booleanFromEnv.default(false),
  RADAR_SCAN_INTERVAL_MS: z.coerce.number().int().positive().default(120000),
  RADAR_SIGNAL_THRESHOLD: z.coerce.number().int().min(50).max(100).default(68)
}).superRefine((values, context) => {
  if (values.NODE_ENV !== "production") {
    return;
  }

  const required: Array<[string, string | undefined]> = [
    ["DATABASE_URL", values.DATABASE_URL],
    ["TELEGRAM_BOT_TOKEN", values.TELEGRAM_BOT_TOKEN],
    ["TELEGRAM_WEBAPP_URL", values.TELEGRAM_WEBAPP_URL],
    ["TELEGRAM_WEBHOOK_SECRET", values.TELEGRAM_WEBHOOK_SECRET],
    ["ALLOWED_ORIGINS", values.ALLOWED_ORIGINS]
  ];

  required.forEach(([name, value]) => {
    if (!value?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${name} is required in production`
      });
    }
  });
});

export const env = envSchema.parse(process.env);
