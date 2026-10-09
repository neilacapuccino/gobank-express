BEGIN;

-- Rename existing tables and columns only. Values, types and relationships stay intact.
ALTER TABLE "Stash" RENAME TO "SavingsGoal";
ALTER TABLE "SavingsGoal" RENAME COLUMN "goal" TO "targetAmount";
ALTER TABLE "SavingsGoal" RENAME COLUMN "interestRate" TO "annualInterestRate";
ALTER TABLE "SavingsGoal" RENAME COLUMN "interestCarry" TO "interestRemainder";
ALTER TABLE "SavingsGoal" RENAME COLUMN "interestUpdatedAt" TO "interestCalculatedAt";
ALTER TABLE "Transaction" RENAME COLUMN "stashId" TO "savingsGoalId";

ALTER TABLE "SavingsGoal" RENAME CONSTRAINT "Stash_pkey" TO "SavingsGoal_pkey";
ALTER TABLE "SavingsGoal" RENAME CONSTRAINT "Stash_userId_fkey" TO "SavingsGoal_userId_fkey";
ALTER TABLE "SavingsGoal" RENAME CONSTRAINT "Stash_balance_check" TO "SavingsGoal_balance_check";
ALTER TABLE "SavingsGoal" RENAME CONSTRAINT "Stash_valid_interest" TO "SavingsGoal_valid_interest";
ALTER INDEX "Stash_userId_name_key" RENAME TO "SavingsGoal_userId_name_key";
ALTER TABLE "Transaction" RENAME CONSTRAINT "Transaction_stashId_fkey" TO "Transaction_savingsGoalId_fkey";

ALTER TABLE "BitcoinTrade" RENAME COLUMN "side" TO "action";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "requestId" TO "submissionId";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "satoshis" TO "bitcoinUnits";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "phpCentavos" TO "amountCentavos";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "priceCentavos" TO "unitPriceCentavos";
ALTER INDEX "BitcoinTrade_userId_requestId_key" RENAME TO "BitcoinTrade_userId_submissionId_key";

-- PostgreSQL preserves all existing check expressions and foreign-key targets on rename.
COMMIT;
