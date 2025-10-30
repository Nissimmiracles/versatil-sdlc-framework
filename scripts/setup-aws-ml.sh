#!/bin/bash
# AWS ML Workflow Automated Setup Script
# Deploys RDS PostgreSQL, SageMaker, and ECS/Lambda for ML workflows

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AWS ML Workflow Automated Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install from: https://aws.amazon.com/cli/${NC}"
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
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "RDS Instance Identifier (default: ml-workflow-db): " INSTANCE_ID
INSTANCE_ID=${INSTANCE_ID:-ml-workflow-db}

read -p "Database Name (default: ml_workflow): " DB_NAME
DB_NAME=${DB_NAME:-ml_workflow}

read -sp "Master Password (min 8 chars): " DB_PASSWORD
echo ""

read -p "RDS Instance Class (default: db.t3.medium): " INSTANCE_CLASS
INSTANCE_CLASS=${INSTANCE_CLASS:-db.t3.medium}

read -p "Allocated Storage GB (default: 100): " STORAGE_GB
STORAGE_GB=${STORAGE_GB:-100}

# Configure AWS CLI
echo -e "\n${YELLOW}Configuring AWS CLI...${NC}"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Not authenticated with AWS${NC}"
    echo -e "${YELLOW}Run: aws configure${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated as Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}   Region: ${AWS_REGION}${NC}"

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
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${AWS_REGION}"
}

# Get default VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-ml-workflow"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL from anywhere (update this in production)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-ml-workflow"
  }
}

# RDS parameter group for pgvector
resource "aws_db_parameter_group" "postgres15_pgvector" {
  name   = "ml-workflow-postgres15-pgvector"
  family = "postgres15"

  parameter {
    name  = "shared_preload_libraries"
    value = "vector"
  }

  tags = {
    Name = "ml-workflow-postgres15-pgvector"
  }
}

# RDS PostgreSQL instance
resource "aws_db_instance" "main" {
  identifier = "${INSTANCE_ID}"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "${INSTANCE_CLASS}"

  allocated_storage     = ${STORAGE_GB}
  max_allocated_storage = 500
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "${DB_NAME}"
  username = "postgres"
  password = "${DB_PASSWORD}"
  port     = 5432

  parameter_group_name = aws_db_parameter_group.postgres15_pgvector.name

  multi_az = false  # Set to true for production

  backup_retention_period = 7
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval            = 60

  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true  # Set to false for production

  deletion_protection = false
  skip_final_snapshot = false
  final_snapshot_identifier = "ml-workflow-final-\${formatdate("YYYY-MM-DD-hhmmss", timestamp())}"

  tags = {
    Name        = "${INSTANCE_ID}"
    Environment = "development"
  }
}

# IAM role for ECS task execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM role for RDS access
resource "aws_iam_role" "rds_access" {
  name = "rds-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = ["ecs-tasks.amazonaws.com", "lambda.amazonaws.com"]
      }
    }]
  })
}

resource "aws_iam_role_policy" "rds_connect" {
  name = "rds-connect-policy"
  role = aws_iam_role.rds_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "rds-db:connect"
      Resource = "arn:aws:rds-db:${AWS_REGION}:${AWS_ACCOUNT_ID}:dbuser:\${aws_db_instance.main.resource_id}/postgres"
    }]
  })
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "rds_address" {
  value = aws_db_instance.main.address
}

output "database_url" {
  value     = "postgresql://postgres:${DB_PASSWORD}@\${aws_db_instance.main.address}:5432/${DB_NAME}"
  sensitive = true
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution.arn
}

output "rds_access_role_arn" {
  value = aws_iam_role.rds_access.arn
}
EOF

    # Initialize and apply Terraform
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init

    echo -e "${YELLOW}Planning infrastructure...${NC}"
    terraform plan

    read -p "Apply Terraform plan? (y/n): " APPLY_TERRAFORM
    if [ "$APPLY_TERRAFORM" = "y" ]; then
        echo -e "${YELLOW}Applying Terraform (this may take 10-15 minutes)...${NC}"
        terraform apply -auto-approve

        # Get outputs
        RDS_ENDPOINT=$(terraform output -raw rds_address)
        ECS_ROLE_ARN=$(terraform output -raw ecs_task_execution_role_arn)
        echo -e "${GREEN}✅ Infrastructure deployed via Terraform${NC}"
    else
        echo -e "${YELLOW}Skipping Terraform apply${NC}"
        cd ../..
        exit 0
    fi

    cd ../..

