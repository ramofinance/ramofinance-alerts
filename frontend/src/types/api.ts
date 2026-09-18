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
  createdAt: string;
  updatedAt: string;
};

export type RadarStatus = { enabled: boolean; public: boolean; scanIntervalSeconds: number };
export type RadarSignal = {
  id: string; symbol: string; score: number; direction: string; price: string;
  marketCap: string | null; volume24h: string | null; turnover24h: number | null;
  priceChange24h: number | null; volumeAcceleration: number | null; tradeCount24h: number | null;
  sourceSummary: string; reasons: string[]; detectedAt: string;
};

export type TelegramMe = {
  user: User;
  language: PreferredLanguage;
  authDate?: number;
};

export type MiniAppStats = {
  uniqueBotStarters: number;
  totalBotStarts: number;
  totalUsers: number;
  totalOpens: number;
  activeNow: number;
};
