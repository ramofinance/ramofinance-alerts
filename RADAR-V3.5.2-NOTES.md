# Radar v3.5.2 — Durable access guard

- Radar access logic is now protected by a single backend identity guard.
- Admin access is recognized by DB role, configured admin IDs/usernames, and the project's existing primary admin identity.
- The primary admin can see the Radar card even if the database role is temporarily stale.
- Admin endpoints use the same guard.
- Granted users continue to use `radarPreviewAccess` and are not promoted to admin.
- A small additive migration reasserts the existing primary admin row if present.
- No Radar scoring, market-age, DEX metadata, settings, or signal logic changed from v3.5.1.
