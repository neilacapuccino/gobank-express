# GoBank Express

A student-friendly digital banking application inspired by modern neobanks such
as GoTyme. GoBank Express reduces core financial operations to an approachable,
mobile-first model: a main spending account, high-interest goal-based savings
called **Stashes**, instant peer-to-peer transfers, and cash-convertible reward
points earned on everyday spending. All amounts are in Philippine Pesos (₱).

> **Status:** early development. The database schema covers every feature
> below; several screens are still scaffolded placeholders.

## Features

### Main account, virtual card & Stashes

- A primary account number and spending balance for daily transactions.
- Up to **5** goal-based sub-accounts ("Stashes") with custom names such as
  *Emergency Fund* or *Japan Trip*, each earning interest separately from the
  main balance.
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
| `Stash` | Up to five goal savings pockets per user |
| `Biller` | The pre-registered biller catalogue |
| `Transaction` | The ledger. One row per money movement per user, with a reference, signed amount and balance snapshot |
| `MoneyRequest` | Requests for money between users |

- **Money is stored as whole centavos** in integer columns. `₱1,250.50` is
  `125050`. Conversion happens only at the edges, in `src/lib/money.ts`.
- **Balances only change through the ledger** (`src/server/services/ledger.ts`).
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
