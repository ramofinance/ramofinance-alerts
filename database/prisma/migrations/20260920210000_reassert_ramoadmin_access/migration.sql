-- Permanent owner-access repair. The older admin migration may already have
-- been marked as applied, so this new migration safely reasserts the current
-- owner account without deleting or changing any other user's access.
UPDATE "User"
SET "role" = 'ADMIN',
    "radarPreviewAccess" = true
WHERE "telegramId" = '111287296'
   OR LOWER(COALESCE("username", '')) = 'ramoadmin';
