BEGIN;
LOCK TABLE "InvestmentWallet", "InvestmentOrder" IN ACCESS EXCLUSIVE MODE;

-- Refuse removal if replaying history would change anyone's holdings or profit.
DO $$
DECLARE
  wallet RECORD;
  trade RECORD;
  held BIGINT;
  basis BIGINT;
  profit BIGINT;
  sold_basis BIGINT;
BEGIN
  FOR wallet IN SELECT * FROM "InvestmentWallet" LOOP
    held := 0; basis := 0; profit := 0;
    FOR trade IN SELECT * FROM "InvestmentOrder"
      WHERE "accountId" = wallet."userId" ORDER BY "createdAt", "id" LOOP
      IF trade."side" = 'buy' THEN
        held := held + trade."satoshis";
        basis := basis + trade."cashCents";
      ELSE
        IF held < trade."satoshis" THEN
          RAISE EXCEPTION 'Bitcoin history cannot reproduce an existing wallet';
        END IF;
        sold_basis := floor(basis::numeric * trade."satoshis" / held);
        held := held - trade."satoshis";
        basis := basis - sold_basis;
        profit := profit + trade."cashCents" - sold_basis;
      END IF;
    END LOOP;
    IF held <> wallet."satoshis" OR basis <> wallet."costBasisCents" OR profit <> wallet."realizedCents" THEN
      RAISE EXCEPTION 'Bitcoin history differs from an existing wallet; migration cancelled';
    END IF;
  END LOOP;
END $$;

ALTER TABLE "InvestmentOrder" DROP CONSTRAINT "InvestmentOrder_accountId_fkey";
ALTER TABLE "InvestmentOrder" DROP CONSTRAINT "InvestmentOrder_valid";
ALTER TABLE "InvestmentOrder" RENAME TO "BitcoinTrade";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "accountId" TO "userId";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "cashCents" TO "phpCentavos";
ALTER TABLE "BitcoinTrade" RENAME COLUMN "priceCents" TO "priceCentavos";
ALTER TABLE "BitcoinTrade"
  DROP COLUMN "realizedCents",
  DROP COLUMN "cashAfter",
  DROP COLUMN "satoshisAfter",
  DROP COLUMN "quotedAt";
ALTER TABLE "BitcoinTrade" RENAME CONSTRAINT "InvestmentOrder_pkey" TO "BitcoinTrade_pkey";
ALTER INDEX "InvestmentOrder_accountId_requestId_key" RENAME TO "BitcoinTrade_userId_requestId_key";
ALTER INDEX "InvestmentOrder_reference_key" RENAME TO "BitcoinTrade_reference_key";
ALTER INDEX "InvestmentOrder_accountId_createdAt_idx" RENAME TO "BitcoinTrade_userId_createdAt_idx";
ALTER TABLE "BitcoinTrade" ADD CONSTRAINT "BitcoinTrade_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BitcoinTrade" ADD CONSTRAINT "BitcoinTrade_valid"
  CHECK ("side" IN ('buy', 'sell') AND "satoshis" > 0 AND "phpCentavos" > 0 AND "priceCentavos" > 0);
DROP TABLE "InvestmentWallet";
COMMIT;
