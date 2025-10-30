# Multi-Cloud ML Workflow Setup Guide

Complete guide for deploying VERSATIL ML workflows on Google Cloud Platform (GCP), Amazon Web Services (AWS), or Supabase.

## Overview

VERSATIL supports multi-cloud ML workflow deployments with:
- **Database**: PostgreSQL with pgvector (Cloud SQL, RDS, or Supabase)
- **AI/ML**: Model training and inference (Vertex AI or SageMaker)
- **API**: Containerized deployment (Cloud Run, ECS, or Edge Functions)
- **Multi-cloud**: Switch providers without code changes

## Quick Start (Choose Your Cloud)

### Option 1: Interactive Wizard (Recommended)

```bash
# Launch multi-cloud credential wizard
npm run setup:ml-credentials

# Follow prompts to:
# 1. Select cloud provider (GCP/AWS/Supabase)
# 2. Enter credentials
# 3. Test connection
# 4. Generate setup script
```

### Option 2: Automated Scripts

```bash
# GCP (Cloud SQL + Vertex AI + Cloud Run)
./scripts/setup-gcp-ml.sh

# AWS (RDS + SageMaker + ECS)
./scripts/setup-aws-ml.sh
```

## Cloud Provider Comparison

| Feature | GCP (Cloud SQL) | AWS (RDS) | Supabase |
|---------|-----------------|-----------|----------|
| **Setup Time** | 10-15 min | 10-15 min | 5 min |
| **Monthly Cost** | ~$110 | ~$150 | $0-25 |
| **pgvector Support** | ✅ Built-in | ✅ Via parameter group | ✅ Built-in |
| **Connection Pooling** | Cloud SQL Proxy (free) | RDS Proxy ($11/month) | Supavisor (free) |
| **IAM Auth** | ✅ Native | ✅ Native | ❌ API keys only |
| **Auto Scaling** | ✅ Storage | ✅ Storage | ✅ Compute + Storage |
| **Free Tier** | ❌ No | ❌ No | ✅ 500MB database |
| **High Availability** | Regional (99.95%) | Multi-AZ (99.95%) | Multi-region (99.99%) |
| **ML Training** | Vertex AI | SageMaker | External (Replicate, Modal) |
| **API Deployment** | Cloud Run | ECS/Lambda | Edge Functions |

### When to Choose Each Provider

**Choose GCP if:**
- ✅ Already using Google Cloud services
- ✅ Want simplest setup (no parameter groups)
- ✅ Budget conscious (~25% cheaper than AWS)
- ✅ Using Vertex AI for model training
- ✅ Need Kubernetes integration (GKE)

**Choose AWS if:**
- ✅ Already using AWS infrastructure
- ✅ Need SageMaker for model training
- ✅ Require Aurora Serverless v2 (scales to zero)
- ✅ Multi-region read replicas needed
- ✅ Using Lambda/ECS for compute

**Choose Supabase if:**
- ✅ Budget constrained (<$50/month)
- ✅ Prototyping or MVP development
- ✅ Want built-in auth and storage
- ✅ Edge computing for global low latency
- ✅ Don't need managed AI/ML training

## GCP Setup (Cloud SQL + Vertex AI)

### Prerequisites

```bash
# Install gcloud CLI
brew install google-cloud-sdk  # macOS
# or visit: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Automated Setup

```bash
# Run GCP setup script
./scripts/setup-gcp-ml.sh

# Prompts:
# - GCP Project ID: your-project-id
# - Region: us-central1
# - Instance Name: ml-workflow-db
# - Database Name: ml_workflow_dev
# - Password: (secure password)
# - Tier: db-custom-2-7680 (2 vCPU, 7.5GB RAM)
```

**What the script creates:**
- ✅ Cloud SQL PostgreSQL 15 instance
- ✅ Database with pgvector extension
- ✅ Service accounts (Vertex AI, Cloud Run)
- ✅ IAM permissions
- ✅ Credentials saved to `~/.versatil/credentials/gcp.env`

### Manual Setup (Alternative)

```bash
# Enable APIs
gcloud services enable sqladmin.googleapis.com aiplatform.googleapis.com run.googleapis.com

# Create Cloud SQL instance
gcloud sql instances create ml-workflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --database-flags=cloudsql.iam_authentication=on

# Set password
gcloud sql users set-password postgres \
  --instance=ml-workflow-db \
  --password=YOUR_PASSWORD

# Create database
gcloud sql databases create ml_workflow_dev --instance=ml-workflow-db

# Install pgvector
gcloud sql connect ml-workflow-db --user=postgres
CREATE EXTENSION IF NOT EXISTS vector;
```

### Verify Installation

```bash
# Source credentials
source ~/.versatil/credentials/gcp.env

