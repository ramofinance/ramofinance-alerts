-- CreateTable
CREATE TABLE "MarketPriceHistory" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPriceHistory_marketId_idx" ON "MarketPriceHistory"("marketId");

-- CreateIndex
CREATE INDEX "MarketPriceHistory_marketId_observedAt_idx" ON "MarketPriceHistory"("marketId", "observedAt");

-- CreateIndex
CREATE INDEX "MarketPriceHistory_observedAt_idx" ON "MarketPriceHistory"("observedAt");

-- AddForeignKey
ALTER TABLE "MarketPriceHistory" ADD CONSTRAINT "MarketPriceHistory_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
