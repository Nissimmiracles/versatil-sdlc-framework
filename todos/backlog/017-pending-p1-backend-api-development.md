# Backend API Development - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Blocks Wave 3)
**Assigned**: Marcus-Backend
**Estimated**: 48h
**Wave**: 2 (Core Services)
**Created**: 2025-10-29

## Mission

Develop comprehensive RESTful API for ML workflow automation with endpoints for workflows, datasets, models, training jobs, and predictions. Includes authentication, rate limiting, error handling, and OpenAPI documentation.

## Context

**Validation Finding**: ⚠️ PARTIAL (Framework has API infrastructure but NO ML endpoints)
- Framework uses Express.js (src/server.ts exists)
- No ML-specific routes in src/api/ or src/routes/
- No workflow/dataset/model management endpoints
- No integration with Vertex AI or database

**Why This Blocks Other Work**:
- Frontend UI (Wave 3) needs API endpoints to display data
- n8n workflows (Wave 3) need API to trigger jobs
- All ML operations need centralized API layer
- Mobile/external integrations depend on stable API

## Requirements

### API Endpoints (5 Major Resources)

#### 1. Workflows API

**Base Path**: `/api/v1/workflows`

```typescript
// POST /api/v1/workflows - Create workflow
interface CreateWorkflowRequest {
  name: string;
  description?: string;
  workflow_type: 'training' | 'prediction' | 'data-processing';
  config: {
    dataset_id?: string;
    model_id?: string;
    n8n_workflow_id?: string;
    parameters: Record<string, any>;
  };
}

// GET /api/v1/workflows - List workflows
interface ListWorkflowsQuery {
  status?: 'draft' | 'active' | 'archived';
  workflow_type?: string;
  page?: number;
  limit?: number;
}

// GET /api/v1/workflows/:id - Get workflow details
// PUT /api/v1/workflows/:id - Update workflow
// DELETE /api/v1/workflows/:id - Archive workflow
// POST /api/v1/workflows/:id/execute - Execute workflow
```

#### 2. Datasets API

**Base Path**: `/api/v1/datasets`

```typescript
// POST /api/v1/datasets - Create dataset
interface CreateDatasetRequest {
  name: string;
  description?: string;
  dataset_type: 'image' | 'text' | 'tabular' | 'time-series';
  storage_path?: string; // GCS path, or will be generated
}

// POST /api/v1/datasets/:id/upload - Upload dataset files
// Multipart form-data with file(s)
// Returns signed GCS URLs for direct upload

// GET /api/v1/datasets - List datasets
// GET /api/v1/datasets/:id - Get dataset details
// POST /api/v1/datasets/:id/versions - Create new version
// GET /api/v1/datasets/:id/versions - List versions
// DELETE /api/v1/datasets/:id - Delete dataset (soft delete)
```

#### 3. Models API

**Base Path**: `/api/v1/models`

```typescript
// POST /api/v1/models - Create model
interface CreateModelRequest {
  name: string;
  description?: string;
  model_type: 'classification' | 'regression' | 'clustering' | 'generation';
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'jax';
  task?: string; // 'image-classification', 'text-generation', etc.
}

// GET /api/v1/models - List models
// GET /api/v1/models/:id - Get model details
// POST /api/v1/models/:id/versions - Create model version
// GET /api/v1/models/:id/versions - List versions
// PUT /api/v1/models/:id/versions/:version - Update version metadata
// POST /api/v1/models/:id/versions/:version/deploy - Deploy to Cloud Run
// DELETE /api/v1/models/:id - Archive model
```

#### 4. Training Jobs API

**Base Path**: `/api/v1/training-jobs`

