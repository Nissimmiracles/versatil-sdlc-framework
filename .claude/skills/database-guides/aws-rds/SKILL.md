---
name: "aws-rds"
category: "database-guides"
priority: "high"
tags: ["aws", "rds", "postgresql", "pgvector", "managed-database"]
description: "Amazon RDS PostgreSQL setup, pgvector configuration, and multi-cloud ML workflow deployment"
usedBy: ["Dana-Database", "Dr.AI-ML", "Marcus-Backend"]
triggerKeywords: ["aws rds", "amazon rds", "rds postgresql", "aws database"]
---

# AWS RDS PostgreSQL Guide

**Purpose**: Guide for setting up and optimizing Amazon RDS PostgreSQL instances for ML workflows with pgvector support as an alternative to Google Cloud SQL.

## When to Use

✅ **Use AWS RDS when:**
- Building ML applications on AWS infrastructure
- Using SageMaker for model training
- Need multi-AZ high availability (99.95% SLA)
- Require pgvector for RAG/embeddings storage
- Already have AWS infrastructure (ECS, Lambda, EC2)

❌ **Don't use AWS RDS when:**
- GCP-first architecture (use Cloud SQL instead)
- Local development only (use Docker PostgreSQL)
- Budget constrained <$50/month (use Supabase)
- Need <5ms latency (use DynamoDB or ElastiCache)

## Quick Start (5 minutes)

### Option 1: Using AWS CLI

```bash
# Create RDS PostgreSQL instance (version 15)
aws rds create-db-instance \
  --db-instance-identifier ml-workflow-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-XXXXXXXX \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "sun:03:00-sun:04:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --storage-encrypted \
  --publicly-accessible

# Wait for instance to be available (5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier ml-workflow-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier ml-workflow-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
# Output: ml-workflow-db.cXXXXXXXXXXX.us-east-1.rds.amazonaws.com
```

### Option 2: Using Terraform (Recommended)

```hcl
# infrastructure/terraform/aws-rds.tf
resource "aws_db_instance" "main" {
  identifier = "ml-workflow-${var.environment}"

  # Engine
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.medium"

  # Storage
  allocated_storage     = 100
  max_allocated_storage = 500  # Auto-scaling up to 500GB
  storage_type         = "gp3"
  storage_encrypted    = true

  # Database
  db_name  = "ml_workflow_dev"
  username = "postgres"
  password = var.db_password  # Use AWS Secrets Manager
  port     = 5432

  # High Availability
  multi_az               = true  # 99.95% SLA

  # Backups
  backup_retention_period = 7
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_monitoring.arn

  # Security
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false

  # Deletion protection
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "ml-workflow-final-${timestamp()}"

  tags = {
    Name        = "ml-workflow-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Security group
resource "aws_security_group" "rds" {
  name        = "rds-ml-workflow"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from application"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Output connection string
output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
  description = "RDS PostgreSQL endpoint"
}

output "database_url" {
  value = "postgresql://${aws_db_instance.main.username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive = true
}
```

## pgvector Extension Setup

### Enable pgvector (Required for RAG)

**Step 1: Create Parameter Group with pgvector**

```bash
# Create custom parameter group (required for pgvector)
aws rds create-db-parameter-group \
  --db-parameter-group-name ml-workflow-postgres15 \
  --db-parameter-group-family postgres15 \
  --description "PostgreSQL 15 with pgvector support"

# Modify parameters for pgvector
aws rds modify-db-parameter-group \
  --db-parameter-group-name ml-workflow-postgres15 \
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=vector,ApplyMethod=pending-reboot"

# Apply parameter group to instance
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --db-parameter-group-name ml-workflow-postgres15 \
  --apply-immediately

# Reboot instance (required for shared_preload_libraries)
aws rds reboot-db-instance \
  --db-instance-identifier ml-workflow-db
```

**Step 2: Install pgvector Extension**

