# Radar v3.5.1 — Minimum Market History + DEX Identity

- Adds a hard minimum of **10 days of verifiable market history** before a token can be stored, displayed, or alerted.
- DEX-only assets use DexScreener pair creation time, with GeckoTerminal pool creation time as a fallback where available. Unknown DEX age is rejected conservatively.
- CEX assets verify at least 10 days of daily candle history on Binance, Bybit, or OKX.
- Telegram alerts now include DEX **network/chain**, **base contract address**, quote asset, DEX name, and verified age when available.
- RadarSignal stores DEX identity metadata (DEX, pair address, token contract, quote asset, pair creation time, verified age).
- Cooldown identity includes token contract address so same-symbol tokens on the same chain do not collide.
- Existing admin/invite/access logic is unchanged.
