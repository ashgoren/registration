# Registration site

Simple registration / admissions sales site for contra dance events.

- Front-end: Vite + React + Material-UI
- Hosting: Firebase Hosting
- Database: Firebase Firestore
- Serverless functions: Firebase Functions
- App Check: Recaptcha Enterprise + Firebase App Check
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
- Unlikely to owe any money for small scale use, but set a billing alert to be safe.
- Setup [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
  - user type: internal
  - values for other fields don't matter
  - not necessary to add any scopes

---

## Link new project to Google Cloud billing account:

```sh
gcloud billing accounts list
gcloud billing projects link <PROJECT_ID> --billing-account [BILLING_ACCOUNT_ID]
```

---

## Create Firebase web app and add config to `.env`

- From [Firebase console](https://console.firebase.google.com/), select your project, click "Add app" and choose the web (`</>`) option.
- Get Firebase web app config values by running the following command in the project directory:
  ```sh
  firebase apps:sdkconfig web
  ```
- Fill in `.env` file with values from the output of the previous command.

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
- Copy the test mode `publishable key` to the `.env` file. (Use test key until ready to launch.)
- set Stripe secret key in `functions/.env`
- set Stripe statement_descriptor_suffix in `functions/.env` (optional)
- Comment out the lines related to Paypal in `functions/index.js`

PayPal configuration:
- Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.
- Copy the sandbox mode `client ID` to the `.env` (VITE_PAYPAL_CLIENT_ID) and to `functions/.env` (PAYPAL_CLIENT_ID).
- Copy the sandbox mode `secret` to the `functions/.env` file as both `PAYPAL_CLIENT_SECRET` and `PAYPAL_CLIENT_SECRET_DEV`.
- Comment out the lines related to Stripe in `functions/index.js`

---

## If collecting addresses, setup Google Places API for address autocomplete

- Update allowed-referrers list in `google-places-api-flags.yaml` file.

Enable google places and maps javascript APIs. (Theoretically can use gcloud services enable via CLI, but may actually need to do from google cloud console.)

```sh
gcloud services enable places-backend.googleapis.com --project <PROJECT_ID>
gcloud services enable maps-backend.googleapis.com --project <PROJECT_ID>
gcloud services api-keys create --flags-file=google-places-api-flags.yaml --project <PROJECT_ID>
```

- Copy `keyString` value to `VITE_GOOGLE_PLACES_API_KEY` in `.env`.

---

## Setup Firebase App Check

- Enable Recaptcha Enterprise and create a key:
  ```sh
  # Replace EXAMPLE.COM below with custom domain, or just use <PROJECT_ID>.web.app
  gcloud services enable recaptchaenterprise.googleapis.com --project <PROJECT_ID>
  gcloud recaptcha keys create --display-name="recaptcha-enterprise" --integration-type="SCORE" --web --domains="<PROJECT_ID>.web.app,EXAMPLE.COM" --project <PROJECT_ID>
  ```
- Copy site key value to `VITE_RECAPTCHA_SITE_KEY` in `.env`.

- Enable Firebase App Check: https://console.firebase.google.com/project/<PROJECT_ID>/appcheck/apps
  - choose Recaptcha Enterprise option
  - use site key value from previous step
  - generate debug token for use in development mode:
    - click 3 dots, Manage debug token, Add debug token, Generate token, give it whatever name you want
    - copy the token value and add it to `.env` as `VITE_APPCHECK_DEBUG_TOKEN`

---

## Enable Papertrail for client-side logging (routed through firebase function)

- Create log destination on [papertrail](https://papertrailapp.com/account/destinations)
- Copy token value to `PAPERTRAIL_TOKEN` in `functions/.env`


---

## Update GitHub Secrets with values from `.env` file:
These are used by GitHub Actions to deploy to Firebase.

```sh
bash update-github-secrets.sh
```

---

## Add Firebase Service Account as GitHub Secret:

```sh
# answer no to questions, as this is already configured
firebase init hosting:github
rm .github/workflows/firebase-hosting-pull-request.yml
```

- Set `firebaseServiceAccount` value in both GitHub workflows to name of GitHub secret set by previous step. (workflows are in `.github/workflows`)

---

## Setup Google Sheets integration:

Setup spreadsheet for recording orders:

- Make a copy of the [template spreadsheet](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/edit?usp=sharing).
- Update fields/columns as needed in spreadsheet _and_ in `functions/fields.js`.
- Determine your spreadsheet ID - the long string of characters in URL (likely between `/d/` and `/edit`)
- Give spreadsheet edit permissions to the service account email: `sheets@<PROJECT_ID>.iam.gserviceaccount.com`

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
- Copy spreadsheet ID (as retrieved earlier) into `functions/.env` as `SHEETS_SHEET_ID`

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

---

# Development 

Ensure root directory `.env` is filled in with environment variables, then:

> [!TIP]
> To use Firebase Emulators rather than live services, set `VITE_USE_EMULATORS=true` in `.env` and run `firebase emulator:start` in a separate terminal.

First time setup:
```sh
npm install
```

Usage in development:
```sh
firebase emulators:start # optional (to use emulators for serverless functions & DB)
npm run dev
```

---

# Deployment via GitHub workflow and Firebase hosting

- Ensure all environment variables are set as repo [secrets](https://github.com/[GITHUB_USER]/[GITHUB_REPO]/settings/secrets/actions)
- Ensure all environment variables are listed in `.github/workflows/firebase-hosting-merge.yml`, including firebaseServiceAccount
- If update Github secrets, must redeploy

---

# When switching to live mode

- Set sandbox mode to false in `configBasics.jsx`
- PAYPAL: Update Client ID to production mode locally and *ON GITHUB* and redeploy to Firebase
- PAYPAL: Update both client & secret keys to production mode in `functions/.env` and redeploy Firebase Functions
- STRIPE: Update Stripe Publishable Key to production mode locally and *ON GITHUB* and redeploy to Firebase
- STRIPE: Update Stripe Secret Key to production mode in `functions/.env` and redeploy Firebase Functions
- Make registration link live on homepage & navbar
- Clear spreadsheet
- Clear Firestore DB

---

# Helper scripts

See `scripts/README.md` for details on scripts to query Firestore and Google Sheets, as well as cleanup Google Cloud artifacts.
