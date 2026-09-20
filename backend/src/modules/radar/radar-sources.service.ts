import { logger } from "../../utils/logger";

const REQUEST_TIMEOUT_MS = 15_000;
const COINGECKO_PAGE_SIZE = 250;
const COINGECKO_PAGES = 4;
const TELEGRAM_LOOKBACK_MS = 6 * 60 * 60 * 1000;
const TELEGRAM_CHANNELS = [
  "cointrendz_whalehunter",
  "WhaleSniper",
  "whalebotalerts",
  "DeFiSniper",
  "WallMonitor",
  "cryptoquant_alert",
  "whale_alert_io",
  "whalebotpumps",
  "BinanceLiquidations",
  "REKTbinance"
] as const;

const STABLES = new Set(["USDT", "USDC", "FDUSD", "TUSD", "USDP", "DAI", "BUSD"]);
const TELEGRAM_STOP_WORDS = new Set([
  "THE", "AND", "FOR", "FROM", "WITH", "LONG", "SHORT", "BUY", "SELL", "USD", "USDT", "USDC",
  "PUMP", "WHALE", "ALERT", "BINANCE", "BYBIT", "OKX", "DEX", "CEX", "NEW", "NOW", "PRICE", "VOLUME"
]);

export type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  market_cap: number | null;
  total_volume: number | null;
};

export type CexVenue = "Binance" | "Bybit" | "OKX";
export type CexQuote = {
  venue: CexVenue;
  symbol: string;
  instrumentId: string;
  baseAsset: string;
  price: number;
  quoteVolume24h: number;
  priceChange24h: number;
  tradeCount24h: number;
};

export type CexUniverseItem = {
  baseAsset: string;
  venues: CexQuote[];
};

export type ChannelIntelligence = {
  confirmations: number;
  channels: string[];
  mentions: string[];
  onchainWhaleUsd: number;
  exchangeOutflowUsd: number;
  exchangeInflowUsd: number;
};

export type DexSnapshot = {
  symbol: string;
  name: string;
  chainId: string;
  dexId: string;
  pairAddress: string | null;
  tokenAddress: string | null;
  url: string | null;
  price: number;
  marketCap: number;
  volume24h: number;
  liquidityUsd: number;
  turnover24h: number;
  buySellImbalance: number;
  priceChange24h: number;
  buys24h: number;
  sells24h: number;
  uniqueBuyers24h: number;
  uniqueSellers24h: number;
};

export type CexDeepMetrics = {
  volume72h: number;
  volumeAcceleration: number;
  buySellImbalance: number;
  whaleBuyVolumeUsd: number;
  whaleSellVolumeUsd: number;
  whaleTradeCount: number;
  bidWallImbalance: number;
  openInterestChange: number;
  fundingRate: number;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fetchWithTimeout = async (url: string, accept = "application/json") => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: accept,
        "User-Agent": "RAMO-Finance-Radar/3.4"
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetchWithTimeout(url);
  return await response.json() as T;
};

const fetchText = async (url: string) => {
  const response = await fetchWithTimeout(url, "text/html,application/xhtml+xml");
  return response.text();
};

