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

- Install: [Stripe CLI](https://stripe.com/docs/stripe-cli) (if applicable)
  - Login to the Stripe CLI: `stripe login`

---

## Generate GitHub Repository

- Generate a new GitHub repository from [template](https://github.com/ashgoren/registration/generate)

---

## Create Production & Staging Google Cloud Projects

> [!NOTE]
> Project ID's must be globally unique.
> Staging project ID must match production project ID but with "-stg" appended.

```sh
gcloud projects create PROJECT_ID
gcloud projects create PROJECT_ID-stg
```

---

## Bootstrap Google Cloud projects

> [!NOTE]
> This script performs the following bootstrapping steps:
> - Links Google Cloud projects to a billing account
> - Enables APIs required to bootstrap Terraform
> - Generates .firebaserc file
> - Generates Terraform variables files

```sh
npm run bootstrap <PROJECT_ID>
```

---

## Spreadsheet

- Generate a new spreadsheet from [template](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/template/preview)
- Update fields/columns as needed in spreadsheet _and_ in `functions/shared/fields.js`
- Set the new spreadsheet's URL as `spreadsheet_url` in `terraform/environments/shared.auto.tfvars`
- Share spreadsheet (with edit permissions) to the following service addresses:
  - sheets@<PROJECT_ID>.iam.gserviceaccount.com
  - sheets@<PROJECT_ID>-stg.iam.gserviceaccount.com

---

## Email

- Create Amazon SES SMTP credentials [here](https://console.aws.amazon.com/ses/home#/smtp)
  - Set "SMTP user name" as `email_amazonses_smtp_user` in `terraform/environments/shared.auto.tfvars`
  - Set "SMTP password" as `email_amazonses_smtp_password` in `terraform/environments/shared.auto.tfvars`

- Verify email domain in Amazon SES console [here](https://console.aws.amazon.com/ses/home#/identities)
  - Follow instructions to verify the domain, including DKIM and MAIL FROM verification
  - Add required records to DNS provider and wait for verification

- Set the following in `terraform/environments/shared.auto.tfvars`:
  - `email_from_name`
  - `email_from_address` - domain must be verified in amazon ses
  - `email_admin_notifications`
  - `email_test_domains` - test domains to ignore for receipts etc - e.g. "example.com,test.com,testing.com"

- Set the following in `terraform/environments/shared.auto.tfvars` only if needed:
  - `email_reply_to` - use a custom reply-to address
  - `email_amazonses_email_endpoint` - required if email domain was verified in an aws region other than us-east-2

---

## Payment Processor

### Stripe

- On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
- Apple Pay: requires stripe domain auth

- Set the *test mode* publishable & secret keys in terraform `stg.tfvars`
- Set the *live mode* publishable & secret keys in terraform `prd.tfvars`

### PayPal

> [!TIP]
> Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.

- Set the *test mode* client id & client secret in terraform `stg.tfvars`
- Set the *live mode* client id & client secret in terraform `prd.tfvars`

---

## Configure OAuth consent screen

> [!IMPORTANT]
> Make sure to configure the OAuth consent screen for both production and staging projects.

> [!TIP]
> Set user type to internal (other values are unimportant & no scopes are required)

[Configure OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

---

## Terraform - Build Infrastructure

> [!IMPORTANT]
> Ensure values are set in the following files:
> - `terraform/bootstrap/terraform.tfvars`
> - `terraform/environments/shared.auto.tfvars`
> - `terraform/environments/staging.tfvars`
> - `terraform/environments/production.tfvars`

> [!TIP]
> Leave `frontend_domain` blank if you don't plan to have a custom domain for your website.

```sh
npm run initialize-terraform # initializes terraform with workspaces, imports GCP projects
npm run terraform-bootstrap # creates doppler projects
npm run terraform-stg # builds staging project
npm run terraform-prd # builds production project
```

---

## Config

- `functions/config.js`
- `src/config` - including basics, fields, order summary, etc
- `index.html` - site title and meta properties, e.g. description & [og:image](https://ogp.me/)
- Update favicon - use a generator, e.g. [favicon-generator](https://www.favicon-generator.org)
- Update logo - `public/logo.png` (set to desired height, likely <= 80px)
- Update email receipts in `templates` folder

---

## Payment Webhook(s):

Add webhooks in PayPal Developer Dashboard or Stripe Dashboard to receive notifications of payment events.

> [!IMPORTANT]
> If you want to use this in Sandbox mode, you'll need 3 different webhooks.
>
> 1st webhook (sandbox payments) - goes to local tunnel (for dev)
> 2nd webhook (sandbox payments) - goes to firebase function (for staging)
> 3rd webhook (live payments) - goes to firebase function (for prod)

### PayPal Webhooks:

1. In the PayPal Developer Dashboard, navigate to **My Apps & Credentials**.
2. Select your app and scroll down to the **Webhooks** section.
3. Click **Add Webhook** and enter your webhook URL.
    - For local testing, use localtunnel (`lt -p 5001 -s <PROJECT_ID>`) to create a local tunnel, then use URL like this: `https://<localtunnel-url>/<PROJECT_ID>/<REGION>/paypalWebhook`
    - For production, use the URL of your Firebase function: `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/paypalWebhook`
4. Select only the **payment capture completed** event.
5. Click **Save**.
6. Set Webhook IDs generated by PayPal in Doppler:

```sh
doppler secrets set -p <PROJECT_ID>-backend -c dev PAYPAL_WEBHOOK_ID "<local_sandbox>"
doppler secrets set -p <PROJECT_ID>-backend -c stg PAYPAL_WEBHOOK_ID "<deployed_sandbox>"
doppler secrets set -p <PROJECT_ID>-backend -c prd PAYPAL_WEBHOOK_ID "<deployed_live>"
```

### Stripe Webhooks:

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
doppler secrets set -p <PROJECT_ID>-backend -c dev STRIPE_WEBHOOK_SECRET "<local_sandbox>"
doppler secrets set -p <PROJECT_ID>-backend -c stg STRIPE_WEBHOOK_SECRET "<deployed_sandbox>"
doppler secrets set -p <PROJECT_ID>-backend -c prd STRIPE_WEBHOOK_SECRET "<deployed_live>"
```

---

# Development 

First time:
```sh
npm install
npm install --prefix functions
```

Configure local doppler to use the right frontend and backend projects:
```sh
doppler setup -p <PROJECT_ID> -c dev
cd functions && doppler setup -p <PROJECT_ID>-backend -c dev && cd ..
```

Usage in development:
```sh
npm run emulator # optional (to use emulators for firebase functions)
npm run dev
```

---

# Deployment

## Deploy backend (Firebase Functions):

```sh
npm install --prefix functions
firebase deploy --only functions
```

## Deploy frontend (Firebase Hosting):

- Push or merge to staging branch on GitHub to deploy staging project
- Push or merge to main branch on GitHub to deploy production project

## Configure Firebase Hosting URL

- In Firebase Console add custom domain (if desired)

---

# After updating stg/prd secrets

- After updating Doppler stg/prd secrets, must redeploy front-end + firebase functions with `--force`

---

# Switching to live mode

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

# Hibernation for projects not actively in use

Putting a project into hibernation:
- `npm run disable-apis <PROJECT_ID>`

Removing a project from hibernation:
- `npm run enable-apis <PROJECT_ID>`

---

# Helper scripts

See `scripts/README.md` for details on scripts to query Firestore and Google Sheets.
