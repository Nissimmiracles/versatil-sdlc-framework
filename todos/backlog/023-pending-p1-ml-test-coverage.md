# ML Test Coverage - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Quality Gate)
**Assigned**: Maria-QA
**Estimated**: 64h
**Wave**: 5 (Quality & Documentation)
**Created**: 2025-10-29

## Mission

Implement comprehensive test suite for ML workflow automation with unit, integration, and E2E tests achieving 85%+ coverage. Include API tests, ML pipeline tests, Vertex AI integration tests, and performance benchmarks.

## Context

**Validation Finding**: ⚠️ PARTIAL (Framework has test infrastructure but NO ML-specific tests)
- Framework uses Jest/Playwright
- Test coverage exists for framework code (~80%)
- No tests for ML endpoints, Vertex AI integration, or ML pipelines
- No tests for database schema, feature engineering, or pattern recognition

**Why This Blocks Release**:
- Maria-QA enforces 85%+ coverage before production
- ML models can fail silently without tests
- Data pipeline bugs cause incorrect predictions
- API contract violations break frontend

## Requirements

### Test Categories (4 Types)

#### 1. Unit Tests
**Scope**: Individual functions and classes in isolation

**Coverage Areas**:
- Feature engineering processors (image, text, tabular, time-series)
- Pattern recognition modules (ViT, BERT, LSTM, anomaly detection)
- Dataset tools (ingestion, labeling, augmentation, validation)
- API controllers and services
- Vertex AI clients (with mocks)

**Target Coverage**: 90%+ for business logic

#### 2. Integration Tests
**Scope**: Multiple components working together

**Coverage Areas**:
- API endpoints with database (full CRUD workflows)
- Feature engineering → Model training pipeline
- Model training → Deployment → Prediction flow
- Vertex AI integration (requires GCP test project)
- Database migrations and queries

**Target Coverage**: 80%+ for integration paths

#### 3. E2E Tests
**Scope**: Complete user workflows from UI to backend

**Coverage Areas**:
- Workflow creation → Execution → Results viewing
- Dataset upload → Preprocessing → Training
- Model deployment → Prediction → Monitoring
- n8n workflow triggering (if implemented)

**Target Coverage**: Key user journeys (10-15 scenarios)

#### 4. Performance Tests
**Scope**: Load testing and benchmarking

**Coverage Areas**:
- API throughput (1000 req/sec target)
- Feature preprocessing speed (images/sec, texts/sec)
- Model inference latency (p95 <200ms)
- Database query performance (<100ms)

**Target**: Meet all performance SLAs

## Acceptance Criteria

- [ ] 85%+ overall test coverage (lines)
- [ ] 90%+ coverage for critical paths (model training, predictions)
- [ ] All API endpoints tested (200+ tests)
- [ ] All ML pipelines tested (50+ tests)
- [ ] Integration tests with Vertex AI (20+ tests)
- [ ] E2E tests for 10 key workflows
- [ ] Performance benchmarks documented
- [ ] CI/CD integration (tests run on every PR)
- [ ] Test documentation with examples

## Technical Approach

### Test Framework Stack

**Unit/Integration**: Jest (TypeScript), pytest (Python)
**E2E**: Playwright (frontend), pytest (backend workflows)
**API**: Supertest (Express), pytest (REST API)
**Performance**: k6 or Artillery
**Mocking**: jest.mock(), pytest-mock, nock (HTTP mocking)

### Test File Organization

```
tests/
├── unit/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── workflows.controller.test.ts
│   │   │   ├── datasets.controller.test.ts
│   │   │   └── ... (5 files)
│   │   └── services/
│   │       ├── workflows.service.test.ts
│   │       └── ... (5 files)
│   ├── ml/
│   │   ├── feature_engineering/
│   │   │   ├── test_image_processor.py
│   │   │   ├── test_text_processor.py
│   │   │   └── ... (4 files)
│   │   ├── patterns/
│   │   │   ├── test_vit_classifier.py
│   │   │   └── ... (8 files)
│   │   ├── dataset/
│   │   │   └── ... (6 files)
│   │   └── vertex/
│   │       └── ... (6 files)
│   └── db/
│       ├── schema.test.ts
│       └── migrations.test.ts
├── integration/
│   ├── api/
│   │   ├── workflows.integration.test.ts
│   │   └── ... (5 files)
│   ├── ml/
│   │   ├── training_pipeline.integration.test.py
│   │   ├── prediction_pipeline.integration.test.py
│   │   └── vertex_integration.test.py
│   └── db/
│       └── crud.integration.test.ts
├── e2e/
│   ├── workflow_creation.spec.ts
│   ├── dataset_management.spec.ts
│   ├── model_training.spec.ts
│   └── ... (10 scenarios)
├── performance/
│   ├── api_load.test.js (k6)
│   └── ml_benchmarks.py
└── fixtures/
    ├── test_datasets/
    ├── test_images/
    └── mock_responses/
```

