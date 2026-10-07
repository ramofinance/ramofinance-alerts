// RAMO Finance - Portfolio proxy (Cloudflare Worker, free plan).
// Stateless: no database, no storage, addresses are never logged. API keys live in Worker secrets only.
// Runs on Cloudflare, NOT on Render, so it uses none of the Render bandwidth the Radar depends on.
//
// Set in the Cloudflare dashboard (Worker > Settings > Variables and secrets):
//   ALCHEMY_API_KEY     secret  free key from dashboard.alchemy.com (EVM + Solana balances and prices)
//   TELEGRAM_BOT_TOKEN  secret  only used to verify Telegram initData, so only your Mini App can call this
//   ALLOWED_ORIGIN      text    optional, defaults to https://ramofinance.github.io
//
// POST /portfolio   { wallets: [{ id, address }] }  (max 8 per request)
//   -> { updatedAt, wallets: [{ id, status: "ok" | "soon" | "error", holdings: [{ chain, symbol, amount, usd }], errors? }] }

const MAX_WALLETS = 8;
const CACHE_MS = 120000;
const TRON_USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// Alchemy network id -> our chain id. If a network name is rejected, the response "errors" says which chunk failed.
const EVM_NETWORKS = {
  "eth-mainnet": "ethereum", "bnb-mainnet": "bsc", "base-mainnet": "base", "arb-mainnet": "arbitrum",
  "opt-mainnet": "optimism", "polygon-mainnet": "polygon", "avax-mainnet": "avalanche",
  "linea-mainnet": "linea", "zksync-mainnet": "zksync", "mantle-mainnet": "mantle"
};
const NATIVE = {
  ethereum: "ETH", bsc: "BNB", base: "ETH", arbitrum: "ETH", optimism: "ETH",
  polygon: "POL", avalanche: "AVAX", linea: "ETH", zksync: "ETH", mantle: "MNT", solana: "SOL"
};

const family = (raw) => {
  const a = String(raw || "").trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return "evm";
  if (/^0x[a-fA-F0-9]{64}$/.test(a)) return "sui";
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return "tron";
  if (/^bc1[a-z0-9]{25,87}$/i.test(a) || /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) return "bitcoin";
  if (/^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(a)) return "ton";
  if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(a)) return "solana";
  return null;
};

// Short-lived in-memory cache (per Worker isolate). Lost on restart, never persisted.
const cache = new Map();
const cacheKey = (a) => (a.startsWith("0x") ? a.toLowerCase() : a);

