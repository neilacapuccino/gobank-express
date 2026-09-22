CREATE TYPE "CardBrand" AS ENUM ('visa', 'mastercard', 'jcb', 'gobank');

CREATE TYPE "BillerCategory" AS ENUM ('electric', 'water', 'internet', 'credit_card');

CREATE TYPE "TransactionKind" AS ENUM ('deposit', 'transfer', 'bill', 'load', 'stash', 'reward', 'interest');

CREATE TYPE "RequestStatus" AS ENUM ('pending', 'paid', 'declined', 'cancelled');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "fullName" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "accountNumber" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brand" "CardBrand" NOT NULL DEFAULT 'gobank',
    "number" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimit" INTEGER NOT NULL DEFAULT 2000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Stash" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" INTEGER,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stash_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Biller" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BillerCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Biller_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" "TransactionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "userId" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "stashId" TEXT,
    "billerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MoneyRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

CREATE UNIQUE INDEX "User_accountNumber_key" ON "User"("accountNumber");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE UNIQUE INDEX "Card_userId_key" ON "Card"("userId");

CREATE UNIQUE INDEX "Card_number_key" ON "Card"("number");

CREATE UNIQUE INDEX "Stash_userId_name_key" ON "Stash"("userId", "name");

CREATE UNIQUE INDEX "Biller_code_key" ON "Biller"("code");

CREATE INDEX "Biller_category_idx" ON "Biller"("category");

CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt" DESC);

CREATE UNIQUE INDEX "Transaction_reference_userId_key" ON "Transaction"("reference", "userId");

CREATE INDEX "MoneyRequest_payerId_status_idx" ON "MoneyRequest"("payerId", "status");

CREATE INDEX "MoneyRequest_requesterId_idx" ON "MoneyRequest"("requesterId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Stash" ADD CONSTRAINT "Stash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_stashId_fkey" FOREIGN KEY ("stashId") REFERENCES "Stash"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_billerId_fkey" FOREIGN KEY ("billerId") REFERENCES "Biller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MoneyRequest" ADD CONSTRAINT "MoneyRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MoneyRequest" ADD CONSTRAINT "MoneyRequest_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_balance_check" CHECK ("balance" >= 0);

ALTER TABLE "User" ADD CONSTRAINT "User_points_check" CHECK ("points" >= 0);

ALTER TABLE "Stash" ADD CONSTRAINT "Stash_balance_check" CHECK ("balance" >= 0);

ALTER TABLE "Card" ADD CONSTRAINT "Card_dailyLimit_check" CHECK ("dailyLimit" >= 0);
