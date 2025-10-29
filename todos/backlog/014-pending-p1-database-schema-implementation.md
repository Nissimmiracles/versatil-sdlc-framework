# Database Schema Implementation - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Blocks Wave 2)
**Assigned**: Dana-Database
**Estimated**: 16h
**Wave**: 1 (Foundation Infrastructure)
**Created**: 2025-10-29

## Mission

Design and implement comprehensive database schema for ML workflow automation system with 11 core tables supporting workflows, datasets, models, experiments, training jobs, predictions, and Cloud Run service management.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No migration files exist in `database/migrations/` or `prisma/`
- No database schema definitions found
- No database client/connection code present
- Framework uses Firestore (NoSQL) but ML features require relational DB for complex queries

**Why This Blocks Other Work**:
- Backend API (Wave 2) needs tables to persist data
- Vertex AI integration (Wave 2) needs to track training jobs
- All ML features depend on data persistence layer

## Requirements

### Database Selection
- **Recommended**: PostgreSQL 14+ with pgvector extension (for embeddings)
- **Alternative**: Cloud SQL (GCP managed PostgreSQL)
- **Rationale**: Complex joins, transactions, ACID guarantees, vector similarity search

### Schema Design (11 Core Tables)

#### 1. workflows
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(50) NOT NULL, -- 'training', 'prediction', 'data-processing'
  n8n_workflow_id VARCHAR(255), -- Reference to n8n workflow
  config JSONB NOT NULL, -- Workflow configuration
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'archived'
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_type ON workflows(workflow_type);
```

#### 2. datasets
```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dataset_type VARCHAR(50) NOT NULL, -- 'image', 'text', 'tabular', 'time-series'
  storage_path VARCHAR(500) NOT NULL, -- GCS path
  size_bytes BIGINT,
  record_count INTEGER,
  schema JSONB, -- Dataset schema/columns
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_datasets_type ON datasets(dataset_type);
```

#### 3. dataset_versions
```sql
CREATE TABLE dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  size_bytes BIGINT,
  record_count INTEGER,
  changes TEXT, -- Description of changes
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dataset_id, version)
);

CREATE INDEX idx_dataset_versions_dataset ON dataset_versions(dataset_id);
```

#### 4. models
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_type VARCHAR(50) NOT NULL, -- 'classification', 'regression', 'clustering', etc.
  framework VARCHAR(50) NOT NULL, -- 'tensorflow', 'pytorch', 'scikit-learn'
  task VARCHAR(100), -- 'image-classification', 'text-generation', etc.
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_models_type ON models(model_type);
CREATE INDEX idx_models_framework ON models(framework);
```

#### 5. model_versions
```sql
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  storage_path VARCHAR(500) NOT NULL, -- GCS path to model artifacts
  metrics JSONB, -- Training metrics (accuracy, loss, etc.)
  hyperparameters JSONB,
  vertex_model_id VARCHAR(255), -- Vertex AI model ID if deployed
  status VARCHAR(50) DEFAULT 'training', -- 'training', 'ready', 'deployed', 'archived'
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, version)
);

CREATE INDEX idx_model_versions_model ON model_versions(model_id);
CREATE INDEX idx_model_versions_status ON model_versions(status);
```

#### 6. experiments
```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_model ON experiments(model_id);
```

#### 7. training_jobs
```sql
CREATE TABLE training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  vertex_job_id VARCHAR(255) UNIQUE, -- Vertex AI CustomJob ID
  vertex_job_name VARCHAR(500), -- Full resource name
  job_config JSONB NOT NULL, -- Training configuration
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'succeeded', 'failed', 'cancelled'
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_jobs_experiment ON training_jobs(experiment_id);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_training_jobs_vertex ON training_jobs(vertex_job_id);
```

#### 8. predictions
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  confidence_score FLOAT,
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_model_version ON predictions(model_version_id);
CREATE INDEX idx_predictions_created ON predictions(created_at);
```

#### 9. pattern_recognition_jobs
```sql
CREATE TABLE pattern_recognition_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  pattern_type VARCHAR(50) NOT NULL, -- 'vision', 'text', 'time-series', 'anomaly'
  algorithm VARCHAR(100) NOT NULL, -- 'vit', 'bert', 'lstm', 'isolation-forest'
  config JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  results JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pattern_jobs_status ON pattern_recognition_jobs(status);
