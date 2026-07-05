import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

export type ListLinesFilters = {
  userId?: string;
  marketId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
};

export type CreateLineData = {
  userId?: string;
  marketId?: string;
  label?: string;
  price: string;
  color?: string;
  isActive?: boolean;
};

export type UpdateLineData = {
  userId?: string | null;
  marketId?: string | null;
  label?: string | null;
  price?: string;
  color?: string | null;
  isActive?: boolean;
};

const buildLineWhere = (
  filters: Omit<ListLinesFilters, "page" | "limit">
): Prisma.LineWhereInput => ({
  userId: filters.userId,
  marketId: filters.marketId,
  isActive: filters.isActive
});

export const lineRepository = {
  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  findMarketById(id: string) {
    return prisma.market.findUnique({
      where: { id }
    });
  },

  create(data: CreateLineData) {
    return prisma.line.create({
      data
    });
  },

  findMany(filters: ListLinesFilters) {
    return prisma.line.findMany({
      where: buildLineWhere(filters),
      orderBy: {
        createdAt: "desc"
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });
  },

  count(filters: Omit<ListLinesFilters, "page" | "limit">) {
    return prisma.line.count({
      where: buildLineWhere(filters)
    });
  },

  findById(id: string) {
    return prisma.line.findUnique({
      where: { id }
    });
  },

  update(id: string, data: UpdateLineData) {
    return prisma.line.update({
      where: { id },
      data
    });
  },

  delete(id: string) {
    return prisma.line.delete({
      where: { id }
    });
  }
};
