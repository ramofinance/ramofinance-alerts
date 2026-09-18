import { randomBytes } from "node:crypto";
import { UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";

const normalizeUsername = (value: string) =>
  value.trim().replace(/^@/, "").toLowerCase();

export const radarAccessService = {
  async list() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ role: UserRole.ADMIN }, { radarPreviewAccess: true }]
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        radarPreviewAccess: true
      },
      orderBy: [{ role: "desc" }, { username: "asc" }],
      take: 50
    });
  },

  async grantByUsername(usernameInput: string) {
    const username = normalizeUsername(usernameInput);
    if (!username) return null;

    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) return null;

    return prisma.user.update({
      where: { id: user.id },
      data: { radarPreviewAccess: true }
    });
  },

  async revokeByUsername(usernameInput: string) {
    const username = normalizeUsername(usernameInput);
    if (!username) return null;

    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user || user.role === UserRole.ADMIN) return null;

    return prisma.user.update({
      where: { id: user.id },
      data: {
        radarPreviewAccess: false,
        radarNotificationsEnabled: false
      }
    });
  },

  async revokeById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === UserRole.ADMIN) return null;

    return prisma.user.update({
      where: { id: user.id },
      data: {
        radarPreviewAccess: false,
        radarNotificationsEnabled: false
      }
    });
  },

  async createInvite(createdByUserId: string) {
    const token = randomBytes(18).toString("base64url");
    const invite = await prisma.radarAccessInvite.create({
      data: {
        token,
        createdByUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      ...invite,
      link: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=radar_${token}`
    };
  },

  async redeemInvite(token: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invite = await tx.radarAccessInvite.findUnique({ where: { token } });
      if (!invite || invite.revokedAt || invite.redeemedAt || invite.expiresAt <= new Date()) {
        return false;
      }

      const claimed = await tx.radarAccessInvite.updateMany({
        where: { id: invite.id, redeemedAt: null, revokedAt: null },
        data: { redeemedAt: new Date(), redeemedByUserId: userId }
      });
      if (!claimed.count) return false;

      await tx.user.update({
        where: { id: userId },
        data: { radarPreviewAccess: true }
      });
      return true;
    });
  }
};
