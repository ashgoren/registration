terraform {
  required_providers {
    doppler = {
      source  = "dopplerhq/doppler"
      version = "~> 1.2"
    }
  }
}

# to authenticate, enter cli token in tfvars file
# to retrieve cli token: doppler configure get token
provider "doppler" {
  doppler_token = var.doppler_token
}
