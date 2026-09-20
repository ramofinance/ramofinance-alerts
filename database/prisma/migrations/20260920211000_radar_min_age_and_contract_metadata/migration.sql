ALTER TABLE "RadarSignal"
ADD COLUMN "dexId" TEXT,
ADD COLUMN "pairAddress" TEXT,
ADD COLUMN "tokenAddress" TEXT,
ADD COLUMN "quoteSymbol" TEXT,
ADD COLUMN "quoteTokenAddress" TEXT,
ADD COLUMN "pairCreatedAt" TIMESTAMP(3),
ADD COLUMN "marketAgeDays" INTEGER;
