export type ApiResponse<TData> = {
  success: boolean;
  data: TData;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MarketPrice = {
  id: string;
  marketId: string;
  price: string;
  source: string;
  updatedAt: string;
  createdAt: string;
};

export type MarketPriceHistory = {
  id: string;
  marketId: string;
  price: string;
  source: string;
  observedAt: string;
  createdAt: string;
};

export type Market = {
  id: string;
  symbol: string;
  name: string | null;
  type: string;
  baseAsset: string | null;
  quoteAsset: string | null;
  isActive: boolean;
  latestPrice?: MarketPrice | null;
};

export type Alert = {
  id: string;
  userId: string;
  marketId: string;
  title: string | null;
  targetPrice: string;
  direction: string;
  status: AlertStatus;
  triggeredAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  market?: Market;
};


export type PreferredLanguage = "FA" | "EN" | "AR" | "ES" | "ZH";

export type AlertNotificationSettings = {
  repeatCount: number;
  intervalSeconds: 30 | 60 | 120 | 300 | 600;
};

export type AlertDirection = "ABOVE" | "BELOW" | "CROSSING_UP" | "CROSSING_DOWN";

export type AlertStatus = "ACTIVE" | "TRIGGERED" | "PAUSED" | "CANCELLED" | "EXPIRED";

export type User = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
  preferredLanguage: PreferredLanguage | null;
  role: string;
  isActive: boolean;
  alertNotificationRepeatCount: number;
  alertNotificationIntervalSeconds: number;
  radarNotificationsEnabled: boolean;
  radarMinimumScore: number;
  radarMinMarketCap: number;
  radarMaxMarketCap: number | null;
  radarMinTurnoverPercent: number;
  radarMinVolumeAcceleration: number | null;
  radarMinPriceChange24h: number | null;
  radarMinTradeCount24h: number | null;
  radarMinTurnover72hPercent: number;
  radarMinBuyImbalancePercent: number;
  radarMinWhaleBuyVolumeUsd: number;
  radarMinBidWallImbalancePercent: number;
  radarMinOpenInterestChangePercent: number;
  radarMinDexTurnoverPercent: number;
  radarMinDexLiquidityUsd: number;
  radarMinDexBuyImbalancePercent: number;
  radarMinShortLiquidationUsd: number;
  radarMaxFundingRatePercent: number;
  radarMinOnchainWhaleUsd: number;
  radarMinExchangeOutflowUsd: number;
  radarMinCexConfirmations: number;
  radarMinChannelConfirmations: number;
  radarPreviewAccess: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RadarStatus = { enabled: boolean; public: boolean; scanIntervalSeconds: number };
export type RadarSignal = {
  id: string; symbol: string; score: number; direction: string; price: string;
  marketCap: string | null; volume24h: string | null; turnover24h: number | null;
  priceChange24h: number | null; volumeAcceleration: number | null; tradeCount24h: number | null;
  volume72h: string | null; turnover72h: number | null; buySellImbalance: number | null;
  whaleBuyVolumeUsd: string | null; whaleSellVolumeUsd: string | null; whaleTradeCount: number | null;
  bidWallImbalance: number | null; openInterestChange: number | null; fundingRate: number | null;
  shortLiquidationUsd: string | null; longLiquidationUsd: string | null;
  dexVolume24h: string | null; dexLiquidityUsd: string | null; dexTurnover24h: number | null; dexBuySellImbalance: number | null;
  cexConfirmations: number; channelConfirmations: number; channelMentions: string[] | null;
  onchainWhaleUsd: string | null; exchangeOutflowUsd: string | null; exchangeInflowUsd: string | null;
  chainId: string | null; dexUrl: string | null;
  sourceSummary: string; reasons: string[]; detectedAt: string;
};

export type TelegramMe = {
  user: User;
  language: PreferredLanguage;
  authDate?: number;
  radarStatus?: RadarStatus;
};

export type MiniAppStats = {
  uniqueBotStarters: number;
  totalBotStarts: number;
  totalUsers: number;
  totalOpens: number;
  activeNow: number;
};