CREATE INDEX idx_pattern_jobs_type ON pattern_recognition_jobs(pattern_type);
```

#### 10. cloud_run_services
```sql
CREATE TABLE cloud_run_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  service_type VARCHAR(50) NOT NULL, -- 'prediction', 'training', 'preprocessing'
  model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  cloud_run_url VARCHAR(500) NOT NULL,
  cloud_run_service_id VARCHAR(255),
  region VARCHAR(50) DEFAULT 'us-central1',
  status VARCHAR(50) DEFAULT 'deploying', -- 'deploying', 'active', 'inactive', 'failed'
  config JSONB,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cloud_run_status ON cloud_run_services(status);
```

#### 11. service_deployments
```sql
CREATE TABLE service_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES cloud_run_services(id) ON DELETE CASCADE,
  model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  deployment_config JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'deploying', 'succeeded', 'failed', 'rolled-back'
  error_message TEXT,
  deployed_at TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deployments_service ON service_deployments(service_id);
CREATE INDEX idx_deployments_status ON service_deployments(status);
```

## Acceptance Criteria

- [ ] PostgreSQL database provisioned (Cloud SQL or local)
- [ ] All 11 tables created with proper schema
- [ ] Foreign key constraints established
- [ ] Indexes created for query optimization
- [ ] Migration files created in `database/migrations/`
- [ ] Database client/connection module created at `src/db/client.ts`
- [ ] Connection pooling configured (max 10 connections)
- [ ] Environment variables configured (DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- [ ] Migration runner script created (`npm run db:migrate`)
- [ ] Seed data script for testing (`npm run db:seed`)
- [ ] Database health check endpoint (`/health/db`)
- [ ] Documentation updated (`docs/database-schema.md`)

## Technical Approach

### Option 1: Prisma ORM (Recommended)
```bash
npm install prisma @prisma/client pg
npx prisma init
# Create schema.prisma with all 11 models
npx prisma migrate dev --name init
npx prisma generate
```

**Pros**: Type-safe queries, automatic migrations, excellent TypeScript support
**Cons**: Learning curve if team unfamiliar

### Option 2: Raw SQL Migrations
```bash
mkdir -p database/migrations
# Create 001_initial_schema.sql with all CREATE TABLE statements
# Create migration runner using node-pg-migrate
```

**Pros**: Full control, no ORM overhead
**Cons**: Manual type definitions, more boilerplate

### Recommended: Prisma for velocity and type safety

## Dependencies

**Blocks**:
- 017-backend-api-development.md (needs tables to persist data)
- 018-vertex-ai-integration.md (needs training_jobs table)
- 019-n8n-workflow-integration.md (needs workflows table)
- 020-frontend-ui-components.md (needs data to display)

**Depends On**: None (can start immediately)

## Testing Requirements

### Unit Tests
- Database connection establishment
- Schema validation
- Migration rollback

### Integration Tests
- CRUD operations for each table
- Foreign key constraint validation
- Index performance verification
- Concurrent connection handling

**Target Coverage**: 85%+

## Files to Create

1. `prisma/schema.prisma` - Prisma schema definition
2. `src/db/client.ts` - Database client singleton
3. `src/db/migrations/` - Migration files
4. `scripts/db-setup.sh` - Database provisioning script
5. `tests/db/schema.test.ts` - Schema tests
6. `docs/database-schema.md` - Schema documentation

## Environment Configuration

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/versatil_ml
DB_HOST=localhost
DB_PORT=5432
DB_NAME=versatil_ml
DB_USER=versatil
DB_PASSWORD=<secure_password>
DB_MAX_CONNECTIONS=10
DB_SSL_MODE=require # for Cloud SQL
```

## Rollback Plan

- All migrations reversible with `down` scripts
- Database backup before applying migrations
- Use Prisma's `prisma migrate reset` for dev environments

## Success Metrics

- [ ] All 11 tables created successfully
- [ ] Schema matches specification exactly
- [ ] Migration runs in < 5 seconds
- [ ] Database client connects successfully
- [ ] All foreign keys enforced
- [ ] 85%+ test coverage
- [ ] Documentation complete

## Related Todos

- **Blocks**: Todos 017, 018, 019, 020, 021, 022, 023
- **Part of**: Wave 1 (Foundation Infrastructure)
- **Parallel with**: 015 (GCP Setup), 016 (Feature Engineering)

---

**Agent**: Dana-Database
**Auto-Activate**: YES (database expertise required)
**Estimated**: 16 hours
**Priority**: P1 (Critical path blocker)
