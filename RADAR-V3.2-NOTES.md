# RAMO Finance Radar v3.2

## Private preview access from Telegram

Administrators can manage private Radar access without changing Render environment variables.

- `/admin` opens the access-management menu.
- **Create invite link** creates a single-use link that expires after seven days.
- **Access list** shows administrators and invited preview users, with revoke buttons.
- `/grant @username` grants access to a user who has already started the bot.
- `/revoke @username` revokes Radar access and disables that user's Radar notifications.
- `/accesslist` opens the access list directly.

Preview users receive Radar access only. They are not promoted to administrator and cannot run manual scans or access administrative statistics.

While `RADAR_PUBLIC_ENABLED=false`, Radar data and notifications are limited to administrators and explicitly approved preview users.

## Data sources

The scanner continues to use direct Binance and CoinGecko market data. External Telegram channels are not ingested in this release.

## v3.2.1 visibility fix

Radar availability is now returned with the authenticated Telegram user and refreshed whenever the Services tab is opened. This prevents an approved preview user from remaining hidden behind a stale initial status request.

## v3.2.2 direct access and diagnostics

- `/radar` reports access for the exact Telegram account issuing the command.
- Approved users receive a versioned **Open Radar** Web App button that bypasses stale Telegram WebView caches.
- The Services card is also shown directly from `radarPreviewAccess`, independently of the administrator role.

## v3.2.3 direct-open loading fix

The direct Radar link now waits for Telegram authentication and the access response before switching away from Services. A slow or failed user request can no longer leave the Mini App on an empty screen.
