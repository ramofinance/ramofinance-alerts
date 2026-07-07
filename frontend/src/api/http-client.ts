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
    headers: options?.headers
  });

  return parseApiResponse<TData>(response);
};

export const apiPost = async <TData, TBody extends object>(
  path: string,
  body: TBody
): Promise<TData> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return parseApiResponse<TData>(response);
};
