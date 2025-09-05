# create frontend & backend doppler projects
resource "doppler_project" "frontend" {
  name     = var.doppler_project
}
resource "doppler_project" "backend" {
  name     = "${var.doppler_project}-backend"
}

# create dev/stg/prd environments on frontend & backend doppler projects
resource "doppler_environment" "frontend" {
  for_each = toset(["dev", "stg", "prd"])
  project  = doppler_project.frontend.name
  name     = each.key
  slug     = each.key
}
resource "doppler_environment" "backend" {
  for_each = toset(["dev", "stg", "prd"])
  project  = doppler_project.backend.name
  name     = each.key
  slug     = each.key
}
