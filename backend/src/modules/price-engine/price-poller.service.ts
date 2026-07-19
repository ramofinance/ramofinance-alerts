import { MarketType } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

let timer: NodeJS.Timeout | undefined;
let isRunning = false;

type CoinPaprikaTicker = {
  symbol: string;
  quotes?: {
    USD?: {
      price?: number;
    };
  };
};

const fetchCryptoPrices = async () => {
  const response = await fetch(
    "https://api.coinpaprika.com/v1/tickers?quotes=USD"
  );

  if (!response.ok) {
    throw new Error(`CoinPaprika price request failed: ${response.status}`);
  }

  const tickers = (await response.json()) as CoinPaprikaTicker[];
  const prices = new Map<string, string>();

  for (const ticker of tickers) {
    const price = ticker.quotes?.USD?.price;

    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      prices.set(`${ticker.symbol.toUpperCase()}USDT`, String(price));
    }
  }

  return prices;
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

    const prices = await fetchCryptoPrices();

    for (const market of markets) {
      const price = prices.get(market.symbol);

      if (!price) {
        logger.warn(
          { symbol: market.symbol },
          "Price was not found in CoinPaprika response"
        );
        continue;
      }

      await priceEngineService.processPriceUpdate({
        symbol: market.symbol,
        price,
        source: "coinpaprika"
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
      intervalMs: env.PRICE_POLLING_INTERVAL_MS
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
