import { PreferredLanguage, UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { userService } from "./user.service";

const listUsersSchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

const upsertTelegramUserSchema = z.object({
  telegramId: z.string().trim().min(1),
  username: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  languageCode: z.string().trim().min(1).optional(),
  preferredLanguage: z.nativeEnum(PreferredLanguage).nullable().optional()
});

const setUserActiveSchema = z.object({
  isActive: z.boolean()
});

const setUserPreferredLanguageSchema = z.object({
  preferredLanguage: z.nativeEnum(PreferredLanguage)
});

const parseOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid request data", 400);
  }

  return result.data;
};

export const listUsersController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(listUsersSchema, req.query);
    const result = await userService.listUsers(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const upsertTelegramUserController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(upsertTelegramUserSchema, req.body);
    const user = await userService.upsertTelegramUser(input);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const setUserActiveController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(setUserActiveSchema, req.body);
    const user = await userService.setUserActive(req.params.id, input.isActive);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const setUserPreferredLanguageController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseOrThrow(setUserPreferredLanguageSchema, req.body);
    const user = await userService.setUserPreferredLanguage(
      req.params.id,
      input.preferredLanguage
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
