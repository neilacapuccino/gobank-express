CREATE TABLE "BitcoinAccount" (
    "userId" TEXT NOT NULL,
    "cashCents" INTEGER NOT NULL DEFAULT 1000000,
    "satoshis" BIGINT NOT NULL DEFAULT 0,
    "costBasisCents" INTEGER NOT NULL DEFAULT 0,
    "realizedCents" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BitcoinAccount_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "BitcoinAccount_nonnegative" CHECK ("cashCents" >= 0 AND "satoshis" >= 0 AND "costBasisCents" >= 0),
    CONSTRAINT "BitcoinAccount_empty_basis" CHECK ("satoshis" > 0 OR "costBasisCents" = 0)
);

CREATE TABLE "BitcoinOrder" (
    "id" TEXT NOT NULL,
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
    CONSTRAINT "BitcoinOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BitcoinOrder_valid" CHECK ("side" IN ('buy', 'sell') AND "satoshis" > 0 AND "cashCents" > 0 AND "priceCents" > 0 AND "cashAfter" >= 0 AND "satoshisAfter" >= 0)
);

CREATE UNIQUE INDEX "BitcoinOrder_accountId_requestId_key" ON "BitcoinOrder"("accountId", "requestId");
CREATE INDEX "BitcoinOrder_accountId_createdAt_idx" ON "BitcoinOrder"("accountId", "createdAt" DESC);
ALTER TABLE "BitcoinAccount" ADD CONSTRAINT "BitcoinAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BitcoinOrder" ADD CONSTRAINT "BitcoinOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BitcoinAccount"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
