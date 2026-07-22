-- CreateTable
CREATE TABLE "UserMarketFavorite" (
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMarketFavorite_pkey" PRIMARY KEY ("userId","marketId")
);

-- CreateIndex
CREATE INDEX "UserMarketFavorite_marketId_idx" ON "UserMarketFavorite"("marketId");

-- CreateIndex
CREATE INDEX "UserMarketFavorite_userId_createdAt_idx" ON "UserMarketFavorite"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserMarketFavorite"
ADD CONSTRAINT "UserMarketFavorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMarketFavorite"
ADD CONSTRAINT "UserMarketFavorite_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
