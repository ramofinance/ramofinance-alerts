import type { Alert, Market } from "../types/api";
import { apiPost } from "./http-client";

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