```bash
# Connect to RDS instance
psql "postgresql://postgres:PASSWORD@ENDPOINT:5432/ml_workflow_dev"

# Create extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
\dx
-- Should show: vector | 0.5.0 | public | vector data type and ivfflat access method

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

### pgvector Index Strategies (Same as Cloud SQL)

**For <100K vectors: Use HNSW**
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

## Connection Patterns

### Pattern 1: IAM Database Authentication (Production Recommended)

**Best for**: ECS Fargate, Lambda, EC2 with IAM roles

```typescript
// AWS SDK for IAM authentication
import { Signer } from '@aws-sdk/rds-signer';
import { Pool } from 'pg';

async function getIAMAuthToken() {
  const signer = new Signer({
    hostname: process.env.RDS_ENDPOINT,
    port: 5432,
    username: 'postgres',
    region: 'us-east-1'
  });

  return await signer.getAuthToken();
}

async function createPool() {
  const token = await getIAMAuthToken();

  return new Pool({
    host: process.env.RDS_ENDPOINT,
    port: 5432,
    user: 'postgres',
    password: token, // IAM token expires after 15 minutes
    database: 'ml_workflow_dev',
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('./rds-ca-bundle.pem')
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
}

// Refresh token every 10 minutes (before 15-min expiry)
setInterval(async () => {
  const newToken = await getIAMAuthToken();
  pool.password = newToken;
}, 10 * 60 * 1000);
```

**IAM Policy for Database Access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "rds-db:connect",
      "Resource": "arn:aws:rds-db:us-east-1:ACCOUNT_ID:dbuser:db-INSTANCE-ID/postgres"
    }
  ]
}
```

**Enable IAM Auth on RDS:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --enable-iam-database-authentication \
  --apply-immediately
```

### Pattern 2: AWS Secrets Manager (Recommended)

**Best for**: Automatic credential rotation, multi-service access

```typescript
// Retrieve credentials from Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getDBCredentials() {
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: 'ml-workflow/rds/postgres'
    })
  );

  return JSON.parse(response.SecretString);
}

async function createPoolWithSecrets() {
  const secrets = await getDBCredentials();

  return new Pool({
    host: secrets.host,
    port: secrets.port,
    user: secrets.username,
    password: secrets.password,
    database: secrets.dbname,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('./rds-ca-bundle.pem')
    },
    max: 20
  });
}
```

**Create Secret:**
```bash
aws secretsmanager create-secret \
  --name ml-workflow/rds/postgres \
  --description "RDS PostgreSQL credentials" \
  --secret-string '{
    "host": "ml-workflow-db.xxxxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "username": "postgres",
    "password": "YOUR_PASSWORD",
    "dbname": "ml_workflow_dev",
    "engine": "postgres"
  }'

# Enable automatic rotation (every 30 days)
aws secretsmanager rotate-secret \
  --secret-id ml-workflow/rds/postgres \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT:function:rds-rotation \
  --rotation-rules AutomaticallyAfterDays=30
```

### Pattern 3: VPC Peering with Private Subnet

**Best for**: Multi-VPC architectures, enhanced security

```hcl
# RDS in private subnet (no public IP)
resource "aws_db_subnet_group" "main" {
  name       = "ml-workflow-db-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "ML Workflow DB subnet group"
  }
}

resource "aws_db_instance" "main" {
  # ... other settings ...

  db_subnet_group_name = aws_db_subnet_group.main.name
  publicly_accessible  = false  # No public IP

  vpc_security_group_ids = [aws_security_group.rds.id]
}