export const loadCoinGeckoMarkets = async () => {
  const requests = Array.from({ length: COINGECKO_PAGES }, (_, index) => {
    const page = index + 1;
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${COINGECKO_PAGE_SIZE}&page=${page}&sparkline=false`;
    return fetchJson<CoinGeckoMarket[]>(url);
  });
  const settled = await Promise.allSettled(requests);
  const items = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!items.length) throw new Error("CoinGecko market universe unavailable");

  const map = new Map<string, CoinGeckoMarket>();
  for (const item of items) {
    const symbol = item.symbol.toUpperCase();
    const current = map.get(symbol);
    if (!current || (item.market_cap ?? 0) > (current.market_cap ?? 0)) map.set(symbol, item);
  }
  return map;
};

type BinanceTicker = { symbol: string; lastPrice: string; quoteVolume: string; priceChangePercent: string; count?: number };
type BybitTickerResponse = { result?: { list?: Array<{ symbol: string; lastPrice: string; turnover24h?: string; price24hPcnt?: string }> } };
type OkxTickerResponse = { data?: Array<{ instId: string; last: string; open24h?: string; volCcy24h?: string }> };

const loadBinanceTickers = async (): Promise<CexQuote[]> => {
  try {
    const items = await fetchJson<BinanceTicker[]>("https://api.binance.com/api/v3/ticker/24hr");
    return items.filter((item) => item.symbol.endsWith("USDT")).map((item) => {
      const baseAsset = item.symbol.slice(0, -4).toUpperCase();
      return {
        venue: "Binance" as const,
        symbol: item.symbol,
        instrumentId: item.symbol,
        baseAsset,
        price: safeNumber(item.lastPrice),
        quoteVolume24h: safeNumber(item.quoteVolume),
        priceChange24h: safeNumber(item.priceChangePercent),
        tradeCount24h: safeNumber(item.count)
      };
    });
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : error }, "Radar Binance ticker source unavailable");
    return [];
  }
};

const loadBybitTickers = async (): Promise<CexQuote[]> => {
  try {
    const response = await fetchJson<BybitTickerResponse>("https://api.bybit.com/v5/market/tickers?category=spot");
    return (response.result?.list ?? []).filter((item) => item.symbol.endsWith("USDT")).map((item) => {
      const baseAsset = item.symbol.slice(0, -4).toUpperCase();
      return {
        venue: "Bybit" as const,
        symbol: item.symbol,
        instrumentId: item.symbol,
        baseAsset,
        price: safeNumber(item.lastPrice),
        quoteVolume24h: safeNumber(item.turnover24h),
        priceChange24h: safeNumber(item.price24hPcnt) * 100,
        tradeCount24h: 0
      };
    });
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : error }, "Radar Bybit ticker source unavailable");
    return [];
  }
};

const loadOkxTickers = async (): Promise<CexQuote[]> => {
  try {
    const response = await fetchJson<OkxTickerResponse>("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
    return (response.data ?? []).filter((item) => item.instId.endsWith("-USDT")).map((item) => {
      const baseAsset = item.instId.slice(0, -5).toUpperCase();
      const price = safeNumber(item.last);
      const open = safeNumber(item.open24h);
      return {
        venue: "OKX" as const,
        symbol: `${baseAsset}USDT`,
        instrumentId: item.instId,
        baseAsset,
        price,
        quoteVolume24h: safeNumber(item.volCcy24h),
        priceChange24h: open > 0 ? ((price / open) - 1) * 100 : 0,
        tradeCount24h: 0
      };
    });
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : error }, "Radar OKX ticker source unavailable");
    return [];
  }
};

export const loadCexUniverse = async () => {
  const [binance, bybit, okx] = await Promise.all([loadBinanceTickers(), loadBybitTickers(), loadOkxTickers()]);
  const map = new Map<string, CexUniverseItem>();
  for (const quote of [...binance, ...bybit, ...okx]) {
    if (STABLES.has(quote.baseAsset) || !quote.price || quote.price <= 0) continue;
    const current = map.get(quote.baseAsset) ?? { baseAsset: quote.baseAsset, venues: [] };
    current.venues.push(quote);
    map.set(quote.baseAsset, current);
  }
  return map;
};

const decodeHtml = (value: string) => value
  .replace(/<br\s*\/?\s*>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, "\"")
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const extractTelegramPosts = (html: string) => {
  const posts: Array<{ datetime: number; text: string }> = [];
  // Telegram can move the timestamp before or after the message text, so parse
  // each message block first and then locate the fields independently.
  const blocks = html.split(/(?=<div class="tgme_widget_message_wrap)/gi);
  for (const block of blocks) {
    if (!block.includes("data-post=")) continue;
    const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"/i);
    const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i);
    if (!timeMatch?.[1] || !textMatch?.[1]) continue;
    const datetime = Date.parse(timeMatch[1]);
    if (!Number.isFinite(datetime)) continue;
    const text = decodeHtml(textMatch[1]);
    if (text) posts.push({ datetime, text });
  }
  return posts;
};

const extractKnownSymbols = (text: string, knownSymbols: Set<string>) => {
  const tokens = text.toUpperCase().match(/[A-Z][A-Z0-9]{1,11}/g) ?? [];
  const found = new Set<string>();
  for (const raw of tokens) {
    const token = raw.endsWith("USDT") && raw.length > 4 ? raw.slice(0, -4) : raw;
    if (TELEGRAM_STOP_WORDS.has(token)) continue;
    if (knownSymbols.has(token)) found.add(token);
  }
  return [...found];
};

const extractUsdValue = (text: string) => {
  const patterns = [
    /\$\s*([\d,.]+)\s*([KMB])?\s*(?:USD)?/i,
    /\(([\d,.]+)\s*([KMB])?\s*USD\)/i,
    /(?:worth|value)\s*[:=]?\s*\$?\s*([\d,.]+)\s*([KMB])?\s*(?:USD)?/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const raw = Number(match[1].replaceAll(",", ""));
    const suffix = (match[2] ?? "").toUpperCase();
    const multiplier = suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;
    const value = raw * multiplier;
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const EXCHANGE_WORDS = ["binance", "coinbase", "kraken", "okx", "bybit", "kucoin", "bitfinex", "bitstamp", "gate", "htx", "huobi", "mexc", "bitget", "upbit", "bithumb"];
const looksLikeExchange = (value: string) => EXCHANGE_WORDS.some((word) => value.toLowerCase().includes(word));

export const loadTelegramIntelligence = async (knownSymbols: Set<string>) => {
  const map = new Map<string, ChannelIntelligence>();
  const now = Date.now();
  const responses = await Promise.allSettled(TELEGRAM_CHANNELS.map(async (channel) => ({ channel, html: await fetchText(`https://t.me/s/${channel}`) })));

  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    const { channel, html } = response.value;
    const posts = extractTelegramPosts(html).filter((post) => now - post.datetime <= TELEGRAM_LOOKBACK_MS);
    for (const post of posts) {
      const symbols = extractKnownSymbols(post.text, knownSymbols);
      for (const symbol of symbols) {
        const current = map.get(symbol) ?? {
          confirmations: 0,
          channels: [],
          mentions: [],
          onchainWhaleUsd: 0,
          exchangeOutflowUsd: 0,
          exchangeInflowUsd: 0
        };
        if (!current.channels.includes(channel)) current.channels.push(channel);
        if (current.mentions.length < 12) current.mentions.push(`${channel}: ${post.text.slice(0, 240)}`);

        if (channel.toLowerCase() === "whale_alert_io") {
          const usdValue = extractUsdValue(post.text);
          if (usdValue > 0) {
            current.onchainWhaleUsd += usdValue;
            const transfer = post.text.match(/from\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i);
            if (transfer) {
              const from = transfer[1] ?? "";
              const to = transfer[2] ?? "";
              const fromExchange = looksLikeExchange(from);
              const toExchange = looksLikeExchange(to);
              if (fromExchange && !toExchange) current.exchangeOutflowUsd += usdValue;
              if (!fromExchange && toExchange) current.exchangeInflowUsd += usdValue;
            }
          }
        }
        current.confirmations = current.channels.length;
        map.set(symbol, current);
      }
    }
  }
  return map;
};

type DexBoost = { chainId?: string; tokenAddress?: string; amount?: number; totalAmount?: number };
type DexPair = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  priceUsd?: string | null;
  txns?: Record<string, { buys?: number; sells?: number }>;
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  liquidity?: { usd?: number };
  fdv?: number | null;
  marketCap?: number | null;
};

