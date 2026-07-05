import { MarketType } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { marketService } from "./market.service";

const listMarketsSchema = z.object({
  type: z.nativeEnum(MarketType).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const parseOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid request data", 400);
  }

  return result.data;
};

export const listMarketsController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(listMarketsSchema, req.query);
    const result = await marketService.listMarkets(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMarketByIdController: RequestHandler = async (req, res, next) => {
  try {
    const market = await marketService.getMarketById(req.params.id);

    res.json({
      success: true,
      data: market
    });
  } catch (error) {
    next(error);
  }
};
