import { frontendEnv } from "../config/env";
import type { ApiResponse } from "../types/api";

type ApiErrorResponse = {
  success?: false;
  error?: {
    message?: string;
  };
};

const buildUrl = (path: string) => {
  return `${frontendEnv.apiUrl}${path}`;
};

const telegramHeaders = (): Record<string, string> => {
  const initData = window.Telegram?.WebApp?.initData;

  return initData
    ? { "X-Telegram-Init-Data": initData }
    : {};
};

const parseApiResponse = async <TData>(response: Response): Promise<TData> => {
  const json = (await response.json()) as ApiResponse<TData> | ApiErrorResponse;

  if (!response.ok || json.success === false) {
    const errorResponse = json as ApiErrorResponse;
    throw new Error(errorResponse.error?.message ?? "API request failed");
  }

  return (json as ApiResponse<TData>).data;
};

type RequestOptions = {
  headers?: Record<string, string>;
};

export const apiGet = async <TData>(
  path: string,
  options?: RequestOptions
): Promise<TData> => {
  const response = await fetch(buildUrl(path), {
    headers: {
      ...telegramHeaders(),
      ...options?.headers
    }
  });

  return parseApiResponse<TData>(response);
};

export const apiPost = async <TData, TBody extends object>(
  path: string,
  body: TBody,
  options?: RequestOptions
): Promise<TData> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...telegramHeaders(),
      ...options?.headers
    },
    body: JSON.stringify(body)
  });

  return parseApiResponse<TData>(response);
};

export const apiPatch = async <TData, TBody extends object>(
  path: string,
  body: TBody
): Promise<TData> => {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...telegramHeaders()
    },
    body: JSON.stringify(body)
  });

  return parseApiResponse<TData>(response);
};


export const apiDelete = async <TData>(path: string): Promise<TData> => {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: telegramHeaders()
  });

  return parseApiResponse<TData>(response);
};
