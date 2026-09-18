# RAMO Finance Radar v3

## Included

- Admin-only preview card and complete radar screen
- Real Binance + CoinGecko scan every 120 seconds
- Signal score based on turnover, 15m acceleration, price change, trade count and market-cap sensitivity
- Telegram opt-in, minimum score and instant test-message button
- Background delivery while the Mini App is closed
- Persistent delivery queue, retry logic and four-hour symbol cooldown
- Persian, English, Arabic, Spanish and Chinese Telegram alert messages
- Telegram delivery requires at least 15% 24h volume-to-market-cap turnover
- `@ramoadmin` is promoted automatically when the account starts the bot or opens the Mini App

## Private test

1. Keep `RADAR_PUBLIC_ENABLED=false`.
2. Deploy frontend and backend normally.
3. Open the Mini App from the admin Telegram account.
4. Open the radar from Services, enable Telegram alerts and send a test message.
5. Press **Scan now** or wait for the background scan.
6. After validation, set `RADAR_PUBLIC_ENABLED=true` in Render to expose it to all users.

The radar detects abnormal activity. It does not claim to predict or guarantee a pump.
