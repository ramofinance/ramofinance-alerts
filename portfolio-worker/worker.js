// RAMO Finance - Portfolio proxy (Cloudflare Worker, free plan).
// Stateless: no database, no storage, addresses are never logged. API keys live in Worker secrets only.
// Runs on Cloudflare, NOT on Render, so it uses none of the Render bandwidth the Radar depends on.
//
// Set in the Cloudflare dashboard (Worker > Settings > Variables and secrets):
//   ALCHEMY_API_KEY     secret  free key from dashboard.alchemy.com (EVM + Solana balances and prices)
//   TELEGRAM_BOT_TOKEN  secret  only used to verify Telegram initData, so only your Mini App can call this
//   ALLOWED_ORIGIN      text    optional, defaults to https://ramofinance.github.io
//   DEBUG_KEY           secret  OPTIONAL. Leave it unset normally; the diagnostic route below is inert without it.
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
  return hex === hash && age >= 0 && age < 86400;
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

// Alchemy gives no USD price for most SPL tokens (POLIS, ATLAS, ...). Only for those, ask DexScreener, and accept a
// price only if the token has a real pool (liquidity >= $10k, the same bar the Radar uses). Airdrop spam has no pool,
// so it stays hidden. Native SOL and everything Alchemy already priced never go through this path.
const DEX_MIN_LIQUIDITY = 10000;
const DEX_BATCH = 30;
const DEX_MAX_MINTS = 60;
// Stablecoin mints on Solana. DexScreener lists them almost only as the quote side of a pair, so they are priced at $1.
const SOL_STABLES = new Set([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"  // USDT
]);

const hasUsdPrice = (t) =>
  (t.tokenPrices || []).some((p) => String(p.currency).toLowerCase() === "usd" && Number(p.value) > 0);

// One retry; successful answers are also cached at Cloudflare's edge for 2 minutes (the URL only contains public mints).
async function dexFetch(url) {
  const opts = { headers: { Accept: "application/json" }, cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 120, "400-599": 0 } } };
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, opts);
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json) ? json : json?.pairs || [];
      }
      lastError = new Error(`dexscreener ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError;
}

async function dexPrices(mints) {
  const best = {};
  const batches = [];
  for (let i = 0; i < mints.length; i += DEX_BATCH) batches.push(mints.slice(i, i + DEX_BATCH));
  const results = await Promise.allSettled(batches.map((b) => dexFetch(`https://api.dexscreener.com/tokens/v1/solana/${b.join(",")}`)));
  let failed = false;
  for (const r of results) {
    if (r.status !== "fulfilled") { failed = true; continue; }
    for (const pair of r.value) {
      const mint = pair?.baseToken?.address; // priceUsd is the base token's price
      const price = Number(pair?.priceUsd);
      const liquidity = Number(pair?.liquidity?.usd);
      if (!mint || !(price > 0) || !(liquidity >= DEX_MIN_LIQUIDITY)) continue;
      if (!best[mint] || liquidity > best[mint].liquidity) best[mint] = { price, liquidity };
    }
  }
  return { best, failed };
}

// Alchemy gives no USD price for most SPL tokens (POLIS, ATLAS, ...). Only for those, ask DexScreener and accept a price
// only if the token has a real pool (liquidity >= $10k, the bar the Radar uses). Airdrop spam has no pool, so it stays hidden.
async function solanaDexHoldings(tokens) {
  const candidates = tokens
    .filter((t) => t.network === "solana-mainnet" && t.tokenAddress && !hasUsdPrice(t) && t.tokenMetadata?.decimals != null)
    .map((t) => ({ t, amount: parseAmount(t.tokenBalance, Number(t.tokenMetadata.decimals)) }))
    .filter((c) => c.amount > 0)
    .slice(0, DEX_MAX_MINTS);
  if (!candidates.length) return { holdings: [], failed: false };

  const needDex = [...new Set(candidates.filter((c) => !SOL_STABLES.has(c.t.tokenAddress)).map((c) => c.t.tokenAddress))];
  const { best, failed } = needDex.length ? await dexPrices(needDex) : { best: {}, failed: false };

  const holdings = candidates.flatMap(({ t, amount }) => {
    const price = SOL_STABLES.has(t.tokenAddress) ? 1 : best[t.tokenAddress]?.price;
    const usd = price ? amount * price : 0;
    return usd >= 0.01
      ? [{ chain: "solana", symbol: String(t.tokenMetadata.symbol || "?").trim().slice(0, 12), amount, usd: Math.round(usd * 100) / 100 }]
      : [];
  });
  return { holdings, failed };
}