type DexSearchResponse = { pairs?: DexPair[] | null };

const dexSnapshotFromPair = (pair: DexPair): DexSnapshot | null => {
  const symbol = String(pair.baseToken?.symbol ?? "").toUpperCase();
  const price = safeNumber(pair.priceUsd);
  const marketCap = safeNumber(pair.marketCap ?? pair.fdv);
  const volume24h = safeNumber(pair.volume?.h24);
  const liquidityUsd = safeNumber(pair.liquidity?.usd);
  const buys24h = safeNumber(pair.txns?.h24?.buys);
  const sells24h = safeNumber(pair.txns?.h24?.sells);
  const totalTx = buys24h + sells24h;
  if (!symbol || price <= 0) return null;
  return {
    symbol,
    name: String(pair.baseToken?.name ?? symbol),
    chainId: String(pair.chainId ?? "unknown"),
    dexId: String(pair.dexId ?? "DEX"),
    pairAddress: pair.pairAddress ?? null,
    tokenAddress: pair.baseToken?.address ?? null,
    url: pair.url ?? null,
    price,
    marketCap,
    volume24h,
    liquidityUsd,
    turnover24h: marketCap > 0 ? volume24h / marketCap : 0,
    buySellImbalance: totalTx > 0 ? ((buys24h - sells24h) / totalTx) * 100 : 0,
    priceChange24h: safeNumber(pair.priceChange?.h24),
    buys24h,
    sells24h,
    uniqueBuyers24h: 0,
    uniqueSellers24h: 0
  };
};


