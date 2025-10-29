---
name: "cloud-sql"
category: "database-guides"
priority: "high"
tags: ["gcp", "postgresql", "cloud-sql", "pgvector", "managed-database"]
description: "Google Cloud SQL PostgreSQL setup, pgvector configuration, and performance optimization for ML workflows"
usedBy: ["Dana-Database", "Dr.AI-ML", "Marcus-Backend"]
triggerKeywords: ["cloud sql", "gcp database", "managed postgresql", "cloud sql proxy"]
---

# Cloud SQL PostgreSQL Guide

**Purpose**: Guide for setting up and optimizing Google Cloud SQL PostgreSQL instances for ML workflows with pgvector support.

## When to Use

✅ **Use Cloud SQL when:**
- Building production ML applications on GCP
- Need managed PostgreSQL with automatic backups
- Require high availability (99.95% SLA)
- Want pgvector for RAG/embeddings storage
- Using Cloud Run, Vertex AI, or other GCP services

❌ **Don't use Cloud SQL when:**
- Local development only (use Docker PostgreSQL)
- Budget constrained (use Supabase free tier)
- Multi-cloud requirement (consider Amazon RDS)
- Need <10ms latency (use in-memory databases)

## Quick Start (5 minutes)

### Option 1: Using Existing Terraform (Recommended)

```bash
# Navigate to infrastructure directory
cd infrastructure/terraform

# Review Cloud SQL configuration
cat gcp-cloud-sql.tf

# Deploy
terraform init
terraform plan
terraform apply

# Get connection details
terraform output database_connection_string
# Output: postgresql://postgres:PASSWORD@IP:5432/DATABASE
```

### Option 2: Using gcloud CLI

```bash
# Create Cloud SQL instance (PostgreSQL 15)
gcloud sql instances create ml-workflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --database-flags=cloudsql.iam_authentication=on \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=3

# Create database
gcloud sql databases create ml_workflow_dev \
  --instance=ml-workflow-db

# Set user password
gcloud sql users set-password postgres \
  --instance=ml-workflow-db \
  --password=YOUR_SECURE_PASSWORD

# Get connection name
gcloud sql instances describe ml-workflow-db \
  --format="value(connectionName)"
# Output: PROJECT_ID:REGION:INSTANCE_NAME
```

## pgvector Extension Setup

### Enable pgvector (Required for RAG)

```bash
# Connect to Cloud SQL instance
gcloud sql connect ml-workflow-db --user=postgres

# In psql shell
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
\dx
# Should show: vector | 0.5.0 | public | vector data type and ivfflat access method

# Test vector operations
CREATE TABLE test_embeddings (
  id SERIAL PRIMARY KEY,
  embedding vector(384)
);

INSERT INTO test_embeddings (embedding)
VALUES ('[0.1, 0.2, 0.3, ...]');

-- Cosine similarity search
SELECT id, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) as similarity
FROM test_embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

### pgvector Index Strategies

**For <100K vectors: Use HNSW (recommended)**
```sql
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
-- Benefits: 10-100x faster queries, <50ms latency
-- Trade-off: 20% more storage, 5-10 min build time
```

**For >1M vectors: Use IVFFlat**
```sql
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);
-- Benefits: Lower memory usage, faster builds
-- Trade-off: Slower queries (100-200ms), 95% accuracy
```

**Distance Operators:**
- `<=>` - Cosine distance (most common for embeddings)
- `<->` - Euclidean distance
- `<#>` - Inner product (for normalized vectors)

## Connection Patterns

### Pattern 1: Public IP with Authorized Networks

**Best for**: Development, testing, small apps

```typescript
// .env configuration
DATABASE_URL="postgresql://postgres:PASSWORD@35.225.220.255:5432/ml_workflow_dev"

// Connection in code
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Cloud SQL uses self-signed certs
  },
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Security Setup:**
```bash
# Authorize your IP
gcloud sql instances patch ml-workflow-db \
  --authorized-networks=YOUR_IP/32

# Or allow specific CIDR range
gcloud sql instances patch ml-workflow-db \
  --authorized-networks=10.0.0.0/24
