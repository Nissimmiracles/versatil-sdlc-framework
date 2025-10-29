# GCP Infrastructure Setup - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Blocks Wave 2)
**Assigned**: Marcus-Backend
**Estimated**: 8h
**Wave**: 1 (Foundation Infrastructure)
**Created**: 2025-10-29

## Mission

Provision and configure Google Cloud Platform infrastructure for ML workflow automation including service accounts, IAM roles, Cloud Storage buckets, Workload Identity, and Vertex AI API enablement.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No Terraform configuration files in `infrastructure/terraform/`
- No GCP environment variables in `.env` files
- No GCP SDK dependencies in `package.json`
- No service account setup scripts

**Why This Blocks Other Work**:
- Vertex AI integration (Wave 2) needs service accounts with proper permissions
- Cloud Run deployments (Wave 3) need Workload Identity configuration
- Dataset storage needs Cloud Storage buckets
- Model artifacts need secure storage with versioning

## Requirements

### GCP Project Setup

**Prerequisites**:
- GCP project exists (or will be created)
- Billing account linked
- gcloud CLI installed and authenticated

### APIs to Enable

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  sql.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

### Service Accounts (3 Required)

#### 1. Vertex AI Service Account
```bash
# Name: vertex-ai-sa@<project-id>.iam.gserviceaccount.com
# Roles:
- roles/aiplatform.user (submit training jobs, deploy models)
- roles/storage.objectAdmin (read/write model artifacts)
- roles/logging.logWriter (write logs)
```

#### 2. Cloud Run Service Account
```bash
# Name: cloud-run-sa@<project-id>.iam.gserviceaccount.com
# Roles:
- roles/aiplatform.user (invoke predictions)
- roles/storage.objectViewer (read model artifacts)
- roles/cloudsql.client (connect to database)
```

#### 3. n8n Service Account
```bash
# Name: n8n-sa@<project-id>.iam.gserviceaccount.com
# Roles:
- roles/aiplatform.user (trigger workflows)
- roles/run.invoker (invoke Cloud Run services)
- roles/storage.objectAdmin (manage datasets)
```

### Cloud Storage Buckets (4 Required)

#### 1. Datasets Bucket
```bash
# Name: gs://<project-id>-ml-datasets
# Configuration:
- Location: us-central1 (same as Vertex AI)
- Storage class: Standard
- Versioning: Enabled
- Lifecycle: Archive after 90 days, delete after 365 days
```

#### 2. Models Bucket
```bash
# Name: gs://<project-id>-ml-models
# Configuration:
- Location: us-central1
- Storage class: Standard
- Versioning: Enabled (immutable versions)
- Lifecycle: Archive after 180 days
```

#### 3. Experiments Bucket
```bash
# Name: gs://<project-id>-ml-experiments
# Configuration:
- Location: us-central1
- Storage class: Nearline (cost optimization)
- Versioning: Disabled
- Lifecycle: Delete after 30 days
```

#### 4. Artifacts Bucket (Cloud Build)
```bash
# Name: gs://<project-id>-build-artifacts
# Configuration:
- Location: us-central1
- Storage class: Standard
- Versioning: Disabled
- Lifecycle: Delete after 7 days
```

### Workload Identity Configuration

**Purpose**: Allow Kubernetes pods (Cloud Run) to authenticate as GCP service accounts without keys

```bash
# Bind Cloud Run service account to Kubernetes service account
gcloud iam service-accounts add-iam-policy-binding \
  cloud-run-sa@<project-id>.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:<project-id>.svc.id.goog[default/cloud-run-ksa]"
```

### IAM Policies

**Principle of Least Privilege**:
- Each service account has minimal required permissions
- No Editor or Owner roles
- Custom roles for fine-grained control if needed

## Acceptance Criteria

- [ ] GCP project configured with billing enabled
- [ ] All 8 required APIs enabled
- [ ] 3 service accounts created with proper IAM roles
- [ ] 4 Cloud Storage buckets provisioned with lifecycle policies
- [ ] Workload Identity configured for Cloud Run
- [ ] Service account keys downloaded (for local development only)
- [ ] Terraform configuration files created in `infrastructure/terraform/`
- [ ] Environment variables documented in `.env.example`
- [ ] Setup script created (`scripts/setup-gcp.sh`)
- [ ] Teardown script created (`scripts/teardown-gcp.sh`) for dev/staging
- [ ] Cost estimation documented (expected $500-2000/month)
- [ ] Security audit passed (no overly permissive roles)

## Technical Approach

### Option 1: Terraform (Recommended)

**File Structure**:
```
infrastructure/terraform/
├── main.tf (provider, backend)
├── variables.tf (project_id, region)
├── service_accounts.tf (3 SAs)
├── storage.tf (4 buckets)
├── apis.tf (enable services)
├── iam.tf (role bindings)
└── outputs.tf (bucket names, SA emails)
```

**Benefits**:
- Infrastructure as Code (IaC)
- Reproducible across environments (dev, staging, prod)
- Version controlled
- State management

**Commands**:
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Option 2: gcloud CLI Script

