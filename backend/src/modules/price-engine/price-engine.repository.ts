import { AlertStatus, MarketType } from "@prisma/client";
import { prisma } from "../../database/prisma";

export const priceEngineRepository = {
  findMarketBySymbol(symbol: string) {
    return prisma.market.findUnique({
      where: { symbol },
      include: {
        latestPrice: true
      }
    });
  },

  upsertLatestMarketPrice(marketId: string, price: string, source = "manual") {
    return prisma.marketPrice.upsert({
      where: {
        marketId
      },
      update: {
        price,
        source
      },
      create: {
        marketId,
        price,
        source
      }
    });
  },

  createMarketPriceHistory(marketId: string, price: string, source = "manual") {
    return prisma.marketPriceHistory.create({
      data: {
        marketId,
        price,
        source
      }
    });
  },

  pruneMarketPriceHistory(marketId: string, keep = 3000) {
    return prisma.$executeRaw`
      WITH stale_rows AS (
        SELECT "id"
        FROM "MarketPriceHistory"
        WHERE "marketId" = ${marketId}
        ORDER BY "observedAt" DESC, "id" DESC
        OFFSET ${keep}
      )
      DELETE FROM "MarketPriceHistory"
      WHERE "id" IN (
        SELECT "id"
        FROM stale_rows
      )
    `;
  },

  findActiveMarkets() {
    return prisma.market.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        symbol: "asc"
      }
    });
  },

  findActiveMarketsByType(type: MarketType) {
    return prisma.market.findMany({
      where: {
        type,
        isActive: true
      },
      orderBy: {
        symbol: "asc"
      }
    });
  },

  findMarketPriceHistory(
    marketId: string,
    limit = 100,
    source?: string
  ) {
    return prisma.marketPriceHistory.findMany({
      where: {
        marketId,
        ...(source ? { source } : {})
      },
      orderBy: {
        observedAt: "desc"
      },
      take: limit
    });
  },

  findActiveAlertsByMarketId(marketId: string) {
    return prisma.alert.findMany({
      where: {
        marketId,
        status: AlertStatus.ACTIVE,
        user: {
          isActive: true
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: true,
        market: true
      }
    });
  },

  triggerAlert(id: string) {
    return prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.TRIGGERED,
        triggeredAt: new Date()
      },
      include: {
        user: true,
        market: true
      }
    });
  }
};
