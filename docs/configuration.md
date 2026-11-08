# Configuration

Environment variables and config files. Step-by-step setup: [`self-hosting.md`](./self-hosting.md).

## Web app (`.env.local`)

Copy [`.env.example`](../.env.example) to `.env.local`. For emulator-only development use [`.env.emulator.example`](../.env.emulator.example) instead.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Yes | Fields of the Web App `firebaseConfig` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | The domain the app is served from, see [below](#authdomain-and-safariios) |
| `VITE_USE_FIREBASE_EMULATORS` | No | `true` connects Auth, Firestore and Storage to the emulators, see [`emulators.md`](./emulators.md). Ignored in production builds |

The app throws on start when a required variable is missing.

### `authDomain` and Safari/iOS

Use the serving domain (e.g. `your-project.web.app`), not the `firebaseapp.com` value the console suggests. A cross-origin `authDomain` breaks sign-in in storage-partitioned browsers (Safari/iOS, in-app browsers) with "missing initial state". Firebase Hosting already serves `/__/auth/*` on the serving domain. Then:

1. Google Cloud → **APIs & Services → Credentials** → OAuth Web client: add `https://<domain>/__/auth/handler` to redirect URIs and `https://<domain>` to JavaScript origins.
2. Firebase → **Authentication → Settings → Authorized domains**: list the domain.

## Firebase CLI (`.firebaserc`)

Copy [`.firebaserc.example`](../.firebaserc.example) and set your project ID, or run `firebase use --add <project-id>`. Not committed.