```typescript
// POST /api/v1/training-jobs - Submit training job
interface SubmitTrainingJobRequest {
  experiment_id: string;
  model_id: string;
  dataset_id: string;
  config: {
    hyperparameters: Record<string, any>;
    machine_type: string; // 'n1-standard-4', 'a2-highgpu-1g', etc.
    accelerator_type?: string; // 'NVIDIA_TESLA_T4', 'NVIDIA_TESLA_V100'
    accelerator_count?: number;
    max_runtime_seconds?: number;
  };
}

// GET /api/v1/training-jobs - List training jobs
// GET /api/v1/training-jobs/:id - Get job details
// GET /api/v1/training-jobs/:id/logs - Stream training logs (SSE)
// POST /api/v1/training-jobs/:id/cancel - Cancel running job
// GET /api/v1/training-jobs/:id/metrics - Get training metrics
```

#### 5. Predictions API

**Base Path**: `/api/v1/predictions`

```typescript
// POST /api/v1/predictions - Make prediction
interface PredictionRequest {
  model_version_id: string;
  input_data: Record<string, any>; // Format depends on model
  return_confidence?: boolean;
}

// POST /api/v1/predictions/batch - Batch prediction
interface BatchPredictionRequest {
  model_version_id: string;
  input_gcs_path: string; // GCS path to input data
  output_gcs_path: string; // Where to write results
}

// GET /api/v1/predictions/:id - Get prediction result
// GET /api/v1/predictions - List recent predictions
```

## Acceptance Criteria

- [ ] 5 resource groups implemented (Workflows, Datasets, Models, Training, Predictions)
- [ ] All CRUD endpoints functional with proper HTTP methods
- [ ] Request validation using Zod or Joi schemas
- [ ] Authentication middleware (JWT or API keys)
- [ ] Rate limiting (100 req/min per user, 10 req/sec per endpoint)
- [ ] Error handling with consistent error format
- [ ] Logging (request/response, errors, performance)
- [ ] OpenAPI 3.0 specification generated
- [ ] Swagger UI hosted at /api/docs
- [ ] Integration with database (todos/014)
- [ ] Integration with Vertex AI client (todos/018)
- [ ] Unit tests for all routes (85%+ coverage)
- [ ] Integration tests with test database
- [ ] Performance benchmarks (<100ms p95 latency)

## Technical Approach

### Framework: Express.js (Existing)

**File Structure**:
```
src/api/
├── routes/
│   ├── workflows.routes.ts
│   ├── datasets.routes.ts
│   ├── models.routes.ts
│   ├── training-jobs.routes.ts
│   └── predictions.routes.ts
├── controllers/
│   ├── workflows.controller.ts
│   ├── datasets.controller.ts
│   ├── models.controller.ts
│   ├── training-jobs.controller.ts
│   └── predictions.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── rate-limit.middleware.ts
│   ├── validation.middleware.ts
│   └── error-handler.middleware.ts
├── schemas/
│   ├── workflows.schema.ts
│   ├── datasets.schema.ts
│   └── ... (validation schemas)
├── services/
│   ├── workflows.service.ts
│   ├── datasets.service.ts
│   └── ... (business logic)
└── server.ts (existing, update to include ML routes)
```

### Example Route Implementation

```typescript
// src/api/routes/workflows.routes.ts
import { Router } from 'express';
import { WorkflowsController } from '../controllers/workflows.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createWorkflowSchema, listWorkflowsSchema } from '../schemas/workflows.schema.js';

const router = Router();
const controller = new WorkflowsController();

// All routes require authentication
router.use(authenticate);

router.post('/',
  validateRequest(createWorkflowSchema),
  controller.create
);

router.get('/',
  validateRequest(listWorkflowsSchema),
  controller.list
);

router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.archive);
router.post('/:id/execute', controller.execute);

export default router;
```

### Example Controller Implementation

```typescript
// src/api/controllers/workflows.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WorkflowsService } from '../services/workflows.service.js';
import { ApiError } from '../utils/api-error.js';

export class WorkflowsController {
  private service: WorkflowsService;

  constructor() {
    this.service = new WorkflowsService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id; // From auth middleware
      const workflow = await this.service.create({
        ...req.body,
        created_by: userId
      });
      res.status(201).json({ data: workflow });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, workflow_type, page = 1, limit = 20 } = req.query;
      const result = await this.service.list({
        status: status as string,
        workflow_type: workflow_type as string,
        page: Number(page),
        limit: Number(limit)
      });
      res.json({
        data: result.workflows,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await this.service.getById(req.params.id);
      if (!workflow) {
        throw new ApiError(404, 'Workflow not found');
      }
      res.json({ data: workflow });
    } catch (error) {
      next(error);
    }
  };

  // ... other methods
}
```

