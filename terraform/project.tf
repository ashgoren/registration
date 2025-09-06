import {
  to = google_project.project
  id = var.project_id
}

resource "google_project" "project" {
  name              = var.project_id
  project_id        = var.project_id
  billing_account   = var.gcp_billing_account_id
  org_id            = var.gcp_organization_id
}
