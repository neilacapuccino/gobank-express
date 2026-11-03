BEGIN;

ALTER TABLE "Card" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Card" AS card
SET "locked" = account."cardLocked"
FROM "User" AS account
WHERE account."id" = card."userId";

ALTER TABLE "User" DROP COLUMN "cardLocked";

COMMIT;
