# RAMO Finance Radar v3.3.0 — Multi-Source Intelligence

v3.3.0 expands the private Radar from a Binance/CoinGecko scanner into a multi-source abnormal-activity engine while preserving the v3.2.4 access system and v3.2.5 per-user filtering.

## Scan cadence

- Automatic candidate evaluation: every **5 minutes**.
- The backend clamps `RADAR_SCAN_INTERVAL_MS` to at least 300000 ms, so an older 120000 ms environment value cannot bring back 2-minute scans.
- The Radar screen refreshes every 5 minutes; admins can still use **Scan now**.
- Binance liquidation and optional Whale Alert streams remain connected continuously so the next 5-minute scan can use a rolling 1-hour event window.

## Market coverage

### Centralized exchanges
- Binance Spot USDT pairs
- Bybit Spot USDT pairs
- OKX Spot USDT pairs
- CEX confirmation count across the three venues
- CoinGecko market-cap/24h-volume universe expanded to the first 1,000 market-cap ranked assets

### CEX intelligence
- 24h volume / market cap
- 72h CEX volume / market cap
- 15m volume acceleration
- Recent taker buy/sell imbalance
- Large recent buy/sell trade flow
- Order-book bid/ask wall imbalance
- Binance + Bybit open-interest change and funding enrichment when a matching derivative exists
- Binance Futures 1h long/short liquidation enrichment

### DEX / multi-chain discovery
- DEXScreener boosted-token discovery across chains indexed by DEXScreener
- 24h DEX turnover
- DEX liquidity
- DEX buy/sell transaction imbalance
- DEX-only candidates can qualify for the composite score; they do not require a CEX confirmation by default

### Public channel intelligence
Best-effort monitoring of public Telegram previews for:
- `cointrendz_whalehunter`
- `WhaleSniper`
- `whalebotalerts`
- `DeFiSniper`
- `WallMonitor`
- `cryptoquant_alert`
- `whale_alert_io`
- `whalebotpumps`
- `BinanceLiquidations`
- `REKTbinance`

Channel mentions are used as confirmation/enrichment. If Telegram blocks or changes a public preview, the core market scan continues without that source.

### On-chain whale enrichment
- Public `whale_alert_io` channel parsing provides a no-key fallback where usable.
- Optional direct Whale Alert WebSocket enrichment activates when `WHALE_ALERT_API_KEY` is configured.
- Direct feed events are aggregated into rolling 1h whale-transfer, exchange-outflow and exchange-inflow metrics.

## User settings

All numeric inputs always display a value. Saved values are returned from PostgreSQL and placed back into the fields after save and on future app opens. For optional filters, **0 = disabled / no extra restriction**.

- Minimum score
- Min / max market cap
- Minimum 24h turnover
- Minimum 72h turnover
- Minimum 15m volume acceleration
- Minimum 24h price change
- Minimum 24h trade count
- Minimum taker buy pressure
- Minimum recent large-buy volume
- Minimum bid-wall advantage
- Minimum CEX confirmations
- Minimum monitored-channel confirmations
- Minimum open-interest growth
- Minimum 1h short liquidations
- Maximum absolute funding rate
- Minimum DEX turnover
- Minimum DEX liquidity
- Minimum DEX buy pressure
- Minimum on-chain whale value
- Minimum exchange outflow

Defaults preserve the prior behavior where practical: score 75, market cap >= $3M, 24h turnover >= 15%; new optional intelligence filters default to 0 so they do not unexpectedly hide signals.

## Scope note

This release materially broadens coverage, but it does **not** claim mathematically exhaustive coverage of every token and every blockchain. DEX discovery is limited to assets discoverable through the public DEXScreener feeds used here, public Telegram monitoring is best-effort, and direct on-chain whale enrichment depends on the available Whale Alert feed/key. The engine fails open on optional sources so one unavailable provider does not stop the entire Radar.
