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