### Example Service Implementation

```typescript
// src/api/services/workflows.service.ts
import { db } from '../../db/client.js';
import { Workflow, CreateWorkflowInput } from '../types/workflows.types.js';

export class WorkflowsService {
  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const workflow = await db.workflows.create({
      data: {
        name: input.name,
        description: input.description,
        workflow_type: input.workflow_type,
        config: input.config,
        created_by: input.created_by,
        status: 'draft'
      }
    });
    return workflow;
  }

  async list(options: ListOptions): Promise<ListResult<Workflow>> {
    const { status, workflow_type, page, limit } = options;
    const skip = (page - 1) * limit;

    const [workflows, total] = await Promise.all([
      db.workflows.findMany({
        where: {
          ...(status && { status }),
          ...(workflow_type && { workflow_type })
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      db.workflows.count({
        where: {
          ...(status && { status }),
          ...(workflow_type && { workflow_type })
        }
      })
    ]);

    return { workflows, page, limit, total };
  }

  // ... other methods
}
```

### Authentication Middleware

```typescript
// src/api/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';

interface JWTPayload {
  userId: string;
  email: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};
```

### Error Handler Middleware

```typescript
// src/api/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
};
```

## Dependencies

**Required Libraries**:
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.0",
    "swagger-jsdoc": "^6.2.0",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "supertest": "^6.3.0"
  }
}
```

**Blocks**:
- 019-n8n-workflow-integration.md (n8n needs API to call)
- 020-frontend-ui-components.md (UI needs data from API)

**Depends On**:
- 014-database-schema-implementation.md (needs tables)
- 018-vertex-ai-integration.md (needs Vertex AI client)

## Testing Requirements

### Unit Tests
```typescript
// tests/api/controllers/workflows.controller.test.ts
describe('WorkflowsController', () => {
  it('should create workflow with valid input', async () => {
    const res = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Test Workflow',
        workflow_type: 'training',
        config: { dataset_id: 'test-123' }
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/workflows')
      .send({ name: 'Test' });

    expect(res.status).toBe(401);
  });
});
```

### Integration Tests
- Full CRUD workflows for each resource
- Authentication flow (login → access protected route)
- Rate limiting behavior
- Error handling edge cases

**Target Coverage**: 85%+

## Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| API response time | <100ms (p95) | Database indexing, caching |
| Throughput | 1000 req/sec | Horizontal scaling (Cloud Run) |
| Concurrent connections | 10K+ | Event loop optimization |
| Rate limiting | 100 req/min/user | express-rate-limit |

## Files to Create

1. `src/api/routes/*.routes.ts` (5 files)
2. `src/api/controllers/*.controller.ts` (5 files)
3. `src/api/services/*.service.ts` (5 files)
4. `src/api/middleware/auth.middleware.ts`
5. `src/api/middleware/rate-limit.middleware.ts`
6. `src/api/middleware/error-handler.middleware.ts`
7. `src/api/schemas/*.schema.ts` (5 files)
8. `src/api/utils/api-error.ts`
9. `tests/api/**/*.test.ts` (20+ test files)
10. `docs/api-reference.md` (OpenAPI spec)

## Success Metrics

- [ ] All 5 resource groups implemented
- [ ] OpenAPI spec generated and published
- [ ] 85%+ test coverage
- [ ] <100ms p95 latency
- [ ] Rate limiting functional
- [ ] Authentication working
- [ ] Integration tests passing

## Related Todos

- **Blocks**: Todos 019, 020
- **Part of**: Wave 2 (Core Services)
- **Depends on**: Todos 014, 018

---

**Agent**: Marcus-Backend
**Auto-Activate**: YES (API expertise required)
**Estimated**: 48 hours
**Priority**: P1 (Critical path blocker)