const GECKOTERMINAL_NETWORK: Record<string, string> = {
  ethereum: "eth", eth: "eth", bsc: "bsc", polygon: "polygon_pos", polygonpos: "polygon_pos",
  arbitrum: "arbitrum", base: "base", optimism: "optimism", avalanche: "avax", avax: "avax",
  solana: "solana", fantom: "ftm", linea: "linea", blast: "blast", sui: "sui", tron: "tron"
};

type GeckoPoolResponse = {
  data?: { attributes?: { transactions?: { h24?: { buyers?: number; sellers?: number } } } };
};

const enrichDexUniqueParticipants = async (snapshot: DexSnapshot): Promise<DexSnapshot> => {
  if (!snapshot.pairAddress) return snapshot;
  const network = GECKOTERMINAL_NETWORK[snapshot.chainId.toLowerCase()];
  if (!network) return snapshot;
  try {
    const response = await fetchJson<GeckoPoolResponse>(
      `https://api.geckoterminal.com/api/v2/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(snapshot.pairAddress)}`
    );
    const h24 = response.data?.attributes?.transactions?.h24;
    return {
      ...snapshot,
      uniqueBuyers24h: Math.max(0, Math.trunc(safeNumber(h24?.buyers))),
      uniqueSellers24h: Math.max(0, Math.trunc(safeNumber(h24?.sellers)))
    };
  } catch {
    return snapshot;
  }
};

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

export const loadDexDiscovery = async () => {
  try {
    const [latest, top] = await Promise.allSettled([
      fetchJson<DexBoost[]>("https://api.dexscreener.com/token-boosts/latest/v1"),
      fetchJson<DexBoost[]>("https://api.dexscreener.com/token-boosts/top/v1")
    ]);
    const boosts = [
      ...(latest.status === "fulfilled" ? latest.value : []),
      ...(top.status === "fulfilled" ? top.value : [])
    ];
    const unique = new Map<string, DexBoost>();
    for (const item of boosts) {
      if (!item.chainId || !item.tokenAddress) continue;
      const key = `${item.chainId}:${item.tokenAddress}`;
      const current = unique.get(key);
      if (!current || safeNumber(item.totalAmount ?? item.amount) > safeNumber(current.totalAmount ?? current.amount)) unique.set(key, item);
    }

    const byChain = new Map<string, DexBoost[]>();
    for (const item of unique.values()) {
      const items = byChain.get(item.chainId!) ?? [];
      items.push(item);
      byChain.set(item.chainId!, items);
    }

    const pairResults: DexPair[] = [];
    const requests: Promise<DexPair[]>[] = [];
    for (const [chainId, items] of byChain) {
      for (const group of chunk(items.slice(0, 90), 30)) {
        const addresses = group.map((item) => item.tokenAddress!).join(",");
        requests.push(fetchJson<DexPair[]>(`https://api.dexscreener.com/tokens/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(addresses)}`).catch(() => []));
      }
    }
    const responses = await Promise.all(requests);
    for (const response of responses) pairResults.push(...response);

    const bestByToken = new Map<string, DexSnapshot>();
    for (const pair of pairResults) {
      const snapshot = dexSnapshotFromPair(pair);
      if (!snapshot || snapshot.marketCap < 10_000 || snapshot.liquidityUsd < 10_000 || snapshot.turnover24h <= 0) continue;
      const key = `${snapshot.chainId}:${snapshot.symbol}`;
      const current = bestByToken.get(key);
      if (!current || snapshot.liquidityUsd > current.liquidityUsd) bestByToken.set(key, snapshot);
    }
    const selected = [...bestByToken.values()]
      .sort((a, b) => (b.turnover24h + Math.max(b.buySellImbalance, 0) / 200) - (a.turnover24h + Math.max(a.buySellImbalance, 0) / 200))
      .slice(0, 20);
    // GeckoTerminal public pool data exposes real unique buyers/sellers on DEXs.
    // Enrich only the highest-priority candidates to stay comfortably below the public rate limit.
    const enriched = await Promise.all(selected.slice(0, 12).map(enrichDexUniqueParticipants));
    return [...enriched, ...selected.slice(12)];
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : error }, "Radar DEX discovery unavailable");
    return [];
  }
};

