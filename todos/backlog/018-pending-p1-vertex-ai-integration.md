# Vertex AI Integration - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Blocks Wave 4)
**Assigned**: Dr.AI-ML
**Estimated**: 48h
**Wave**: 2 (Core Services)
**Created**: 2025-10-29

## Mission

Integrate Google Cloud Vertex AI for ML model training, deployment, prediction, and monitoring. Implement clients for Custom Training Jobs, Model Registry, Endpoints, and Batch Prediction with full lifecycle management.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No `@google-cloud/aiplatform` dependency in package.json
- No Vertex AI client code
- No training job submission logic
- No model deployment automation
- No prediction service integration

**Why This Blocks Other Work**:
- Pattern recognition (Wave 4) needs model training
- Frontend UI (Wave 3) needs model metrics
- n8n workflows (Wave 3) need prediction endpoints
- All ML capabilities depend on Vertex AI infrastructure

## Requirements

### Vertex AI Components (4 Major)

#### 1. Custom Training Jobs
**Purpose**: Submit and monitor ML training jobs on Vertex AI

**Features**:
- Job submission with custom containers or pre-built images
- Hyperparameter tuning support
- Distributed training (multi-GPU, multi-node)
- Training metrics collection
- Job cancellation and monitoring

#### 2. Model Registry
**Purpose**: Version control for ML models with metadata

**Features**:
- Model upload from training jobs
- Model versioning with semantic versioning
- Model metadata (metrics, hyperparameters, lineage)
- Model lifecycle management (staging, production, archived)

#### 3. Model Endpoints
**Purpose**: Deploy models for online predictions

**Features**:
- Endpoint creation with autoscaling
- Model deployment to endpoints
- Traffic splitting (A/B testing, canary deployments)
- Endpoint monitoring (latency, throughput, errors)

#### 4. Batch Prediction
**Purpose**: Large-scale offline predictions

**Features**:
- Batch job submission with GCS input/output
- Progress tracking
- Result aggregation
- Cost optimization (preemptible instances)

## Acceptance Criteria

- [ ] Vertex AI client library installed and configured
- [ ] Training job submission client implemented
- [ ] Model upload and registration client implemented
- [ ] Model deployment client implemented
- [ ] Online prediction client implemented
- [ ] Batch prediction client implemented
- [ ] Job monitoring with polling and webhooks
- [ ] Error handling and retry logic
- [ ] Integration with database (training_jobs, model_versions tables)
- [ ] Unit tests for all clients (85%+ coverage)
- [ ] Integration tests with Vertex AI (requires GCP project)
- [ ] Documentation with code examples

## Technical Approach

### Language: Python (Recommended)

**Rationale**: Official Vertex AI SDK is Python-first, best documentation, most stable

**File Structure**:
```
src/ml/vertex/
├── __init__.py
├── training_client.py       # Custom training jobs
├── model_client.py           # Model registry
├── endpoint_client.py        # Model deployment
├── prediction_client.py      # Online predictions
├── batch_prediction_client.py # Batch predictions
├── monitoring.py             # Job monitoring
├── config.py                 # Configuration
└── utils.py                  # Helper functions

tests/ml/vertex/
├── test_training_client.py
├── test_model_client.py
└── ... (other tests)
```

### Training Client Implementation

```python
# src/ml/vertex/training_client.py
from google.cloud import aiplatform
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class VertexTrainingClient:
    """Client for Vertex AI Custom Training Jobs."""

    def __init__(self, project_id: str, region: str):
        self.project_id = project_id
        self.region = region
        aiplatform.init(project=project_id, location=region)

    def submit_training_job(
        self,
        display_name: str,
        container_uri: str,  # e.g., 'gcr.io/project/trainer:latest'
        args: list[str],
        machine_type: str = 'n1-standard-4',
        accelerator_type: Optional[str] = None,
        accelerator_count: int = 0,
        environment_variables: Optional[Dict[str, str]] = None,
        base_output_dir: Optional[str] = None
    ) -> str:
        """
        Submit custom training job to Vertex AI.

        Args:
            display_name: Human-readable name for the job
            container_uri: Docker image URI for training
            args: Command-line arguments for training script
            machine_type: Machine type (n1-standard-4, a2-highgpu-1g, etc.)
            accelerator_type: GPU type (NVIDIA_TESLA_T4, NVIDIA_TESLA_V100)
            accelerator_count: Number of GPUs
            environment_variables: Environment variables for training
            base_output_dir: GCS path for output (models, logs)

        Returns:
            Vertex AI job resource name
        """
        logger.info(f"Submitting training job: {display_name}")

        job = aiplatform.CustomContainerTrainingJob(
            display_name=display_name,
            container_uri=container_uri,
            command=None,  # Use container's default ENTRYPOINT
            model_serving_container_image_uri=None  # Will set later if deploying
        )

        model = job.run(
            args=args,
            replica_count=1,
            machine_type=machine_type,
            accelerator_type=accelerator_type if accelerator_count > 0 else None,
            accelerator_count=accelerator_count,
            base_output_dir=base_output_dir or f'gs://{self.project_id}-ml-experiments',
            environment_variables=environment_variables or {},
            sync=False  # Async submission
        )

        logger.info(f"Job submitted: {job.resource_name}")
        return job.resource_name

    def get_job_status(self, job_name: str) -> Dict[str, Any]:
        """
        Get current status of training job.

        Returns:
            {
                'state': 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED',
                'start_time': datetime,
                'end_time': datetime,
                'error': str (if failed)
            }
        """
        job = aiplatform.CustomJob(job_name)
        return {
            'state': job.state.name,
            'start_time': job.start_time,
            'end_time': job.end_time,
            'error': job.error.message if job.error else None
        }

    def cancel_job(self, job_name: str):
        """Cancel running training job."""
        job = aiplatform.CustomJob(job_name)
        job.cancel()
        logger.info(f"Cancelled job: {job_name}")

    def list_jobs(self, filter: Optional[str] = None, limit: int = 100):
        """List training jobs with optional filter."""
        jobs = aiplatform.CustomJob.list(
            filter=filter,
            order_by='create_time desc',
            limit=limit
        )
        return [
            {
                'name': job.resource_name,
                'display_name': job.display_name,
                'state': job.state.name,
                'create_time': job.create_time
            }
            for job in jobs
        ]
```