### Example Unit Test: Feature Processor

```python
# tests/unit/ml/feature_engineering/test_image_processor.py
import pytest
import numpy as np
from PIL import Image
from src.ml.feature_engineering.processors.image_processor import ImageProcessor

@pytest.fixture
def image_processor():
    return ImageProcessor({
        'target_size': (224, 224),
        'normalize': True,
        'augment': False
    })

@pytest.fixture
def test_image(tmp_path):
    # Create test image
    img = Image.new('RGB', (100, 100), color='red')
    img_path = tmp_path / 'test.jpg'
    img.save(img_path)
    return str(img_path)

def test_preprocess_resizes_image(image_processor, test_image):
    """Test that preprocessing resizes image to target size."""
    result = image_processor.preprocess(test_image)

    assert result.shape == (3, 224, 224), f"Expected (3, 224, 224), got {result.shape}"

def test_preprocess_normalizes_values(image_processor, test_image):
    """Test that preprocessing normalizes pixel values."""
    result = image_processor.preprocess(test_image)

    # Normalized values should be in reasonable range (ImageNet mean/std)
    assert result.mean() < 1.0, "Expected normalized values"
    assert result.std() < 2.0, "Expected reasonable std after normalization"

def test_preprocess_batch(image_processor, test_image):
    """Test batch preprocessing."""
    batch = [test_image] * 5
    result = image_processor.preprocess_batch(batch)

    assert result.shape == (5, 3, 224, 224), f"Expected (5, 3, 224, 224), got {result.shape}"

def test_preprocess_invalid_path(image_processor):
    """Test error handling for invalid image path."""
    with pytest.raises(FileNotFoundError):
        image_processor.preprocess('nonexistent.jpg')

@pytest.mark.parametrize("target_size", [(128, 128), (256, 256), (512, 512)])
def test_preprocess_different_sizes(target_size, test_image):
    """Test preprocessing with different target sizes."""
    processor = ImageProcessor({'target_size': target_size})
    result = processor.preprocess(test_image)

    assert result.shape == (3, target_size[0], target_size[1])
```

### Example Integration Test: API + Database

