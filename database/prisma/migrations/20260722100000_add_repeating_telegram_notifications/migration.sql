-- CreateEnum
CREATE TYPE "TelegramNotificationStatus" AS ENUM (
    'PENDING',
    'SENDING',
    'SENT',
    'FAILED'
);

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "alertNotificationRepeatCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "alertNotificationIntervalSeconds" INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "TelegramAlertNotification" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "TelegramNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAlertNotification_alertId_sequence_key"
ON "TelegramAlertNotification"("alertId", "sequence");

-- CreateIndex
CREATE INDEX "TelegramAlertNotification_status_scheduledAt_idx"
ON "TelegramAlertNotification"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "TelegramAlertNotification_userId_idx"
ON "TelegramAlertNotification"("userId");

-- AddForeignKey
ALTER TABLE "TelegramAlertNotification"
ADD CONSTRAINT "TelegramAlertNotification_alertId_fkey"
FOREIGN KEY ("alertId") REFERENCES "Alert"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAlertNotification"
ADD CONSTRAINT "TelegramAlertNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