export const findDexSnapshot = async (baseAsset: string) => {
  try {
    const response = await fetchJson<DexSearchResponse>(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(baseAsset)}`);
    const snapshots = (response.pairs ?? [])
      .filter((pair) => String(pair.baseToken?.symbol ?? "").toUpperCase() === baseAsset.toUpperCase())
      .map(dexSnapshotFromPair)
      .filter((item): item is DexSnapshot => Boolean(item))
      .filter((item) => item.liquidityUsd >= 50_000)
      .sort((a, b) => b.liquidityUsd - a.liquidityUsd);
    return snapshots[0] ?? null;
  } catch {
    return null;
  }
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const average = (values: number[]) => values.length ? sum(values) / values.length : 0;

const getKlineQuoteVolumes = async (quote: CexQuote, interval: "15m" | "1h", limit: number) => {
  if (quote.venue === "Binance") {
    const rows = await fetchJson<unknown[][]>(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(quote.symbol)}&interval=${interval}&limit=${limit}`);
    return rows.map((row) => safeNumber(row[7]));
  }
  if (quote.venue === "Bybit") {
    const bybitInterval = interval === "15m" ? "15" : "60";
    const response = await fetchJson<{ result?: { list?: unknown[][] } }>(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${encodeURIComponent(quote.symbol)}&interval=${bybitInterval}&limit=${limit}`);
    return (response.result?.list ?? []).slice().reverse().map((row) => safeNumber(row[6]));
  }
  const okxBar = interval === "15m" ? "15m" : "1H";
  const response = await fetchJson<{ data?: unknown[][] }>(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(quote.instrumentId)}&bar=${okxBar}&limit=${limit}`);
  return (response.data ?? []).slice().reverse().map((row) => safeNumber(row[7]));
};

type TradeSample = { side: "BUY" | "SELL"; quoteUsd: number };

const getRecentTrades = async (quote: CexQuote): Promise<TradeSample[]> => {
  if (quote.venue === "Binance") {
    const rows = await fetchJson<Array<{ p: string; q: string; m: boolean }>>(`https://api.binance.com/api/v3/aggTrades?symbol=${encodeURIComponent(quote.symbol)}&limit=1000`);
    return rows.map((item) => ({ side: item.m ? "SELL" : "BUY", quoteUsd: safeNumber(item.p) * safeNumber(item.q) }));
  }
  if (quote.venue === "Bybit") {
    const response = await fetchJson<{ result?: { list?: Array<{ price: string; size: string; side: string }> } }>(`https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=${encodeURIComponent(quote.symbol)}&limit=60`);
    return (response.result?.list ?? []).map((item) => ({ side: item.side.toUpperCase() === "BUY" ? "BUY" : "SELL", quoteUsd: safeNumber(item.price) * safeNumber(item.size) }));
  }
  const response = await fetchJson<{ data?: Array<{ px: string; sz: string; side: string }> }>(`https://www.okx.com/api/v5/market/trades?instId=${encodeURIComponent(quote.instrumentId)}&limit=100`);
  return (response.data ?? []).map((item) => ({ side: item.side.toLowerCase() === "buy" ? "BUY" : "SELL", quoteUsd: safeNumber(item.px) * safeNumber(item.sz) }));
};

