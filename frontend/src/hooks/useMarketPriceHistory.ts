import { useEffect, useState } from "react";
import { getPriceHistory } from "../api/prices";
import type { MarketPriceHistory } from "../types/api";

export function useMarketPriceHistory(symbol?: string) {
  const [priceHistory, setPriceHistory] = useState<MarketPriceHistory[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!symbol) {
      setPriceHistory([]);

      return () => {
        cancelled = true;
      };
    }

    getPriceHistory(symbol, 120)
      .then((result) => {
        if (!cancelled) {
          setPriceHistory(result.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceHistory([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return {
    priceHistory,
    setPriceHistory
  };
}
