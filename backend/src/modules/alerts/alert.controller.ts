import { AlertDirection, AlertStatus } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { alertService } from "./alert.service";

const createAlertSchema = z.object({
  userId: z.string().uuid().optional(),
  marketId: z.string().uuid(),
  title: z.string().trim().min(1).max(120).optional(),
  targetPrice: z.string().trim().min(1),
  direction: z.nativeEnum(AlertDirection),
  expiresAt: z.string().datetime().optional()
});

const listAlertsSchema = z.object({
  userId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  status: z.nativeEnum(AlertStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const updateAlertSchema = z
  .object({
    title: z.string().trim().min(1).max(120).nullable().optional(),
    targetPrice: z.string().trim().min(1).optional(),
    direction: z.nativeEnum(AlertDirection).optional(),
    expiresAt: z.string().datetime().nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });

const updateAlertStatusSchema = z.object({
  status: z.union([
    z.literal(AlertStatus.ACTIVE),
    z.literal(AlertStatus.PAUSED)
  ])
});

const parseOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid request data", 400);
  }

  return result.data;
};

export const createAlertController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(createAlertSchema, req.body);
    const alert = await alertService.createAlert({
      ...input,
      userId: res.locals.authUser.id
    });

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

export const listAlertsController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(listAlertsSchema, req.query);
    const result = await alertService.listAlerts({
      ...input,
      userId: res.locals.authUser.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getAlertByIdController: RequestHandler = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(
      String(req.params.id),
      res.locals.authUser.id
    );

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

export const updateAlertController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(updateAlertSchema, req.body);
    const alert = await alertService.updateAlert(
      String(req.params.id),
      res.locals.authUser.id,
      input
    );

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

export const updateAlertStatusController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(updateAlertStatusSchema, req.body);
    const alert = await alertService.updateAlertStatus(
      String(req.params.id),
      res.locals.authUser.id,
      input.status
    );

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAlertController: RequestHandler = async (req, res, next) => {
  try {
    await alertService.deleteAlert(String(req.params.id), res.locals.authUser.id);

    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
