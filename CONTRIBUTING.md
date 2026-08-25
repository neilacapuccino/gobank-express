# Contributing to GoBank Express

## Branching model

This repository follows **Git Flow**. Three branches are permanent and are never
deleted; everything else is short-lived and deleted after merge.

| Branch    | Purpose                                        | Merges from            | Deploys to |
| --------- | ---------------------------------------------- | ---------------------- | ---------- |
| `main`    | Production. Always releasable. Tagged releases. | `staging`, `hotfix/*`  | Production |
| `staging` | Release candidate. QA / UAT sign-off.           | `develop`, `release/*` | Staging    |
| `develop` | Integration branch. Default target for PRs.     | `feature/*`, `fix/*`   | Preview    |

```
feature/*  ──┐
fix/*      ──┼──▶ develop ──▶ release/* ──▶ staging ──▶ main ──▶ tag vX.Y.Z
chore/*    ──┘                                            ▲
                                            hotfix/* ─────┘
```

### Short-lived branch prefixes

| Prefix      | Branch from | Merge into          | Use for                            |
| ----------- | ----------- | ------------------- | ---------------------------------- |
| `feature/`  | `develop`   | `develop`           | New functionality                  |
| `fix/`      | `develop`   | `develop`           | Non-urgent bug fixes               |
| `chore/`    | `develop`   | `develop`           | Tooling, deps, config, CI          |
| `docs/`     | `develop`   | `develop`           | Documentation only                 |
| `refactor/` | `develop`   | `develop`           | Behaviour-preserving restructuring |
| `test/`     | `develop`   | `develop`           | Test-only changes                  |
| `release/`  | `develop`   | `staging` → `main`  | Version bump, changelog, freeze    |
| `hotfix/`   | `main`      | `main` + `develop`  | Urgent production defects          |

Name branches in `kebab-case`, optionally prefixed with an issue number:

```
feature/142-transfer-limits
fix/payee-validation
hotfix/session-expiry
release/1.2.0
```

## Project structure

The application lives in `gobank/`. Everything below is relative to
`gobank/src` unless stated otherwise.

```
app/                        Next.js App Router — routes and screens
├── _components/            Components shared across more than one route
│   ├── ui/                 Generic primitives with no domain knowledge
│   ├── layout/             Page shell, header, error boundary
│   └── money/              Domain display components (peso, receipt row, card)
├── (auth)/                 Route group — public sign-up and sign-in
│   └── register/
│       ├── _components/    Components used only by this route
│       └── page.tsx
├── (app)/                  Route group — authenticated screens
│   ├── layout.tsx          Session guard and bottom navigation live here
│   ├── dashboard/
│   ├── transfer/
│   ├── stashes/[id]/
│   └── transactions/[reference]/
└── api/trpc/[trpc]/        tRPC HTTP handler

server/                     Server-only code, never imported by the client
├── api/
│   ├── routers/            One tRPC router per domain
│   ├── root.ts             Merges the routers into appRouter
│   └── trpc.ts             Context, middleware, procedure builders
├── services/               Business logic shared between routers
├── auth/                   NextAuth configuration
└── db.ts                   Prisma client singleton

lib/                        Pure helpers usable from client or server
├── schemas/                Zod schemas shared by routers and forms
├── money.ts                Decimal-safe arithmetic
├── format.ts               Currency, date and masking formatters
└── constants.ts            Business constants

hooks/                      Reusable React hooks
styles/                     Global stylesheet and design tokens
env.js                      Environment variable schema
```

Route groups are the folders in parentheses. They organise files without
appearing in the URL, so `(app)/dashboard` serves `/dashboard`. Folders starting
with an underscore are private and are never treated as routes.

### Where does this go?

| What you are adding | Where it belongs |
| ------------------- | ---------------- |
| A new screen | A folder under `app/(app)/` or `app/(auth)/` with a `page.tsx` |
| A component used by one screen | That route's own `_components/` folder |
| A component used by two or more screens | `app/_components/ui`, `layout` or `money` |
| A button, input or other generic control | `app/_components/ui/` |
| A new API procedure | The matching router in `server/api/routers/` |
| Logic two routers both need | `server/services/`, then call it from both |
| Anything that moves money | `server/services/ledger.ts`, never a router directly |
| A Zod schema | `lib/schemas/`, so the form and the router share one definition |
| A formatter or pure helper | `lib/` |
| A React hook | `hooks/` |
| A database model | `prisma/schema.prisma`, coordinating with whoever owns it |

Promote a component from a route's `_components/` to `app/_components/` the
moment a second route needs it. Do not import across routes.

### Naming

| Thing | Convention | Example |
| ----- | ---------- | ------- |
| Every file | `kebab-case` | `step-identity.tsx`, `card-brands.ts` |
| React component | `PascalCase` export from a kebab-case file | `export function StepIdentity()` in `step-identity.tsx` |
| Hook | File `use-*.ts`, export `useThing` | `use-debounce.ts` exports `useDebounce` |
| tRPC router | File named for the domain, export `<domain>Router` | `stash.ts` exports `stashRouter` |
| Service | Named for what it does | `ledger.ts`, `card-issuer.ts` |
| Zod schema | Named for the domain it validates | `lib/schemas/transfer.ts` |
| Route folder | Lowercase, dynamic segments in brackets | `stashes/[id]` |
| Route group | Lowercase in parentheses | `(app)`, `(auth)` |
| Private folder | Underscore prefix | `_components` |

A file exports one main thing named after the file. Small helpers used only by
that file may live alongside it rather than in `lib/`.

### Conventions that will bite you

- Import with the `~/` alias, never a long relative path. `~/lib/utils`, not
  `../../../lib/utils`.
- `server/` code must never be imported from a client component. Reach it through
  tRPC.
- Add `"use client"` only to components that need state, effects or event
  handlers. Everything else stays a server component.
- `page.tsx` must have a default export or the build fails.
- `isolatedModules` is enabled, so a file containing only a comment fails to
  compile. Placeholder files declare `export {}` to stay a module.
- There are no barrel `index.ts` files. Import directly from the file.
- Placeholder files carry a one-sentence comment saying what they will hold.
  Replace the comment with the implementation, do not leave both.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<optional scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `chore`, `revert`.

```
feat(transfers): add daily transfer limit
fix(auth): reject expired session tokens
chore(deps): bump next to 15.2.3
```

A breaking change is marked with `!` after the type/scope (`feat(api)!: ...`)
and a `BREAKING CHANGE:` footer.

## Pull requests

1. Branch from `develop` (or `main` for a hotfix).
2. Keep the PR focused — one logical change.
3. Ensure the checks below pass locally before requesting review.
4. Open the PR against `develop`, fill in the template, link the issue.
5. At least one approving review is required.
6. Merge with **Squash and merge** into `develop`; use **Merge commit** for
   `staging` → `main` so release history is preserved.
7. Delete the branch after merge.

## Local checks

The application lives in the `gobank/` directory — run all npm scripts there.

```bash
cd gobank
npm run typecheck
npm run lint
npm run format:check
npm run build
```

`npm run check` runs lint + typecheck together. Autofix with
`npm run lint:fix` and `npm run format:write`.

## Releases

Releases are cut from `develop` via a `release/x.y.z` branch, promoted through
`staging`, then merged to `main` and tagged with an annotated tag:

```bash
git tag -a v1.2.0 -m "v1.2.0"
git push origin v1.2.0
```

Versioning follows [Semantic Versioning](https://semver.org/).

## Environment variables

Never commit a `.env` file. Add any new variable to `.env.example` with a
placeholder value, and to the schema in `gobank/src/env.js`.
