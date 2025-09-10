# Create an initial backend secret
resource "google_secret_manager_secret" "backend" {
  secret_id = "backend"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "backend_accessor" {
  secret_id = google_secret_manager_secret.backend.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

data "google_project" "current" {}