```

### Pattern 2: Cloud SQL Proxy (Production Recommended)

**Best for**: Production Cloud Run deployments, local dev with Cloud SQL

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy \
  https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64

chmod +x cloud-sql-proxy

# Start proxy (local development)
./cloud-sql-proxy \
  --credentials-file=~/.versatil/gcp-key.json \
  PROJECT_ID:REGION:INSTANCE_NAME
# Now connect via: localhost:5432
```

**Cloud Run Configuration:**
```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ml-workflow-api
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: PROJECT_ID:REGION:INSTANCE_NAME
    spec:
      containers:
      - image: gcr.io/PROJECT/api:latest
        env:
        - name: DB_HOST
          value: "/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
```

### Pattern 3: Private IP with VPC Peering

**Best for**: Enterprise production, multi-service architectures

```bash
# Create private IP for Cloud SQL
gcloud sql instances patch ml-workflow-db \
  --network=projects/PROJECT_ID/global/networks/default \
  --no-assign-ip

# Get private IP
gcloud sql instances describe ml-workflow-db \
  --format="value(ipAddresses[0].ipAddress)"
# Use this IP in DATABASE_URL
```

## Performance Optimization

### Connection Pooling (Critical for Cloud Run)

**Problem**: Cloud Run scales to zero → connection churn → 5-10s cold starts

**Solution**: Use PgBouncer or Prisma connection pooling

```typescript
// Using Prisma with connection pooling
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=5'
    }
  }
});

// Connection string format
// postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=5&pool_timeout=10
```

**PgBouncer Setup** (Advanced):
```bash
# Deploy PgBouncer in Cloud Run
gcloud run deploy pgbouncer \
  --image=edoburu/pgbouncer:latest \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --set-cloudsql-instances=PROJECT:REGION:INSTANCE

# Update app to connect to PgBouncer
DATABASE_URL="postgresql://pgbouncer-service-url:5432/db"
```

### Query Optimization Tips

**1. Use EXPLAIN ANALYZE for slow queries**
```sql
EXPLAIN ANALYZE
SELECT * FROM ml_experiments
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- Look for:
-- - Seq Scan (bad) → needs index
-- - Index Scan (good)
-- - Execution time > 100ms → optimize
```

**2. Index common filters and sorts**
```sql
-- Index for status filter + timestamp sort
CREATE INDEX idx_experiments_status_created
ON ml_experiments (status, created_at DESC);

-- Composite index for multi-column filters
CREATE INDEX idx_experiments_user_status
ON ml_experiments (user_id, status)
WHERE status != 'deleted';
```

**3. Use partial indexes for common queries**
```sql
-- Index only active experiments (saves 80% space)
CREATE INDEX idx_active_experiments
ON ml_experiments (created_at DESC)
WHERE status IN ('running', 'pending');
```

**4. Optimize pgvector queries**
```sql
-- Pre-filter before vector search (10x faster)
SELECT id, 1 - (embedding <=> $1) as similarity
FROM embeddings
WHERE category = 'user-patterns' -- Filter first
ORDER BY embedding <=> $1
LIMIT 5;

-- Use covering index
CREATE INDEX idx_embeddings_category_vector
ON embeddings (category) INCLUDE (embedding);
```

### Resource Sizing Recommendations

| Workload | Tier | vCPUs | RAM | Storage | Cost/Month |
|----------|------|-------|-----|---------|------------|
| **Dev/Test** | db-f1-micro | Shared | 0.6GB | 10GB | ~$7 |
| **Small Production** | db-custom-1-3840 | 1 | 3.75GB | 50GB | ~$50 |
| **ML Workflow** | db-custom-2-7680 | 2 | 7.5GB | 100GB | ~$110 |
| **High Volume** | db-custom-4-15360 | 4 | 15GB | 200GB | ~$220 |

**Scaling Triggers**:
- CPU > 80% sustained → add vCPUs
- Memory > 90% → increase RAM
- Storage > 85% → add storage (automatic in Cloud SQL)
- Connections > max_connections → add PgBouncer

## Security Best Practices

### 1. IAM Authentication (No Passwords)

```bash
# Create Cloud SQL IAM user
gcloud sql users create maria@example.com \
  --instance=ml-workflow-db \
  --type=CLOUD_IAM_USER

# Grant database privileges
gcloud sql connect ml-workflow-db --user=postgres
# In psql:
GRANT ALL PRIVILEGES ON DATABASE ml_workflow_dev TO "maria@example.com";
```

