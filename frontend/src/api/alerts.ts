import type { Alert, PaginatedResponse } from "../types/api";
import { apiGet } from "./http-client";

export const getAlerts = () => {
  return apiGet<PaginatedResponse<Alert>>("/api/alerts");
};
