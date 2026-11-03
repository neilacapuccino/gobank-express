BEGIN;

DELETE FROM "RegistrationCard"
WHERE "cvvEncrypted" IS NULL OR "brand"::text = 'gobank';

CREATE TYPE "CardBrand_new" AS ENUM ('visa', 'mastercard', 'jcb', 'discover');

ALTER TABLE "Card" ALTER COLUMN "brand" DROP DEFAULT;
ALTER TABLE "Card"
  ALTER COLUMN "brand" TYPE "CardBrand_new" USING ("brand"::text::"CardBrand_new");
ALTER TABLE "RegistrationCard"
  ALTER COLUMN "brand" TYPE "CardBrand_new" USING ("brand"::text::"CardBrand_new");

ALTER TYPE "CardBrand" RENAME TO "CardBrand_old";
ALTER TYPE "CardBrand_new" RENAME TO "CardBrand";
DROP TYPE "CardBrand_old";

ALTER TABLE "Card" ALTER COLUMN "brand" SET DEFAULT 'discover';

ALTER TABLE "Card"
  DROP COLUMN "cvvHash",
  ALTER COLUMN "cvvEncrypted" SET NOT NULL;

ALTER TABLE "RegistrationCard"
  DROP COLUMN "cvvHash",
  ALTER COLUMN "cvvEncrypted" SET NOT NULL;

COMMIT;