# Application in same VPC can connect directly
resource "aws_ecs_task_definition" "api" {
  # ... task definition ...

  container_definitions = jsonencode([{
    name  = "api"
    image = "ml-workflow-api:latest"
    environment = [{
      name  = "DATABASE_URL"
      value = "postgresql://postgres:PASSWORD@${aws_db_instance.main.endpoint}/ml_workflow_dev"
    }]
  }])
}
```

## Performance Optimization

### Connection Pooling for Lambda/Fargate

**Problem**: Serverless functions create new connections on every invocation → exhaustion

**Solution**: Use RDS Proxy (managed connection pooler)

```hcl
# Create RDS Proxy
resource "aws_db_proxy" "main" {
  name                   = "ml-workflow-proxy"
  engine_family          = "POSTGRESQL"
  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "REQUIRED"
    secret_arn  = aws_secretsmanager_secret.db_credentials.arn
  }

  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  require_tls            = true

  # Connection pooling settings
  idle_client_timeout    = 1800  # 30 minutes
  max_connections_percent = 100
  max_idle_connections_percent = 50
}

resource "aws_db_proxy_target" "main" {
  db_proxy_name = aws_db_proxy.main.name
  target_arn    = aws_db_instance.main.arn
}
```

**Connect via RDS Proxy:**
```typescript
const pool = new Pool({
  host: 'ml-workflow-proxy.proxy-xxxxxx.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: await getIAMAuthToken(), // IAM auth for proxy
  database: 'ml_workflow_dev',
  ssl: true
});
```

**Benefits:**
- ✅ Reduce connection overhead by 90%
- ✅ Handle 10,000+ concurrent Lambda invocations
- ✅ Automatic connection recycling
- ✅ Built-in failover support

### Query Optimization (Same as Cloud SQL)

**1. Enable Performance Insights**
```bash
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --enable-performance-insights \
  --performance-insights-retention-period 7

# View top SQL queries in AWS Console
# RDS → Performance Insights → Top SQL
```

**2. Use EXPLAIN ANALYZE**
```sql
EXPLAIN ANALYZE
SELECT * FROM ml_experiments
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;

-- Look for Seq Scan → create index
```

**3. Create Indexes**
```sql
-- Status + timestamp index
CREATE INDEX idx_experiments_status_created
ON ml_experiments (status, created_at DESC);

-- Partial index for active only
CREATE INDEX idx_active_experiments
ON ml_experiments (created_at DESC)
WHERE status IN ('running', 'pending');
```

### Resource Sizing Recommendations

| Workload | Instance Class | vCPUs | RAM | Storage | Cost/Month |
|----------|---------------|-------|-----|---------|------------|
| **Dev/Test** | db.t3.micro | 2 | 1GB | 20GB gp3 | ~$12 |
| **Small Production** | db.t3.medium | 2 | 4GB | 100GB gp3 | ~$60 |
| **ML Workflow** | db.r6g.large | 2 | 16GB | 200GB gp3 | ~$150 |
| **High Volume** | db.r6g.xlarge | 4 | 32GB | 500GB gp3 | ~$300 |

**Instance Family Guide:**
- **T3/T4g**: Burstable (dev/test, variable workloads)
- **M6g**: General purpose (balanced CPU/memory)
- **R6g**: Memory optimized (ML workflows, large datasets)
- **X2g**: Extra memory (>100GB RAM needed)

**Auto-scaling storage:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --max-allocated-storage 500 \
  --apply-immediately
```

## Security Best Practices

### 1. Encryption at Rest and In Transit

```bash
# Enable encryption at rest (new instances only)
aws rds create-db-instance \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID \
  ...

# Enforce SSL/TLS connections
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --db-parameter-group-name ml-workflow-ssl-required

# In parameter group
aws rds modify-db-parameter-group \
  --db-parameter-group-name ml-workflow-ssl-required \
  --parameters "ParameterName=rds.force_ssl,ParameterValue=1,ApplyMethod=immediate"
```

**Download RDS CA bundle:**
```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

### 2. Network Isolation with Security Groups

```hcl
# Security group - allow only from application tier
resource "aws_security_group" "rds" {
  name        = "rds-ml-workflow"
  description = "RDS PostgreSQL security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "PostgreSQL from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  # No egress rules needed for database
}
```

### 3. Audit Logging with CloudWatch

```bash
# Enable PostgreSQL logs export to CloudWatch
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --cloudwatch-logs-export-configuration \
    '{"EnableLogTypes":["postgresql","upgrade"]}'

