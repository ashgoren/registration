# Generate a random token for triggering cloud functions from local scripts
resource "random_password" "cloud_functions_trigger_token" {
  length           = 32
}
