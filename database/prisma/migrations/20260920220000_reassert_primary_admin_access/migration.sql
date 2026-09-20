-- Reassert the project owner's admin role if the row already exists.
-- Runtime identity checks also protect access if the user row is created later.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "telegramId" = '111287296'
   OR LOWER(COALESCE("username", '')) = 'ramoadmin';
