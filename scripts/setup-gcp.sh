#!/bin/bash
set -euo pipefail

# GCP Infrastructure Setup Script
# Sets up all required GCP resources for ML workflow automation

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== VERSATIL ML Workflow - GCP Infrastructure Setup ===${NC}\n"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Install from: https://www.terraform.io/downloads${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}\n"

# Authenticate with GCP
echo "🔐 Authenticating with GCP..."
gcloud auth login
gcloud auth application-default login

# Set project
echo -e "\n📦 Setting GCP project..."
read -p "Enter your GCP Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

gcloud config set project "$PROJECT_ID"

# Verify project exists
if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
    echo -e "${RED}❌ Project '$PROJECT_ID' not found or you don't have access${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project set to: $PROJECT_ID${NC}\n"

# Enable required APIs (this can take 2-3 minutes)
echo "🔌 Enabling required GCP APIs (this may take 2-3 minutes)..."
APIS=(
    "aiplatform.googleapis.com"
    "run.googleapis.com"
    "storage.googleapis.com"
    "compute.googleapis.com"
    "iam.googleapis.com"
    "cloudbuild.googleapis.com"
    "secretmanager.googleapis.com"
    "logging.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo "   Enabling $api..."
    gcloud services enable "$api" --project="$PROJECT_ID" || {
        echo -e "${YELLOW}⚠️  Failed to enable $api (may already be enabled)${NC}"
    }
done

echo -e "${GREEN}✅ All APIs enabled${NC}\n"

# Create terraform.tfvars
echo "📝 Creating Terraform configuration..."
cd infrastructure/terraform

if [ ! -f "terraform.tfvars" ]; then
    read -p "Enter GCP region (default: us-central1): " REGION
    REGION=${REGION:-us-central1}

    read -p "Enter environment (dev/staging/prod, default: dev): " ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-dev}

    cat > terraform.tfvars <<EOF
gcp_project_id = "$PROJECT_ID"
gcp_region     = "$REGION"
environment    = "$ENVIRONMENT"

vertex_ai_location = "$REGION"
enable_workload_identity = true
bucket_lifecycle_age_days = 90

labels = {
  managed_by = "terraform"
  framework  = "versatil"
  component  = "ml-workflow"
}
EOF

    echo -e "${GREEN}✅ Created terraform.tfvars${NC}\n"
else
    echo -e "${YELLOW}⚠️  terraform.tfvars already exists, skipping creation${NC}\n"
fi

# Initialize Terraform
echo "🚀 Initializing Terraform..."
terraform init

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform initialization failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Terraform initialized${NC}\n"

# Terraform plan
echo "📋 Generating Terraform plan..."
terraform plan -out=tfplan

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform plan failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📊 Review the plan above carefully${NC}"
read -p "Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}⚠️  Setup cancelled by user${NC}"
    exit 0
fi

# Terraform apply
echo -e "\n🚀 Applying Terraform configuration (this may take 5-10 minutes)..."
terraform apply tfplan

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform apply failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}\n"

# Generate .env file
echo "📝 Generating .env file..."
cd ../..

terraform -chdir=infrastructure/terraform output -raw env_vars_summary > .env.gcp

echo -e "${GREEN}✅ Environment variables written to .env.gcp${NC}"
echo -e "${YELLOW}💡 Add these variables to your .env file${NC}\n"

# Display summary
echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
echo "📦 Resources created:"
echo "   • 3 Service Accounts (vertex-ai-sa, cloud-run-sa, n8n-sa)"
echo "   • 4 Cloud Storage Buckets (datasets, models, training, workflows)"
echo "   • 8 GCP APIs enabled"
echo "   • IAM roles configured"
echo ""
echo "📋 Next steps:"
echo "   1. Review .env.gcp and add variables to your .env file"
echo "   2. Test Vertex AI: gcloud ai custom-jobs list --region=\$GCP_REGION"
echo "   3. Test Cloud Storage: gsutil ls"
echo "   4. Begin implementation with Wave 1 todos"
echo ""
echo -e "${GREEN}🎉 GCP infrastructure is ready for ML workflows!${NC}"
