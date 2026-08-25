# GoBank Express — Task Board

Living status board and build guide. Update the **Status** cell as work moves,
in the same pull request as the work itself.

Read it in this order: [Roles](#roles) to find your track, [How to split the
work](#how-to-split-the-work) to see what you can start today, then the
[Screen specifications](#screen-specifications) for exactly what to build.

## Legend

| Symbol | Status | Meaning |
| ------ | ------ | ------- |
| ⬜ | To Do | Not started |
| 🟡 | In Progress | Someone is actively on it |
| 🔵 | Review | Pull request open, awaiting merge |
| ✅ | Done | Merged to `main` |
| 🚫 | Blocked | Cannot proceed, see Notes |
| ➖ | Dropped | Deliberately not doing |

## Roles

Every task is tagged with a role so work can be divided without collisions.
Put your name in the **Owner** column when you pick something up.

| Tag | Role | Owns |
| --- | ---- | ---- |
| **DB** | Database | Prisma schema, migrations, seed data, indexes |
| **BE** | Backend | tRPC routers, business logic, database transactions, validation |
| **AUTH** | Authentication | NextAuth config, Google OAuth, password login, session, route guards |
| **FE** | Frontend | Pages, components, forms, styling, client state |
| **QA** | Testing | Unit, integration and end-to-end tests |
| **OPS** | DevOps | CI, environments, deployment, migrations in production |

## How to split the work

**The data model blocks almost everything.** M1 must land before backend work
starts. One person should own it and merge it first, on day one.

After that, four tracks run in parallel with minimal overlap:

| Track | Roles | Milestones | Can start | Notes |
| ----- | ----- | ---------- | --------- | ----- |
| **A — Money core** | DB, BE | M1, M4, M5 | Immediately | The hardest and highest-risk track. Owns the ledger and transaction safety. Give this to the strongest backend person. |
| **B — Identity** | AUTH, BE | M2 | Immediately | Independent of the money code. Only touches user, session and settings. |
| **C — Interface shell** | FE | M6, S1–S5 | Immediately | Build against mock data, wire to real procedures as track A lands them. |
| **D — Feature screens** | FE | S6–S14 | After M6-3 | Needs the shared UI primitives from track C first. |
| **E — Quality & release** | QA, OPS | M7, M8 | After M4-5 | Tests need real procedures to test against. |

Rules that keep tracks from colliding:

- Track A owns `prisma/schema.prisma`. Anyone else needing a model change asks
  rather than editing it, or you will get migration conflicts.
- Track B owns `src/server/auth.ts` and everything under `src/app/(auth)`.
- Tracks C and D coordinate on `src/components`. Track C defines the primitives,
  track D consumes them.
- Nobody edits another track's router file. New procedures go in your own router.

## Progress at a glance

| Milestone | Scope | Roles | Done | Total | Status |
| --------- | ----- | ----- | ---- | ----- | ------ |
| [M0](#m0--repository--tooling) | Repository & tooling | OPS | 10 | 13 | 🟡 |
| [M1](#m1--data-model) | Data model | DB | 0 | 8 | ⬜ |
| [M2](#m2--authentication) | Authentication | AUTH | 0 | 12 | ⬜ |
| [M3](#m3--main-account-virtual-card--stashes) | Account, card & Stashes | BE, FE | 0 | 11 | ⬜ |
| [M4](#m4--transfers--bill-payments) | Transfers & bill pay | BE | 0 | 12 | ⬜ |
| [M5](#m5--loyalty-rewards) | Loyalty rewards | BE | 0 | 7 | ⬜ |
| [M6](#m6--interface-shell) | Interface shell | FE | 0 | 8 | ⬜ |
| [M7](#m7--testing) | Testing | QA | 0 | 6 | ⬜ |
| [M8](#m8--deployment) | Deployment | OPS | 0 | 6 | ⬜ |
| | **Total** | | **10** | **83** | |

Screens are tracked separately in [Screen specifications](#screen-specifications).

---

## User journey

The order a user actually moves through the app. Build in this order — each
screen needs the one before it to have somewhere to hand off to.

```
S1 Welcome
   ├── S2 Sign up ──┐
   └── S3 Sign in ──┴──▶ S4 Account setup ──▶ S5 Home dashboard
                                                    │
        ┌──────────────┬──────────────┬─────────────┼─────────────┬──────────────┐
        ▼              ▼              ▼             ▼             ▼              ▼
   S6 Send money  S7 Pay bills   S8 Stashes   S10 Card      S11 Rewards   S12 History
        │              │              │        management         │              │
        │              │         S9 Stash detail                  │              │
        └──────────────┴──────────────┴─────────────┴─────────────┴──────────────┘
                                       │
                                       ▼
                                 S13 Receipt

              S14 Profile & settings ──▶ sign out ──▶ S1
```

| Screen | Route | Access | Role | Status |
| ------ | ----- | ------ | ---- | ------ |
| [S1](#s1--welcome) Welcome | `/` | Public | FE | ⬜ |
| [S2](#s2--sign-up) Sign up | `/signup` | Public | FE, AUTH | ⬜ |
| [S3](#s3--sign-in) Sign in | `/signin` | Public | FE, AUTH | ⬜ |
| [S4](#s4--account-setup) Account setup | `/onboarding` | Protected | FE, BE | ⬜ |
| [S5](#s5--home-dashboard) Home dashboard | `/dashboard` | Protected | FE | ⬜ |
| [S6](#s6--send-money) Send money | `/transfer` | Protected | FE, BE | ⬜ |
| [S7](#s7--pay-bills) Pay bills | `/bills` | Protected | FE, BE | ⬜ |
| [S8](#s8--stashes) Stashes | `/stashes` | Protected | FE, BE | ⬜ |
| [S9](#s9--stash-detail) Stash detail | `/stashes/[id]` | Protected | FE, BE | ⬜ |
| [S10](#s10--card-management) Card management | `/card` | Protected | FE, BE | ⬜ |
| [S11](#s11--rewards) Rewards | `/rewards` | Protected | FE, BE | ⬜ |
| [S12](#s12--transaction-history) Transaction history | `/transactions` | Protected | FE, BE | ⬜ |
| [S13](#s13--receipt) Receipt | `/transactions/[ref]` | Protected | FE | ⬜ |
| [S14](#s14--profile--settings) Profile & settings | `/settings` | Protected | FE, AUTH | ⬜ |

---

## Screen specifications

Every control that needs building, in flow order. **Backend** names the tRPC
procedure or milestone task the control depends on.

### S1 — Welcome

Unauthenticated landing page. Redirect straight to S5 when a session exists.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Logo and wordmark | Static | GoBank Express branding | FE | — |
| Tagline | Static | One line on what the app does | FE | — |
| **Create account** | Primary button | Navigate to S2 | FE | — |
| **Sign in** | Secondary button | Navigate to S3 | FE | — |

### S2 — Sign up

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Full name | Text input | Required, 2 to 60 characters | FE | M2-9 |
| Email | Email input | Required, unique, lowercased before saving | FE | M2-9 |
| Mobile number | Tel input | Required, unique, PH format `09XXXXXXXXX`. This doubles as a transfer handle, so uniqueness is enforced at the database level | FE, DB | M1-2 |
| Password | Password input | Minimum 8 characters, at least one letter and one number | FE | M2-8 |
| Confirm password | Password input | Must match | FE | M2-9 |
| Strength meter | Indicator | Live feedback while typing | FE | — |
| Show / hide password | Icon toggle | Switches the input type | FE | — |
| **Create account** | Primary button | Hashes the password, creates user, account, card, signs in, goes to S4 | AUTH, BE | `auth.register` |
| **Continue with Google** | OAuth button | Google consent, then S4 on first sign-in | AUTH | M2-5 |
| Link to sign in | Text link | Navigate to S3 | FE | — |

### S3 — Sign in

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Email | Email input | Required | FE | M2-7 |
| Password | Password input | Required | FE | M2-7 |
| **Sign in** | Primary button | Credentials provider. On failure show one generic message, never reveal whether the email exists | AUTH | M2-7 |
| **Continue with Google** | OAuth button | Google provider | AUTH | M2-5 |
| Link to sign up | Text link | Navigate to S2 | FE | — |

### S4 — Account setup

Runs once, immediately after first registration. Not reachable afterwards.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Generated account number | Static | Created server-side, shown once with a copy control | BE | M3-1 |
| Copy account number | Icon button | Copies to clipboard | FE | — |
| Card created notice | Static | Card starts `UNLOCKED` with the default daily limit | BE | M1-5 |
| Starting balance notice | Static | Depends on decision [D1](#open-decisions) | BE | — |
| **Continue to dashboard** | Primary button | Navigate to S5 | FE | — |

### S5 — Home dashboard

The hub. Everything else is reached from here.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Greeting | Static | "Good morning, {first name}" | FE | `account.me` |
| Account number | Static | Masked as `•••• 4821`, tap to reveal | FE | `account.me` |
| Main balance | Static | Large, peso-formatted, refetched on window focus | FE | `account.getBalance` |
| Balance visibility | Icon toggle | Hide and show the figure | FE | — |
| **Send** | Quick action | Navigate to S6 | FE | — |
| **Pay bills** | Quick action | Navigate to S7 | FE | — |
| **Stashes** | Quick action | Navigate to S8 | FE | — |
| **Rewards** | Quick action | Navigate to S11 | FE | — |
| Card widget | Card | Shows lock state, tap opens S10 | FE | `card.get` |
| Stash summary | List | Up to 5 rows with progress bars, tap opens S9 | FE | `stash.list` |
| Recent transactions | List | Last 5, each tappable to S13 | FE | `transaction.list` |
| **View all** | Text link | Navigate to S12 | FE | — |
| Points chip | Static | Current points, tap opens S11 | FE | `rewards.getBalance` |
| Profile avatar | Icon button | Navigate to S14 | FE | — |

### S6 — Send money

Transferring to another user is the core feature and the easiest to get wrong.
Four steps. **Money moves only on the confirm in step 3.**

**Step 1 — choose recipient**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Recipient input | Text input | Accepts an account number **or** a mobile number. Detect which by format | FE | M4-3, M4-4 |
| Lookup feedback | Inline state | Resolves to the recipient's name, or shows "account not found" | BE | `transfer.lookup` |
| Recent recipients | List | Last 5 people paid, tap to prefill | BE | `transfer.recentRecipients` |
| **Continue** | Primary button | Disabled until a recipient resolves | FE | — |

Lookup returns only the display name — never the recipient's balance, email or
full account number. Rate-limit it so it cannot be used to enumerate accounts.

**Step 2 — enter amount**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Recipient summary | Static | Confirms the resolved name so the user sees who they are paying | FE | — |
| Amount | Numeric input | Peso-formatted, greater than zero, at most 2 decimal places | FE | M4-6 |
| Available balance | Static | Live remaining balance | FE | `account.getBalance` |
| Note | Text input | Optional, maximum 100 characters | FE | — |
| Points preview | Static | "You will earn N points", floor of amount ÷ 50 | FE | M5-3 |
| **Review** | Primary button | Blocked on insufficient funds, self-transfer, locked card, or exceeding the daily limit | FE, BE | M4-6, M4-7 |

**Step 3 — confirm**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Full summary | Static | Recipient name, account, amount, note, points to earn | FE | — |
| **Confirm and send** | Primary button | Fires the transfer. Disable on first click and show a spinner so it cannot be pressed twice | FE, BE | `transfer.send`, M4-8 |
| **Back** | Secondary button | Returns to step 2 with values preserved | FE | — |

**Step 4** hands off to [S13 Receipt](#s13--receipt).

See [Transfer rules](#transfer-rules) for exactly what the server must do.

### S7 — Pay bills

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Saved billers | List | The user's registered billers | BE | `bill.listSaved` |
| **Add biller** | Secondary button | Opens the catalogue picker | FE | `bill.catalogue` |
| Category filter | Chips | Electric, Water, Internet, Credit card | FE | M4-10 |
| Account or reference number | Text input | Format validated per biller | FE, DB | M1-7 |
| Nickname | Text input | Optional label, for example "Home Meralco" | FE | — |
| Amount | Numeric input | Greater than zero, at most the available balance | FE | M4-6 |
| Points preview | Static | Same 1 point per ₱50 rule | FE | M5-3 |
| **Review** | Primary button | Same guards as a transfer | FE | M4-11 |
| **Confirm payment** | Primary button | Executes, then S13 | BE | `bill.pay` |

A bill payment is a transfer with no crediting side. It debits the payer, writes
one ledger row, and accrues points identically.

### S8 — Stashes

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Stash counter | Static | "3 of 5 used" | FE | `stash.list` |
| Stash cards | List | Name, balance, target, progress bar. Tap opens S9 | FE | `stash.list` |
| **Create Stash** | Primary button | **Disabled once 5 exist**, with a tooltip explaining the cap | FE | M3-4 |
| Name | Text input | Required, 1 to 30 characters | FE | M3-4 |
| Target amount | Numeric input | Optional savings goal | FE | M1-4 |
| Initial deposit | Numeric input | Optional, moves money from main on create | FE | M3-6 |
| **Create** | Primary button | Creates the Stash and returns to S8 | BE | `stash.create` |

The 5-Stash cap is enforced **server-side** as well. Disabling the button is a
courtesy, not the control.

### S9 — Stash detail

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Name and progress | Static | Balance against target | FE | `stash.get` |
| Interest earned | Static | Accrued to date, see decision [D3](#open-decisions) | BE | M3-7 |
| **Add money** | Primary button | Main → Stash, atomic, writes a ledger row | BE | `stash.deposit` |
| **Withdraw** | Secondary button | Stash → main, atomic | BE | `stash.withdraw` |
| **Rename** | Text button | Inline edit | FE | `stash.rename` |
| **Delete** | Danger button | Confirmation dialog, returns the balance to main first | FE, BE | `stash.delete` |
| Stash activity | List | Movements in and out of this Stash | FE | `transaction.list` |

### S10 — Card management

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Card visual | Static | Masked number, holder name, state badge | FE | `card.get` |
| **Lock / Unlock** | Toggle | Flips `LOCKED` and `UNLOCKED`, effective immediately | FE, BE | `card.setState`, M3-10 |
| Locked notice | Static | Explains that outward transactions are refused while locked | FE | M3-10 |
| Daily spending limit | Numeric input | Editable ceiling | FE | M3-11 |
| **Save limit** | Primary button | Persists, then enforced on every outward transaction | BE | `card.setDailyLimit` |
| Reveal card number | Icon button | Requires re-entering the password | AUTH | M2-11 |

### S11 — Rewards

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Points balance | Static | Derived by summing the ledger, never a mutable column | BE | `rewards.getBalance` |
| Earn rate explainer | Static | "1 point per ₱50 on transfers and bill payments" | FE | — |
| Cash value preview | Static | Points ÷ 100, peso-formatted | FE | M5-5 |
| Points to convert | Numeric input | Multiples of 100, at most the balance | FE | M5-5 |
| **Convert to cash** | Primary button | Credits the main balance atomically, then S13 | BE | `rewards.convert` |
| Points history | List | Earned and spent rows | FE | `rewards.history` |

### S12 — Transaction history

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Search | Text input | By reference number or counterparty name | BE | `transaction.list` |
| Type filter | Chips | Transfer in, transfer out, bill, Stash, reward | FE | M4-12 |
| Date range | Picker | Filters the ledger | FE | M4-12 |
| Transaction rows | List | Amount, counterparty, date. Tap opens S13 | FE | `transaction.list` |
| Load more | Button | Cursor pagination, never offset | BE | M4-12 |
| Empty state | Static | Shown when nothing matches | FE | M6-6 |

### S13 — Receipt

Reached after every money movement, and from any history row.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Status indicator | Static | Success or failure | FE | — |
| Amount | Static | Large, peso-formatted | FE | — |
| Reference number | Static | Unique, with a copy control | BE | M4-1 |
| Timestamp | Static | Date and time of the movement | BE | M1-6 |
| Counterparty | Static | Recipient or biller | FE | — |
| Balance after | Static | The snapshot stored on the ledger row, not a fresh read | BE | M4-2 |
| Points earned | Static | Shown when the transaction was eligible | BE | M5-2 |
| **Done** | Primary button | Return to S5 | FE | — |
| **Share receipt** | Secondary button | Copy or export the detail | FE | — |

### S14 — Profile & settings

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Name, email, mobile | Static | Read from the session user | FE | `account.me` |
| Edit profile | Button | Update name and mobile, uniqueness still enforced | BE | `account.update` |
| **Change password** | Button | Current, new, confirm. Credentials accounts only | AUTH | M2-8 |
| Linked accounts | Static | Whether Google is connected | AUTH | M2-10 |
| **Sign out** | Danger button | Clears the session, returns to S1 | AUTH | M2-3 |

---

## Transfer rules

The single most important piece of logic in the project. Every balance change
in the app — transfers, bill payments, Stash movements, reward conversions —
goes through the same helper and obeys these rules.

**Order of operations inside one `prisma.$transaction`:**

1. Load the sender's account `FOR UPDATE` so a concurrent transfer cannot read a
   stale balance.
2. Re-validate everything the client claimed. Never trust the amount, the
   recipient or the balance sent from the browser.
3. Check the card is `UNLOCKED`.
4. Check the amount is positive and has at most 2 decimal places.
5. Check the sender is not the recipient.
6. Check sufficient funds.
7. Check the daily limit is not exceeded, summing today's outward rows.
8. Debit the sender.
9. Credit the recipient, when there is one.
10. Write one ledger row per side, each with reference, timestamp and the
    balance snapshot after the change.
11. Accrue reward points when the transaction is eligible.
12. Commit. If any step throws, the whole thing rolls back and no money moved.

**Non-negotiable:**

| Rule | Why |
| ---- | --- |
| All amounts are `Decimal` | Floating point loses centavos. Never use `Float` for money |
| Debit and credit commit together or not at all | A partial transfer creates or destroys money |
| The ledger is append-only | Rows are never updated or deleted. Corrections are new reversing rows |
| Balance snapshots are stored, not computed | A receipt must show the balance at that moment, forever |
| Every procedure is a `protectedProcedure` | An unauthenticated transfer endpoint is a total compromise |
| The sender is taken from the session | Never from the request body, or anyone can send from any account |
| Idempotency key on every transfer | A double-tap or retry must not send twice |

**Error cases the UI must handle:** insufficient funds, recipient not found,
self-transfer, card locked, daily limit exceeded, amount invalid, duplicate
idempotency key, and the transaction timing out mid-flight.

---

## M0 — Repository & tooling

| ID | Task | Role | Owner | Status | Notes |
| -- | ---- | ---- | ----- | ------ | ----- |
| M0-1 | Initialise repository and push to GitHub | OPS | | ✅ | `neilacapuccino/gobank-express` |
| M0-2 | Scaffold T3 app (Next.js, tRPC, Prisma, Tailwind) | OPS | | ✅ | Lives in `gobank/` |
| M0-3 | Adopt Git Flow with `main`, `staging`, `develop` | OPS | | ✅ | Documented in `CONTRIBUTING.md` |
| M0-4 | Pull request and issue templates, CODEOWNERS | OPS | | ✅ | Under `.github/` |
| M0-5 | CI workflow: format, lint, typecheck, build | OPS | | ✅ | `.github/workflows/ci.yml` |
| M0-6 | Fix failing `format:check` in CI | OPS | | ✅ | Added `.prettierignore` for `generated/` |
| M0-7 | Project README with setup instructions | OPS | | ✅ | |
| M0-8 | Remove `create-t3-app` template, white base page | FE | | ✅ | |
| M0-9 | Local PostgreSQL 18 running, `.env` configured | OPS | | ✅ | Native install, no Docker needed |
| M0-10 | Dependabot | OPS | | ➖ | Removed deliberately, unwanted branch noise |
| M0-11 | Placeholder `health` tRPC router | BE | | ✅ | Delete once real routers exist |
| M0-12 | Branch protection rules on `main` and `staging` | OPS | | ⬜ | Require PR, 1 approval, passing CI |
| M0-13 | Untrack `gobank/generated/` and add to `.gitignore` | OPS | | ⬜ | Build output, churns on every `npm install` |

---

## M1 — Data model

Owned by one person. Merge before backend work starts. Money is `Decimal`,
points are `Int`.

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M1-1 | Remove scaffold `Post` model and its table | DB | | ⬜ | | Nothing references it |
| M1-2 | `User` model with profile and mobile number | DB | | ⬜ | | Mobile must be unique, it is a transfer handle |
| M1-3 | `BankAccount` model — number, balance, status | DB | | ⬜ | M1-2 | Named to avoid clashing with the NextAuth `Account` model, see [D2](#open-decisions) |
| M1-4 | `Stash` model — name, target, balance, rate | DB | | ⬜ | M1-3 | Cap of 5 enforced in the service layer, not the schema |
| M1-5 | `Card` model — `LOCKED`/`UNLOCKED`, daily limit | DB | | ⬜ | M1-3 | One virtual card per account |
| M1-6 | `Transaction` ledger — reference, type, amount, snapshot | DB | | ⬜ | M1-3 | Append-only. Index on account and date |
| M1-7 | `Biller` and `UserBiller` models | DB | | ⬜ | M1-2 | Catalogue plus per-user registrations |
| M1-8 | `RewardLedger` model — earned, spent, reference | DB | | ⬜ | M1-2 | Append-only, mirrors `Transaction` |

---

## M2 — Authentication

This app was scaffolded **without** NextAuth, so this is a fresh install.

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M2-1 | Install `next-auth@beta` (v5) and `@auth/prisma-adapter` | AUTH | | ⬜ | | v5 is the App Router API |
| M2-2 | Add Auth.js models: `Account`, `Session`, `VerificationToken` | AUTH, DB | | ⬜ | M2-1, M1-2 | Coordinate with M1-3 on the `Account` name |
| M2-3 | Base `auth.ts` config with the Prisma adapter | AUTH | | ⬜ | M2-2 | |
| M2-4 | Add `AUTH_SECRET` to `src/env.js` and `.env.example` | AUTH | | ⬜ | M2-1 | |
| M2-5 | Google OAuth provider | AUTH | | ⬜ | M2-3 | Needs `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` |
| M2-6 | Register the OAuth app in Google Cloud Console | AUTH | | ⬜ | | Redirect URI `/api/auth/callback/google` |
| M2-7 | Credentials provider for email and password | AUTH | | ⬜ | M2-3 | Forces `session.strategy = "jwt"` for Google too |
| M2-8 | Password hashing with `bcryptjs` or `argon2` | AUTH | | ⬜ | M2-7 | Hash on registration, compare on sign-in, never store plaintext |
| M2-9 | Sign-up flow creating user, account and card together | AUTH, BE | | ⬜ | M2-8, M1-5 | One transaction, or a user can exist without an account |
| M2-10 | Sign-in offering both Google and password | AUTH | | ⬜ | M2-5, M2-7 | Decide account linking, see [D5](#open-decisions) |
| M2-11 | Session in tRPC context and `protectedProcedure` | AUTH, BE | | ⬜ | M2-3 | Every banking route uses it |
| M2-12 | Route protection for authenticated pages | AUTH | | ⬜ | M2-11 | See Cookbook Ch. 3 |

---

## M3 — Main account, virtual card & Stashes

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M3-1 | Generate a unique account number on registration | BE | | ⬜ | M1-3, M2-9 | Retry on collision |
| M3-2 | `account.getBalance` and `account.me` | BE | | ⬜ | M1-3, M2-11 | Powers S5 |
| M3-3 | Dashboard wired to real data | FE | | ⬜ | M3-2, M6-2 | S5 |
| M3-4 | `stash.create` with the 5-Stash cap | BE | | ⬜ | M1-4 | Reject the 6th with a clear error |
| M3-5 | `stash.list`, `stash.get`, `stash.rename` | BE | | ⬜ | M1-4 | |
| M3-6 | Move money main ↔ Stash | BE | | ⬜ | M1-6, M3-4 | Atomic, writes a ledger row |
| M3-7 | Stash interest accrual | BE | | ⬜ | M1-4 | See [D3](#open-decisions) |
| M3-8 | `stash.delete` returning the balance to main | BE | | ⬜ | M3-6 | |
| M3-9 | Stashes UI — list, create, fund, withdraw | FE | | ⬜ | M3-4, M3-6 | S8 and S9 |
| M3-10 | Card lock and unlock | BE, FE | | ⬜ | M1-5 | S10 |
| M3-11 | Daily spending limit | BE, FE | | ⬜ | M1-5 | Enforced in the transfer path, step 7 |

---

## M4 — Transfers & bill payments

The highest-risk milestone. Read [Transfer rules](#transfer-rules) first.

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M4-1 | Transaction reference number generator | BE | | ⬜ | M1-6 | Unique, collision-safe, human-readable |
| M4-2 | Ledger write helper | BE | | ⬜ | M4-1 | The one place all money movement flows through |
| M4-3 | Recipient lookup by account number | BE | | ⬜ | M1-3 | Returns the name only |
| M4-4 | Recipient lookup by mobile number | BE | | ⬜ | M1-2 | Same response shape |
| M4-5 | `transfer.send` inside `prisma.$transaction` | BE | | ⬜ | M4-2, M4-3 | Debit and credit commit together or not at all |
| M4-6 | Insufficient funds, self-transfer, amount guards | BE | | ⬜ | M4-5 | |
| M4-7 | Daily limit and card-locked checks | BE | | ⬜ | M3-11, M4-5 | |
| M4-8 | Idempotency key on transfers | BE, DB | | ⬜ | M4-5 | Unique-constrained, prevents double send |
| M4-9 | Send money UI, four steps | FE | | ⬜ | M4-5, M6-2 | S6 |
| M4-10 | Seed the biller catalogue | DB | | ⬜ | M1-7 | Electric, water, internet, credit card |
| M4-11 | `bill.pay` reusing the ledger helper | BE | | ⬜ | M4-2, M1-7 | Debit only, no crediting side |
| M4-12 | Transaction history and receipts | BE, FE | | ⬜ | M4-2 | S12 and S13, cursor pagination |

---

## M5 — Loyalty rewards

Earn **1 point per ₱50.00**. Convert at **100 points = ₱1.00**.

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M5-1 | Define eligible transaction types | BE | | ⬜ | M4-5 | Outward transfers and bill payments only |
| M5-2 | Points accrual hook | BE | | ⬜ | M5-1, M1-8 | Same commit as the ledger write |
| M5-3 | Rounding rule | BE | | ⬜ | M5-2 | Floor. ₱149 earns 2 points. Document it, see [D4](#open-decisions) |
| M5-4 | `rewards.getBalance` | BE | | ⬜ | M1-8 | Summed from the ledger, never a mutable column |
| M5-5 | `rewards.convert` crediting main | BE | | ⬜ | M5-4, M4-2 | Atomic. Reject amounts that are not multiples of 100 |
| M5-6 | Rewards UI | FE | | ⬜ | M5-4 | S11 |
| M5-7 | Ledger reconciliation check | QA | | ⬜ | M5-2 | Ledger sum must equal the reported balance |

---

## M6 — Interface shell

Track C builds these first. Tracks D and beyond consume them.

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M6-1 | Design tokens — colour, spacing, type scale | FE | | ⬜ | | Extend the Tailwind theme in `globals.css` |
| M6-2 | App shell — navigation, header, mobile-first layout | FE | | ⬜ | M6-1 | The spec calls for mobile-first |
| M6-3 | UI primitives — button, input, card, modal, list row | FE | | ⬜ | M6-1 | Blocks track D |
| M6-4 | Peso currency formatter | FE | | ⬜ | | One helper, used everywhere |
| M6-5 | Form handling and validation pattern | FE | | ⬜ | M6-3 | Reuse the Zod schemas from the routers |
| M6-6 | Loading, empty and skeleton states | FE | | ⬜ | M6-3 | |
| M6-7 | Error boundary and toast notifications | FE | | ⬜ | M6-3 | Surfaces the transfer error cases |
| M6-8 | Accessibility pass — labels, focus order, contrast | FE | | ⬜ | M6-2 | |

---

## M7 — Testing

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M7-1 | Install and configure Vitest | QA | | ⬜ | | |
| M7-2 | Unit tests for points maths and rounding | QA | | ⬜ | M7-1, M5-3 | |
| M7-3 | Integration tests for transfers | QA | | ⬜ | M7-1, M4-5 | Cover every failure path, not just the happy one |
| M7-4 | Concurrency test — two simultaneous transfers | QA | | ⬜ | M7-3 | Proves the transaction boundary holds |
| M7-5 | Playwright E2E — sign up, transfer, convert | QA | | ⬜ | M4-9, M5-6 | See Cookbook Ch. 7 |
| M7-6 | Add the test suite to CI | OPS | | ⬜ | M7-1 | |

---

## M8 — Deployment

| ID | Task | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ---- | ----- | ------ | ---------- | ----- |
| M8-1 | Choose a managed PostgreSQL host | OPS | | ⬜ | | Neon, Supabase or Railway |
| M8-2 | Switch from `db push` to real migrations | OPS, DB | | ⬜ | M1-8 | Commit the migration files |
| M8-3 | Deploy to Vercel from `main` | OPS | | ⬜ | M8-1 | See Cookbook Ch. 8 |
| M8-4 | Production environment variables | OPS | | ⬜ | M8-3, M2-4 | Including the Google OAuth redirect URI |
| M8-5 | Run `prisma migrate deploy` on release | OPS | | ⬜ | M8-2 | |
| M8-6 | Preview deployments from `develop` | OPS | | ⬜ | M8-3 | |

---

## Open decisions

Settle these before the dependent work starts. Each blocks real code.

| ID | Decision | Blocks | Why it matters |
| -- | -------- | ------ | -------------- |
| **D1** | **How does money enter the system?** The specification has transfers between users, bill payments out, and reward conversion in — but no deposit, top-up or cash-in. Every account would start at zero and nothing could ever be sent | M3-1, S4, all demos | Without an answer the app cannot be demonstrated. Options: give every new account a starting balance, add an admin top-up, or add a mock cash-in screen |
| **D2** | Naming the banking account model. NextAuth's adapter requires a model literally named `Account` for OAuth links | M1-3, M2-2 | Board assumes `BankAccount` for the banking one. Confirm before writing migrations |
| **D3** | Interest accrual — rate, and daily or monthly | M3-7 | Changes the `Stash` schema and needs a scheduled job |
| **D4** | Points rounding, and whether conversion allows remainders | M5-3, M5-5 | Board assumes floor, and multiples of 100 only |
| **D5** | Can one email use both Google and a password? | M2-10 | Auto-linking is convenient but a known phishing vector if the provider does not verify emails |
| **D6** | Are transfers instant and irreversible, or is there a cancel window? | M4-5 | A cancel window means a pending state and a reversal path |

---

## Working conventions

- Branch from `develop` using the prefixes in [CONTRIBUTING.md](CONTRIBUTING.md).
- One task per pull request where practical. Put the task ID in the title.
- Update this file in the same pull request as the work it describes.
- Money is `Decimal`. Floating point is never acceptable for balances.
- Every balance change writes a ledger row in the same database transaction.
- Every banking procedure is a `protectedProcedure`.
- The acting user comes from the session, never from the request body.
- Validate with Zod at the router boundary and reuse the schema on the client.

## References

| Source | Use for |
| ------ | ------- |
| Bank Project Specs (`bank.pdf`) | Feature requirements, earn and conversion rates |
| Next.js Cookbook — Andrei Tazetdinov | Ch. 3 authorization, Ch. 7 E2E testing, Ch. 8 deployment, Ch. 9 optimisation |
| Fullstack React with TypeScript | React and TypeScript patterns, component composition, state with `useReducer` and Context |
| [create.t3.gg](https://create.t3.gg/) | T3 stack conventions |
| [authjs.dev](https://authjs.dev/) | NextAuth v5 providers and adapters |
