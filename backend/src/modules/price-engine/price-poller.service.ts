import { MarketType } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

let timer: NodeJS.Timeout | undefined;
let isRunning = false;

type MexcTicker = {
  symbol: string;
  price: string;
};

const MEXC_PRICE_ENDPOINT =
  "https://api.mexc.com/api/v3/ticker/price";

const fetchMexcPrice = async (symbol: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const url = new URL(MEXC_PRICE_ENDPOINT);
    url.searchParams.set("symbol", symbol);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        `MEXC price request failed for ${symbol}: ${response.status}`
      );
    }

    const ticker = (await response.json()) as MexcTicker;
    const numericPrice = Number(ticker.price);

    if (
      ticker.symbol?.toUpperCase() !== symbol ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      throw new Error(`Invalid MEXC price response for ${symbol}`);
    }

    return ticker.price;
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

    const results = await Promise.allSettled(
      markets.map(async (market) => {
        const symbol = market.symbol.toUpperCase();
        const price = await fetchMexcPrice(symbol);

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
