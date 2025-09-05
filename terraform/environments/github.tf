# Create environment on the github repo matching the terraform workspace name (stg/prd)
resource "github_repository_environment" "env" {
  repository  = var.github_repo
  environment = terraform.workspace # stg|prd (matches github env name)
}

# Set project id for the environment (to be used in github actions)
resource "github_actions_environment_variable" "project_id" {
  repository      = var.github_repo
  environment     = terraform.workspace # stg|prd (matches github env name)
  variable_name   = "PROJECT_ID"
  value           = var.project_id

  depends_on      = [github_repository_environment.env]
}
