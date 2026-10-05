ALTER TABLE "User" RENAME COLUMN "email" TO "gmail";
ALTER INDEX "User_email_key" RENAME TO "User_gmail_key";

UPDATE "User" SET "fullName" = "username"
WHERE "fullName" IS NULL OR btrim("fullName") = '';
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;

ALTER TABLE "Card" ADD COLUMN "cvvHash" TEXT;

CREATE TABLE "RegistrationCard" (
    "id" TEXT NOT NULL,
    "brand" "CardBrand" NOT NULL,
    "number" TEXT NOT NULL,
    "cvvHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationCard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RegistrationCard_number_key" ON "RegistrationCard"("number");
CREATE INDEX "RegistrationCard_validUntil_idx" ON "RegistrationCard"("validUntil");
