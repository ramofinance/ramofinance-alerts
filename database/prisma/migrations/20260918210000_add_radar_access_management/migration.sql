ALTER TABLE "User"
ADD COLUMN "radarPreviewAccess" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "RadarAccessInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "redeemedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadarAccessInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RadarAccessInvite_token_key" ON "RadarAccessInvite"("token");
CREATE INDEX "RadarAccessInvite_token_expiresAt_idx" ON "RadarAccessInvite"("token", "expiresAt");
CREATE INDEX "RadarAccessInvite_createdByUserId_idx" ON "RadarAccessInvite"("createdByUserId");
