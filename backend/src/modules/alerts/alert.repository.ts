import { AlertDirection, AlertStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

export type CreateAlertData = {
  userId: string;
  marketId: string;
  title?: string;
  targetPrice: string;
  direction: AlertDirection;
  expiresAt?: Date;
};

export type ListAlertsFilters = {
  userId?: string;
  marketId?: string;
  status?: AlertStatus;
  page: number;
  limit: number;
};

export type UpdateAlertData = {
  title?: string | null;
  targetPrice?: string;
  direction?: AlertDirection;
  expiresAt?: Date | null;
};

const buildAlertWhere = (
  filters: Omit<ListAlertsFilters, "page" | "limit">
): Prisma.AlertWhereInput => ({
  userId: filters.userId,
  marketId: filters.marketId,
  status: filters.status
});

export const alertRepository = {
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

  create(data: CreateAlertData) {
    return prisma.alert.create({
      data: {
        userId: data.userId,
        marketId: data.marketId,
        title: data.title,
        targetPrice: data.targetPrice,
        direction: data.direction,
        expiresAt: data.expiresAt
      },
      include: {
        user: true,
        market: true
      }
    });
  },

  findMany(filters: ListAlertsFilters) {
    return prisma.alert.findMany({
      where: buildAlertWhere(filters),
      include: {
        user: true,
        market: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });
  },

  count(filters: Omit<ListAlertsFilters, "page" | "limit">) {
    return prisma.alert.count({
      where: buildAlertWhere(filters)
    });
  },

  findById(id: string) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        user: true,
        market: true
      }
    });
  },

  update(id: string, data: UpdateAlertData) {
    return prisma.alert.update({
      where: { id },
      data,
      include: {
        user: true,
        market: true
      }
    });
  },

  updateStatus(id: string, status: AlertStatus) {
    return prisma.alert.update({
      where: { id },
      data: {
        status,
        triggeredAt: status === AlertStatus.TRIGGERED ? new Date() : undefined
      },
      include: {
        user: true,
        market: true
      }
    });
  },

  delete(id: string) {
    return prisma.alert.delete({
      where: { id }
    });
  }
};
