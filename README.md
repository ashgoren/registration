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

## 1. Generate GitHub Repository

- Generate a new GitHub repository from [template](https://github.com/ashgoren/registration/generate)

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
> Firebase Hosting built-in project site will be https://<PROJECT_ID>.web.app.
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

## 5. Payment Processor

### Stripe

> [!TIP]
> - On Stripe console, disable all payment methods except Cards, Apple Pay, Google Pay
> - Apple Pay: requires stripe domain auth

- Create 2 sandbox accounts - dev & staging
- Run interactive script 3 times, to set payment secrets for each environment:
  - `npm run set-payment-secrets <PROJECT_ID> stripe dev`
  - `npm run set-payment-secrets <PROJECT_ID> stripe stg`
  - `npm run set-payment-secrets <PROJECT_ID> stripe prd`

### PayPal

> [!TIP]
> Don't want to accept Venmo? Comment out the venmo line in `configPaypal.jsx`.

- Create 2 REST API apps in Sandbox mode - dev & staging
- Run interactive script 3 times, to set payment secrets for each environment:
  - `npm run set-payment-secrets <PROJECT_ID> paypal dev`
  - `npm run set-payment-secrets <PROJECT_ID> paypal stg`
  - `npm run set-payment-secrets <PROJECT_ID> paypal prd`

---

## 6. Terraform - Build Infrastructure

> [!IMPORTANT]
> Ensure values are set in the following files:
> - `terraform/shared.auto.tfvars`
> - `terraform/stg.tfvars`
> - `terraform/prd.tfvars`

> [!TIP]
> Leave `frontend_domain` blank if you don't plan to have a custom domain for your website.

```sh
npm run terraform-stg # builds staging project
npm run terraform-prd # builds production project
```

---

## 7. Configure OAuth consent screen

> [!IMPORTANT]
> Make sure to configure the OAuth consent screen for both production and staging projects.

> [!TIP]
> Set user type to internal (other values are unimportant & no scopes are required)

[Configure OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

---

## 8. Config

- `functions/config.js`
- `src/config` - including basics, fields, order summary, etc
- `index.html` - site title and meta properties, e.g. description & [og:image](https://ogp.me/)
- Update favicon - use a generator, e.g. [favicon-generator](https://www.favicon-generator.org)
- Update logo - `public/logo.png` (set to desired height, likely <= 80px)
- Update email receipts in `templates` folder

---

## 9. Payment Webhook(s):

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
