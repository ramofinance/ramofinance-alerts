import { MarketType } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

let timer: NodeJS.Timeout | undefined;
let isRunning = false;

type BinanceTickerResponse = {
  symbol: string;
  price: string;
};

const fetchBinancePrice = async (symbol: string) => {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance price request failed for ${symbol}: ${response.status}`);
  }

  const data = (await response.json()) as BinanceTickerResponse;

  return data.price;
};

const runPricePollingTick = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const markets = await priceEngineRepository.findActiveMarketsByType(MarketType.CRYPTO);

    for (const market of markets) {
      try {
        const price = await fetchBinancePrice(market.symbol);

        await priceEngineService.processPriceUpdate({
          symbol: market.symbol,
          price,
          source: "binance"
        });
      } catch (error) {
        logger.warn(
          {
            symbol: market.symbol,
            error: error instanceof Error ? error.message : error
          },
          "Price polling failed for market"
        );
      }
    }
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
