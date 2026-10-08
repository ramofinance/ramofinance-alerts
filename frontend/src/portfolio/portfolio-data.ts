import { frontendEnv } from "../config/env";

export type Family = "evm" | "tron" | "solana" | "ton" | "bitcoin" | "sui";

export type ChainId =
  | "ethereum" | "bsc" | "base" | "arbitrum" | "optimism" | "polygon" | "avalanche"
  | "linea" | "zksync" | "mantle" | "tron" | "solana" | "ton" | "bitcoin" | "sui";

export type ChainMeta = {
  id: ChainId;
  name: string;
  family: Family;
  color: string;
  native: string;
  stable: "USDT" | "USDC" | null;
};

export type StoredWallet = { id: string; address: string; label: string };
export type Holding = { chain: ChainId; symbol: string; amount: number; usd: number; change24h: number | null };
// "soon" = network not live yet, "error" = the lookup failed (balances are not shown for either).
export type WalletSnapshot = { id: string; address: string; family: Family; status: "ok" | "soon" | "error"; holdings: Holding[]; partial?: boolean };
// error: set only when a whole request to the Worker failed ("401", "500", ... or "network").
export type PortfolioSnapshot = { updatedAt: number; wallets: WalletSnapshot[]; error?: string };

// Sample numbers are shown until VITE_PORTFOLIO_API_URL points at the portfolio Worker.
export const isSampleMode = () => !frontendEnv.portfolioApiUrl;
export const MAX_WALLETS = 20;

export const CHAINS: ChainMeta[] = [
  { id: "ethereum", name: "Ethereum", family: "evm", color: "#8b9cff", native: "ETH", stable: "USDC" },
  { id: "bsc", name: "BNB Chain", family: "evm", color: "#f5c542", native: "BNB", stable: "USDT" },
  { id: "base", name: "Base", family: "evm", color: "#3b82f6", native: "ETH", stable: "USDC" },
  { id: "arbitrum", name: "Arbitrum", family: "evm", color: "#38bdf8", native: "ETH", stable: "USDC" },
  { id: "optimism", name: "Optimism", family: "evm", color: "#fb7185", native: "ETH", stable: "USDC" },
  { id: "polygon", name: "Polygon", family: "evm", color: "#a78bfa", native: "POL", stable: "USDC" },
  { id: "avalanche", name: "Avalanche", family: "evm", color: "#f87171", native: "AVAX", stable: "USDC" },
  { id: "linea", name: "Linea", family: "evm", color: "#67e8f9", native: "ETH", stable: "USDC" },
  { id: "zksync", name: "zkSync Era", family: "evm", color: "#c4b5fd", native: "ETH", stable: "USDC" },
  { id: "mantle", name: "Mantle", family: "evm", color: "#5eead4", native: "MNT", stable: "USDT" },
  { id: "tron", name: "Tron", family: "tron", color: "#ef4444", native: "TRX", stable: "USDT" },
  { id: "solana", name: "Solana", family: "solana", color: "#34d399", native: "SOL", stable: "USDC" },
  { id: "ton", name: "TON", family: "ton", color: "#0ea5e9", native: "TON", stable: "USDT" },
  { id: "bitcoin", name: "Bitcoin", family: "bitcoin", color: "#f59e0b", native: "BTC", stable: null },
  { id: "sui", name: "Sui", family: "sui", color: "#60a5fa", native: "SUI", stable: "USDC" }
];

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as Record<ChainId, ChainMeta>;

const ASSET_COLORS: Record<string, string> = {
  BTC: "#f59e0b", ETH: "#818cf8", USDT: "#34d399", USDC: "#38bdf8",
  SOL: "#a78bfa", BNB: "#facc15", TRX: "#f87171", TON: "#60a5fa"
};
export const assetColor = (symbol: string) => ASSET_COLORS[symbol] ?? "#94a3b8";

// Sample prices, used only while IS_SAMPLE_DATA is true.
const PRICES: Record<string, number> = {
  ETH: 3200, BNB: 600, POL: 0.45, AVAX: 30, MNT: 0.8, TRX: 0.25, SOL: 150, TON: 5,
  BTC: 65000, SUI: 3.5, USDT: 1, USDC: 1, LINK: 14, UNI: 8, ARB: 0.9
};
const EXTRA_TOKENS = ["LINK", "UNI", "ARB"];

export const detectFamily = (raw: string): Family | null => {
  const a = raw.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return "evm";
  if (/^0x[a-fA-F0-9]{64}$/.test(a)) return "sui";
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return "tron";
  if (/^bc1[a-z0-9]{25,87}$/i.test(a) || /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) return "bitcoin";
  if (/^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(a)) return "ton";
  if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(a)) return "solana";
  return null;
};

