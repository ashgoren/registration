# Enable required APIs

locals {
  required_apis = toset([
    "cloudfunctions.googleapis.com",
    "cloudbilling.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "billingbudgets.googleapis.com",
    "monitoring.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "eventarc.googleapis.com",
    "firebasehosting.googleapis.com",
    "logging.googleapis.com",
    "iam.googleapis.com",
    "pubsub.googleapis.com",
    "secretmanager.googleapis.com",
    "places.googleapis.com",
    "maps-backend.googleapis.com",
    "sheets.googleapis.com",
    "apikeys.googleapis.com",
  ])
}

resource "google_project_service" "apis" {
  for_each = local.required_apis

  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false

  depends_on = [google_project.project]
}

resource "time_sleep" "wait_for_apis" {
  create_duration = "2m"

  depends_on = [google_project_service.apis]
}
