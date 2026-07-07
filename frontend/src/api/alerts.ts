import type { Alert, AlertDirection, PaginatedResponse } from "../types/api";
import { apiGet, apiPost } from "./http-client";

export type CreateAlertInput = {
  userId: string;
  marketId: string;
  title?: string;
  targetPrice: string;
  direction: AlertDirection;
};

export const getAlerts = () => {
  return apiGet<PaginatedResponse<Alert>>("/api/alerts");
};

export const createAlert = (input: CreateAlertInput) => {
  return apiPost<Alert, CreateAlertInput>("/api/alerts", input);
};
