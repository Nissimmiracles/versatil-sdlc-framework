# Service Account for Vertex AI operations
resource "google_service_account" "vertex_ai" {
  account_id   = "vertex-ai-sa-${var.environment}"
  display_name = "Vertex AI Service Account (${var.environment})"
  description  = "Service account for Vertex AI training jobs, model deployment, and predictions"
  project      = var.gcp_project_id
}

# IAM roles for Vertex AI service account
resource "google_project_iam_member" "vertex_ai_roles" {
  for_each = toset([
    "roles/aiplatform.user",           # Vertex AI operations
    "roles/storage.objectAdmin",       # Access to training data and model artifacts
    "roles/logging.logWriter",         # Write logs
    "roles/monitoring.metricWriter"    # Write metrics
  ])

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vertex_ai.email}"

  depends_on = [google_project_service.required_apis]
}

# Service Account for Cloud Run services
resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-sa-${var.environment}"
  display_name = "Cloud Run Service Account (${var.environment})"
  description  = "Service account for Cloud Run ML prediction services"
  project      = var.gcp_project_id
}

# IAM roles for Cloud Run service account
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/aiplatform.user",           # Call Vertex AI endpoints
    "roles/storage.objectViewer",      # Read model artifacts
    "roles/logging.logWriter",         # Write logs
    "roles/monitoring.metricWriter"    # Write metrics
  ])

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"

  depends_on = [google_project_service.required_apis]
}

# Service Account for n8n workflows
resource "google_service_account" "n8n" {
  account_id   = "n8n-sa-${var.environment}"
  display_name = "n8n Workflow Service Account (${var.environment})"
  description  = "Service account for n8n to orchestrate ML workflows"
  project      = var.gcp_project_id
}

# IAM roles for n8n service account
resource "google_project_iam_member" "n8n_roles" {
  for_each = toset([
    "roles/aiplatform.user",           # Trigger Vertex AI jobs
    "roles/run.invoker",               # Invoke Cloud Run services
    "roles/storage.objectAdmin",       # Manage workflow artifacts
    "roles/logging.logWriter"          # Write logs
  ])

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.n8n.email}"

  depends_on = [google_project_service.required_apis]
}

# Service account keys (for local development only - avoid in production)
resource "google_service_account_key" "vertex_ai_key" {
  count = var.environment == "dev" ? 1 : 0

  service_account_id = google_service_account.vertex_ai.name
}

resource "google_service_account_key" "cloud_run_key" {
  count = var.environment == "dev" ? 1 : 0

  service_account_id = google_service_account.cloud_run.name
}

resource "google_service_account_key" "n8n_key" {
  count = var.environment == "dev" ? 1 : 0

  service_account_id = google_service_account.n8n.name
}
