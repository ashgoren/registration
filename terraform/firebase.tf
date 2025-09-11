# Create the Firebase project resource
resource "google_firebase_project" "default" {
  provider    = google
  project     = var.project_id

  depends_on = [google_project_service.apis]
}

# Create the default Firestore database, which also sets the region for Firestore
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.gcp_region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.default]
}

# Create the Firebase Web App
resource "google_firebase_web_app" "default" {
  project       = var.project_id
  display_name  = var.project_id

  depends_on    = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "default" {
  project    = var.project_id
  web_app_id = google_firebase_web_app.default.app_id
}


###### SETUP FIREBASE HOSTING ######

# Create the Firebase hosting site
resource "google_firebase_hosting_site" "default" {
  project     = var.project_id
  site_id     = var.project_id
  app_id      = google_firebase_web_app.default.app_id

  depends_on = [google_firebase_project.default]
}

resource "google_service_account" "firebase_deploy" {
  account_id   = "firebase-deploy"
  display_name = "Firebase Deploy Service Account"

  depends_on = [google_project_service.apis]
}

resource "google_service_account_key" "firebase_deploy" {
  service_account_id = google_service_account.firebase_deploy.name
}

resource "google_project_iam_member" "firebasehosting_admin" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.firebase_deploy.email}"

  depends_on = [google_firebase_hosting_site.default]
}

resource "github_actions_environment_secret" "firebase_service_account" {
  repository      = var.github_repo
  environment     = terraform.workspace
  secret_name     = "FIREBASE_SERVICE_ACCOUNT"
  plaintext_value = base64decode(google_service_account_key.firebase_deploy.private_key)

  depends_on      = [github_repository_environment.env]
}


###### FIREBASE FUNCTIONS SERVICE ACCOUNT ######

locals {
  roles = [
    "roles/cloudfunctions.admin",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/iam.serviceAccountTokenCreator",
    "roles/cloudbuild.builds.editor",
    "roles/artifactregistry.writer",
    "roles/storage.admin",
    "roles/eventarc.admin",
    "roles/pubsub.admin",
    "roles/datastore.user",
    "roles/secretmanager.admin",
    "roles/logging.logWriter",
    "roles/cloudscheduler.admin",
    "roles/firebaserules.admin",
    "roles/datastore.indexAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/monitoring.admin",
    "roles/firebaseextensions.developer"
  ]
}

resource "google_service_account" "firebase_functions" {
  account_id   = "firebase-functions"
  display_name = "Firebase Functions Service Account"

  depends_on = [google_project_service.apis]
}

resource "google_service_account_key" "firebase_functions" {
  service_account_id = google_service_account.firebase_functions.name
}

resource "google_project_iam_member" "firebase_functions" {
  for_each = toset(local.roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.firebase_functions.email}"
}

resource "github_actions_environment_secret" "firebase_functions_service_account" {
  repository      = var.github_repo
  environment     = terraform.workspace
  secret_name     = "FIREBASE_FUNCTIONS_SERVICE_ACCOUNT"
  plaintext_value = base64decode(google_service_account_key.firebase_functions.private_key)

  depends_on      = [github_repository_environment.env]
}
