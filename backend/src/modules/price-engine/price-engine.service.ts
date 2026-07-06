import { AlertDirection } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { broadcastWebSocketEvent } from "../../websocket/websocket-broadcast";
import { websocketEventTypes } from "../../websocket/websocket-events";
import { priceEngineRepository } from "./price-engine.repository";

type PriceUpdateInput = {
  symbol: string;
  price: string;
};

const lastPrices = new Map<string, number>();

const shouldTriggerAlert = (
  direction: AlertDirection,
  targetPrice: number,
  currentPrice: number,
  previousPrice?: number
) => {
  switch (direction) {
    case AlertDirection.ABOVE:
      return currentPrice >= targetPrice;

    case AlertDirection.BELOW:
      return currentPrice <= targetPrice;

    case AlertDirection.CROSSING_UP:
      return previousPrice !== undefined && previousPrice < targetPrice && currentPrice >= targetPrice;

    case AlertDirection.CROSSING_DOWN:
      return previousPrice !== undefined && previousPrice > targetPrice && currentPrice <= targetPrice;

    default:
      return false;
  }
};

export const priceEngineService = {
  async processPriceUpdate(input: PriceUpdateInput) {
    const symbol = input.symbol.trim().toUpperCase();
    const currentPrice = Number(input.price);

    if (!symbol) {
      throw new AppError("symbol is required", 400);
    }

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new AppError("price must be a positive number", 400);
    }

    const market = await priceEngineRepository.findMarketBySymbol(symbol);

    if (!market) {
      throw new AppError("Market not found", 404);
    }

    if (!market.isActive) {
      throw new AppError("Market is inactive", 400);
    }

    const previousPrice = lastPrices.get(symbol);
    const activeAlerts = await priceEngineRepository.findActiveAlertsByMarketId(market.id);

    const triggeredAlerts = [];

    for (const alert of activeAlerts) {
      const targetPrice = Number(alert.targetPrice);

      if (
        shouldTriggerAlert(
          alert.direction,
          targetPrice,
          currentPrice,
          previousPrice
        )
      ) {
        const triggeredAlert = await priceEngineRepository.triggerAlert(alert.id);

        broadcastWebSocketEvent(websocketEventTypes.ALERT_TRIGGERED, {
          alert: triggeredAlert,
          price: currentPrice,
          previousPrice
        });

        triggeredAlerts.push(triggeredAlert);
      }
    }

    lastPrices.set(symbol, currentPrice);

    broadcastWebSocketEvent(websocketEventTypes.PRICE_UPDATED, {
      market,
      price: currentPrice,
      previousPrice,
      triggeredAlertsCount: triggeredAlerts.length
    });

    return {
      market,
      price: currentPrice,
      previousPrice,
      triggeredAlerts
    };
  }
};
