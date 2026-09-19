# RAMO Finance Radar v3.2.4

## Access recovery and Telegram WebView reliability

This release keeps the v3.2 access-management features while restoring the reliable v3.1 behavior for administrators.

- Administrators are recognized by both configured Telegram usernames and stable Telegram IDs. This self-heals the ADMIN role when a database is recreated and the account is first seen after migrations have already run.
- Radar requests use the Mini App `initData` captured during Telegram initialization instead of relying only on a later global WebApp lookup.
- The Services page keeps Radar visible whenever the authenticated user is an ADMIN or has `radarPreviewAccess`, even if a status refresh is temporarily stale.
- Successful invite redemption now returns a direct **Open Radar** button.
- Hub and Radar Web App URLs are versioned with `v=3.2.4` to bypass stale Telegram WebView caches.
- `index.html` is served with no-cache headers so new deployments are picked up reliably while Vite hashed assets remain cache-friendly.

## Access rules

- ADMIN: Radar is available whenever `RADAR_ENABLED=true`.
- Invited/granted user: Radar is available whenever `RADAR_ENABLED=true` and `radarPreviewAccess=true`.
- Other users: Radar remains hidden while `RADAR_PUBLIC_ENABLED=false`.
- `/admin`, invite links, grant/revoke, and access-list behavior from v3.2.x are preserved.