### Model Client Implementation

```python
# src/ml/vertex/model_client.py
from google.cloud import aiplatform
from typing import Dict, Any, Optional

class VertexModelClient:
    """Client for Vertex AI Model Registry."""

    def __init__(self, project_id: str, region: str):
        self.project_id = project_id
        self.region = region
        aiplatform.init(project=project_id, location=region)

    def upload_model(
        self,
        display_name: str,
        artifact_uri: str,  # GCS path to model artifacts
        serving_container_image_uri: str,
        description: Optional[str] = None,
        labels: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Upload model to Vertex AI Model Registry.

        Args:
            display_name: Human-readable model name
            artifact_uri: GCS path (gs://bucket/path/to/model/)
            serving_container_image_uri: Container for serving predictions
            description: Model description
            labels: Metadata labels

        Returns:
            Model resource name
        """
        model = aiplatform.Model.upload(
            display_name=display_name,
            artifact_uri=artifact_uri,
            serving_container_image_uri=serving_container_image_uri,
            description=description,
            labels=labels or {}
        )

        return model.resource_name

    def get_model(self, model_name: str) -> aiplatform.Model:
        """Get model by resource name."""
        return aiplatform.Model(model_name)

    def list_models(self, filter: Optional[str] = None, limit: int = 100):
        """List models with optional filter."""
        models = aiplatform.Model.list(
            filter=filter,
            order_by='create_time desc',
            limit=limit
        )
        return [
            {
                'name': model.resource_name,
                'display_name': model.display_name,
                'create_time': model.create_time,
                'labels': model.labels
            }
            for model in models
        ]

    def delete_model(self, model_name: str):
        """Delete model from registry."""
        model = aiplatform.Model(model_name)
        model.delete()
```

### Endpoint Client Implementation

```python
# src/ml/vertex/endpoint_client.py
from google.cloud import aiplatform
from typing import Dict, Any, Optional

class VertexEndpointClient:
    """Client for Vertex AI Model Endpoints."""

    def __init__(self, project_id: str, region: str):
        self.project_id = project_id
        self.region = region
        aiplatform.init(project=project_id, location=region)

    def create_endpoint(self, display_name: str) -> str:
        """Create new prediction endpoint."""
        endpoint = aiplatform.Endpoint.create(display_name=display_name)
        return endpoint.resource_name

    def deploy_model(
        self,
        endpoint_name: str,
        model_name: str,
        deployed_model_display_name: str,
        machine_type: str = 'n1-standard-2',
        min_replica_count: int = 1,
        max_replica_count: int = 3,
        accelerator_type: Optional[str] = None,
        accelerator_count: int = 0,
        traffic_percentage: int = 100
    ) -> str:
        """
        Deploy model to endpoint.

        Args:
            endpoint_name: Endpoint resource name
            model_name: Model resource name
            deployed_model_display_name: Name for this deployment
            machine_type: VM instance type
            min_replica_count: Min autoscaling replicas
            max_replica_count: Max autoscaling replicas
            accelerator_type: GPU type (optional)
            accelerator_count: Number of GPUs
            traffic_percentage: Traffic split (0-100)

        Returns:
            Deployed model ID
        """
        endpoint = aiplatform.Endpoint(endpoint_name)
        model = aiplatform.Model(model_name)

        deployed_model = endpoint.deploy(
            model=model,
            deployed_model_display_name=deployed_model_display_name,
            machine_type=machine_type,
            min_replica_count=min_replica_count,
            max_replica_count=max_replica_count,
            accelerator_type=accelerator_type if accelerator_count > 0 else None,
            accelerator_count=accelerator_count,
            traffic_percentage=traffic_percentage,
            sync=True  # Wait for deployment
        )

        return deployed_model.id

    def undeploy_model(self, endpoint_name: str, deployed_model_id: str):
        """Undeploy model from endpoint."""
        endpoint = aiplatform.Endpoint(endpoint_name)
        endpoint.undeploy(deployed_model_id=deployed_model_id)

    def update_traffic_split(
        self,
        endpoint_name: str,
        traffic_split: Dict[str, int]  # {deployed_model_id: percentage}
    ):
        """Update traffic distribution across deployed models."""
        endpoint = aiplatform.Endpoint(endpoint_name)
        endpoint.update(traffic_split=traffic_split)
```

