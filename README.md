# GoBank Express

A student-friendly digital banking application inspired by modern neobanks such
as GoTyme. GoBank Express reduces core financial operations to an approachable,
mobile-first model: a main spending account, high-interest goal-based savings
called **Stashes**, instant peer-to-peer transfers, and cash-convertible reward
points earned on everyday spending. Banking amounts are in Philippine Pesos (₱).
Bitcoin purchases use the main PHP account balance directly.

> **Status:** early development. The database schema covers every feature
> below; several screens are still scaffolded placeholders.

## Features

### Main account, virtual card & Stashes

- A primary account number and spending balance for daily transactions.
- Up to **5** goal-based sub-accounts ("Stashes") with custom names such as
  *Emergency Fund* or *Japan Trip*, each earning interest separately from the
  main balance.
- Goal settings support renaming and closing a goal. Closing returns its whole
  remaining balance, including settled interest, to the main account atomically.
- Savings use the existing **4% annual rate**, compounded daily from local server
  system time: `A = P × (1 + r / 365)^d`. Fractional centavos carry forward.
  Opening a goal or changing its balance settles elapsed interest; a clock moving
  backward never credits the same time twice. No online time or interest API is used.
- A virtual debit card that can be toggled between `LOCKED` and `UNLOCKED`
  in-app, with adjustable daily spending limits.

### Peer-to-peer transfers & bill payments

- Instant transfers to other registered users by account number or mobile
  number.
- Payments to pre-registered billers such as electricity, water, internet and
  credit cards.
- Every movement of money produces a unique transaction reference number, a
  timestamp, and a balance snapshot.

### Loyalty rewards & cash back

- Earn **1 point per ₱50.00** on eligible outward transfers and bill payments.
- Convert points to cash back credited to the main balance at
  **100 points = ₱1.00**.

### Profile and GO shortcuts

- Profile uses a default person icon. In Edit profile, add, replace or remove a
  PNG, JPG or WebP photo up to 5 MB. Uploaded photos are cropped and saved as
  256-pixel WebP avatars, with server validation and source metadata removed.
- Full name is required. Gmail linking is optional and reserved for the member
  implementing Google authentication. A linked, verified Gmail address can be
  displayed in Profile and used to find a recipient; there is no generic Email field.
- Registration reserves the card shown during review, with number/CVV/PIN reveal
  controls. PIN and CVV are stored as salted hashes. Confirmation goes directly
  to the dashboard. Visa, Mastercard, JCB and Discover share a black card face.
- The dark GO menu links to Send money, Add money, Request, GoalSave, Pay bills,
  Buy load, Bitcoin and Profile. Its orb transitions to two rotating petal
  layers with a clear close button; reduced-motion preferences are respected.
- Run `npm run test:profile` for upload validation tests and
  `npm run test:profile:integration` for persistence and account isolation checks.

### Bitcoin portfolio

- Bitcoin only, at `/stocks`, with a black screen and prices, holdings and
  trade amounts in PHP. Buy directly from the main PHP account; sell Bitcoin to
  credit PHP back. There is no USD wallet or manual currency conversion.
- Live Binance BTC/USDT market data is priced in pesos using the current
  Binance.US USDT/USD bid/ask midpoint and Frankfurter's daily USD/PHP reference
  rate. The reference date is shown; PHP prices follow Bitcoin updates.
  Historical candles use the current conversion rate.
- Line and candlestick charts show 1 minute, 1 hour, 1 week, 1 month or 1 year.
  The minute view combines sixty native one-second candles into three-second
  candles with their actual OHLC values; the hourly view uses sixty one-minute
  candles. Wider bodies and continuous flat sections make short ranges easier
  to read. Live streams have REST fallback.
  Longer ranges use hourly, four-hour and daily candles.
- Fractional buys and sells persist with cost basis, realized/unrealized
  profit or loss and the latest 20 trades. The PHP debit/credit, bank activity
  reference and Bitcoin holding commit together. Self-trades earn no rewards.
