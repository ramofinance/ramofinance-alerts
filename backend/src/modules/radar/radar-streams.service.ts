import WebSocket from "ws";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

type LiquidationEvent = {
  timestamp: number;
  symbol: string;
  side: "BUY" | "SELL";
  usdValue: number;
};

type WhaleEvent = {
  timestamp: number;
  symbol: string;
  usdValue: number;
  from: string;
  to: string;
};

const LIQUIDATION_WINDOW_MS = 60 * 60 * 1000;
const WHALE_WINDOW_MS = 60 * 60 * 1000;
const RECONNECT_MS = 10_000;
const EXCHANGE_WORDS = [
  "binance", "coinbase", "kraken", "okx", "bybit", "kucoin", "bitfinex",
  "bitstamp", "gate.io", "gateio", "crypto.com", "huobi", "htx", "gemini",
  "bitget", "mexc", "upbit", "bithumb"
];

const liquidations: LiquidationEvent[] = [];
const whaleEvents: WhaleEvent[] = [];
let liquidationSocket: WebSocket | undefined;
let whaleSocket: WebSocket | undefined;
let liquidationReconnect: NodeJS.Timeout | undefined;
let whaleReconnect: NodeJS.Timeout | undefined;
let stopped = true;

const prune = () => {
  const now = Date.now();
  while (liquidations.length && now - liquidations[0]!.timestamp > LIQUIDATION_WINDOW_MS) liquidations.shift();
  while (whaleEvents.length && now - whaleEvents[0]!.timestamp > WHALE_WINDOW_MS) whaleEvents.shift();
};

const isExchange = (value: string) => {
  const normalized = value.toLowerCase();
  return EXCHANGE_WORDS.some((word) => normalized.includes(word));
};

const scheduleLiquidationReconnect = () => {
  if (stopped || liquidationReconnect) return;
  liquidationReconnect = setTimeout(() => {
    liquidationReconnect = undefined;
    connectLiquidations();
  }, RECONNECT_MS);
};

const connectLiquidations = () => {
  if (stopped || liquidationSocket) return;
  const socket = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
  liquidationSocket = socket;

  socket.on("open", () => logger.info("Radar Binance liquidation stream connected"));
  socket.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      const events = Array.isArray(parsed) ? parsed : [parsed];
      for (const event of events) {
        const order = event?.o ?? event?.data?.o;
        if (!order?.s) continue;
        const price = Number(order.ap ?? order.p ?? 0);
        const quantity = Number(order.z ?? order.q ?? 0);
        const usdValue = price * quantity;
        if (!Number.isFinite(usdValue) || usdValue <= 0) continue;
        liquidations.push({
          timestamp: Number(event.E ?? event.data?.E ?? Date.now()),
          symbol: String(order.s).toUpperCase(),
          side: String(order.S).toUpperCase() === "BUY" ? "BUY" : "SELL",
          usdValue
        });
      }
      prune();
    } catch {
      // Ignore malformed stream payloads; the stream is best-effort enrichment.
    }
  });
  socket.on("close", () => {
    liquidationSocket = undefined;
    scheduleLiquidationReconnect();
  });
  socket.on("error", (error) => {
    logger.warn({ error: error.message }, "Radar liquidation stream error");
    socket.close();
  });
};

const scheduleWhaleReconnect = () => {
  if (stopped || !env.WHALE_ALERT_API_KEY || whaleReconnect) return;
  whaleReconnect = setTimeout(() => {
    whaleReconnect = undefined;
    connectWhaleAlert();
  }, RECONNECT_MS);
};

const connectWhaleAlert = () => {
  if (stopped || !env.WHALE_ALERT_API_KEY || whaleSocket) return;
  const socket = new WebSocket(`wss://leviathan.whale-alert.io/ws?api_key=${encodeURIComponent(env.WHALE_ALERT_API_KEY)}`);
  whaleSocket = socket;

  socket.on("open", () => {
    logger.info("Radar Whale Alert stream connected");
    socket.send(JSON.stringify({
      type: "subscribe_alerts",
      id: "ramo-radar-v3.3",
      tx_types: ["transfer"],
      min_value_usd: env.RADAR_WHALE_ALERT_MIN_USD
    }));
  });
  socket.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      if (payload?.type !== "alert" || !Array.isArray(payload.amounts)) return;
      const timestamp = Number(payload.timestamp ? payload.timestamp * 1000 : Date.now());
      for (const amount of payload.amounts) {
        const usdValue = Number(amount?.value_usd ?? 0);
        const symbol = String(amount?.symbol ?? "").toUpperCase();
        if (!symbol || !Number.isFinite(usdValue) || usdValue < env.RADAR_WHALE_ALERT_MIN_USD) continue;
        whaleEvents.push({
          timestamp,
          symbol,
          usdValue,
          from: String(payload.from ?? "unknown wallet"),
          to: String(payload.to ?? "unknown wallet")
        });
      }
      prune();
    } catch {
      // Best-effort enrichment.
    }
  });
  socket.on("close", () => {
    whaleSocket = undefined;
    scheduleWhaleReconnect();
  });
  socket.on("error", (error) => {
    logger.warn({ error: error.message }, "Radar Whale Alert stream error");
    socket.close();
  });
};

export const getLiquidationMetrics = (symbol: string) => {
  prune();
  const normalized = symbol.toUpperCase();
  let shortLiquidationUsd = 0;
  let longLiquidationUsd = 0;
  for (const event of liquidations) {
    if (event.symbol !== normalized) continue;
    // Forced BUY closes a short; forced SELL closes a long.
    if (event.side === "BUY") shortLiquidationUsd += event.usdValue;
    else longLiquidationUsd += event.usdValue;
  }
  return { shortLiquidationUsd, longLiquidationUsd };
};

export const getDirectOnchainMetrics = (baseAsset: string) => {
  prune();
  const normalized = baseAsset.toUpperCase();
  let onchainWhaleUsd = 0;
  let exchangeOutflowUsd = 0;
  let exchangeInflowUsd = 0;
  for (const event of whaleEvents) {
    if (event.symbol !== normalized) continue;
    onchainWhaleUsd += event.usdValue;
    const fromExchange = isExchange(event.from);
    const toExchange = isExchange(event.to);
    if (fromExchange && !toExchange) exchangeOutflowUsd += event.usdValue;
    if (!fromExchange && toExchange) exchangeInflowUsd += event.usdValue;
  }
  return { onchainWhaleUsd, exchangeOutflowUsd, exchangeInflowUsd };
};

export const startRadarStreams = () => {
  if (!stopped) return;
  stopped = false;
  connectLiquidations();
  connectWhaleAlert();
};

export const stopRadarStreams = () => {
  stopped = true;
  if (liquidationReconnect) clearTimeout(liquidationReconnect);
  if (whaleReconnect) clearTimeout(whaleReconnect);
  liquidationReconnect = undefined;
  whaleReconnect = undefined;
  liquidationSocket?.close();
  whaleSocket?.close();
  liquidationSocket = undefined;
  whaleSocket = undefined;
};
