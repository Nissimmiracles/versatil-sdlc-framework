

# Database Schema Documentation

Complete database schema for VERSATIL ML Workflow Automation using Prisma + PostgreSQL + pgvector.

## 📋 Overview

- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 15+
- **Extensions**: pgvector (for future RAG integration)
- **Tables**: 11 core tables
- **Relations**: Fully normalized with cascade deletes

## 🗄️ Schema Structure

### Core Tables (11 total)

| Table | Purpose | Relations |
|-------|---------|-----------|
| **workflows** | Workflow definitions (n8n integration) | → datasets, models, experiments |
| **datasets** | Training/test datasets | ← workflows, → dataset_versions, training_jobs |
| **dataset_versions** | Dataset versioning | ← datasets |
| **models** | ML model definitions | ← workflows, → model_versions, endpoints |
| **model_versions** | Model versioning | ← models, training_jobs, → deployments, predictions |
| **experiments** | Hyperparameter experiments | ← workflows, → training_jobs |
| **training_jobs** | Vertex AI training jobs | ← experiments, datasets, → model_versions |
| **endpoints** | Vertex AI endpoints | ← models, → deployments, predictions |
| **deployments** | Model deployments to endpoints | ← endpoints, model_versions |
| **predictions** | Inference requests/responses | ← endpoints, model_versions |
| **pattern_recognition_jobs** | Pattern detection jobs | (standalone) |
| **cloud_run_services** | Cloud Run services | → service_deployments |
| **service_deployments** | Cloud Run deployments | ← cloud_run_services |

### Entity Counts (Expected Production)

| Entity | Development | Staging | Production |
|--------|-------------|---------|------------|
| Workflows | 5-10 | 20-50 | 100-500 |
| Datasets | 10-20 | 50-100 | 500-2,000 |
| Models | 5-10 | 20-50 | 100-500 |
| Training Jobs | 50-100 | 500-1,000 | 5,000-20,000 |
| Predictions | 1,000-5,000 | 50,000-100,000 | 1M-10M |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Configure Database

Create `.env` file:
```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/versatil_ml?schema=public"

# Or use Cloud SQL (GCP)
DATABASE_URL="postgresql://USER:PASSWORD@/versatil_ml?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

### 3. Initialize Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed database with sample data (development only)
npx prisma db seed
```

### 4. Verify Setup

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# Check database
npx prisma db pull
```

## 📊 Usage Examples

### TypeScript Client

```typescript
import { prisma } from './database/client';

// Create workflow
const workflow = await prisma.workflow.create({
  data: {
    name: 'Image Classification Pipeline',
    description: 'End-to-end ML workflow',
    status: 'ACTIVE',
    createdBy: 'user-123',
    config: {
      nodes: [
        { id: 'dataset', type: 'dataset-loader' },
        { id: 'train', type: 'trainer' },
      ],
    },
  },
});

// Create dataset with version
const dataset = await prisma.dataset.create({
  data: {
    name: 'CIFAR-10',
    type: 'IMAGE',
    size: BigInt(52428800),
    storagePath: 'gs://bucket/cifar10',
    format: 'tfrecord',
    workflowId: workflow.id,
    versions: {
      create: {
        version: 1,
        storagePath: 'gs://bucket/cifar10/v1',
        size: BigInt(52428800),
        checksum: 'abc123',
      },
    },
  },
  include: { versions: true },
});

// Query with relations
const workflowWithData = await prisma.workflow.findUnique({
  where: { id: workflow.id },
  include: {
    datasets: { include: { versions: true } },
    models: { include: { versions: true } },
    experiments: { include: { trainingJobs: true } },
  },
});

// Update training job status
await prisma.trainingJob.update({
  where: { id: 'job-123' },
  data: {
    status: 'RUNNING',
    startTime: new Date(),
  },
});

// Create prediction
const prediction = await prisma.prediction.create({
  data: {
    input: { image_base64: 'iVBORw0KGg...' },
    output: { class: 'dog', confidence: 0.92 },
    latency: 45,
    confidence: 0.92,
    status: 'COMPLETED',
    completedAt: new Date(),
    endpointId: 'endpoint-123',
    modelVersionId: 'version-123',
  },
});

// Aggregate predictions
const stats = await prisma.prediction.aggregate({
  where: { endpointId: 'endpoint-123' },
  _avg: { latency: true, confidence: true },
  _count: true,
});

// Disconnect on shutdown
await prisma.$disconnect();
```

## 🔍 Advanced Queries

### Pagination

```typescript
const page = 1;
const pageSize = 20;

const predictions = await prisma.prediction.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
  include: { endpoint: true, modelVersion: true },
});

