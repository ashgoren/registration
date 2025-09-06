# Desired Doppler frontend project name (backend project will append -backend)
variable "doppler_project" {
  description = "Name of the Doppler project"
  type        = string
}

# set in Doppler and run terraform via doppler - e.g. doppler run -- terraform apply
variable "DOPPLER_TOKEN" {
  description = "Doppler API token"
  type        = string
}
