ALTER TABLE "User"
ADD COLUMN "miniAppOpenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "firstMiniAppOpenedAt" TIMESTAMP(3),
ADD COLUMN "lastMiniAppOpenedAt" TIMESTAMP(3),
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");
