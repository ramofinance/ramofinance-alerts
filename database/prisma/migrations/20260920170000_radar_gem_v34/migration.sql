ALTER TABLE "User"
ADD COLUMN "radarMinDexUniqueBuyers24h" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "radarMinShortSqueezeDepth" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RadarSignal"
ADD COLUMN "dexUniqueBuyers24h" INTEGER,
ADD COLUMN "dexUniqueSellers24h" INTEGER,
ADD COLUMN "shortSqueezeDepth" INTEGER,
ADD COLUMN "shortSqueezeTimeframe" TEXT;
