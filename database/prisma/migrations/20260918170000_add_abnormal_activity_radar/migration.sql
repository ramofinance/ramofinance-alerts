ALTER TABLE "User"
ADD COLUMN "radarNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "radarMinimumScore" INTEGER NOT NULL DEFAULT 75;

CREATE TABLE "RadarSignal" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "marketCap" DECIMAL(65,30),
    "volume24h" DECIMAL(65,30),
    "turnover24h" DOUBLE PRECISION,
    "priceChange24h" DOUBLE PRECISION,
    "volumeAcceleration" DOUBLE PRECISION,
    "tradeCount24h" INTEGER,
    "sourceSummary" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "cooldownKey" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadarSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RadarNotification" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "TelegramNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RadarNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RadarSignal_cooldownKey_key" ON "RadarSignal"("cooldownKey");
CREATE INDEX "RadarSignal_detectedAt_idx" ON "RadarSignal"("detectedAt");
CREATE INDEX "RadarSignal_score_detectedAt_idx" ON "RadarSignal"("score", "detectedAt");
CREATE INDEX "RadarSignal_symbol_detectedAt_idx" ON "RadarSignal"("symbol", "detectedAt");
CREATE UNIQUE INDEX "RadarNotification_signalId_userId_key" ON "RadarNotification"("signalId", "userId");
CREATE INDEX "RadarNotification_status_scheduledAt_idx" ON "RadarNotification"("status", "scheduledAt");
CREATE INDEX "RadarNotification_userId_idx" ON "RadarNotification"("userId");

ALTER TABLE "RadarNotification" ADD CONSTRAINT "RadarNotification_signalId_fkey"
FOREIGN KEY ("signalId") REFERENCES "RadarSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RadarNotification" ADD CONSTRAINT "RadarNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