# Test connection
gcloud sql connect ml-workflow-db --user=postgres --database=ml_workflow_dev

# In psql:
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
# Should show: vector | 0.5.0
```

### Cost Optimization (GCP)

```bash
# Development: Use smaller tier
# db-custom-1-3840 (1 vCPU, 3.75GB RAM) = ~$50/month

# Production: Enable high availability
gcloud sql instances patch ml-workflow-db --availability-type=REGIONAL

# Auto storage scaling
gcloud sql instances patch ml-workflow-db --storage-auto-increase
```

## AWS Setup (RDS + SageMaker)

### Prerequisites

```bash
# Install AWS CLI
brew install awscli  # macOS
# or visit: https://aws.amazon.com/cli/

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region
```

### Automated Setup

```bash
# Run AWS setup script
./scripts/setup-aws-ml.sh

# Prompts:
# - AWS Region: us-east-1
# - Instance ID: ml-workflow-db
# - Database Name: ml_workflow
# - Password: (secure password)
# - Instance Class: db.t3.medium (2 vCPU, 4GB RAM)
# - Storage: 100 GB
```

**What the script creates:**
- ✅ RDS PostgreSQL 15 instance
- ✅ Parameter group with pgvector enabled
- ✅ Database with pgvector extension
- ✅ IAM roles (ECS task execution, RDS access)
- ✅ Security groups (temp open, restrict in prod)
- ✅ Credentials saved to `~/.versatil/credentials/aws.env`

### Manual Setup (Alternative)

```bash
# Create parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name ml-workflow-postgres15 \
  --db-parameter-group-family postgres15 \
  --description "PostgreSQL 15 with pgvector"

# Enable pgvector
aws rds modify-db-parameter-group \
  --db-parameter-group-name ml-workflow-postgres15 \
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=vector,ApplyMethod=pending-reboot"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier ml-workflow-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-parameter-group-name ml-workflow-postgres15 \
  --backup-retention-period 7

# Wait for availability
aws rds wait db-instance-available --db-instance-identifier ml-workflow-db

# Reboot to apply parameter group
aws rds reboot-db-instance --db-instance-identifier ml-workflow-db
aws rds wait db-instance-available --db-instance-identifier ml-workflow-db

# Get endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ml-workflow-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Install pgvector
psql -h $RDS_ENDPOINT -U postgres -d postgres
CREATE DATABASE ml_workflow;
\c ml_workflow
CREATE EXTENSION vector;
```

### Verify Installation

```bash
# Source credentials
source ~/.versatil/credentials/aws.env

# Test connection
psql -h $RDS_ENDPOINT -U postgres -d ml_workflow

# In psql:
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
# Should show: vector | 0.5.0
```

### Cost Optimization (AWS)

```bash
# Development: Use burstable instance
# db.t3.micro (2 vCPU, 1GB RAM) = ~$12/month

# Production: Use reserved instances (40-60% savings)
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id YOUR_OFFERING_ID

# Use gp3 storage (20% cheaper than gp2)
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --storage-type gp3
```

## Supabase Setup

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Sign up for Supabase
# Visit: https://supabase.com/dashboard
```

### Automated Setup

```bash
# Run credential wizard and select Supabase
npm run setup:ml-credentials
# Select: 3. Supabase

# Prompts:
# - Supabase URL: https://xyz.supabase.co
# - Anon Key: eyJhbGc...
# - Service Role Key: eyJhbGc...
# - Database Password: (from Supabase dashboard)
```

### Manual Setup (Alternative)

```bash
# Link to Supabase project
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# Create migration for pgvector
supabase migration new enable_pgvector

# In the migration file:
cat > supabase/migrations/TIMESTAMP_enable_pgvector.sql <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
EOF

# Push migration
supabase db push

# Verify
supabase db diff
```

### Verify Installation

```bash
# Source credentials
source ~/.versatil/credentials/supabase.env

# Test connection via psql
psql "$SUPABASE_DATABASE_URL"

# Or via Supabase Studio
# Visit: https://app.supabase.com/project/YOUR_PROJECT/editor
```

### Cost Optimization (Supabase)

**Free Tier:**
- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

**Pro Plan ($25/month):**
- 8GB database
- 100GB file storage
- 250GB bandwidth
- Automatic daily backups

**Scaling Strategy:**
- Start with free tier for prototyping
- Upgrade to Pro when hitting limits
- Use Supabase Edge Functions (serverless, auto-scales)

## Multi-Cloud Architecture Patterns

### Pattern 1: Cloud-Agnostic Application

