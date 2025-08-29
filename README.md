# Registration site

Simple registration / admissions sales site for contra dance events.

- Front-end: Vite + React + Material-UI
- Hosting: Firebase Hosting
- Database: Firebase Firestore
- Serverless functions: Firebase Functions
- Logging: Papertrail & Google Cloud Logging
- Secrets management: Doppler & Google Cloud Secret Manager
- Address autocomplete: Google Places API
- Email: Amazon SES
- Payment: Stripe or PayPal

# Configuration

## Required accounts and command-line tools:

> [!IMPORTANT]
> Run commands from a Unix-compatible CLI, e.g. `Terminal` on Mac or [Git Bash](https://git-scm.com/downloads) on Windows.

- Account: [GitHub](https://github.com/)
- Account: [Firebase](https://firebase.google.com/)
- Account: [Doppler](https://www.doppler.com/)
- Account: [Amazon SES](https://aws.amazon.com/ses/)
- Account: [Papertrail](https://papertrailapp.com/)
- Account: [Stripe](https://stripe.com/) or [PayPal](https://www.paypal.com/)

- Install: [Node](https://nodejs.org/)

- Install: [GitHub CLI](https://cli.github.com/)
  - Login to GitHub CLI: `gh auth login`

- Install: [Firebase CLI](https://firebase.google.com/docs/cli)
  - Login to the Firebase CLI: `firebase login`

- Install: [Doppler CLI](https://www.doppler.com/docs/cli)
  - Login to the Doppler CLI: `doppler login`

- Install: [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk)
  - Login to the Google Cloud CLI: `gcloud auth login`

- Install: [Stripe CLI](https://stripe.com/docs/stripe-cli) (if applicable)
  - Login to the Stripe CLI: `stripe login`

---

## Copy template project

Fork [template](https://github.com/ashgoren/registration) and clone to a local directory:

```sh
# Replace [NAME] with desired project/directory name for new project
gh repo fork ashgoren/registration [NAME] --clone
cd [NAME]
```

> [!NOTE]
> If you previously forked this for another instance, it won't be possible to fork again. Instead, duplicate existing local project and create a new repo:
> ```sh
> cp -R [SOURCE_DIR] [DESTINATION_DIR]
> cd [DESTINATION_DIR]
> git remote rm origin
> gh repo create [NAME] [--public|private] --source=. --remote=origin
> ```
> If copying template over an existing project, maintain the .git directory from the existing project to preserve commit history.

---

## Erase settings from old project:

```sh
bash clear-old-settings.sh
```

# Erase firebase functions from old project:
```sh
firebase functions:list
firebase functions:delete <FUNCTION_NAME> --force
```

# Erase Firestore database from old project:

- To avoid deleting data, could rename collections instead of deleting them.

---

## Set configuration options:

- Update `index.html` with site `title` and `meta` properties (e.g. description and [og:image](https://ogp.me/))
- Update favicon - use a generator, e.g. [favicon-generator](https://www.favicon-generator.org)
- Copy desired logo to `public/logo.png` and set to desired height (likely <= 80px)
- Update values in `config` folder files
- Update email receipt templates in `templates` folder

---

## Create a Firebase project, which will also create a Google Cloud project with the same PROJECT_ID:

```sh
# Replace <PROJECT_ID> with desired project ID
firebase projects:create <PROJECT_ID>
```

> [!TIP]
> In all instructions below, replace `<PROJECT_ID>` with the actual project ID created in the previous step.

> [!IMPORTANT]
> Make sure to set the region for the new project immediately, likely to us-west1 or us-central1 (by creating firestore db?)

---

## Enable billing on Google Cloud account

- Create a new billing account if necessary from the [Google Cloud console](https://console.cloud.google.com/billing)
- Unlikely to owe any money for small scale use, but set a billing alert to be safe (see below).
- Setup [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
  - user type: internal
  - values for other fields don't matter
  - not necessary to add any scopes

---

## Link new project to Google Cloud billing account:

```sh
gcloud billing accounts list
gcloud billing projects link <PROJECT_ID> --billing-account <BILLING_ACCOUNT_ID>
```

---

## Set billing alert, enable failsafe shutdown of APIs if exceeded

> [!WARNING]
> This is an emergency failsafe to shutdown everything in case of wildly unexpected charges.
> Actual shutoff point can be changed in budget-cutoff.js but defaults to $10.

```sh
gcloud pubsub topics create budget-alerts --project <PROJECT_ID>
gcloud beta billing budgets create --billing-account=BILLING_ACCOUNT_ID --display-name="PROJECT_ID Shutdown Budget" --budget-amount=100USD --project=PROJECT_ID --threshold-rule=percent=.01,basis=CURRENT_SPEND --threshold-rule=percent=.1,basis=CURRENT_SPEND --threshold-rule=percent=.5,basis=CURRENT_SPEND --threshold-rule=percent=1,basis=CURRENT_SPEND --all-updates-rule-pubsub-topic="projects/PROJECT_ID/topics/budget-alerts"
```

---

## Secrets management

- Create Doppler front-end and back-end projects:

```sh
doppler projects create <PROJECT_ID>-frontend
doppler projects create <PROJECT_ID>-backend
```

- Create Doppler tokens and save to GitHub secrets:

```sh
echo $(doppler configs tokens create --project <PROJECT_ID>-frontend --config stg github-stg-token --plain) | gh secret set DOPPLER_TOKEN_STG
echo $(doppler configs tokens create --project <PROJECT_ID>-frontend --config prd github-prd-token --plain) | gh secret set DOPPLER_TOKEN_PRD
```

- Set Sandbox Mode:

```sh
doppler-set -p <PROJECT_ID> -t backend --dev --stg SANDBOX_MODE "true"
doppler-set -p <PROJECT_ID> -t backend --prd SANDBOX_MODE "false"
```

> [!NOTE]
> Replace all references to `doppler-set` below with actual path to script (from project root `./scripts/doppler-set.js`)

### Create Eventarc trigger for when secret is updated to trigger cleanup

- Determine default compute service account email:
```sh
gcloud iam service-accounts list --project contra-testing | grep compute
```

```sh
gcloud eventarc triggers create secret-version-trigger \
    --location=global \
    --destination-run-service=onsecretversion \
    --destination-run-region=<REGION> \
    --event-filters="type=google.cloud.audit.log.v1.written" \
    --event-filters="serviceName=secretmanager.googleapis.com" \
    --event-filters="methodName=google.cloud.secretmanager.v1.SecretManagerService.AddSecretVersion" \
    --event-data-content-type="application/json" \
    --service-account=<SERVICE_ACCOUNT_EMAIL> \
    --project=<PROJECT_ID>
```

### Setup Doppler -> GCP Secret Manager integration

```sh
gcloud iam service-accounts create doppler-secret-manager --display-name="Doppler Secret Manager" --project contra-testing
gcloud projects add-iam-policy-binding contra-testing --member="serviceAccount:doppler-secret-manager@contra-testing.iam.gserviceaccount.com" --role="roles/secretmanager.admin"
gcloud iam service-accounts keys create tmp.json --iam-account="doppler-secret-manager@contra-testing.iam.gserviceaccount.com"
cat tmp.json && rm tmp.json
```

Create a GCP Secret Manager integration from Doppler console:
- Paste entire contents of service account key file (tmp.json) into "Service Account Key" field.
- Select Single-Secret sync strategy and name it `backend`.
- Sync config `stg` for now; will remove & re-add integration with `prd` when ready to launch.

---

## Create Firebase web app and add config to Doppler

- From [Firebase console](https://console.firebase.google.com/), select your project, click "Add app" and choose the web (`</>`) option.
- Get Firebase web app config values by running the following command in the project directory:
  ```sh
  firebase apps:sdkconfig web
  ```
- Save the Firebase web app config values to Doppler:
```sh
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_PROJECT_ID "<value>"
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_APP_ID "<value>"
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_STORAGE_BUCKET "<value>"
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_API_KEY "<value>"
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_AUTH_DOMAIN "<value>"
doppler-set -p <PROJECT_ID> -t frontend VITE_FIREBASE_MESSAGING_SENDER_ID "<value>"
```

---

## Set functions region in Doppler for frontend and in `functions/config.js` for backend

```sh
doppler-set -p <PROJECT_ID> -t frontend VITE_FUNCTIONS_REGION <REGION>
```

---

## Setup database

> [!IMPORTANT]
> Make sure to set the region for the new project immediately, likely to us-west1 or us-central1 (before deploying db?)

- Create Firestore database: https://console.firebase.google.com/project/<PROJECT_ID>/firestore
- Deploy Firestore database: `firebase deploy --only firestore`

---

## Setup Stripe or PayPal:

For both Stripe and PayPal, use test / sandbox mode keys until ready to launch.

### Stripe configuration

- On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
- Apple Pay: requires stripe domain auth

- Set the test & live mode publishable & secret keys in Doppler:
```sh
doppler-set -p <PROJECT_ID> -t frontend --dev --stg VITE_STRIPE_PUBLISHABLE_KEY "<test_stripe_publishable_key_value>"
doppler-set -p <PROJECT_ID> -t backend --dev --stg STRIPE_SECRET_KEY "<test_stripe_secret_key_value>"
doppler-set -p <PROJECT_ID> -t frontend --prd VITE_STRIPE_PUBLISHABLE_KEY "<live_stripe_publishable_key_value>"
doppler-set -p <PROJECT_ID> -t backend --prd STRIPE_SECRET_KEY "<live_stripe_secret_key_value>"
```

### PayPal configuration

> [!TIP]
> Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.

- Set the test & live mode client id & client secret in Doppler:
```sh
doppler-set -p <PROJECT_ID> -t frontend --dev --stg VITE_PAYPAL_CLIENT_ID "<test_mode_value>"
doppler-set -p <PROJECT_ID> -t backend --dev --stg PAYPAL_CLIENT_ID "<test_mode_value>"
doppler-set -p <PROJECT_ID> -t backend --dev --stg PAYPAL_CLIENT_SECRET "<test_mode_value>"
doppler-set -p <PROJECT_ID> -t frontend --prd VITE_PAYPAL_CLIENT_ID "<live_mode_value>"
doppler-set -p <PROJECT_ID> -t backend --prd PAYPAL_CLIENT_ID "<live_mode_value>"
doppler-set -p <PROJECT_ID> -t backend --prd PAYPAL_CLIENT_SECRET "<live_mode_value>"
```

---

## Setup Payment Webhook:

Setup webhooks in PayPal Developer Dashboard or Stripe Dashboard to receive notifications of payment events.

> [!IMPORTANT]
> If you want to use this in Sandbox mode, you'll need 3 different webhooks.
>
> 1st webhook (sandbox payments) - goes to local tunnel (for dev)
> 2nd webhook (sandbox payments) - goes to firebase function (for staging)
> 3rd webhook (live payments) - goes to firebase function (for prod)

### For PayPal:

1. In the PayPal Developer Dashboard, navigate to **My Apps & Credentials**.
2. Select your app and scroll down to the **Webhooks** section.
3. Click **Add Webhook** and enter your webhook URL.
    - For local testing, use localtunnel (`lt -p 5001 -s <PROJECT_ID>`) to create a local tunnel, then use URL like this: `https://<localtunnel-url>/<PROJECT_ID>/<REGION>/paypalWebhook`
    - For production, use the URL of your Firebase function: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/paypalWebhook`
4. Select only the **payment capture completed** event.
5. Click **Save**.
6. Set Webhook IDs generated by PayPal in Doppler:

```sh
doppler-set -p <PROJECT_ID> -t backend --dev PAYPAL_WEBHOOK_ID "<local_sandbox>"
doppler-set -p <PROJECT_ID> -t backend --stg PAYPAL_WEBHOOK_ID "<deployed_sandbox>"
doppler-set -p <PROJECT_ID> -t backend --prd PAYPAL_WEBHOOK_ID "<deployed_live>"
```

### For Stripe:

1. Create Stripe webhook endpoints from the command line using the Stripe CLI or from the Stripe Dashboard.

To create a sandbox mode webhook endpoint for use in staging, run the following command:
```sh
stripe webhook_endpoints create --url https://<REGION>-<PROJECT_ID>.cloudfunctions.net/stripeWebhook --enabled-events payment_intent.succeeded
```

To create a temporary test webhook endpoint for use in dev, run the following command:
```sh
stripe listen --events payment_intent.succeeded --forward-to localhost:5001/<PROJECT_ID>/<REGION>/stripeWebhook
```

2. Set Webhook Secrets generated by Stripe in Doppler:

```sh
doppler-set -p <PROJECT_ID> -t backend --dev STRIPE_WEBHOOK_SECRET "<local_sandbox>"
doppler-set -p <PROJECT_ID> -t backend --stg STRIPE_WEBHOOK_SECRET "<deployed_sandbox>"
doppler-set -p <PROJECT_ID> -t backend --prd STRIPE_WEBHOOK_SECRET "<deployed_live>"
```

---

## If collecting addresses, setup Google Places API for address autocomplete

Enable the google maps javascript API _and_ the *new* google places API. 

```sh
gcloud services enable places.googleapis.com maps-backend.googleapis.com --project <PROJECT_ID>
gcloud services api-keys create \
  --display-name="Places and Maps API Key" \
  --allowed-referrers="localhost:3000/*,<PROJECT_ID>.web.app/*,example.com/*,www.example.com/*" \
  --api-target=service=places.googleapis.com \
  --api-target=service=maps-backend.googleapis.com \
  --project <PROJECT_ID>

```

- Save the `keyString` value to Doppler:
```sh
doppler-set -p <PROJECT_ID> -t frontend VITE_GOOGLE_PLACES_API_KEY "<value>"
```

---

## Enable Papertrail for client-side logging (routed through firebase function)

- Create log destination on [papertrail](https://papertrailapp.com/account/destinations)

```sh
doppler-set -p <PROJECT_ID> -t backend PAPERTRAIL_TOKEN "<value>"
```

---

## Setup Google Sheets integration:

Setup spreadsheet for recording orders:

- Make a copy of the [template spreadsheet](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/edit?usp=sharing).
- Update fields/columns as needed in spreadsheet _and_ in `functions/shared/fields.js`.

Enable Sheets API, create Google Cloud service account, update values in Doppler:

```sh
gcloud services enable sheets.googleapis.com --project <PROJECT_ID>
gcloud iam service-accounts create sheets --project <PROJECT_ID>
gcloud iam service-accounts keys create tmp.json --iam-account sheets@<PROJECT_ID>.iam.gserviceaccount.com
cat tmp.json && rm tmp.json
```

- Set Doppler values:

```sh
doppler-set -p <PROJECT_ID> -t backend SHEETS_SHEET_ID "<spreadsheet_id>" # long string of characters in URL, likely between `/d/` and `/edit`
doppler-set -p <PROJECT_ID> -t backend SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL "<client_email>"
doppler-set -p <PROJECT_ID> -t backend SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY "<private_key>"
```

> [!IMPORTANT]
> SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY may not paste correctly; may have to use Doppler console to enter it.

- Give spreadsheet edit permissions to the `client_email` address from above output.

---

## Setup Email Confirmation:

Create an Amazon SES API key, update values in Doppler backend:

```sh
doppler-set -p <PROJECT_ID> -t backend EMAIL_ENDPOINT "<value>" # (from amazonses SMTP settings)
doppler-set -p <PROJECT_ID> -t backend EMAIL_USER "<value>" # (from amazonses SMTP settings)
doppler-set -p <PROJECT_ID> -t backend EMAIL_PASSWORD "<value>" # (from amazonses SMTP settings)
doppler-set -p <PROJECT_ID> -t backend EMAIL_FROM "<value>"
doppler-set -p <PROJECT_ID> -t backend EMAIL_REPLY_TO "<value>" # (if needed)
doppler-set -p <PROJECT_ID> -t backend EMAIL_IGNORE_TEST_DOMAINS "<value>" # (comma-separated list of test domains to ignore for receipts etc)
doppler-set -p <PROJECT_ID> -t backend EMAIL_NOTIFY_TO "<value>" # admin email for notifications
```

---

## Deploy Firebase Functions:

### Deploy functions

```sh
npm install --prefix functions
firebase deploy --only functions
```

### Configure Cleanup Policy (run after initial deploy)

```sh
gcloud artifacts repositories set-cleanup-policies gcf-artifacts --policy cleanup-policy.json --location=<REGION> --project <PROJECT_ID>
```

---

## Add error logging for Firebase functions:

> [!WARNING]  
> In April 2026, Google plans to begin charging $1.50/month for each alert condition, though they're currently running a promotion to provide $300 in logging credits. Be sure to monitor your usage and set up billing alerts.

Setup logs for Firebase functions to notify on error:

- Go to [Google Cloud Logging](https://console.cloud.google.com/logs/query).
- If you don't see a query box, click "Show query" in the top right.
- Run the following query:
  ```
  resource.type="cloud_run_revision" severity="ERROR"
  ```
- Click on "Create log alert" from the Actions dropdown.
- Configure the alert as desired. For example:
  - Set alert name as desired.
  - Set policy severity level to Error.
  - Click Next 3 times.
  - Set notification channel to Email.
  - Click Save.

- Do the same for this query:
  ```
  resource.type="cloud_run_revision" textPayload:"Your function timed out after"
  ```

---

## Configure Firebase Hosting

#### Add Firebase Service Account as GitHub Secret:

```sh
# answer no to questions, as this is already configured
firebase init hosting:github
rm .github/workflows/firebase-hosting-pull-request.yml
```

- Set `firebaseServiceAccount` value in `.github/workflows/firebase-hosting-merge.yml` GitHub workflow to name of that GitHub secret.

#### Add Firebase Hosting staging channel:

```sh
firebase hosting:channel:create staging
```

#### Add custom domains for Firebase Hosting:

- In Firebase Console add custom domains for both live and staging. (e.g. example.com and staging.example.com)

---

# Development 

First time setup:
```sh
npm install
```

Usage in development:
```sh
npm run emulator # optional (to use emulators for serverless functions)
npm run dev
```

---

# Deployment via GitHub workflow and Firebase hosting

- Ensure `firebaseServiceAccount` is updated in `.github/workflows/firebase-hosting-merge.yml`
- If update Doppler stg/prd secrets, must redeploy

---

# When switching to live mode

- Ensure that Doppler prd config has live mode values for these:
  - frontend: `VITE_STRIPE_PUBLISHABLE_KEY`
  - frontend: `VITE_PAYPAL_CLIENT_ID`
  - backend: `SANDBOX_MODE`
  - backend: `STRIPE_SECRET_KEY`
  - backend: `STRIPE_WEBHOOK_SECRET`
  - backend: `PAYPAL_CLIENT_ID`
  - backend: `PAYPAL_CLIENT_SECRET`
  - backend: `PAYPAL_WEBHOOK_ID`
- Doppler -> GCP-Secret-Manager integration: replace stg sync with prd sync
- Set `SANDBOX_MODE` to false in `configBasics.jsx`
- Make registration link live on homepage & navbar
- Redeploy: front-end, back-end, firebase functions with `--force`
- Clear Spreadsheet
- Clear Firestore DB

# Disable APIs when project is in hibernation
- gcloud services disable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com mapsjs.googleapis.com --project <PROJECT_ID>

# Enable APIs when project is active again
- gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com mapsjs.googleapis.com --project <PROJECT_ID>

---

# Helper scripts

- Set `SCRIPTS_TEST_DOMAINS` (comma-separated list of test domains to ignore when listing emails):

```sh
doppler-set -p <PROJECT_ID> -t frontend SCRIPTS_TEST_DOMAINS "example.com,test.com"
```

- Generate and save a random uuid as `CLOUD_FUNCTIONS_TRIGGER_TOKEN` in Doppler:

```sh
uuidgen
doppler-set -p <PROJECT_ID> -t frontend CLOUD_FUNCTIONS_TRIGGER_TOKEN "<uuid_from_above>"
doppler-set -p <PROJECT_ID> -t backend CLOUD_FUNCTIONS_TRIGGER_TOKEN "<uuid_from_above>"
```

See `scripts/README.md` for details on scripts to query Firestore and Google Sheets.
