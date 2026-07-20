import { MarketType } from "@prisma/client";
import WebSocket from "ws";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { priceEngineRepository } from "./price-engine.repository";
import { priceEngineService } from "./price-engine.service";

const FINNHUB_SYMBOLS: Record<string, string> = {
  EURUSD: "OANDA:EUR_USD",
  GBPUSD: "OANDA:GBP_USD",
  USDJPY: "OANDA:USD_JPY",
  USDCHF: "OANDA:USD_CHF",
  AUDUSD: "OANDA:AUD_USD",
  USDCAD: "OANDA:USD_CAD",
  NZDUSD: "OANDA:NZD_USD",
  XAUUSD: "OANDA:XAU_USD"
};

const INTERNAL_SYMBOLS = new Map(
  Object.entries(FINNHUB_SYMBOLS).map(([internal, external]) => [
    external,
    internal
  ])
);

let socket: WebSocket | undefined;
let reconnectTimer: NodeJS.Timeout | undefined;
let isStopping = false;

const lastProcessedAt = new Map<string, number>();

type FinnhubMessage = {
  type?: string;
  data?: Array<{
    s?: string;
    p?: number;
  }>;
};

const scheduleReconnect = () => {
  if (isStopping || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    void connectFinnhub();
  }, 5000);
};

const connectFinnhub = async () => {
  if (!env.FINNHUB_API_KEY || isStopping) {
    return;
  }

  try {
    const [forexMarkets, commodityMarkets] = await Promise.all([
      priceEngineRepository.findActiveMarketsByType(MarketType.FOREX),
      priceEngineRepository.findActiveMarketsByType(MarketType.COMMODITY)
    ]);

    const activeSymbols = new Set(
      [...forexMarkets, ...commodityMarkets].map((market) => market.symbol)
    );

    const subscriptions = Object.entries(FINNHUB_SYMBOLS).filter(([symbol]) =>
      activeSymbols.has(symbol)
    );

    if (subscriptions.length === 0) {
      logger.info("No active Finnhub markets found");
      return;
    }

    const ws = new WebSocket(
      `wss://ws.finnhub.io?token=${encodeURIComponent(env.FINNHUB_API_KEY)}`
    );

    socket = ws;

    ws.on("open", () => {
      for (const [, finnhubSymbol] of subscriptions) {
        ws.send(
          JSON.stringify({
            type: "subscribe",
            symbol: finnhubSymbol
          })
        );
      }

      logger.info(
        { symbols: subscriptions.map(([symbol]) => symbol) },
        "Finnhub price stream connected"
      );
    });

    ws.on("message", (rawData) => {
      let message: FinnhubMessage;

      try {
        message = JSON.parse(rawData.toString()) as FinnhubMessage;
      } catch {
        return;
      }

      if (message.type !== "trade") {
        return;
      }

      for (const trade of message.data ?? []) {
        const internalSymbol = trade.s
          ? INTERNAL_SYMBOLS.get(trade.s)
          : undefined;

        if (
          !internalSymbol ||
          typeof trade.p !== "number" ||
          !Number.isFinite(trade.p) ||
          trade.p <= 0
        ) {
          continue;
        }

        const now = Date.now();
        const previousTime = lastProcessedAt.get(internalSymbol) ?? 0;

        if (now - previousTime < env.PRICE_POLLING_INTERVAL_MS) {
          continue;
        }

        lastProcessedAt.set(internalSymbol, now);

        void priceEngineService.processPriceUpdate({
          symbol: internalSymbol,
          price: String(trade.p),
          source: "finnhub-oanda"
        });
      }
    });

    ws.on("error", (error) => {
      logger.warn({ error: error.message }, "Finnhub stream error");
    });

    ws.on("close", () => {
      if (socket === ws) {
        socket = undefined;
      }

      logger.warn("Finnhub price stream disconnected");
      scheduleReconnect();
    });
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : error },
      "Finnhub stream connection failed"
    );

    scheduleReconnect();
  }
};

export const startFinnhubStreaming = () => {
  if (!env.FINNHUB_API_KEY) {
    logger.info("Finnhub streaming is disabled");
    return;
  }

  isStopping = false;
  void connectFinnhub();
};

export const stopFinnhubStreaming = () => {
  isStopping = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  socket?.close();
  socket = undefined;
};
