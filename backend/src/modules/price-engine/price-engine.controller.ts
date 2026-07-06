import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { priceEngineService } from "./price-engine.service";

const priceUpdateSchema = z.object({
  symbol: z.string().trim().min(1),
  price: z.string().trim().min(1)
});

const parseOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid request data", 400);
  }

  return result.data;
};

export const processPriceUpdateController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(priceUpdateSchema, req.body);
    const result = await priceEngineService.processPriceUpdate(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
