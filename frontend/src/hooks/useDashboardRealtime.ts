import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Alert, Market, MarketPriceHistory } from "../types/api";

type WebSocketMessage = {
  type: string;
  payload?: unknown;
};

type Props = {
  lastMessage: WebSocketMessage | null;
  userId?: string;
  activeMarketId?: string;
  setMarkets: Dispatch<SetStateAction<Market[]>>;
  setAlerts: Dispatch<SetStateAction<Alert[]>>;
  setPriceHistory: Dispatch<SetStateAction<MarketPriceHistory[]>>;
  reload: (userId?: string) => Promise<void>;
};

export function useDashboardRealtime({
  lastMessage,
  userId,
  activeMarketId,
  setMarkets,
  setAlerts,
  setPriceHistory,
  reload
}: Props) {
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === "price.updated") {
      const payload = lastMessage.payload as {
        market?: Market;
        price?: number;
      };

      if (payload.market?.id) {
        setMarkets((currentMarkets) =>
          currentMarkets.map((market) =>
            market.id === payload.market?.id
              ? { ...market, ...payload.market }
              : market
          )
        );

        if (
          payload.market.id === activeMarketId &&
          payload.price !== undefined
        ) {
          const timestamp = new Date().toISOString();

          setPriceHistory((currentHistory) => [
            ...currentHistory.slice(-119),
            {
              id: `${Date.now()}`,
              marketId: payload.market!.id,
              price: String(payload.price),
              source: "websocket",
              observedAt: timestamp,
              createdAt: timestamp
            }
          ]);
        }
      }
    }

    if (
      lastMessage.type === "alert.created" ||
      lastMessage.type === "alert.updated"
    ) {
      const payload = lastMessage.payload as { alert?: Alert };

      if (payload.alert?.userId === userId) {
        setAlerts((currentAlerts) => {
          const exists = currentAlerts.some(
            (alert) => alert.id === payload.alert?.id
          );

          if (!exists && payload.alert) {
            return [payload.alert, ...currentAlerts];
          }

          return currentAlerts.map((alert) =>
            alert.id === payload.alert?.id && payload.alert
              ? payload.alert
              : alert
          );
        });
      }
    }

    if (lastMessage.type === "alert.deleted") {
      const payload = lastMessage.payload as { alert?: Alert };

      if (payload.alert?.userId === userId) {
        setAlerts((currentAlerts) =>
          currentAlerts.filter(
            (alert) => alert.id !== payload.alert?.id
          )
        );
      }
    }

    if (lastMessage.type === "alert.triggered") {
      void reloadRef.current(userId);
    }
  }, [
    lastMessage,
    userId,
    activeMarketId,
    setMarkets,
    setAlerts,
    setPriceHistory
  ]);
}
