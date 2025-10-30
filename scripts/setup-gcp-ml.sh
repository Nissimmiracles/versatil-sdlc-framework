#!/bin/bash
# GCP ML Workflow Automated Setup Script
# Deploys Cloud SQL PostgreSQL, Vertex AI, and Cloud Run for ML workflows

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GCP ML Workflow Automated Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}⚠️  terraform not found. Install from: https://www.terraform.io/downloads${NC}"
    echo -e "${YELLOW}   Continuing without Terraform (manual setup)...${NC}"
    USE_TERRAFORM=false
else
    USE_TERRAFORM=true
fi

# Get user inputs
echo -e "${BLUE}Configuration${NC}"
read -p "GCP Project ID: " GCP_PROJECT_ID
read -p "GCP Region (default: us-central1): " GCP_REGION
GCP_REGION=${GCP_REGION:-us-central1}

read -p "Cloud SQL Instance Name (default: ml-workflow-db): " INSTANCE_NAME
INSTANCE_NAME=${INSTANCE_NAME:-ml-workflow-db}

read -p "Database Name (default: ml_workflow_dev): " DB_NAME
DB_NAME=${DB_NAME:-ml_workflow_dev}

read -sp "Database Password: " DB_PASSWORD
echo ""

read -p "Cloud SQL Tier (default: db-custom-2-7680): " DB_TIER
DB_TIER=${DB_TIER:-db-custom-2-7680}

# Authenticate with GCP
echo -e "\n${YELLOW}Authenticating with GCP...${NC}"
gcloud auth login || {
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
}

gcloud config set project ${GCP_PROJECT_ID}
echo -e "${GREEN}✅ Authenticated as $(gcloud config get-value account)${NC}"

# Enable required APIs
echo -e "\n${YELLOW}Enabling required GCP APIs...${NC}"
REQUIRED_APIS=(
    "sqladmin.googleapis.com"
    "aiplatform.googleapis.com"
    "run.googleapis.com"
    "compute.googleapis.com"
    "servicenetworking.googleapis.com"
    "cloudresourcemanager.googleapis.com"
)

for API in "${REQUIRED_APIS[@]}"; do
    echo "  Enabling ${API}..."
    gcloud services enable ${API} --project=${GCP_PROJECT_ID}
done

echo -e "${GREEN}✅ All APIs enabled${NC}"

# Check if using Terraform
if [ "$USE_TERRAFORM" = true ]; then
    echo -e "\n${BLUE}Using Terraform for infrastructure deployment${NC}"

    # Create Terraform directory if not exists
    mkdir -p infrastructure/terraform
    cd infrastructure/terraform

    # Create main.tf
    cat > main.tf <<EOF
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "${GCP_PROJECT_ID}"
  region  = "${GCP_REGION}"
}

