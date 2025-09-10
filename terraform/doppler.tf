######## SETUP DOPPLER TOKENS REQUIRED BY GITHUB ACTIONS ########

# Create doppler service tokens for use by github actions
resource "doppler_service_token" "frontend" {
  project      = var.doppler_project
  config       = "${terraform.workspace}_frontend"
  name         = "github-actions ${terraform.workspace} frontend token"
  access       = "read"
}
resource "doppler_service_token" "backend" {
  project      = var.doppler_project
  config       = "${terraform.workspace}_backend"
  name         = "github-actions ${terraform.workspace} backend token"
  access       = "read"
}

# Set the tokens as github environment secrets for use by github actions
resource "github_actions_environment_secret" "frontend" {
  repository        = var.github_repo
  environment       = terraform.workspace # stg|prd (matches github env name)
  secret_name       = "DOPPLER_TOKEN_FRONTEND"
  plaintext_value   = doppler_service_token.frontend.key

  depends_on        = [doppler_service_token.frontend, github_repository_environment.env]
}
resource "github_actions_environment_secret" "backend" {
  repository        = var.github_repo
  environment       = terraform.workspace # stg|prd (matches github env name)
  secret_name       = "DOPPLER_TOKEN_BACKEND"
  plaintext_value   = doppler_service_token.backend.key

  depends_on        = [doppler_service_token.backend, github_repository_environment.env]
}


# ######## CREATE SERVICE ACCOUNT FOR GITHUB WORKFLOW DOPPLER -> GCP SECRET MANAGER MANUAL SYNC ########

# Create service account for use by github workflow to sync secrets
resource "google_service_account" "gcp_secret_manager" {
  account_id   = "gcp-secret-manager"
  display_name = "GCP Secret Manager"

  depends_on = [time_sleep.wait_for_apis]
}

# Grant the service account access to manage secrets in secret manager
resource "google_project_iam_member" "secret_manager_admin" {
  project = var.project_id
  role    = "roles/secretmanager.secretVersionAdder"
  member  = "serviceAccount:${google_service_account.gcp_secret_manager.email}"
}

# Create a key for the service account
resource "google_service_account_key" "gcp_secret_manager" {
  service_account_id = google_service_account.gcp_secret_manager.name
}

# Save the key to GitHub secret for use by github actions
resource "github_actions_environment_secret" "gcp_secret_manager_key" {
  repository        = var.github_repo
  environment       = terraform.workspace # stg|prd (matches github env name)
  secret_name       = "GCP_SECRET_MANAGER_KEY"
  plaintext_value   = base64decode(google_service_account_key.gcp_secret_manager.private_key)
}
