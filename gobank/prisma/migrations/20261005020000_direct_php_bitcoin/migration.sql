-- Add bank references for direct PHP Bitcoin trades. Existing USD records and
-- balances are preserved; the active app no longer exposes conversion endpoints.
ALTER TABLE "InvestmentOrder" ADD COLUMN "reference" TEXT;
CREATE UNIQUE INDEX "InvestmentOrder_reference_key" ON "InvestmentOrder"("reference");
