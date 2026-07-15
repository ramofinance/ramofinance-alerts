import { userService } from "../modules/users/user.service";
import { resolveTelegramLanguage } from "./telegram.i18n";
import type { TelegramUser } from "./telegram.types";

export const upsertTelegramUserContext = async (
  telegramUser: TelegramUser
) => {
  const user = await userService.upsertTelegramUser({
    telegramId: String(telegramUser.id),
    username: telegramUser.username,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    languageCode: telegramUser.language_code
  });

  const language = resolveTelegramLanguage(
    user.preferredLanguage,
    telegramUser.language_code
  );

  return {
    user,
    language
  };
};
