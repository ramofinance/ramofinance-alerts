import { PreferredLanguage } from "@prisma/client";
import { userService } from "../modules/users/user.service";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage
} from "./telegram-api";
import { telegramText } from "./telegram.i18n";
import type { TelegramCallbackQuery } from "./telegram.types";
import { upsertTelegramUserContext } from "./telegram-user-context";

export const handleTelegramCallbackQuery = async (
  callbackQuery: TelegramCallbackQuery
) => {
  const telegramUser = callbackQuery.from;

  const { user, language } = await upsertTelegramUserContext(
    telegramUser
  );

  if (callbackQuery.data === "language:FA" || callbackQuery.data === "language:EN") {
    const preferredLanguage =
      callbackQuery.data === "language:FA"
        ? PreferredLanguage.FA
        : PreferredLanguage.EN;

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
