# RAMO Finance Telegram Hub v2

## What changed

- Generic RAMO Finance entry point and one `/start` Web App button
- Context-aware navigation: the Services page no longer shows alert-only tabs
- Price Alerts opens with its own Home, Chart, Alerts, and Settings navigation
- CryptoFlow opens inside the hub with a visible back button and Telegram BackButton
- Persian, English, Arabic, Spanish, and Simplified Chinese in the alert UI and bot
- Upcoming signal and investment banners remain hidden by default
- Billing infrastructure remains dormant and invisible (`BILLING_ENABLED=false`)
- No Farcaster dependency was added

## Required deployment behavior

The backend start command already runs `prisma migrate deploy`, so the new language enum migration is applied automatically when Render deploys the new commit.

After deployment, change the Telegram bot display name in BotFather to `RAMO Finance`. The existing bot username can remain unchanged.

## Verification

1. Send `/start` and confirm there is one `RAMO Finance` button.
2. Open the hub and confirm only Services and Settings appear on the first screen.
3. Open Price Alerts and confirm its service navigation appears.
4. Open CryptoFlow and confirm the in-app back button returns to Services.
5. Switch through all five languages in Settings.

## v2.1 analytics and language correction

- Admin statistics now separate unique bot starters, total `/start` commands,
  unique Mini App users, Mini App opens, and users active in the last two minutes.
- Bot-start counters begin when this migration is deployed; historical `/start`
  events cannot be reconstructed reliably.
- Existing saved language choices are reset once during this migration so the
  current Telegram language is detected again. Any later manual language choice
  remains saved normally.
