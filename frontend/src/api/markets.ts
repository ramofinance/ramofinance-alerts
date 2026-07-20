import type { Market, PaginatedResponse } from "../types/api";
import { apiGet } from "./http-client";

export const getMarkets = () => {
  return apiGet<PaginatedResponse<Market>>("/api/markets?limit=100");
};