const getOrderBookImbalance = async (quote: CexQuote) => {
  let bids: unknown[][] = [];
  let asks: unknown[][] = [];
  if (quote.venue === "Binance") {
    const response = await fetchJson<{ bids?: unknown[][]; asks?: unknown[][] }>(`https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(quote.symbol)}&limit=100`);
    bids = response.bids ?? [];
    asks = response.asks ?? [];
  } else if (quote.venue === "Bybit") {
    const response = await fetchJson<{ result?: { b?: unknown[][]; a?: unknown[][] } }>(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${encodeURIComponent(quote.symbol)}&limit=50`);
    bids = response.result?.b ?? [];
    asks = response.result?.a ?? [];
  } else {
    const response = await fetchJson<{ data?: Array<{ bids?: unknown[][]; asks?: unknown[][] }> }>(`https://www.okx.com/api/v5/market/books?instId=${encodeURIComponent(quote.instrumentId)}&sz=50`);
    bids = response.data?.[0]?.bids ?? [];
    asks = response.data?.[0]?.asks ?? [];
  }
  const notional = (rows: unknown[][]) => sum(rows.slice(0, 50).map((row) => safeNumber(row[0]) * safeNumber(row[1])));
  const bid = notional(bids);
  const ask = notional(asks);
  return bid + ask > 0 ? ((bid - ask) / (bid + ask)) * 100 : 0;
};

const getBinanceDerivatives = async (symbol: string) => {
  try {
    const [oi, premium] = await Promise.all([
      fetchJson<Array<{ sumOpenInterestValue?: string; timestamp?: number }>>(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodeURIComponent(symbol)}&period=5m&limit=2`),
      fetchJson<{ lastFundingRate?: string }>(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`)
    ]);
    const sorted = oi.slice().sort((a, b) => safeNumber(a.timestamp) - safeNumber(b.timestamp));
    const previous = safeNumber(sorted.at(-2)?.sumOpenInterestValue);
    const current = safeNumber(sorted.at(-1)?.sumOpenInterestValue);
    return {
      oiChange: previous > 0 ? ((current / previous) - 1) * 100 : 0,
      fundingRate: safeNumber(premium.lastFundingRate) * 100
    };
  } catch {
    return null;
  }
};

const getBybitDerivatives = async (symbol: string) => {
  try {
    const [oi, ticker] = await Promise.all([
      fetchJson<{ result?: { list?: Array<{ openInterest: string; timestamp: string }> } }>(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${encodeURIComponent(symbol)}&intervalTime=5min&limit=2`),
      fetchJson<{ result?: { list?: Array<{ fundingRate?: string }> } }>(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${encodeURIComponent(symbol)}`)
    ]);
    const sorted = (oi.result?.list ?? []).slice().sort((a, b) => safeNumber(a.timestamp) - safeNumber(b.timestamp));
    const previous = safeNumber(sorted.at(-2)?.openInterest);
    const current = safeNumber(sorted.at(-1)?.openInterest);
    return {
      oiChange: previous > 0 ? ((current / previous) - 1) * 100 : 0,
      fundingRate: safeNumber(ticker.result?.list?.[0]?.fundingRate) * 100
    };
  } catch {
    return null;
  }
};

