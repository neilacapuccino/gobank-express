# GoBank Express

A mobile banking project built with Next.js, TypeScript, tRPC and Prisma. Amounts are in Philippine pesos; database money values are whole centavos.

## Features

- Main account, deposits, transfers, money requests, bills and mobile load.
- One issued card with physical and virtual views, a shared main balance, lock controls and a daily spending limit.
- Up to five named GoalSave savings pockets. Settings let users rename, change the target or close a goal and return its savings to the main account.
- Savings earn 4% annually, compounded daily using server system time: `A = P × (1 + r / 365)^d`. Fractional centavos carry forward, and moving the clock backward cannot credit the same time twice.
- Required full name and optional profile photo. Gmail linking is reserved for the member implementing Google authentication; there is no separate Email field.
- Registration previews the issued card number, expiry and CVV, then opens the dashboard directly.
- Dashboard activity shows signed amounts and receipts. Rewards and Activity links remain available, with blank destination pages reserved for another member.

Eligible transfers and bills earn one point per ₱50; the existing reward service converts 100 points to ₱1.

### Bitcoin

At `/stocks`, users can view live Bitcoin prices and buy or sell through their main PHP balance, with a fixed ₱10 fee per trade. A single `BitcoinTrade` table keeps the trade history, while server checks prevent overspending and repeated transactions.

## Setup

Run application commands inside `gobank/`. Use Node.js 20 or later and a PostgreSQL database.

```sh
cd gobank
npm ci
```

Copy `.env.example` to `.env` and configure `DATABASE_URL` and `DIRECT_URL`. Keep `.env` out of Git.

```sh
npm run card:setup-key
npm run db:migrate
npm run db:seed
npm run dev
```

The app opens at `http://localhost:3001`. Seeding adds billers and demo accounts `@maricel` and `@dante` with PIN `135790`.

Card CVVs are encrypted with `CARD_ENCRYPTION_KEY`; PINs and CVV verification values are salted hashes. **Every app using the same database must use the same private encryption key.** Generate a key only for a new environment, or configure the existing team's key privately; never commit it. Older cards without an encrypted CVV offer an explicit Create CVV action.

After pulling changes, stop the dev server before `npm ci` and `npm run db:migrate`. The dev helper rebuilds Prisma only when needed and checks whether port 3001 is already occupied; a running Windows server can otherwise lock Prisma's engine DLL.

## Code and naming

The request flow is **typed React component → Zod-validated tRPC router → service → Prisma**. Routes render feature screens; routers validate inputs; services handle database work; pure helpers calculate and format values.

```text
gobank/
  prisma/                Schema, migrations and seed
  scripts/               Development helpers and integration checks
  src/
    app/                 Routes and session-protected layouts
    features/            Components, routers, services and rules per feature
    shared/              Reusable controls, hooks and value helpers
    server/              Database, sessions, ledger and error handling
    trpc/                Typed client and server callers
```

GoalSave is the interface name for the `Stash` entity. Each card view refers to the same `Card` record, so switching views does not create another account or balance. TypeScript files use tabs with a displayed width of two spaces.

Money moves through `src/server/ledger.ts`: balance changes and matching transaction records commit together. Transfers share a reference between the sender's debit and recipient's credit. Card locks, daily limits, insufficient funds and database constraints are checked before spending commits.

## Database

| Model              | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `User`             | Credentials, profile, account number, main balance and points  |
| `Session`          | Hashed tokens for signed-in sessions                           |
| `Card`             | Issued number, brand, encrypted CVV, lock and daily limit      |
| `RegistrationCard` | A browser-bound card reservation that expires after 30 minutes |
| `Stash`            | Named savings, target and interest state                       |
| `Transaction`      | Reference, timestamp, signed amount and resulting balance      |
| `MoneyRequest`     | Requests between users and their status                        |
| `Biller`           | Biller catalogue                                               |
| `BitcoinTrade`     | Bitcoin buy and sell history                                   |

`Stash.interestUpdatedAt` records the last settled time; `interestCarry` preserves fractions of a centavo. Both are needed for accurate daily compounding.

## Checks

```sh
npm run check:ci
```

This checks the generated Prisma client, formatting, lint, fresh TypeScript types, unit tests and production build. GitHub Actions runs the same checks; install the local push hook from the repository root with `git config core.hooksPath .githooks`.

Integration checks create temporary accounts and remove their fixtures afterward:

```sh
npm run test:auth:integration
npm run test:card:integration
npm run test:transfers:integration
npm run test:payments:integration
npm run test:enrollment:savings
npm run test:bitcoin:integration
npm run test:profile:integration
```

Use `npm run format:write` to format source files, `npm run db:generate` to create a migration during development, and `npm run db:migrate` to apply committed migrations.
