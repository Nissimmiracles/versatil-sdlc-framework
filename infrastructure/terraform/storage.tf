# Cloud Storage bucket for ML datasets
resource "google_storage_bucket" "datasets" {
  name          = "${var.gcp_project_id}-ml-datasets-${var.environment}"
  location      = var.gcp_region
  project       = var.gcp_project_id
  force_destroy = var.environment == "dev"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.bucket_lifecycle_age_days
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  labels = merge(var.labels, {
    bucket_type = "datasets"
    environment = var.environment
  })

  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for trained models
resource "google_storage_bucket" "models" {
  name          = "${var.gcp_project_id}-ml-models-${var.environment}"
  location      = var.gcp_region
  project       = var.gcp_project_id
  force_destroy = var.environment == "dev"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.bucket_lifecycle_age_days * 2  # Keep models longer
    }
    action {
      type = "Delete"
    }
  }

  labels = merge(var.labels, {
    bucket_type = "models"
    environment = var.environment
  })

  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for training artifacts (logs, metrics, checkpoints)
resource "google_storage_bucket" "training_artifacts" {
  name          = "${var.gcp_project_id}-ml-training-${var.environment}"
  location      = var.gcp_region
  project       = var.gcp_project_id
  force_destroy = var.environment == "dev"

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = var.bucket_lifecycle_age_days / 2  # Shorter retention for training logs
    }
    action {
      type = "Delete"
    }
  }

  labels = merge(var.labels, {
    bucket_type = "training"
    environment = var.environment
  })

  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for n8n workflow artifacts
resource "google_storage_bucket" "n8n_workflows" {
  name          = "${var.gcp_project_id}-n8n-workflows-${var.environment}"
  location      = var.gcp_region
  project       = var.gcp_project_id
  force_destroy = var.environment == "dev"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  labels = merge(var.labels, {
    bucket_type = "workflows"
    environment = var.environment
  })

  depends_on = [google_project_service.required_apis]
}

# IAM bindings for bucket access
resource "google_storage_bucket_iam_member" "datasets_vertex_ai" {
  bucket = google_storage_bucket.datasets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vertex_ai.email}"
}

resource "google_storage_bucket_iam_member" "models_vertex_ai" {
  bucket = google_storage_bucket.models.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vertex_ai.email}"
}

resource "google_storage_bucket_iam_member" "training_vertex_ai" {
  bucket = google_storage_bucket.training_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vertex_ai.email}"
}

resource "google_storage_bucket_iam_member" "workflows_n8n" {
  bucket = google_storage_bucket.n8n_workflows.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.n8n.email}"
}
