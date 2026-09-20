import { UserRole } from "@prisma/client";
import { env } from "../config/env";

const normalizeUsername = (value: string | null | undefined) =>
  String(value ?? "").trim().replace(/^@/, "").toLowerCase();

const configuredAdminUsernames = new Set(
  env.TELEGRAM_ADMIN_USERNAMES.split(",")
    .map(normalizeUsername)
    .filter(Boolean)
);

const configuredAdminTelegramIds = new Set(
  env.TELEGRAM_ADMIN_IDS.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

// Backward-compatible primary owner identities already present in project migrations/defaults.
configuredAdminUsernames.add("ramoadmin");
configuredAdminTelegramIds.add("111287296");

export type AdminIdentityLike = {
  role?: UserRole | null;
  telegramId?: string | null;
  username?: string | null;
};

export const matchesConfiguredAdminIdentity = (user: AdminIdentityLike) => {
  const username = normalizeUsername(user.username);
  const telegramId = String(user.telegramId ?? "").trim();

  return Boolean(
    (telegramId && configuredAdminTelegramIds.has(telegramId)) ||
    (username && configuredAdminUsernames.has(username))
  );
};

export const isAdminIdentity = (user: AdminIdentityLike | null | undefined) =>
  Boolean(user && (user.role === UserRole.ADMIN || matchesConfiguredAdminIdentity(user)));
