# Workload Identity configuration for Cloud Run
# This allows Cloud Run services to authenticate as service accounts without key files

resource "google_service_account_iam_member" "workload_identity_vertex_ai" {
  count = var.enable_workload_identity ? 1 : 0

  service_account_id = google_service_account.vertex_ai.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[default/vertex-ai-sa]"
}

resource "google_service_account_iam_member" "workload_identity_cloud_run" {
  count = var.enable_workload_identity ? 1 : 0

  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[default/cloud-run-sa]"
}

resource "google_service_account_iam_member" "workload_identity_n8n" {
  count = var.enable_workload_identity ? 1 : 0

  service_account_id = google_service_account.n8n.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[default/n8n-sa]"
}

# Allow service accounts to impersonate each other (for workflow orchestration)
resource "google_service_account_iam_member" "n8n_impersonate_vertex_ai" {
  service_account_id = google_service_account.vertex_ai.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.n8n.email}"
}

resource "google_service_account_iam_member" "n8n_impersonate_cloud_run" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.n8n.email}"
}

# IAM binding for Cloud Run to invoke Vertex AI
resource "google_project_iam_member" "cloud_run_vertex_ai_invoker" {
  project = var.gcp_project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