```typescript
// tests/integration/api/workflows.integration.test.ts
import request from 'supertest';
import { app } from '../../../src/api/server';
import { db } from '../../../src/db/client';
import { generateTestToken } from '../../utils/auth';

describe('Workflows API Integration', () => {
  let authToken: string;
  let createdWorkflowId: string;

  beforeAll(async () => {
    // Setup test database
    await db.$connect();
    authToken = generateTestToken({ userId: 'test-user' });
  });

  afterAll(async () => {
    // Cleanup
    await db.workflows.deleteMany({ where: { created_by: 'test-user' } });
    await db.$disconnect();
  });

  it('should create workflow and persist to database', async () => {
    const response = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Test Workflow',
        workflow_type: 'training',
        description: 'Test workflow for integration testing',
        config: {
          dataset_id: 'test-dataset-123',
          parameters: { epochs: 10 }
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    createdWorkflowId = response.body.data.id;

    // Verify database persistence
    const dbWorkflow = await db.workflows.findUnique({
      where: { id: createdWorkflowId }
    });

    expect(dbWorkflow).not.toBeNull();
    expect(dbWorkflow?.name).toBe('Integration Test Workflow');
    expect(dbWorkflow?.status).toBe('draft');
  });

  it('should list workflows from database', async () => {
    const response = await request(app)
      .get('/api/v1/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ status: 'draft' });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);

    const workflow = response.body.data.find((w: any) => w.id === createdWorkflowId);
    expect(workflow).toBeDefined();
  });

  it('should update workflow status', async () => {
    const response = await request(app)
      .put(`/api/v1/workflows/${createdWorkflowId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'active' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('active');

    // Verify in database
    const dbWorkflow = await db.workflows.findUnique({
      where: { id: createdWorkflowId }
    });
    expect(dbWorkflow?.status).toBe('active');
  });

  it('should delete workflow (soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/v1/workflows/${createdWorkflowId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verify soft delete (status = archived)
    const dbWorkflow = await db.workflows.findUnique({
      where: { id: createdWorkflowId }
    });
    expect(dbWorkflow?.status).toBe('archived');
  });
});
```

### Example E2E Test: Complete Workflow

```typescript
// tests/e2e/training_workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ML Training Workflow E2E', () => {
  test('complete training workflow from dataset to deployed model', async ({ page }) => {
    // Step 1: Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Create dataset
    await page.goto('/datasets');
    await page.click('text=New Dataset');
    await page.fill('[name="name"]', 'E2E Test Dataset');
    await page.selectOption('[name="dataset_type"]', 'image');

    // Upload files
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      'tests/fixtures/test_images/dog1.jpg',
      'tests/fixtures/test_images/dog2.jpg',
      'tests/fixtures/test_images/cat1.jpg'
    ]);

    await page.click('button:has-text("Upload")');
    await expect(page.locator('text=Upload successful')).toBeVisible();

    // Step 3: Create workflow
    await page.goto('/workflows');
    await page.click('text=New Workflow');
    await page.fill('[name="name"]', 'E2E Training Workflow');
    await page.selectOption('[name="workflow_type"]', 'training');

    // Configure workflow (drag-and-drop nodes)
    await page.dragAndDrop('[data-node-type="dataset"]', '.react-flow-canvas');
    await page.dragAndDrop('[data-node-type="training"]', '.react-flow-canvas');

    await page.click('button:has-text("Save")');

    // Step 4: Execute workflow
    await page.click('button:has-text("Execute")');
    await expect(page.locator('text=Workflow executing')).toBeVisible({ timeout: 10000 });

    // Step 5: Wait for completion (mock fast execution for E2E)
    await expect(page.locator('text=Workflow completed')).toBeVisible({ timeout: 60000 });

    // Step 6: Verify results
    await page.goto('/models');
    await expect(page.locator('text=E2E Test Model')).toBeVisible();

    // Step 7: View training metrics
    await page.click('text=E2E Test Model');
    await expect(page.locator('canvas')).toBeVisible(); // Charts loaded
    await expect(page.locator('text=Accuracy:')).toBeVisible();
  });
});
```

### Example Performance Test: API Load

```javascript
// tests/performance/api_load.test.js (k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up to 50 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    http_req_failed: ['rate<0.01'],   // <1% error rate
  },
};

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'test-token';

export default function () {
  // Test 1: List workflows
  let res = http.get(`${BASE_URL}/api/v1/workflows`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test 2: Get workflow details
  res = http.get(`${BASE_URL}/api/v1/workflows/test-workflow-id`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

## Dependencies

**Required Libraries**:
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "@playwright/test": "^1.40.0",
    "k6": "^0.47.0",
    "nock": "^13.4.0"
  }
}
```

**Python**:
```bash
pip install pytest pytest-mock pytest-cov pytest-asyncio
```

**Blocks**: Production release

**Depends On**: All previous todos (014-022) - tests validate their implementations

## Testing Requirements

**Meta-Testing**: Tests themselves should be reviewed for:
- Correct assertions
- Proper mocking
- No flaky tests
- Clear failure messages

## Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| Test suite execution time | <10 minutes | Parallel execution, mocking |
| Unit tests | <2 minutes | Fast, isolated tests |
| Integration tests | <5 minutes | Database in-memory mode |
| E2E tests | <10 minutes | Headless browser, test data |

## Files to Create

1. `tests/unit/api/**/*.test.ts` (30+ files)
2. `tests/unit/ml/**/*.py` (30+ files)
3. `tests/integration/api/*.test.ts` (10+ files)
4. `tests/integration/ml/*.py` (10+ files)
5. `tests/e2e/*.spec.ts` (10+ files)
6. `tests/performance/*.test.js` (5+ files)
7. `tests/fixtures/` (test data)
8. `.github/workflows/test.yml` (CI integration)
9. `docs/testing-strategy.md`

## Success Metrics

- [ ] 85%+ overall coverage
- [ ] All critical paths at 90%+ coverage
- [ ] 0 flaky tests (100% pass rate over 10 runs)
- [ ] Test suite completes in <10 minutes
- [ ] CI/CD integration working
- [ ] Documentation complete

## Related Todos

- **Blocks**: Production release
- **Part of**: Wave 5 (Quality & Documentation)
- **Depends on**: All Todos 014-022

---

**Agent**: Maria-QA
**Auto-Activate**: YES (QA expertise required)
**Estimated**: 64 hours
**Priority**: P1 (Quality gate blocker)