- Server prices and stale-quote checks protect trades. Integer centavos and
  satoshis prevent balance drift. Serializable transactions and
  per-user request IDs guard concurrent and repeated submissions.
- External exchange execution, Bitcoin custody and withdrawals are not connected.
  Obsolete preview and conversion tables have been removed.
  New holdings start at zero with no free account money.
- One table, **`BitcoinTrade`**, stores the trade history. A pure reducer derives
  BTC holdings, remaining purchase cost and realized profit from that history.
  `phpCentavos` is the PHP amount paid/received; `priceCentavos` is the quoted
  PHP price per BTC. `satoshis` is BTC multiplied by 100,000,000.
  `requestId` prevents repeat submissions; `reference` connects the bank receipt.
  Redundant wallet state and balance snapshots have been removed. Fee is `0.00 PHP`.

Run `npm run test:bitcoin` for calculation and candle tests. With a migrated
database and network access, `npm run test:bitcoin:integration` verifies feeds,
PHP ledger settlement, persistence, duplicates, concurrency and user isolation
using temporary users that are deleted afterward.

Apply migrations with `npm run db:migrate`, then regenerate Prisma with
`npm install` (or `npx prisma generate`). On Windows, stop the dev server first
if it holds the Prisma engine DLL open.

## Tech stack

