# RAMO Finance Radar v3.4.2

## CI hotfix for permanent admin visibility

- Fixes the TypeScript `string | null` build regression introduced in v3.4.1.
- Keeps the v3.4.1 permanent owner/admin self-healing logic intact.
- Uses the non-null `telegramId` argument already guaranteed by `getUserByTelegramId()` instead of the nullable Prisma field.
- Does not change invited-user / `radarPreviewAccess` behavior.
- Does not remove or change any v3.4.0 Gem Radar features, filters, tooltips, unique-wallet logic, squeeze depth, presets, or settings persistence.
