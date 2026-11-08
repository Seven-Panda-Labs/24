# Self-hosting

Deploy your own instance on your own Firebase project. Variables: [`configuration.md`](./configuration.md). Architecture: [`architecture.md`](./architecture.md).

## Requirements

- A Firebase project. Cloud Storage on new projects needs the **Blaze** plan; set a billing alert. A family-sized instance stays within the free quotas.
- Node.js 24 and the [Firebase CLI](https://firebase.google.com/docs/cli).

## 1. Firebase project

1. Create the project.
2. Enable **Authentication** (Google and Email link providers), **Firestore** (production mode, e.g. `europe-west1`), **Storage** and **Hosting**.
3. **Project settings → Your apps → Web**: register an app and copy `firebaseConfig` into `.env.local`. Set `VITE_FIREBASE_AUTH_DOMAIN` to the serving domain (`your-project.web.app`), not `firebaseapp.com`, or sign-in breaks on Safari/iOS.

## 2. Local setup

```bash
git clone https://github.com/Seven-Panda-Labs/24.git
cd 24
npm install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
npx firebase login
npx firebase use --add YOUR_PROJECT_ID
```

`npm run dev` runs against the real project (`localhost` is an authorized domain by default). To work without it, see [`emulators.md`](./emulators.md).

## 3. Deploy

```bash
npm run deploy
```

Builds and deploys Hosting, Firestore rules and indexes, and Storage rules. Hosting only: `npm run deploy:hosting`.

## 4. Post-deploy

1. **Authentication → Settings → Authorized domains:** add `YOUR_PROJECT.web.app` and any custom domain.
2. **Google Cloud → APIs & Services → Credentials:** on the OAuth Web client, add `https://<serving domain>` to JavaScript origins and `https://<serving domain>/__/auth/handler` to redirect URIs. On the browser key (`VITE_FIREBASE_API_KEY`), restrict HTTP referrers to `http://localhost:5173/*` and the serving domains.
3. Custom domain: **Hosting → Add custom domain**, then repeat steps 1 and 2 for it.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails in production | Authorized domains; OAuth client origins and redirect URI |
| Login fails on Safari/iOS | `VITE_FIREBASE_AUTH_DOMAIN` is the serving domain |
| `Missing VITE_*` | `.env.local` complete before build |
