# Helper Scripts

## Start Firebase emulators
Run local Firebase emulators for functions, firestore, auth, and hosting: `npm run emulators`

## Start Firebase functions shell
Execute emulated Firebase functions from local shell: `npm run functions-shell`

---

## Enable/Disable APIs
Enable or disable Google Cloud APIs for project: `npm run enable-apis <PROJECDT_ID>` / `npm run disable-apis <PROJECT_ID>`

---

## Match Payments - verifies matching Firestore <-> payment processor transactions
```sh
npm run matchPayments-stg
npm run matchPayments-prd
```

---

## Query Firestore Orders - list all completed/pending orders

#### Configuration

> [!IMPORTANT]
> - You must create a Firebase service account key and place it in `scripts/keys/firebase-service-key.json`.
> - Verify key is not included in git commit!

- Generate new private key from project settings service accounts: https://console.firebase.google.com/project/<PROJECT_ID>/settings/serviceaccounts/adminsdk
- Put in `scripts/keys` directory, rename to `firebase-service-key.json`

#### Usage

This script will connect to Firestore and:
- list all final orders
- list any pending orders not finalized

> [!NOTE]
> By default the orders script ignores emails listed in `SCRIPTS_TEST_DOMAINS`. To include them, use the `--all`/`--include-test-emails` flag.

```sh
npm run orders-stg -- [--pending] [--include-test-emails]
npm run orders-prd -- [--pending] [--include-test-emails]
```
