# RAMO Finance Radar v3.2.5

Advanced per-user Radar alert filters added on top of v3.2.4 access recovery.

## New user-configurable filters
- Minimum activity score (60-95)
- Minimum market cap (USD millions)
- Optional maximum market cap (USD millions)
- Minimum 24h volume / market-cap ratio (%) — default remains 15%
- Optional minimum 15m volume acceleration (x)
- Optional minimum 24h price change (%)
- Optional minimum 24h trade count

The scanner/scoring engine remains unchanged. These settings control which already-detected signals are eligible for each user's Telegram notifications. Blank optional fields mean no additional filter.
