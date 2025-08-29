# Helper Scripts

## Query Firestore; Cleanup Google Cloud Artifacts

- list all final orders
- list any pending orders not finalized
- cleanup google cloud artifacts

---

## Configuration

### Create Service Key File

> [!IMPORTANT]
> Verify key is not included in git commit!

> [!TIP]
> In instructions below, replace `<PROJECT_ID>` with your actual Firebase project ID.

#### Firebase

- Generate new private key from project settings service accounts: https://console.firebase.google.com/project/<PROJECT_ID>/settings/serviceaccounts/adminsdk
- Put in `scripts/keys` directory, rename to `firebase-service-key.json`

### Give artifact registry permissions

Replace `<PROJECT_ID>` and `<SERVICE_ACCOUNT_EMAIL>` with actual values.

```sh
gcloud projects add-iam-policy-binding <PROJECT_ID> --member="serviceAccount:<SERVICE_ACCOUNT_EMAIL>" --role="roles/artifactregistry.admin"
gcloud projects add-iam-policy-binding <PROJECT_ID> --member="serviceAccount:<SERVICE_ACCOUNT_EMAIL>" --role="roles/artifactregistry.reader"
```

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

### Cleanup google cloud artifacts

```sh
npm run cleanup-artifacts
```
