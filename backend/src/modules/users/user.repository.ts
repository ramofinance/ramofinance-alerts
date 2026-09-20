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
  role?: UserRole;
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

  findByTelegramId(telegramId: string) {
    return prisma.user.findUnique({
      where: { telegramId }
    });
  },

  touchLastSeenByTelegramId(telegramId: string) {
    return prisma.user.update({
      where: { telegramId },
      data: {
        lastSeenAt: new Date()
      }
    });
  },

  async getMiniAppStats() {
    const activeSince = new Date(Date.now() - 2 * 60 * 1000);

    const [uniqueBotStarters, botStarts, totalUsers, totalOpens, activeNow] = await Promise.all([
      prisma.user.count({
        where: {
          firstBotStartedAt: {
            not: null
          }
        }
      }),
      prisma.user.aggregate({
        _sum: {
          botStartCount: true
        }
      }),
      prisma.user.count({
        where: {
          firstMiniAppOpenedAt: {
            not: null
          }
        }
      }),
      prisma.user.aggregate({
        _sum: {
          miniAppOpenCount: true
        }
      }),
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: activeSince
          }
        }
      })
    ]);

    return {
      uniqueBotStarters,
      totalBotStarts: botStarts._sum.botStartCount ?? 0,
      totalUsers,
      totalOpens: totalOpens._sum.miniAppOpenCount ?? 0,
      activeNow
    };
  },

  recordBotStart(telegramId: string, firstBotStartedAt?: Date | null) {
    const now = new Date();

    return prisma.user.update({
      where: { telegramId },
      data: {
        botStartCount: { increment: 1 },
        firstBotStartedAt: firstBotStartedAt ?? now,
        lastBotStartedAt: now
      }
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
        preferredLanguage: data.preferredLanguage,
        role: data.role
      },
      create: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
        preferredLanguage: data.preferredLanguage,
        role: data.role
      }
    });
  },

  recordMiniAppOpen(data: UpsertUserData) {
    const now = new Date();

    return prisma.user.upsert({
      where: {
        telegramId: data.telegramId
      },
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
        role: data.role,
        miniAppOpenCount: {
          increment: 1
        },
        lastMiniAppOpenedAt: now,
        lastSeenAt: now
      },
      create: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
        role: data.role,
        miniAppOpenCount: 1,
        firstMiniAppOpenedAt: now,
        lastMiniAppOpenedAt: now,
        lastSeenAt: now
      }
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive }
    });
  },

  setRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role }
    });
  },

  setPreferredLanguage(id: string, preferredLanguage: PreferredLanguage) {
    return prisma.user.update({
      where: { id },
      data: { preferredLanguage }
    });
  },

  setAlertNotificationSettings(
    id: string,
    repeatCount: number,
    intervalSeconds: number
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        alertNotificationRepeatCount: repeatCount,
        alertNotificationIntervalSeconds: intervalSeconds
      }
    });
  },

  findMarketById(id: string) {
    return prisma.market.findUnique({
      where: { id }
    });
  },

  listFavoriteMarkets(userId: string) {
    return prisma.userMarketFavorite.findMany({
      where: { userId },
      include: {
        market: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  },

  addFavoriteMarket(userId: string, marketId: string) {
    return prisma.userMarketFavorite.upsert({
      where: {
        userId_marketId: {
          userId,
          marketId
        }
      },
      update: {},
      create: {
        userId,
        marketId
      },
      include: {
        market: true
      }
    });
  },

  removeFavoriteMarket(userId: string, marketId: string) {
    return prisma.userMarketFavorite.deleteMany({
      where: {
        userId,
        marketId
      }
    });
  }
};
