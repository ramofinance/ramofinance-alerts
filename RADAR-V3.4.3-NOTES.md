# Radar v3.4.3 — Stable Access + Gem Intelligence

This release is rebuilt from the user-supplied known-good GitHub snapshot where Radar visibility worked correctly.

## Access policy
- Admin and radarPreviewAccess / invite behavior is preserved verbatim from the known-good snapshot.
- `backend/src/modules/users/user.service.ts` is unchanged from the known-good snapshot.
- `backend/src/modules/users/user.repository.ts` is unchanged from the known-good snapshot.
- `backend/src/modules/radar/radar-access.service.ts`, `frontend/src/App.tsx`, and `frontend/src/components/ServicesPanel.tsx` are unchanged from the known-good snapshot.
- The v3.4.1/v3.4.2 owner-role self-healing experiment and its reassert-admin migration are intentionally removed.

## v3.4 features retained
- LOW / MID / HIGH / GEM market-cap presets and badges
- Unique DEX buyers/sellers enrichment
- Minimum unique DEX buyers filter
- Short-squeeze depth and timeframe
- Minimum squeeze-depth filter
- Contextual help (`!`) beside Radar settings, including zero-value semantics
- Persisted per-user settings and 5-minute scan cadence
