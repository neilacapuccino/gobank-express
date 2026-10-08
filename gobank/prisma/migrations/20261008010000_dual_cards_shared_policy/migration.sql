BEGIN;

CREATE TYPE "CardKind" AS ENUM ('physical', 'virtual');

ALTER TABLE "User"
ADD COLUMN "cardLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cardDailyLimit" INTEGER NOT NULL DEFAULT 2000000;

UPDATE "User" AS account
SET "cardLocked" = card."locked", "cardDailyLimit" = card."dailyLimit"
FROM "Card" AS card
WHERE account."id" = card."userId";

ALTER TABLE "Card" ADD COLUMN "kind" "CardKind" NOT NULL DEFAULT 'physical';
DROP INDEX "Card_userId_key";
CREATE UNIQUE INDEX "Card_userId_kind_key" ON "Card"("userId", "kind");

ALTER TABLE "Card" DROP COLUMN "locked", DROP COLUMN "dailyLimit";
ALTER TABLE "User" ADD CONSTRAINT "User_cardDailyLimit_check" CHECK ("cardDailyLimit" >= 0);

COMMIT;
