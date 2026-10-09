# GoBank Express

A mobile banking project built with Next.js, TypeScript, tRPC and Prisma. Amounts are in Philippine pesos; database money values are whole centavos.

## Features

- Main account, deposits, transfers, money requests, bills and mobile load.
- Physical and virtual cards with different networks, unique numbers and separate CVVs. Both use the main balance and shared spending controls.
- Up to five named GoalSave savings pockets. Settings let users rename, change the target or close a goal and return its savings to the main account.
- Savings earn 4% annually, compounded daily using server system time: `A = P × (1 + r / 365)^d`. Fractional centavos carry forward, and moving the clock backward cannot credit the same time twice.
- Required full name and optional profile photo. Gmail linking is reserved for the member implementing Google authentication; there is no separate Email field.
- Registration generates the physical card number, expiry and CVV on Continue, preserves them at confirmation, then opens the dashboard directly.
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
npm run db:client
npm run db:seed
npm run dev
```

The app opens at `http://localhost:3001`. Seeding adds billers and demo accounts `@maricel` and `@dante` with PIN `135790`.

Card CVVs are generated when cards are issued and encrypted with `CARD_ENCRYPTION_KEY`; PINs and CVV verification values are salted hashes. **Every app using the same database must use the same private encryption key.** Generate a key only for a new environment, or configure the existing team's key privately; never commit it. Older accounts automatically receive missing card credentials when their cards load.

After pulling changes, stop the dev server before `npm ci`, `npm run db:migrate` and `npm run db:client`. Run only one dev server on port 3001. Prisma client generation is an explicit setup command; a running Windows server can otherwise lock Prisma's engine DLL.

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

GoalSave is the interface name for the `Stash` entity. A user has one physical and one virtual `Card` record, distinguished by `kind`; account balance and shared card controls belong to `User`. TypeScript files use tabs with a displayed width of two spaces.

Each feature lives in `gobank/src/features/`. Its `components/` folder holds the screens and controls; its router, service and rules stay alongside them when needed. Route files in `src/app/` connect those screens to URLs.

| Feature                  | Folder           | Main screen and route                                                                                        |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Dashboard                | `dashboard/`     | `dashboard-screen.tsx` → `/dashboard`                                                                        |
| Deposit                  | `deposit/`       | `deposit-form.tsx` → `/deposit`                                                                              |
| Buy load                 | `load/`          | `load-form.tsx` → `/load`                                                                                    |
| Pay bills                | `bills/`         | `bill-payment.tsx` → `/bills`                                                                                |
| Activity and receipts    | `activity/`      | `recent-activity.tsx` on the dashboard; receipts at `/transactions/[reference]`; `/transactions` stays blank |
| My card                  | `card/`          | `my-card-screen.tsx` → `/card`; card generation and credential helpers also live here                        |
| Notifications            | `notifications/` | `notifications-screen.tsx` → `/notifications`; money request actions stay in `requests/`                     |
| Rewards                  | `rewards/`       | `rewards-screen.tsx` → `/rewards`; the page stays blank for the assigned member                              |
| Profile                  | `account/`       | Profile screens and account overview data                                                                    |
| Registration and sign-in | `auth/`          | Enrollment, sign-in and authentication                                                                       |
| Send money               | `transfers/`     | `transfer-form.tsx` → `/transfer`                                                                            |
| Request money            | `requests/`      | `request-form.tsx` → `/request`                                                                              |
| GoalSave                 | `stashes/`       | Goal screens → `/stashes`                                                                                    |
| Bitcoin                  | `bitcoin/`       | Market and trading screens → `/stocks`                                                                       |

Shared branding, the animated GO menu, recipient search and money form controls live under `shared/`. Deposit and load have separate routers and services so their code is easy to find.

Money moves through `src/server/ledger.ts`: balance changes and matching transaction records commit together. Transfers share a reference between the sender's debit and recipient's credit. Card locks, daily limits, insufficient funds and database constraints are checked before spending commits.

## Database

| Model              | Purpose                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `User`             | Profile, credentials, main balance, points and shared card controls        |
| `Session`          | Hashed tokens for signed-in sessions                                       |
| `Card`             | Physical or virtual kind, unique number, network, encrypted CVV and expiry |
| `RegistrationCard` | A browser-bound card reservation that expires after 30 minutes             |
| `Stash`            | Named savings, target and interest state                                   |
| `Transaction`      | Reference, timestamp, signed amount and resulting balance                  |
| `MoneyRequest`     | Requests between users and their status                                    |
| `Biller`           | Biller catalogue                                                           |
| `BitcoinTrade`     | Bitcoin buy and sell history                                               |

`Stash.interestUpdatedAt` records the last settled time; `interestCarry` preserves fractions of a centavo. Both are needed for accurate daily compounding.

## Checks

```sh
npm run check:ci
```

This checks formatting, lint, fresh TypeScript types, unit tests and the production build. Prisma generates its client on dependency installation and before GitHub checks; install the local push hook from the repository root with `git config core.hooksPath .githooks`.

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
