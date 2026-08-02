import { MarketType } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

let timer: NodeJS.Timeout | undefined;
let isRunning = false;

type BinanceTicker = {
  symbol: string;
  price: string;
};

const BINANCE_PRICE_ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/ticker/price",
  "https://api.binance.com/api/v3/ticker/price"
] as const;

const fetchCryptoPrices = async (symbols: string[]) => {
  if (symbols.length === 0) {
    return new Map<string, string>();
  }

  let lastError: unknown;

  for (const endpoint of BINANCE_PRICE_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const url = new URL(endpoint);
      url.searchParams.set("symbols", JSON.stringify(symbols));
      url.searchParams.set("symbolStatus", "TRADING");

      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(
          `Binance price request failed: ${response.status}`
        );
      }

      const tickers = (await response.json()) as BinanceTicker[];
      const prices = new Map<string, string>();

      for (const ticker of tickers) {
        const symbol = ticker.symbol?.toUpperCase();
        const numericPrice = Number(ticker.price);

        if (
          symbol &&
          Number.isFinite(numericPrice) &&
          numericPrice > 0
        ) {
          prices.set(symbol, ticker.price);
        }
      }

      return prices;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Binance price endpoints failed");
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

    const symbols = markets.map((market) =>
      market.symbol.toUpperCase()
    );

    const prices = await fetchCryptoPrices(symbols);

    for (const market of markets) {
      const price = prices.get(market.symbol.toUpperCase());

      if (!price) {
        logger.warn(
          { symbol: market.symbol },
          "Price was not found in Binance response"
        );
        continue;
      }

      await priceEngineService.processPriceUpdate({
        symbol: market.symbol,
        price,
        source: "binance"
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
      source: "binance"
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
