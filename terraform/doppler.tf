######## SETUP DOPPLER TOKEN NEEDED BY GITHUB ACTIONS ########

# Create doppler frontend project service token for use by github actions
resource "doppler_service_token" "frontend" {
  project  = var.doppler_project
  config   = terraform.workspace # stg|prd (matches doppler environment name)
  name     = "github-actions ${terraform.workspace} token"
  access   = "read"

  # depends_on = [doppler_environment.frontend]
}

# Set the above as github environment secret for use by github actions
resource "github_actions_environment_secret" "frontend" {
  repository        = var.github_repo
  environment       = terraform.workspace # stg|prd (matches github env name)
  secret_name       = "DOPPLER_TOKEN"
  plaintext_value   = doppler_service_token.frontend.key

  depends_on      = [doppler_service_token.frontend, github_repository_environment.env]
}


######## SETUP DOPPLER GCP SECRET MANAGER INTEGRATION ########

# Create service account for use by doppler gcp secret manager integration
resource "google_service_account" "doppler_secret_manager" {
  account_id   = "doppler-secret-manager"
  display_name = "Doppler Secret Manager"
}

# Grant the service account access to manage secrets in secret manager
resource "google_project_iam_member" "secret_manager_admin" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.doppler_secret_manager.email}"
}

# Create a key for the service account to use in doppler gcp secret manager integration
resource "google_service_account_key" "doppler_secret_manager" {
  service_account_id = google_service_account.doppler_secret_manager.name
}

# setup doppler -> google cloud secret manager integration for backend doppler project (part 1)
resource "doppler_integration_gcp_secret_manager" "backend" {
  name              = "gcp-secret-manager-integration-${terraform.workspace}"
  gcp_key           = base64decode(google_service_account_key.doppler_secret_manager.private_key)
  gcp_secret_prefix = ""
}

# setup doppler -> google cloud secret manager integration for backend doppler project (part 2)
resource "doppler_secrets_sync_gcp_secret_manager" "backend" {
  integration = doppler_integration_gcp_secret_manager.backend.id
  project     = local.doppler_project_backend
  config      = terraform.workspace # stg|prd (matches doppler environment name)

  sync_strategy = "single-secret"
  name         = "backend"
  regions     = ["automatic"]

  delete_behavior = "delete_from_target"

  # don't allow any secrets to be synced until the secret-manager-cleanup cloud function is deployed
  # (to avoid charges for stale secret versions)
  depends_on = [google_cloudfunctions2_function.secret_cleanup]
}
