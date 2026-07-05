import { AlertDirection, AlertStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { alertRepository } from "./alert.repository";

type CreateAlertInput = {
  userId: string;
  marketId: string;
  title?: string;
  targetPrice: string;
  direction: AlertDirection;
  expiresAt?: string;
};

type ListAlertsInput = {
  userId?: string;
  marketId?: string;
  status?: AlertStatus;
  page?: number;
  limit?: number;
};

export const alertService = {
  async createAlert(input: CreateAlertInput) {
    const targetPrice = Number(input.targetPrice);

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      throw new AppError("targetPrice must be a positive number", 400);
    }

    const [user, market] = await Promise.all([
      alertRepository.findUserById(input.userId),
      alertRepository.findMarketById(input.marketId)
    ]);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!market) {
      throw new AppError("Market not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("User is inactive", 400);
    }

    if (!market.isActive) {
      throw new AppError("Market is inactive", 400);
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new AppError("expiresAt must be a valid date", 400);
    }

    return alertRepository.create({
      userId: input.userId,
      marketId: input.marketId,
      title: input.title,
      targetPrice: input.targetPrice,
      direction: input.direction,
      expiresAt
    });
  },

  async listAlerts(input: ListAlertsInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const [items, total] = await Promise.all([
      alertRepository.findMany({
        userId: input.userId,
        marketId: input.marketId,
        status: input.status,
        page,
        limit
      }),
      alertRepository.count({
        userId: input.userId,
        marketId: input.marketId,
        status: input.status
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

  async getAlertById(id: string) {
    const alert = await alertRepository.findById(id);

    if (!alert) {
      throw new AppError("Alert not found", 404);
    }

    return alert;
  },

  async updateAlertStatus(id: string, status: AlertStatus) {
    await this.getAlertById(id);
    return alertRepository.updateStatus(id, status);
  },

  async deleteAlert(id: string) {
    await this.getAlertById(id);
    await alertRepository.delete(id);
  }
};
