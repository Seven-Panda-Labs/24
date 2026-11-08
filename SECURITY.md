# Security

## Report a vulnerability

Do not open a public issue. Email **[security@sevenpanda.eu](mailto:security@sevenpanda.eu)** with:

- the issue and its impact
- steps to reproduce
- the affected version (commit, tag or `package.json` version)
- a proof of concept or logs, without real users' personal data

We acknowledge within 72 hours (business days) and coordinate with you before any public disclosure. Please keep details private until a fix is out.

## Scope

In scope: authentication and authorization (Firestore and Storage rules), data exposure between users or family workspaces, injection or XSS in the PWA, and documented configuration that makes self-hosted deploys insecure.

Usually out of scope: invite spam without a technical exploit, attacks needing physical access to the victim's device.

Fixes land on `main`; older versions get no backports.

## Secrets

Every PR and push to `main` runs [Gitleaks](https://github.com/gitleaks/gitleaks) ([workflow](.github/workflows/secret-scan.yml), [config](.gitleaks.toml)). Also enable GitHub secret scanning and push protection under Settings, Code security.

Never commit `.env*.local`, `.firebaserc`, `*-service-account*.json` or real API keys.
