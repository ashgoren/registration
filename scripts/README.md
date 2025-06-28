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
gcloud projects add-iam-policy-binding <PROJECT_ID> --member="serviceAccount:<SERVICE_ACCOUNT_EMAIL>" --role="roles/artifactregistry.admin"

### Configure Environment Variables

- Fill in `SCRIPTS_TEST_DOMAINS` in `/.env.config.js`
  - comma-separated list of test domains to ignore when listing emails in these scripts
  - e.g. `example.com,test.com`

- Generate a random uuid and save as `CLOUD_FUNCTIONS_TRIGGER_TOKEN` in both `.env.config.js` and `functions/.env`

---

## Usage

> [!NOTE]
> By default the orders script ignores emails listed as test domains in `.env.config.js`. To include them, use the `--all`/`--include-test-emails` flag.


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
