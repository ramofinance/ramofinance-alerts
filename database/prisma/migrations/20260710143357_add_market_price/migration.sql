-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_marketId_key" ON "MarketPrice"("marketId");

-- CreateIndex
CREATE INDEX "MarketPrice_marketId_idx" ON "MarketPrice"("marketId");

-- CreateIndex
CREATE INDEX "MarketPrice_updatedAt_idx" ON "MarketPrice"("updatedAt");

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
