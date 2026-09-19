import { Prisma, TelegramNotificationStatus, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";
import { sendTelegramMessage } from "../../telegram/telegram-api";
import { resolveTelegramLanguage } from "../../telegram/telegram.i18n";
import { logger } from "../../utils/logger";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
const COINGECKO_MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
const REQUEST_TIMEOUT_MS = 15_000;
const SIGNAL_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const WORKER_INTERVAL_MS = 10_000;
const RETRY_DELAY_MS = 60_000;
const MAX_ATTEMPTS = 3;

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  quoteVolume: string;
  priceChangePercent: string;
  count: number;
};

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  market_cap: number | null;
  total_volume: number | null;
};

type Candidate = {
  symbol: string;
  baseAsset: string;
  price: number;
  marketCap: number;
  volume24h: number;
  turnover24h: number;
  priceChange24h: number;
  tradeCount24h: number;
  volumeAcceleration: number;
  score: number;
  direction: "UP" | "DOWN" | "NEUTRAL";
  reasons: string[];
};

let scanTimer: NodeJS.Timeout | undefined;
let notificationTimer: NodeJS.Timeout | undefined;
let scanRunning = false;
let deliveryRunning = false;

const blockedBases = new Set([
  "USDT", "USDC", "FDUSD", "TUSD", "USDP", "DAI", "BUSD",
  "EUR", "TRY", "BRL", "UP", "DOWN", "BULL", "BEAR"
]);

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "RAMO-Finance-Radar/1.0" }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
};

const mapCoinGeckoMarkets = (items: CoinGeckoMarket[]) => {
  const map = new Map<string, CoinGeckoMarket>();
  for (const item of items) {
    const symbol = item.symbol.toUpperCase();
    const previous = map.get(symbol);
    if (!previous || (item.market_cap ?? 0) > (previous.market_cap ?? 0)) map.set(symbol, item);
  }
  return map;
};

const getVolumeAcceleration = async (symbol: string) => {
  try {
    const klines = await fetchJson<unknown[][]>(`${BINANCE_KLINES_URL}?symbol=${encodeURIComponent(symbol)}&interval=15m&limit=9`);
    const volumes = klines.map((item) => Number(item[7])).filter(Number.isFinite);
    if (volumes.length < 3) return 1;
    const recent = volumes.at(-1) ?? 0;
    const baselineItems = volumes.slice(0, -1);
    const baseline = baselineItems.reduce((sum, value) => sum + value, 0) / baselineItems.length;
    return baseline > 0 ? recent / baseline : 1;
  } catch {
    return 1;
  }
};

