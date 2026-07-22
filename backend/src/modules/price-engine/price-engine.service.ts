import { AlertDirection } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { resolveTelegramLanguage, telegramText } from "../../telegram/telegram.i18n";
import { scheduleTelegramAlertNotifications } from "../notifications/telegram-alert-notification.service";
import { broadcastWebSocketEvent } from "../../websocket/websocket-broadcast";
import { websocketEventTypes } from "../../websocket/websocket-events";
import { priceEngineRepository } from "./price-engine.repository";

type PriceUpdateInput = {
  symbol: string;
  price: string;
  source?: string;
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
  async getPriceHistory(symbolInput: string, limitInput = 100) {
    const symbol = symbolInput.trim().toUpperCase();
    const limit = Math.min(Math.max(limitInput, 1), 3000);

    if (!symbol) {
      throw new AppError("symbol is required", 400);
    }

    const market = await priceEngineRepository.findMarketBySymbol(symbol);

    if (!market) {
      throw new AppError("Market not found", 404);
    }

    const items = await priceEngineRepository.findMarketPriceHistory(market.id, limit);

    return {
      market,
      items: items.reverse()
    };
  },

  async processPriceUpdate(input: PriceUpdateInput) {
    const symbol = input.symbol.trim().toUpperCase();
    const cleanPrice = input.price.trim();
    const currentPrice = Number(cleanPrice);
    const source = input.source?.trim() || "manual";

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

    const previousPrice = lastPrices.get(symbol) ?? Number(market.latestPrice?.price ?? undefined);

    const latestPrice = await priceEngineRepository.upsertLatestMarketPrice(
      market.id,
      cleanPrice,
      source
    );

    await priceEngineRepository.createMarketPriceHistory(
      market.id,
      cleanPrice,
      source
    );

    const marketWithLatestPrice = {
      ...market,
      latestPrice
    };

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

        if (triggeredAlert.user.telegramId) {
          const language = resolveTelegramLanguage(
            triggeredAlert.user.preferredLanguage,
            triggeredAlert.user.languageCode ?? undefined
          );

          await scheduleTelegramAlertNotifications({
            alertId: triggeredAlert.id,
            userId: triggeredAlert.user.id,
            telegramId: triggeredAlert.user.telegramId,
            repeatCount:
              triggeredAlert.user.alertNotificationRepeatCount,
            intervalSeconds:
              triggeredAlert.user.alertNotificationIntervalSeconds,
            message: telegramText.alertTriggeredMessage(language, {
              symbol: triggeredAlert.market.symbol,
              direction: triggeredAlert.direction,
              targetPrice: triggeredAlert.targetPrice.toString(),
              currentPrice,
              title: triggeredAlert.title
            })
          });
        }

        triggeredAlerts.push(triggeredAlert);
      }
    }

    lastPrices.set(symbol, currentPrice);

    broadcastWebSocketEvent(websocketEventTypes.PRICE_UPDATED, {
      market: marketWithLatestPrice,
      price: currentPrice,
      previousPrice,
      source,
      triggeredAlertsCount: triggeredAlerts.length
    });

    return {
      market: marketWithLatestPrice,
      price: currentPrice,
      previousPrice,
      source,
      triggeredAlerts
    };
  }
};
