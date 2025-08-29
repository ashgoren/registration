# Helper Scripts

### Query Firestore

- list all final orders
- list any pending orders not finalized

### Match Payments

- checks that there are no electronic payments missing from the database

### Doppler set

- helper to set Doppler secrets

---

## Configuration

### Create Firebase Service Key File

> [!IMPORTANT]
> Verify key is not included in git commit!

> [!TIP]
> In instructions below, replace `<PROJECT_ID>` with your actual Firebase project ID.

- Generate new private key from project settings service accounts: https://console.firebase.google.com/project/<PROJECT_ID>/settings/serviceaccounts/adminsdk
- Put in `scripts/keys` directory, rename to `firebase-service-key.json`

---

## Usage

> [!NOTE]
> By default the orders script ignores emails listed in `SCRIPTS_TEST_DOMAINS`. To include them, use the `--all`/`--include-test-emails` flag.

### List all completed orders (or pending, with flag)

```sh
npm run orders -- [--pending] [--include-test-emails]
```

### Check that there are no electronic payments missing from the database

```sh
npm run matchPayments
```

### Doppler set secrets

Helper script to set Doppler secrets on one or more environments.
If no environment is specified, it sets the secret on all 3 environments.

```sh
doppler-set -p <PROJECT_ID> -t <frontend|backend> [--dev|stg|prd] <KEY> <value>
```
