# Self-hosting

Deploy your own instance on your own Firebase project. Variables: [`configuration.md`](./configuration.md). Architecture: [`architecture.md`](./architecture.md).

## Requirements

- A Firebase project on the **Blaze** plan: Cloud Storage on new projects and the scheduled reminder function (Cloud Scheduler) need it. Set a billing alert. A family-sized instance stays within the free quotas.
- Node.js 24 and the [Firebase CLI](https://firebase.google.com/docs/cli).

## 1. Firebase project

1. Create the project.
2. Enable **Authentication** with the Google provider only, **Firestore** (production mode), **Storage** and **Hosting**. Put Firestore and Storage in one region near your users, e.g. `europe-west1` like the function: neither location can change later.
3. **Project settings → Your apps → Web**: register an app and copy `firebaseConfig` into `.env.production.local`. Set `VITE_FIREBASE_AUTH_DOMAIN` to the serving domain (`your-project.web.app`), not `firebaseapp.com`, or sign-in breaks on Safari/iOS.
4. Optional, for reminders: **Project settings → Cloud Messaging → Web Push certificates**, generate a key pair and set `VITE_FIREBASE_VAPID_KEY`.
5. Give the default compute service account the roles the function needs. It builds and runs `sendReminders`, and new projects grant it none. The project number is in **Project settings → General**.

   ```bash
   SA=PROJECT_NUMBER-compute@developer.gserviceaccount.com
   for role in roles/cloudbuild.builds.builder roles/datastore.user roles/firebasecloudmessaging.admin; do
     gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member=serviceAccount:$SA --role=$role --condition=None
   done
   ```

   The first role lets Cloud Build build the function; the other two let it read calendars, drop stale tokens and send pushes.

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

The Storage rules check in Firestore who is in each calendar. On the first deploy the CLI asks to grant Storage access to Firestore for these cross-service rules; accept, or every photo upload is refused.

## 4. Post-deploy

1. **Authentication → Settings → Authorized domains:** add `YOUR_PROJECT.web.app` and any custom domain.
2. **Google Cloud → APIs & Services → Credentials:** on the OAuth Web client, add `https://<serving domain>` to JavaScript origins and `https://<serving domain>/__/auth/handler` to redirect URIs. On the browser key (`VITE_FIREBASE_API_KEY`), restrict HTTP referrers to `http://localhost:5173/*` and the serving domains.
3. Custom domain: **Hosting → Add custom domain**, then repeat steps 1 and 2 for it.

## Upgrading to 0.18.0

0.18.0 replaces the family space with sharing per calendar. An instance with data from before it needs its calendars copied before the deploy: the new app and rules no longer read `workspaces`.

1. Dry run: `npm run migrate:calendars -- --project <project id>`. It lists each family space with its people, tags and calendars, and the pending invites it will not copy.
2. Add `--confirm` to copy, then deploy straight away. Edits made in the old app between the two are lost.
3. Each person opens the app, which updates itself, and removes from each calendar whoever should not see it: the copies stay shared with everyone who was in the space.
4. Send the pending invites again, from each calendar's Share page.
5. Once all looks right, delete `workspaces` in the Firebase console. Photos stay where they are.

The script only copies and skips calendars already copied, so it can run again. Like the Excel import, it uses your Google credentials (`gcloud auth application-default login`), or the emulators with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and `--project demo-24`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails in production | Authorized domains; OAuth client origins and redirect URI |
| Login fails on Safari/iOS | `VITE_FIREBASE_AUTH_DOMAIN` is the serving domain |
| `Missing VITE_*` | `.env.production.local` complete before build |
| Functions deploy: `missing permission on the build service account` | The service account roles in [step 1.5](#1-firebase-project) |
| No reminders option in Settings | `VITE_FIREBASE_VAPID_KEY` set before the build |
| Reminders on but nothing arrives | It runs on Sundays, 1 November to 24 December, and skips people with nothing left; check the `sendReminders` logs. On iPhone the app must be installed on the home screen |
