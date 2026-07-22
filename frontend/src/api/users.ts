import { apiDelete, apiGet, apiPatch, apiPost } from "./http-client";
import type { Market, PreferredLanguage, User } from "../types/api";

export const updateUserLanguage = (
  userId: string,
  preferredLanguage: PreferredLanguage
) => {
  return apiPatch<User, { preferredLanguage: PreferredLanguage }>(
    `/api/users/${userId}/language`,
    { preferredLanguage }
  );
};

export const getUserFavoriteMarkets = (userId: string) => {
  return apiGet<Market[]>(`/api/users/${userId}/favorites`);
};

export const addUserFavoriteMarket = (
  userId: string,
  marketId: string
) => {
  return apiPost<Market, Record<string, never>>(
    `/api/users/${userId}/favorites/${marketId}`,
    {}
  );
};

export const removeUserFavoriteMarket = (
  userId: string,
  marketId: string
) => {
  return apiDelete<null>(
    `/api/users/${userId}/favorites/${marketId}`
  );
};
