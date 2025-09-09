# This service account doesn't need any iam roles
# (The sheet will be directly shared with the service account email)

# Create service account for google sheets
resource "google_service_account" "sheets" {
  account_id   = "sheets"
  display_name = "Google Sheets API Service Account"

  depends_on = [time_sleep.wait_for_apis]
}

# Get key for the service account
resource "google_service_account_key" "sheets" {
  service_account_id = google_service_account.sheets.name
}
