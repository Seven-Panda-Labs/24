# Agent instructions: 24

**Public repository:** [github.com/Seven-Panda-Labs/24](https://github.com/Seven-Panda-Labs/24)

How AI agents (Claude Code, Cursor, Copilot, CI bots) work in this repo; humans follow it too, with setup in [CONTRIBUTING.md](CONTRIBUTING.md). It is the **single source of truth**: tool-specific files only point here.

| Tool | File |
|------|------|
| Claude Code | `CLAUDE.md` (symlink to this file) |
| Cursor | [`.cursor/rules/public-repo-workflow.mdc`](.cursor/rules/public-repo-workflow.mdc) (pointer) |

What the product is and what v1 must do: [docs/project_brief.md](docs/project_brief.md). Read it before starting an epic.

## Golden rule

**Nothing lands on `main` without a reviewed PR and green CI.** Do not push directly to `main`, except when the user explicitly requests an emergency hotfix **and** confirms they may bypass the normal flow.

Enforced by hooks, see [Enforcement](#enforcement).

## Mandatory Git workflow

1. Update local `main`:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```
2. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/short-description
   # or: fix/…, docs/…, chore/…, test/…
   ```
3. Implement with a **minimal diff**, no unsolicited refactors.
4. Run checks **on the branch** (same as CI):
   ```bash
   npm run check
   ```
   It runs the functions build, the app build (typecheck included), lint, tests, Firestore and Storage rules tests and the changelog check. Read its exit status, not grepped output.
5. **Commit** only when the user explicitly asks.
6. Push the **branch** (not `main`):
   ```bash
   git push -u origin HEAD
   ```
7. Open a **PR** to `main` when the user asks (or after verified completion):
   ```bash
   gh pr create --base main --title "…" --body "…"
   ```
   Use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

   **Every PR targets `main`. Never stack PRs** on another feature branch: a stacked PR can merge into its base branch instead of `main` (#2 to #5 did, and it took a landing PR to fix). If work depends on an unmerged PR, wait for that PR to merge and branch from the updated `main`, or put both in one PR. Head branches are deleted automatically on merge.

## Before opening a PR

| Check | Command / note |
|-------|----------------|
| Build, lint, tests, rules, changelog | `npm run check` |
| Licenses (if deps changed) | `npm run check:licenses` |
| No secrets | CI Gitleaks; never commit `.env*.local`, `.firebaserc`, keys, service accounts |
| No real personal data | Fixtures, tests and screenshots use fictional people and gifts (e.g. «Zé Ninguém») |
| Private files | Real source data (e.g. the original Excel calendars) lives in `private/`, which is gitignored. Scripts read it from there; never copy it into the repo |
| Firestore and Storage rules | Every new collection or path gets rules and a case in `firestore.rules.test.ts` in the same PR |
| Version and changelog | Required for every change users see or get, see [Versions and changelog](#versions-and-changelog) |
| Scope | One topic per PR |

## Versions and changelog

Users see the version in the app's footer and read the changelog on its What's new page, so they must stay current.

- **Every PR that changes what users see or get** (the app, the Firestore or Storage rules, the functions) bumps the version and adds an entry at the top of **both** `change-log.md` (pt-PT) and `change-log.en.md`, as `## [X.Y.Z] - YYYY-MM-DD`.
- **Minor** for features and visible changes, **patch** for fixes: `npm version minor --no-git-tag-version` (or `patch`) updates `package.json` and `package-lock.json` together.
- Docs, tests, CI and refactors with no visible effect don't bump.
- If `main` reaches your version before your PR merges, bump again when you update the branch.
- Write entries for users, not about the implementation. Format and sections: [CONTRIBUTING.md](CONTRIBUTING.md#version-and-changelog).

## What agents must **not** do

- `git push origin main` (unless explicit hotfix instruction)
- `git push --force` to `main` / `master`
- Commit or push without user request
- Firebase deploy (`npm run deploy`) without explicit request
- Change the user's `git config`
- `--no-verify` / skip hooks without request
- Secrets, real PII, or credentials in code, commits, or PRs
- Large PRs mixing feature + refactor + formatting
- Em-dashes anywhere, and comments in any language but English (see [Writing](#writing-ui-text-and-code-comments))

## Writing: UI text and code comments

Applies to everything an agent writes: UI strings, i18n locales, code comments, commit messages, PR bodies.

| Rule | Why |
|------|-----|
| **No em-dashes** (`—`). Use a comma, a colon, brackets or a full stop | House style |
| **Concise and clear.** No wall of text. Cut the sentence that repeats the previous one | Long copy stops being read, in a doc comment as much as in the UI |
| **Comments only where the code is not self-evident.** Explain *why*, not *what* | A comment restating the line below it is noise that rots |
| **Comments in English**, like commits | Public repo, mixed-language contributors |

UI strings live in `src/i18n/locales/` in pt-PT and en; `npm run test` fails when the two files have different keys. User content (gift names, notes) is never translated.

## Enforcement

Local git hooks (enable once per clone with `npm run setup:githooks`):

| Hook | Blocks |
|------|--------|
| `.githooks/pre-push` | Any push to `main` / `master`, including force-push and delete |
| `.githooks/pre-commit` | `package.json` version bump without both changelogs staged and in sync |

The pre-push hook covers every agent and human that shells out to `git`. Emergency hotfix, only on explicit user instruction: `ALLOW_MAIN_PUSH=1 git push origin main`.

## Commits

- **English**, imperative subject lines: `Add calendar grid view`
- Prefer one focused PR over many WIP commits

## Deploy and production

Deploy only when the user asks, after merge to `main` or from a branch if instructed. Steps: [docs/self-hosting.md](docs/self-hosting.md).

## Reference docs

| Topic | File |
|-------|------|
| Product brief (scope, epics, acceptance) | [docs/project_brief.md](docs/project_brief.md) |
| Moodboard and components | [docs/visual_moodboard.html](docs/visual_moodboard.html) |
| Human contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security / secrets | [SECURITY.md](SECURITY.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Environment variables | [docs/configuration.md](docs/configuration.md) |
| Emulators | [docs/emulators.md](docs/emulators.md) |
| Self-hosting and deploy | [docs/self-hosting.md](docs/self-hosting.md) |
| Importing the original Excel | [docs/importing-the-excel.md](docs/importing-the-excel.md) |
| Palette and tokens | [docs/visual-identity.md](docs/visual-identity.md) |

## GitHub CI

Every PR and push to `main` runs `npm run check`, the license check and Gitleaks (`GITLEAKS_LICENSE` is an organization secret). The branch must pass before merge.