```typescript
// src/db/connection.ts
import { PrismaClient } from '@prisma/client';

// Auto-detect provider from DATABASE_URL
export function createDatabaseClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL not set');
  }

  // Detect provider
  const provider = url.includes('.cloudsql.')
    ? 'gcp'
    : url.includes('.rds.amazonaws.com')
    ? 'aws'
    : url.includes('.supabase.')
    ? 'supabase'
    : 'generic';

  console.log(`Detected database provider: ${provider}`);

  return new PrismaClient({
    datasources: {
      db: { url }
    }
  });
}
```

### Pattern 2: Multi-Cloud Migration

```bash
# Export from Cloud SQL
gcloud sql export sql ml-workflow-db \
  gs://your-bucket/backup.sql \
  --database=ml_workflow_dev

# Download
gsutil cp gs://your-bucket/backup.sql ./

# Import to RDS
psql -h RDS_ENDPOINT -U postgres -d ml_workflow < backup.sql

# Update DATABASE_URL
export DATABASE_URL="postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/ml_workflow"

# Run application (no code changes needed)
npm start
```

### Pattern 3: Multi-Region Deployment

**GCP Multi-Region:**
```bash
# Primary: us-central1
gcloud sql instances create ml-workflow-primary --region=us-central1

# Read replica: europe-west1
gcloud sql instances create ml-workflow-replica \
  --master-instance-name=ml-workflow-primary \
  --region=europe-west1
```

**AWS Multi-Region:**
```bash
# Primary: us-east-1
aws rds create-db-instance --db-instance-identifier ml-workflow-primary

# Cross-region read replica: eu-west-1
aws rds create-db-instance-read-replica \
  --db-instance-identifier ml-workflow-replica \
  --source-db-instance-identifier ml-workflow-primary \
  --region eu-west-1
```

## Security Best Practices

### 1. Credential Management

```bash
# Store credentials securely
chmod 600 ~/.versatil/credentials/*.env
chmod 600 ~/.versatil/credentials/*.json

# Never commit credentials
echo ".versatil/credentials/" >> .gitignore

# Use environment variables in CI/CD
# GitHub Secrets, GitLab CI/CD Variables, etc.
```

### 2. Network Security

**GCP:**
```bash
# Restrict to specific IP
gcloud sql instances patch ml-workflow-db \
  --authorized-networks=YOUR_IP/32

# Or use Cloud SQL Proxy (recommended)
cloud-sql-proxy --instances=PROJECT:REGION:INSTANCE=tcp:5432
```

**AWS:**
```bash
# Update security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXX \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP/32
```

### 3. IAM Authentication (Production)

**GCP:**
```typescript
import { Signer } from '@google-cloud/sql-iam-authentication';

const token = await getIAMToken({
  instanceConnectionName: 'PROJECT:REGION:INSTANCE',
  user: 'USER@example.com'
});

const pool = new Pool({
  password: token, // Use token as password
  ssl: true
});
```

**AWS:**
```typescript
import { Signer } from '@aws-sdk/rds-signer';

const signer = new Signer({
  hostname: RDS_ENDPOINT,
  port: 5432,
  username: 'postgres',
  region: 'us-east-1'
});

const token = await signer.getAuthToken();

const pool = new Pool({
  password: token,
  ssl: true
});
```

### 4. Encryption

```bash
# GCP: Encrypt with CMEK (Customer-Managed Encryption Keys)
gcloud sql instances create ml-workflow-db \
  --disk-encryption-key=projects/KEY_PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY

# AWS: Use AWS KMS
aws rds create-db-instance \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:REGION:ACCOUNT:key/KEY_ID
```

## Monitoring & Observability

### GCP Cloud SQL Insights

```bash
# Enable insights
gcloud sql instances patch ml-workflow-db \
  --insights-config-query-insights-enabled

# View slow queries
# GCP Console → SQL → Instance → Insights → Query Insights
```

### AWS Performance Insights

```bash
# Enable Performance Insights
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --enable-performance-insights

# View top SQL
# AWS Console → RDS → Performance Insights
```

### Application Monitoring

```typescript
// Add query logging
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' }
  ]
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## Troubleshooting

### Issue: Connection Timeout

**Symptoms:** `ETIMEDOUT` or `Connection refused`

**Solutions:**
```bash
# GCP: Check firewall rules
gcloud sql instances describe ml-workflow-db --format="value(ipConfiguration)"

# AWS: Check security groups
aws ec2 describe-security-groups --group-ids sg-XXXXXXXX

# Test connection
psql "postgresql://postgres:PASSWORD@ENDPOINT:5432/DATABASE"
```

### Issue: pgvector Not Found

**Symptoms:** `ERROR: type "vector" does not exist`

**Solutions:**
```bash
# GCP: pgvector is built-in, just create extension
gcloud sql connect ml-workflow-db --user=postgres
CREATE EXTENSION vector;

