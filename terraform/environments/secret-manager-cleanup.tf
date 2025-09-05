###### SETUP PUB/SUB TOPIC AND LOGGING SINK ########

# create pub/sub topic "secret_created"
resource "google_pubsub_topic" "secret_created" {
  name = "secret_created"

  depends_on = [google_project_service.apis]
}

# create logging sink that publishes to that topic when a secret version is added
resource "google_logging_project_sink" "secret_created" {
  name        = "secret_created_sink"
  destination = "pubsub.googleapis.com/projects/${var.project_id}/topics/${google_pubsub_topic.secret_created.name}"
  unique_writer_identity = true 
  filter = <<EOF
protoPayload.serviceName="secretmanager.googleapis.com"
AND protoPayload.methodName="google.cloud.secretmanager.v1.SecretManagerService.AddSecretVersion"
EOF
}

# give the logging sink permission to publish to the topic
resource "google_pubsub_topic_iam_member" "secret_created" {
  topic  = google_pubsub_topic.secret_created.name
  role   = "roles/pubsub.publisher"
  member = google_logging_project_sink.secret_created.writer_identity

  depends_on = [google_project_service.apis]
}


###### CLOUD FUNCTION TO CLEANUP OLD SECRET VERSIONS ########

# Archive the function code
data "archive_file" "secret_cleanup_source" {
  type        = "zip"
  output_path = "${path.module}/tmp/secret-manager-cleanup.zip"
  source_dir  = "${path.module}/../../cloud-functions/secret-manager-cleanup/"
}

# Storage bucket for function source code
resource "google_storage_bucket" "function_source" {
  name     = "${var.project_id}-function-source"
  location = var.region
}

# Upload the zipped function to storage
resource "google_storage_bucket_object" "secret_cleanup_zip" {
  name   = "secret-cleanup-${data.archive_file.secret_cleanup_source.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.secret_cleanup_source.output_path
}

# Service account for the function
resource "google_service_account" "secret_cleanup" {
  account_id   = "secret-manager-cleanup"
  display_name = "Secret Manager Cleanup Function"
}

# Grant the service account permission to manage secrets
resource "google_project_iam_member" "function_secret_access" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.secret_cleanup.email}"
}

# Create the Cloud Function
resource "google_cloudfunctions2_function" "secret_cleanup" {
  name        = "secret-manager-cleanup"
  location    = var.region
  description = "Cleanup old versions of secrets in Google Cloud Secret Manager"

  build_config {
    runtime     = "nodejs20"
    entry_point = "onSecretVersionHandler"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.secret_cleanup_zip.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    available_memory      = "256M"
    timeout_seconds       = 60
    service_account_email = google_service_account.secret_cleanup.email
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.secret_created.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  depends_on = [
    google_project_service.apis,
    google_pubsub_topic_iam_member.secret_created,
    google_artifact_registry_repository.gcf_artifacts
  ]
}