# View logs
aws logs tail /aws/rds/instance/ml-workflow-db/postgresql --follow
```

**Enable pgAudit for detailed auditing:**
```sql
-- Install pgaudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit logging
ALTER SYSTEM SET pgaudit.log = 'all';
SELECT pg_reload_conf();

-- View audit logs in CloudWatch
```

### 4. Least Privilege IAM Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": [
        "arn:aws:rds-db:us-east-1:ACCOUNT:dbuser:db-INSTANCE-ID/app_user"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ml-workflow/rds/*"
      ]
    }
  ]
}
```

## Cost Optimization

### 1. Use Reserved Instances (40-60% savings)

```bash
# Purchase 1-year reserved instance (40% off)
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --db-instance-count 1

# View available offerings
aws rds describe-reserved-db-instances-offerings \
  --db-instance-class db.r6g.large \
  --product-description postgresql
```

**Cost comparison (db.r6g.large):**
- On-demand: $0.21/hour = ~$150/month
- 1-year reserved: $0.13/hour = ~$95/month (37% savings)
- 3-year reserved: $0.09/hour = ~$65/month (57% savings)

### 2. Use gp3 Storage (20% cheaper than gp2)

```bash
# Upgrade gp2 → gp3 (no downtime)
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --storage-type gp3 \
  --allocated-storage 100 \
  --iops 3000 \
  --storage-throughput 125 \
  --apply-immediately

# Cost: gp2 = $0.115/GB/month, gp3 = $0.092/GB/month
# Savings: 20% on storage costs
```

### 3. Optimize Backup Retention

```bash
# Reduce backup retention (7 days sufficient for dev)
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --backup-retention-period 7

# Snapshot costs: $0.095/GB/month
# Retention policy reduces long-term storage costs
```

### 4. Delete Unused Snapshots

```bash
# List all snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier ml-workflow-db

# Delete old manual snapshots
aws rds delete-db-snapshot \
  --db-snapshot-identifier ml-workflow-db-2024-01-01
```

### 5. Dev/Staging Strategy

**Use Aurora Serverless v2 for dev/staging** (scales to zero)
```hcl
resource "aws_rds_cluster" "dev" {
  cluster_identifier = "ml-workflow-dev"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "15.4"

  serverlessv2_scaling_configuration {
    max_capacity = 1.0  # 1 ACU = 2GB RAM
    min_capacity = 0.5  # Scale to 0.5 ACU when idle
  }
}

# Cost: Pay only for active time
# Dev environment idle 80% of time → save ~$120/month
```

## Multi-Cloud Comparison: AWS RDS vs GCP Cloud SQL

| Feature | AWS RDS | GCP Cloud SQL |
|---------|---------|---------------|
| **pgvector Support** | ✅ Custom parameter group | ✅ Built-in |
| **Connection Pooling** | RDS Proxy ($0.015/hour) | Cloud SQL Proxy (free) |
| **IAM Auth** | ✅ Native | ✅ Native |
| **High Availability** | Multi-AZ (99.95%) | Regional (99.95%) |
| **Auto Storage Scaling** | ✅ Up to max limit | ✅ Automatic |
| **Reserved Pricing** | 40-60% savings | Committed use (37-57% savings) |
| **Backup Retention** | 0-35 days | 1-365 days |
| **Read Replicas** | Up to 15 | Up to 10 |
| **Cost (db.r6g.large)** | ~$150/month | ~$110/month (db-custom-2-7680) |

**When to choose AWS RDS:**
- ✅ Already on AWS (Lambda, ECS, SageMaker)
- ✅ Need Aurora Serverless for dev/staging
- ✅ Multi-region read replicas required
- ✅ Integration with AWS Secrets Manager

**When to choose GCP Cloud SQL:**
- ✅ Already on GCP (Cloud Run, Vertex AI)
- ✅ Free Cloud SQL Proxy (vs $11/month RDS Proxy)
- ✅ Lower base cost (~25% cheaper)
- ✅ Simpler pgvector setup (no parameter groups)

