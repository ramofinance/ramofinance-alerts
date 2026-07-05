import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { lineService } from "./line.service";

const listLinesSchema = z.object({
  userId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const createLineSchema = z.object({
  userId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  price: z.string().trim().min(1),
  color: z.string().trim().min(1).max(40).optional(),
  isActive: z.boolean().optional()
});

const updateLineSchema = z
  .object({
    userId: z.string().uuid().nullable().optional(),
    marketId: z.string().uuid().nullable().optional(),
    label: z.string().trim().min(1).max(120).nullable().optional(),
    price: z.string().trim().min(1).optional(),
    color: z.string().trim().min(1).max(40).nullable().optional(),
    isActive: z.boolean().optional()
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

export const createLineController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(createLineSchema, req.body);
    const line = await lineService.createLine(input);

    res.status(201).json({
      success: true,
      data: line
    });
  } catch (error) {
    next(error);
  }
};

export const listLinesController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(listLinesSchema, req.query);
    const result = await lineService.listLines(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getLineByIdController: RequestHandler = async (req, res, next) => {
  try {
    const line = await lineService.getLineById(req.params.id);

    res.json({
      success: true,
      data: line
    });
  } catch (error) {
    next(error);
  }
};

export const updateLineController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(updateLineSchema, req.body);
    const line = await lineService.updateLine(req.params.id, input);

    res.json({
      success: true,
      data: line
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLineController: RequestHandler = async (req, res, next) => {
  try {
    await lineService.deleteLine(req.params.id);

    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
