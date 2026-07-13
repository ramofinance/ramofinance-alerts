import type { Alert, Market, MarketPriceHistory } from "../types/api";
import { apiGet, apiPost } from "./http-client";

type PriceUpdateResponse = {
  market: Market;
  price: number;
  previousPrice?: number;
  triggeredAlerts: Alert[];
};

export const updatePrice = (symbol: string, price: string) => {
  return apiPost<PriceUpdateResponse, { symbol: string; price: string }>(
    "/api/prices/update",
    {
      symbol,
      price
    }
  );
};


export type PriceHistoryResponse = {
  market: Market;
  items: MarketPriceHistory[];
};

export const getPriceHistory = (symbol: string, limit = 120) => {
  return apiGet<PriceHistoryResponse>(
    `/api/prices/${encodeURIComponent(symbol)}/history?limit=${limit}`
  );
};
