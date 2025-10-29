# GCP Project Configuration
gcp_project_id = "centering-vine-454613-b3"
gcp_region     = "us-central1"
environment    = "dev"

# Vertex AI Configuration
vertex_ai_location = "us-central1"

# Workload Identity (disabled for dev - using service account keys instead)
enable_workload_identity = false

# Bucket Lifecycle (days before deletion)
bucket_lifecycle_age_days = 90

# Resource Labels
labels = {
  managed_by  = "terraform"
  framework   = "versatil"
  component   = "ml-workflow"
  environment = "dev"
}
