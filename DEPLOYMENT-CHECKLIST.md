# RAMO FINANCE Telegram Hub — Deployment Checklist

## Current product mode

- All user-facing features are available without payment or plan limits.
- Billing infrastructure is dormant and hidden while `BILLING_ENABLED=false`.
- Do not expose subscription routes or add plan, trial, upgrade, or payment copy to the UI.

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
- Frontend: `VITE_API_URL`, `VITE_WS_URL`, and `VITE_CRYPTOFLOW_URL`

## Telegram setup

1. Configure the bot Web App URL to the deployed frontend HTTPS URL.
2. Register the backend webhook with the same `TELEGRAM_WEBHOOK_SECRET` used by the server.
3. Run `/start` and verify the single `RAMO Finance` button opens the Services hub.
4. Open CryptoFlow and verify both the visible back button and Telegram BackButton return to Services.
5. Open Price Alerts and verify its own navigation appears only inside that service.
6. Confirm a new alert belongs only to the signed-in Telegram user.
7. Confirm a triggered alert is delivered by the bot.

## Security verification

- Private API calls without `X-Telegram-Init-Data` must return 401.
- Expired Telegram init data must return 401.
- A user must not read or mutate another user's alerts, favorites, or settings.
- Manual price updates and user administration must return 403 for ordinary users.
- Subscription endpoints must return 404 while billing is disabled.
- Production startup must fail when secrets or allowed origins are missing.
