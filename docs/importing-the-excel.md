# Importing the Excel

`npm run import:excel` turns the original spreadsheet into calendars, one per year sheet, every day marked as wrapped. It runs once per person and skips years that person already has, so a second run writes nothing.

Keep the file in `private/`, which is gitignored. Never commit it.

## What it reads

| Excel | App |
|-------|-----|
| A sheet named after a year (`2024`) | A calendar for that year, starting 1 December |
| Row N, column A | Day N, the gift |
| Column C fill colour | The bag the gift goes in, as a tag: grey `CCCCCC` → Saco Cinza, yellow `FFE599` → Saco Amarelo, blue `4A86E8` → Saco Azul |
| A comment on column A | The day's notes |

Other sheets, empty rows and the `Em falta:` total are ignored. The colours are bags, not gift categories: they alternate grey, yellow, blue by day so neighbouring gifts look different. The mapping is `BAG_TAGS` in [`scripts/excel.ts`](../scripts/excel.ts). The script creates the three bag tags in the workspace when they are missing and leaves existing ones alone, so renaming them in the app is safe.

Comments exported by Google Sheets have no rich-text runs, and exceljs reads them as empty. The script lists those days so you can copy the notes by hand.

## Run it

Dry run first: without `--confirm` it only prints what it would write.

```bash
npm run import:excel -- --file "private/Calendario de Natal.xlsx" --person "Ana" --email <Google account> --project <project id>
```

Add `--confirm` to write. `--email` is the Google account the calendars go to: it must have signed in to the app once. The calendars are only that account's until it shares them in the app. Each one gets the default tags, in Portuguese, and the bags it uses.

**Against the emulators:** `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and `--project demo-24`.

**Against the real project:** the script uses the Admin SDK with your Google credentials, so run `gcloud auth application-default login` once with an account that owns the project.
