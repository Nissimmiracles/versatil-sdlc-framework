---
name: model-deployment
description: ML model serving with TensorFlow Serving, TorchServe, A/B testing, monitoring. Use when deploying models to production, setting up model endpoints, implementing canary deployments, or monitoring model performance. Covers containerization, scaling, versioning, and observability. Reduces deployment time by 60%.
---

# Model Deployment

## Overview

Production ML model deployment covering model serving (TensorFlow Serving, TorchServe, Triton), containerization, A/B testing, canary deployments, and comprehensive monitoring. Focus on reliability, scalability, and observability.

**Goal**: Deploy ML models to production with 99.9% uptime, <100ms latency, and full observability

## When to Use This Skill

Use this skill when:
- Deploying ML models to production endpoints
- Setting up model serving infrastructure (TensorFlow Serving, TorchServe)
- Implementing A/B testing for model versions
- Creating canary or blue-green deployments
- Monitoring model performance and drift
- Scaling model inference (GPU/CPU)
- Building model version management
- Implementing model explainability in production

**Triggers**: "model deployment", "model serving", "TensorFlow Serving", "TorchServe", "A/B testing", "canary deployment", "model monitoring", "inference"

---

## Quick Start: Deployment Strategy Decision Tree

### Choosing the Right Deployment Pattern

**REST API (FastAPI/Flask)**:
- ✅ Simple deployment with full control
- ✅ Easy to integrate with existing services
- ✅ Batch or single predictions
- ✅ Custom preprocessing/postprocessing
- ✅ Best for: Small-medium scale, custom logic

**TensorFlow Serving** (TF models):
- ✅ High-performance TensorFlow model serving
- ✅ gRPC and REST APIs
- ✅ Model versioning built-in
- ✅ GPU support
- ✅ Best for: TensorFlow models, high throughput

**TorchServe** (PyTorch models):
- ✅ Official PyTorch serving
- ✅ Multi-model serving
- ✅ Model management APIs
- ✅ Metrics and logging
- ✅ Best for: PyTorch models, production-grade

**Triton Inference Server** (Multi-framework):
- ✅ Supports TensorFlow, PyTorch, ONNX, custom
- ✅ Dynamic batching
- ✅ Concurrent model execution
- ✅ GPU optimization
- ✅ Best for: Multi-framework, maximum performance

**Serverless (AWS Lambda, Cloud Functions)**:
- ✅ Auto-scaling to zero
- ✅ Pay-per-request
- ✅ Low maintenance
- ✅ Best for: Sporadic traffic, cost optimization

---

## FastAPI Model Serving

### 1. Basic Model API

```python
# api/model_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import joblib
import numpy as np
from prometheus_client import Counter, Histogram, make_asgi_app
import time

# Load model at startup
model = None
scaler = None

app = FastAPI(title="ML Model API", version="1.0.0")

# Prometheus metrics
prediction_counter = Counter(
    'model_predictions_total',
    'Total number of predictions',
    ['model_version', 'status']
)
prediction_latency = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency in seconds',
    ['model_version']
)

class PredictionRequest(BaseModel):
    features: List[float]

class PredictionResponse(BaseModel):
    prediction: float
    probability: float
    model_version: str
    latency_ms: float

@app.on_event("startup")
async def load_model():
    """Load model on startup"""
    global model, scaler
    model = joblib.load("models/churn_model_v1.pkl")
    scaler = joblib.load("models/scaler_v1.pkl")
    print("✅ Model loaded successfully")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make prediction"""
    start_time = time.time()

    try:
        # Preprocess
        features = np.array(request.features).reshape(1, -1)
        features_scaled = scaler.transform(features)

        # Predict
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0][1]

        # Metrics
        latency = (time.time() - start_time) * 1000
        prediction_counter.labels(model_version="v1", status="success").inc()
        prediction_latency.labels(model_version="v1").observe(time.time() - start_time)

        return PredictionResponse(
            prediction=float(prediction),
            probability=float(probability),
            model_version="v1",
            latency_ms=latency
        )

    except Exception as e:
        prediction_counter.labels(model_version="v1", status="error").inc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Batch predictions for efficiency"""
    features = np.array([req.features for req in requests])
    features_scaled = scaler.transform(features)

    predictions = model.predict(features_scaled)
    probabilities = model.predict_proba(features_scaled)[:, 1]

    return [
        {
            "prediction": float(pred),
            "probability": float(prob),
            "model_version": "v1"
        }
        for pred, prob in zip(predictions, probabilities)
    ]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_version": "v1"
    }

# Prometheus metrics endpoint
app.mount("/metrics", make_asgi_app())

# Run with: uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

### 2. Model Versioning and A/B Testing

```python
# api/ab_testing.py
from fastapi import FastAPI, Request
from typing import Dict
import joblib
import random
import hashlib

