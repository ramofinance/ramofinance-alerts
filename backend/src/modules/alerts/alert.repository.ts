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

export const alertRepository = {
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
    const where: Prisma.AlertWhereInput = {
      userId: filters.userId,
      marketId: filters.marketId,
      status: filters.status
    };

    return prisma.alert.findMany({
      where,
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
    const where: Prisma.AlertWhereInput = {
      userId: filters.userId,
      marketId: filters.marketId,
      status: filters.status
    };

    return prisma.alert.count({ where });
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
