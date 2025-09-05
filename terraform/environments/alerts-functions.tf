# Create notification channel for email alerts
resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "Email Alerts"
  type         = "email"
  labels = {
    email_address = var.email_admin_notifications
  }

  depends_on = [google_project_service.apis]
}

# Alert for any firebase function v2 errors
resource "google_monitoring_alert_policy" "firebase_function_errors" {
  display_name = "Firebase Functions Errors"
  combiner     = "OR"
  
  conditions {
    display_name = "Function Errors"
    condition_matched_log {
      filter = "resource.type=\"cloud_run_revision\" AND (severity=\"ERROR\" OR textPayload:\"Your function timed out after\")"
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
  
  alert_strategy {
    notification_prompts = ["OPENED"]
    notification_rate_limit {
      period = "300s"
    }
  }
}