export const getBinanceShortSqueezeDepth = async (symbol: string) => {
  const timeframes = ["15m", "1h", "4h", "1d"] as const;
  const results = await Promise.all(timeframes.map(async (timeframe) => {
    try {
      const rows = await fetchJson<unknown[][]>(`https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&limit=22`);
      if (rows.length < 3) return { timeframe, depth: 0 };
      const currentHigh = safeNumber(rows.at(-1)?.[2]);
      if (currentHigh <= 0) return { timeframe, depth: 0 };
      let depth = 0;
      for (let index = rows.length - 2; index >= 0; index -= 1) {
        const priorHigh = safeNumber(rows[index]?.[2]);
        if (priorHigh >= currentHigh) break;
        depth += 1;
      }
      return { timeframe, depth };
    } catch {
      return { timeframe, depth: 0 };
    }
  }));
  return results.sort((a, b) => b.depth - a.depth)[0] ?? { timeframe: "1h" as const, depth: 0 };
};

export const enrichCexMetrics = async (venues: CexQuote[], marketCap: number): Promise<CexDeepMetrics> => {
  const usable = venues.slice(0, 3);
  const [hourlySettled, accelSettled, tradesSettled, bookSettled] = await Promise.all([
    Promise.allSettled(usable.map((quote) => getKlineQuoteVolumes(quote, "1h", 72))),
    Promise.allSettled(usable.map((quote) => getKlineQuoteVolumes(quote, "15m", 9))),
    Promise.allSettled(usable.map((quote) => getRecentTrades(quote))),
    Promise.allSettled(usable.map((quote) => getOrderBookImbalance(quote)))
  ]);

  const volume72h = sum(hourlySettled.flatMap((result) => result.status === "fulfilled" ? result.value : []));

  const accelerationSeries = accelSettled
    .filter((result): result is PromiseFulfilledResult<number[]> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((values) => values.length >= 3);
  let volumeAcceleration = 1;
  if (accelerationSeries.length) {
    const recent = sum(accelerationSeries.map((values) => values.at(-1) ?? 0));
    const baselineSlots = Math.min(...accelerationSeries.map((values) => values.length - 1));
    const baselines: number[] = [];
    for (let offset = baselineSlots; offset >= 1; offset -= 1) {
      baselines.push(sum(accelerationSeries.map((values) => values.at(-1 - offset) ?? 0)));
    }
    const baseline = average(baselines);
    if (baseline > 0) volumeAcceleration = recent / baseline;
  }

  const trades = tradesSettled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const buyVolume = sum(trades.filter((trade) => trade.side === "BUY").map((trade) => trade.quoteUsd));
  const sellVolume = sum(trades.filter((trade) => trade.side === "SELL").map((trade) => trade.quoteUsd));
  const buySellImbalance = buyVolume + sellVolume > 0 ? ((buyVolume - sellVolume) / (buyVolume + sellVolume)) * 100 : 0;
  const whaleThreshold = Math.max(50_000, Math.min(250_000, marketCap * 0.0005));
  const whales = trades.filter((trade) => trade.quoteUsd >= whaleThreshold);
  const whaleBuyVolumeUsd = sum(whales.filter((trade) => trade.side === "BUY").map((trade) => trade.quoteUsd));
  const whaleSellVolumeUsd = sum(whales.filter((trade) => trade.side === "SELL").map((trade) => trade.quoteUsd));

  const bidWallImbalance = average(bookSettled.filter((result): result is PromiseFulfilledResult<number> => result.status === "fulfilled").map((result) => result.value));

  const base = usable[0]?.baseAsset ?? "";
  const derivatives = await Promise.all([getBinanceDerivatives(`${base}USDT`), getBybitDerivatives(`${base}USDT`)]);
  const validDerivatives = derivatives.filter((item): item is { oiChange: number; fundingRate: number } => Boolean(item));

  return {
    volume72h,
    volumeAcceleration,
    buySellImbalance,
    whaleBuyVolumeUsd,
    whaleSellVolumeUsd,
    whaleTradeCount: whales.length,
    bidWallImbalance,
    openInterestChange: average(validDerivatives.map((item) => item.oiChange)),
    fundingRate: average(validDerivatives.map((item) => item.fundingRate))
  };
};
