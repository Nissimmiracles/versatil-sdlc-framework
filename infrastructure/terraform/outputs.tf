output "project_id" {
  description = "GCP Project ID"
  value       = var.gcp_project_id
}

output "region" {
  description = "GCP Region"
  value       = var.gcp_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Service Account Outputs
output "vertex_ai_service_account_email" {
  description = "Email of Vertex AI service account"
  value       = google_service_account.vertex_ai.email
}

output "cloud_run_service_account_email" {
  description = "Email of Cloud Run service account"
  value       = google_service_account.cloud_run.email
}

output "n8n_service_account_email" {
  description = "Email of n8n service account"
  value       = google_service_account.n8n.email
}

# Service Account Keys (dev only - sensitive)
output "vertex_ai_service_account_key" {
  description = "Base64-encoded private key for Vertex AI service account (dev only)"
  value       = var.environment == "dev" ? google_service_account_key.vertex_ai_key[0].private_key : null
  sensitive   = true
}

output "cloud_run_service_account_key" {
  description = "Base64-encoded private key for Cloud Run service account (dev only)"
  value       = var.environment == "dev" ? google_service_account_key.cloud_run_key[0].private_key : null
  sensitive   = true
}

output "n8n_service_account_key" {
  description = "Base64-encoded private key for n8n service account (dev only)"
  value       = var.environment == "dev" ? google_service_account_key.n8n_key[0].private_key : null
  sensitive   = true
}

# Storage Bucket Outputs
output "datasets_bucket_name" {
  description = "Name of datasets storage bucket"
  value       = google_storage_bucket.datasets.name
}

output "datasets_bucket_url" {
  description = "URL of datasets storage bucket"
  value       = google_storage_bucket.datasets.url
}

output "models_bucket_name" {
  description = "Name of models storage bucket"
  value       = google_storage_bucket.models.name
}

output "models_bucket_url" {
  description = "URL of models storage bucket"
  value       = google_storage_bucket.models.url
}

output "training_artifacts_bucket_name" {
  description = "Name of training artifacts storage bucket"
  value       = google_storage_bucket.training_artifacts.name
}

output "training_artifacts_bucket_url" {
  description = "URL of training artifacts storage bucket"
  value       = google_storage_bucket.training_artifacts.url
}

output "n8n_workflows_bucket_name" {
  description = "Name of n8n workflows storage bucket"
  value       = google_storage_bucket.n8n_workflows.name
}

output "n8n_workflows_bucket_url" {
  description = "URL of n8n workflows storage bucket"
  value       = google_storage_bucket.n8n_workflows.url
}

# API Enablement Status
output "enabled_apis" {
  description = "List of enabled GCP APIs"
  value = [
    "aiplatform.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "logging.googleapis.com"
  ]
}

# Workload Identity Status
output "workload_identity_enabled" {
  description = "Whether Workload Identity is enabled"
  value       = var.enable_workload_identity
}

# Summary for .env file generation
output "env_vars_summary" {
  description = "Environment variables to add to .env file"
  value = <<-EOT
    # GCP Configuration
    GCP_PROJECT_ID=${var.gcp_project_id}
    GCP_REGION=${var.gcp_region}
    GCP_ENVIRONMENT=${var.environment}

    # Service Accounts
    VERTEX_AI_SA=${google_service_account.vertex_ai.email}
    CLOUD_RUN_SA=${google_service_account.cloud_run.email}
    N8N_SA=${google_service_account.n8n.email}

    # Storage Buckets
    GCS_DATASETS_BUCKET=${google_storage_bucket.datasets.name}
    GCS_MODELS_BUCKET=${google_storage_bucket.models.name}
    GCS_TRAINING_BUCKET=${google_storage_bucket.training_artifacts.name}
    GCS_N8N_BUCKET=${google_storage_bucket.n8n_workflows.name}

    # Vertex AI
    VERTEX_AI_LOCATION=${var.vertex_ai_location}
  EOT
}
