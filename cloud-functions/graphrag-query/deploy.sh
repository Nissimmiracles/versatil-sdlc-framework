#!/bin/bash

# VERSATIL GraphRAG Query - Cloud Run Deployment Script
#
# Deploys GraphRAG edge function to Google Cloud Run with:
# - Auto-scaling (0-10 instances)
# - 512MB memory, 1 CPU
# - Public access (for VERSATIL users)
# - Environment variables for Public RAG
#
# Prerequisites:
# 1. Google Cloud SDK installed: https://cloud.google.com/sdk/docs/install
# 2. Authenticated: gcloud auth login
# 3. Project set: gcloud config set project YOUR_PROJECT_ID
#
# Usage:
#   ./deploy.sh                    # Deploy to default project
#   ./deploy.sh --project PROJECT  # Deploy to specific project
#   ./deploy.sh --dry-run          # Test build without deploying

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-centering-vine-454613-b3}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE_NAME="versatil-graphrag-query"
PUBLIC_PROJECT_ID="centering-vine-454613-b3"
PUBLIC_DATABASE_ID="versatil-public-rag"

# Parse arguments
DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      PROJECT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--project PROJECT_ID] [--region REGION] [--dry-run]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}VERSATIL GraphRAG Query - Cloud Run Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Project ID:       ${GREEN}$PROJECT_ID${NC}"
echo -e "Region:           ${GREEN}$REGION${NC}"
echo -e "Service Name:     ${GREEN}$SERVICE_NAME${NC}"
echo -e "Public RAG:       ${GREEN}$PUBLIC_PROJECT_ID/$PUBLIC_DATABASE_ID${NC}"
echo -e "Dry Run:          ${GREEN}$DRY_RUN${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker not found${NC}"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Set project
echo -e "${YELLOW}Setting Google Cloud project...${NC}"
gcloud config set project "$PROJECT_ID"
echo -e "${GREEN}✓ Project set${NC}"
echo ""

# Build container
echo -e "${YELLOW}Building Docker container...${NC}"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

docker build -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container built: $IMAGE_NAME${NC}"
echo ""

# Test container locally (optional)
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Testing container locally...${NC}"
    echo -e "${BLUE}Starting container on port 8080...${NC}"

    docker run -d --name graphrag-test -p 8080:8080 \
        -e PORT=8080 \
        -e PUBLIC_PROJECT_ID="$PUBLIC_PROJECT_ID" \
        -e PUBLIC_DATABASE_ID="$PUBLIC_DATABASE_ID" \
        "$IMAGE_NAME"

    sleep 3

    echo -e "${BLUE}Testing health endpoint...${NC}"
    curl -s http://localhost:8080/health | jq '.'

    echo ""
    echo -e "${GREEN}✓ Container test passed${NC}"

    docker stop graphrag-test
    docker rm graphrag-test

    echo ""
    echo -e "${YELLOW}Dry run complete. Skipping deployment.${NC}"
    echo -e "To deploy, run: $0 --project $PROJECT_ID"
    exit 0
fi

# Push container to Google Container Registry
echo -e "${YELLOW}Pushing container to GCR...${NC}"
docker push "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker push failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container pushed${NC}"
echo ""

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"

gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 60 \
    --concurrency 80 \
    --set-env-vars "PUBLIC_PROJECT_ID=$PUBLIC_PROJECT_ID,PUBLIC_DATABASE_ID=$PUBLIC_DATABASE_ID" \
    --set-env-vars "NODE_ENV=production"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Cloud Run deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format='value(status.url)')

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Service URL:      ${GREEN}$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}Test the deployment:${NC}"
echo ""
echo -e "# Health check"
echo -e "curl $SERVICE_URL/health"
echo ""
echo -e "# Query test"
echo -e "curl -X POST $SERVICE_URL/query \\"
echo -e "  -H 'Content-Type: application/json' \\"
echo -e "  -d '{\"query\": \"React testing patterns\", \"isPublic\": true}'"
echo ""
echo -e "# Stats"
echo -e "curl $SERVICE_URL/stats"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Test the endpoints above"
echo -e "2. Update VERSATIL framework to use: $SERVICE_URL"
echo -e "3. Monitor at: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo ""