app = FastAPI()

# Load multiple model versions
models = {
    "v1": joblib.load("models/model_v1.pkl"),
    "v2": joblib.load("models/model_v2.pkl"),
    "v3": joblib.load("models/model_v3.pkl")
}

# A/B test configuration
AB_CONFIG = {
    "v1": 0.5,   # 50% traffic
    "v2": 0.3,   # 30% traffic
    "v3": 0.2    # 20% traffic
}

def select_model_version(user_id: str) -> str:
    """Deterministic A/B test assignment based on user_id"""
    # Hash user_id for consistent assignment
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    random_value = (hash_value % 100) / 100.0

    cumulative = 0
    for version, probability in AB_CONFIG.items():
        cumulative += probability
        if random_value < cumulative:
            return version

    return "v1"  # Default

@app.post("/predict")
async def predict_ab(request: PredictionRequest, user_id: str):
    """Prediction with A/B testing"""

    # Select model version for this user
    model_version = select_model_version(user_id)
    model = models[model_version]

    # Make prediction
    features = np.array(request.features).reshape(1, -1)
    prediction = model.predict(features)[0]

    # Log for analysis
    log_prediction(
        user_id=user_id,
        model_version=model_version,
        features=request.features,
        prediction=prediction
    )

    return {
        "prediction": float(prediction),
        "model_version": model_version,
        "ab_test": True
    }
```

### 3. Canary Deployment

```python
# api/canary_deployment.py
from fastapi import FastAPI
import joblib
import random
from datetime import datetime, timedelta

app = FastAPI()

# Load models
stable_model = joblib.load("models/stable_v1.pkl")
canary_model = joblib.load("models/canary_v2.pkl")

# Canary configuration
CANARY_CONFIG = {
    "enabled": True,
    "traffic_percentage": 0.1,  # Start with 10%
    "start_time": datetime.now(),
    "duration_hours": 24,
    "rollback_on_error_rate": 0.05  # Rollback if >5% errors
}

# Metrics
canary_metrics = {
    "stable": {"success": 0, "error": 0},
    "canary": {"success": 0, "error": 0}
}

def should_use_canary() -> bool:
    """Decide whether to use canary model"""
    if not CANARY_CONFIG["enabled"]:
        return False

    # Check if canary period has expired
    elapsed = datetime.now() - CANARY_CONFIG["start_time"]
    if elapsed > timedelta(hours=CANARY_CONFIG["duration_hours"]):
        return False

    # Check error rate
    canary_error_rate = (
        canary_metrics["canary"]["error"] /
        max(sum(canary_metrics["canary"].values()), 1)
    )
    if canary_error_rate > CANARY_CONFIG["rollback_on_error_rate"]:
        print("⚠️ Canary error rate too high, rolling back")
        CANARY_CONFIG["enabled"] = False
        return False

    # Random traffic split
    return random.random() < CANARY_CONFIG["traffic_percentage"]