else
    # Manual setup using AWS CLI
    echo -e "\n${YELLOW}Creating RDS infrastructure (manual setup)...${NC}"

    # Create parameter group
    echo -e "${YELLOW}Creating RDS parameter group...${NC}"
    aws rds create-db-parameter-group \
        --db-parameter-group-name ml-workflow-postgres15-pgvector \
        --db-parameter-group-family postgres15 \
        --description "PostgreSQL 15 with pgvector support" \
        --region ${AWS_REGION} 2>/dev/null || echo "Parameter group already exists"

    # Modify parameter group for pgvector
    aws rds modify-db-parameter-group \
        --db-parameter-group-name ml-workflow-postgres15-pgvector \
        --parameters "ParameterName=shared_preload_libraries,ParameterValue=vector,ApplyMethod=pending-reboot" \
        --region ${AWS_REGION} || true

    # Check if instance exists
    if aws rds describe-db-instances --db-instance-identifier ${INSTANCE_ID} --region ${AWS_REGION} 2>/dev/null; then
        echo -e "${YELLOW}⚠️  RDS instance ${INSTANCE_ID} already exists${NC}"
        read -p "Use existing instance? (y/n): " USE_EXISTING
        if [ "$USE_EXISTING" != "y" ]; then
            exit 1
        fi
    else
        # Create RDS instance
        echo -e "${YELLOW}Creating RDS PostgreSQL instance (this may take 10-15 minutes)...${NC}"
        aws rds create-db-instance \
            --db-instance-identifier ${INSTANCE_ID} \
            --db-instance-class ${INSTANCE_CLASS} \
            --engine postgres \
            --engine-version 15.4 \
            --master-username postgres \
            --master-user-password "${DB_PASSWORD}" \
            --allocated-storage ${STORAGE_GB} \
            --storage-type gp3 \
            --db-parameter-group-name ml-workflow-postgres15-pgvector \
            --backup-retention-period 7 \
            --preferred-backup-window "02:00-03:00" \
            --preferred-maintenance-window "sun:03:00-sun:04:00" \
            --enable-cloudwatch-logs-exports postgresql upgrade \
            --storage-encrypted \
            --publicly-accessible \
            --region ${AWS_REGION}

        echo -e "${YELLOW}⏳ Waiting for RDS instance to be available...${NC}"
        aws rds wait db-instance-available \
            --db-instance-identifier ${INSTANCE_ID} \
            --region ${AWS_REGION}

        echo -e "${GREEN}✅ RDS instance created${NC}"

        # Reboot to apply parameter group changes
        echo -e "${YELLOW}Rebooting instance to enable pgvector...${NC}"
        aws rds reboot-db-instance \
            --db-instance-identifier ${INSTANCE_ID} \
            --region ${AWS_REGION}

        aws rds wait db-instance-available \
            --db-instance-identifier ${INSTANCE_ID} \
            --region ${AWS_REGION}
    fi

    # Get RDS endpoint
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier ${INSTANCE_ID} \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text \
        --region ${AWS_REGION})

    # Enable IAM authentication
    echo -e "${YELLOW}Enabling IAM authentication...${NC}"
    aws rds modify-db-instance \
        --db-instance-identifier ${INSTANCE_ID} \
        --enable-iam-database-authentication \
        --apply-immediately \
        --region ${AWS_REGION} || true
fi

# Install pgvector extension
echo -e "\n${YELLOW}Installing pgvector extension...${NC}"
echo -e "${BLUE}Connecting to RDS instance...${NC}"

# Create temporary SQL script
cat > /tmp/install_pgvector.sql <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
EOF

# Execute using psql
PGPASSWORD="${DB_PASSWORD}" psql \
    -h ${RDS_ENDPOINT} \
    -U postgres \
    -d postgres \
    -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || echo "Database already exists"

