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

  upsertLatestMarketPrice(marketId: string, price: number, source = "manual") {
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

  findActiveAlertsByMarketId(marketId: string) {
    return prisma.alert.findMany({
      where: {
        marketId,
        status: AlertStatus.ACTIVE
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
