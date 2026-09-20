import { Prisma, TelegramNotificationStatus, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";
import { sendTelegramMessage } from "../../telegram/telegram-api";
import { resolveTelegramLanguage } from "../../telegram/telegram.i18n";
import { logger } from "../../utils/logger";
import {
  type CexQuote,
  type ChannelIntelligence,
  type DexSnapshot,
  enrichCexMetrics,
  getBinanceShortSqueezeDepth,
  findDexSnapshot,
  loadCexUniverse,
  loadCoinGeckoMarkets,
  loadDexDiscovery,
  loadTelegramIntelligence
} from "./radar-sources.service";
import {
  getDirectOnchainMetrics,
  getLiquidationMetrics,
  startRadarStreams,
  stopRadarStreams
} from "./radar-streams.service";

const SIGNAL_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const WORKER_INTERVAL_MS = 10_000;
const RETRY_DELAY_MS = 60_000;
const MAX_ATTEMPTS = 3;
const PRELIMINARY_CEX_LIMIT = 24;
const CHANNEL_PRIORITY_LIMIT = 8;
const MAX_STORED_PER_SCAN = 14;

type CandidateValues = {
  symbol: string;
  baseAsset: string;
  price: number;
  marketCap: number;
  volume24h: number;
  turnover24h: number;
  volume72h: number;
  turnover72h: number;
  priceChange24h: number;
  tradeCount24h: number;
  volumeAcceleration: number;
  buySellImbalance: number;
  whaleBuyVolumeUsd: number;
  whaleSellVolumeUsd: number;
  whaleTradeCount: number;
  bidWallImbalance: number;
  openInterestChange: number;
  fundingRate: number;
  shortLiquidationUsd: number;
  longLiquidationUsd: number;
  shortSqueezeDepth: number;
  shortSqueezeTimeframe: string | null;
  dexVolume24h: number;
  dexLiquidityUsd: number;
  dexTurnover24h: number;
  dexBuySellImbalance: number;
  dexUniqueBuyers24h: number;
  dexUniqueSellers24h: number;
  cexConfirmations: number;
  channelConfirmations: number;
  channelMentions: string[];
  onchainWhaleUsd: number;
  exchangeOutflowUsd: number;
  exchangeInflowUsd: number;
  chainId: string | null;
  dexUrl: string | null;
  sourceSummary: string;
};

type Candidate = CandidateValues & {
  score: number;
  direction: "UP" | "DOWN" | "NEUTRAL";
  reasons: string[];
};

type RadarSettings = {
  enabled: boolean;
  minimumScore: number;
  includeLowCap: boolean;
  includeMidCap: boolean;
  includeHighCap: boolean;
  includeDex: boolean;
  includeCex: boolean;
  minTurnoverPercent: number;
  minPriceChange24h: number;
  minTradeCount24h: number;
  minDexUniqueBuyers24h: number;
  minBuyImbalancePercent: number;
  minDexLiquidityUsd: number;
  minDexVolumeUsd: number;
  minShortLiquidationUsd: number;
  minShortSqueezeDepth: number;
};

let scanTimer: NodeJS.Timeout | undefined;
let notificationTimer: NodeJS.Timeout | undefined;
let scanRunning = false;
let deliveryRunning = false;

const blockedBases = new Set([
  "USDT", "USDC", "FDUSD", "TUSD", "USDP", "DAI", "BUSD",
  "EUR", "TRY", "BRL", "UP", "DOWN", "BULL", "BEAR"
]);

const safeNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const scoreCandidate = (candidate: CandidateValues) => {
  // v3.5 primary score: only factors explicitly prioritised for Gem hunting
  // affect the 0-100 score. All other intelligence remains collected and is
  // surfaced as supplementary evidence/reasons below.
  let score = 0;
  const reasons: string[] = [];
  const turnover = candidate.turnover24h;
  const turnover72 = candidate.turnover72h;
  const acceleration = candidate.volumeAcceleration;
  const change = candidate.priceChange24h;

  // 1) 24h volume / market cap — highest priority (max 25)
  if (turnover >= 0.8) score += 25;
  else if (turnover >= 0.4) score += 21;
  else if (turnover >= 0.2) score += 17;
  else if (turnover >= 0.1) score += 13;
  else if (turnover >= 0.05) score += 8;
  if (turnover >= 0.1) reasons.push(`TURNOVER:${(turnover * 100).toFixed(1)}`);

  // 2) 24h trade count — broad activity, max 15
  if (candidate.tradeCount24h >= 500_000) score += 15;
  else if (candidate.tradeCount24h >= 100_000) score += 11;
  else if (candidate.tradeCount24h >= 20_000) score += 7;
  else if (candidate.tradeCount24h >= 5_000) score += 3;
  if (candidate.tradeCount24h >= 100_000) reasons.push("HIGH_TRADES");

  // 3) Real unique DEX buyers — broad wallet participation, max 20
  if (candidate.dexUniqueBuyers24h >= 2_000) score += 20;
  else if (candidate.dexUniqueBuyers24h >= 750) score += 15;
  else if (candidate.dexUniqueBuyers24h >= 250) score += 10;
  else if (candidate.dexUniqueBuyers24h >= 75) score += 5;
  if (candidate.dexUniqueBuyers24h >= 75) reasons.push(`DEX_UNIQUE_BUYERS:${candidate.dexUniqueBuyers24h}`);

  // 4) Positive 24h price change, max 10
  const positiveChange = Math.max(change, 0);
  if (positiveChange >= 12) score += 10;
  else if (positiveChange >= 7) score += 8;
  else if (positiveChange >= 3) score += 5;
  else if (positiveChange >= 1) score += 2;
  if (positiveChange >= 3) reasons.push(`PRICE:${positiveChange.toFixed(1)}`);

  // 5) Gem market-cap tier, max 10
  if (candidate.marketCap >= 10_000 && candidate.marketCap < 1_000_000) {
    score += 10;
    reasons.push("LOW_CAP");
  } else if (candidate.marketCap >= 1_000_000 && candidate.marketCap < 100_000_000) {
    score += 7;
    reasons.push("MID_CAP");
  } else if (candidate.marketCap >= 100_000_000 && candidate.marketCap <= 500_000_000) {
    score += 3;
    reasons.push("HIGH_CAP");
  }

  // 6) Buy pressure. Use the stronger observed CEX/DEX pressure, max 8.
  const primaryBuyPressure = Math.max(candidate.buySellImbalance, candidate.dexBuySellImbalance, 0);
  if (primaryBuyPressure >= 40) score += 8;
  else if (primaryBuyPressure >= 25) score += 6;
  else if (primaryBuyPressure >= 10) score += 3;
  if (primaryBuyPressure >= 15) reasons.push(`BUY_IMBALANCE:${primaryBuyPressure.toFixed(1)}`);

  // 7) DEX liquidity, max 5
  if (candidate.dexLiquidityUsd >= 1_000_000) score += 5;
  else if (candidate.dexLiquidityUsd >= 500_000) score += 4;
  else if (candidate.dexLiquidityUsd >= 100_000) score += 2;
  if (candidate.dexLiquidityUsd >= 100_000) reasons.push(`DEX_LIQUIDITY:${Math.round(candidate.dexLiquidityUsd)}`);

  // 8) DEX volume, max 3
  if (candidate.dexVolume24h >= 10_000_000) score += 3;
  else if (candidate.dexVolume24h >= 2_000_000) score += 2;
  else if (candidate.dexVolume24h >= 500_000) score += 1;
  if (candidate.dexVolume24h >= 500_000) reasons.push(`DEX_VOLUME:${Math.round(candidate.dexVolume24h)}`);

  // 9) Short liquidation + squeeze depth, max 4 combined
  if (candidate.shortLiquidationUsd >= 1_000_000) score += 2;
  else if (candidate.shortLiquidationUsd >= 250_000) score += 1;
  if (candidate.shortLiquidationUsd >= 250_000) reasons.push(`SHORT_LIQ:${Math.round(candidate.shortLiquidationUsd)}`);
  if (candidate.shortSqueezeDepth >= 10) score += 2;
  else if (candidate.shortSqueezeDepth >= 5) score += 1;
  if (candidate.shortSqueezeDepth >= 2) reasons.push(`SQUEEZE_DEPTH:${candidate.shortSqueezeDepth}:${candidate.shortSqueezeTimeframe ?? "1h"}`);

  // Supplementary intelligence: checked and displayed, but intentionally not scored.
  if (turnover72 >= 0.3) reasons.push(`TURNOVER72:${(turnover72 * 100).toFixed(1)}`);
  if (acceleration >= 1.8) reasons.push(`ACCELERATION:${acceleration.toFixed(1)}`);

  const whaleNetBuy = Math.max(candidate.whaleBuyVolumeUsd - candidate.whaleSellVolumeUsd, 0);
  if (whaleNetBuy >= 75_000) reasons.push(`WHALE_BUY:${Math.round(whaleNetBuy)}`);
  if (candidate.bidWallImbalance >= 20) reasons.push(`BID_WALL:${candidate.bidWallImbalance.toFixed(1)}`);
  if (candidate.openInterestChange >= 2) reasons.push(`OI:${candidate.openInterestChange.toFixed(1)}`);
  if (candidate.dexTurnover24h >= 0.1) reasons.push(`DEX_TURNOVER:${(candidate.dexTurnover24h * 100).toFixed(1)}`);
  if (candidate.dexBuySellImbalance >= 15) reasons.push(`DEX_BUY:${candidate.dexBuySellImbalance.toFixed(1)}`);
  if (candidate.cexConfirmations >= 2) reasons.push(`CEX_CONFIRM:${candidate.cexConfirmations}`);
  if (candidate.channelConfirmations > 0) reasons.push(`CHANNELS:${candidate.channelConfirmations}`);
  if (candidate.exchangeOutflowUsd >= 1_000_000) reasons.push(`OUTFLOW:${Math.round(candidate.exchangeOutflowUsd)}`);
  if (candidate.onchainWhaleUsd >= 1_000_000) reasons.push(`ONCHAIN:${Math.round(candidate.onchainWhaleUsd)}`);

  const direction = change >= 1 ? "UP" : change <= -1 ? "DOWN" : "NEUTRAL";
  return { score: Math.min(Math.round(score), 100), reasons, direction } as const;
};

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const compactMoneyNumber = (number: number) => {
  if (!Number.isFinite(number) || number <= 0) return "—";
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};
const compactMoney = (value: Prisma.Decimal | null | undefined) => compactMoneyNumber(value == null ? 0 : Number(value));
const pct = (value: number | null | undefined, digits = 1) => value == null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;

const formatSignalMessage = (signal: any, language: string) => {
  const symbol = escapeHtml(signal.symbol);
  const score = signal.score;
  const turnover = signal.turnover24h == null ? "—" : `${(signal.turnover24h * 100).toFixed(1)}%`;
  const turnover72 = signal.turnover72h == null ? "—" : `${(signal.turnover72h * 100).toFixed(1)}%`;
  const acceleration = signal.volumeAcceleration == null ? "—" : `${Number(signal.volumeAcceleration).toFixed(1)}x`;
  const change = signal.priceChange24h == null ? "—" : `${signal.priceChange24h >= 0 ? "+" : ""}${Number(signal.priceChange24h).toFixed(2)}%`;
  const buyPressure = pct(signal.buySellImbalance);
  const oi = pct(signal.openInterestChange);
  const whale = compactMoney(signal.whaleBuyVolumeUsd);
  const shortLiq = compactMoney(signal.shortLiquidationUsd);
  const uniqueBuyers = Number(signal.dexUniqueBuyers24h ?? 0);
  const uniqueSellers = Number(signal.dexUniqueSellers24h ?? 0);
  const squeezeDepth = Number(signal.shortSqueezeDepth ?? 0);
  const squeezeTimeframe = signal.shortSqueezeTimeframe ? String(signal.shortSqueezeTimeframe) : "—";
  const channels = Number(signal.channelConfirmations ?? 0);
  const isFa = language === "FA";

  if (isFa) {
    return [
      "🚨 <b>رادار چندمنبعی RAMO Finance</b>", "",
      `🪙 ارز: <b>${symbol}</b>`, `🎯 امتیاز ترکیبی: <b>${score}/100</b>`,
      `💵 قیمت: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
      `📈 تغییر ۲۴ساعته: <b>${change}</b>`, `🔥 گردش ۲۴ساعته: <b>${turnover}</b>`,
      `🕒 گردش ۷۲ساعته: <b>${turnover72}</b>`, `⚡ شتاب حجم ۱۵دقیقه: <b>${acceleration}</b>`,
      `🟢 فشار خرید تیکر: <b>${buyPressure}</b>`, `🐋 خریدهای بزرگ اخیر: <b>${whale}</b>`,
      `📊 تغییر OI: <b>${oi}</b>`, `💥 لیکویید شورت ۱ساعته: <b>${shortLiq}</b>`,
      ...(uniqueBuyers > 0 ? [`👥 خریداران یکتای DEX در ۲۴ساعت: <b>${uniqueBuyers.toLocaleString("en-US")}</b>${uniqueSellers > 0 ? ` · فروشندگان یکتا: <b>${uniqueSellers.toLocaleString("en-US")}</b>` : ""}`] : []),
      ...(squeezeDepth > 0 ? [`🧹 عمق Short Squeeze: <b>${squeezeDepth}</b> کندل در <b>${escapeHtml(squeezeTimeframe)}</b>`] : []),
      `📡 تأیید کانال‌ها: <b>${channels}</b>`, `🏦 مارکت‌کپ: <b>${compactMoney(signal.marketCap)}</b>`, "",
      "این هشدار تشخیص فعالیت غیرعادی است و تضمین پامپ یا سیگنال خرید نیست."
    ].join("\n");
  }

  return [
    "🚨 <b>RAMO Finance Multi-Source Radar</b>", "",
    `🪙 Asset: <b>${symbol}</b>`, `🎯 Composite score: <b>${score}/100</b>`,
    `💵 Price: <b>${Number(signal.price).toLocaleString("en-US", { maximumSignificantDigits: 8 })}</b>`,
    `📈 24h change: <b>${change}</b>`, `🔥 24h turnover: <b>${turnover}</b>`,
    `🕒 72h turnover: <b>${turnover72}</b>`, `⚡ 15m acceleration: <b>${acceleration}</b>`,
    `🟢 Taker buy pressure: <b>${buyPressure}</b>`, `🐋 Recent large buys: <b>${whale}</b>`,
    `📊 OI change: <b>${oi}</b>`, `💥 1h short liquidations: <b>${shortLiq}</b>`,
    ...(uniqueBuyers > 0 ? [`👥 Unique DEX buyers (24h): <b>${uniqueBuyers.toLocaleString("en-US")}</b>${uniqueSellers > 0 ? ` · unique sellers: <b>${uniqueSellers.toLocaleString("en-US")}</b>` : ""}`] : []),
    ...(squeezeDepth > 0 ? [`🧹 Short-squeeze depth: <b>${squeezeDepth}</b> candles on <b>${escapeHtml(squeezeTimeframe)}</b>`] : []),
    `📡 Channel confirmations: <b>${channels}</b>`, `🏦 Market cap: <b>${compactMoney(signal.marketCap)}</b>`, "",
    "This detects abnormal activity; it is not a guaranteed pump or buy signal."
  ].join("\n");
};

const valueOrZero = (value: unknown) => safeNumber(value, 0);

const marketCapBucket = (marketCap: number) => {
  if (marketCap >= 10_000 && marketCap < 1_000_000) return "LOW" as const;
  if (marketCap >= 1_000_000 && marketCap < 100_000_000) return "MID" as const;
  if (marketCap >= 100_000_000 && marketCap <= 500_000_000) return "HIGH" as const;
  return "OUTSIDE" as const;
};

const matchesUserFilters = (signal: any, user: any) => {
  const marketCap = valueOrZero(signal.marketCap);
  if (signal.score < user.radarMinimumScore) return false;

  const bucket = marketCapBucket(marketCap);
  const capEnabled =
    (bucket === "LOW" && user.radarIncludeLowCap) ||
    (bucket === "MID" && user.radarIncludeMidCap) ||
    (bucket === "HIGH" && user.radarIncludeHighCap);
  if (!capEnabled) return false;

  const hasCex = valueOrZero(signal.cexConfirmations) > 0;
  const hasDex = Boolean(signal.dexUrl || signal.chainId) || valueOrZero(signal.dexVolume24h) > 0 || valueOrZero(signal.dexLiquidityUsd) > 0;
  if (!((user.radarIncludeCex && hasCex) || (user.radarIncludeDex && hasDex))) return false;

  if (user.radarMinTurnoverPercent > 0 && valueOrZero(signal.turnover24h) * 100 < user.radarMinTurnoverPercent) return false;
  if (valueOrZero(user.radarMinPriceChange24h) !== 0 && valueOrZero(signal.priceChange24h) < valueOrZero(user.radarMinPriceChange24h)) return false;
  if (valueOrZero(user.radarMinTradeCount24h) > 0 && valueOrZero(signal.tradeCount24h) < valueOrZero(user.radarMinTradeCount24h)) return false;

  if (user.radarIncludeDex) {
    if (valueOrZero(user.radarMinDexUniqueBuyers24h) > 0 && valueOrZero(signal.dexUniqueBuyers24h) < valueOrZero(user.radarMinDexUniqueBuyers24h)) return false;
    if (valueOrZero(user.radarMinDexLiquidityUsd) > 0 && valueOrZero(signal.dexLiquidityUsd) < valueOrZero(user.radarMinDexLiquidityUsd)) return false;
    if (valueOrZero(user.radarMinDexVolumeUsd) > 0 && valueOrZero(signal.dexVolume24h) < valueOrZero(user.radarMinDexVolumeUsd)) return false;
  }

  const buyPressure = user.radarIncludeDex && user.radarIncludeCex
    ? Math.max(valueOrZero(signal.buySellImbalance), valueOrZero(signal.dexBuySellImbalance))
    : user.radarIncludeDex
      ? valueOrZero(signal.dexBuySellImbalance)
      : valueOrZero(signal.buySellImbalance);
  if (valueOrZero(user.radarMinBuyImbalancePercent) > 0 && buyPressure < valueOrZero(user.radarMinBuyImbalancePercent)) return false;

  if (valueOrZero(user.radarMinShortLiquidationUsd) > 0 && valueOrZero(signal.shortLiquidationUsd) < valueOrZero(user.radarMinShortLiquidationUsd)) return false;
  if (valueOrZero(user.radarMinShortSqueezeDepth) > 0 && valueOrZero(signal.shortSqueezeDepth) < valueOrZero(user.radarMinShortSqueezeDepth)) return false;
  return true;
};

const queueSignalNotifications = async (signal: any) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      radarNotificationsEnabled: true,
      telegramId: { not: null },
      ...(!env.RADAR_PUBLIC_ENABLED ? { OR: [{ role: UserRole.ADMIN }, { radarPreviewAccess: true }] } : {})
    }
  });
  const eligible = users.filter((user) => matchesUserFilters(signal, user));
  if (!eligible.length) return;
  await prisma.radarNotification.createMany({
    data: eligible.map((user) => ({
      signalId: signal.id,
      userId: user.id,
      telegramId: user.telegramId!,
      message: formatSignalMessage(signal, resolveTelegramLanguage(user.preferredLanguage, user.languageCode ?? undefined))
    })),
    skipDuplicates: true
  });
};

const mergeChannelAndDirectOnchain = (baseAsset: string, channel?: ChannelIntelligence) => {
  const direct = getDirectOnchainMetrics(baseAsset);
  return {
    channelConfirmations: channel?.confirmations ?? 0,
    channelMentions: channel?.mentions ?? [],
    onchainWhaleUsd: (channel?.onchainWhaleUsd ?? 0) + direct.onchainWhaleUsd,
    exchangeOutflowUsd: (channel?.exchangeOutflowUsd ?? 0) + direct.exchangeOutflowUsd,
    exchangeInflowUsd: (channel?.exchangeInflowUsd ?? 0) + direct.exchangeInflowUsd
  };
};

const makeCexCandidate = async (item: {
  baseAsset: string;
  venues: CexQuote[];
  marketCap: number;
  volume24h: number;
  turnover24h: number;
  price: number;
  priceChange24h: number;
  tradeCount24h: number;
}, channel?: ChannelIntelligence): Promise<Candidate> => {
  const [deep, dex] = await Promise.all([
    enrichCexMetrics(item.venues, item.marketCap),
    findDexSnapshot(item.baseAsset)
  ]);
  const liquidation = getLiquidationMetrics(`${item.baseAsset}USDT`);
  const squeeze = liquidation.shortLiquidationUsd >= 25_000
    ? await getBinanceShortSqueezeDepth(`${item.baseAsset}USDT`)
    : { depth: 0, timeframe: "1h" as const };
  const intel = mergeChannelAndDirectOnchain(item.baseAsset, channel);
  const values: CandidateValues = {
    symbol: `${item.baseAsset}USDT`,
    baseAsset: item.baseAsset,
    price: item.price,
    marketCap: item.marketCap,
    volume24h: item.volume24h,
    turnover24h: item.turnover24h,
    volume72h: deep.volume72h,
    turnover72h: item.marketCap > 0 ? deep.volume72h / item.marketCap : 0,
    priceChange24h: item.priceChange24h,
    tradeCount24h: item.tradeCount24h,
    volumeAcceleration: deep.volumeAcceleration,
    buySellImbalance: deep.buySellImbalance,
    whaleBuyVolumeUsd: deep.whaleBuyVolumeUsd,
    whaleSellVolumeUsd: deep.whaleSellVolumeUsd,
    whaleTradeCount: deep.whaleTradeCount,
    bidWallImbalance: deep.bidWallImbalance,
    openInterestChange: deep.openInterestChange,
    fundingRate: deep.fundingRate,
    shortLiquidationUsd: liquidation.shortLiquidationUsd,
    longLiquidationUsd: liquidation.longLiquidationUsd,
    shortSqueezeDepth: squeeze.depth,
    shortSqueezeTimeframe: squeeze.depth > 0 ? squeeze.timeframe : null,
    dexVolume24h: dex?.volume24h ?? 0,
    dexLiquidityUsd: dex?.liquidityUsd ?? 0,
    dexTurnover24h: dex?.turnover24h ?? 0,
    dexBuySellImbalance: dex?.buySellImbalance ?? 0,
    dexUniqueBuyers24h: dex?.uniqueBuyers24h ?? 0,
    dexUniqueSellers24h: dex?.uniqueSellers24h ?? 0,
    cexConfirmations: item.venues.length,
    ...intel,
    chainId: dex?.chainId ?? null,
    dexUrl: dex?.url ?? null,
    sourceSummary: [
      ...item.venues.map((venue) => venue.venue),
      "CoinGecko",
      dex ? `DEXScreener:${dex.chainId}` : null,
      channel?.confirmations ? "Telegram" : null
    ].filter(Boolean).join(" + ")
  };
  return { ...values, ...scoreCandidate(values) };
};

const makeDexCandidate = (dex: DexSnapshot, channel?: ChannelIntelligence): Candidate => {
  const intel = mergeChannelAndDirectOnchain(dex.symbol, channel);
  const values: CandidateValues = {
    symbol: dex.symbol,
    baseAsset: dex.symbol,
    price: dex.price,
    marketCap: dex.marketCap,
    volume24h: dex.volume24h,
    turnover24h: dex.turnover24h,
    volume72h: 0,
    turnover72h: 0,
    priceChange24h: dex.priceChange24h,
    tradeCount24h: dex.buys24h + dex.sells24h,
    volumeAcceleration: 1,
    buySellImbalance: dex.buySellImbalance,
    whaleBuyVolumeUsd: 0,
    whaleSellVolumeUsd: 0,
    whaleTradeCount: 0,
    bidWallImbalance: 0,
    openInterestChange: 0,
    fundingRate: 0,
    shortLiquidationUsd: 0,
    longLiquidationUsd: 0,
    shortSqueezeDepth: 0,
    shortSqueezeTimeframe: null,
    dexVolume24h: dex.volume24h,
    dexLiquidityUsd: dex.liquidityUsd,
    dexTurnover24h: dex.turnover24h,
    dexBuySellImbalance: dex.buySellImbalance,
    dexUniqueBuyers24h: dex.uniqueBuyers24h,
    dexUniqueSellers24h: dex.uniqueSellers24h,
    cexConfirmations: 0,
    ...intel,
    chainId: dex.chainId,
    dexUrl: dex.url,
    sourceSummary: [`DEXScreener:${dex.chainId}`, channel?.confirmations ? "Telegram" : null].filter(Boolean).join(" + ")
  };
  return { ...values, ...scoreCandidate(values) };
};

export const runRadarScan = async () => {
  if (!env.RADAR_ENABLED || scanRunning) return { created: 0, candidates: 0 };
  scanRunning = true;
  try {
    const [coinMap, cexMap, dexDiscovery] = await Promise.all([
      loadCoinGeckoMarkets(),
      loadCexUniverse(),
      loadDexDiscovery()
    ]);
    const knownSymbols = new Set<string>([
      ...coinMap.keys(),
      ...cexMap.keys(),
      ...dexDiscovery.map((item) => item.symbol)
    ]);
    const telegramIntel = await loadTelegramIntelligence(knownSymbols);

    const preliminary = [...cexMap.values()].map((item) => {
      const market = coinMap.get(item.baseAsset);
      const marketCap = market?.market_cap ?? 0;
      const volume24h = market?.total_volume ?? item.venues.reduce((sum, venue) => sum + venue.quoteVolume24h, 0);
      const preferred = item.venues.find((venue) => venue.venue === "Binance") ?? item.venues[0];
      return {
        baseAsset: item.baseAsset,
        venues: item.venues,
        marketCap,
        volume24h,
        turnover24h: marketCap > 0 ? volume24h / marketCap : 0,
        price: preferred?.price ?? 0,
        priceChange24h: average(item.venues.map((venue) => venue.priceChange24h)),
        tradeCount24h: item.venues.reduce((sum, venue) => sum + venue.tradeCount24h, 0),
        channelConfirmations: telegramIntel.get(item.baseAsset)?.confirmations ?? 0
      };
    }).filter((item) =>
      !blockedBases.has(item.baseAsset) &&
      !item.baseAsset.endsWith("UP") && !item.baseAsset.endsWith("DOWN") &&
      item.marketCap >= 3_000_000 && item.turnover24h >= 0.035 && item.price > 0
    ).sort((a, b) =>
      (b.turnover24h + Math.max(b.priceChange24h, 0) / 100 + b.venues.length * 0.03 + b.channelConfirmations * 0.08) -
      (a.turnover24h + Math.max(a.priceChange24h, 0) / 100 + a.venues.length * 0.03 + a.channelConfirmations * 0.08)
    );

    const selected = preliminary.slice(0, PRELIMINARY_CEX_LIMIT);
    const selectedSymbols = new Set(selected.map((item) => item.baseAsset));
    const channelPriority = preliminary
      .filter((item) => item.channelConfirmations > 0 && !selectedSymbols.has(item.baseAsset))
      .slice(0, CHANNEL_PRIORITY_LIMIT);
    const cexInput = [...selected, ...channelPriority];

    const candidates: Candidate[] = [];
    for (let index = 0; index < cexInput.length; index += 4) {
      const batch = cexInput.slice(index, index + 4);
      const results = await Promise.allSettled(batch.map((item) => makeCexCandidate(item, telegramIntel.get(item.baseAsset))));
      for (const result of results) {
        if (result.status === "fulfilled") candidates.push(result.value);
      }
    }

    const cexBases = new Set(cexInput.map((item) => item.baseAsset));
    for (const dex of dexDiscovery) {
      if (cexBases.has(dex.symbol)) continue;
      candidates.push(makeDexCandidate(dex, telegramIntel.get(dex.symbol)));
    }

    const qualified = candidates
      .filter((item) => item.score >= Math.min(env.RADAR_SIGNAL_THRESHOLD, 60) && item.direction !== "DOWN")
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_STORED_PER_SCAN);

    let created = 0;
    const bucket = Math.floor(Date.now() / SIGNAL_COOLDOWN_MS);
    for (const item of qualified) {
      try {
        const signal = await prisma.radarSignal.create({
          data: {
            symbol: item.symbol,
            score: item.score,
            direction: item.direction,
            price: item.price,
            marketCap: item.marketCap || null,
            volume24h: item.volume24h || null,
            turnover24h: item.turnover24h,
            priceChange24h: item.priceChange24h,
            volumeAcceleration: item.volumeAcceleration,
            tradeCount24h: item.tradeCount24h,
            volume72h: item.volume72h || null,
            turnover72h: item.turnover72h,
            buySellImbalance: item.buySellImbalance,
            whaleBuyVolumeUsd: item.whaleBuyVolumeUsd || null,
            whaleSellVolumeUsd: item.whaleSellVolumeUsd || null,
            whaleTradeCount: item.whaleTradeCount,
            bidWallImbalance: item.bidWallImbalance,
            openInterestChange: item.openInterestChange,
            fundingRate: item.fundingRate,
            shortLiquidationUsd: item.shortLiquidationUsd || null,
            longLiquidationUsd: item.longLiquidationUsd || null,
            shortSqueezeDepth: item.shortSqueezeDepth || null,
            shortSqueezeTimeframe: item.shortSqueezeTimeframe,
            dexVolume24h: item.dexVolume24h || null,
            dexLiquidityUsd: item.dexLiquidityUsd || null,
            dexTurnover24h: item.dexTurnover24h,
            dexBuySellImbalance: item.dexBuySellImbalance,
            dexUniqueBuyers24h: item.dexUniqueBuyers24h || null,
            dexUniqueSellers24h: item.dexUniqueSellers24h || null,
            cexConfirmations: item.cexConfirmations,
            channelConfirmations: item.channelConfirmations,
            channelMentions: item.channelMentions,
            onchainWhaleUsd: item.onchainWhaleUsd || null,
            exchangeOutflowUsd: item.exchangeOutflowUsd || null,
            exchangeInflowUsd: item.exchangeInflowUsd || null,
            chainId: item.chainId,
            dexUrl: item.dexUrl,
            sourceSummary: item.sourceSummary,
            reasons: item.reasons,
            cooldownKey: `${item.symbol}:${item.chainId ?? "cex"}:${item.direction}:${bucket}`
          }
        });
        created += 1;
        await queueSignalNotifications(signal);
      } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
        if (code !== "P2002") throw error;
      }
    }
    logger.info({ candidates: candidates.length, qualified: qualified.length, created }, "Radar v3.4 multi-source scan completed");
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

const settingsToData = (settings: RadarSettings) => ({
  radarNotificationsEnabled: settings.enabled,
  radarMinimumScore: settings.minimumScore,
  radarIncludeLowCap: settings.includeLowCap,
  radarIncludeMidCap: settings.includeMidCap,
  radarIncludeHighCap: settings.includeHighCap,
  radarIncludeDex: settings.includeDex,
  radarIncludeCex: settings.includeCex,
  radarMinTurnoverPercent: settings.minTurnoverPercent,
  radarMinPriceChange24h: settings.minPriceChange24h !== 0 ? settings.minPriceChange24h : null,
  radarMinTradeCount24h: settings.minTradeCount24h > 0 ? settings.minTradeCount24h : null,
  radarMinDexUniqueBuyers24h: settings.minDexUniqueBuyers24h,
  radarMinBuyImbalancePercent: settings.minBuyImbalancePercent,
  radarMinDexLiquidityUsd: settings.minDexLiquidityUsd,
  radarMinDexVolumeUsd: settings.minDexVolumeUsd,
  radarMinShortLiquidationUsd: settings.minShortLiquidationUsd,
  radarMinShortSqueezeDepth: settings.minShortSqueezeDepth,

  // Legacy advanced thresholds are intentionally neutral in v3.5. They are
  // still measured and displayed as supplementary intelligence, but they no
  // longer gate alerts or change the primary score.
  radarMinMarketCap: 0,
  radarMaxMarketCap: null,
  radarMinVolumeAcceleration: null,
  radarMinTurnover72hPercent: 0,
  radarMinWhaleBuyVolumeUsd: 0,
  radarMinBidWallImbalancePercent: 0,
  radarMinOpenInterestChangePercent: 0,
  radarMinDexTurnoverPercent: 0,
  radarMinDexBuyImbalancePercent: 0,
  radarMaxFundingRatePercent: 0,
  radarMinOnchainWhaleUsd: 0,
  radarMinExchangeOutflowUsd: 0,
  radarMinCexConfirmations: 0,
  radarMinChannelConfirmations: 0
});

export const radarService = {
  status(user: { role: UserRole; radarPreviewAccess: boolean }) {
    return {
      enabled: env.RADAR_ENABLED && (env.RADAR_PUBLIC_ENABLED || user.role === UserRole.ADMIN || user.radarPreviewAccess),
      public: env.RADAR_PUBLIC_ENABLED,
      scanIntervalSeconds: Math.round(env.RADAR_SCAN_INTERVAL_MS / 1000)
    };
  },
  async listSignals(limit = 20) {
    return prisma.radarSignal.findMany({ orderBy: { detectedAt: "desc" }, take: Math.min(Math.max(limit, 1), 50) });
  },
  async updateSettings(userId: string, settings: RadarSettings) {
    const user = await prisma.user.update({ where: { id: userId }, data: settingsToData(settings) });

    if (settings.enabled && user.telegramId) {
      const recentSignals = await prisma.radarSignal.findMany({
        where: { detectedAt: { gte: new Date(Date.now() - SIGNAL_COOLDOWN_MS) } },
        orderBy: { score: "desc" },
        take: 60
      });
      const matching = recentSignals.filter((signal) => matchesUserFilters(signal, user)).slice(0, 3);
      await prisma.radarNotification.createMany({
        data: matching.map((signal) => ({
          signalId: signal.id,
          userId: user.id,
          telegramId: user.telegramId!,
          message: formatSignalMessage(signal, resolveTelegramLanguage(user.preferredLanguage, user.languageCode ?? undefined))
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
    const recent = await prisma.radarSignal.findMany({ orderBy: { detectedAt: "desc" }, take: 60 });
    const signal = recent.find((item) => matchesUserFilters(item, user));
    const demo = signal ?? {
      symbol: "DEMOUSDT", score: 84, price: new Prisma.Decimal("1.245"), marketCap: new Prisma.Decimal("100000000"),
      turnover24h: 0.25, turnover72h: 0.61, priceChange24h: 6.4, volumeAcceleration: 3.7,
      buySellImbalance: 28.5, whaleBuyVolumeUsd: new Prisma.Decimal("420000"), openInterestChange: 3.2,
      shortLiquidationUsd: new Prisma.Decimal("380000"), channelConfirmations: 2
    };
    const result = await sendTelegramMessage(user.telegramId, formatSignalMessage(demo, resolveTelegramLanguage(user.preferredLanguage, user.languageCode ?? undefined)), env.TELEGRAM_WEBAPP_URL ? {
      inline_keyboard: [[{ text: "Open RAMO Finance", web_app: { url: env.TELEGRAM_WEBAPP_URL } }]]
    } : undefined);
    if (!result.sent) throw new Error(result.reason ?? "Telegram send failed");
    return { sent: true };
  }
};

export const startRadarWorkers = () => {
  if (!env.RADAR_ENABLED || scanTimer || notificationTimer) return;
  startRadarStreams();
  void runRadarScan().catch(() => undefined);
  void processRadarNotifications().catch(() => undefined);
  scanTimer = setInterval(() => void runRadarScan().catch(() => undefined), env.RADAR_SCAN_INTERVAL_MS);
  notificationTimer = setInterval(() => void processRadarNotifications().catch(() => undefined), WORKER_INTERVAL_MS);
  logger.info({ intervalMs: env.RADAR_SCAN_INTERVAL_MS, public: env.RADAR_PUBLIC_ENABLED }, "Abnormal activity radar v3.4 started");
};

export const stopRadarWorkers = () => {
  if (scanTimer) clearInterval(scanTimer);
  if (notificationTimer) clearInterval(notificationTimer);
  scanTimer = undefined;
  notificationTimer = undefined;
  stopRadarStreams();
};
