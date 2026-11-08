# Contributing

Thanks for helping. The project is [AGPL-3.0](LICENSE): by contributing you license your code under it. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

The workflow and writing rules live in [AGENTS.md](AGENTS.md) and apply to humans too. This file covers setup and the essentials.

## Before you start

For anything larger than a small fix, open an [issue](https://github.com/Seven-Panda-Labs/24/issues) first ([templates](.github/ISSUE_TEMPLATE/)).

## Setup

Node.js 24. Java 21+ for the emulators and `npm run test:rules`.

```bash
git clone https://github.com/Seven-Panda-Labs/24.git
cd 24
npm install && npm --prefix functions install
npm run setup:githooks                 # once per clone
cp .env.emulator.example .env.development.local
npm run emulators                      # terminal 1
npm run dev                            # terminal 2, http://localhost:5173
```

Details: [docs/emulators.md](docs/emulators.md). Using your own Firebase project instead: [docs/self-hosting.md](docs/self-hosting.md) and [docs/configuration.md](docs/configuration.md).

## Checks

`npm run check` is what CI runs: functions build, app build (with typecheck), lint, tests, Firestore and Storage rules tests and the changelog check. If you change dependencies, also run `npm run check:licenses`. CI additionally runs Gitleaks.

## Version and changelog

Every PR that changes what users see or get (the app, the rules, the functions) bumps the version: minor for features and visible changes, patch for fixes. `npm version minor --no-git-tag-version` (or `patch`) updates `package.json` and `package-lock.json`. Docs, tests, CI and refactors with no visible effect don't bump. The app shows the version in its footer and this changelog on its What's new page.

With the bump, add a section at the top of `change-log.md` (Portuguese), `change-log.en.md`, `change-log.de.md` and `change-log.fr.md`:

```markdown
## [0.2.0] - 2026-11-20

### Added

- Advent grid with 24 doors per calendar.
```

Sections: Added, Changed, Fixed, Removed (Adicionado, Alterado, Corrigido, Removido; Hinzugefügt, Geändert, Behoben, Entfernt; Ajouté, Modifié, Corrigé, Supprimé). Write for users, not about the implementation. `npm run check:changelog` verifies the versions match.

## Pull requests

- Branch from `main` (`feat/…`, `fix/…`, `docs/…`); `main` only changes through a reviewed PR with green CI.
- One topic per PR, minimal diff. Follow the patterns of the file you edit.
- English, imperative title and commits: `Add calendar grid view`.
- Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md); add screenshots for UI changes and `Fixes #NNN` where it applies.
- No secrets (`.env*.local`, `.firebaserc`, service accounts) and no real personal data in fixtures or screenshots (use names like «Zé Ninguém»).
