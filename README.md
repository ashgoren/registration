# Contra Registration
_Simple event registration / admissions sales site_

## Tech Stack

**Front-end:** Vite + React + Material-UI  
**Hosting:** Firebase Hosting  
**Database:** Firebase Firestore  
**Serverless functions:** Firebase Functions  
**Logging:** Google Cloud Logging  
**Secrets management:** Doppler & Google Cloud Secret Manager  
**Address autocomplete:** Google Places API  
**Email:** Amazon SES  
**Payment:** Stripe or PayPal  
**IaC:** Terraform  

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Generate Repository](#2-generate-repository)
3. [Bootstrap Projects](#3-bootstrap-projects)
4. [Spreadsheet Setup](#4-spreadsheet-setup)
5. [Email Setup](#5-email-setup)
6. [Deploy Infrastructure](#6-deploy-infrastructure)
7. [Grant Spreadsheet Access](#7-grant-spreadsheet-access)
8. [Payment Setup](#8-payment-setup)
9. [Site Configuration](#9-site-configuration)
10. [Development](#10-development)
11. [Deployment](#11-deployment)
12. [Post-Deployment](#12-post-deployment)

---

## 1. Prerequisites 

> [!IMPORTANT]
> Run commands from a Unix-compatible CLI (e.g. Terminal on Mac or [Git Bash](https://git-scm.com/downloads) on Windows).

### Required Accounts
✅ **[GitHub](https://github.com/)** - Code Repository  
✅ **[Firebase](https://firebase.google.com/)** - Hosting, Database, Backend  
✅ **[Google Cloud](https://cloud.google.com/)** - Infrastructure ([billing required](https://console.cloud.google.com/billing))  
✅ **[Doppler](https://www.doppler.com/)** - Secrets Management  
✅ **[Amazon SES](https://aws.amazon.com/ses/)** - Email Delivery  
✅ **[Stripe](https://stripe.com/)** or **[PayPal](https://www.paypal.com/)** - Payment Processing  

### Required CLI Tools

| Tool | Authentication |
|------|----------------|
| [Node.js](https://nodejs.org/) | - |
| [Terraform](https://developer.hashicorp.com/terraform/install) | - |
| [GitHub CLI](https://cli.github.com/) | `gh auth login` |
| [Firebase CLI](https://firebase.google.com/docs/cli) | `firebase login` |
| [Doppler CLI](https://www.doppler.com/docs/cli) | `doppler login` |
| [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk) | `gcloud auth login` + `gcloud auth application-default login` |
| [Stripe CLI](https://stripe.com/docs/stripe-cli) _(optional)_ | `stripe login` |

---

## 2. Generate Repository

1. Generate repository from [template](https://github.com/ashgoren/registration/generate)
2. Clone: `git clone <REPO_URL>`
3. Navigate to project: `cd <your-repo-name>`

---

## 3. Bootstrap Projects

> [!NOTE]  
> **What this does:** Creates production & staging Google Cloud projects linked to your billing account, enables APIs, initializes Terraform, generates .firebaserc file, creates Doppler projects (see [scripts/bootstrap/README.md](scripts/bootstrap/README.md) for details)

> [!TIP]
> **PROJECT_ID format:** Use lowercase letters, numbers, hyphens. Must be globally unique.  
> **Example:** `my-dance-event-2025` → Complimentary site will be at `https://my-dance-event-2025.web.app`  

> [!TIP]
> If the Google Cloud projects already exist (i.e. redeploying an existing site), add `skip-project-creation` as a second argument.

```bash
npm run bootstrap <PROJECT_ID> [skip-project-creation]
```

---

## 4. Spreadsheet Setup

1. Create spreadsheet from [template](https://docs.google.com/spreadsheets/d/1gQ9l8wBTgNmiI0KmpECsDzCqePSPMnZFaecuj0VO_cU/template/preview)
2. Rename spreadsheet to desired name
3. Update columns as desired
4. Add URL to `terraform/shared.auto.tfvars`:
```hcl
   spreadsheet_url = "YOUR_SPREADSHEET_URL"
```

---

## 5. Email Setup

### Step 5a: Verify Domain
> [!IMPORTANT]
> You must verify the domain of your `email_from_address` in Amazon SES.

1. Go to [SES Identities](https://console.aws.amazon.com/ses/home#/identities)
2. Create Identity → Domain → Enter your domain (e.g. `yourdomain.com`)
3. Check "Use a custom MAIL FROM domain" → Enter `amazonses` (this is not visible to recipients but improves deliverability)
4. Advanced DKIM settings → "Easy DKIM" with a 2048-bit key
5. Uncheck "Publish DNS records to Route53" in both spots on the page (unless using Route53 for DNS)
6. Leave "DKIM Signatures" checked
7. Click "Create Identity"
8. Publish the provided DNS records (likely 6 records total, from 3 sections - DKIM, MAIL FROM, and DMARC)
9. Wait and check back until all 3 sections show as verified

### Step 5b: Create SMTP Credentials
1. Go to [Amazon SES SMTP](https://console.aws.amazon.com/ses/home#/smtp)
2. Add credentials to `terraform/shared.auto.tfvars`:
```hcl
   email_amazonses_smtp_user = "YOUR_SMTP_USER"
   email_amazonses_smtp_password = "YOUR_SMTP_PASSWORD"
```

### Step 5c: Configure Other Email Settings
Fill in email settings in `terraform/shared.auto.tfvars`:
```hcl
email_from_name = "Example Dance Weekend"
email_from_address = "someone@yourdomain.com"
email_admin_notifications = "admin@yourdomain.com"

# Optional: if different from email_from_address
email_reply_to = ""

# Optional: domains to skip for email confirmation & data validation
email_test_domains = "example.com,test.com,testing.com"

# Required only if domain was verified in an aws region other than us-east-2
email_amazonses_email_endpoint = ""
```

---

## 6. Deploy Infrastructure

> [!IMPORTANT]
> Ensure all required values are set in `terraform/shared.auto.tfvars`

> [!TIP]
> Leave `frontend_domain` blank if you don't plan to have a custom domain for your website

```bash
npm run terraform-stg # deploys staging infrastructure
npm run terraform-prd # deploys production infrastructure
```

---

## 7. Grant Spreadsheet Access

Share your spreadsheet (edit permissions) with:
- `sheets@<PROJECT_ID>.iam.gserviceaccount.com`
- `sheets@<PROJECT_ID>-stg.iam.gserviceaccount.com`

---

## 8. Payment Setup

> [!NOTE]
> Staging & Dev mode webhooks are optional (only needed for testing webhook functionality)

<!-- ###### STRIPE SETUP ####### -->

<details>
<summary><span style="font-size:20px; font-weight:bold">Option A: Stripe</span></summary>

#### Step 8a: Configure Stripe Payment Methods
- Disable all payment methods except: Cards, Apple Pay, Google Pay
- Apple Pay requires Stripe domain verification

#### Step 8b: Create Stripe sandbox accounts
- Create 2 sandbox accounts - dev & stg

#### Step 8c: Create Stripe Webhook Endpoints
Create webhooks for **payment_intent.succeeded** event only:

| Environment | Endpoint URL |
|-------------|-------------|
| Production | `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/stripeWebhook` |
| Stg (optional) | `https://<REGION>-<PROJECT_ID>-stg.cloudfunctions.net/stripeWebhook` |
| Dev (optional) | `https://<localtunnel-url>/<PROJECT_ID>-stg/<REGION>/stripeWebhook` (requires using [localtunnel](https://localtunnel.github.io/www/), e.g. `lt -p 5001 -s <PROJECT_ID>`) |

#### Step 8d: Set Stripe Secrets
Run for each environment to set webhook secret and publishable + secret keys:
```bash
npm run set-payment-secrets <PROJECT_ID> stripe dev
npm run set-payment-secrets <PROJECT_ID> stripe stg
npm run set-payment-secrets <PROJECT_ID> stripe prd
```
</details>

<!-- ###### PAYPAL SETUP ####### -->

<details>
<summary><span style="font-size:20px; font-weight:bold">Option B: PayPal</span></summary>

#### Step 8a: Configure PayPal Payment Methods
- Don't want Venmo? Comment out the venmo line in `configPaypal.jsx`

#### Step 8b: Create PayPal sandbox accounts & REST API Apps
> [!IMPORTANT]
> You must enable the "Transaction search" feature on each REST API app to facilitate the the payment matching script.

- Create 2 sandbox business accounts - dev & stg
- Create a REST API apps within each sandbox account
- Enable "Transaction search" feature on each app
- Also create production REST API app if it doesn't yet exist

#### Step 8c: Create PayPal Webhook Endpoints
Create webhooks for **payment capture completed** event only:

| Environment | Endpoint URL |
|-------------|-------------|
| Production | `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/paypalWebhook` |
| Stg (optional) | `https://<REGION>-<PROJECT_ID>-stg.cloudfunctions.net/paypalWebhook` |
| Dev (optional) | `https://<localtunnel-url>/<PROJECT_ID>-stg/<REGION>/paypalWebhook` (requires using [localtunnel](https://localtunnel.github.io/www/), e.g. `lt -p 5001 -s <PROJECT_ID>`) |

#### Step 8d: Set PayPal Secrets
Run for each environment to set webhook id and client id + client secret:
```bash
npm run set-payment-secrets <PROJECT_ID> paypal dev
npm run set-payment-secrets <PROJECT_ID> paypal stg
npm run set-payment-secrets <PROJECT_ID> paypal prd
```
</details>

---

## 9. Site Configuration

| File | About |
|------|-------|
| `functions/config/userConfig.js` | Backend config |
| `src/config/` | Frontend config - event, fields, order-summary, theme |
| `src/templates/` | Email receipt templates |
| `src/components/Static/` | Static pages (e.g. Home, About, Contact) |
| `src/components/IntroHeader.jsx` | Registration form header |
| `src/components/layouts/Navbar.jsx` | Navbar |
| `index.html` | Site title, metadata description, [og:image](https://ogp.me/) |
| `public/logo.png` | Optional Navbar logo (≤80px height recommended) |
| `public/` | favicon files - use a generator, e.g. [favicon-generator](https://www.favicon-generator.org) |

---

## 10. Development 

### First Time Setup

```bash
npm install && npm install --prefix functions
git checkout -b staging
```

### Daily Development

```bash
npm run emulator # Start Firebase emulators
npm run dev # Start frontend dev server
```

### Helper scripts

See [scripts/README.md](scripts/README.md) for database and payment processor query tools.

---

## 11. Deployment

> [!NOTE]  
> GitHub Actions automatically handles:
> - Frontend deployment to Firebase Hosting
> - Backend deployment to Firebase Functions  
> - Doppler secrets sync to Google Cloud Secret Manager

> [!IMPORTANT]
> **You must redeploy after any changes to Doppler secrets!**

### Deploy to Staging
```bash
git push origin staging
```

### Deploy to Production
```bash
# 1. Ensure staging branch is up to date on GitHub
git push origin staging

# 2. Create and merge the pull request from staging to main
gh pr create --base main --head staging --fill --title "<SQUASH_COMMIT_MESSAGE>"
gh pr merge staging --auto --squash --delete-branch

# 3. Recreate staging branch from main
git checkout -b staging
```

---

## 12. Post-deployment

### 1. Configure Custom Domain (optional)
- Add custom domain in Firebase Console

### 2. Go Live Checklist
- [ ] Confirm Stripe/PayPal production secrets are set in Doppler  
  - **prd_frontend:** `VITE_STRIPE_PUBLISHABLE_KEY` or `VITE_PAYPAL_CLIENT_ID`
  - **prd_backend:** `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` *or* `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` + `PAYPAL_WEBHOOK_ID`
- [ ] Update registration links on homepage & navbar
- [ ] Clear spreadsheet data
- [ ] Clear production Firestore data if needed
- [ ] Update `robots.txt` to allow indexing (if sharing direct link)
- [ ] Redeploy after any updates to Doppler secrets or source code

### 3. Hibernation (optional)
For inactive projects:
```bash
npm run disable-apis   # npm run enable-apis to wake up
```

### 4. Shutdown (optional)
> [!IMPORTANT]
> This will run terraform destroy, delete firebase functions, and delete firestore database for both staging and production projects.  
> It will not delete the Google Cloud or Doppler projects themselves.

```bash
npm run shutdown <PROJECT_ID>
```
