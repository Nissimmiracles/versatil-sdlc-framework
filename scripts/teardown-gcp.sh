#!/bin/bash
set -euo pipefail

# GCP Infrastructure Teardown Script
# Destroys all Terraform-managed resources

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}=== VERSATIL ML Workflow - GCP Infrastructure Teardown ===${NC}\n"

# Warning
echo -e "${RED}⚠️  WARNING: This will DELETE all GCP resources created by Terraform!${NC}"
echo -e "${RED}⚠️  This includes:${NC}"
echo "   • Service accounts"
echo "   • Cloud Storage buckets (and ALL data inside)"
echo "   • IAM bindings"
echo ""
echo -e "${YELLOW}📊 This action is IRREVERSIBLE${NC}\n"

read -p "Are you absolutely sure you want to proceed? (type 'DELETE' to confirm): " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "${GREEN}✅ Teardown cancelled - no resources were deleted${NC}"
    exit 0
fi

# Navigate to Terraform directory
cd infrastructure/terraform

# Check if Terraform is initialized
if [ ! -d ".terraform" ]; then
    echo -e "${RED}❌ Terraform not initialized. Run setup-gcp.sh first${NC}"
    exit 1
fi

# Show what will be destroyed
echo -e "\n📋 Generating destruction plan..."
terraform plan -destroy

echo -e "\n${YELLOW}Review the plan above carefully${NC}"
read -p "Proceed with destruction? (type 'yes'): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "yes" ]; then
    echo -e "${GREEN}✅ Teardown cancelled${NC}"
    exit 0
fi

# Destroy infrastructure
echo -e "\n🔥 Destroying infrastructure..."
terraform destroy -auto-approve

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform destroy failed${NC}"
    echo -e "${YELLOW}💡 You may need to manually delete some resources in GCP Console${NC}"
    exit 1
fi

# Clean up local files
echo -e "\n🧹 Cleaning up local files..."
rm -f terraform.tfstate terraform.tfstate.backup tfplan
rm -f ../../.env.gcp

echo -e "${GREEN}✅ Infrastructure destroyed successfully${NC}\n"
echo "📋 What was deleted:"
echo "   • All service accounts"
echo "   • All Cloud Storage buckets"
echo "   • All IAM bindings"
echo "   • Local Terraform state"
echo ""
echo -e "${YELLOW}⚠️  GCP APIs remain enabled (manual disable required if needed)${NC}"
echo -e "${GREEN}✅ Teardown complete${NC}"
