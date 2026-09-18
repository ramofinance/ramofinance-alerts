ALTER TABLE "User"
ADD COLUMN "botStartCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "firstBotStartedAt" TIMESTAMP(3),
ADD COLUMN "lastBotStartedAt" TIMESTAMP(3);

-- Reset legacy choices once so existing users are detected from their current
-- Telegram language. New explicit choices remain persistent after this release.
UPDATE "User" SET "preferredLanguage" = NULL;
