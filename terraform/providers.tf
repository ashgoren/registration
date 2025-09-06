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

# to authenticate, enter cli token in tfvars file
# to retrieve cli token: doppler configure get token
provider "doppler" {
  alias         = "frontend"
  doppler_token = var.DOPPLER_TOKEN_FRONTEND
}

provider "doppler" {
  alias         = "backend" 
  doppler_token = var.DOPPLER_TOKEN_BACKEND
}

# to authenticate via cli: gh auth login
provider "github" {}