PGPASSWORD="${DB_PASSWORD}" psql \
    -h ${RDS_ENDPOINT} \
    -U postgres \
    -d ${DB_NAME} \
    -f /tmp/install_pgvector.sql || {
    echo -e "${RED}❌ Failed to install pgvector. You may need to install it manually.${NC}"
    echo -e "${YELLOW}Manual steps:${NC}"
    echo "  1. psql -h ${RDS_ENDPOINT} -U postgres -d ${DB_NAME}"
    echo "  2. CREATE EXTENSION IF NOT EXISTS vector;"
}

rm -f /tmp/install_pgvector.sql

# Create IAM roles
echo -e "\n${YELLOW}Creating IAM roles...${NC}"

# ECS task execution role
ECS_ROLE_NAME="ecs-ml-workflow-task-execution-role"
if ! aws iam get-role --role-name ${ECS_ROLE_NAME} 2>/dev/null; then
    aws iam create-role \
        --role-name ${ECS_ROLE_NAME} \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }' \
        --region ${AWS_REGION}

    aws iam attach-role-policy \
        --role-name ${ECS_ROLE_NAME} \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
        --region ${AWS_REGION}
fi

ECS_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ECS_ROLE_NAME}"

# Save configuration
echo -e "\n${YELLOW}Saving configuration...${NC}"

CREDS_DIR="${HOME}/.versatil/credentials"
mkdir -p ${CREDS_DIR}

cat > ${CREDS_DIR}/aws.env <<EOF
# AWS ML Workflow Configuration
# Generated: $(date)

export AWS_REGION="${AWS_REGION}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
export RDS_INSTANCE_ID="${INSTANCE_ID}"
export RDS_ENDPOINT="${RDS_ENDPOINT}"
export RDS_DATABASE_NAME="${DB_NAME}"
export RDS_USERNAME="postgres"
export RDS_PASSWORD="${DB_PASSWORD}"
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}"

# IAM Roles
export ECS_TASK_EXECUTION_ROLE_ARN="${ECS_ROLE_ARN}"
EOF

chmod 600 ${CREDS_DIR}/aws.env

cat > ${CREDS_DIR}/aws.json <<EOF
{
  "region": "${AWS_REGION}",
  "account_id": "${AWS_ACCOUNT_ID}",
  "rds": {
    "instance_id": "${INSTANCE_ID}",
    "endpoint": "${RDS_ENDPOINT}",
    "database": "${DB_NAME}",
    "username": "postgres",
    "password": "${DB_PASSWORD}"
  },
  "database_url": "postgresql://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}",
  "iam_roles": {
    "ecs_task_execution": "${ECS_ROLE_ARN}"
  }
}
EOF

chmod 600 ${CREDS_DIR}/aws.json

echo -e "${GREEN}✅ Configuration saved to ${CREDS_DIR}/aws.env${NC}"

# Final summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Database Connection:${NC}"
echo -e "  RDS Endpoint: ${RDS_ENDPOINT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  Username: postgres"
echo -e "  Connection String: postgresql://postgres:****@${RDS_ENDPOINT}:5432/${DB_NAME}\n"

echo -e "${BLUE}IAM Roles:${NC}"
echo -e "  ECS Task Execution: ${ECS_ROLE_ARN}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Source credentials: ${YELLOW}source ${CREDS_DIR}/aws.env${NC}"
echo -e "  2. Test connection: ${YELLOW}psql -h ${RDS_ENDPOINT} -U postgres -d ${DB_NAME}${NC}"
echo -e "  3. Run migrations: ${YELLOW}npx prisma migrate deploy${NC}"
echo -e "  4. Deploy to ECS: ${YELLOW}npm run deploy:aws${NC}\n"

echo -e "${BLUE}Documentation:${NC}"
echo -e "  - RDS: https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html"
echo -e "  - SageMaker: https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html"
echo -e "  - ECS: https://docs.aws.amazon.com/ecs/latest/developerguide/\n"

echo -e "${YELLOW}⚠️  Security Reminder:${NC}"
echo -e "  - Update security groups to restrict database access"
echo -e "  - Set publicly_accessible to false for production"
echo -e "  - Enable Multi-AZ for production workloads"
echo -e "  - Rotate database password regularly (every 90 days)"
echo -e "  - Use IAM authentication for production"
echo -e "  - Never commit ${CREDS_DIR}/aws.env or aws.json to version control\n"