@app.post("/predict")
async def predict_canary(request: PredictionRequest):
    """Prediction with canary deployment"""

    use_canary = should_use_canary()
    model = canary_model if use_canary else stable_model
    version = "canary_v2" if use_canary else "stable_v1"

    try:
        # Make prediction
        features = np.array(request.features).reshape(1, -1)
        prediction = model.predict(features)[0]

        # Update metrics
        metrics_key = "canary" if use_canary else "stable"
        canary_metrics[metrics_key]["success"] += 1

        return {
            "prediction": float(prediction),
            "model_version": version,
            "deployment_type": "canary" if use_canary else "stable"
        }

    except Exception as e:
        # Update error metrics
        metrics_key = "canary" if use_canary else "stable"
        canary_metrics[metrics_key]["error"] += 1
        raise

@app.get("/canary_metrics")
async def get_canary_metrics():
    """Get canary deployment metrics"""
    return {
        "config": CANARY_CONFIG,
        "metrics": canary_metrics,
        "canary_error_rate": (
            canary_metrics["canary"]["error"] /
            max(sum(canary_metrics["canary"].values()), 1)
        )
    }
```

---

## TensorFlow Serving

### 1. Export TensorFlow Model

```python
# deployment/export_tf_model.py
import tensorflow as tf
from tensorflow import keras
import os

def export_model_for_serving(
    model: keras.Model,
    export_path: str,
    version: int = 1
):
    """Export TensorFlow model for TF Serving"""

    # Create versioned directory
    model_path = os.path.join(export_path, str(version))

    # Save in SavedModel format
    tf.saved_model.save(model, model_path)

    print(f"✅ Model exported to {model_path}")
    print(f"Signature: {list(model.signatures.keys())}")

# Usage
model = keras.models.load_model("models/churn_model.h5")
export_model_for_serving(model, export_path="./tf-models/churn", version=1)

# Directory structure:
# tf-models/
#   churn/
#     1/
#       saved_model.pb
#       variables/
```

### 2. Deploy with Docker

```dockerfile
# deployment/Dockerfile.tfserving
FROM tensorflow/serving:latest

# Copy model
COPY tf-models/churn /models/churn

# Expose ports
EXPOSE 8500  # gRPC
EXPOSE 8501  # REST

# Set model name
ENV MODEL_NAME=churn

# Run TensorFlow Serving
CMD ["tensorflow_model_server", \
     "--port=8500", \
     "--rest_api_port=8501", \
     "--model_name=${MODEL_NAME}", \
     "--model_base_path=/models/${MODEL_NAME}"]
```

```bash
# Build and run
docker build -t churn-model-serving -f Dockerfile.tfserving .
docker run -p 8500:8500 -p 8501:8501 churn-model-serving

# Test REST API
curl -X POST http://localhost:8501/v1/models/churn:predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [[0.5, 1.2, 3.4, 2.1]]}'
```

### 3. Client for TF Serving

```python
# deployment/tf_serving_client.py
import requests
import grpc
import tensorflow as tf
from tensorflow_serving.apis import predict_pb2, prediction_service_pb2_grpc
import numpy as np

class TFServingClient:
    """Client for TensorFlow Serving"""

    def __init__(self, host: str = "localhost", rest_port: int = 8501, grpc_port: int = 8500):
        self.rest_url = f"http://{host}:{rest_port}"
        self.grpc_channel = grpc.insecure_channel(f"{host}:{grpc_port}")
        self.grpc_stub = prediction_service_pb2_grpc.PredictionServiceStub(self.grpc_channel)

    def predict_rest(self, model_name: str, instances: list, version: int = None):
        """Predict using REST API"""
        url = f"{self.rest_url}/v1/models/{model_name}"
        if version:
            url += f"/versions/{version}"
        url += ":predict"

        response = requests.post(url, json={"instances": instances})
        return response.json()

    def predict_grpc(self, model_name: str, data: np.ndarray, version: int = None):
        """Predict using gRPC (faster)"""
        request = predict_pb2.PredictRequest()
        request.model_spec.name = model_name
        if version:
            request.model_spec.version.value = version

        request.inputs['input'].CopyFrom(
            tf.make_tensor_proto(data, dtype=tf.float32)
        )

        result = self.grpc_stub.Predict(request, timeout=10.0)
        return result

