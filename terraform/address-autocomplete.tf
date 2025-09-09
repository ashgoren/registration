# Create a single, environment-specific API key for Places and Maps
resource "google_apikeys_key" "places_maps" {
  name         = "places-maps-api-key-${terraform.workspace}"
  display_name = "Places and Maps API Key (${terraform.workspace})"
  project      = var.project_id

  restrictions {
    browser_key_restrictions {
      allowed_referrers = compact([
        "${var.project_id}.web.app/*",
        var.frontend_domain != "" ? "${var.frontend_domain}/*" : "",
        var.frontend_domain != "" ? "*.${var.frontend_domain}/*" : ""
      ])
    }
    api_targets { service = "places.googleapis.com" }
    api_targets { service = "maps-backend.googleapis.com" }
  }

  depends_on = [time_sleep.wait_for_apis]
}

# Save the key to the correct Doppler config for the current workspace
resource "doppler_secret" "places_maps_key" {
  project    = var.doppler_project
  config     = terraform.workspace # terraform workspace names match Doppler config environments
  name       = "VITE_GOOGLE_PLACES_API_KEY"
  value      = google_apikeys_key.places_maps.key_string
}


####### DEV KEY #######

# Also create a key for dev and save to Doppler dev config
# Only runs from the stg terraform workspace to avoid duplication
resource "google_apikeys_key" "places_maps_dev" {
  count        = terraform.workspace == "stg" ? 1 : 0

  name         = "places-maps-api-key-dev"
  display_name = "Places and Maps API Key (dev)"
  project      = var.project_id

  restrictions {
    browser_key_restrictions {
      allowed_referrers = ["localhost:3000/*", "localhost:5173/*"]
    }
    api_targets { service = "places.googleapis.com" }
    api_targets { service = "maps-backend.googleapis.com" }
  }

  depends_on = [time_sleep.wait_for_apis]
}

# Save the key to the dev Doppler config
# Only runs from the stg terraform workspace to avoid duplication
resource "doppler_secret" "places_maps_key_dev" {
  count      = terraform.workspace == "stg" ? 1 : 0

  project    = var.doppler_project
  config     = "dev"
  name       = "VITE_GOOGLE_PLACES_API_KEY"
  value      = google_apikeys_key.places_maps_dev[0].key_string
}
