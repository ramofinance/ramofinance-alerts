import { MarketType } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { marketRepository } from "./market.repository";

type ListMarketsInput = {
  type?: MarketType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export const marketService = {
  async listMarkets(input: ListMarketsInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const [items, total] = await Promise.all([
      marketRepository.findMany({
        type: input.type,
        isActive: input.isActive,
        search: input.search,
        page,
        limit
      }),
      marketRepository.count({
        type: input.type,
        isActive: input.isActive,
        search: input.search
      })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getMarketById(id: string) {
    const market = await marketRepository.findById(id);

    if (!market) {
      throw new AppError("Market not found", 404);
    }

    return market;
  }
};