# Usage
client = TFServingClient()

# REST API (easier, slower)
result = client.predict_rest("churn", instances=[[0.5, 1.2, 3.4, 2.1]])
print(f"Prediction: {result['predictions']}")

# gRPC (faster, more complex)
data = np.array([[0.5, 1.2, 3.4, 2.1]], dtype=np.float32)
result = client.predict_grpc("churn", data)
print(f"Prediction: {result.outputs['output'].float_val}")
```

---

## TorchServe

### 1. Create Model Archive

```python
# deployment/torch_handler.py
from ts.torch_handler.base_handler import BaseHandler
import torch
import numpy as np

class ChurnPredictionHandler(BaseHandler):
    """Custom TorchServe handler"""

    def preprocess(self, data):
        """Preprocess input data"""
        features = data[0].get("features")
        if features is None:
            features = data[0].get("body")

        # Convert to tensor
        tensor = torch.FloatTensor(features)
        return tensor

    def inference(self, data):
        """Run inference"""
        with torch.no_grad():
            prediction = self.model(data)
        return prediction

    def postprocess(self, inference_output):
        """Postprocess output"""
        # Apply softmax for probabilities
        probabilities = torch.softmax(inference_output, dim=1)
        predicted_class = torch.argmax(probabilities, dim=1)

        return [
            {
                "prediction": int(predicted_class[0]),
                "probability": float(probabilities[0][1]),
                "all_probabilities": probabilities[0].tolist()
            }
        ]

# Save handler
# torch_handler.py should be in same directory as model
```

```bash
# Create model archive (.mar file)
torch-model-archiver \
  --model-name churn-predictor \
  --version 1.0 \
  --serialized-file models/churn_model.pt \
  --handler torch_handler.py \
  --export-path model-store/

# Directory structure:
# model-store/
#   churn-predictor.mar
```

### 2. Deploy with TorchServe

```yaml
# deployment/torchserve-config.yaml
inference_address: http://0.0.0.0:8080
management_address: http://0.0.0.0:8081
metrics_address: http://0.0.0.0:8082

models:
  churn-predictor:
    1.0:
      defaultVersion: true
      marName: churn-predictor.mar
      minWorkers: 2
      maxWorkers: 4
      batchSize: 8
      maxBatchDelay: 100
      responseTimeout: 120
```

```bash
# Start TorchServe
torchserve --start \
  --model-store model-store/ \
  --models churn-predictor=churn-predictor.mar \
  --ts-config deployment/torchserve-config.yaml

# Test prediction
curl -X POST http://localhost:8080/predictions/churn-predictor \
  -H "Content-Type: application/json" \
  -d '{"features": [0.5, 1.2, 3.4, 2.1]}'

# Management API
curl http://localhost:8081/models  # List models
curl -X PUT http://localhost:8081/models/churn-predictor?min_worker=4  # Scale workers
```

---

## Model Monitoring

### Comprehensive Monitoring System

```python
# monitoring/model_monitor.py
from prometheus_client import Counter, Histogram, Gauge, Summary
import logging
from datetime import datetime
from typing import Dict, Any
import numpy as np
from scipy import stats

# Prometheus metrics
prediction_latency = Histogram(
    'model_prediction_latency_seconds',
    'Model prediction latency',
    ['model_version', 'endpoint']
)

prediction_count = Counter(
    'model_predictions_total',
    'Total predictions',
    ['model_version', 'prediction_class', 'status']
)

