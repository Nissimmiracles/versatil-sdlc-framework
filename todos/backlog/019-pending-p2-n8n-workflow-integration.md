# n8n Workflow Integration - ML Workflow Automation

**Status**: Pending
**Priority**: P2 (Important - Non-blocking)
**Assigned**: Marcus-Backend
**Estimated**: 32h
**Wave**: 3 (User-Facing Components)
**Created**: 2025-10-29

## Mission

Integrate n8n workflow automation platform with custom nodes for Vertex AI, Cloud Run, and ML workflow orchestration. Enable visual workflow design, scheduling, and event-driven automation for ML pipelines.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No n8n integration code found
- No custom n8n nodes
- No workflow templates
- No n8n Docker configuration

**Why This is Important**:
- Non-technical users can create ML workflows visually (no coding)
- Schedule recurring tasks (daily model retraining, weekly batch predictions)
- Event-driven workflows (new dataset → auto-train → deploy)
- Integration with 400+ services (Slack, email, webhooks, databases)

**Not Critical Path**: ML features work without n8n, but it enhances UX significantly

## Requirements

### n8n Setup

**Deployment**: Self-hosted on Cloud Run (not n8n Cloud)
**Rationale**: Data privacy, custom nodes, cost control

**Configuration**:
- PostgreSQL for workflow persistence (reuse existing DB)
- Webhook endpoint for triggering workflows
- Authentication with JWT
- Custom nodes for VERSATIL ML operations

### Custom Nodes (3 Required)

#### 1. Vertex AI Node
**Operations**:
- Submit Training Job
- Get Job Status
- Upload Model
- Deploy Model
- Make Prediction
- Cancel Job

**Configuration**:
- Service account credentials
- Project ID and region
- Model/dataset selectors

#### 2. Cloud Run Node
**Operations**:
- Deploy Service
- Update Service
- Get Service Status
- Delete Service
- Invoke Service (HTTP request)

**Configuration**:
- Service name
- Container image
- Environment variables
- Resource limits

#### 3. VERSATIL ML Node
**Operations**:
- Create Workflow
- Trigger Workflow
- Get Workflow Status
- Create Dataset
- Upload Dataset Files
- Create Experiment
- Get Training Metrics

**Configuration**:
- API base URL
- API key/JWT token
- Resource IDs

### Workflow Templates (5 Common Patterns)

#### 1. Training Pipeline
```
Trigger: Manual or Schedule (daily)
  ↓
Load Dataset from GCS
  ↓
Submit Vertex AI Training Job
  ↓
Poll Job Status (wait until complete)
  ↓
Upload Model to Registry
  ↓
Send Slack notification
```

#### 2. Auto-Deploy on New Model
```
Trigger: Webhook (model uploaded)
  ↓
Validate Model Metrics (accuracy > threshold)
  ↓
Create Cloud Run Service
  ↓
Deploy Model to Endpoint
  ↓
Run Smoke Tests
  ↓
Update Production Traffic (canary: 10%)
  ↓
Send email notification
```

#### 3. Batch Prediction Pipeline
```
Trigger: Schedule (weekly)
  ↓
Fetch New Data from Database
  ↓
Upload to GCS
  ↓
Submit Batch Prediction Job
  ↓
Wait for Completion
  ↓
Download Results
  ↓
Write to Database
  ↓
Generate Report (PDF)
  ↓
Email to stakeholders
```

#### 4. Dataset Ingestion
```
Trigger: New files in GCS bucket
  ↓
Validate File Format
  ↓
Run Feature Engineering Pipeline
  ↓
Create Dataset Version
  ↓
Update Dataset Metadata in DB
  ↓
Trigger Retraining (if enough new data)
```

#### 5. Model Monitoring & Retraining
```
Trigger: Schedule (hourly)
  ↓
Fetch Recent Predictions from DB
  ↓
Calculate Drift Metrics
  ↓
If drift > threshold:
    ↓
    Trigger Retraining Pipeline
    ↓
    Send Alert to Slack
```

## Acceptance Criteria

