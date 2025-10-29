terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Enable required GCP APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",      # Vertex AI
    "run.googleapis.com",             # Cloud Run
    "storage.googleapis.com",         # Cloud Storage
    "compute.googleapis.com",         # Compute Engine (for Cloud Run)
    "iam.googleapis.com",             # IAM
    "cloudbuild.googleapis.com",      # Cloud Build
    "secretmanager.googleapis.com",   # Secret Manager
    "logging.googleapis.com"          # Cloud Logging
  ])

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false

  timeouts {
    create = "30m"
    update = "30m"
  }
}
