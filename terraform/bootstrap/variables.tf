# Desired Doppler frontend project name (backend project will append -backend)
variable "doppler_project" {
  description = "Name of the Doppler project"
  type        = string
}

# To find this: doppler configure get token
variable "doppler_token" {
  description = "Doppler API token"
  type        = string
}
