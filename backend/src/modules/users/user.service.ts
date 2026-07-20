import { PreferredLanguage, UserRole } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { userRepository } from "./user.repository";

type ListUsersInput = {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type UpsertTelegramUserInput = {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  preferredLanguage?: PreferredLanguage | null;
};

export const userService = {
  async listUsers(input: ListUsersInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const [items, total] = await Promise.all([
      userRepository.findMany({
        search: input.search,
        role: input.role,
        isActive: input.isActive,
        page,
        limit
      }),
      userRepository.count({
        search: input.search,
        role: input.role,
        isActive: input.isActive
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

  async getUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async upsertTelegramUser(input: UpsertTelegramUserInput) {
    return userRepository.upsertByTelegramId(input);
  },

  async recordMiniAppOpen(input: UpsertTelegramUserInput) {
    return userRepository.recordMiniAppOpen(input);
  },

  async getUserByTelegramId(telegramId: string) {
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async touchMiniAppActivity(telegramId: string) {
    await this.getUserByTelegramId(telegramId);
    return userRepository.touchLastSeenByTelegramId(telegramId);
  },

  async getMiniAppStats() {
    return userRepository.getMiniAppStats();
  },

  async setUserActive(id: string, isActive: boolean) {
    await this.getUserById(id);
    return userRepository.setActive(id, isActive);
  },

  async setUserPreferredLanguage(id: string, preferredLanguage: PreferredLanguage) {
    await this.getUserById(id);
    return userRepository.setPreferredLanguage(id, preferredLanguage);
  }
};