## Integration Examples

### Example 1: ECS Fargate + RDS with IAM Auth

```typescript
// src/db/connection.ts
import { Signer } from '@aws-sdk/rds-signer';
import { PrismaClient } from '@prisma/client';

async function getRDSAuthToken(): Promise<string> {
  const signer = new Signer({
    hostname: process.env.RDS_ENDPOINT!,
    port: 5432,
    username: 'postgres',
    region: process.env.AWS_REGION || 'us-east-1'
  });

  return await signer.getAuthToken();
}

let prisma: PrismaClient;

export async function getPrismaClient(): Promise<PrismaClient> {
  if (prisma) return prisma;

  const token = await getRDSAuthToken();

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://postgres:${token}@${process.env.RDS_ENDPOINT}:5432/ml_workflow_dev?sslmode=require`
      }
    }
  });

  // Refresh token every 10 minutes
  setInterval(async () => {
    const newToken = await getRDSAuthToken();
    await prisma.$disconnect();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://postgres:${newToken}@${process.env.RDS_ENDPOINT}:5432/ml_workflow_dev?sslmode=require`
        }
      }
    });
  }, 10 * 60 * 1000);

  return prisma;
}
```

### Example 2: Lambda Function with RDS Proxy

```typescript
// lambda/handler.ts
import { Handler } from 'aws-lambda';
import { getPrismaClient } from './db/connection';

