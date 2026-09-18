UPDATE "User"
SET "role" = 'ADMIN'
WHERE LOWER(COALESCE("username", '')) = 'ramoadmin';
