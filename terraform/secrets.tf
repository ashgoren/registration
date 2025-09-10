# This creates secrets in Doppler stg/prd frontend/backend configs
# and also uses stg config to create a dev config

# Note that VITE_GOOGLE_PLACES_API_KEY is set in address-autocomplete.tf
# because the dev key is different from the staging key

locals {
  frontend_secrets = {
    PROJECT_ID            = var.project_id
    VITE_SANDBOX_MODE     = terraform.workspace == "prd" ? "false" : "true"
    VITE_FUNCTIONS_REGION = var.gcp_region
    VITE_FIREBASE_CONFIG  = jsonencode({
      apiKey            = data.google_firebase_web_app_config.default.api_key
      authDomain        = data.google_firebase_web_app_config.default.auth_domain
      projectId         = var.project_id
      storageBucket     = data.google_firebase_web_app_config.default.storage_bucket
      messagingSenderId = data.google_firebase_web_app_config.default.messaging_sender_id
      appId             = google_firebase_web_app.default.app_id
    })
    SCRIPTS_TEST_DOMAINS        = var.email_test_domains
    CLOUD_FUNCTIONS_TRIGGER_TOKEN = random_password.cloud_functions_trigger_token.result
  }

  backend_secrets = {
    SHEETS_SHEET_ID                     = local.spreadsheet_id
    SHEETS_SERVICE_ACCOUNT_KEY          = base64decode(google_service_account_key.sheets.private_key)
    EMAIL_ENDPOINT                      = var.email_amazonses_email_endpoint
    EMAIL_USER                          = var.email_amazonses_smtp_user
    EMAIL_PASSWORD                      = var.email_amazonses_smtp_password
    EMAIL_FROM                          = local.email_from
    EMAIL_REPLY_TO                      = var.email_reply_to
    EMAIL_NOTIFY_TO                     = var.email_admin_notifications
    EMAIL_IGNORE_TEST_DOMAINS           = var.email_test_domains
    CLOUD_FUNCTIONS_TRIGGER_TOKEN       = random_password.cloud_functions_trigger_token.result
  }
}

####### SAVE DOPPLER FRONTEND SECRETS ########

# Save secrets to Doppler frontend config matching current terraform workspace (stg or prd)
resource "doppler_secret" "frontend_secrets" {
  for_each = local.frontend_secrets

  project = var.doppler_project
  config  = "${terraform.workspace}_frontend"
  name    = each.key
  value   = each.value
}

# Also save secrets to Doppler frontend dev config
# This only runs when working from stg workspace to avoid duplication
resource "doppler_secret" "frontend_secrets_dev" {
  for_each = terraform.workspace == "stg" ? local.frontend_secrets : {}

  project = var.doppler_project
  config  = "dev_frontend"
  name    = each.key
  value   = each.value
}

####### SAVE DOPPLER BACKEND SECRETS ########

# Save secrets to Doppler backend config matching current terraform workspace (stg or prd)
resource "doppler_secret" "backend_secrets" {
  for_each = local.backend_secrets

  project  = var.doppler_project
  config   = "${terraform.workspace}_backend"
  name     = each.key
  value    = each.value
}

# Also save secrets to Doppler backend dev config
# This only runs when working from stg workspace to avoid duplication
resource "doppler_secret" "backend_secrets_dev" {
  for_each = terraform.workspace == "stg" ? local.backend_secrets : {}

  project  = var.doppler_project
  config   = "dev_backend"
  name     = each.key
  value    = each.value
}
