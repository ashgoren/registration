# Registration site

Simple registration / admissions sales site for contra dance events.

- Front-end: Vite + React + Material-UI
- Hosting: Firebase Hosting
- Database: Firebase Firestore
- Serverless functions: Firebase Functions
- App Check: Cloudflare Turnstile + Firebase App Check
- Logging: Papertrail & Google Cloud Logging
- Address autocomplete: Google Places API
- Email: Sendgrid
- Payment: Stripe or PayPal

# Configuration

## Required accounts and command-line tools:

> [!IMPORTANT]
> Run commands from a Unix-compatible CLI, e.g. `Terminal` on Mac or [Git Bash](https://git-scm.com/downloads) on Windows.

- Account: [GitHub](https://github.com/)
- Account: [Firebase](https://firebase.google.com/)
- Account: [Sendgrid](https://sendgrid.com/)
- Account: [Papertrail](https://papertrailapp.com/)
- Account: [Stripe](https://stripe.com/) or [PayPal](https://www.paypal.com/)

- Install: [Node](https://nodejs.org/)

- Install: [GitHub CLI](https://cli.github.com/)
  - Login to GitHub CLI: `gh auth login`

- Install: [Firebase CLI](https://firebase.google.com/docs/cli)
  - Login to the Firebase CLI: `firebase login`

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

---

## Erase settings from old project:

```sh
bash clear-old-settings.sh
```

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
gcloud beta billing budgets create --billing-account=BILLING_ACCOUNT_ID --display-name="PROJECT_ID Shutdown Budget" --budget-amount=100USD --project=PROJECT_ID --threshold-rule=percent=.01,basis=CURRENT_SPEND --threshold-rule=percent=.1,basis=CURRENT_SPEND --threshold-rule=percent=.5,basis=CURRENT_SPEND --threshold-rule=percent=1,basis=CURRENT_SPEND--all-updates-rule-pubsub-topic="projects/PROJECT_ID/topics/budget-alerts"
```

---

## Create Firebase web app and add config to `.env.config.js`

- From [Firebase console](https://console.firebase.google.com/), select your project, click "Add app" and choose the web (`</>`) option.
- Get Firebase web app config values by running the following command in the project directory:
  ```sh
  firebase apps:sdkconfig web
  ```
- Fill in `.env.config.js` file with values from the output of the previous command.

---

## Setup database

- Create Firestore database: https://console.firebase.google.com/project/<PROJECT_ID>/firestore
- Deploy Firestore database: `firebase deploy --only firestore`

---

## Setup Stripe or PayPal:

For both Stripe and PayPal, use test / sandbox mode keys until ready to launch.

Stripe configuration:
- On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
- Apple Pay: requires stripe domain auth
- Copy the test mode `publishable key` to the `.env.config.js` file. (Use test key until ready to launch.)
- set Stripe sandbox mode secret key in `functions/.env`
- set Stripe produciton mode secret key in `functions/.env.<PROJECT_ID>`
- set Stripe statement_descriptor_suffix in `functions/.env` (optional)

PayPal configuration:
- Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.
- Copy the sandbox mode `client ID` to `.env.config.js` and to `functions/.env`
- Copy the sandbox mode `secret` to `functions/.env`
- Copy the production mode `client ID` and `secret` to `functions/.env.<PROEJCT_ID>`

---

## Setup Payment Webhook:

Setup webhooks in PayPal Developer Dashboard or Stripe Dashboard to receive notifications of payment events.

> [!IMPORTANT]
> If you want to use this in Sandbox mode, you'll need to create webhooks for both live and sandbox modes
> and use ngrok or similar to create tunnel to your local server for testing.

### For PayPal:

1. In the PayPal Developer Dashboard, navigate to **My Apps & Credentials**.
2. Select your app and scroll down to the **Webhooks** section.
3. Click **Add Webhook** and enter your webhook URL.
    - For local testing, use localtunnel (`lt -p 5001 -s <PROJECT_ID>`) to create a local tunnel, then use URL like this: `https://<localtunnel-url>/<PROJECT_ID>/<REGION>/paypalWebhook`
    - For production, use the URL of your Firebase function: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/paypalWebhook`
4. Select only the **payment capture completed** event.
5. Click **Save**.
6. Copy the webhook ID's generated by PayPal into `functions/.env.local` and `functions/.env.<PROJECT_ID>` as appropriate.

### For Stripe:

1. Create Stripe webhook endpoints from the command line using the Stripe CLI or from the Stripe Dashboard.

To create a production webhook endpoint using the Stripe CLI, run the following command:
```sh
stripe webhook_endpoints create --url https://<REGION>-<PROJECT_ID>.cloudfunctions.net/stripeWebhook --enabled-events payment_intent.succeeded
```

To create a temporary test webhook endpoint using the Stripe CLI, run the following command:
```sh
stripe listen --events payment_intent.succeeded --forward-to localhost:5001/<PROJECT_ID>/<REGION>/stripeWebhook
```

2. Copy the webhook secrets generated by Stripe into `functions/.env,loca` and `functions/.env.<PROJECT_ID>` as appropiate.

---

## If collecting addresses, setup Google Places API for address autocomplete

- Update allowed-referrers list in `google-places-api-flags.yaml` file.

Enable the google maps javascript API _and_ the *new* google places API. (Theoretically can use gcloud services enable via CLI, but may actually need to do from google cloud console.)

```sh
gcloud services enable places.googleapis.com --project <PROJECT_ID>
gcloud services enable mapsjs.googleapis.com --project <PROJECT_ID>
gcloud services api-keys create --flags-file=google-places-api-flags.yaml --project <PROJECT_ID>
```

- Copy `keyString` value to `GOOGLE_PLACES_API_KEY` in `.env.config.js`.

---

## Setup Firebase App Check

- Setup [Cloudflare Turnstile](https://firebase.google.com/docs/app-check/turnstile)
  - Add hostname (and localhost for testing)
  - Invisible mode
  - copy `siteKey` value to `TURNSTILE_SITE_KEY` in `.env.config.js`

- Install [Cloudflare Turnstile App Check Provider extension](https://extensions.dev/extensions/cloudflare/cloudflare-turnstile-app-check-provider)
  - get App ID (different from project id) from .env.config.js or from firebase console
  - TTL 60 minutes is fine

- Install the client package for turnstile firebase app check: `npm i @cloudflare/turnstile-firebase-app-check`

- Get the URL of the newly created Firebase function and copy it to `TURNSTILE_FUNCTION_URL` in `.env.config.js`.

- In Google Cloud IAM, click "Grant access" and give the ext-cloudflare-turnstile service account the "Service Account Token Creator" role.

- Enable Firebase App Check: https://console.firebase.google.com/project/<PROJECT_ID>/appcheck/apps
  - just using this for debug token for dev, so can put dummy value for recaptcha site key?
  - generate debug token for use in development mode:
    - click 3 dots, Manage debug token, Add debug token, Generate token, give it whatever name you want
    - copy the token value and add it to `.env.config.js` as `APPCHECK_DEBUG_TOKEN`

---

## Enable Papertrail for client-side logging (routed through firebase function)

- Create log destination on [papertrail](https://papertrailapp.com/account/destinations)
- Copy token value to `PAPERTRAIL_TOKEN` in `functions/.env`

---

## Setup Google Sheets integration:

Setup spreadsheet for recording orders:

- Make a copy of the [template spreadsheet](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/edit?usp=sharing).
- Update fields/columns as needed in spreadsheet _and_ in `functions/shared/fields.js`.

Enable Sheets API, create Google Cloud service account, update values in `functions/.env`:

```sh
gcloud services enable sheets.googleapis.com --project <PROJECT_ID>
gcloud iam service-accounts create sheets --project <PROJECT_ID>
gcloud iam service-accounts keys create tmp.json --iam-account sheets@<PROJECT_ID>.iam.gserviceaccount.com
cat tmp.json
rm tmp.json
```

- Copy `client_email` from above output into `functions/.env` as `SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL`
- Copy `private_key` from above output into `functions/.env` as `SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY`
- Give spreadsheet edit permissions to the `client_email` address from above output
- Copy spreadsheet ID (the long string of characters in URL, likely between `/d/` and `/edit`) into `functions/.env` as `SHEETS_SHEET_ID`


---

## Setup Email Confirmation:

Create a Sendgrid API key, update values in `functions/.env`:

- `EMAIL_SENDGRID_API_KEY`
- `EMAIL_FROM`
- `EMAIL_SUBJECT`
- `EMAIL_REPLY_TO` (if needed)

---

## Deploy Firebase Functions:

```sh
cd functions && npm install && cd ..
firebase deploy --only functions
```

> [!WARNING]  
> If Firebase fails to clean up build images, it will warn about possible charges. To avoid being charged, follow the provided link and delete any leftover artifacts.

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

## Generate `.env` file for dev and VITE_CONFIG on GitHub for prod:

These are used by GitHub Actions to deploy to Firebase.

```sh
npm run generate-env
```

---

## Add Firebase Service Account as GitHub Secret:

```sh
# answer no to questions, as this is already configured
firebase init hosting:github
rm .github/workflows/firebase-hosting-pull-request.yml
```

- Set `firebaseServiceAccount` value in `.github/workflows/firebase-hosting-merge.yml` GitHub workflow to name of that GitHub secret.

---

# Development 

Ensure root directory `.env` is generated after any updates to `.env.config.js`, then:

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

- Ensure `VITE_CONFIG` is updated on repo [secrets](https://github.com/[GITHUB_USER]/[GITHUB_REPO]/settings/secrets/actions)
- Ensure `firebaseServiceAccount` is updated in `.github/workflows/firebase-hosting-merge.yml`
- If update Github secrets, must redeploy

---

# When switching to live mode

- Set sandbox mode to false in `configBasics.jsx` and `functions/.env.<PROJECT_ID>`
- Disable `enforceAppCheck` in `functions/index.js` if needed
- Regenerate client-side `.env` and update GitHub `VITE_CONFIG` by running `npm run generate-env`
- Redeploy Firebase Functions with `--force`
- Make registration link live on homepage & navbar
- Clear spreadsheet
- Clear Firestore DB

# Disable APIs when project is in hibernation
- gcloud services disable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com mapsjs.googleapis.com --project <PROJECT_ID>

# Enable APIs when project is active again
- gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com mapsjs.googleapis.com --project <PROJECT_ID>

---

# Helper scripts

See `scripts/README.md` for details on scripts to query Firestore and Google Sheets, as well as cleanup Google Cloud artifacts.
