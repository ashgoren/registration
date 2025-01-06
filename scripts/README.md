# Helper Scripts

## Query Firestore & Google Sheets; Cleanup Google Cloud Artifacts

- list all orders
- list any pending orders not finalized
- list any emails present in database but missing from spreadsheet
- list any duplicate emails in spreadsheet
- cleanup google cloud artifacts

---

## Configuration

### Create Service Key Files

> [!IMPORTANT]
> Verify keys are not included in git commit!

> [!TIP]
> In instructions below, replace `<PROJECT_ID>` with your actual Firebase project ID.

#### Firebase

- Generate new private key from project settings service accounts: https://console.firebase.google.com/project/<PROJECT_ID>/settings/serviceaccounts/adminsdk
- Put in `scripts/keys` directory, rename to `firebase-service-key.json`

#### Google Sheets

- In `scripts/keys` directory:

```sh
gcloud iam service-accounts keys create sheets-service-key.json --iam-account sheets@<PROJECT_ID>.iam.gserviceaccount.com
```

### Configure Environment Variables

- Fill in `SCRIPTS_SHEET_ID` in `/.env`
  - ID of Google Sheet to query, from spreadsheet URL between `/d/` and `/edit`
  - This is the same as `SHEETS_SHEET_ID` in `functions/.env`.

- Fill in `SCRIPTS_TEST_DOMAINS` in `/.env`
  - comma-separated list of test domains to ignore when listing emails in these scripts
  - e.g. `example.com,test.com`

---

## Usage

> [!NOTE]
> By default these scripts ignore emails listed as test domains in `.env`. To include them, use the `--all`/`--include-test-emails` flag.


### List all completed orders (or pending, with flag)

```sh
npm run orders -- [--pending] [--include-test-emails]
```

### List any pending orders not finalized

```sh
npm run missing -- [--include-test-emails]
```

### List any emails missing from spreadsheeet, as well as duplicate emails

```sh
npm run spreadsheet -- [--include-test-emails]
```

### Cleanup google cloud artifacts

```sh
npm run cleanup-artifacts
```