# AWS: Ensure parameter group applied and instance rebooted
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --db-parameter-group-name ml-workflow-postgres15-pgvector

aws rds reboot-db-instance --db-instance-identifier ml-workflow-db
```

### Issue: Too Many Connections

**Symptoms:** `FATAL: too many connections`

**Solutions:**
```bash
# GCP: Use Cloud SQL Proxy for connection pooling (free)
cloud-sql-proxy --instances=PROJECT:REGION:INSTANCE=tcp:5432

# AWS: Use RDS Proxy ($11/month)
aws rds create-db-proxy \
  --db-proxy-name ml-workflow-proxy \
  --engine-family POSTGRESQL

# Application: Limit connection pool size
const pool = new Pool({ max: 5 }); // Low per-instance pool
```

### Issue: Slow Queries

**Symptoms:** Queries taking >1s

**Solutions:**
```sql
-- Analyze query
EXPLAIN ANALYZE
SELECT * FROM embeddings WHERE category = 'user';

-- Add missing indexes
CREATE INDEX idx_embeddings_category ON embeddings(category);

-- For pgvector queries, use HNSW index
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

## Migration Between Providers

### GCP → AWS

```bash
# 1. Export from Cloud SQL
gcloud sql export sql ml-workflow-db gs://bucket/backup.sql --database=ml_workflow_dev
gsutil cp gs://bucket/backup.sql ./

# 2. Create RDS instance (use setup-aws-ml.sh)

# 3. Import to RDS
psql -h RDS_ENDPOINT -U postgres -d ml_workflow < backup.sql

# 4. Update application
export DATABASE_URL="postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/ml_workflow"
npm run migrate

# 5. Verify
npm run test:db
```

### AWS → GCP

```bash
# 1. Export from RDS
pg_dump -h RDS_ENDPOINT -U postgres -d ml_workflow > backup.sql

# 2. Upload to GCS
gsutil cp backup.sql gs://bucket/

# 3. Create Cloud SQL instance (use setup-gcp-ml.sh)

# 4. Import to Cloud SQL
gcloud sql import sql ml-workflow-db gs://bucket/backup.sql --database=ml_workflow_dev

# 5. Update application
export DATABASE_URL="postgresql://postgres:PASSWORD@INSTANCE_IP:5432/ml_workflow_dev"
npm run migrate
```

## VERSATIL Agent Integration

### Dana-Database Auto-Detection

Dana-Database agent automatically detects cloud provider:

```bash
# GCP
/dana-database Set up Cloud SQL for ML workflow

# AWS
/dana-database Set up AWS RDS for ML workflow

# Supabase
/dana-database Set up Supabase for ML workflow
```

### Dr.AI-ML Training

```bash
# GCP Vertex AI
/dr-ai-ml Train model on Vertex AI with Cloud SQL data

# AWS SageMaker
/dr-ai-ml Train model on SageMaker with RDS data
```

### Marcus-Backend API Deployment

```bash
# GCP Cloud Run
/marcus-backend Deploy API to Cloud Run with Cloud SQL

# AWS ECS
/marcus-backend Deploy API to ECS with RDS
```

## Cost Summary

| Setup | Monthly Cost | Free Tier | Best For |
|-------|--------------|-----------|----------|
| **GCP (Development)** | ~$50 | ❌ No | Small teams, Vertex AI |
| **GCP (Production)** | ~$110 | ❌ No | Scalable ML, Cloud Run |
| **AWS (Development)** | ~$12 | ❌ No | AWS ecosystem, prototyping |
| **AWS (Production)** | ~$150 | ❌ No | SageMaker, Lambda/ECS |
| **Supabase (Free)** | $0 | ✅ Yes | MVPs, hobby projects |
| **Supabase (Pro)** | $25 | ❌ No | Small apps, edge functions |

## Resources

- **Cloud SQL Guide**: [.claude/skills/database-guides/cloud-sql/SKILL.md](../../.claude/skills/database-guides/cloud-sql/SKILL.md)
- **AWS RDS Guide**: [.claude/skills/database-guides/aws-rds/SKILL.md](../../.claude/skills/database-guides/aws-rds/SKILL.md)
- **Dana-Database Agent**: [.claude/agents/dana-database.md](../../.claude/agents/dana-database.md)
- **Credential Templates**: [src/onboarding/credential-templates.ts](../../src/onboarding/credential-templates.ts)

## Support

For issues or questions:
- GitHub Issues: https://github.com/versatil-ai/sdlc-framework/issues
- Discord: https://discord.gg/versatil
- Docs: https://docs.versatil.ai

---

**Last Updated**: 2025-10-29
**Version**: 7.15.0