- [ ] n8n deployed on Cloud Run with persistent storage
- [ ] 3 custom nodes implemented (Vertex AI, Cloud Run, VERSATIL ML)
- [ ] Custom nodes published to npm (private registry or local)
- [ ] 5 workflow templates created and tested
- [ ] Webhook endpoint configured for event triggers
- [ ] Authentication with JWT tokens
- [ ] Documentation for creating custom workflows
- [ ] Integration tests for each node
- [ ] Performance: Workflow execution <5 seconds overhead

## Technical Approach

### n8n Deployment (Docker on Cloud Run)

**Dockerfile**:
```dockerfile
# infrastructure/docker/n8n.Dockerfile
FROM n8nio/n8n:latest

# Copy custom nodes
COPY n8n/nodes /data/.n8n/custom

# Set environment variables
ENV N8N_BASIC_AUTH_ACTIVE=false
ENV N8N_JWT_AUTH_ACTIVE=true
ENV N8N_JWT_AUTH_HEADER=Authorization
ENV DB_TYPE=postgresdb
ENV DB_POSTGRESDB_HOST=${DB_HOST}
ENV DB_POSTGRESDB_PORT=5432
ENV DB_POSTGRESDB_DATABASE=${DB_NAME}
ENV DB_POSTGRESDB_USER=${DB_USER}
ENV DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
ENV WEBHOOK_URL=https://n8n-${PROJECT_ID}.run.app/

EXPOSE 5678

CMD ["n8n"]
```

**Cloud Run Deployment**:
```bash
# scripts/deploy-n8n.sh
gcloud run deploy n8n \
  --image gcr.io/${PROJECT_ID}/n8n:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=${DB_HOST},DB_NAME=${DB_NAME} \
  --set-secrets DB_PASSWORD=n8n-db-password:latest \
  --memory 2Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 5
```

### Custom Node: Vertex AI

```typescript
// n8n/nodes/VertexAI/VertexAI.node.ts
import {
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData
} from 'n8n-workflow';

export class VertexAI implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vertex AI',
    name: 'vertexAI',
    icon: 'file:vertexai.svg',
    group: ['transform'],
    version: 1,
    description: 'Interact with Google Cloud Vertex AI',
    defaults: {
      name: 'Vertex AI'
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'googleCloudApi',
        required: true
      }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Submit Training Job',
            value: 'submitTrainingJob'
          },
          {
            name: 'Get Job Status',
            value: 'getJobStatus'
          },
          {
            name: 'Upload Model',
            value: 'uploadModel'
          },
          {
            name: 'Deploy Model',
            value: 'deployModel'
          },
          {
            name: 'Make Prediction',
            value: 'predict'
          }
        ],
        default: 'submitTrainingJob'
      },
      {
        displayName: 'Project ID',
        name: 'projectId',
        type: 'string',
        default: '',
        required: true,
        description: 'GCP Project ID'
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        default: 'us-central1',
        required: true
      },
      // Operation-specific parameters
      {
        displayName: 'Job Name',
        name: 'jobName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['submitTrainingJob']
          }
        },
        required: true
      },
      {
        displayName: 'Container URI',
        name: 'containerUri',
        type: 'string',
        default: 'gcr.io/project/trainer:latest',
        displayOptions: {
          show: {
            operation: ['submitTrainingJob']
          }
        },
        required: true
      }
      // ... more parameters
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      const projectId = this.getNodeParameter('projectId', i) as string;
      const region = this.getNodeParameter('region', i) as string;

      let responseData;

      if (operation === 'submitTrainingJob') {
        const jobName = this.getNodeParameter('jobName', i) as string;
        const containerUri = this.getNodeParameter('containerUri', i) as string;

        // Call Vertex AI API
        const { VertexTrainingClient } = await import('../../../src/ml/vertex/training_client');
        const client = new VertexTrainingClient(projectId, region);
        responseData = await client.submit_training_job(jobName, containerUri, []);
      } else if (operation === 'getJobStatus') {
        // Implementation
      }
      // ... other operations

      returnData.push({
        json: responseData
      });
    }

    return [returnData];
  }
}
```

### Workflow Template: Training Pipeline