async function validInitData(initData, botToken) {
  if (!initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const data = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const enc = new TextEncoder();
  const hmac = async (key, msg) => {
    const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", k, msg));
  };
  const secret = await hmac(enc.encode("WebAppData"), enc.encode(botToken));
  const sig = await hmac(secret, enc.encode(data));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const age = Date.now() / 1000 - Number(params.get("auth_date"));
  return hex === hash && age < 86400;
}

const parseAmount = (raw, decimals) => {
  if (raw === null || raw === undefined) return 0;
  const s = String(raw);
  if (s.startsWith("0x")) {
    try { return Number(BigInt(s)) / 10 ** decimals; } catch { return 0; }
  }
  return Number(s) || 0; // plain decimal strings are treated as already decoded
};

async function alchemyTokens(env, address, networks) {
  const res = await fetch(`https://api.g.alchemy.com/data/v1/${env.ALCHEMY_API_KEY}/assets/tokens/by-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      addresses: [{ address, networks }],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true
    })
  });
  if (!res.ok) throw new Error(`alchemy ${res.status}`);
  const json = await res.json();
  return json?.data?.tokens ?? [];
}

function fromToken(t) {
  const chain = t.network === "solana-mainnet" ? "solana" : EVM_NETWORKS[t.network];
  if (!chain) return null;
  const usdPrice = Number((t.tokenPrices || []).find((p) => String(p.currency).toLowerCase() === "usd")?.value);
  if (!usdPrice) return null; // unpriced tokens (mostly spam airdrops) are skipped
  const meta = t.tokenMetadata || {};
  const native = !t.tokenAddress;
  const decimals = Number(meta.decimals ?? (chain === "solana" ? 9 : 18));
  const amount = parseAmount(t.tokenBalance, decimals);
  const usd = amount * usdPrice;
  if (!(usd >= 0.01)) return null;
  return {
    chain,
    symbol: native ? NATIVE[chain] : String(meta.symbol || "?").slice(0, 12),
    amount,
    usd: Math.round(usd * 100) / 100
  };
}

async function evmWallet(env, address) {
  const nets = Object.keys(EVM_NETWORKS);
  const chunks = [nets.slice(0, 5), nets.slice(5)]; // 5 networks per request keeps within Alchemy's limits
  const results = await Promise.allSettled(chunks.map((c) => alchemyTokens(env, address, c)));
  const holdings = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") r.value.forEach((t) => { const h = fromToken(t); if (h) holdings.push(h); });
    else errors.push(`evm group ${i + 1}: ${r.reason && r.reason.message}`);
  });
  return { status: errors.length === chunks.length ? "error" : "ok", holdings, errors };
}

async function solanaWallet(env, address) {
  const tokens = await alchemyTokens(env, address, ["solana-mainnet"]);
  return { status: "ok", holdings: tokens.map(fromToken).filter(Boolean) };
}

async function bitcoinWallet(address, getPrices) {
  const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(`mempool ${res.status}`);
  const j = await res.json();
  const sats =
    j.chain_stats.funded_txo_sum - j.chain_stats.spent_txo_sum +
    j.mempool_stats.funded_txo_sum - j.mempool_stats.spent_txo_sum;
  const amount = sats / 1e8;
  const price = (await getPrices()).BTC;
  if (!price) throw new Error("no BTC price");
  const usd = amount * price;
  return { status: "ok", holdings: usd >= 0.01 ? [{ chain: "bitcoin", symbol: "BTC", amount, usd: Math.round(usd * 100) / 100 }] : [] };
}

async function tronWallet(address, getPrices) {
  const res = await fetch(`https://api.trongrid.io/v1/accounts/${address}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`trongrid ${res.status}`);
  const acc = (await res.json())?.data?.[0];
  const holdings = [];
  if (acc) {
    const trx = (acc.balance || 0) / 1e6;
    const price = (await getPrices()).TRX;
    if (trx > 0 && !price) throw new Error("no TRX price");
    if (trx * price >= 0.01) holdings.push({ chain: "tron", symbol: "TRX", amount: trx, usd: Math.round(trx * price * 100) / 100 });
    const entry = (acc.trc20 || []).find((o) => o && TRON_USDT in o);
    const usdt = entry ? Number(entry[TRON_USDT]) / 1e6 : 0;
    if (usdt >= 0.01) holdings.push({ chain: "tron", symbol: "USDT", amount: usdt, usd: Math.round(usdt * 100) / 100 });
  }
  return { status: "ok", holdings };
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "https://ramofinance.github.io";
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin"
    };
    const reply = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" }
      });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply({ error: "method" }, 405);
    if (origin && origin !== allowed) return reply({ error: "origin" }, 403);
    if (env.TELEGRAM_BOT_TOKEN && !(await validInitData(request.headers.get("X-Telegram-Init-Data"), env.TELEGRAM_BOT_TOKEN))) {
      return reply({ error: "auth" }, 401);
    }
    if (!env.ALCHEMY_API_KEY) return reply({ error: "not configured" }, 500);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "json" }, 400); }
    const list = (Array.isArray(body.wallets) ? body.wallets : []).slice(0, MAX_WALLETS);

    // BTC and TRX prices from the same Alchemy key, fetched at most once per request.
    let pricePromise;
    const getPrices = () => {
      pricePromise = pricePromise || fetch(
        `https://api.g.alchemy.com/prices/v1/${env.ALCHEMY_API_KEY}/tokens/by-symbol?symbols=BTC&symbols=TRX`
      ).then((r) => r.json()).then((j) => {
        const out = {};
        for (const row of j.data || []) {
          const p = (row.prices || []).find((x) => String(x.currency).toLowerCase() === "usd");
          if (p) out[row.symbol] = Number(p.value);
        }
        return out;
      }).catch(() => ({}));
      return pricePromise;
    };

    const wallets = await Promise.all(list.map(async (w) => {
      const address = String(w?.address || "").trim();
      const id = String(w?.id || "");
      const fam = family(address);
      if (!fam) return { id, status: "error", holdings: [] };
      if (fam === "ton" || fam === "sui") return { id, status: "soon", holdings: [] };

      const key = cacheKey(address);
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return { id, ...hit.result };

      try {
        const result =
          fam === "evm" ? await evmWallet(env, address)
          : fam === "solana" ? await solanaWallet(env, address)
          : fam === "bitcoin" ? await bitcoinWallet(address, getPrices)
          : await tronWallet(address, getPrices);
        if (result.status === "ok") {
          if (cache.size > 500) cache.clear();
          cache.set(key, { at: Date.now(), result });
        }
        return { id, ...result };
      } catch (e) {
        return { id, status: "error", holdings: [], errors: [String(e && e.message).slice(0, 120)] };
      }
    }));

    return reply({ updatedAt: Date.now(), wallets });
  }
};
