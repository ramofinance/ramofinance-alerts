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


export type PreferredLanguage = "FA" | "EN";

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
  createdAt: string;
  updatedAt: string;
};

export type TelegramMe = {
  user: User;
  language: PreferredLanguage;
  authDate?: number;
};