**Connect with IAM:**
```typescript
import { getIAMToken } from '@google-cloud/sql-iam-authentication';

const token = await getIAMToken({
  instanceConnectionName: 'PROJECT:REGION:INSTANCE',
  user: 'maria@example.com'
});

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'maria@example.com',
  password: token, // Use IAM token as password
  database: 'ml_workflow_dev',
  ssl: true
});
```

### 2. SSL Enforcement

```bash
# Require SSL for all connections
gcloud sql instances patch ml-workflow-db \
  --require-ssl

# Generate client certificates (optional)
gcloud sql ssl-certs create client-cert client-key.pem \
  --instance=ml-workflow-db
```

### 3. Audit Logging

```bash
# Enable audit logging
gcloud sql instances patch ml-workflow-db \
  --database-flags=cloudsql.enable_pgaudit=on,pgaudit.log=all

# View logs
gcloud logging read "resource.type=cloudsql_database" \
  --limit=50 \
  --format=json
```

### 4. Row-Level Security (RLS) for Multi-Tenancy

```sql
-- Enable RLS on table
ALTER TABLE ml_experiments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own experiments
CREATE POLICY user_isolation ON ml_experiments
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Set user context in application
SET app.current_user_id = '123e4567-e89b-12d3-a456-426614174000';
```

## Cost Optimization

### 1. Right-Size Your Instance

**Use Cloud SQL Insights to analyze:**
```bash
# Enable Cloud SQL Insights
gcloud sql instances patch ml-workflow-db \
  --insights-config-query-insights-enabled

# View recommendations
gcloud sql instances describe ml-workflow-db \
  --format="value(settings.insightsConfig)"
```

**Common over-provisioning issues:**
- ❌ db-custom-4-15360 with 5% CPU usage → downsize to db-custom-1-3840
- ❌ 200GB storage with 20GB used → reduce to 50GB

### 2. Backup Strategy

**Built-in automated backups** (included in pricing):
```bash
# Configure backups (30-day retention)
gcloud sql instances patch ml-workflow-db \
  --backup-start-time=02:00 \
  --retained-backups-count=30 \
  --transaction-log-retention-days=7

# On-demand backup (before major changes)
gcloud sql backups create --instance=ml-workflow-db
```

**Cost breakdown:**
- Automated backups: **FREE** (included)
- Additional backups: $0.08/GB/month
- Point-in-time recovery: **FREE** (7-day window)

### 3. Dev/Staging/Prod Strategy

**Clone production for staging** (instead of separate instance):
```bash
# Create clone (costs = original instance for active time)
gcloud sql instances clone ml-workflow-db ml-workflow-staging

# Delete after testing
gcloud sql instances delete ml-workflow-staging
```

**Savings**: ~$110/month (avoid separate staging instance)

### 4. Storage Lifecycle

**Problem**: Cloud SQL doesn't automatically delete old data

**Solution**: Implement data retention policies
```sql
-- Delete old experiment logs (>90 days)
DELETE FROM ml_experiment_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive to Cloud Storage before deletion
COPY (
  SELECT * FROM ml_experiment_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
) TO PROGRAM 'gsutil cp - gs://bucket/archives/logs-$(date +%Y%m%d).csv';
```

## Integration Examples

