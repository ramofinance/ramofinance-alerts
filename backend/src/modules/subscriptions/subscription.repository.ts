import { Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";

export type ListSubscriptionsFilters = {
  userId?: string;
  status?: SubscriptionStatus;
  plan?: string;
  page: number;
  limit: number;
};

export type CreateSubscriptionData = {
  userId: string;
  plan: string;
  status?: SubscriptionStatus;
  startsAt?: Date;
  endsAt?: Date | null;
};

export type UpdateSubscriptionData = {
  plan?: string;
  status?: SubscriptionStatus;
  startsAt?: Date;
  endsAt?: Date | null;
};

const buildSubscriptionWhere = (
  filters: Omit<ListSubscriptionsFilters, "page" | "limit">
): Prisma.SubscriptionWhereInput => ({
  userId: filters.userId,
  status: filters.status,
  plan: filters.plan
});

export const subscriptionRepository = {
  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  create(data: CreateSubscriptionData) {
    return prisma.subscription.create({
      data,
      include: {
        user: true
      }
    });
  },

  findMany(filters: ListSubscriptionsFilters) {
    return prisma.subscription.findMany({
      where: buildSubscriptionWhere(filters),
      include: {
        user: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });
  },

  count(filters: Omit<ListSubscriptionsFilters, "page" | "limit">) {
    return prisma.subscription.count({
      where: buildSubscriptionWhere(filters)
    });
  },

  findById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
  },

  update(id: string, data: UpdateSubscriptionData) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: true
      }
    });
  },

  delete(id: string) {
    return prisma.subscription.delete({
      where: { id }
    });
  }
};
