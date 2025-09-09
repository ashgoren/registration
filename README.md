# Registration site

Simple registration / admissions sales site for contra dance events.

- Front-end: Vite + React + Material-UI
- Hosting: Firebase Hosting
- Database: Firebase Firestore
- Serverless functions: Firebase Functions
- Logging: Google Cloud Logging
- Secrets management: Doppler & Google Cloud Secret Manager
- Address autocomplete: Google Places API
- Email: Amazon SES
- Payment: Stripe or PayPal
- IaC: Terraform

# Configuration

## Required accounts and command-line tools:

> [!IMPORTANT]
> Run commands from a Unix-compatible CLI, e.g. `Terminal` on Mac or [Git Bash](https://git-scm.com/downloads) on Windows.

- Account: [GitHub](https://github.com/)
- Account: [Firebase](https://firebase.google.com/)
- Account: [Google Cloud](https://cloud.google.com/)
- Account: [Google Cloud Billing](https://console.cloud.google.com/billing)
- Account: [Doppler](https://www.doppler.com/)
- Account: [Amazon SES](https://aws.amazon.com/ses/)
- Account: [Stripe](https://stripe.com/) or [PayPal](https://www.paypal.com/)

- Install: [Terraform](https://developer.hashicorp.com/terraform/install)

- Install: [Node](https://nodejs.org/)

- Install: [GitHub CLI](https://cli.github.com/)
  - Login to GitHub CLI: `gh auth login`

- Install: [Firebase CLI](https://firebase.google.com/docs/cli)
  - Login to the Firebase CLI: `firebase login`

- Install: [Doppler CLI](https://www.doppler.com/docs/cli)
  - Login to the Doppler CLI: `doppler login`

- Install: [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk)
  - Login to the Google Cloud CLI: `gcloud auth login`
  - Create local default credentials (needed for Terraform): `gcloud auth application-default login`

- Install: [Stripe CLI](https://stripe.com/docs/stripe-cli) (if desired)
  - Login to the Stripe CLI: `stripe login`

---

## 1. Generate GitHub Repository

- Generate a new GitHub repository from [template](https://github.com/ashgoren/registration/generate)
- Clone your new repo: `git clone <REPO_URL>`

---

## 2. Create & Bootstrap GCP/Firebase Projects, Terraform, Doppler

> [!NOTE]
> This script performs the following bootstrapping steps:
> - Creates Google Cloud production & staging projects
> - Links Google Cloud projects to a billing account
> - Enables APIs required to bootstrap Terraform
> - Initializes Terraform directory & workspaces
> - Generates Terraform variables files
> - Generates .firebaserc file
> - Creates Doppler projects

> [!IMPORTANT]
> PROJECT_ID is your desired unique identifier for your project.
> It must be globally unique. (This script will inform you if it's taken.)

> [!TIP]
> Firebase Hosting built-in project site will be `https://<PROJECT_ID>.web.app`.
> (You may of course ignore that and use your own domain.)

```sh
npm run bootstrap <PROJECT_ID>
```

---

## 3. Spreadsheet

- Generate a new spreadsheet from [template](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/template/preview)
- Update fields/columns as needed in spreadsheet _and_ in `functions/shared/fields.js`
- Set the new spreadsheet's URL as `spreadsheet_url` in `terraform/shared.auto.tfvars`
- Share spreadsheet (with edit permissions) to the following service addresses:
  - sheets@<PROJECT_ID>.iam.gserviceaccount.com
  - sheets@<PROJECT_ID>-stg.iam.gserviceaccount.com

---

## 4. Email

- Create Amazon SES SMTP credentials [here](https://console.aws.amazon.com/ses/home#/smtp)
  - Set "SMTP user name" as `email_amazonses_smtp_user` in `terraform/shared.auto.tfvars`
  - Set "SMTP password" as `email_amazonses_smtp_password` in `terraform/shared.auto.tfvars`

- Verify email domain in Amazon SES console [here](https://console.aws.amazon.com/ses/home#/identities)
  - Follow instructions to verify the domain, including DKIM and MAIL FROM verification
  - Add required records to DNS provider and wait for verification

- Set the following in `terraform/shared.auto.tfvars`:
  - `email_from_name`
  - `email_from_address` - domain must be verified in amazon ses
  - `email_admin_notifications`
  - `email_test_domains` - test domains to ignore for receipts etc

- Set the following in `terraform/shared.auto.tfvars` only if needed:
  - `email_reply_to` - use a custom reply-to address
  - `email_amazonses_email_endpoint` - required if email domain was verified in an aws region other than us-east-2

---

## 5. Terraform - Build Infrastructure

> [!IMPORTANT]
> Ensure all required values are set in `terraform/shared.auto.tfvars`.

> [!TIP]
> Leave `frontend_domain` blank if you don't plan to have a custom domain for your website.

```sh
npm run terraform-stg # builds staging project
npm run terraform-prd # builds production project
```

---

## 6. Configure OAuth consent screen

> [!IMPORTANT]
> Make sure to configure the OAuth consent screen for both production and staging projects.

> [!TIP]
> Set user type to internal (other values are unimportant & no scopes are required)

[Configure OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

---

## 7. Config

- `functions/config.js`
- `src/config` - including basics, fields, order summary, etc
- `index.html` - site title and meta properties, e.g. description & [og:image](https://ogp.me/)
- Update favicon - use a generator, e.g. [favicon-generator](https://www.favicon-generator.org)
- Update logo - `public/logo.png` (set to desired height, likely <= 80px)
- Update email receipts in `templates` folder

---

## 8. Payment Processor

> [!NOTE]
> Staging & Development mode webhooks are optional, only if desired for testing the webhook feature.

### Stripe

> [!TIP]
> - On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
> - Apple Pay: requires stripe domain auth

- Create 2 sandbox accounts - dev & staging

- Create Stripe webhook endpoint(s) from the command line using the Stripe CLI (or from the Stripe Dashboard):
  - prd: `stripe webhook_endpoints create --url https://<REGION>-<PROJECT_ID>.cloudfunctions.net/stripeWebhook --enabled-events payment_intent.succeeded`
  - stg (optional): `stripe webhook_endpoints create --url https://<REGION>-<PROJECT_ID>-stg.cloudfunctions.net/stripeWebhook --enabled-events payment_intent.succeeded`
  - dev (optional): `stripe listen --events payment_intent.succeeded --forward-to localhost:5001/<PROJECT_ID>/<REGION>/stripeWebhook`

- Run interactive script 3 times, to set payment secrets (publishable key, secret key, webhook secret) for each environment:
  - `npm run set-payment-secrets <PROJECT_ID> stripe dev`
  - `npm run set-payment-secrets <PROJECT_ID> stripe stg`
  - `npm run set-payment-secrets <PROJECT_ID> stripe prd`

### PayPal

> [!TIP]
> Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.

- Create 2 REST API apps in Sandbox mode - dev & staging

- Create PayPal webhook(s) from the website, selecting only the **payment capture completed** event:
  - prd endpoint: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/paypalWebhook`
  - stg endpoint (optional): `https://<REGION>-<PROJECT_ID>-stg.cloudfunctions.net/paypalWebhook`
  - dev endpoint (optional): `https://<localtunnel-url>/<PROJECT_ID>/<REGION>/paypalWebhook` (requires using localtunnel, e.g. `lt -p 5001 -s <PROJECT_ID>`)

- Run interactive script 3 times, to set payment secrets (client id, client secret, webhook id) for each environment:
  - `npm run set-payment-secrets <PROJECT_ID> paypal dev`
  - `npm run set-payment-secrets <PROJECT_ID> paypal stg`
  - `npm run set-payment-secrets <PROJECT_ID> paypal prd`

---

# Development 

### First time:

```sh
npm install
npm install --prefix functions
```

### Usage in development:

```sh
npm run emulator # to use firebase emulators
npm run dev
```

---

# Deployment

### Deploy backend (Firebase Functions):

```sh
firebase deploy --only functions
```

### Deploy frontend (Firebase Hosting):

- Push or merge to staging branch on GitHub to deploy staging project
- Push or merge to main branch on GitHub to deploy production project

### Configure Firebase Hosting URL

- In Firebase Console add custom domain (if desired)

### Hibernation for projects not actively in use

```sh
npm run disable-apis <PROJECT_ID> # npm run enable-apis to remove from hibernation
```

### Switching to live mode

> [!TIP]
> After updating Doppler stg/prd secrets, must redeploy front-end + firebase functions with `--force`

- Ensure that Doppler prd config has live mode values for these:
  - frontend: `VITE_STRIPE_PUBLISHABLE_KEY`
  - frontend: `VITE_PAYPAL_CLIENT_ID`
  - backend: `STRIPE_SECRET_KEY`
  - backend: `STRIPE_WEBHOOK_SECRET`
  - backend: `PAYPAL_CLIENT_ID`
  - backend: `PAYPAL_CLIENT_SECRET`
  - backend: `PAYPAL_WEBHOOK_ID`
- Make registration link live on homepage & navbar
- Redeploy: front-end, back-end, firebase functions with `--force`
- Clear Spreadsheet
- Clear production Firestore DB if necessary

---

# Helper scripts

See `scripts/README.md` for details on scripts to query database and payment processor.