```json
// n8n/workflows/training-pipeline.json
{
  "name": "ML Training Pipeline",
  "nodes": [
    {
      "parameters": {},
      "name": "When clicking 'Test workflow'",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "submitTrainingJob",
        "projectId": "={{$env.GCP_PROJECT_ID}}",
        "region": "us-central1",
        "jobName": "training-job-{{$now}}",
        "containerUri": "gcr.io/project/trainer:latest"
      },
      "name": "Submit Training Job",
      "type": "n8n-nodes-custom.vertexAI",
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "getJobStatus",
        "jobName": "={{$node['Submit Training Job'].json.job_name}}"
      },
      "name": "Wait for Completion",
      "type": "n8n-nodes-custom.vertexAI",
      "position": [650, 300]
    },
    {
      "parameters": {
        "channel": "#ml-notifications",
        "text": "Training complete! Job: {{$node['Wait for Completion'].json.job_name}}"
      },
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "position": [850, 300]
    }
  ],
  "connections": {
    "When clicking 'Test workflow'": {
      "main": [[{"node": "Submit Training Job", "type": "main", "index": 0}]]
    },
    "Submit Training Job": {
      "main": [[{"node": "Wait for Completion", "type": "main", "index": 0}]]
    },
    "Wait for Completion": {
      "main": [[{"node": "Slack", "type": "main", "index": 0}]]
    }
  }
}
```

## Dependencies

**Required Libraries**:
```json
{
  "dependencies": {
    "n8n": "^1.10.0",
    "n8n-workflow": "^1.10.0",
    "pg": "^8.11.0"
  }
}
```

**Blocks**: None (enhances UX but not blocking)

**Depends On**:
- 017-backend-api-development.md (needs API endpoints)
- 018-vertex-ai-integration.md (needs Vertex AI clients)
- 014-database-schema-implementation.md (for workflow persistence)

**Parallel with**: 020 (Frontend UI)

## Testing Requirements

### Unit Tests
```typescript
// tests/n8n/nodes/test_vertex_ai_node.ts
describe('VertexAI Node', () => {
  it('should submit training job', async () => {
    const node = new VertexAI();
    const result = await node.execute({
      operation: 'submitTrainingJob',
      projectId: 'test-project',
      jobName: 'test-job',
      containerUri: 'gcr.io/test/trainer'
    });

    expect(result[0][0].json).toHaveProperty('job_name');
  });
});
```

### Integration Tests
- Deploy n8n to test environment
- Execute each workflow template
- Verify webhook triggers
- Test error handling (API failures)

**Target Coverage**: 80%+ (slightly lower since n8n provides runtime)

## Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| Workflow execution overhead | <5 seconds | Efficient node implementation |
| Concurrent workflows | 50+ | Cloud Run autoscaling |
| Node execution time | <2 seconds | Async operations, caching |
| Webhook response time | <500ms | Queue background work |

## Files to Create

1. `n8n/nodes/VertexAI/VertexAI.node.ts`
2. `n8n/nodes/CloudRun/CloudRun.node.ts`
3. `n8n/nodes/VersatilML/VersatilML.node.ts`
4. `n8n/workflows/training-pipeline.json`
5. `n8n/workflows/auto-deploy.json`
6. `n8n/workflows/batch-prediction.json`
7. `n8n/workflows/dataset-ingestion.json`
8. `n8n/workflows/model-monitoring.json`
9. `infrastructure/docker/n8n.Dockerfile`
10. `scripts/deploy-n8n.sh`
11. `docs/n8n-integration.md`

## Success Metrics

- [ ] n8n deployed successfully on Cloud Run
- [ ] All 3 custom nodes working
- [ ] All 5 workflow templates functional
- [ ] Webhook triggers working
- [ ] 80%+ test coverage
- [ ] Documentation complete

## Related Todos

- **Blocks**: None
- **Part of**: Wave 3 (User-Facing Components)
- **Depends on**: Todos 017, 018, 014

---

**Agent**: Marcus-Backend
**Auto-Activate**: YES (integration expertise required)
**Estimated**: 32 hours
**Priority**: P2 (Important but not critical path)
