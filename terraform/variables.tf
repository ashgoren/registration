######## SET IN STG.TFVARS OR PRD.TFVARS ########

# production project ID
variable "project_id" {
  description = "ID of the Firebase / Google Cloud project"
  type        = string
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
}

# Enter in stg.tfvars only; managed directly by Doppler for prd
variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
}

variable "paypal_client_id" {
  description = "PayPal client ID"
  type        = string
}

# Enter in stg.tfvars only; managed directly by Doppler for prd
variable "paypal_client_secret" {
  description = "PayPal client secret"
  type        = string
}


####### SET IN SHARED.AUTO.TFVARS ########

# Doppler frontend project name
variable "doppler_project" {
  description = "Name of the Doppler frontend project"
  type        = string
}

# Set in Doppler bootstrap project and then run terraform via doppler run -- terraform
variable "doppler_token" {
  description = "Doppler API token"
  type        = string
}

# To find this: gcloud organizations list
variable "gcp_organization_id" {
  description = "The Google Cloud organization to associate with the project"
  type        = string
}

# To find this: gcloud billing accounts list
variable "gcp_billing_account_id" {
  description = "The Google Cloud billing account to associate with the project"
  type        = string
}

# Desired google cloud region - e.g. us-west1 or us-central1
variable "gcp_region" {
  description = "The region where the Firebase / Google Cloud project will be located"
  type        = string
  default     = "us-west1"
}

# GitHub repository
variable "github_repo" {
  description = "The name of the GitHub repository"
  type        = string
}

# Domain where the front-end will be hosted, used by address autocomplete key
# Leave blank if not using a custom domain
variable "frontend_domain" {
  description = "The domain for the deployed application"
  type        = string
  default     = ""
}

variable "spreadsheet_url" {
  description = "URL of the Google Sheets spreadsheet"
  type        = string
}

# Note: verified domains in Amazon SES are region-specific
variable "email_amazonses_email_endpoint" {
  description = "Amazon SES email endpoint (e.g. email-smtp.us-east-2.amazonaws.com)"
  type        = string
  default     = "email-smtp.us-east-2.amazonaws.com"
}

variable "email_amazonses_smtp_user" {
  description = "Amazon SES SMTP user"
  type        = string
}

# Enter in stg.tfvars only; managed directly by Doppler for prd
variable "email_amazonses_smtp_password" {
  description = "Amazon SES SMTP password"
  type        = string
}

variable "email_from_name" {
  description = "From name for sending email receipts"
  type        = string
}

variable "email_from_email" {
  description = "From email address for sending email receipts"
  type        = string
}

variable "email_admin_notifications" {
  description = "Email address to receive budget alert & other notifications"
  type        = string
}

variable "email_reply_to" {
  description = "Reply-to email address for sending email receipts"
  type        = string
  default     = ""
}

variable "email_test_domains" {
  description = "Comma-separated list of test domains to ignore for receipts and reports"
  type        = string
  default     = "example.com,test.com,testing.com"
}
