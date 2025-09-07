terraform {
  required_providers {
    google = {
      source  = "hashicorp/google-beta"
      version = "~> 7.0"
    }
    doppler = {
      source  = "dopplerhq/doppler"
      version = "~> 1.2"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.6"
    }
  }
}

# to authenticate via cli: gcloud auth application-default login
provider "google" {
  project = var.project_id
  region  = var.gcp_region
  user_project_override = true
  billing_project = var.project_id
}

# provide as environment variable
provider "doppler" {
  doppler_token = var.DOPPLER_TOKEN
}

# to authenticate via cli: gh auth login
provider "github" {}
