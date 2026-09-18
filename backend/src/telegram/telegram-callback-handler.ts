import { PreferredLanguage } from "@prisma/client";
import { userService } from "../modules/users/user.service";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage
} from "./telegram-api";
import { telegramText } from "./telegram.i18n";
import type { TelegramCallbackQuery } from "./telegram.types";
import { upsertTelegramUserContext } from "./telegram-user-context";
import { handleAdminCallback } from "./telegram-admin-access";

export const handleTelegramCallbackQuery = async (
  callbackQuery: TelegramCallbackQuery
) => {
  const telegramUser = callbackQuery.from;

  const { user, language } = await upsertTelegramUserContext(
    telegramUser
  );

  const adminResult = await handleAdminCallback(callbackQuery, user);
  if (adminResult) {
    return { processed: true, command: "admin_callback", language, user, sendResult: adminResult };
  }

  const languageByCallback: Partial<Record<string, PreferredLanguage>> = {
    "language:FA": PreferredLanguage.FA,
    "language:EN": PreferredLanguage.EN,
    "language:AR": PreferredLanguage.AR,
    "language:ES": PreferredLanguage.ES,
    "language:ZH": PreferredLanguage.ZH
  };
  const callbackLanguage = callbackQuery.data
    ? languageByCallback[callbackQuery.data]
    : undefined;

  if (callbackLanguage) {
    const preferredLanguage = callbackLanguage;

    const updatedUser = await userService.setUserPreferredLanguage(
      user.id,
      preferredLanguage
    );

    const callbackAnswerResult = await answerTelegramCallbackQuery(
      callbackQuery.id,
      telegramText.languageChangedMessage(preferredLanguage)
    );

    const sendResult = callbackQuery.message
      ? await sendTelegramMessage(
          callbackQuery.message.chat.id,
          telegramText.languageChangedMessage(preferredLanguage)
        )
      : {
          sent: false,
          reason: "Callback query message is not available"
        };

    return {
      processed: true,
      command: "set_language_callback",
      language: preferredLanguage,
      user: updatedUser,
      callbackAnswerResult,
      sendResult
    };
  }

  const callbackAnswerResult = await answerTelegramCallbackQuery(
    callbackQuery.id,
    telegramText.fallbackMessage(language)
  );

  return {
    processed: true,
    command: "unsupported_callback",
    language,
    user,
    callbackAnswerResult
  };
};