const scoreCandidate = (candidate: Omit<Candidate, "score" | "reasons" | "direction">) => {
  let score = 0;
  const reasons: string[] = [];
  const turnover = candidate.turnover24h;
  const acceleration = candidate.volumeAcceleration;
  const change = candidate.priceChange24h;

  if (turnover >= 0.8) score += 38;
  else if (turnover >= 0.4) score += 32;
  else if (turnover >= 0.2) score += 26;
  else if (turnover >= 0.1) score += 19;
  else if (turnover >= 0.05) score += 12;
  if (turnover >= 0.1) reasons.push(`TURNOVER:${(turnover * 100).toFixed(1)}`);

  if (acceleration >= 6) score += 25;
  else if (acceleration >= 3) score += 18;
  else if (acceleration >= 1.8) score += 11;
  else if (acceleration >= 1.2) score += 5;
  if (acceleration >= 1.8) reasons.push(`ACCELERATION:${acceleration.toFixed(1)}`);

  const positiveChange = Math.max(change, 0);
  if (positiveChange >= 12) score += 18;
  else if (positiveChange >= 7) score += 14;
  else if (positiveChange >= 3) score += 8;
  else if (positiveChange >= 1) score += 3;
  if (positiveChange >= 3) reasons.push(`PRICE:${positiveChange.toFixed(1)}`);

  if (candidate.tradeCount24h >= 500_000) score += 10;
  else if (candidate.tradeCount24h >= 100_000) score += 7;
  else if (candidate.tradeCount24h >= 20_000) score += 4;
  if (candidate.tradeCount24h >= 100_000) reasons.push("HIGH_TRADES");

  if (candidate.marketCap >= 5_000_000 && candidate.marketCap <= 500_000_000) {
    score += 9;
    reasons.push("SMALL_CAP");
  }

  const direction = change >= 1 ? "UP" : change <= -1 ? "DOWN" : "NEUTRAL";
  return { score: Math.min(score, 100), reasons, direction } as const;
};

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const compactMoney = (value: Prisma.Decimal | null) => {
  if (!value) return "—";
  const number = Number(value);
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const formatSignalMessage = (signal: any, language: string) => {
  const symbol = escapeHtml(signal.symbol);
  const score = signal.score;
  const turnover = signal.turnover24h == null ? "—" : `${(signal.turnover24h * 100).toFixed(1)}%`;
  const acceleration = signal.volumeAcceleration == null ? "—" : `${signal.volumeAcceleration.toFixed(1)}x`;
  const change = signal.priceChange24h == null ? "—" : `${signal.priceChange24h >= 0 ? "+" : ""}${signal.priceChange24h.toFixed(2)}%`;
  const isFa = language === "FA";
  if (isFa) {
    return [
      "🚨 <b>رادار فعالیت مشکوک RAMO Finance</b>", "",
      `🪙 ارز: <b>${symbol}</b>`, `🎯 امتیاز فعالیت: <b>${score}/100</b>`,
      `💵 قیمت: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
      `📈 تغییر ۲۴ساعته: <b>${change}</b>`, `🔥 حجم/مارکت‌کپ: <b>${turnover}</b>`,
      `⚡ شتاب حجم ۱۵دقیقه: <b>${acceleration}</b>`, `🏦 مارکت‌کپ: <b>${compactMoney(signal.marketCap)}</b>`, "",
      "این پیام سیگنال خرید نیست؛ فعالیت غیرعادی بازار را نشان می‌دهد."
    ].join("\n");
  }
  if (language === "AR") {
    return [
      "🚨 <b>رادار النشاط غير المعتاد من RAMO Finance</b>", "",
      `🪙 الأصل: <b>${symbol}</b>`, `🎯 درجة النشاط: <b>${score}/100</b>`,
      `💵 السعر: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
      `📈 تغير 24 ساعة: <b>${change}</b>`, `🔥 الحجم/القيمة السوقية: <b>${turnover}</b>`,
      `⚡ تسارع حجم 15 دقيقة: <b>${acceleration}</b>`, `🏦 القيمة السوقية: <b>${compactMoney(signal.marketCap)}</b>`, "",
      "هذا إشعار بنشاط غير معتاد وليس إشارة شراء."
    ].join("\n");
  }
  if (language === "ES") {
    return [
      "🚨 <b>Radar de actividad anormal de RAMO Finance</b>", "",
      `🪙 Activo: <b>${symbol}</b>`, `🎯 Puntuación: <b>${score}/100</b>`,
      `💵 Precio: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
      `📈 Cambio 24h: <b>${change}</b>`, `🔥 Volumen/capitalización: <b>${turnover}</b>`,
      `⚡ Aceleración 15m: <b>${acceleration}</b>`, `🏦 Capitalización: <b>${compactMoney(signal.marketCap)}</b>`, "",
      "Es un aviso de actividad anormal, no una señal de compra."
    ].join("\n");
  }
  if (language === "ZH") {
    return [
      "🚨 <b>RAMO Finance 异常活动雷达</b>", "",
      `🪙 资产：<b>${symbol}</b>`, `🎯 活动评分：<b>${score}/100</b>`,
      `💵 价格：<b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
      `📈 24小时变化：<b>${change}</b>`, `🔥 24小时成交量/市值：<b>${turnover}</b>`,
      `⚡ 15分钟成交量加速：<b>${acceleration}</b>`, `🏦 市值：<b>${compactMoney(signal.marketCap)}</b>`, "",
      "这是异常活动通知，并非买入信号。"
    ].join("\n");
  }
  return [
    "🚨 <b>RAMO Finance Abnormal Activity Radar</b>", "",
    `🪙 Asset: <b>${symbol}</b>`, `🎯 Activity score: <b>${score}/100</b>`,
    `💵 Price: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
    `📈 24h change: <b>${change}</b>`, `🔥 24h volume/market cap: <b>${turnover}</b>`,
    `⚡ 15m volume acceleration: <b>${acceleration}</b>`, `🏦 Market cap: <b>${compactMoney(signal.marketCap)}</b>`, "",
    "This is an abnormal-activity notice, not a buy signal."
  ].join("\n");
};

const queueSignalNotifications = async (signal: any) => {
  if (signal.turnover24h == null) return;

  const signalMarketCap = signal.marketCap == null ? 0 : Number(signal.marketCap);
  const signalTurnoverPercent = signal.turnover24h == null ? 0 : signal.turnover24h * 100;
  const signalAcceleration = signal.volumeAcceleration == null ? 0 : signal.volumeAcceleration;
  const signalPriceChange = signal.priceChange24h == null ? 0 : signal.priceChange24h;
  const signalTradeCount = signal.tradeCount24h == null ? 0 : signal.tradeCount24h;

  const filters: Prisma.UserWhereInput[] = [
    { radarMinMarketCap: { lte: signalMarketCap } },
    { OR: [{ radarMaxMarketCap: null }, { radarMaxMarketCap: { gte: signalMarketCap } }] },
    { radarMinTurnoverPercent: { lte: signalTurnoverPercent } },
    { OR: [{ radarMinVolumeAcceleration: null }, { radarMinVolumeAcceleration: { lte: signalAcceleration } }] },
    { OR: [{ radarMinPriceChange24h: null }, { radarMinPriceChange24h: { lte: signalPriceChange } }] },
    { OR: [{ radarMinTradeCount24h: null }, { radarMinTradeCount24h: { lte: signalTradeCount } }] }
  ];
  if (!env.RADAR_PUBLIC_ENABLED) {
    filters.push({ OR: [{ role: UserRole.ADMIN }, { radarPreviewAccess: true }] });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      radarNotificationsEnabled: true,
      radarMinimumScore: { lte: signal.score },
      telegramId: { not: null },
      AND: filters
    }
  });
  if (!users.length) return;
  await prisma.radarNotification.createMany({
    data: users.map((user) => ({
      signalId: signal.id,
      userId: user.id,
      telegramId: user.telegramId!,
      message: formatSignalMessage(signal, resolveTelegramLanguage(user.preferredLanguage, user.languageCode ?? undefined))
    })),
    skipDuplicates: true
  });
};

export const runRadarScan = async () => {
  if (!env.RADAR_ENABLED || scanRunning) return { created: 0, candidates: 0 };
  scanRunning = true;
  try {
    const [tickers, coinMarkets] = await Promise.all([
      fetchJson<BinanceTicker[]>(BINANCE_TICKER_URL),
      fetchJson<CoinGeckoMarket[]>(COINGECKO_MARKETS_URL)
    ]);
    const coinMap = mapCoinGeckoMarkets(coinMarkets);
    const preliminary = tickers
      .filter((ticker) => ticker.symbol.endsWith("USDT"))
      .map((ticker) => {
        const baseAsset = ticker.symbol.slice(0, -4);
        const coin = coinMap.get(baseAsset);
        const marketCap = coin?.market_cap ?? 0;
        const volume24h = coin?.total_volume ?? Number(ticker.quoteVolume);
        return {
          ticker, baseAsset, marketCap, volume24h,
          turnover24h: marketCap > 0 ? volume24h / marketCap : 0,
          priceChange24h: Number(ticker.priceChangePercent)
        };
      })
      .filter((item) => !blockedBases.has(item.baseAsset) && !item.baseAsset.endsWith("UP") && !item.baseAsset.endsWith("DOWN"))
      .filter((item) => item.marketCap >= 3_000_000 && item.turnover24h >= 0.035 && Number(item.ticker.lastPrice) > 0)
      .sort((a, b) => (b.turnover24h + Math.max(b.priceChange24h, 0) / 100) - (a.turnover24h + Math.max(a.priceChange24h, 0) / 100))
      .slice(0, 30);

    const candidates: Candidate[] = [];
    for (let index = 0; index < preliminary.length; index += 5) {
      const batch = preliminary.slice(index, index + 5);
      const accelerations = await Promise.all(batch.map((item) => getVolumeAcceleration(item.ticker.symbol)));
      batch.forEach((item, batchIndex) => {
        const values = {
          symbol: item.ticker.symbol,
          baseAsset: item.baseAsset,
          price: Number(item.ticker.lastPrice),
          marketCap: item.marketCap,
          volume24h: item.volume24h,
          turnover24h: item.turnover24h,
          priceChange24h: item.priceChange24h,
          tradeCount24h: Number(item.ticker.count) || 0,
          volumeAcceleration: accelerations[batchIndex] ?? 1
        };
        candidates.push({ ...values, ...scoreCandidate(values) });
      });
    }

    const qualified = candidates.filter((item) => item.score >= env.RADAR_SIGNAL_THRESHOLD && item.direction !== "DOWN").sort((a, b) => b.score - a.score).slice(0, 12);
    let created = 0;
    const bucket = Math.floor(Date.now() / SIGNAL_COOLDOWN_MS);
    for (const item of qualified) {
      try {
        const signal = await prisma.radarSignal.create({
          data: {
            symbol: item.symbol, score: item.score, direction: item.direction, price: item.price,
            marketCap: item.marketCap, volume24h: item.volume24h, turnover24h: item.turnover24h,
            priceChange24h: item.priceChange24h, volumeAcceleration: item.volumeAcceleration,
            tradeCount24h: item.tradeCount24h, sourceSummary: "Binance + CoinGecko",
            reasons: item.reasons, cooldownKey: `${item.symbol}:${item.direction}:${bucket}`
          }
        });
        created += 1;
        await queueSignalNotifications(signal);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
    logger.info({ candidates: candidates.length, qualified: qualified.length, created }, "Radar scan completed");
    return { created, candidates: candidates.length };
  } catch (error) {
    logger.warn({ error: error instanceof Error ? error.message : error }, "Radar scan failed");
    throw error;
  } finally {
    scanRunning = false;
  }
};

export const processRadarNotifications = async () => {
  if (deliveryRunning) return;
  deliveryRunning = true;
  try {
    const jobs = await prisma.radarNotification.findMany({
      where: { status: TelegramNotificationStatus.PENDING, scheduledAt: { lte: new Date() } },
      orderBy: { scheduledAt: "asc" }, take: 20
    });
    for (const job of jobs) {
      const claimed = await prisma.radarNotification.updateMany({
        where: { id: job.id, status: TelegramNotificationStatus.PENDING },
        data: { status: TelegramNotificationStatus.SENDING, lockedAt: new Date() }
      });
      if (!claimed.count) continue;
      const result = await sendTelegramMessage(job.telegramId, job.message, env.TELEGRAM_WEBAPP_URL ? {
        inline_keyboard: [[{ text: "Open RAMO Finance", web_app: { url: env.TELEGRAM_WEBAPP_URL } }]]
      } : undefined).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : "Unknown error" }));
      const attempts = job.attempts + 1;
      await prisma.radarNotification.update({
        where: { id: job.id },
        data: result.sent ? {
          status: TelegramNotificationStatus.SENT, attempts, sentAt: new Date(), lockedAt: null, lastError: null
        } : {
          status: attempts >= MAX_ATTEMPTS ? TelegramNotificationStatus.FAILED : TelegramNotificationStatus.PENDING,
          attempts, lockedAt: null, lastError: result.reason?.slice(0, 2000),
          scheduledAt: new Date(Date.now() + RETRY_DELAY_MS)
        }
      });
    }
  } finally {
    deliveryRunning = false;
  }
};

export const radarService = {
  status(user: { role: UserRole; radarPreviewAccess: boolean }) {
    return { enabled: env.RADAR_ENABLED && (env.RADAR_PUBLIC_ENABLED || user.role === UserRole.ADMIN || user.radarPreviewAccess), public: env.RADAR_PUBLIC_ENABLED, scanIntervalSeconds: Math.round(env.RADAR_SCAN_INTERVAL_MS / 1000) };
  },
  async listSignals(limit = 20) {
    return prisma.radarSignal.findMany({ orderBy: { detectedAt: "desc" }, take: Math.min(Math.max(limit, 1), 50) });
  },
  async updateSettings(userId: string, settings: {
    enabled: boolean;
    minimumScore: number;
    minMarketCap: number;
    maxMarketCap: number | null;
    minTurnoverPercent: number;
    minVolumeAcceleration: number | null;
    minPriceChange24h: number | null;
    minTradeCount24h: number | null;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        radarNotificationsEnabled: settings.enabled,
        radarMinimumScore: settings.minimumScore,
        radarMinMarketCap: settings.minMarketCap,
        radarMaxMarketCap: settings.maxMarketCap,
        radarMinTurnoverPercent: settings.minTurnoverPercent,
        radarMinVolumeAcceleration: settings.minVolumeAcceleration,
        radarMinPriceChange24h: settings.minPriceChange24h,
        radarMinTradeCount24h: settings.minTradeCount24h
      }
    });

    if (settings.enabled && user.telegramId) {
      const recentSignalFilters: Prisma.RadarSignalWhereInput[] = [
        { score: { gte: settings.minimumScore } },
        { marketCap: { gte: settings.minMarketCap } },
        { turnover24h: { gte: settings.minTurnoverPercent / 100 } },
        { detectedAt: { gte: new Date(Date.now() - SIGNAL_COOLDOWN_MS) } }
      ];
      if (settings.maxMarketCap !== null) recentSignalFilters.push({ marketCap: { lte: settings.maxMarketCap } });
      if (settings.minVolumeAcceleration !== null) recentSignalFilters.push({ volumeAcceleration: { gte: settings.minVolumeAcceleration } });
      if (settings.minPriceChange24h !== null) recentSignalFilters.push({ priceChange24h: { gte: settings.minPriceChange24h } });
      if (settings.minTradeCount24h !== null) recentSignalFilters.push({ tradeCount24h: { gte: settings.minTradeCount24h } });

      const recentSignals = await prisma.radarSignal.findMany({
        where: { AND: recentSignalFilters },
        orderBy: { score: "desc" },
        take: 3
      });

      await prisma.radarNotification.createMany({
        data: recentSignals.map((signal) => ({
          signalId: signal.id,
          userId: user.id,
          telegramId: user.telegramId!,
          message: formatSignalMessage(
            signal,
            resolveTelegramLanguage(
              user.preferredLanguage,
              user.languageCode ?? undefined
            )
          )
        })),
        skipDuplicates: true
      });

      void processRadarNotifications().catch(() => undefined);
    }

    return user;
  },
  async sendTest(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.telegramId) throw new Error("Telegram user is not connected");
    const signal = await prisma.radarSignal.findFirst({
      where: {
        score: { gte: user.radarMinimumScore },
        marketCap: { gte: user.radarMinMarketCap },
        turnover24h: { gte: user.radarMinTurnoverPercent / 100 },
        ...(user.radarMaxMarketCap == null ? {} : { marketCap: { gte: user.radarMinMarketCap, lte: user.radarMaxMarketCap } }),
        ...(user.radarMinVolumeAcceleration == null ? {} : { volumeAcceleration: { gte: user.radarMinVolumeAcceleration } }),
        ...(user.radarMinPriceChange24h == null ? {} : { priceChange24h: { gte: user.radarMinPriceChange24h } }),
        ...(user.radarMinTradeCount24h == null ? {} : { tradeCount24h: { gte: user.radarMinTradeCount24h } })
      },
      orderBy: { detectedAt: "desc" }
    });
    const demo = signal ?? { symbol: "DEMOUSDT", score: 82, price: new Prisma.Decimal("1.245"), marketCap: new Prisma.Decimal("100000000"), turnover24h: 0.2, priceChange24h: 6.4, volumeAcceleration: 3.7 };
    const result = await sendTelegramMessage(user.telegramId, formatSignalMessage(demo, resolveTelegramLanguage(user.preferredLanguage, user.languageCode ?? undefined)), env.TELEGRAM_WEBAPP_URL ? {
      inline_keyboard: [[{ text: "Open RAMO Finance", web_app: { url: env.TELEGRAM_WEBAPP_URL } }]]
    } : undefined);
    if (!result.sent) throw new Error(result.reason ?? "Telegram send failed");
    return { sent: true };
  }
};

export const startRadarWorkers = () => {
  if (!env.RADAR_ENABLED || scanTimer || notificationTimer) return;
  void runRadarScan().catch(() => undefined);
  void processRadarNotifications().catch(() => undefined);
  scanTimer = setInterval(() => void runRadarScan().catch(() => undefined), env.RADAR_SCAN_INTERVAL_MS);
  notificationTimer = setInterval(() => void processRadarNotifications().catch(() => undefined), WORKER_INTERVAL_MS);
  logger.info({ intervalMs: env.RADAR_SCAN_INTERVAL_MS, public: env.RADAR_PUBLIC_ENABLED }, "Abnormal activity radar started");
};

export const stopRadarWorkers = () => {
  if (scanTimer) clearInterval(scanTimer);
  if (notificationTimer) clearInterval(notificationTimer);
  scanTimer = undefined;
  notificationTimer = undefined;
};
