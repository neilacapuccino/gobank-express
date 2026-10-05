ALTER TYPE "TransactionKind" ADD VALUE 'exchange';
ALTER TABLE "BitcoinAccount" ALTER COLUMN "cashCents" SET DEFAULT 0;

CREATE TABLE "InvestmentWallet" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "cashCents" INTEGER NOT NULL DEFAULT 0,
  "satoshis" BIGINT NOT NULL DEFAULT 0,
  "costBasisCents" INTEGER NOT NULL DEFAULT 0,
  "realizedCents" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvestmentWallet_nonnegative" CHECK ("cashCents" >= 0 AND "satoshis" >= 0 AND "costBasisCents" >= 0),
  CONSTRAINT "InvestmentWallet_empty_basis" CHECK ("satoshis" > 0 OR "costBasisCents" = 0),
  CONSTRAINT "InvestmentWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InvestmentOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "satoshis" BIGINT NOT NULL,
  "cashCents" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "realizedCents" INTEGER NOT NULL DEFAULT 0,
  "cashAfter" INTEGER NOT NULL,
  "satoshisAfter" BIGINT NOT NULL,
  "quotedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestmentOrder_valid" CHECK ("side" IN ('buy', 'sell') AND "satoshis" > 0 AND "cashCents" > 0 AND "priceCents" > 0 AND "cashAfter" >= 0 AND "satoshisAfter" >= 0),
  CONSTRAINT "InvestmentOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentWallet"("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InvestmentOrder_accountId_requestId_key" ON "InvestmentOrder"("accountId", "requestId");
CREATE INDEX "InvestmentOrder_accountId_createdAt_idx" ON "InvestmentOrder"("accountId", "createdAt" DESC);

CREATE TABLE "CurrencyConversion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "phpCentavos" INTEGER NOT NULL,
  "usdCents" INTEGER NOT NULL,
  "rateScaled" BIGINT NOT NULL,
  "rateDate" TEXT NOT NULL,
  "phpAfter" INTEGER NOT NULL,
  "usdAfter" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurrencyConversion_valid" CHECK ("direction" IN ('buy_usd', 'sell_usd') AND "phpCentavos" > 0 AND "usdCents" > 0 AND "rateScaled" > 0 AND "phpAfter" >= 0 AND "usdAfter" >= 0),
  CONSTRAINT "CurrencyConversion_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentWallet"("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CurrencyConversion_accountId_requestId_key" ON "CurrencyConversion"("accountId", "requestId");
CREATE UNIQUE INDEX "CurrencyConversion_reference_key" ON "CurrencyConversion"("reference");
CREATE INDEX "CurrencyConversion_accountId_createdAt_idx" ON "CurrencyConversion"("accountId", "createdAt" DESC);