resource "google_sql_database_instance" "main" {
  name             = "${INSTANCE_NAME}"
  database_version = "POSTGRES_15"
  region           = "${GCP_REGION}"

  settings {
    tier = "${DB_TIER}"

    backup_configuration {
      enabled            = true
      start_time         = "02:00"
      location           = "${GCP_REGION}"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "allow-all-temp"
        value = "0.0.0.0/0"
      }
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "main" {
  name     = "${DB_NAME}"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "postgres" {
  name     = "postgres"
  instance = google_sql_database_instance.main.name
  password = "${DB_PASSWORD}"
}

output "instance_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "instance_ip_address" {
  value = google_sql_database_instance.main.public_ip_address
}

output "database_url" {
  value     = "postgresql://postgres:${DB_PASSWORD}@\${google_sql_database_instance.main.public_ip_address}:5432/${DB_NAME}"
  sensitive = true
}
EOF

    # Initialize and apply Terraform
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init

    echo -e "${YELLOW}Planning infrastructure...${NC}"
    terraform plan

    read -p "Apply Terraform plan? (y/n): " APPLY_TERRAFORM
    if [ "$APPLY_TERRAFORM" = "y" ]; then
        echo -e "${YELLOW}Applying Terraform...${NC}"
        terraform apply -auto-approve

        # Get outputs
        INSTANCE_IP=$(terraform output -raw instance_ip_address)
        echo -e "${GREEN}✅ Infrastructure deployed via Terraform${NC}"
    else
        echo -e "${YELLOW}Skipping Terraform apply${NC}"
        cd ../..
        exit 0
    fi

    cd ../..

else
    # Manual setup using gcloud
    echo -e "\n${YELLOW}Creating Cloud SQL instance (manual setup)...${NC}"

    # Check if instance exists
    if gcloud sql instances describe ${INSTANCE_NAME} --project=${GCP_PROJECT_ID} 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Instance ${INSTANCE_NAME} already exists${NC}"
        read -p "Use existing instance? (y/n): " USE_EXISTING
        if [ "$USE_EXISTING" != "y" ]; then
            exit 1
        fi
    else
        # Create Cloud SQL instance
        gcloud sql instances create ${INSTANCE_NAME} \
            --database-version=POSTGRES_15 \
            --tier=${DB_TIER} \
            --region=${GCP_REGION} \
            --database-flags=cloudsql.iam_authentication=on,max_connections=100 \
            --backup-start-time=02:00 \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=3 \
            --enable-point-in-time-recovery \
            --project=${GCP_PROJECT_ID}

        echo -e "${YELLOW}⏳ Waiting for instance to be ready (this may take 5-10 minutes)...${NC}"

        # Wait for operation to complete
        OPERATION=$(gcloud sql operations list \
            --instance=${INSTANCE_NAME} \
            --limit=1 \
            --format="value(name)" \
            --project=${GCP_PROJECT_ID})

        if [ -n "$OPERATION" ]; then
            gcloud sql operations wait ${OPERATION} \
                --project=${GCP_PROJECT_ID} \
                --timeout=600
        fi

        echo -e "${GREEN}✅ Cloud SQL instance created${NC}"
    fi

    # Set postgres password
    echo -e "${YELLOW}Setting postgres password...${NC}"
    gcloud sql users set-password postgres \
        --instance=${INSTANCE_NAME} \
        --password="${DB_PASSWORD}" \
        --project=${GCP_PROJECT_ID}

    # Create database
    echo -e "${YELLOW}Creating database ${DB_NAME}...${NC}"
    gcloud sql databases create ${DB_NAME} \
        --instance=${INSTANCE_NAME} \
        --project=${GCP_PROJECT_ID} 2>/dev/null || echo "Database already exists"

    # Get instance IP
    INSTANCE_IP=$(gcloud sql instances describe ${INSTANCE_NAME} \
        --format="value(ipAddresses[0].ipAddress)" \
        --project=${GCP_PROJECT_ID})
fi

# Install pgvector extension
echo -e "\n${YELLOW}Installing pgvector extension...${NC}"
echo -e "${BLUE}Connecting to Cloud SQL instance...${NC}"

# Create temporary SQL script
cat > /tmp/install_pgvector.sql <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
EOF

# Execute using gcloud sql connect
gcloud sql connect ${INSTANCE_NAME} \
    --user=postgres \
    --database=${DB_NAME} \
    --project=${GCP_PROJECT_ID} < /tmp/install_pgvector.sql || {
    echo -e "${RED}❌ Failed to install pgvector. You may need to install it manually.${NC}"
    echo -e "${YELLOW}Manual steps:${NC}"
    echo "  1. gcloud sql connect ${INSTANCE_NAME} --user=postgres --project=${GCP_PROJECT_ID}"
    echo "  2. CREATE EXTENSION IF NOT EXISTS vector;"
}

rm -f /tmp/install_pgvector.sql

# Create service accounts
echo -e "\n${YELLOW}Creating service accounts...${NC}"

# Vertex AI service account
VERTEX_SA="vertex-ai-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe ${VERTEX_SA} --project=${GCP_PROJECT_ID} 2>/dev/null; then
    gcloud iam service-accounts create vertex-ai-sa \
        --display-name="Vertex AI Service Account" \
        --project=${GCP_PROJECT_ID}

    # Grant permissions
    gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
        --member="serviceAccount:${VERTEX_SA}" \
        --role="roles/aiplatform.user"

    gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
        --member="serviceAccount:${VERTEX_SA}" \
        --role="roles/cloudsql.client"
fi

# Cloud Run service account
RUN_SA="cloud-run-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe ${RUN_SA} --project=${GCP_PROJECT_ID} 2>/dev/null; then
    gcloud iam service-accounts create cloud-run-sa \
        --display-name="Cloud Run Service Account" \
        --project=${GCP_PROJECT_ID}

    # Grant permissions
    gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
        --member="serviceAccount:${RUN_SA}" \
        --role="roles/cloudsql.client"
fi

echo -e "${GREEN}✅ Service accounts created${NC}"

# Save configuration
echo -e "\n${YELLOW}Saving configuration...${NC}"

CREDS_DIR="${HOME}/.versatil/credentials"
mkdir -p ${CREDS_DIR}

cat > ${CREDS_DIR}/gcp.env <<EOF
# GCP ML Workflow Configuration
# Generated: $(date)

export GCP_PROJECT_ID="${GCP_PROJECT_ID}"
export GCP_REGION="${GCP_REGION}"
export CLOUD_SQL_INSTANCE="${INSTANCE_NAME}"
export CLOUD_SQL_INSTANCE_IP="${INSTANCE_IP}"
export CLOUD_SQL_DATABASE_NAME="${DB_NAME}"
export CLOUD_SQL_USERNAME="postgres"
export CLOUD_SQL_PASSWORD="${DB_PASSWORD}"
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${INSTANCE_IP}:5432/${DB_NAME}"

# Vertex AI
export VERTEX_AI_SA="${VERTEX_SA}"
export GOOGLE_CLOUD_PROJECT="${GCP_PROJECT_ID}"
export GOOGLE_CLOUD_LOCATION="${GCP_REGION}"

# Cloud Run
export CLOUD_RUN_SA="${RUN_SA}"
EOF

chmod 600 ${CREDS_DIR}/gcp.env

cat > ${CREDS_DIR}/gcp.json <<EOF
{
  "project_id": "${GCP_PROJECT_ID}",
  "region": "${GCP_REGION}",
  "cloud_sql": {
    "instance": "${INSTANCE_NAME}",
    "ip": "${INSTANCE_IP}",
    "database": "${DB_NAME}",
    "username": "postgres",
    "password": "${DB_PASSWORD}"
  },
  "database_url": "postgresql://postgres:${DB_PASSWORD}@${INSTANCE_IP}:5432/${DB_NAME}",
  "service_accounts": {
    "vertex_ai": "${VERTEX_SA}",
    "cloud_run": "${RUN_SA}"
  }
}
EOF

chmod 600 ${CREDS_DIR}/gcp.json

echo -e "${GREEN}✅ Configuration saved to ${CREDS_DIR}/gcp.env${NC}"

# Final summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Database Connection:${NC}"
echo -e "  Instance IP: ${INSTANCE_IP}"
echo -e "  Database: ${DB_NAME}"
echo -e "  Username: postgres"
echo -e "  Connection String: postgresql://postgres:****@${INSTANCE_IP}:5432/${DB_NAME}\n"

echo -e "${BLUE}Service Accounts:${NC}"
echo -e "  Vertex AI: ${VERTEX_SA}"
echo -e "  Cloud Run: ${RUN_SA}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Source credentials: ${YELLOW}source ${CREDS_DIR}/gcp.env${NC}"
echo -e "  2. Test connection: ${YELLOW}psql \"\${DATABASE_URL}\"${NC}"
echo -e "  3. Run migrations: ${YELLOW}npx prisma migrate deploy${NC}"
echo -e "  4. Deploy to Cloud Run: ${YELLOW}npm run deploy:gcp${NC}\n"

echo -e "${BLUE}Documentation:${NC}"
echo -e "  - Cloud SQL: https://cloud.google.com/sql/docs/postgres"
echo -e "  - Vertex AI: https://cloud.google.com/vertex-ai/docs"
echo -e "  - Cloud Run: https://cloud.google.com/run/docs\n"

echo -e "${YELLOW}⚠️  Security Reminder:${NC}"
echo -e "  - Update authorized networks in Cloud SQL to restrict access"
echo -e "  - Rotate database password regularly (every 90 days)"
echo -e "  - Use IAM authentication for production workloads"
echo -e "  - Never commit ${CREDS_DIR}/gcp.env or gcp.json to version control\n"
