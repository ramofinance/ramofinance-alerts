import { AppError } from "../../utils/app-error";
import { lineRepository } from "./line.repository";

type ListLinesInput = {
  userId?: string;
  marketId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type CreateLineInput = {
  userId?: string;
  marketId?: string;
  label?: string;
  price: string;
  color?: string;
  isActive?: boolean;
};

type UpdateLineInput = {
  userId?: string | null;
  marketId?: string | null;
  label?: string | null;
  price?: string;
  color?: string | null;
  isActive?: boolean;
};

const validatePositivePrice = (price: string) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new AppError("price must be a positive number", 400);
  }
};

const validateOptionalRelations = async (userId?: string | null, marketId?: string | null) => {
  const [user, market] = await Promise.all([
    userId ? lineRepository.findUserById(userId) : Promise.resolve(null),
    marketId ? lineRepository.findMarketById(marketId) : Promise.resolve(null)
  ]);

  if (userId && !user) {
    throw new AppError("User not found", 404);
  }

  if (marketId && !market) {
    throw new AppError("Market not found", 404);
  }

  if (user && !user.isActive) {
    throw new AppError("User is inactive", 400);
  }

  if (market && !market.isActive) {
    throw new AppError("Market is inactive", 400);
  }
};

export const lineService = {
  async createLine(input: CreateLineInput) {
    validatePositivePrice(input.price);
    await validateOptionalRelations(input.userId, input.marketId);

    return lineRepository.create(input);
  },

  async listLines(input: ListLinesInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const [items, total] = await Promise.all([
      lineRepository.findMany({
        userId: input.userId,
        marketId: input.marketId,
        isActive: input.isActive,
        page,
        limit
      }),
      lineRepository.count({
        userId: input.userId,
        marketId: input.marketId,
        isActive: input.isActive
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

  async getLineById(id: string) {
    const line = await lineRepository.findById(id);

    if (!line) {
      throw new AppError("Line not found", 404);
    }

    return line;
  },

  async updateLine(id: string, input: UpdateLineInput) {
    await this.getLineById(id);

    if (input.price !== undefined) {
      validatePositivePrice(input.price);
    }

    await validateOptionalRelations(input.userId, input.marketId);

    return lineRepository.update(id, input);
  },

  async deleteLine(id: string) {
    await this.getLineById(id);
    await lineRepository.delete(id);
  }
};
