# create pub/sub topic "budget_alerts"
resource "google_pubsub_topic" "budget_alerts" {
  name = "budget_alerts"

  depends_on = [google_project_service.apis]
}

resource "google_billing_budget" "monitoring_budget" {
  billing_account = var.gcp_billing_account_id
  display_name    = "${var.project_id} Monitoring Budget"

  budget_filter {
    projects = ["projects/${data.google_project.project.number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "100"
    }
  }

  # Early warning thresholds
  threshold_rules {
    threshold_percent = 0.1
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.9
    spend_basis      = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.email.name]
  }

  depends_on = [google_project_service.apis]
}

resource "google_billing_budget" "shutdown_budget" {
  billing_account = var.gcp_billing_account_id
  display_name    = "${var.project_id} Shutdown Budget"

  budget_filter {
    projects = ["projects/${data.google_project.project.number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "100"
    }
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis      = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.email.name]
    pubsub_topic = google_pubsub_topic.budget_alerts.id
  }

  depends_on = [google_project_service.apis]
}

# Give the billing service account permission to publish to the topic
resource "google_pubsub_topic_iam_member" "budget_alerts" {
  topic  = google_pubsub_topic.budget_alerts.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:billing-budget-alert@system.gserviceaccount.com"

  depends_on = [google_project_service.apis]
}
