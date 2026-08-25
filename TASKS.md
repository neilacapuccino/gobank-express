# GoBank Express — Task Board

Living status board for the project. Update the **Status** cell as work moves.
Keep this file current in the same pull request as the work it describes.

## Legend

| Symbol | Status | Meaning |
| ------ | ------ | ------- |
| ⬜ | To Do | Not started |
| 🟡 | In Progress | Someone is actively on it |
| 🔵 | Review | Pull request open, awaiting merge |
| ✅ | Done | Merged to `main` |
| 🚫 | Blocked | Cannot proceed, see Notes |
| ➖ | Dropped | Deliberately not doing |

## Progress at a glance

| Milestone | Scope | Done | Total | Status |
| --------- | ----- | ---- | ----- | ------ |
| [M0](#m0--repository--tooling) | Repository & tooling | 10 | 13 | 🟡 |
| [M1](#m1--data-model) | Data model | 0 | 8 | ⬜ |
| [M2](#m2--authentication) | Authentication | 0 | 12 | ⬜ |
| [M3](#m3--main-account-virtual-card--stashes) | Account, card & Stashes | 0 | 11 | ⬜ |
| [M4](#m4--transfers--bill-payments) | Transfers & bill pay | 0 | 12 | ⬜ |
| [M5](#m5--loyalty-rewards) | Loyalty rewards | 0 | 7 | ⬜ |
| [M6](#m6--interface-shell) | Interface shell | 0 | 8 | ⬜ |
| [M7](#m7--testing) | Testing | 0 | 6 | ⬜ |
| [M8](#m8--deployment) | Deployment | 0 | 6 | ⬜ |
| | **Total** | **10** | **83** | |

---

## M0 — Repository & tooling

| ID | Task | Status | Notes |
| -- | ---- | ------ | ----- |
| M0-1 | Initialise repository and push to GitHub | ✅ | `neilacapuccino/gobank-express` |
| M0-2 | Scaffold T3 app (Next.js, tRPC, Prisma, Tailwind) | ✅ | Lives in `gobank/` |
| M0-3 | Adopt Git Flow with `main`, `staging`, `develop` | ✅ | Documented in `CONTRIBUTING.md` |
| M0-4 | Pull request and issue templates, CODEOWNERS | ✅ | Under `.github/` |
| M0-5 | CI workflow: format, lint, typecheck, build | ✅ | `.github/workflows/ci.yml` |
| M0-6 | Fix failing `format:check` in CI | ✅ | Added `.prettierignore` for `generated/` |
| M0-7 | Project README with setup instructions | ✅ | |
| M0-8 | Remove `create-t3-app` template, white base page | ✅ | |
| M0-9 | Local PostgreSQL 18 running, `.env` configured | ✅ | Native install, no Docker needed |
| M0-10 | Dependabot | ➖ | Removed deliberately — unwanted branch noise |
| M0-11 | Placeholder `health` tRPC router | ✅ | Delete once real routers exist |
| M0-12 | Branch protection rules on `main` and `staging` | ⬜ | Require PR + 1 approval + passing CI |
| M0-13 | Untrack `gobank/generated/` and add to `.gitignore` | ⬜ | Build output; churns on every `npm install` |

---

## M1 — Data model

All money columns use Prisma `Decimal`, never `Float`. Points are integers.

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M1-1 | Remove scaffold `Post` model and its table | ⬜ | | Nothing references it |
| M1-2 | `User` model with profile and mobile number | ⬜ | | Mobile number must be unique — used as a transfer handle |
| M1-3 | `Account` model — account number, balance, status | ⬜ | M1-2 | One main account per user |
| M1-4 | `Stash` model — name, target, balance, interest rate | ⬜ | M1-3 | Max 5 per user, enforced in the service layer |
| M1-5 | `Card` model — state `LOCKED`/`UNLOCKED`, daily limit | ⬜ | M1-3 | One virtual card per account |
| M1-6 | `Transaction` model — reference, type, amount, balance snapshot | ⬜ | M1-3 | Append-only ledger, never updated or deleted |
| M1-7 | `Biller` and `UserBiller` models | ⬜ | M1-2 | Pre-registered billers per user |
| M1-8 | `RewardLedger` model — points earned, spent, balance | ⬜ | M1-2 | Append-only, mirrors `Transaction` |

---

## M2 — Authentication

Not in the current scaffold — this app was generated **without** NextAuth, so
`next-auth` is a fresh install rather than a configuration change.

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M2-1 | Install `next-auth@beta` (v5) and `@auth/prisma-adapter` | ⬜ | | v5 is the App Router API |
| M2-2 | Add Auth.js models: `Account`, `Session`, `VerificationToken` | ⬜ | M2-1, M1-2 | Name-clashes with the banking `Account` — rename one |
| M2-3 | Base `auth.ts` config with Prisma adapter | ⬜ | M2-2 | |
| M2-4 | Add `AUTH_SECRET` to `src/env.js` and `.env.example` | ⬜ | M2-1 | |
| M2-5 | Google OAuth provider | ⬜ | M2-3 | Needs `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| M2-6 | Register Google OAuth app in Google Cloud Console | ⬜ | | Redirect URI `/api/auth/callback/google` |
| M2-7 | Credentials provider for email and password | ⬜ | M2-3 | Forces `session.strategy = "jwt"` |
| M2-8 | Password hashing with `bcryptjs` or `argon2` | ⬜ | M2-7 | Never store plaintext; hash on registration and compare on sign-in |
| M2-9 | Sign-up page with password strength rules | ⬜ | M2-8 | Zod schema shared between client and server |
| M2-10 | Sign-in page offering both Google and password | ⬜ | M2-5, M2-7 | Handle account linking for the same email |
| M2-11 | Session in tRPC context and `protectedProcedure` | ⬜ | M2-3 | Every banking route must be protected |
| M2-12 | Route protection for authenticated pages | ⬜ | M2-11 | See Cookbook Ch. 3 |

---

## M3 — Main account, virtual card & Stashes

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M3-1 | Generate a unique account number on registration | ⬜ | M1-3, M2-9 | |
| M3-2 | `account.getBalance` query | ⬜ | M1-3, M2-11 | |
| M3-3 | Dashboard showing main balance | ⬜ | M3-2, M6-2 | |
| M3-4 | `stash.create` with the 5-Stash cap enforced | ⬜ | M1-4 | Reject the 6th with a clear error |
| M3-5 | `stash.list` and `stash.rename` | ⬜ | M1-4 | |
| M3-6 | Move money main ↔ Stash | ⬜ | M1-6, M3-4 | Atomic, writes a ledger row |
| M3-7 | Stash interest accrual | ⬜ | M1-4 | Decide daily vs monthly; document the formula |
| M3-8 | `stash.delete` returning the balance to main | ⬜ | M3-6 | |
| M3-9 | Stashes UI — list, create, fund, withdraw | ⬜ | M3-4, M3-6 | |
| M3-10 | Card lock and unlock toggle | ⬜ | M1-5 | |
| M3-11 | Daily spending limit editor | ⬜ | M1-5 | Limit enforced on every outward transaction |

---

## M4 — Transfers & bill payments

The highest-risk milestone. Every balance change must run inside a single
database transaction and write a ledger row in the same commit.

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M4-1 | Transaction reference number generator | ⬜ | M1-6 | Unique, collision-safe, human-readable |
| M4-2 | Ledger write helper — reference, timestamp, balance snapshot | ⬜ | M4-1 | Single place all money movement flows through |
| M4-3 | Recipient lookup by account number | ⬜ | M1-3 | |
| M4-4 | Recipient lookup by mobile number | ⬜ | M1-2 | |
| M4-5 | `transfer.send` inside `prisma.$transaction` | ⬜ | M4-2, M4-3 | Debit and credit must both commit or neither |
| M4-6 | Insufficient-funds and self-transfer guards | ⬜ | M4-5 | |
| M4-7 | Daily limit check on outward transfers | ⬜ | M3-11, M4-5 | |
| M4-8 | Idempotency so a double submit cannot double-send | ⬜ | M4-5 | Client-supplied key, unique-constrained |
| M4-9 | Transfer UI with confirmation step | ⬜ | M4-5, M6-2 | Show recipient name before committing |
| M4-10 | Seed the biller catalogue | ⬜ | M1-7 | Electric, water, internet, credit card |
| M4-11 | `bill.pay` reusing the ledger helper | ⬜ | M4-2, M1-7 | |
| M4-12 | Transaction history with receipt detail | ⬜ | M4-2 | Paginated; receipt shows reference and snapshot |

---

## M5 — Loyalty rewards

Earn rate **1 point per ₱50.00**. Conversion **100 points = ₱1.00**.

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M5-1 | Define which transactions are eligible | ⬜ | M4-5 | Outward transfers and bill payments only |
| M5-2 | Points accrual hook on eligible transactions | ⬜ | M5-1, M1-8 | Same commit as the ledger write |
| M5-3 | Rounding rule for partial amounts | ⬜ | M5-2 | ₱149 earns 2 points — floor, and document it |
| M5-4 | `rewards.getBalance` query | ⬜ | M1-8 | Derived from the ledger, not a mutable column |
| M5-5 | `rewards.convert` crediting cash to main | ⬜ | M5-4, M4-2 | Atomic; reject non-multiples of 100 or allow remainder |
| M5-6 | Rewards UI — balance, history, convert | ⬜ | M5-4 | |
| M5-7 | Points ledger reconciliation check | ⬜ | M5-2 | Sum of ledger must equal reported balance |

---

## M6 — Interface shell

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M6-1 | Design tokens — colour, spacing, type scale | ⬜ | | Extend Tailwind theme in `globals.css` |
| M6-2 | App shell — navigation, header, mobile-first layout | ⬜ | M6-1 | Spec calls for mobile-first |
| M6-3 | Shared UI primitives — button, input, card, modal | ⬜ | M6-1 | |
| M6-4 | Peso currency formatter | ⬜ | | One helper, used everywhere |
| M6-5 | Form handling and validation pattern | ⬜ | M6-3 | Reuse the Zod schemas from the routers |
| M6-6 | Loading and empty states | ⬜ | M6-3 | |
| M6-7 | Error boundary and toast notifications | ⬜ | M6-3 | |
| M6-8 | Accessibility pass — labels, focus, contrast | ⬜ | M6-2 | |

---

## M7 — Testing

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M7-1 | Install and configure Vitest | ⬜ | | |
| M7-2 | Unit tests for points maths and rounding | ⬜ | M7-1, M5-3 | |
| M7-3 | Integration tests for transfers against a test database | ⬜ | M7-1, M4-5 | Cover the failure paths, not just the happy path |
| M7-4 | Concurrency test — two simultaneous transfers | ⬜ | M7-3 | Proves the transaction boundary holds |
| M7-5 | Playwright E2E for sign-up, transfer, convert | ⬜ | M4-9, M5-6 | See Cookbook Ch. 7 |
| M7-6 | Add the test suite to the CI workflow | ⬜ | M7-1 | |

---

## M8 — Deployment

| ID | Task | Status | Depends on | Notes |
| -- | ---- | ------ | ---------- | ----- |
| M8-1 | Choose a managed PostgreSQL host | ⬜ | | Neon, Supabase or Railway |
| M8-2 | Switch from `db push` to real migrations | ⬜ | M1-8 | `prisma migrate dev` and commit the migration files |
| M8-3 | Deploy to Vercel from `main` | ⬜ | M8-1 | See Cookbook Ch. 8 |
| M8-4 | Configure production environment variables | ⬜ | M8-3, M2-4 | |
| M8-5 | Run `prisma migrate deploy` on release | ⬜ | M8-2 | |
| M8-6 | Preview deployments from `develop` | ⬜ | M8-3 | |

---

## Working conventions

- Branch from `develop` using the prefixes in [CONTRIBUTING.md](CONTRIBUTING.md).
- One milestone task per pull request where practical.
- Money is `Decimal`. Floating point is never acceptable for balances.
- Every balance change writes a ledger row in the same database transaction.
- Every banking procedure is a `protectedProcedure`.
- Validate with Zod at the router boundary and reuse the schema on the client.

## References

| Source | Use for |
| ------ | ------- |
| Bank Project Specs (`bank.pdf`) | Feature requirements, earn and conversion rates |
| Next.js Cookbook — Andrei Tazetdinov | Ch. 3 authorization, Ch. 7 E2E testing, Ch. 8 deployment, Ch. 9 optimisation |
| Fullstack React with TypeScript | React and TypeScript patterns, component composition, `useReducer` and Context |
| [create.t3.gg](https://create.t3.gg/) | T3 stack conventions |
| [authjs.dev](https://authjs.dev/) | NextAuth v5 providers and adapters |
