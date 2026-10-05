-- User-requested removal of obsolete preview and currency-conversion tables.
-- A local JSON backup was exported before applying this migration.
-- Refuse cleanup if the unused USD field contains account funds.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "InvestmentWallet" WHERE "cashCents" <> 0) THEN
    RAISE EXCEPTION 'USD balances exist; preserve account funds before cleanup';
  END IF;
END $$;

DROP TABLE "BitcoinOrder";
DROP TABLE "BitcoinAccount";
DROP TABLE "CurrencyConversion";
ALTER TABLE "InvestmentWallet" DROP CONSTRAINT "InvestmentWallet_nonnegative";
ALTER TABLE "InvestmentWallet" DROP COLUMN "cashCents";
ALTER TABLE "InvestmentWallet" ADD CONSTRAINT "InvestmentWallet_nonnegative" CHECK ("satoshis" >= 0 AND "costBasisCents" >= 0);
