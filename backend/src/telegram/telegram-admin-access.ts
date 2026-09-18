import { UserRole, type User } from "@prisma/client";
import { radarAccessService } from "../modules/radar/radar-access.service";
import { answerTelegramCallbackQuery, sendTelegramMessage } from "./telegram-api";
import type { TelegramCallbackQuery } from "./telegram.types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const adminMenu = {
  inline_keyboard: [
    [{ text: "📋 افراد دارای دسترسی", callback_data: "admin:radar:list" }],
    [
      { text: "➕ افزودن با نام کاربری", callback_data: "admin:radar:help" },
      { text: "🔗 ساخت لینک دعوت", callback_data: "admin:radar:invite" }
    ]
  ]
};

const adminText = [
  "🛡 <b>مدیریت دسترسی رادار</b>",
  "",
  "از دکمه‌های زیر استفاده کن.",
  "لینک دعوت یک‌بارمصرف است و ۷ روز اعتبار دارد."
].join("\n");

const userLabel = (user: {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramId: string | null;
}) => user.username
  ? `@${user.username}`
  : [user.firstName, user.lastName].filter(Boolean).join(" ") || user.telegramId || "Unknown";

const sendAccessList = async (chatId: number | string) => {
  const users = await radarAccessService.list();
  const lines = users.map((item, index) =>
    `${index + 1}. ${escapeHtml(userLabel(item))}${item.role === UserRole.ADMIN ? " — ادمین" : ""}`
  );
  const removable = users.filter((item) => item.role !== UserRole.ADMIN && item.radarPreviewAccess);
  const inline_keyboard = removable.map((item) => [{
    text: `❌ حذف ${userLabel(item)}`.slice(0, 60),
    callback_data: `admin:radar:revoke:${item.id}`
  }]);
  inline_keyboard.push([{ text: "🔙 منوی مدیریت", callback_data: "admin:radar:menu" }]);

  return sendTelegramMessage(
    chatId,
    ["👥 <b>افراد دارای دسترسی رادار</b>", "", ...(lines.length ? lines : ["هنوز کسی اضافه نشده است."])].join("\n"),
    { inline_keyboard }
  );
};

export const handleAdminTextCommand = async (
  text: string,
  chatId: number | string,
  user: User
) => {
  const command = text.trim();
  const isAdminCommand = /^\/(admin|grant|revoke|accesslist)(?:@\w+)?(?:\s|$)/i.test(command);
  if (!isAdminCommand) return null;

  if (user.role !== UserRole.ADMIN) {
    return sendTelegramMessage(chatId, "⛔️ این بخش فقط برای مدیران فعال است.");
  }

  if (/^\/admin(?:@\w+)?(?:\s|$)/i.test(command)) {
    return sendTelegramMessage(chatId, adminText, adminMenu);
  }

  if (/^\/accesslist(?:@\w+)?(?:\s|$)/i.test(command)) {
    return sendAccessList(chatId);
  }

  const grantMatch = command.match(/^\/grant(?:@\w+)?\s+(@?[A-Za-z0-9_]{5,32})$/i);
  if (grantMatch) {
    const granted = await radarAccessService.grantByUsername(grantMatch[1]);
    return granted
      ? sendTelegramMessage(chatId, `✅ دسترسی رادار برای ${escapeHtml(userLabel(granted))} فعال شد.`)
      : sendTelegramMessage(chatId, "کاربر پیدا نشد. ابتدا باید بات را /start کند؛ یا از منوی /admin برایش لینک دعوت بساز.");
  }

  const revokeMatch = command.match(/^\/revoke(?:@\w+)?\s+(@?[A-Za-z0-9_]{5,32})$/i);
  if (revokeMatch) {
    const revoked = await radarAccessService.revokeByUsername(revokeMatch[1]);
    return revoked
      ? sendTelegramMessage(chatId, `✅ دسترسی رادار برای ${escapeHtml(userLabel(revoked))} حذف شد.`)
      : sendTelegramMessage(chatId, "کاربر پیدا نشد یا حساب موردنظر ادمین است.");
  }

  return sendTelegramMessage(chatId, "فرمت درست:\n<code>/grant @username</code>\n<code>/revoke @username</code>");
};

export const handleAdminCallback = async (
  callbackQuery: TelegramCallbackQuery,
  user: User
) => {
  const data = callbackQuery.data ?? "";
  if (!data.startsWith("admin:radar:")) return null;

  if (user.role !== UserRole.ADMIN) {
    return answerTelegramCallbackQuery(callbackQuery.id, "دسترسی مدیر لازم است");
  }

  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) return answerTelegramCallbackQuery(callbackQuery.id, "گفت‌وگو در دسترس نیست");

  await answerTelegramCallbackQuery(callbackQuery.id);

  if (data === "admin:radar:menu") {
    return sendTelegramMessage(chatId, adminText, adminMenu);
  }
  if (data === "admin:radar:list") {
    return sendAccessList(chatId);
  }
  if (data === "admin:radar:help") {
    return sendTelegramMessage(
      chatId,
      "➕ <b>افزودن با نام کاربری</b>\n\nاگر کاربر قبلاً بات را استارت کرده، این دستور را بفرست:\n<code>/grant @username</code>\n\nبرای حذف:\n<code>/revoke @username</code>",
      adminMenu
    );
  }
  if (data === "admin:radar:invite") {
    const invite = await radarAccessService.createInvite(user.id);
    return sendTelegramMessage(
      chatId,
      `🔗 <b>لینک دعوت یک‌بارمصرف</b>\n\n${invite.link}\n\nاین لینک تا ۷ روز معتبر است و فقط یک نفر می‌تواند از آن استفاده کند.`,
      adminMenu
    );
  }
  if (data.startsWith("admin:radar:revoke:")) {
    const targetId = data.slice("admin:radar:revoke:".length);
    const revoked = await radarAccessService.revokeById(targetId);
    await sendTelegramMessage(chatId, revoked ? `✅ دسترسی ${escapeHtml(userLabel(revoked))} حذف شد.` : "امکان حذف این دسترسی وجود ندارد.");
    return sendAccessList(chatId);
  }

  return sendTelegramMessage(chatId, adminText, adminMenu);
};
