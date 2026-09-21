# Radar v3.5.4 — Signal card glance + copyable DEX contract

## UI-only signal card update
- Market cap is now shown beside the score at the top of every signal card for faster scanning.
- The old duplicate market-cap tile was removed from the metric grid.
- DEX signals now show a dedicated identity block with network, DEX pair and contract address.
- Contract address supports tap-to-copy and has an explicit Copy / Copied state.
- Contract text uses a monospace style and truncates safely on narrow mobile screens.

## Access stability
- No Admin, Grant, Invite, radarPreviewAccess, Services visibility, or Radar access-control files were modified.
- Only `RadarPanel.tsx`, `app.css`, and the Telegram WebApp cache-bust version were changed.