model_accuracy = Gauge(
    'model_accuracy',
    'Model accuracy over time window',
    ['model_version', 'time_window']
)

feature_drift = Gauge(
    'feature_drift_score',
    'Feature distribution drift score (KS statistic)',
    ['model_version', 'feature_name']
)

class ModelMonitor:
    """Comprehensive model monitoring"""

    def __init__(self, reference_data: np.ndarray, feature_names: list):
        self.reference_data = reference_data
        self.feature_names = feature_names
        self.predictions_window = []
        self.actuals_window = []

    def log_prediction(
        self,
        model_version: str,
        features: np.ndarray,
        prediction: float,
        latency: float,
        actual: float = None
    ):
        """Log prediction with monitoring"""

        # Log latency
        prediction_latency.labels(
            model_version=model_version,
            endpoint="/predict"
        ).observe(latency)

        # Log prediction count
        prediction_count.labels(
            model_version=model_version,
            prediction_class=str(int(prediction)),
            status="success"
        ).inc()

        # Store for drift detection
        self.predictions_window.append((features, prediction, actual))

        # Check drift every 100 predictions
        if len(self.predictions_window) >= 100:
            self.detect_drift(model_version)
            self.predictions_window = []

    def detect_drift(self, model_version: str):
        """Detect feature drift using KS test"""

        current_features = np.array([
            p[0] for p in self.predictions_window
        ])

        for i, feature_name in enumerate(self.feature_names):
            # Kolmogorov-Smirnov test
            ks_statistic, p_value = stats.ks_2samp(
                self.reference_data[:, i],
                current_features[:, i]
            )

            # Log drift metric
            feature_drift.labels(
                model_version=model_version,
                feature_name=feature_name
            ).set(ks_statistic)

            # Alert if significant drift (p < 0.05)
            if p_value < 0.05:
                logging.warning(
                    f"⚠️ Feature drift detected: {feature_name} "
                    f"(KS={ks_statistic:.4f}, p={p_value:.4f})"
                )

    def calculate_accuracy(self, model_version: str, time_window: str = "1h"):
        """Calculate model accuracy over time window"""

        # Filter predictions with actuals
        predictions_with_actuals = [
            (p[1], p[2])
            for p in self.predictions_window
            if p[2] is not None
        ]

        if not predictions_with_actuals:
            return

        predictions, actuals = zip(*predictions_with_actuals)
        accuracy = np.mean(np.array(predictions) == np.array(actuals))

        # Log accuracy metric
        model_accuracy.labels(
            model_version=model_version,
            time_window=time_window
        ).set(accuracy)

# Usage
monitor = ModelMonitor(
    reference_data=training_features,
    feature_names=['age', 'tenure', 'usage', 'revenue']
)

# In prediction endpoint
start_time = time.time()
prediction = model.predict(features)
latency = time.time() - start_time

monitor.log_prediction(
    model_version="v1",
    features=features,
    prediction=prediction,
    latency=latency,
    actual=None  # Set when feedback received
)
```

---

## Resources

### scripts/
- `deploy-model.sh` - Deploy model to production
- `rollback-model.sh` - Rollback to previous model version
- `benchmark-inference.py` - Benchmark model inference performance

### references/
- `references/tf-serving-guide.md` - TensorFlow Serving setup and configuration
- `references/torchserve-guide.md` - TorchServe deployment patterns
- `references/monitoring-dashboards.md` - Grafana dashboard templates
- `references/ab-testing-methodology.md` - Statistical A/B testing for models

### assets/
- `assets/docker-compose/` - Docker Compose files for model serving
- `assets/k8s-manifests/` - Kubernetes deployment manifests
- `assets/grafana-dashboards/` - Grafana JSON dashboards

## Related Skills

- `ml-pipelines` - Training models for deployment
- `microservices` - Model as microservice pattern
- `serverless` - Serverless model deployment
- `testing-strategies` - Model testing and validation
