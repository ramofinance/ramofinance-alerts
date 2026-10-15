-- Radar unlock by inviting people to the community channel.
-- Only adds two new tables; nothing existing is changed or removed.
CREATE TABLE "RadarReferralLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadarReferralLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RadarReferralJoin" (
    "id" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "invitedTelegramId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    CONSTRAINT "RadarReferralJoin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RadarReferralLink_userId_key" ON "RadarReferralLink"("userId");
CREATE UNIQUE INDEX "RadarReferralLink_inviteLink_key" ON "RadarReferralLink"("inviteLink");
CREATE UNIQUE INDEX "RadarReferralJoin_invitedTelegramId_key" ON "RadarReferralJoin"("invitedTelegramId");
CREATE INDEX "RadarReferralJoin_inviterUserId_leftAt_idx" ON "RadarReferralJoin"("inviterUserId", "leftAt");
