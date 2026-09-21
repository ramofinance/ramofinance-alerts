# Radar v3.5.3 — Mobile help + collapsible settings + 60+ discovery

## UI fixes
- All `!` contextual-help popovers are now mobile-safe fixed cards with a clear background, bounded width, scrolling for long text, and safe-area spacing.
- This fixes the Market Cap help overflowing the viewport and the DEX/CEX help blending into the settings card.
- Existing `!` buttons remain in place.

## Collapsible settings
- `Primary scoring factors` is now a collapsed accordion by default.
- A second `All Radar factor explanations` accordion explains scored and supplementary factors in one place.
- Per-field `!` help remains available.

## Mini App discovery vs Telegram alerts
- The Mini App discovery floor is fixed at **60/100**.
- A user's `Minimum alert score` and numeric filter thresholds remain Telegram-alert filters and no longer hide otherwise eligible 60+ candidates from the Mini App.
- The selected Market Cap ranges and DEX/CEX source toggles still control which discovery families are shown.
- Backend `/api/radar/signals` explicitly returns only 10+ day signals scoring 60 or higher.

## Access safety
- Admin / Grant / Invite / radarPreviewAccess logic was not changed.
- Hashes for the sensitive access files were verified unchanged from v3.5.2.
- Telegram Web App URL cache-bust version only was bumped to 3.5.3.
