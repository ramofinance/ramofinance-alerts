# RAMO FINANCE Telegram Hub

Telegram Mini App hub that brings CryptoFlow market intelligence and realtime
price alerts together behind one bot. The current release is fully available
without plans, payments, trials, or user-facing billing messages.

## Abnormal Activity Radar (private preview)

Current Radar release: **v3.3.0 Multi-Source Intelligence**.

- 5-minute automatic scans (the backend enforces a minimum 5-minute interval)
- Binance + Bybit + OKX Spot activity with CoinGecko market-cap context
- 24h and 72h turnover, 15m acceleration, taker flow, large trades and order-book imbalance
- Derivatives enrichment: open interest, funding and Binance Futures liquidation flow
- DEXScreener multi-chain discovery with DEX turnover, liquidity and buy/sell pressure
- Best-effort public intelligence from the configured whale/liquidation Telegram channels
- Optional direct Whale Alert stream via `WHALE_ALERT_API_KEY`; no key is required for the core Radar
- Per-user persisted filters; every numeric field stays visible and `0` disables optional filters
- Telegram delivery continues while the Mini App is closed
- Four-hour per-symbol/chain cooldown and persisted retry queue reduce duplicate/noisy alerts
- `RADAR_PUBLIC_ENABLED=false` preserves private admin/invite access during testing

See `RADAR-V3.3.0-NOTES.md` for coverage details and limitations. Render applies the included additive Prisma migration automatically through the existing start command.

## Stack

- Monorepo with npm workspaces
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Realtime: WebSocket
- Docker: PostgreSQL, backend, frontend

## Local services

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- WebSocket: ws://localhost:3000/ws
- PostgreSQL: localhost:5432

## Product entry points

- **Services:** the default Mini App screen with separate CryptoFlow and Price Alerts choices.
- **CryptoFlow:** opens inside the RAMO Finance shell, with an in-app and Telegram back button.
- **Price Alerts:** opens the native alert creation and management experience.
- **Telegram `/start`:** presents one generic RAMO Finance Web App button; service selection happens inside the hub.

The interface and bot support Persian, English, Arabic, Spanish, and Simplified Chinese.

The dormant billing code is available for a later release, but remains
unmounted and invisible while `BILLING_ENABLED=false`.

## Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in the production secrets and exact HTTPS origins before deployment. See
`DEPLOYMENT-CHECKLIST.md` for the complete checklist.

## Development

```bash
npm ci
npx prisma generate --schema database/prisma/schema.prisma
npm run dev
```

## Verification

```bash
npm run build
npm run smoke:test
```