async function solanaWallet(env, address) {
  const tokens = await alchemyTokens(env, address, ["solana-mainnet"]);
  const holdings = tokens.map(fromToken).filter(Boolean); // unchanged baseline
  const errors = [];
  try {
    const extra = await solanaDexHoldings(tokens);
    holdings.push(...extra.holdings);
    if (extra.failed) errors.push("dexscreener unavailable");
  } catch {
    errors.push("dexscreener error");
  }
  return { status: "ok", holdings, errors };
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

// Diagnostic: for every token Alchemy returns for a wallet, shows what Alchemy sent and whether our filter keeps it.
async function debugTokens(env, address, groups) {
  const out = { build: "reliability-v1", pages: [], lines: [] };
  const mask = (t) => String(t).split(env.ALCHEMY_API_KEY).join("***").slice(0, 300);
  for (const networks of groups) {
    let pageKey;
    for (let page = 1; page <= 3; page += 1) {
      const res = await fetch(`https://api.g.alchemy.com/data/v1/${env.ALCHEMY_API_KEY}/assets/tokens/by-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          addresses: [{ address, networks }],
          withMetadata: true, withPrices: true, includeNativeTokens: true, includeErc20Tokens: true,
          ...(pageKey ? { pageKey } : {})
        })
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { out.pages.push({ networks: networks.length, page, status: res.status, body: mask(text) }); break; }
      if (!res.ok) { out.pages.push({ networks: networks.length, page, status: res.status, body: mask(text) }); break; }
      const tokens = json?.data?.tokens ?? [];
      out.pages.push({ networks: networks.length, page, status: res.status, tokens: tokens.length, nextPage: Boolean(json?.data?.pageKey) });
      for (const t of tokens) {
        const kept = fromToken(t);
        const hasUsd = hasUsdPrice(t);
        const meta = t.tokenMetadata || {};
        out.lines.push(
          `${kept ? "1" : "0"} | ${t.network} | ${meta.symbol ?? "(no symbol)"} | mint ${t.tokenAddress || "native"} | ` +
          `balance ${t.tokenBalance} | decimals ${meta.decimals ?? "null"} | prices ${JSON.stringify(t.tokenPrices ?? null)} | ` +
          `${kept ? "KEPT" : !hasUsd ? "DROPPED: no usd price" : "DROPPED: value below $0.01 or zero balance"}`
        );
      }
      pageKey = json?.data?.pageKey;
      if (!pageKey) break;
    }
  }
  out.lines.sort(); // dropped tokens (0 |) first
  out.lines = out.lines.slice(0, 80);
  return out;
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
    const debugAllowed = Boolean(env.DEBUG_KEY) && request.headers.get("X-Debug-Key") === env.DEBUG_KEY;
    if (!debugAllowed && env.TELEGRAM_BOT_TOKEN && !(await validInitData(request.headers.get("X-Telegram-Init-Data"), env.TELEGRAM_BOT_TOKEN))) {
      return reply({ error: "auth" }, 401);
    }
    if (!env.ALCHEMY_API_KEY) return reply({ error: "not configured" }, 500);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "json" }, 400); }
    if (debugAllowed && body.debug === true) {
      const first = String(body.wallets?.[0]?.address || "").trim();
      const nets = Object.keys(EVM_NETWORKS);
      const groups = family(first) === "evm" ? [nets.slice(0, 5), nets.slice(5)] : family(first) === "solana" ? [["solana-mainnet"]] : null;
      if (!groups) return reply({ error: "debug needs an EVM or Solana address" }, 400);
      try { return reply(await debugTokens(env, first, groups)); } catch (e) { return reply({ error: String(e && e.message).slice(0, 200) }, 500); }
    }
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
        if (result.status === "ok" && !(result.errors && result.errors.length)) {
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
