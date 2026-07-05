import { SubscriptionStatus } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { subscriptionService } from "./subscription.service";

const listSubscriptionsSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  plan: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const createSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.string().trim().min(1).max(80),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional()
});

const updateSubscriptionSchema = z
  .object({
    plan: z.string().trim().min(1).max(80).optional(),
    status: z.nativeEnum(SubscriptionStatus).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });

const parseOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid request data", 400);
  }

  return result.data;
};

export const createSubscriptionController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(createSubscriptionSchema, req.body);
    const subscription = await subscriptionService.createSubscription(input);

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const listSubscriptionsController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(listSubscriptionsSchema, req.query);
    const result = await subscriptionService.listSubscriptions(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionByIdController: RequestHandler = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(updateSubscriptionSchema, req.body);
    const subscription = await subscriptionService.updateSubscription(req.params.id, input);

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscriptionController: RequestHandler = async (req, res, next) => {
  try {
    await subscriptionService.deleteSubscription(req.params.id);

    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
