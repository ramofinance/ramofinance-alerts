# Radar v3.5.0 — Priority Settings + Gem Cap Switches

## Settings simplification
- Replaced the old min/max market-cap inputs and GEM preset with three independent persisted toggles:
  - LOW CAP: $10K–$1M (default ON)
  - MID CAP: $1M–$100M (default ON)
  - HIGH CAP: $100M–$500M (default OFF)
- Added independent DEX and CEX source toggles (both default ON).
- At least one market-cap bucket and at least one market source must remain enabled.
- Saved values persist per user.

## Only employer-priority factors are configurable and scored
Primary 0–100 score now uses only:
1. 24h volume / market cap — max 25
2. 24h trade count — max 15
3. Unique DEX buyers — max 20
4. Positive 24h price change — max 10
5. Market-cap tier — max 10
6. Buy pressure — max 8
7. DEX liquidity — max 5
8. DEX 24h volume — max 3
9. Short liquidations — max 2
10. Short-squeeze depth — max 2

The remaining collected intelligence (72h turnover, 15m acceleration, whale activity, bid walls, OI, funding, DEX turnover, channel confirmations, exchange flows and on-chain whale transfers) is still checked, stored and shown as supplementary evidence, but it no longer changes the primary score or acts as a hidden user filter.

## New persisted setting
- Minimum DEX 24h volume.

## Important access stability rule
The known-good Radar access/admin/invite files from v3.4.3 were not changed in this release.
