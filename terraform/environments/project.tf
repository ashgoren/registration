# create google cloud project on command line, link with billing account, then import into terraform
# 
# gcloud projects create <PROJECT_ID>
# gcloud billing projects link <PROJECT_ID> --billing-account=<BILLING_ACCOUNT_ID>
# gcloud services enable cloudresourcemanager.googleapis.com serviceusage.googleapis.com cloudbilling.googleapis.com apikeys.googleapis.com --project=<PROJECT_ID>
# if stale state issue, first run: terraform state rm google_project.project
# terraform import -var-file=stg.tfvars google_project.project <PROJECT_ID>
# 
resource "google_project" "project" {
  name              = var.project_id
  project_id        = var.project_id
  billing_account   = var.billing_account_id
  org_id            = var.organization_id
}
