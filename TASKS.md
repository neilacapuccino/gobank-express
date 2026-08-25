# GoBank Express — Task Board

Living status board and build guide. Update the **Status** cell as work moves,
in the same pull request as the work itself.

**Start with [What to do](#what-to-do)** — a written walkthrough of the build in
order. After that: [Scope](#scope) for what the brief requires versus what we
added, [Roles](#roles) to find your track, and
[Screen specifications](#screen-specifications) for exactly what to build.

## What to do

A written walkthrough of the build, in order. The tables further down are the
detail; this is the plan.

### Before anyone writes code

Settle **[D1](#open-decisions)**. The brief describes money moving between users
and out to billers, but never describes money entering the system. As written,
every account is created at ₱0.00 and stays there, which means no transfer can be
made and there is nothing to demonstrate. Decide whether new accounts open with a
starting balance, whether an administrator can top up, or whether there is a mock
cash-in screen. Nothing downstream is safe to build until this is answered.

While that is being decided, confirm **[D2](#open-decisions)**, the model naming.
NextAuth's Prisma adapter requires a model literally called `Account`, and the
banking side needs one too. This board assumes the banking one is `BankAccount`.
Changing it after migrations exist is painful, so agree it now.

### Phase 1 — the data model, by one person, first

One person takes **M1** and merges it before anyone else starts backend work.
Everything depends on the schema, and two people editing `prisma/schema.prisma`
in parallel produces migration conflicts that are tedious to unpick.

The rules that matter here: money columns are `Decimal` and never `Float`,
because floating point silently loses centavos. The `Transaction` and
`RewardLedger` tables are append-only — rows are never updated or deleted, and a
correction is a new reversing row. Mobile numbers are unique at the database
level, since they are both the sign-in identifier and the transfer handle.

Merge M1, then everyone else starts.

### Phase 2 — three tracks in parallel

Once the schema is in, three people can work without touching each other's files.

**Track A takes the money core (M4, M5).** This is the hardest and most dangerous
part of the project and should go to whoever is strongest on the backend. Build
the ledger write helper first — a single function that every balance change in
the entire app flows through. Transfers, bill payments, Stash movements and
reward conversions all use it. Once that exists and is correct, the features
built on top are comparatively easy. Read [Transfer rules](#transfer-rules)
before starting; the twelve ordered steps inside the database transaction are not
suggestions, and getting the ordering wrong is how money gets created or
destroyed.

**Track B takes identity and the card (M2).** Two registration paths: a mobile
number with a 6-digit PIN, or Google. Neither requires verifying anything — there
is no SMS provider and Google has already done the verifying. The critical piece
is M2-9, the failed-attempt lockout. A six-digit PIN is a million combinations,
which a script walks through quickly, so without server-side attempt counting and
rate limiting the PIN is decorative. Card issuance is the other half: the user
picks a brand, the system generates a Luhn-valid number from a documented test
range, a CVV and an expiry.

**Track C takes the interface shell (M6).** Portrait first, always. Build the
capped centre column, the design tokens, and the shared primitives — button,
input, card, modal, list row — plus the numeric keypad the PIN screens need.
Build against mock data and wire to real procedures as tracks A and B land them.
Track D cannot start until M6-3 is merged, so this is on the critical path.

### Phase 3 — the feature screens

With primitives available, the fourteen screens get built in journey order:
welcome, register, sign in, account ready, dashboard, then outward to send money,
bill pay, Stashes, card management, rewards and history.

Send money is the one to be careful with. It is four steps — resolve the
recipient, enter the amount, confirm, then receipt — and money moves only on the
confirm. The confirm button must disable on first press, and the request must
carry an idempotency key, or a double tap sends twice.

### Phase 4 — proving it works

Testing is not optional on the money paths. The specific tests that matter are
the failure cases rather than the happy path: insufficient funds, a locked card,
a self-transfer, an exceeded daily limit, and above all M7-4, two simultaneous
transfers from the same account. That last one is what proves the transaction
boundary actually holds. A concurrency bug here silently creates money and will
not show up in any single-threaded test.

### Phase 5 — deployment

Switch from `prisma db push` to real migrations before deploying, and commit the
migration files. Provision managed PostgreSQL, deploy from `main`, and remember
the Google OAuth redirect URI has to be registered again for the production
domain.

### How to keep the board honest

Put the task ID in every pull request title. Update the **Status** cell in the
same pull request as the work, not afterwards. Put your name in the **Owner**
column when you pick something up so nobody duplicates effort. If you discover
something the board does not cover, add a row rather than doing it silently.

## Legend

| Symbol | Status | Meaning |
| ------ | ------ | ------- |
| ⬜ | To Do | Not started |
| 🟡 | In Progress | Someone is actively on it |
| 🔵 | Review | Pull request open, awaiting merge |
| ✅ | Done | Merged to `main` |
| 🚫 | Blocked | Cannot proceed, see Notes |
| ➖ | Dropped | Deliberately not doing |

## Scope

Every task carries a scope tag so it is clear what came from the brief and what
the team added.

| Tag | Meaning |
| --- | ------- |
| **Core** | Explicitly required by the Bank Project Specs (`bank.pdf`) |
| **Extra** | Additional scope agreed by the team, not in the brief |
| **Infra** | Supporting work — tooling, testing, deployment |

### What the brief actually requires

Only three feature areas: the main account with a lockable virtual card and up
to five Stashes, peer-to-peer transfers with bill payments and receipts, and the
loyalty points programme at 1 point per ₱50 converting at 100 points to ₱1.00.

### What we are adding beyond it

The brief never mentions authentication at all, so **everything below is Extra**:

| Addition | Rationale |
| -------- | --------- |
| Two registration paths: mobile number, or Google | A banking app needs identity. Mobile doubles as the transfer handle; Google needs no form at all |
| 6-digit PIN sign-in instead of a password | Matches how a real banking app behaves on a phone |
| Cross-linking either method afterwards | Register one way, add the other later from settings |
| Card brand selection with generated number, CVV and expiry | The brief has a virtual card but never says where its details come from |
| Portrait-first layout with a desktop treatment | The brief says mobile-first; rendering well on a wide screen is our addition |
| Change PIN, profile editing, linked accounts | Standard account management the brief omits |

---

## Roles

Every task is tagged with a role so work divides without collisions. Put your
name in the **Owner** column when you pick something up.

| Tag | Role | Owns |
| --- | ---- | ---- |
| **DB** | Database | Prisma schema, migrations, seed data, indexes |
| **BE** | Backend | tRPC routers, business logic, database transactions, validation |
| **AUTH** | Authentication | NextAuth config, PIN handling, Google OAuth, session, route guards |
| **FE** | Frontend | Pages, components, forms, styling, client state |
| **QA** | Testing | Unit, integration and end-to-end tests |
| **OPS** | DevOps | CI, environments, deployment, migrations in production |

## How to split the work

**The data model blocks almost everything.** M1 must land before backend work
starts. One person owns it and merges it first, on day one.

After that, five tracks run in parallel:

| Track | Roles | Milestones | Can start | Notes |
| ----- | ----- | ---------- | --------- | ----- |
| **A — Money core** | DB, BE | M1, M4, M5 | Immediately | Hardest and highest-risk. Owns the ledger and transaction safety. Give this to the strongest backend person |
| **B — Identity & card** | AUTH, BE | M2 | Immediately | Registration, PIN, card issuance. Independent of the money code |
| **C — Interface shell** | FE | M6, S1 | Immediately | Portrait container and primitives. Build against mock data |
| **D — Feature screens** | FE | S2–S14 | After M6-3 | Needs the shared primitives from track C |
| **E — Quality & release** | QA, OPS | M7, M8 | After M4-5 | Tests need real procedures to test against |

Boundaries that stop tracks colliding:

- Track A owns `prisma/schema.prisma`. Anyone needing a model change asks rather
  than editing, or you get migration conflicts.
- Track B owns `src/server/auth.ts` and everything under `src/app/(auth)`.
- Tracks C and D coordinate on `src/components`. C defines primitives, D uses them.
- Nobody edits another track's router file. New procedures go in your own router.

## Progress at a glance

| Milestone | Scope | Roles | Done | Total | Status |
| --------- | ----- | ----- | ---- | ----- | ------ |
| [M0](#m0--repository--tooling) | Repository & tooling | OPS | 10 | 13 | 🟡 |
| [M1](#m1--data-model) | Data model | DB | 0 | 9 | ⬜ |
| [M2](#m2--registration-pin--card-issuance) | Registration, PIN & card | AUTH | 0 | 16 | ⬜ |
| [M3](#m3--main-account-virtual-card--stashes) | Account, card & Stashes | BE, FE | 0 | 15 | ⬜ |
| [M4](#m4--transfers--bill-payments) | Transfers & bill pay | BE | 0 | 12 | ⬜ |
| [M5](#m5--loyalty-rewards) | Loyalty rewards | BE | 0 | 7 | ⬜ |
| [M6](#m6--interface-shell) | Interface shell | FE | 0 | 9 | ⬜ |
| [M7](#m7--testing) | Testing | QA | 0 | 6 | ⬜ |
| [M8](#m8--deployment) | Deployment | OPS | 0 | 6 | ⬜ |
| | **Total** | | **10** | **93** | |

---

## Layout model

The app is a **web application that behaves like a mobile app**. Portrait is the
default and the design target.

| Viewport | Treatment |
| -------- | --------- |
| Under 640px | Full-bleed portrait. This is the primary design target |
| 640px and up | The same portrait column, capped at roughly 420px, centred, on a muted page background. A phone-shaped frame is optional |
| Desktop enhancement | **Extra scope.** Optional wider layout with a side navigation rail. Do not start it until the portrait experience is complete |

Everything is built portrait-first. Nothing in the core flows may depend on a
wide viewport to be usable.

---

## User journey

```
S1 Welcome
   ├── S2 Register (mobile or Google) ──┐
   └── S3 Sign in ─────────────────────┴──▶ S4 Account ready ──▶ S5 Home dashboard
                                                              │
        ┌──────────────┬──────────────┬─────────────┬─────────┼──────────────┐
        ▼              ▼              ▼             ▼         ▼              ▼
   S6 Send money  S7 Pay bills   S8 Stashes   S10 Card   S11 Rewards   S12 History
        │              │              │       management       │              │
        │              │         S9 Stash detail               │              │
        └──────────────┴──────────────┴──────────┴─────────────┴──────────────┘
                                       │
                                       ▼
                                 S13 Receipt

              S14 Profile & settings ──▶ sign out ──▶ S1
```

| Screen | Route | Access | Scope | Role | Status |
| ------ | ----- | ------ | ----- | ---- | ------ |
| [S1](#s1--welcome) Welcome | `/` | Public | Extra | FE | ⬜ |
| [S2](#s2--register) Register | `/register` | Public | Extra | FE, AUTH | ⬜ |
| [S3](#s3--sign-in) Sign in | `/signin` | Public | Extra | FE, AUTH | ⬜ |
| [S4](#s4--account-ready) Account ready | `/welcome` | Protected | Extra | FE, BE | ⬜ |
| [S5](#s5--home-dashboard) Home dashboard | `/dashboard` | Protected | Core | FE | ⬜ |
| [S6](#s6--send-money) Send money | `/transfer` | Protected | Core | FE, BE | ⬜ |
| [S7](#s7--pay-bills) Pay bills | `/bills` | Protected | Core | FE, BE | ⬜ |
| [S8](#s8--stashes) Stashes | `/stashes` | Protected | Core | FE, BE | ⬜ |
| [S9](#s9--stash-detail) Stash detail | `/stashes/[id]` | Protected | Core | FE, BE | ⬜ |
| [S10](#s10--card-management) Card management | `/card` | Protected | Core | FE, BE | ⬜ |
| [S11](#s11--rewards) Rewards | `/rewards` | Protected | Core | FE, BE | ⬜ |
| [S12](#s12--transaction-history) Transaction history | `/transactions` | Protected | Core | FE, BE | ⬜ |
| [S13](#s13--receipt) Receipt | `/transactions/[ref]` | Protected | Core | FE | ⬜ |
| [S14](#s14--profile--settings) Profile & settings | `/settings` | Protected | Extra | FE, AUTH | ⬜ |

---

## Screen specifications

**Backend** names the tRPC procedure or milestone task the control depends on.

### S1 — Welcome

Unauthenticated landing. Redirect straight to S5 when a session exists.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Logo and wordmark | Static | GoBank Express branding | FE | — |
| Tagline | Static | One line on what the app does | FE | — |
| **Get started** | Primary button | Navigate to S2 | FE | — |
| **I already have an account** | Secondary button | Navigate to S3 | FE | — |

### S2 — Register

Two independent paths. The user picks one at the start; whichever they skip can
be added later from [S14](#s14--profile--settings).

| Path | Identifier | Sign-in credential | PIN required now |
| ---- | ---------- | ------------------ | ---------------- |
| **A — Mobile** | Mobile number | Mobile + PIN | Yes |
| **B — Google** | Google account | Google | No |

Nothing is written to the database until the final step, which creates user,
bank account and card in a single transaction. See
[Card issuance rules](#card-issuance-rules) and [PIN security rules](#pin-security-rules).

**Step 0 — choose how to register**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| **Continue with Google** | OAuth button | Google consent, then straight to the card step. Name and email arrive automatically | AUTH | M2-5 |
| **Use my mobile number** | Secondary button | Starts path A | FE | — |

---

#### Path A — mobile number

**A1 — mobile number**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Mobile number | Tel input | **Required.** PH format `09XXXXXXXXX` or `+639XXXXXXXXX`, normalised to one stored form. Unique — it is the sign-in identifier and the transfer handle | FE, DB | M1-2 |
| Availability check | Inline state | Debounced check that the number is free | BE | `auth.checkMobile` |
| Email | Email input | **Optional.** Unique when given | FE | M2-14 |
| Why we ask | Helper text | Explains the number doubles as the transfer handle | FE | — |
| **Continue** | Primary button | Disabled until the number is valid and free | FE | — |

**No verification step.** The number is not confirmed by SMS or one-time code —
see [Known limitations](#known-limitations).

**A2 — your details**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Full name | Text input | Required, 2 to 60 characters. Printed on the card | FE | M1-2 |
| Date of birth | Date input | Optional unless a minimum age is enforced, see [D7](#open-decisions) | FE | — |
| **Continue** | Primary button | Advances to the card step | FE | — |

**A3 — create your PIN**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| PIN entry | **6 digit** input | On-screen numeric keypad, masked dots, no system keyboard | FE | M2-8 |
| Weak PIN rejection | Validation | Reject repeated digits like `111111`, runs like `123456`, and a date of birth match | FE, BE | M2-8 |
| Confirm PIN | 6 digit input | Must match. Mismatch clears both and restarts entry | FE | — |
| **Create PIN** | Primary button | Enabled only when both entries match and pass the rules | FE | — |

Both paths converge on the card step below.

---

#### Path B — Google

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Google consent | OAuth redirect | Returns name and verified email automatically. No form to fill | AUTH | M2-5 |
| Confirm name | Text input | Prefilled from Google, editable. Printed on the card | FE | M1-2 |
| **Continue** | Primary button | Advances to the card step | FE | — |

A Google user has **no mobile number and no PIN**. They sign in with Google, and
can add a number and PIN later from S14. Until they do, they can only be paid by
account number, not by mobile.

---

#### Both paths — choose your card

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Brand selector | Card picker | User **chooses** the brand: Visa, Mastercard, JCB, or GoBank as the unbranded fallback | FE | M3-12 |
| Brand artwork | Static | Live preview updating with the selection | FE | — |
| Card colour | Optional selector | Cosmetic only | FE | — |
| Generated notice | Helper text | Explains the number, CVV and expiry are issued automatically | FE | — |
| **Continue** | Primary button | Records the brand. Nothing is generated until the final commit | FE | M3-13 |

The user never types a card number. They pick a brand and the system issues it.

#### Both paths — review and finish

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Summary | Static | Identifier used, name, chosen brand. PIN is never displayed | FE | — |
| Terms acceptance | Checkbox | Required if terms exist | FE | — |
| **Create my account** | Primary button | One transaction creates user, PIN hash where applicable, bank account, and issues the card. Any failure rolls all of it back | AUTH, BE | `auth.register`, M2-10 |

### S3 — Sign in

The form offered depends on how the account was created. Both are always shown;
an account without a mobile number simply cannot use the PIN form.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Mobile number | Tel input | The sign-in identifier for path A accounts. Remembered on the device after first use | FE | M2-7 |
| PIN entry | 6 digit input | On-screen keypad, masked dots. Submits automatically on the last digit | FE | M2-7 |
| Failure message | Inline state | One generic message. Never reveal whether the number exists or the PIN was wrong | AUTH | M2-7 |
| Attempts remaining | Inline state | Warn from the third failed attempt onward | BE | M2-9 |
| Lockout notice | Inline state | After 5 failures, lock and show when it lifts | BE | M2-9 |
| **Continue with Google** | OAuth button | The sign-in method for path B accounts, and for path A accounts that linked Google later | AUTH | M2-5 |
| **Create an account** | Text link | Navigate to S2 | FE | — |

**There is no forgot-PIN flow.** See [Known limitations](#known-limitations).

### S4 — Account ready

Shown once, immediately after registration.

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Account number | Static | Issued server-side, shown with a copy control | BE | M3-1 |
| Issued card | Static | Brand, masked number, expiry, cardholder name | BE | M3-13 |
| Reveal full details | Button | Shows number and CVV once, gated by re-entering the PIN | AUTH | M3-15 |
| Card state notice | Static | Starts `UNLOCKED` with the default daily limit | BE | M1-5 |
| Starting balance notice | Static | Depends on [D1](#open-decisions) | BE | — |
| **Go to dashboard** | Primary button | Navigate to S5 | FE | — |

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
| Card widget | Card | Brand artwork, last four, lock state. Tap opens S10 | FE | `card.get` |
| Stash summary | List | Up to 5 rows with progress bars. Tap opens S9 | FE | `stash.list` |
| Recent transactions | List | Last 5, each tappable to S13 | FE | `transaction.list` |
| **View all** | Text link | Navigate to S12 | FE | — |
| Points chip | Static | Current points. Tap opens S11 | FE | `rewards.getBalance` |
| Profile avatar | Icon button | Navigate to S14 | FE | — |

### S6 — Send money

The core feature and the easiest to get wrong. Four steps. **Money moves only on
the confirm in step 3.**

**Step 1 — choose recipient**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Recipient input | Text input | Accepts an account number **or** a mobile number. Detect which by format | FE | M4-3, M4-4 |
| Lookup feedback | Inline state | Resolves to the recipient's name, or "account not found" | BE | `transfer.lookup` |
| Recent recipients | List | Last 5 paid, tap to prefill | BE | `transfer.recentRecipients` |
| **Continue** | Primary button | Disabled until a recipient resolves | FE | — |

Lookup returns the display name only — never balance, email or full account
number. Rate-limit it so it cannot enumerate accounts.

**Step 2 — enter amount**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Recipient summary | Static | Confirms who is being paid | FE | — |
| Amount | Numeric input | Peso-formatted, greater than zero, at most 2 decimal places | FE | M4-6 |
| Available balance | Static | Live remaining balance | FE | `account.getBalance` |
| Note | Text input | Optional, maximum 100 characters | FE | — |
| Points preview | Static | "You will earn N points", floor of amount ÷ 50 | FE | M5-3 |
| **Review** | Primary button | Blocked on insufficient funds, self-transfer, locked card, or exceeding the daily limit | FE, BE | M4-6, M4-7 |

**Step 3 — confirm**

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Full summary | Static | Recipient, account, amount, note, points to earn | FE | — |
| **Confirm and send** | Primary button | Fires the transfer. Disables on first press and shows a spinner so it cannot fire twice | FE, BE | `transfer.send`, M4-8 |
| **Back** | Secondary button | Returns to step 2 with values preserved | FE | — |

**Step 4** hands off to [S13 Receipt](#s13--receipt).

See [Transfer rules](#transfer-rules) for what the server must do.

### S7 — Pay bills

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Saved billers | List | The user's registered billers | BE | `bill.listSaved` |
| **Add biller** | Secondary button | Opens the catalogue picker | FE | `bill.catalogue` |
| Category filter | Chips | Electric, Water, Internet, Credit card | FE | M4-10 |
| Account or reference number | Text input | Format validated per biller | FE, DB | M1-7 |
| Nickname | Text input | Optional label such as "Home Meralco" | FE | — |
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
| Interest earned | Static | Accrued to date, see [D3](#open-decisions) | BE | M3-7 |
| **Add money** | Primary button | Main → Stash, atomic, writes a ledger row | BE | `stash.deposit` |
| **Withdraw** | Secondary button | Stash → main, atomic | BE | `stash.withdraw` |
| **Rename** | Text button | Inline edit | FE | `stash.rename` |
| **Delete** | Danger button | Confirmation dialog, returns the balance to main first | FE, BE | `stash.delete` |
| Stash activity | List | Movements in and out of this Stash | FE | `transaction.list` |

### S10 — Card management

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Card visual | Static | Brand artwork, masked number, holder name, expiry, state badge | FE | `card.get` |
| **Lock / Unlock** | Toggle | Flips `LOCKED` and `UNLOCKED`, effective immediately | FE, BE | `card.setState`, M3-10 |
| Locked notice | Static | Explains outward transactions are refused while locked | FE | M3-10 |
| **Reveal details** | Button | Shows full number and CVV, gated by re-entering the PIN, auto-hides after 30 seconds | AUTH | M3-15 |
| Daily spending limit | Numeric input | Editable ceiling | FE | M3-11 |
| **Save limit** | Primary button | Persists, then enforced on every outward transaction | BE | `card.setDailyLimit` |

### S11 — Rewards

| Element | Type | Behaviour | Role | Backend |
| ------- | ---- | --------- | ---- | ------- |
| Points balance | Static | Summed from the ledger, never a mutable column | BE | `rewards.getBalance` |
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
| Name, mobile, email | Static | Read from the session user. Shows "not set" for whichever the account lacks | FE | `account.me` |
| Edit profile | Button | Update name, uniqueness still enforced | BE | `account.update` |
| **Add a mobile number** | Button | Shown to Google accounts with no number. Sets the number **and** a PIN together, since one is useless without the other. Unlocks being paid by mobile | AUTH | M2-15 |
| **Link Google** | Button | Shown to mobile accounts. Adds Google as a second way in | AUTH | M2-16 |
| Add or change email | Button | Optional email capture after registration | BE | M2-14 |
| **Change PIN** | Button | Current PIN, new, confirm. Same strength rules as registration. Only for accounts that have a PIN | AUTH | M2-13 |
| Sign-in methods | Static | Lists what this account can use: mobile and PIN, Google, or both | AUTH | M2-5 |
| **Sign out** | Danger button | Clears the session, returns to S1 | AUTH | M2-3 |

---

## PIN security rules

A 6-digit PIN has only one million combinations, and a 4-digit PIN ten thousand.
That is trivially brute-forceable without server-side protection, so **rate
limiting is not optional here the way it might be for a long password.**

| Rule | Detail |
| ---- | ------ |
| Hash it, never store it | Use `argon2id` or `bcrypt` with a per-user salt, exactly as for a password |
| Never log it | Not in error messages, analytics, or server logs |
| Never send it back | No procedure returns the PIN or its hash for any reason |
| Lock out after 5 failures | Progressive delay, then a timed lock. Count server-side, never in the browser |
| Rate limit by number and by IP | Stops one attacker walking many accounts |
| Generic failure message | "Mobile number or PIN is incorrect" — never say which was wrong |
| Reject weak PINs | Repeated digits, ascending and descending runs, and a date of birth match |
| Constant-time comparison | The hash library handles this. Never compare with `===` |
| Re-enter for sensitive actions | Revealing card details and changing the PIN. **Not** required for transfers — see [resolved decisions](#resolved-decisions) |

---

## Card issuance rules

The user picks a brand; the system issues the credentials. **These cards are
simulated and exist only inside this application.** They are not connected to any
payment network, cannot be used anywhere, and must never be presented to a user
as though they were real payment credentials.

| Element | Rule |
| ------- | ---- |
| Brand | Chosen by the user at registration: Visa, Mastercard, JCB, or GoBank as the unbranded fallback |
| Number | Generated server-side, Luhn-valid so format validation passes, using a **documented test range for the chosen brand** so it can never collide with a real issued card. Never generate from a live BIN |
| CVV | 3 digits, or 4 for brands that use 4. Generated at issuance |
| Expiry | Issuance date plus 3 years, stored as month and year |
| Cardholder name | Taken from the registered full name |
| Initial state | `UNLOCKED`, with the default daily limit |
| Storage | Store brand, last four, expiry and state in the clear. Treat the full number and CVV as sensitive — encrypt at rest or store hashed, and gate reveal behind PIN re-entry |
| Display | Masked everywhere by default. Full details only on S4 at issuance and on S10 behind PIN re-entry, auto-hiding after 30 seconds |
| Uniqueness | Unique constraint on the number. Regenerate on collision |

A label stating the card is simulated appears wherever full details are shown.

---

## Transfer rules

The most important logic in the project. Every balance change — transfers, bill
payments, Stash movements, reward conversions — goes through the same helper.

**Order of operations inside one `prisma.$transaction`:**

1. Load the sender's account `FOR UPDATE` so a concurrent transfer cannot read a
   stale balance.
2. Re-validate everything the client claimed. Never trust the amount, recipient
   or balance sent from the browser.
3. Check the card is `UNLOCKED`.
4. Check the amount is positive with at most 2 decimal places.
5. Check the sender is not the recipient.
6. Check sufficient funds.
7. Check the daily limit, summing today's outward rows.
8. Debit the sender.
9. Credit the recipient, when there is one.
10. Write one ledger row per side, each with reference, timestamp and the balance
    snapshot after the change.
11. Accrue reward points when eligible.
12. Commit. If any step throws, everything rolls back and no money moved.

**Non-negotiable:**

| Rule | Why |
| ---- | --- |
| All amounts are `Decimal` | Floating point loses centavos. Never `Float` for money |
| Debit and credit commit together or not at all | A partial transfer creates or destroys money |
| The ledger is append-only | Never updated or deleted. Corrections are new reversing rows |
| Balance snapshots are stored, not computed | A receipt must show the balance at that moment, forever |
| Every procedure is a `protectedProcedure` | An unauthenticated transfer endpoint is a total compromise |
| The sender comes from the session | Never from the request body, or anyone can send from any account |
| Idempotency key on every transfer | A double-tap or retry must not send twice |

**Error cases the UI must handle:** insufficient funds, recipient not found,
self-transfer, card locked, daily limit exceeded, invalid amount, duplicate
idempotency key, wrong PIN, and the transaction timing out mid-flight.

---

## M0 — Repository & tooling

| ID | Task | Scope | Role | Owner | Status | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ----- |
| M0-1 | Initialise repository and push to GitHub | Infra | OPS | | ✅ | `neilacapuccino/gobank-express` |
| M0-2 | Scaffold T3 app | Infra | OPS | | ✅ | Lives in `gobank/` |
| M0-3 | Adopt Git Flow with `main`, `staging`, `develop` | Infra | OPS | | ✅ | See `CONTRIBUTING.md` |
| M0-4 | Pull request and issue templates, CODEOWNERS | Infra | OPS | | ✅ | Under `.github/` |
| M0-5 | CI workflow: format, lint, typecheck, build | Infra | OPS | | ✅ | `.github/workflows/ci.yml` |
| M0-6 | Fix failing `format:check` in CI | Infra | OPS | | ✅ | Added `.prettierignore` |
| M0-7 | Project README with setup instructions | Infra | OPS | | ✅ | |
| M0-8 | Remove `create-t3-app` template, white base page | Infra | FE | | ✅ | |
| M0-9 | Local PostgreSQL 18 running, `.env` configured | Infra | OPS | | ✅ | Native install, no Docker |
| M0-10 | Dependabot | Infra | OPS | | ➖ | Removed deliberately |
| M0-11 | Placeholder `health` tRPC router | Infra | BE | | ✅ | Delete once real routers exist |
| M0-12 | Branch protection on `main` and `staging` | Infra | OPS | | ⬜ | PR, 1 approval, passing CI |
| M0-13 | Untrack `gobank/generated/` | Infra | OPS | | ⬜ | Build output, churns constantly |

---

## M1 — Data model

Owned by one person. Merge before backend work starts.

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M1-1 | Remove scaffold `Post` model and table | Infra | DB | | ⬜ | | Nothing references it |
| M1-2 | `User` — name, unique mobile, optional email | Extra | DB | | ⬜ | | Mobile is the sign-in identifier and transfer handle |
| M1-3 | `BankAccount` — number, balance, status | Core | DB | | ⬜ | M1-2 | Named to avoid the NextAuth `Account` clash, see [D2](#open-decisions) |
| M1-4 | `Stash` — name, target, balance, rate | Core | DB | | ⬜ | M1-3 | Cap of 5 enforced in the service layer |
| M1-5 | `Card` — brand, number, CVV, expiry, state, limit | Core | DB | | ⬜ | M1-3 | See [Card issuance rules](#card-issuance-rules) for what is encrypted |
| M1-6 | `Transaction` ledger — reference, type, amount, snapshot | Core | DB | | ⬜ | M1-3 | Append-only. Index on account and date |
| M1-7 | `Biller` and `UserBiller` | Core | DB | | ⬜ | M1-2 | Catalogue plus per-user registrations |
| M1-8 | `RewardLedger` — earned, spent, reference | Core | DB | | ⬜ | M1-2 | Append-only, mirrors `Transaction` |
| M1-9 | PIN hash and failed-attempt fields on `User` | Extra | DB | | ⬜ | M1-2 | Hash, attempt count, locked-until timestamp |

---

## M2 — Registration, PIN & card issuance

Entirely **Extra scope** — the brief specifies no authentication. This app was
scaffolded without NextAuth, so it is a fresh install.

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M2-1 | Install `next-auth@beta` (v5) and `@auth/prisma-adapter` | Extra | AUTH | | ⬜ | | v5 is the App Router API |
| M2-2 | Add Auth.js models: `Account`, `Session`, `VerificationToken` | Extra | AUTH, DB | | ⬜ | M2-1, M1-2 | Coordinate with M1-3 on naming |
| M2-3 | Base `auth.ts` config with the Prisma adapter | Extra | AUTH | | ⬜ | M2-2 | |
| M2-4 | Add `AUTH_SECRET` to `src/env.js` and `.env.example` | Extra | AUTH | | ⬜ | M2-1 | |
| M2-5 | Google OAuth provider | Extra | AUTH | | ⬜ | M2-3 | Needs `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` |
| M2-6 | Register the OAuth app in Google Cloud Console | Extra | AUTH | | ⬜ | | Redirect URI `/api/auth/callback/google` |
| M2-7 | Credentials provider keyed on **mobile plus PIN** | Extra | AUTH | | ⬜ | M2-3 | Forces `session.strategy = "jwt"` |
| M2-8 | PIN hashing and strength rules | Extra | AUTH | | ⬜ | M2-7, M1-9 | See [PIN security rules](#pin-security-rules) |
| M2-9 | Failed-attempt counter, lockout and rate limiting | Extra | AUTH, BE | | ⬜ | M2-8 | **Mandatory.** A 6-digit PIN is brute-forceable without it |
| M2-10 | Registration transaction: user, PIN, account, card | Extra | AUTH, BE | | ⬜ | M2-8, M3-13 | All or nothing. A user must never exist without an account |
| M2-11 | Session in tRPC context and `protectedProcedure` | Extra | AUTH, BE | | ⬜ | M2-3 | Every banking route uses it |
| M2-12 | Route protection for authenticated pages | Extra | AUTH | | ⬜ | M2-11 | See Cookbook Ch. 3 |
| M2-13 | Change PIN | Extra | AUTH | | ⬜ | M2-8 | No recovery path exists, see [Known limitations](#known-limitations) |
| M2-14 | Optional email capture | Extra | AUTH | | ⬜ | M1-2 | Email is optional, so every flow must work without one |
| M2-15 | Add a mobile number and PIN to a Google account | Extra | AUTH | | ⬜ | M2-8, M2-5 | Set together. Unlocks being paid by mobile number |
| M2-16 | Link Google to a mobile account | Extra | AUTH | | ⬜ | M2-5, M2-7 | Adds a second sign-in method to an existing account |

---

## M3 — Main account, virtual card & Stashes

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M3-1 | Generate a unique account number at registration | Core | BE | | ⬜ | M1-3, M2-10 | Retry on collision |
| M3-2 | `account.getBalance` and `account.me` | Core | BE | | ⬜ | M1-3, M2-11 | Powers S5 |
| M3-3 | Dashboard wired to real data | Core | FE | | ⬜ | M3-2, M6-2 | S5 |
| M3-4 | `stash.create` with the 5-Stash cap | Core | BE | | ⬜ | M1-4 | Reject the 6th with a clear error |
| M3-5 | `stash.list`, `stash.get`, `stash.rename` | Core | BE | | ⬜ | M1-4 | |
| M3-6 | Move money main ↔ Stash | Core | BE | | ⬜ | M1-6, M3-4 | Atomic, writes a ledger row |
| M3-7 | Stash interest accrual | Core | BE | | ⬜ | M1-4 | See [D3](#open-decisions) |
| M3-8 | `stash.delete` returning the balance to main | Core | BE | | ⬜ | M3-6 | |
| M3-9 | Stashes UI — list, create, fund, withdraw | Core | FE | | ⬜ | M3-4, M3-6 | S8 and S9 |
| M3-10 | Card lock and unlock | Core | BE, FE | | ⬜ | M1-5 | S10 |
| M3-11 | Daily spending limit | Core | BE, FE | | ⬜ | M1-5 | Enforced in the transfer path, step 7 |
| M3-12 | Card brand selection UI | Extra | FE | | ⬜ | | S2 step 3. Visa, Mastercard, JCB, GoBank |
| M3-13 | Card number generator, Luhn-valid on test ranges | Extra | BE | | ⬜ | M1-5 | Never a live BIN. See [Card issuance rules](#card-issuance-rules) |
| M3-14 | CVV and expiry generation | Extra | BE | | ⬜ | M3-13 | Expiry is issuance plus 3 years |
| M3-15 | Reveal card details behind PIN re-entry | Extra | AUTH, FE | | ⬜ | M2-8, M3-13 | Auto-hide after 30 seconds |

---

## M4 — Transfers & bill payments

Highest-risk milestone. Read [Transfer rules](#transfer-rules) first.

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M4-1 | Transaction reference number generator | Core | BE | | ⬜ | M1-6 | Unique, collision-safe, human-readable |
| M4-2 | Ledger write helper | Core | BE | | ⬜ | M4-1 | The one place all money movement flows through |
| M4-3 | Recipient lookup by account number | Core | BE | | ⬜ | M1-3 | Returns the name only |
| M4-4 | Recipient lookup by mobile number | Core | BE | | ⬜ | M1-2 | Same response shape |
| M4-5 | `transfer.send` inside `prisma.$transaction` | Core | BE | | ⬜ | M4-2, M4-3 | Debit and credit commit together or not at all |
| M4-6 | Insufficient funds, self-transfer, amount guards | Core | BE | | ⬜ | M4-5 | |
| M4-7 | Daily limit and card-locked checks | Core | BE | | ⬜ | M3-11, M4-5 | |
| M4-8 | Idempotency key on transfers | Core | BE, DB | | ⬜ | M4-5 | Unique-constrained, prevents double send |
| M4-9 | Send money UI, four steps | Core | FE | | ⬜ | M4-5, M6-2 | S6 |
| M4-10 | Seed the biller catalogue | Core | DB | | ⬜ | M1-7 | Electric, water, internet, credit card |
| M4-11 | `bill.pay` reusing the ledger helper | Core | BE | | ⬜ | M4-2, M1-7 | Debit only, no crediting side |
| M4-12 | Transaction history and receipts | Core | BE, FE | | ⬜ | M4-2 | S12 and S13, cursor pagination |

---

## M5 — Loyalty rewards

Earn **1 point per ₱50.00**. Convert at **100 points = ₱1.00**.

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M5-1 | Define eligible transaction types | Core | BE | | ⬜ | M4-5 | Outward transfers and bill payments only |
| M5-2 | Points accrual hook | Core | BE | | ⬜ | M5-1, M1-8 | Same commit as the ledger write |
| M5-3 | Rounding rule | Core | BE | | ⬜ | M5-2 | Floor. ₱149 earns 2 points. See [D4](#open-decisions) |
| M5-4 | `rewards.getBalance` | Core | BE | | ⬜ | M1-8 | Summed from the ledger |
| M5-5 | `rewards.convert` crediting main | Core | BE | | ⬜ | M5-4, M4-2 | Atomic. Reject non-multiples of 100 |
| M5-6 | Rewards UI | Core | FE | | ⬜ | M5-4 | S11 |
| M5-7 | Ledger reconciliation check | Infra | QA | | ⬜ | M5-2 | Ledger sum must equal the reported balance |

---

## M6 — Interface shell

Track C builds these first. Track D consumes them.

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M6-1 | Design tokens — colour, spacing, type scale | Core | FE | | ⬜ | | Extend the Tailwind theme |
| M6-2 | Portrait app shell with bottom navigation | Core | FE | | ⬜ | M6-1 | See [Layout model](#layout-model) |
| M6-3 | UI primitives — button, input, card, modal, list row | Core | FE | | ⬜ | M6-1 | Blocks track D |
| M6-4 | Peso currency formatter | Core | FE | | ⬜ | | One helper, used everywhere |
| M6-5 | Numeric keypad and masked PIN input | Extra | FE | | ⬜ | M6-3 | Used on S2 step 4, S3, and every PIN re-entry |
| M6-6 | Loading, empty and skeleton states | Core | FE | | ⬜ | M6-3 | |
| M6-7 | Error boundary and toast notifications | Core | FE | | ⬜ | M6-3 | Surfaces the transfer error cases |
| M6-8 | Accessibility pass — labels, focus order, contrast | Core | FE | | ⬜ | M6-2 | Keypad must be keyboard-operable |
| M6-9 | Desktop treatment beyond the portrait column | Extra | FE | | ⬜ | M6-2 | Do not start until portrait is complete |

---

## M7 — Testing

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M7-1 | Install and configure Vitest | Infra | QA | | ⬜ | | |
| M7-2 | Unit tests for points maths and rounding | Infra | QA | | ⬜ | M7-1, M5-3 | |
| M7-3 | Integration tests for transfers | Infra | QA | | ⬜ | M7-1, M4-5 | Cover every failure path |
| M7-4 | Concurrency test — two simultaneous transfers | Infra | QA | | ⬜ | M7-3 | Proves the transaction boundary holds |
| M7-5 | Playwright E2E — register, sign in, transfer, convert | Infra | QA | | ⬜ | M4-9, M5-6 | See Cookbook Ch. 7 |
| M7-6 | Add the test suite to CI | Infra | OPS | | ⬜ | M7-1 | |

---

## M8 — Deployment

| ID | Task | Scope | Role | Owner | Status | Depends on | Notes |
| -- | ---- | ----- | ---- | ----- | ------ | ---------- | ----- |
| M8-1 | Choose a managed PostgreSQL host | Infra | OPS | | ⬜ | | Neon, Supabase or Railway |
| M8-2 | Switch from `db push` to real migrations | Infra | OPS, DB | | ⬜ | M1-9 | Commit the migration files |
| M8-3 | Deploy to Vercel from `main` | Infra | OPS | | ⬜ | M8-1 | See Cookbook Ch. 8 |
| M8-4 | Production environment variables | Infra | OPS | | ⬜ | M8-3, M2-4 | Including the Google redirect URI |
| M8-5 | Run `prisma migrate deploy` on release | Infra | OPS | | ⬜ | M8-2 | |
| M8-6 | Preview deployments from `develop` | Infra | OPS | | ⬜ | M8-3 | |

---

## Open decisions

Still unsettled. Each blocks dependent work.

| ID | Decision | Blocks | Why it matters |
| -- | -------- | ------ | -------------- |
| **D1** | **How does money enter the system?** The brief has transfers between users, bills going out, and reward conversion in — but no deposit, top-up or cash-in | M3-1, S4, every demo | Without an answer every account sits at ₱0.00 and nothing can be sent. Options: starting balance at registration, an admin top-up, or a mock cash-in screen |
| **D2** | Naming the banking account model. NextAuth's adapter requires a model literally named `Account` | M1-3, M2-2 | Board assumes `BankAccount`. Confirm before writing migrations |
| **D3** | Interest accrual — rate, and daily or monthly | M3-7 | Changes the `Stash` schema and needs a scheduled job |
| **D4** | Points rounding, and whether conversion allows remainders | M5-3, M5-5 | Board assumes floor and multiples of 100 |
| **D6** | Are transfers instant and irreversible, or is there a cancel window? | M4-5 | A cancel window means a pending state and a reversal path |
| **D7** | Is a minimum age enforced at registration? | S2 step A2 | Decides whether date of birth is required or optional |

## Resolved decisions

Settled on 2026-08-25. Recorded so nobody reopens them without cause.

| ID | Decision | Resolution |
| -- | -------- | ---------- |
| **D5** | How do Google and PIN sign-in coexist? | **Two independent registration paths, not a linking problem.** Register with a mobile number, or with Google. Google requires no verification step of its own — signing in *is* the registration. Whichever method was not used can be added later from S14, so the two never conflict at registration time |
| **D8** | PIN length | **6 digits.** Not 4 |
| **D9** | Forgot-PIN recovery | **No recovery flow will be built.** See [Known limitations](#known-limitations) |
| **D10** | Does sending money require PIN re-entry? | **No.** The session is sufficient. PIN re-entry is only required to reveal card details or change the PIN |

## Known limitations

Consequences of the decisions above. They are accepted, not oversights, and are
listed here so they are not mistaken for bugs during review.

| Limitation | Consequence |
| ---------- | ----------- |
| **Mobile numbers are not verified** | Registration sends no SMS or one-time code, so a number is not proof of identity. Anyone can register any number. Acceptable for coursework, and it avoids needing an SMS provider |
| **No forgot-PIN recovery** | A path-A user who forgets their PIN and has not linked Google **loses the account permanently**. Linking Google from S14 is the only way back in, so the interface should encourage it |
| **A Google-only account cannot be paid by mobile** | It has no number until the user adds one from S14. It can still be paid by account number |
| **PIN lockout is the only brute-force defence** | With no second factor, M2-9 is load-bearing. Do not ship without it |
| **Card details are simulated** | Generated numbers pass Luhn but belong to test ranges. They work nowhere outside this app |

## Working conventions

- Branch from `develop` using the prefixes in [CONTRIBUTING.md](CONTRIBUTING.md).
- One task per pull request where practical. Put the task ID in the title.
- Update this file in the same pull request as the work it describes.
- Money is `Decimal`. Floating point is never acceptable for balances.
- Every balance change writes a ledger row in the same database transaction.
- Every banking procedure is a `protectedProcedure`.
- The acting user comes from the session, never from the request body.
- Build portrait-first. Nothing core may require a wide viewport.
- Validate with Zod at the router boundary and reuse the schema on the client.

## References

| Source | Use for |
| ------ | ------- |
| Bank Project Specs (`bank.pdf`) | The Core requirements, earn and conversion rates |
| Next.js Cookbook — Andrei Tazetdinov | Ch. 3 authorization, Ch. 7 E2E testing, Ch. 8 deployment, Ch. 9 optimisation |
| Fullstack React with TypeScript | React and TypeScript patterns, component composition, state with `useReducer` and Context |
| [create.t3.gg](https://create.t3.gg/) | T3 stack conventions |
| [authjs.dev](https://authjs.dev/) | NextAuth v5 providers and adapters |
