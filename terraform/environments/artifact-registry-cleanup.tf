# Manually create artifact registry so as to set cleanup policy
resource "google_artifact_registry_repository" "gcf_artifacts" {
  location      = var.region  # or your specific region
  repository_id = "gcf-artifacts"
  description   = "Cloud Functions build artifacts"
  format        = "DOCKER"
  
  cleanup_policy_dry_run = false
  
  cleanup_policies {
    id     = "delete-old-build-artifacts"
    action = "DELETE"
    condition {
      older_than = "1d"
    }
  }
}
