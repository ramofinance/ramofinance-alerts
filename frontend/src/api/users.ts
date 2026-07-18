import { apiPatch } from "./http-client";
import type { PreferredLanguage, User } from "../types/api";

export const updateUserLanguage = (
  userId: string,
  preferredLanguage: PreferredLanguage
) => {
  return apiPatch<User, { preferredLanguage: PreferredLanguage }>(
    `/api/users/${userId}/language`,
    { preferredLanguage }
  );
};
