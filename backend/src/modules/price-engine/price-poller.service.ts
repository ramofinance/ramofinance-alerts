import { MarketType } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

let timer: NodeJS.Timeout | undefined;
let isRunning = false;
let pollingTickCount = 0;

const PRICE_HISTORY_RETENTION_PER_MARKET = 3000;
const PRICE_HISTORY_CLEANUP_INTERVAL_TICKS = 120;

type MexcTicker = {
  symbol: string;
  price: string;
};

const MEXC_PRICE_ENDPOINT =
  "https://api.mexc.com/api/v3/ticker/price";

const fetchMexcPrices = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(MEXC_PRICE_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        `MEXC price request failed: ${response.status}`
      );
    }

    const tickers = (await response.json()) as MexcTicker[];
    return new Map(
      tickers
        .filter((ticker) => Number.isFinite(Number(ticker.price)) && Number(ticker.price) > 0)
        .map((ticker) => [ticker.symbol.toUpperCase(), ticker.price])
    );
  } finally {
    clearTimeout(timeout);
  }
};

const runPricePollingTick = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const markets = await priceEngineRepository.findActiveMarketsByType(
      MarketType.CRYPTO
    );
    const prices = await fetchMexcPrices();

    const results = await Promise.allSettled(
      markets.map(async (market) => {
        const symbol = market.symbol.toUpperCase();
        const price = prices.get(symbol);

        if (!price) {
          throw new Error(`MEXC price is unavailable for ${symbol}`);
        }

        await priceEngineService.processPriceUpdate({
          symbol: market.symbol,
          price,
          source: "mexc"
        });

        return symbol;
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.warn(
          {
            symbol: markets[index]?.symbol,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : result.reason
          },
          "MEXC price update failed"
        );
      }
    });

    pollingTickCount += 1;

    const shouldCleanupHistory =
      pollingTickCount === 1 ||
      pollingTickCount % PRICE_HISTORY_CLEANUP_INTERVAL_TICKS === 0;

    if (shouldCleanupHistory) {
      const allActiveMarkets =
        await priceEngineRepository.findActiveMarkets();

      const cleanupResults = await Promise.allSettled(
        allActiveMarkets.map((market) =>
          priceEngineRepository.pruneMarketPriceHistory(
            market.id,
            PRICE_HISTORY_RETENTION_PER_MARKET
          )
        )
      );

      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.warn(
            {
              symbol: allActiveMarkets[index]?.symbol,
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : result.reason
            },
            "Price history cleanup failed"
          );
        }
      });
    }
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : error
      },
      "Price polling failed"
    );
  } finally {
    isRunning = false;
  }
};

export const startPricePolling = () => {
  if (!env.PRICE_POLLING_ENABLED) {
    logger.info("Price polling is disabled");
    return;
  }

  if (timer) {
    return;
  }

  logger.info(
    {
      intervalMs: env.PRICE_POLLING_INTERVAL_MS,
      source: "mexc"
    },
    "Starting price polling"
  );

  void runPricePollingTick();

  timer = setInterval(() => {
    void runPricePollingTick();
  }, env.PRICE_POLLING_INTERVAL_MS);
};

export const stopPricePolling = () => {
  if (!timer) {
    return;
  }

  clearInterval(timer);
  timer = undefined;
};
