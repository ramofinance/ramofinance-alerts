# RAMO FINANCE Telegram Hub — Deployment Checklist

## Current product mode

- All existing user-facing features remain available without payment or plan limits.
- Billing infrastructure stays dormant and hidden while `BILLING_ENABLED=false`.
- Radar private-access/admin/invite behavior from v3.2.4 is preserved.

## Required production configuration

- `NODE_ENV=production`
- `DATABASE_URL` and `DIRECT_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_WEBAPP_URL`
- `TELEGRAM_WEBHOOK_SECRET`
- `CRYPTOFLOW_URL=https://cryptoflow.ramo-fin-group.workers.dev/`
- `ALLOWED_ORIGINS` with the exact HTTPS frontend origin
- `BILLING_ENABLED=false`
- `PRICE_POLLING_ENABLED=true`
- `PRICE_POLLING_INTERVAL_MS=30000`
- `FINNHUB_API_KEY` for forex and gold prices
- `RADAR_ENABLED=true`
- `RADAR_PUBLIC_ENABLED=false` while Radar is private
- `RADAR_SCAN_INTERVAL_MS=300000` (values below this are clamped to 5 minutes)
- Frontend: `VITE_API_URL`, `VITE_WS_URL`, and `VITE_CRYPTOFLOW_URL`

### Optional Radar configuration

- `WHALE_ALERT_API_KEY` — enables direct Whale Alert WebSocket enrichment. Leave unset if no key is available.
- `RADAR_WHALE_ALERT_MIN_USD=1000000` — minimum direct Whale Alert transfer value.

The core CEX/DEX/Telegram-public-preview Radar continues when the optional Whale Alert key is absent.

## Database

The new migration `20260919203000_add_radar_multisource_intelligence` is additive. The existing backend start command runs `prisma migrate deploy`, so no destructive reset is required.

## Telegram / Radar verification after deploy

1. Open Services as the admin and verify CryptoFlow, Price Alerts and Radar are all visible.
2. Open Radar and verify every settings field contains a numeric value (not blank).
3. Change two or three filters, save, close/reopen Radar and confirm the saved values remain.
4. Confirm the hint states that automatic scans run every 5 minutes.
5. As admin, use **Scan now** once and verify the request completes even if an optional external source is unavailable.
6. Verify a signal card can show new metrics such as 72h turnover, buy pressure, CEX confirmations, DEX metrics, OI or liquidations when those data are available.
7. Verify an invited non-admin Radar user can still open Radar but cannot use the admin-only manual scan route.
8. Verify Telegram test notification still works.

## Security verification

- Private API calls without `X-Telegram-Init-Data` must return 401.
- Expired Telegram init data must return 401.
- A user must not read or mutate another user's alerts, favorites, or settings.
- Manual Radar scan and user administration must return 403 for ordinary users.
- Subscription endpoints must return 404 while billing is disabled.
- Production startup must fail when required secrets or allowed origins are missing.
