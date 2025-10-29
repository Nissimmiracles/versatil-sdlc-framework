# GCP Infrastructure for ML Workflow Automation

This directory contains Terraform configuration and automation scripts for deploying the complete GCP infrastructure required for VERSATIL ML workflow automation.

## 📋 Overview

The infrastructure includes:

- **8 GCP APIs**: Vertex AI, Cloud Run, Cloud Storage, Compute, IAM, Cloud Build, Secret Manager, Logging
- **3 Service Accounts**: vertex-ai-sa, cloud-run-sa, n8n-sa (with appropriate IAM roles)
- **4 Cloud Storage Buckets**: datasets, models, training artifacts, n8n workflows
- **IAM Bindings**: Workload Identity, service account impersonation, bucket access
- **Lifecycle Policies**: Automated data retention (90 days default)

## 🚀 Quick Start

### Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** ([install](https://cloud.google.com/sdk/docs/install))
3. **Terraform** >= 1.0 ([install](https://www.terraform.io/downloads))
4. **Project Owner** or **Editor** role in your GCP project

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script (handles everything)
./scripts/setup-gcp.sh

# Follow the prompts:
# 1. Authenticate with GCP
# 2. Enter your Project ID
# 3. Select region (default: us-central1)
# 4. Select environment (dev/staging/prod)
# 5. Review and approve Terraform plan
# 6. Wait 5-10 minutes for deployment
```

**What it does**:
- Authenticates with GCP
- Enables all required APIs
- Creates `terraform.tfvars` configuration
- Runs `terraform init`, `plan`, and `apply`
- Generates `.env.gcp` with environment variables

### Option 2: Manual Setup

```bash
# 1. Authenticate
gcloud auth login
gcloud auth application-default login

# 2. Set project
gcloud config set project YOUR_PROJECT_ID

# 3. Enable APIs manually
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
# ... (see scripts/setup-gcp.sh for full list)

# 4. Create terraform.tfvars
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 5. Deploy with Terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## 📁 Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf                    # Provider, API enablement
│   ├── variables.tf               # Input variables with validation
│   ├── service_accounts.tf        # 3 service accounts + IAM roles
│   ├── storage.tf                 # 4 Cloud Storage buckets
│   ├── iam.tf                     # Workload Identity, impersonation
│   ├── outputs.tf                 # Resource outputs + .env generation
│   ├── terraform.tfvars.example   # Configuration template
│   └── terraform.tfvars           # Your configuration (gitignored)
└── README.md                      # This file

scripts/
├── setup-gcp.sh                   # Automated setup script
├── teardown-gcp.sh                # Automated teardown script
└── validate-gcp.sh                # Infrastructure validation script
```

## 🔧 Configuration

### terraform.tfvars

```hcl
# Required
gcp_project_id = "your-project-id"
gcp_region     = "us-central1"
environment    = "dev"

# Optional
vertex_ai_location = "us-central1"
enable_workload_identity = true
bucket_lifecycle_age_days = 90

labels = {
  managed_by = "terraform"
  framework  = "versatil"
  component  = "ml-workflow"
}
```

### Environment Variables

After deployment, add these to your `.env` file (generated in `.env.gcp`):

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_ENVIRONMENT=dev

# Service Accounts
VERTEX_AI_SA=vertex-ai-sa-dev@your-project-id.iam.gserviceaccount.com
CLOUD_RUN_SA=cloud-run-sa-dev@your-project-id.iam.gserviceaccount.com
N8N_SA=n8n-sa-dev@your-project-id.iam.gserviceaccount.com

# Storage Buckets
GCS_DATASETS_BUCKET=your-project-id-ml-datasets-dev
GCS_MODELS_BUCKET=your-project-id-ml-models-dev
GCS_TRAINING_BUCKET=your-project-id-ml-training-dev
GCS_N8N_BUCKET=your-project-id-n8n-workflows-dev

# Vertex AI
VERTEX_AI_LOCATION=us-central1
```

## ✅ Validation

### Option 1: Automated Validation

```bash
./scripts/validate-gcp.sh
```

**Checks**:
- ✅ 8 GCP APIs enabled
- ✅ 3 service accounts exist
- ✅ 4 Cloud Storage buckets exist
- ✅ IAM permissions configured
- ✅ Connectivity to Vertex AI and Cloud Storage

### Option 2: Manual Validation

```bash
# Check APIs
gcloud services list --enabled | grep -E 'aiplatform|run|storage'

# Check service accounts
gcloud iam service-accounts list

# Check buckets
gsutil ls

# Check IAM bindings
gcloud projects get-iam-policy YOUR_PROJECT_ID

# Test Vertex AI
gcloud ai custom-jobs list --region=us-central1

# Test Cloud Storage
gsutil ls gs://YOUR_PROJECT_ID-ml-datasets-dev
```

## 📊 Resource Details

### Service Accounts

| Name | Purpose | IAM Roles |
|------|---------|-----------|
| **vertex-ai-sa** | Vertex AI operations | `aiplatform.user`, `storage.objectAdmin`, `logging.logWriter`, `monitoring.metricWriter` |
| **cloud-run-sa** | Cloud Run ML services | `aiplatform.user`, `storage.objectViewer`, `logging.logWriter`, `monitoring.metricWriter` |
| **n8n-sa** | n8n workflow orchestration | `aiplatform.user`, `run.invoker`, `storage.objectAdmin`, `logging.logWriter` |

### Cloud Storage Buckets

| Bucket | Purpose | Versioning | Lifecycle |
|--------|---------|------------|-----------|
| **ml-datasets** | Training/test datasets | ✅ Enabled | 90 days, keep 3 versions |
| **ml-models** | Trained models | ✅ Enabled | 180 days (2x datasets) |
| **ml-training** | Training logs/metrics | ❌ Disabled | 45 days (0.5x datasets) |
| **n8n-workflows** | n8n artifacts | ✅ Enabled | No expiration |

### Enabled APIs

1. **aiplatform.googleapis.com** - Vertex AI training, deployment, prediction
2. **run.googleapis.com** - Cloud Run for ML services
3. **storage.googleapis.com** - Cloud Storage for data/models
4. **compute.googleapis.com** - Compute resources for Cloud Run
5. **iam.googleapis.com** - IAM for service accounts
6. **cloudbuild.googleapis.com** - Cloud Build for containers
7. **secretmanager.googleapis.com** - Secret Manager for credentials
8. **logging.googleapis.com** - Cloud Logging for observability

## 💰 Cost Estimation

### Monthly Costs (Approximate)

**Development Environment** (low usage):
- Cloud Storage: $10-20 (< 100GB)
- Vertex AI: $50-100 (minimal training)
- Cloud Run: $5-10 (low traffic)
- **Total**: ~$65-130/month

**Production Environment** (medium usage):
- Cloud Storage: $50-150 (< 1TB)
- Vertex AI: $500-1,500 (regular training)
- Cloud Run: $50-200 (moderate traffic)
- **Total**: ~$600-1,850/month

**Cost Optimization**:
- Use lifecycle policies (default 90 days)
- Enable versioning (only keep 3 versions)
- Use spot instances for training (60-91% cheaper)
- Set budget alerts in GCP Console

## 🗑️ Teardown

### Option 1: Automated Teardown

```bash
./scripts/teardown-gcp.sh

# Type 'DELETE' to confirm (all data will be lost!)
```

**⚠️ WARNING**: This deletes:
- All service accounts
- All Cloud Storage buckets (including data)
- All IAM bindings
- Local Terraform state

### Option 2: Manual Teardown

```bash
cd infrastructure/terraform
terraform destroy

# Confirm with 'yes'
```

### Partial Teardown

To keep some resources:

```bash
# Remove specific resources from state
terraform state rm google_storage_bucket.datasets

# Then destroy
terraform destroy
```

## 🔒 Security Best Practices

1. **Service Account Keys** (dev only):
   - Never commit keys to git (`.gitignore` includes `*.json`)
   - Rotate keys every 90 days
   - Use Workload Identity in production (no key files)

2. **IAM Permissions** (least privilege):
   - Each service account has only required roles
   - No `roles/owner` or `roles/editor` granted
   - Use custom roles for finer control if needed

3. **Bucket Access** (private by default):
   - Uniform bucket-level access enabled
   - No public access allowed
   - Lifecycle policies prevent indefinite storage

4. **Workload Identity** (production):
   - Enabled by default (`enable_workload_identity = true`)
   - No service account keys needed in production
   - Automatic token rotation

## 🐛 Troubleshooting

### API Enablement Errors

```bash
# Error: API not enabled
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

### Permission Errors

```bash
# Error: Insufficient permissions
# Solution: Ensure you have Owner or Editor role
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Terraform State Lock

```bash
# Error: State locked
# Solution: Break lock (use with caution)
terraform force-unlock LOCK_ID
```

### Bucket Already Exists

```bash
# Error: Bucket already exists
# Solution: Use unique project ID or change bucket names in storage.tf
```

### Service Account Key Errors (dev only)

```bash
# Error: Cannot create key
# Solution: Check if 10 keys already exist (GCP limit)
gcloud iam service-accounts keys list --iam-account=ACCOUNT_EMAIL
```

## 📚 Related Documentation

- [todos/015-pending-p1-gcp-infrastructure-setup.md](../todos/015-pending-p1-gcp-infrastructure-setup.md) - Detailed specification
- [VERIFICATION_REPORT.md](../VERIFICATION_REPORT.md) - Implementation status
- [ML_WORKFLOW_IMPLEMENTATION_STATUS.md](../ML_WORKFLOW_IMPLEMENTATION_STATUS.md) - Overall ML project status

## 🎯 Next Steps

After successful deployment:

1. ✅ **Verify infrastructure**: `./scripts/validate-gcp.sh`
2. ✅ **Update .env file**: Copy variables from `.env.gcp`
3. ⏳ **Database schema**: Implement [todos/014](../todos/014-pending-p1-database-schema-implementation.md)
4. ⏳ **Feature engineering**: Implement [todos/016](../todos/016-pending-p1-feature-engineering-pipeline.md)
5. ⏳ **Backend API**: Implement [todos/017](../todos/017-pending-p1-backend-api-development.md)

## 📊 Deployment Status

- **Created**: 2025-10-29
- **Version**: 1.0.0
- **Terraform**: >= 1.0
- **Provider**: `hashicorp/google` ~> 5.0
- **Tested**: ❌ Not yet deployed

## 💡 Tips

- **Use dev environment first**: Test deployment with `environment = "dev"`
- **Enable billing alerts**: Set budget in GCP Console
- **Monitor costs**: Use GCP Cost Management dashboard
- **Version control**: Commit Terraform state to secure remote backend (GCS, S3)
- **Team collaboration**: Use Terraform Cloud or remote state for multi-user