Built on the [T3 Stack](https://create.t3.gg/) (`create-t3-app` v7.40.0).

### Frameworks & libraries

| Package | Version | Purpose |
| ------- | ------- | ------- |
| [Next.js](https://nextjs.org) | 15.5.23 | React framework, App Router, Turbopack |
| [React](https://react.dev) | 19.2.8 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.9.3 | Language, strict mode |
| [tRPC](https://trpc.io) | 11.18.0 | End-to-end typesafe API layer |
| [TanStack Query](https://tanstack.com/query) | 5.102.0 | Server-state caching for tRPC |
| [Prisma](https://prisma.io) | 6.19.3 | ORM and migrations |
| [Tailwind CSS](https://tailwindcss.com) | 4.3.3 | Utility-first styling |
| [Zod](https://zod.dev) | 3.25.76 | Runtime schema validation |
| [@t3-oss/env-nextjs](https://env.t3.gg) | 0.12.0 | Typesafe environment variables |
| [SuperJSON](https://github.com/flightcontrolhq/superjson) | 2.2.6 | Rich serialisation across the tRPC boundary |

### Tooling

| Package | Version | Purpose |
| ------- | ------- | ------- |
| [ESLint](https://eslint.org) | 9.39.5 | Linting, flat config |
| [typescript-eslint](https://typescript-eslint.io) | 8.67.0 | TypeScript lint rules |
| [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint) | 15.5.23 | Next.js lint preset |
| [Prettier](https://prettier.io) | 3.9.6 | Formatting |
| [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) | 0.6.14 | Tailwind class sorting |
| [PostCSS](https://postcss.org) | 8.5.26 | CSS pipeline for Tailwind |

### Infrastructure

- **[Neon](https://neon.tech)** — serverless PostgreSQL, reached through
  Prisma. Any PostgreSQL 14+ server works the same way.
- **GitHub Actions** — CI running format, lint, typecheck and build on every
  push and pull request to `main`, `staging` and `develop`.

## Getting started

> **Every command below runs from the `gobank/` subdirectory, not the
> repository root.** `package.json` lives in `gobank/`. Running npm from the
> root fails with `ENOENT: no such file or directory, open 'package.json'`.

### Prerequisites

- [Node.js](https://nodejs.org) 20 or later
- npm 10 or later (the project pins `npm@10.9.2`)
- A [Neon](https://neon.tech) project (the free tier is enough)

### 1. Clone the repository

```bash
git clone https://github.com/neilacapuccino/gobank-express.git
```

### 2. Change into the application directory

```bash
cd gobank-express/gobank
```

This step is easy to miss. The repository root holds only `README.md` and
`.github/` — the application itself lives one level down
in `gobank/`. If you already have the repository, `cd` into the `gobank` folder
inside it. Stay in this directory for every remaining step.

### 3. Install dependencies

```bash
npm install
```

The `postinstall` hook runs `prisma generate` automatically, emitting the client
to `generated/prisma`.

### 4. Configure environment variables

Copy the example file, then fill in the values.

```bash
cp .env.example .env
```

`.env` is gitignored and must never be committed. Both values come from the
**Connect** dialog in the Neon console.

| Variable | Neon connection string |
| -------- | ---------------------- |
| `DATABASE_URL` | **Pooled** — host contains `-pooler`. Used by the app at runtime. |
| `DIRECT_URL` | **Direct** — pooling switched off. Used by Prisma to run migrations. |

Values are validated at build and dev time against the schema in `src/env.js`.
Setting `SKIP_ENV_VALIDATION=1` bypasses the check, which is what CI does.

### 5. Create the tables

```bash
npm run db:migrate
```

Applies every migration in `prisma/migrations` to the Neon database.

### 6. Seed reference data

```bash
npm run db:seed
```

Adds the biller catalogue and two demo accounts, `@maricel` and `@dante`, each
holding ₱5,000.00 with PIN `135790`, so transfers have somewhere to go.

### 7. Run the development server

```bash
npm run dev
```

The app is served at [http://localhost:3001](http://localhost:3001) with
Turbopack and hot reload.

### After pulling new changes

The Prisma client in `generated/prisma` is built on each machine and is not
in git, and new commits can add packages or migrations. After every
`git pull`, from `gobank/`:

```bash
npm install
```

```bash
npm run db:migrate
```

`npm install` also rebuilds the Prisma client, and `db:migrate` applies any
new migrations (it does nothing if the database is already up to date).
`npm run dev` regenerates the client too, so a missed `npm install` no longer
shows "Can't resolve '../../generated/prisma'".

## Available scripts

Run from the `gobank/` directory.

| Script | Action |
| ------ | ------ |
| `npm run dev` | Regenerate the Prisma client, then start the dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve an existing production build |
| `npm run preview` | Build, then serve the result |
| `npm run check` | Lint and typecheck together |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format:check` | Verify formatting |
| `npm run format:write` | Apply formatting |
| `npm run db:generate` | Create and apply a migration after editing the schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed billers and demo accounts |
| `npm run db:reset` | Drop everything, re-migrate and re-seed |
| `npm run db:push` | Push the schema without a migration, for quick experiments |
| `npm run db:studio` | Open Prisma Studio |

## Database

| Model | Holds |
| ----- | ----- |
| `User` | Credentials, profile, main account number, balance and points |
| `Session` | Signed-in devices, stored as a hash of the cookie token |
| `Card` | The virtual debit card: brand, number, lock state, daily limit |
| `RegistrationCard` | A temporary, browser-bound card reservation, expiring after 30 minutes |
| `BitcoinTrade` | One Bitcoin buy/sell per row, belonging directly to a user |
| `Stash` | Up to five goal savings pockets per user |
| `Biller` | The pre-registered biller catalogue |
| `Transaction` | The ledger. One row per money movement per user, with a reference, signed amount and balance snapshot |
| `MoneyRequest` | Requests for money between users |

The Bitcoin ERD is **User 1 → many BitcoinTrade**. There is no separate investment
wallet entity: current holdings are calculated from the trades, and spending money
remains in `User.balance`. The trade migration verifies that history reproduces
every existing wallet before dropping it.

Savings retain `interestUpdatedAt` to measure elapsed time and `interestCarry` to
preserve fractions of a centavo. These fields prevent repeated credits and rounding
losses; they are needed by the compound-interest calculation.

For the defense, trace the code as **typed React component → validated tRPC procedure
→ service transaction → Prisma table**. Pure functions in `bitcoin.rules.ts` and
`savings-interest.ts` handle the calculations; database effects stay in services
and the ledger.

Before pushing, run `npm run check:ci`. The repository's `.githooks/pre-push` runs
the same format, lint, fresh typecheck, unit tests and build checks when installed
with `git config core.hooksPath .githooks`. GitHub Actions repeats those checks.

- **Money is stored as whole centavos** in integer columns. `₱1,250.50` is
  `125050`. Conversion happens only at the edges, in `src/shared/lib/money.ts`.
- **Balances only change through the ledger** (`src/server/ledger.ts`).
  `post` moves money and writes the matching `Transaction` in one step; `spend`
  adds the card lock, the daily limit and points; `transfer` and `moveStash`
  build on those two.
- **Check constraints** stop any balance, point total or daily limit from going
  negative, even if application code has a bug.
- A P2P transfer writes two rows that share one reference: a negative amount for
  the sender and a positive amount for the receiver.

## Architecture

The code is organised by feature. Each layer has one job, and
dependencies only point downward.

```
app/                 Routes. A page loads data and renders a feature screen.
  │
features/<name>/     One folder per feature.
  ├─ components/     The feature's UI.
  ├─ <name>.router   API layer: validates input with Zod, calls the service.
  ├─ <name>.service  Business logic and queries. Knows nothing about tRPC.
  └─ <name>.rules    Pure functions: no database, no cookies, no clock.
  │
shared/              Used by several features: ui/, lib/, hooks/.
server/              Infrastructure: db, tRPC setup, ledger, errors, session.
```

- **Routers stay thin.** A procedure parses its input and makes one service
  call. The same services could sit behind a REST route or a script.
- **Pure code is separate from effects.** Money maths, validation and
  formatting live in `*.rules.ts` and `shared/lib`, and take no database or
  request. Services handle the effects.
- **Money moves only through the ledger.** `server/ledger.ts` is the single
  writer of balances.
- **Errors are domain errors.** Services throw `AppError` with a code and a
  message from the `MESSAGES` table in `server/errors.ts`. The tRPC middleware
  turns them, and known database errors, into HTTP responses.
- **Imports are relative within a feature** and use `~/` across features and
  into `shared/`.

## Project structure

```
.
├── .github/                      CI workflow and code owners
└── gobank/
    ├── prisma/                   Schema, migrations and seed
    ├── prisma.config.ts          Prisma CLI config (loads .env, seed command)
    ├── public/                   Static assets
    └── src/
        ├── app/                  Routes only
        │   ├── (auth)/           Register and sign in, for signed-out users
        │   ├── (app)/            Screens behind the session guard
        │   └── api/trpc/         tRPC HTTP handler
        ├── features/
        │   ├── account/          Dashboard, profile, activity history
        │   ├── auth/             Register, sign in and out, PIN hashing
        │   ├── bills/            Biller catalogue and bill payment
        │   ├── card/             Virtual card, lock and daily limit
        │   ├── requests/         Requesting money from other users
        │   ├── rewards/          Redeeming points
        │   ├── stashes/          Savings goals
        │   ├── transfers/        Sending money, recipient lookup
        │   └── wallet/           Cash in and mobile load
        ├── shared/
        │   ├── ui/               Button, text field, PIN pad, screen shell
        │   ├── lib/              Money, formatting, contact and Zod helpers
        │   └── hooks/            Reusable React hooks
        ├── server/
        │   ├── db.ts             Prisma client singleton
        │   ├── trpc.ts           Procedures and error mapping
        │   ├── root.ts           Combines the feature routers
        │   ├── ledger.ts         The only code that changes a balance
        │   ├── errors.ts         AppError and the message table
        │   ├── session.ts        Cookie sessions
        │   └── codes.ts          Reference, account and card numbers
        ├── trpc/                 Client and server-side API callers
        ├── styles/               Global stylesheet and design tokens
        └── env.js                Environment variable schema
```