export const handler: Handler = async (event) => {
  const prisma = await getPrismaClient();

  try {
    const experiments = await prisma.experiment.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      statusCode: 200,
      body: JSON.stringify(experiments)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### Example 3: SageMaker Training Job with RDS

```python
# sagemaker/train.py
import os
import psycopg2
import boto3
from sagemaker_training import environment

def get_db_connection():
    """Connect to RDS using IAM authentication"""
    client = boto3.client('rds')

    token = client.generate_db_auth_token(
        DBHostname=os.environ['RDS_ENDPOINT'],
        Port=5432,
        DBUsername='postgres',
        Region=os.environ['AWS_REGION']
    )

    return psycopg2.connect(
        host=os.environ['RDS_ENDPOINT'],
        port=5432,
        user='postgres',
        password=token,
        database='ml_workflow_dev',
        sslmode='require'
    )

def load_training_data():
    """Load training data from RDS"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT feature_vector, label
        FROM training_data
        WHERE dataset_version = %s
    """, (os.environ['DATASET_VERSION'],))

    return cursor.fetchall()

if __name__ == '__main__':
    env = environment.Environment()
    data = load_training_data()
    # ... training logic ...
```

## Troubleshooting

### Issue 1: Connection Timeout

**Symptom**: `Connection timed out` or `Could not connect to server`

**Checklist**:
1. ✅ Verify RDS instance is available
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier ml-workflow-db \
     --query 'DBInstances[0].DBInstanceStatus'
   # Should show: "available"
   ```

2. ✅ Check security group rules
   ```bash
   aws ec2 describe-security-groups \
     --group-ids sg-xxxxxxxx \
     --query 'SecurityGroups[0].IpPermissions'
   ```

3. ✅ Verify VPC routing
   ```bash
   # Check route table has route to RDS subnet
   aws ec2 describe-route-tables \
     --filters "Name=vpc-id,Values=vpc-xxxxxxxx"
   ```

4. ✅ Test connectivity from application subnet
   ```bash
   # SSH into EC2 in same VPC
   psql "host=ENDPOINT dbname=ml_workflow_dev user=postgres"
   ```

### Issue 2: IAM Authentication Failed

**Symptom**: `FATAL: password authentication failed for user "postgres"`

**Solutions**:
1. **Verify IAM auth enabled**
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier ml-workflow-db \
     --query 'DBInstances[0].IAMDatabaseAuthenticationEnabled'
   # Should return: true
   ```

2. **Check IAM policy attached to role**
   ```bash
   aws iam get-role-policy \
     --role-name ecs-task-role \
     --policy-name rds-access
   ```

3. **Verify token generation**
   ```typescript
   const token = await signer.getAuthToken();
   console.log('Token length:', token.length); // Should be ~500-700 chars
   console.log('Token starts with:', token.substring(0, 50));
   ```

4. **Check CA certificate**
   ```bash
   # Download latest CA bundle
   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```

### Issue 3: pgvector Extension Not Found

**Symptom**: `ERROR: type "vector" does not exist`

**Solution**:
```bash
# Verify parameter group has vector in shared_preload_libraries
aws rds describe-db-parameters \
  --db-parameter-group-name ml-workflow-postgres15 \
  --filters "Name=parameter-name,Values=shared_preload_libraries"

# If not set, modify and reboot
aws rds modify-db-parameter-group \
  --db-parameter-group-name ml-workflow-postgres15 \
  --parameters "ParameterName=shared_preload_libraries,ParameterValue=vector,ApplyMethod=pending-reboot"

aws rds reboot-db-instance \
  --db-instance-identifier ml-workflow-db

# Then create extension in database
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue 4: Performance Degradation

**Symptom**: Queries slow (>1s), high CPU/memory

**Diagnosis**:
```bash
# Enable Performance Insights
aws rds modify-db-instance \
  --db-instance-identifier ml-workflow-db \
  --enable-performance-insights

# Check top queries in AWS Console
# RDS → Performance Insights → Top SQL

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=ml-workflow-db \
  --start-time 2024-10-29T00:00:00Z \
  --end-time 2024-10-29T23:59:59Z \
  --period 300 \
  --statistics Average
```

**Common fixes**:
1. **Missing indexes** → Create indexes
2. **Connection exhaustion** → Use RDS Proxy
3. **Under-provisioned** → Upgrade instance class
4. **Storage IOPS limit** → Increase provisioned IOPS

## Migration from Cloud SQL to RDS

**Use case**: Moving existing ML workflow from GCP to AWS

```bash
# Step 1: Export from Cloud SQL
gcloud sql export sql ml-workflow-db \
  gs://bucket/backup.sql \
  --database=ml_workflow_dev

# Step 2: Download to local
gsutil cp gs://bucket/backup.sql ./

# Step 3: Import to RDS
psql "postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/ml_workflow_dev" < backup.sql

# Step 4: Verify data
psql "postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/ml_workflow_dev" \
  -c "SELECT COUNT(*) FROM ml_experiments;"

# Step 5: Update application DATABASE_URL
# Old: postgresql://postgres:PASSWORD@35.225.220.255:5432/ml_workflow_dev
# New: postgresql://postgres:PASSWORD@ml-workflow-db.xxxxx.us-east-1.rds.amazonaws.com:5432/ml_workflow_dev
```

**Migration Checklist**:
- ✅ pgvector extension installed in RDS
- ✅ Schema migrated (Prisma migrations)
- ✅ Data exported and imported
- ✅ Indexes recreated
- ✅ IAM/Secrets Manager configured
- ✅ Security groups allow application access
- ✅ Application DATABASE_URL updated
- ✅ Connection pooling (RDS Proxy) configured
- ✅ Monitoring/alerting set up
- ✅ Backup schedule configured

## References

- **Official Docs**: [Amazon RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- **pgvector**: [Extension documentation](https://github.com/pgvector/pgvector)
- **IAM Auth**: [RDS IAM database authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
- **RDS Proxy**: [Connection pooling guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html)

## Related Skills

- **cloud-sql** - GCP alternative (cheaper, simpler pgvector setup)
- **vector-databases** - pgvector indexing strategies
- **schema-optimization** - Query optimization, index selection
- **rls-policies** - Multi-tenant data isolation

---

**Last Updated**: 2025-10-29
**Agent**: Dana-Database
**Confidence**: 90% (AWS RDS expertise based on Cloud SQL implementation)