### Example 1: Prisma Schema for ML Workflow

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Experiment {
  id              String   @id @default(uuid())
  name            String
  status          String   @default("pending")
  userId          String   @map("user_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  metrics         Metric[]
  artifacts       Artifact[]

  @@index([status, createdAt(sort: Desc)])
  @@index([userId, status])
  @@map("ml_experiments")
}

model Embedding {
  id          String                  @id @default(uuid())
  content     String
  embedding   Unsupported("vector(384)")
  category    String
  createdAt   DateTime                @default(now()) @map("created_at")

  @@index([category], type: BTree)
  @@map("embeddings")
}
```

**Generate Prisma client:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Example 2: Cloud Run Service with Cloud SQL

```typescript
// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// Graceful shutdown (important for Cloud Run)
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Example 3: Terraform Configuration (Production-Ready)

```hcl
# infrastructure/terraform/gcp-cloud-sql.tf
resource "google_sql_database_instance" "main" {
  name             = "ml-workflow-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-custom-2-7680"

    # High availability (99.95% SLA)
    availability_type = "REGIONAL"

    # Backups
    backup_configuration {
      enabled            = true
      start_time         = "02:00"
      location           = var.gcp_region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    # Maintenance window
    maintenance_window {
      day          = 7 # Sunday
      hour         = 3
      update_track = "stable"
    }

    # Performance
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    database_flags {
      name  = "shared_buffers"
      value = "1966080" # 25% of RAM (7.5GB * 0.25 / 8KB pages)
    }

    # Security
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled    = true
      require_ssl     = true
      authorized_networks {
        name  = "office"
        value = var.office_ip_range
      }
    }

    # Insights
    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
      record_application_tags = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "main" {
  name     = "ml_workflow_${var.environment}"
  instance = google_sql_database_instance.main.name
}

# Service account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

## Troubleshooting

### Issue 1: Connection Refused

**Symptom**: `ECONNREFUSED` or `Connection refused` errors

**Checklist**:
1. ✅ Verify Cloud SQL instance is running
   ```bash
   gcloud sql instances describe ml-workflow-db --format="value(state)"
   # Should show: RUNNABLE
   ```

2. ✅ Check authorized networks (if using public IP)
   ```bash
   gcloud sql instances describe ml-workflow-db \
     --format="value(settings.ipConfiguration.authorizedNetworks)"
   ```

3. ✅ Test connection with psql
   ```bash
   psql "host=IP dbname=ml_workflow_dev user=postgres password=PASS"
   ```

4. ✅ Verify firewall rules allow port 5432

### Issue 2: Too Many Connections

**Symptom**: `FATAL: too many connections for role "postgres"`

**Cause**: Connection pool exhaustion (default max_connections = 100)

**Solutions**:
1. **Increase max_connections** (requires instance restart)
   ```bash
   gcloud sql instances patch ml-workflow-db \
     --database-flags=max_connections=200
   ```

2. **Use connection pooling** (recommended)
   ```typescript
   // Limit pool size per Cloud Run instance
   const pool = new Pool({
     max: 5, // Low per-instance pool
     connectionString: process.env.DATABASE_URL
   });
   ```

3. **Find and kill idle connections**
   ```sql
   -- View active connections
   SELECT pid, usename, state, query
   FROM pg_stat_activity
   WHERE state != 'idle';

   -- Kill idle connections (>10 minutes)
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < NOW() - INTERVAL '10 minutes';
   ```

### Issue 3: Slow Queries (>1s)

**Symptom**: Queries taking 1-10 seconds

**Diagnosis**:
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries >1s
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Common fixes**:
1. **Missing indexes** → Create indexes on filtered/sorted columns
2. **Sequential scans** → Add indexes or rewrite query
3. **N+1 queries** → Use JOINs or batch loading
4. **Large result sets** → Add pagination (LIMIT/OFFSET)

### Issue 4: pgvector Extension Not Found

**Symptom**: `ERROR: type "vector" does not exist`

**Solution**:
```bash
# Connect to Cloud SQL
gcloud sql connect ml-workflow-db --user=postgres

# Create extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS vector;

# If error "permission denied"
# Cloud SQL postgres user has limited permissions
# Contact GCP support or use managed Supabase
```

## References

- **Official Docs**: [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- **pgvector**: [Extension documentation](https://github.com/pgvector/pgvector)
- **Prisma + Cloud SQL**: [Connection guide](https://www.prisma.io/docs/guides/database/using-prisma-with-google-cloud-sql)
- **Current Implementation**: [infrastructure/terraform/gcp-cloud-sql.tf](../../infrastructure/terraform/gcp-cloud-sql.tf)

## Related Skills

- **vector-databases** - pgvector indexing strategies (HNSW vs IVFFlat)
- **schema-optimization** - Query optimization, index selection
- **rls-policies** - Multi-tenant data isolation patterns
- **aws-rds** - Alternative for multi-cloud deployments

---

**Last Updated**: 2025-10-29
**Agent**: Dana-Database
**Confidence**: 95% (based on production deployment in ML workflow project)
