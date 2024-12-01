# Registration site

Simple registration / admissions sales site for contra dance events.
React app that uses Firebase for database, hosting, and serverless functions back-end.

# Configuration

## Setup accounts and CLI tools:

- Create Firebase account if needed
- Create GitHub account if needed
- Install node if needed
- Install [GitHub CLI](https://cli.github.com/)
- Install [Firebase CLI](https://firebase.google.com/docs/cli)
- Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk)
- Install Google Cloud CLI beta components: `gcloud components install beta`
- Login to the Firebase CLI: `firebase login`

## Copy template project

- ME: `cp -R [TEMPLATE_DIR] [DESTINATION_DIR] && cd [DESTINATION_DIR] && git remote rm origin && gh repo create [NAME] [--public|private] --source=. --remote=origin`
- ANYONE ELSE: Fork [template project](https://github.com/ashgoren/registration-template) and clone it to a local directory

## Erase settings from old project:

```sh
bash clear-old-settings.sh
```

## Set configuration options:

- Update site title and meta content description in `public/index.html`
- Update values in `config` folder files
- Update favicon (can use [this site](https://www.favicon-generator.org) to generate them)
- Copy desired logo to `public/logo.png` and set to desired height (likely <= 80px)
- Update `MiscInfo`, `OrderSummary`, `Receipt` and other pages as needed
- Ensure receipt text for all scenarios is as desired!

## Create a Firebase project, which will also create a Google Cloud project with the same PROJECT_ID:

```sh
firebase projects:create [PROJECT_ID]
```

## Enable billing on Google Cloud account from the [Google Cloud console](https://console.cloud.google.com/billing)
(Unlikely to actually owe any money for small scale use, but set a billing alert to be safe.)

7. Setup [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

- user type: internal
- values for other fields don't really matter
- not necessary to add any scopes

## Link new project to Google Cloud billing account:

```sh
gcloud billing accounts list
gcloud billing projects link [PROJECT_ID] --billing-account [BILLING_ACCOUNT_ID]
```

## Create Firebase web app and add config to `.env`

- From Firebase console, click "Add app" and choose the web one
- Get Firebase web app config values

```sh
firebase apps:sdkconfig web
```

- Add those values to `.env` file

## Setup database

- [Create Firestore database](https://console.firebase.google.com/project/[PROJECT_ID]/firestore)
- Deploy Firestore database: `firebase deploy --only firestore`

## Setup Stripe or PayPal:

Stripe configuration:
- On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
- Copy the _publishable key_ to the `.env` file. (Use test key until ready to launch.)
- set Stripe secret key in `functions/.env`
- set Stripe statement_descriptor_suffix in `functions/.env` (optional)

PayPal configuration:
- Don't want to accept Venmo? Comment out the venmo line in `config.js`.
- Copy the _client ID_ to the `.env` file. Ignore the secret key. (Use sandbox mode key until ready to launch.)
- Comment out the lines related to Stripe in `functions/index.js`

## IF COLLECTING ADDRESSES: setup Google Places API for address autocomplete

- Update allowed-referrers list in `google-places-api-flags.yaml` file.

Enable google places and maps javascript APIs. (Theoretically can use gcloud services enable via CLI, but may actually need to do from google cloud console.)

```sh
gcloud services enable places-backend.googleapis.com --project [PROJECT_ID]
gcloud services enable maps-backend.googleapis.com --project [PROJECT_ID]
gcloud beta services api-keys create --flags-file=google-places-api-flags.yaml --project [PROJECT_ID]
```

- Copy `keyString` value to `REACT_APP_GOOGLE_PLACES_API_KEY` in `.env`.

## Enable reCAPTCHA for Firebase App Check

- Replace EXAMPLE.COM above with actual domain in command below.

```sh
gcloud services enable recaptchaenterprise.googleapis.com --project [PROJECT_ID]
gcloud recaptcha keys create --display-name="recaptcha-enterprise" --integration-type="SCORE" --web --domains="localhost,[PROJECT_ID].web.app,EXAMPLE.COM" --project [PROJECT_ID]
```

- Copy site key value to `REACT_APP_RECAPTCHA_SITE_KEY` in `.env`.
- [Enable Firebase App Check](https://console.firebase.google.com/project/[PROJECT_ID]/appcheck/apps)
  - choose Recaptcha Enterprise option
  - use site key value from previous step

## Copy `.env` file values over to GitHub Secrets for workflow use:

```sh
bash update-github-secrets.sh
```

## Add Firebase Service Account as GitHub Secret:

```sh
firebase init hosting:github # answer no to questions, as this is already configured
rm .github/workflows/firebase-hosting-pull-request.yml
```

- Update `firebaseServiceAccount` value in `.github/workflows/firebase-hosting-merge.yml` to name of GitHub secret set by previous step.

## Setup Google Sheets integration:

Setup spreadsheet for recording orders:

- Make a copy of the [template spreadsheet](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/edit?usp=sharing).
- Update fields/columns as needed in spreadsheet _and_ in `functions/fields.js`.
- Determine your spreadsheet ID - the long string of characters (likely between `/d/` and `/edit`)

Enable Sheets API, create Google Cloud service account, update values in `functions/.env`:

```sh
gcloud services enable sheets.googleapis.com --project [PROJECT_ID]
gcloud iam service-accounts create sheets --project [PROJECT_ID]
gcloud iam service-accounts keys create tmp.json --iam-account sheets@[PROJECT_ID].iam.gserviceaccount.com
cat tmp.json
```

- Copy `client_email` from tmp.json into `functions/.env` as `SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL`
- Copy `private_key` from tmp.json into `functions/.env` as `SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY`
- Copy spreadsheet ID (as retrieved earlier) into `functions/.env` as `SHEETS_SHEET_ID`
- Give spreadsheet edit permissions to the service account email: `sheets@[PROJECT_ID].iam.gserviceaccount.com`

```sh
rm tmp.json
```

## Setup Email Confirmation:

Create a Sendgrid API key, update values in `functions/.env`:

- `EMAIL_SENDGRID_API_KEY`
- `EMAIL_FROM`
- `EMAIL_SUBJECT`
- `EMAIL_REPLY_TO` (if needed)

## Deploy Firebase Functions:

```sh
cd functions && npm install && cd ..
firebase deploy --only functions
```

## Add error logging for Firebase functions:

###################################################################################
### NOTE: Google will soon begin charging $1.50/month for each alert condition! ###
###################################################################################

Setup logs for Firebase functions to notify on error:

- Do this query:

```
resource.type="cloud_run_revision" severity="ERROR"
```

- then click on "Create alert"

# Development 

- Ensure `.env` is filled in with environment variables

```sh
npm install
npm start
```

# Deployment via GitHub workflow and Firebase hosting

- Ensure all environment variables are set as repo [secrets](https://github.com/[GITHUB_USER]/[GITHUB_REPO]/settings/secrets/actions)
- Ensure all environment variables are listed in `.github/workflows/firebase-hosting-merge.yml`, including firebaseServiceAccount
- If update Github secrets, must redeploy

# When switching to live mode

- Set sandbox mode to false in `configBasics`
- PAYPAL: Update Client ID to production mode *ON GITHUB* and redeploy to Firebase
- STRIPE: Update Stripe Publishable Key to production mode *ON GITHUB* and redeploy to Firebase
- STRIPE: Update Stripe Secret Key to production mode in `functions/.env` and redeploy Firebase Functions
- Make registration link live on homepage & navbar
- Clear spreadsheet
- Clear DB
