# RAMO Finance Radar v3.4.0 — Gem Intelligence + Context Help

This release is additive to v3.3.0 and keeps the existing admin/invite access, multi-source scanner, Telegram delivery and five-minute monitoring cadence.

## What changed

- Added a small `!` contextual help control beside every Radar setting, including Telegram alert delivery. Each explanation describes the metric, how it affects alerts, and what `0` means.
- Settings remain persisted per user. Default values are visible, and the last saved values are loaded back into the fields.
- Added Gem market-cap presets: LOW CAP ($10K–$1M), MID CAP ($1M–$100M), HIGH CAP ($100M–$500M), and GEM ($10K–$100M). Signal cards show the matching cap badge. These tiers are project-specific, not universal market definitions.
- Added real 24h unique DEX buyer/seller enrichment through GeckoTerminal for selected DEX candidates. This is intended to distinguish broad wallet participation from repeated activity by a small number of wallets. Public CEX trade feeds do not expose unique trader identities, so RAMO does not fabricate that metric for Binance/Bybit/OKX.
- Added a per-user `Minimum unique DEX buyers (24h)` filter. `0` disables this mandatory filter while the metric can still contribute to scoring when data exists.
- Added Short Squeeze Depth. Binance Futures candles are checked on 15m, 1h, 4h and 1D; Radar stores the timeframe with the strongest sweep and the number of consecutive prior candle highs taken.
- Added a per-user `Minimum squeeze depth` filter. `0` disables this mandatory filter.
- Telegram alerts now include unique DEX buyer/seller counts and squeeze depth when available.

## Scoring emphasis

The score remains capped at 100, but v3.4 shifts emphasis toward early-gem behavior requested during field feedback:

- 24h volume / market cap remains the strongest core factor.
- 24h trade count now carries more weight.
- Real DEX unique-buyer participation can carry substantial weight.
- Positive 24h price change receives more weight.
- Low/mid-cap project tiers receive a gem-sensitivity bonus.
- Short-squeeze candle depth can add conviction.
- CEX confirmation carries less weight so early DEX-only gems are not heavily penalized.

Other v3.3 factors remain in place: 72h turnover, volume acceleration, taker pressure, whale net buying, bid-wall imbalance, OI, funding filter, short liquidations, DEX turnover/liquidity/buy pressure/volume, channel confirmations, exchange outflow and on-chain whale activity.

## Zero-value behavior

For optional numeric minimum filters, `0` means the filter is not mandatory for alert qualification. The underlying metric may still affect the 0–100 score. `Max market cap = 0` means no market-cap ceiling, and `Max funding rate = 0` means no funding-rate ceiling. Minimum Score remains always active and cannot be zero.

## Monitoring cadence

Automatic Radar scans remain every 5 minutes. The backend enforces a 300,000 ms minimum even if an older environment value is lower. The Mini App refresh cadence remains five minutes.

## Data-source note

GeckoTerminal is queried only for a limited set of selected DEX candidates to stay within public API limits. If that enrichment is unavailable, the core scanner continues operating and the unique-buyer fields remain zero/unavailable rather than being estimated.

## Database

The included migration is additive. It adds per-user filters and signal fields for unique DEX participants and short-squeeze depth; it does not remove existing data or access controls.