### Prediction Client Implementation

```python
# src/ml/vertex/prediction_client.py
from google.cloud import aiplatform
from typing import Any, List, Dict

class VertexPredictionClient:
    """Client for Vertex AI Online Predictions."""

    def __init__(self, project_id: str, region: str):
        self.project_id = project_id
        self.region = region
        aiplatform.init(project=project_id, location=region)

    def predict(
        self,
        endpoint_name: str,
        instances: List[Any],
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        """
        Make online prediction.

        Args:
            endpoint_name: Endpoint resource name
            instances: Input data (list of instances)
            parameters: Prediction parameters (optional)

        Returns:
            Predictions (list)
        """
        endpoint = aiplatform.Endpoint(endpoint_name)
        predictions = endpoint.predict(instances=instances, parameters=parameters)
        return predictions.predictions

    def explain(
        self,
        endpoint_name: str,
        instances: List[Any]
    ) -> Dict[str, Any]:
        """
        Get prediction with explanations (feature attributions).

        Requires endpoint deployed with explainability.
        """
        endpoint = aiplatform.Endpoint(endpoint_name)
        response = endpoint.explain(instances=instances)
        return {
            'predictions': response.predictions,
            'explanations': response.explanations
        }
```

## Dependencies

**Required Libraries** (Python):
```bash
pip install \
  google-cloud-aiplatform>=1.35.0 \
  google-cloud-storage>=2.10.0 \
  protobuf>=4.24.0
```

**Blocks**:
- 021-pattern-recognition-framework.md (needs model training)
- 022-dataset-building-tools.md (needs batch prediction)
- 020-frontend-ui-components.md (needs model metrics)

**Depends On**:
- 015-gcp-infrastructure-setup.md (needs service accounts, APIs enabled)
- 014-database-schema-implementation.md (needs training_jobs table)

**Parallel with**: 017 (Backend API)

## Testing Requirements

### Unit Tests
```python
# tests/ml/vertex/test_training_client.py
from unittest.mock import Mock, patch
import pytest

@patch('google.cloud.aiplatform.CustomContainerTrainingJob')
def test_submit_training_job(mock_job_class):
    mock_job = Mock()
    mock_job.resource_name = 'projects/123/locations/us-central1/customJobs/456'
    mock_job_class.return_value = mock_job

    client = VertexTrainingClient('test-project', 'us-central1')
    job_name = client.submit_training_job(
        display_name='test-job',
        container_uri='gcr.io/test/trainer',
        args=['--epochs', '10']
    )

    assert 'customJobs' in job_name
    mock_job.run.assert_called_once()
```

### Integration Tests (Requires GCP)
- Submit real training job with test container
- Upload model to registry
- Deploy model to test endpoint
- Make test predictions
- Clean up resources

**Target Coverage**: 85%+

## Performance Requirements

| Operation | Target Latency | Method |
|-----------|---------------|--------|
| Job submission | <5 seconds | Async submission |
| Model upload | <30 seconds | Parallel upload |
| Model deployment | <10 minutes | Vertex AI managed |
| Online prediction | <200ms | Autoscaling endpoints |
| Batch prediction | <1 hour (1M rows) | Distributed processing |

## Files to Create

1. `src/ml/vertex/training_client.py`
2. `src/ml/vertex/model_client.py`
3. `src/ml/vertex/endpoint_client.py`
4. `src/ml/vertex/prediction_client.py`
5. `src/ml/vertex/batch_prediction_client.py`
6. `src/ml/vertex/monitoring.py`
7. `src/ml/vertex/config.py`
8. `tests/ml/vertex/test_*.py` (6+ files)
9. `docs/vertex-ai-integration.md`

## Success Metrics

- [ ] All 4 Vertex AI clients implemented
- [ ] Integration with database complete
- [ ] 85%+ test coverage
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Production-ready error handling

## Related Todos

- **Blocks**: Todos 021, 022, 020
- **Part of**: Wave 2 (Core Services)
- **Depends on**: Todos 015, 014

---

**Agent**: Dr.AI-ML
**Auto-Activate**: YES (ML/AI expertise required)
**Estimated**: 48 hours
**Priority**: P1 (Critical path blocker)
