variable "gcp_project_id" {
  description = "GCP Project ID for ML workflow infrastructure"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.gcp_project_id))
    error_message = "Project ID must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "gcp_region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "us-central1"

  validation {
    condition     = can(regex("^[a-z]+-[a-z]+[0-9]$", var.gcp_region))
    error_message = "Region must be a valid GCP region (e.g., us-central1, europe-west1)."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "vertex_ai_location" {
  description = "Location for Vertex AI resources"
  type        = string
  default     = "us-central1"
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity for Cloud Run"
  type        = bool
  default     = true
}

variable "bucket_lifecycle_age_days" {
  description = "Days before objects are deleted (lifecycle policy)"
  type        = number
  default     = 90

  validation {
    condition     = var.bucket_lifecycle_age_days >= 1 && var.bucket_lifecycle_age_days <= 365
    error_message = "Lifecycle age must be between 1 and 365 days."
  }
}

variable "labels" {
  description = "Common labels for all resources"
  type        = map(string)
  default = {
    managed_by = "terraform"
    framework  = "versatil"
    component  = "ml-workflow"
  }
}
