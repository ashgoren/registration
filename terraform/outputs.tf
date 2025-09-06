output "google_firebase_project" {
  value       = google_firebase_project.default.project
}

output "sheets_service_account_email" {
  value = google_service_account.sheets.email
}
