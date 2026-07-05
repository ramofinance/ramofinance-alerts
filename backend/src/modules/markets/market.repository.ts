import { MarketType, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

export type ListMarketsFilters = {
  type?: MarketType;
  isActive?: boolean;
  search?: string;
  page: number;
  limit: number;
};

const buildMarketWhere = (
  filters: Omit<ListMarketsFilters, "page" | "limit">
): Prisma.MarketWhereInput => ({
  type: filters.type,
  isActive: filters.isActive,
  OR: filters.search
    ? [
        {
          symbol: {
            contains: filters.search,
            mode: "insensitive"
          }
        },
        {
          name: {
            contains: filters.search,
            mode: "insensitive"
          }
        }
      ]
    : undefined
});

export const marketRepository = {
  findMany(filters: ListMarketsFilters) {
    return prisma.market.findMany({
      where: buildMarketWhere(filters),
      orderBy: {
        symbol: "asc"
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });
  },

  count(filters: Omit<ListMarketsFilters, "page" | "limit">) {
    return prisma.market.count({
      where: buildMarketWhere(filters)
    });
  },

  findById(id: string) {
    return prisma.market.findUnique({
      where: { id }
    });
  }
};
