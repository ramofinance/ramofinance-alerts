import type { Alert, AlertDirection, AlertStatus, PaginatedResponse } from "../types/api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./http-client";

export type CreateAlertInput = {
  userId: string;
  marketId: string;
  title?: string;
  targetPrice: string;
  direction: AlertDirection;
};

export type UpdateAlertInput = {
  title?: string | null;
  targetPrice?: string;
  direction?: AlertDirection;
};

export type GetAlertsFilters = {
  userId?: string;
  status?: string;
};

const buildAlertsQuery = (filters?: GetAlertsFilters) => {
  const params = new URLSearchParams();

  if (filters?.userId) {
    params.set("userId", filters.userId);
  }

  if (filters?.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();

  return query ? `/api/alerts?${query}` : "/api/alerts";
};

export const getAlerts = (filters?: GetAlertsFilters) => {
  return apiGet<PaginatedResponse<Alert>>(buildAlertsQuery(filters));
};

export const createAlert = (input: CreateAlertInput) => {
  return apiPost<Alert, CreateAlertInput>("/api/alerts", input);
};

export const updateAlert = (id: string, input: UpdateAlertInput) => {
  return apiPatch<Alert, UpdateAlertInput>(`/api/alerts/${id}`, input);
};

export const deleteAlert = (id: string) => {
  return apiDelete<null>(`/api/alerts/${id}`);
};

export const updateAlertStatus = (id: string, status: AlertStatus) => {
  return apiPatch<Alert, { status: AlertStatus }>(`/api/alerts/${id}/status`, {
    status
  });
};
