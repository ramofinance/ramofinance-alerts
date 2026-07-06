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

export type Market = {
  id: string;
  symbol: string;
  name: string | null;
  type: string;
  baseAsset: string | null;
  quoteAsset: string | null;
  isActive: boolean;
};

export type Alert = {
  id: string;
  userId: string;
  marketId: string;
  title: string | null;
  targetPrice: string;
  direction: string;
  status: string;
  triggeredAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  market?: Market;
};
