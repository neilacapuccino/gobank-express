ALTER TABLE "Stash"
  ADD COLUMN "interestCarry" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "interestUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Stash" ADD CONSTRAINT "Stash_valid_interest"
  CHECK ("interestRate" >= 0 AND "interestRate" <= 1 AND "interestCarry" >= 0 AND "interestCarry" < 1);
