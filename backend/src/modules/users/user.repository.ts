import { PreferredLanguage, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma";

export type ListUsersFilters = {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page: number;
  limit: number;
};

export type UpsertUserData = {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  preferredLanguage?: PreferredLanguage | null;
};

const buildUserWhere = (
  filters: Omit<ListUsersFilters, "page" | "limit">
): Prisma.UserWhereInput => ({
  role: filters.role,
  isActive: filters.isActive,
  OR: filters.search
    ? [
        { telegramId: { contains: filters.search, mode: "insensitive" } },
        { username: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } }
      ]
    : undefined
});

export const userRepository = {
  findMany(filters: ListUsersFilters) {
    return prisma.user.findMany({
      where: buildUserWhere(filters),
      orderBy: {
        createdAt: "desc"
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });
  },

  count(filters: Omit<ListUsersFilters, "page" | "limit">) {
    return prisma.user.count({
      where: buildUserWhere(filters)
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  upsertByTelegramId(data: UpsertUserData) {
    return prisma.user.upsert({
      where: {
        telegramId: data.telegramId
      },
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
        preferredLanguage: data.preferredLanguage
      },
      create: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
        preferredLanguage: data.preferredLanguage
      }
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive }
    });
  },

  setPreferredLanguage(id: string, preferredLanguage: PreferredLanguage) {
    return prisma.user.update({
      where: { id },
      data: { preferredLanguage }
    });
  }
};
