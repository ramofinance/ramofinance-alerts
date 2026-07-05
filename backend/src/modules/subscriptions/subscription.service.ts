import { SubscriptionStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { subscriptionRepository } from "./subscription.repository";

type ListSubscriptionsInput = {
  userId?: string;
  status?: SubscriptionStatus;
  plan?: string;
  page?: number;
  limit?: number;
};

type CreateSubscriptionInput = {
  userId: string;
  plan: string;
  status?: SubscriptionStatus;
  startsAt?: string;
  endsAt?: string | null;
};

type UpdateSubscriptionInput = {
  plan?: string;
  status?: SubscriptionStatus;
  startsAt?: string;
  endsAt?: string | null;
};

const parseOptionalDate = (value: string | null | undefined, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return date;
};

export const subscriptionService = {
  async createSubscription(input: CreateSubscriptionInput) {
    const user = await subscriptionRepository.findUserById(input.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("User is inactive", 400);
    }

    return subscriptionRepository.create({
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      startsAt: parseOptionalDate(input.startsAt, "startsAt") ?? undefined,
      endsAt: parseOptionalDate(input.endsAt, "endsAt")
    });
  },

  async listSubscriptions(input: ListSubscriptionsInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const [items, total] = await Promise.all([
      subscriptionRepository.findMany({
        userId: input.userId,
        status: input.status,
        plan: input.plan,
        page,
        limit
      }),
      subscriptionRepository.count({
        userId: input.userId,
        status: input.status,
        plan: input.plan
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

  async getSubscriptionById(id: string) {
    const subscription = await subscriptionRepository.findById(id);

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    return subscription;
  },

  async updateSubscription(id: string, input: UpdateSubscriptionInput) {
    await this.getSubscriptionById(id);

    return subscriptionRepository.update(id, {
      plan: input.plan,
      status: input.status,
      startsAt: parseOptionalDate(input.startsAt, "startsAt") ?? undefined,
      endsAt: parseOptionalDate(input.endsAt, "endsAt")
    });
  },

  async deleteSubscription(id: string) {
    await this.getSubscriptionById(id);
    await subscriptionRepository.delete(id);
  }
};