export const normalizeAddress = (raw: string) => {
  const a = raw.trim();
  return a.startsWith("0x") ? a.toLowerCase() : a;
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const holding = (chain: ChainId, symbol: string, usd: number, r: () => number): Holding => ({
  chain,
  symbol,
  amount: usd / (PRICES[symbol] ?? 1),
  usd,
  change24h: symbol === "USDT" || symbol === "USDC" ? 0 : (r() - 0.5) * 10
});

// Same address always gives the same sample wallet, so the preview is stable between refreshes.
const sampleWallet = (w: StoredWallet): WalletSnapshot => {
  const family = detectFamily(w.address) ?? "evm";
  const r = mulberry32(hash(normalizeAddress(w.address)));
  const pool = CHAINS.filter((c) => c.family === family);
  const chosen = family === "evm" ? pool.filter(() => r() > 0.55) : pool;
  const chains = chosen.length ? chosen : [pool[0]];
  const holdings: Holding[] = [];

  for (const chain of chains) {
    holdings.push(holding(chain.id, chain.native, 40 + r() * r() * 9000, r));
    if (chain.stable && r() > 0.35) holdings.push(holding(chain.id, chain.stable, 20 + r() * 3000, r));
    if (family === "evm" && r() > 0.7) {
      holdings.push(holding(chain.id, EXTRA_TOKENS[Math.floor(r() * EXTRA_TOKENS.length)], 15 + r() * 600, r));
    }
  }
  return { id: w.id, address: w.address, family, status: "ok", holdings };
};

// One wallet per request: spam-heavy wallets return a lot of JSON, and the free plan allows only 10 ms of CPU per request.
const WORKER_BATCH = 1;

const toSnapshot = (w: StoredWallet, r: any): WalletSnapshot => ({
  id: w.id,
  address: w.address,
  family: detectFamily(w.address) ?? "evm",
  status: r?.status === "ok" ? "ok" : r?.status === "soon" ? "soon" : "error",
  // the Worker reports problems it could not fully recover from (e.g. a price source was down)
  partial: Array.isArray(r?.errors) && r.errors.length > 0,
  holdings: (Array.isArray(r?.holdings) ? r.holdings : [])
    .filter((h: any) => h && h.chain in CHAIN_BY_ID)
    .map((h: any) => ({
      chain: h.chain as ChainId,
      symbol: String(h.symbol),
      amount: Number(h.amount) || 0,
      usd: Number(h.usd) || 0,
      change24h: null
    }))
});

// Live mode asks the portfolio Worker (stateless, not on Render). Nothing is stored server-side.
export const fetchPortfolio = async (wallets: StoredWallet[]): Promise<PortfolioSnapshot> => {
  const base = frontendEnv.portfolioApiUrl.replace(/\/$/, "");
  if (!base) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { updatedAt: Date.now(), wallets: wallets.map(sampleWallet) };
  }

  const initData = window.Telegram?.WebApp?.initData ?? "";
  const batches: StoredWallet[][] = [];
  for (let i = 0; i < wallets.length; i += WORKER_BATCH) batches.push(wallets.slice(i, i + WORKER_BATCH));

  let firstError: string | undefined;
  const parts = await Promise.all(
    batches.map(async (batch) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(`${base}/portfolio`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData },
          body: JSON.stringify({ wallets: batch.map((w) => ({ id: w.id, address: w.address })) })
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        return batch.map((w) => toSnapshot(w, (data.wallets ?? []).find((x: any) => x.id === w.id)));
      } catch (e) {
        const code = e instanceof Error ? e.message : "";
        firstError = firstError ?? (/^\d{3}$/.test(code) ? code : "network");
        return batch.map((w) => toSnapshot(w, undefined));
      } finally {
        clearTimeout(timer);
      }
    })
  );
  return { updatedAt: Date.now(), wallets: parts.flat(), error: firstError };
};

export const walletTotal = (w: WalletSnapshot) => w.holdings.reduce((sum, h) => sum + h.usd, 0);

export const summarize = (wallets: WalletSnapshot[]) => {
  let total = 0;
  let previous = 0;
  let tracked = false;
  const byChain = new Map<ChainId, number>();
  const byAsset = new Map<string, number>();

  for (const w of wallets) {
    for (const h of w.holdings) {
      total += h.usd;
      if (h.change24h === null) {
        previous += h.usd;
      } else {
        previous += h.usd / (1 + h.change24h / 100);
        tracked = true;
      }
      byChain.set(h.chain, (byChain.get(h.chain) ?? 0) + h.usd);
      byAsset.set(h.symbol, (byAsset.get(h.symbol) ?? 0) + h.usd);
    }
  }
  const change = total - previous;
  return {
    total,
    change,
    pct: tracked && previous > 0 ? (change / previous) * 100 : null,
    byChain: [...byChain.entries()].sort((a, b) => b[1] - a[1]),
    byAsset: [...byAsset.entries()].sort((a, b) => b[1] - a[1])
  };
};
