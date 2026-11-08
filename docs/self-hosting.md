# Self-hosting

Deploy your own instance on your own Firebase project. Variables: [`configuration.md`](./configuration.md). Architecture: [`architecture.md`](./architecture.md).

## Requirements

- A Firebase project on the **Blaze** plan: Cloud Storage on new projects and the scheduled reminder function (Cloud Scheduler) need it. Set a billing alert. A family-sized instance stays within the free quotas.
- Node.js 24 and the [Firebase CLI](https://firebase.google.com/docs/cli).

## 1. Firebase project

1. Create the project.
2. Enable **Authentication** (Google and Email link providers), **Firestore** (production mode, e.g. `europe-west1`), **Storage** and **Hosting**.
3. **Project settings → Your apps → Web**: register an app and copy `firebaseConfig` into `.env.production.local`. Set `VITE_FIREBASE_AUTH_DOMAIN` to the serving domain (`your-project.web.app`), not `firebaseapp.com`, or sign-in breaks on Safari/iOS.
4. Optional, for reminders: **Project settings → Cloud Messaging → Web Push certificates**, generate a key pair and set `VITE_FIREBASE_VAPID_KEY`.

## 2. Local setup

```bash
git clone https://github.com/Seven-Panda-Labs/24.git
cd 24
npm install && npm --prefix functions install
cp .env.example .env.production.local
cp .firebaserc.example .firebaserc
npx firebase login
npx firebase use --add YOUR_PROJECT_ID
```

`npm run build`, `preview` and `deploy` read `.env.production.local`. `npm run dev` reads `.env.development.local` instead: copy `.env.emulator.example` there to develop against the emulators ([`emulators.md`](./emulators.md)), or `.env.example` to develop against the real project (`localhost` is an authorized domain by default). See [`configuration.md`](./configuration.md).

## 3. Deploy

```bash
npm run deploy
```

Builds and deploys Hosting, Firestore rules and indexes, Storage rules and the `sendReminders` function (Gen 2, `europe-west1`; the CLI enables Cloud Scheduler and the other APIs it needs on the first deploy). Hosting only: `npm run deploy:hosting`.

The Storage rules check workspace membership in Firestore. On the first deploy the CLI asks to grant Storage access to Firestore for these cross-service rules; accept, or every photo upload is refused.

## 4. Post-deploy

1. **Authentication → Settings → Authorized domains:** add `YOUR_PROJECT.web.app` and any custom domain.
2. **Google Cloud → APIs & Services → Credentials:** on the OAuth Web client, add `https://<serving domain>` to JavaScript origins and `https://<serving domain>/__/auth/handler` to redirect URIs. On the browser key (`VITE_FIREBASE_API_KEY`), restrict HTTP referrers to `http://localhost:5173/*` and the serving domains.
3. Custom domain: **Hosting → Add custom domain**, then repeat steps 1 and 2 for it.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails in production | Authorized domains; OAuth client origins and redirect URI |
| Login fails on Safari/iOS | `VITE_FIREBASE_AUTH_DOMAIN` is the serving domain |
| `Missing VITE_*` | `.env.production.local` complete before build |
| No reminders option in Settings | `VITE_FIREBASE_VAPID_KEY` set before the build |
| Reminders on but nothing arrives | It runs on Sundays, 1 November to 24 December, and skips workspaces with nothing left; check the `sendReminders` logs. On iPhone the app must be installed on the home screen |
