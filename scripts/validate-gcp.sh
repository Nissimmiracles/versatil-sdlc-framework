#!/bin/bash
set -euo pipefail

# GCP Infrastructure Validation Script
# Verifies that all resources are properly configured

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== VERSATIL ML Workflow - GCP Infrastructure Validation ===${NC}\n"

# Get project ID from terraform.tfvars or prompt
if [ -f "infrastructure/terraform/terraform.tfvars" ]; then
    PROJECT_ID=$(grep gcp_project_id infrastructure/terraform/terraform.tfvars | cut -d'"' -f2)
    REGION=$(grep gcp_region infrastructure/terraform/terraform.tfvars | cut -d'"' -f2)
else
    read -p "Enter GCP Project ID: " PROJECT_ID
    read -p "Enter GCP Region: " REGION
fi

echo "📦 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo ""

# Set project
gcloud config set project "$PROJECT_ID" --quiet

# Validation counters
PASSED=0
FAILED=0

# Function to check resource
check_resource() {
    local name=$1
    local command=$2

    echo -n "   Checking $name... "
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✅${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC}"
        ((FAILED++))
    fi
}

# 1. Check APIs
echo "🔌 Validating GCP APIs..."
check_resource "Vertex AI API" "gcloud services list --enabled | grep aiplatform.googleapis.com"
check_resource "Cloud Run API" "gcloud services list --enabled | grep run.googleapis.com"
check_resource "Cloud Storage API" "gcloud services list --enabled | grep storage.googleapis.com"
check_resource "Compute API" "gcloud services list --enabled | grep compute.googleapis.com"
check_resource "IAM API" "gcloud services list --enabled | grep iam.googleapis.com"
check_resource "Cloud Build API" "gcloud services list --enabled | grep cloudbuild.googleapis.com"
check_resource "Secret Manager API" "gcloud services list --enabled | grep secretmanager.googleapis.com"
check_resource "Cloud Logging API" "gcloud services list --enabled | grep logging.googleapis.com"
echo ""

# 2. Check Service Accounts
echo "👤 Validating Service Accounts..."
ENVIRONMENT=$(grep environment infrastructure/terraform/terraform.tfvars | cut -d'"' -f2 || echo "dev")
check_resource "Vertex AI SA" "gcloud iam service-accounts describe vertex-ai-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"
check_resource "Cloud Run SA" "gcloud iam service-accounts describe cloud-run-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"
check_resource "n8n SA" "gcloud iam service-accounts describe n8n-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"
echo ""

# 3. Check Cloud Storage Buckets
echo "🪣 Validating Cloud Storage Buckets..."
check_resource "Datasets bucket" "gsutil ls gs://${PROJECT_ID}-ml-datasets-${ENVIRONMENT}"
check_resource "Models bucket" "gsutil ls gs://${PROJECT_ID}-ml-models-${ENVIRONMENT}"
check_resource "Training bucket" "gsutil ls gs://${PROJECT_ID}-ml-training-${ENVIRONMENT}"
check_resource "n8n bucket" "gsutil ls gs://${PROJECT_ID}-n8n-workflows-${ENVIRONMENT}"
echo ""

# 4. Check IAM Permissions
echo "🔒 Validating IAM Permissions..."
check_resource "Vertex AI SA permissions" "gcloud projects get-iam-policy $PROJECT_ID --flatten='bindings[].members' --filter='bindings.members:serviceAccount:vertex-ai-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com' | grep roles/aiplatform.user"
check_resource "Cloud Run SA permissions" "gcloud projects get-iam-policy $PROJECT_ID --flatten='bindings[].members' --filter='bindings.members:serviceAccount:cloud-run-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com' | grep roles/aiplatform.user"
check_resource "n8n SA permissions" "gcloud projects get-iam-policy $PROJECT_ID --flatten='bindings[].members' --filter='bindings.members:serviceAccount:n8n-sa-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com' | grep roles/run.invoker"
echo ""

# 5. Test Connectivity
echo "🔗 Testing Connectivity..."

# Test Vertex AI
echo -n "   Testing Vertex AI access... "
if gcloud ai custom-jobs list --region="$REGION" &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

# Test Cloud Storage
echo -n "   Testing Cloud Storage access... "
if gsutil ls gs://${PROJECT_ID}-ml-datasets-${ENVIRONMENT} &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
fi

echo ""

# Summary
TOTAL=$((PASSED + FAILED))
echo -e "${GREEN}=== Validation Summary ===${NC}"
echo "Total checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation checks passed!${NC}"
    echo -e "${GREEN}✅ Infrastructure is ready for ML workflows${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validation checks failed${NC}"
    echo -e "${YELLOW}💡 Run setup-gcp.sh to fix infrastructure issues${NC}"
    exit 1
fi