const total = await prisma.prediction.count();
```

### Filtering

```typescript
// Find all successful training jobs from last 7 days
const recentJobs = await prisma.trainingJob.findMany({
  where: {
    status: 'SUCCEEDED',
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  },
  include: { experiment: true, dataset: true },
});
```

### Aggregations

```typescript
// Average model training duration by model type
const avgDuration = await prisma.modelVersion.groupBy({
  by: ['modelId'],
  _avg: { trainingDuration: true },
  where: { status: 'TRAINED' },
});
```

### Transactions

```typescript
// Create model version and deploy in transaction
const result = await prisma.$transaction(async (tx) => {
  const version = await tx.modelVersion.create({
    data: {
      version: 2,
      storagePath: 'gs://bucket/model/v2',
      artifactUri: 'projects/123/models/456',
      size: BigInt(104857600),
      checksum: 'def456',
      metrics: { accuracy: 0.91 },
      status: 'TRAINED',
      modelId: 'model-123',
    },
  });

  const deployment = await tx.deployment.create({
    data: {
      trafficSplit: 100,
      minReplicas: 1,
      maxReplicas: 5,
      machineType: 'n1-standard-2',
      status: 'DEPLOYING',
      endpointId: 'endpoint-123',
      modelVersionId: version.id,
    },
  });

  return { version, deployment };
});
```

## 🗃️ Database Maintenance

### Backup

```bash
# PostgreSQL dump
pg_dump -U username -d versatil_ml -F c -f backup.dump

# Restore
pg_restore -U username -d versatil_ml backup.dump
```

### Reset Database (Development)

```bash
# Drop and recreate
npx prisma migrate reset

# Or manually
npx prisma db push --force-reset
npx prisma db seed
```

### Update Schema

```bash
# After modifying schema.prisma
npx prisma migrate dev --name describe_changes

# Generate new client
npx prisma generate
```

## 📈 Performance Optimization

### Indexes (Included)

All critical indexes defined in `schema.prisma` via `@@index`:

- `workflows`: status, createdBy, createdAt
- `datasets`: type, workflowId, createdAt
- `models`: type, framework, workflowId
- `training_jobs`: status, experimentId, datasetId, createdAt
- `predictions`: status, endpointId, modelVersionId, createdAt
- `endpoints`: status, modelId
- `deployments`: status, endpointId, modelVersionId

### Connection Pooling

For production, use connection pooling:

```typescript
// .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/versatil_ml?schema=public&connection_limit=10&pool_timeout=20"
```

### Query Optimization

```typescript
// Use select to limit fields
const workflows = await prisma.workflow.findMany({
  select: {
    id: true,
    name: true,
    status: true,
  },
});

// Use cursor-based pagination for large datasets
const predictions = await prisma.prediction.findMany({
  take: 100,
  skip: 1, // Skip cursor
  cursor: { id: lastId },
  orderBy: { id: 'asc' },
});
```

## 🔒 Security

### Row-Level Security (Future)

Currently not implemented, but can be added:

```sql
-- Enable RLS on predictions table
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own predictions
CREATE POLICY user_predictions ON predictions
  FOR SELECT
  USING (created_by = current_user);
```

### Data Encryption

- ✅ **In transit**: TLS/SSL for database connections
- ✅ **At rest**: GCP Cloud SQL automatic encryption
- ⏳ **Application-level**: Encrypt sensitive fields (e.g., API keys in config JSON)

## 🧪 Testing

### Unit Tests

```typescript
import { prisma } from './database/client';

describe('Workflow CRUD', () => {
  afterEach(async () => {
    await prisma.workflow.deleteMany();
  });

  it('should create workflow', async () => {
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Test Workflow',
        status: 'DRAFT',
        createdBy: 'test-user',
        config: {},
      },
    });

    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Test Workflow');
  });
});
```

### Integration Tests

```bash
# Use separate test database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/versatil_ml_test?schema=public"

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

## 📚 Related Documentation

- [todos/014-pending-p1-database-schema-implementation.md](../../todos/014-pending-p1-database-schema-implementation.md) - Implementation spec
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## 🎯 Next Steps

1. ✅ **Database schema created** (this work)
2. ⏳ **Deploy PostgreSQL**: Cloud SQL instance or local Docker
3. ⏳ **Run migrations**: `npx prisma migrate dev`
4. ⏳ **Seed database**: `npx prisma db seed` (development)
5. ⏳ **Integrate with API**: Use `prisma` client in Express routes

---

**Created**: 2025-10-29
**Schema Version**: 1.0.0
**Status**: ✅ Ready for migration