**File**: `scripts/setup-gcp.sh`

**Benefits**:
- Simpler for small teams
- No Terraform state management
- Faster initial setup

**Cons**:
- Not idempotent
- Harder to track changes
- Manual state tracking

### Recommended: Terraform for production-grade infrastructure

## Environment Configuration

```env
# .env.example - GCP Configuration

# Project
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_ZONE=us-central1-a

# Service Accounts (emails)
VERTEX_AI_SA=vertex-ai-sa@your-project.iam.gserviceaccount.com
CLOUD_RUN_SA=cloud-run-sa@your-project.iam.gserviceaccount.com
N8N_SA=n8n-sa@your-project.iam.gserviceaccount.com

# Service Account Keys (local dev only - DO NOT COMMIT)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/vertex-ai-sa-key.json

# Cloud Storage
GCS_DATASETS_BUCKET=your-project-ml-datasets
GCS_MODELS_BUCKET=your-project-ml-models
GCS_EXPERIMENTS_BUCKET=your-project-ml-experiments
GCS_ARTIFACTS_BUCKET=your-project-build-artifacts

# Vertex AI
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_STAGING_BUCKET=gs://your-project-ml-experiments/staging
```

## Security Considerations

### Service Account Key Management
- **Production**: Use Workload Identity (NO keys)
- **Staging**: Use Workload Identity (NO keys)
- **Local Dev**: Use keys stored in `~/.gcp/` (NOT in repo)

### Bucket Security
- All buckets default to private (no public access)
- IAM conditions for time-based access if needed
- Enable uniform bucket-level access (no ACLs)

### Audit Logging
- Enable Cloud Audit Logs for all services
- Monitor IAM policy changes
- Alert on unusual API usage

## Cost Optimization

### Estimated Monthly Costs (Moderate Usage)

| Service | Usage | Cost |
|---------|-------|------|
| Vertex AI Training | 50 hours GPU | $200-500 |
| Vertex AI Predictions | 1M requests | $50-100 |
| Cloud Storage | 500GB datasets + 100GB models | $20-30 |
| Cloud Run | 5M requests | $10-20 |
| Cloud SQL | db-f1-micro instance | $50-100 |
| **Total** | | **$330-750/month** |

### Optimization Strategies
- Use preemptible instances for training (70% cheaper)
- Archive old datasets to Nearline/Coldline
- Delete experiment artifacts after 30 days
- Use Cloud Run autoscaling (min instances = 0)

## Testing Requirements

### Infrastructure Tests
- [ ] All APIs accessible
- [ ] Service accounts can authenticate
- [ ] Buckets writable by appropriate SAs
- [ ] Workload Identity bindings correct
- [ ] IAM policies enforce least privilege

### Integration Tests
```bash
# Test Vertex AI access
gcloud ai custom-jobs list --region=us-central1

# Test bucket write
echo "test" | gsutil cp - gs://${GCS_DATASETS_BUCKET}/test.txt

# Test service account impersonation
gcloud iam service-accounts keys create /tmp/test-key.json \
  --iam-account=vertex-ai-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com
```

## Dependencies

**Blocks**:
- 018-vertex-ai-integration.md (needs service accounts and buckets)
- 019-n8n-workflow-integration.md (needs n8n service account)
- 020-frontend-ui-components.md (needs Cloud Storage for uploads)

**Depends On**: None (can start immediately)

**Parallel with**: 014 (Database Schema), 016 (Feature Engineering)

## Files to Create

1. `infrastructure/terraform/main.tf` - Terraform config
2. `infrastructure/terraform/variables.tf` - Variables
3. `infrastructure/terraform/service_accounts.tf` - SA definitions
4. `infrastructure/terraform/storage.tf` - Bucket definitions
5. `infrastructure/terraform/iam.tf` - Role bindings
6. `scripts/setup-gcp.sh` - Manual setup script (fallback)
7. `scripts/teardown-gcp.sh` - Cleanup script
8. `docs/gcp-infrastructure.md` - Documentation
9. `.env.example` - Environment variables template

## Rollback Plan

### Terraform
```bash
terraform destroy
```

### Manual Cleanup
```bash
# Delete service accounts
gcloud iam service-accounts delete vertex-ai-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com

# Delete buckets (careful - data loss!)
gsutil -m rm -r gs://${GCS_DATASETS_BUCKET}
```

## Success Metrics

- [ ] Infrastructure provisioned in < 10 minutes
- [ ] All service accounts authenticate successfully
- [ ] All buckets accessible with correct permissions
- [ ] No overly permissive IAM roles detected
- [ ] Cost estimate validated against actual usage
- [ ] Documentation complete and tested

## Related Todos

- **Blocks**: Todos 018, 019, 020, 021, 022
- **Part of**: Wave 1 (Foundation Infrastructure)
- **Parallel with**: 014 (Database), 016 (Feature Engineering)

---

**Agent**: Marcus-Backend
**Auto-Activate**: YES (infrastructure expertise required)
**Estimated**: 8 hours
**Priority**: P1 (Critical path blocker)
