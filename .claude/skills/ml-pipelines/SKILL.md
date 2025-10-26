---
name: ml-pipelines
description: ML model training pipelines, feature engineering, experiment tracking with MLflow/Kubeflow. Use when building training pipelines, feature stores, hyperparameter tuning, or orchestrating ML workflows. Covers data preprocessing, model training, distributed training, and experiment management. Reduces ML pipeline development time by 50%.
---

# ML Pipelines

## Overview

Production-grade ML model training pipelines covering data preprocessing, feature engineering, model training, hyperparameter tuning, and experiment tracking. Supports MLflow, Kubeflow, and custom pipeline frameworks.

**Goal**: Build scalable, reproducible ML training pipelines that track experiments and enable efficient model development

## When to Use This Skill

Use this skill when:
- Building model training pipelines from scratch
- Implementing feature engineering and preprocessing
- Setting up experiment tracking (MLflow, Weights & Biases)
- Orchestrating distributed training (Ray, Horovod)
- Creating feature stores (Feast, Tecton)
- Hyperparameter tuning at scale (Optuna, Ray Tune)
- Migrating from notebooks to production pipelines

**Triggers**: "ML pipeline", "model training", "feature engineering", "MLflow", "Kubeflow", "hyperparameter tuning", "experiment tracking", "feature store"

---

## Quick Start: Pipeline Architecture Decision Tree

### When to Use Different Pipeline Frameworks

**MLflow** (Experiment tracking, model registry):
- ✅ Experiment tracking and reproducibility
- ✅ Model versioning and registry
- ✅ Simple local or cloud deployment
- ✅ Python-first workflows
- ✅ Integration with scikit-learn, PyTorch, TensorFlow
- ✅ Best for: Small to medium teams, research projects

**Kubeflow Pipelines** (Kubernetes-native ML workflows):
- ✅ Complex multi-step workflows
- ✅ Kubernetes-based infrastructure
- ✅ Distributed training at scale
- ✅ Component reusability
- ✅ Production-grade orchestration
- ✅ Best for: Large teams, enterprise ML platforms

**Ray** (Distributed compute framework):
- ✅ Distributed training and tuning
- ✅ Hyperparameter optimization at scale
- ✅ Python-native API
- ✅ Flexible compute allocation
- ✅ Best for: Large-scale training, HPO

**Custom (Airflow/Prefect + Python)**:
- ✅ Full control over workflow
- ✅ Integration with existing data pipelines
- ✅ Custom scheduling and monitoring
- ✅ Best for: Unique requirements, existing infrastructure

---

## MLflow Training Pipeline

### 1. Experiment Setup

```python
# training/experiment_config.py
import mlflow
import os
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class ExperimentConfig:
    """MLflow experiment configuration"""
    experiment_name: str
    tracking_uri: str = "http://localhost:5000"
    artifact_location: str = "./mlruns"

    def setup(self) -> str:
        """Setup MLflow experiment and return experiment ID"""
        mlflow.set_tracking_uri(self.tracking_uri)

        # Create or get existing experiment
        experiment = mlflow.get_experiment_by_name(self.experiment_name)
        if experiment is None:
            experiment_id = mlflow.create_experiment(
                name=self.experiment_name,
                artifact_location=self.artifact_location
            )
        else:
            experiment_id = experiment.experiment_id

        mlflow.set_experiment(self.experiment_name)
        return experiment_id

# Usage
config = ExperimentConfig(
    experiment_name="user-churn-prediction",
    tracking_uri="http://mlflow.company.com",
    artifact_location="s3://ml-artifacts/experiments"
)
experiment_id = config.setup()
```

### 2. Feature Engineering Pipeline

```python
# features/preprocessing.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from typing import List, Tuple

class FeatureEngineer:
    """Feature engineering pipeline with versioning"""

    def __init__(self, version: str = "v1"):
        self.version = version
        self.numeric_features = []
        self.categorical_features = []
        self.pipeline = None

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: str
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Fit pipeline and transform data"""

        # Separate features and target
        X = df.drop(columns=[target_col])
        y = df[target_col]

        # Identify feature types
        self.numeric_features = X.select_dtypes(
            include=['int64', 'float64']
        ).columns.tolist()
        self.categorical_features = X.select_dtypes(
            include=['object', 'category']
        ).columns.tolist()

        # Create preprocessing pipeline
        numeric_transformer = Pipeline([
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline([
            ('encoder', LabelEncoder()) # Use OneHotEncoder for multiple categories
        ])

        self.pipeline = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat', categorical_transformer, self.categorical_features)
            ]
        )

        # Fit and transform
        X_transformed = self.pipeline.fit_transform(X)

        return X_transformed, y.values

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform new data using fitted pipeline"""
        if self.pipeline is None:
            raise ValueError("Pipeline not fitted. Call fit_transform first.")

        return self.pipeline.transform(df)

    def get_feature_names(self) -> List[str]:
        """Get feature names after transformation"""
        return self.numeric_features + self.categorical_features

# Custom feature engineering
class ChurnFeatureEngineer(FeatureEngineer):
    """Domain-specific features for churn prediction"""

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create domain-specific features"""
        df = df.copy()

        # Tenure buckets
        df['tenure_bucket'] = pd.cut(
            df['tenure'],
            bins=[0, 12, 24, 48, np.inf],
            labels=['0-1y', '1-2y', '2-4y', '4y+']
        )

        # Usage intensity
        df['usage_intensity'] = (
            df['monthly_minutes'] / df['tenure']
        ).fillna(0)

        # Revenue per month
        df['revenue_per_month'] = (
            df['total_revenue'] / df['tenure']
        ).fillna(0)

        # Recent activity drop
        df['activity_drop'] = (
            df['prev_month_minutes'] - df['current_month_minutes']
        ) / df['prev_month_minutes'].replace(0, 1)

        return df

# Usage
engineer = ChurnFeatureEngineer(version="v1")
df_engineered = engineer.engineer_features(df)
X, y = engineer.fit_transform(df_engineered, target_col='churned')
```

### 3. Training Pipeline with MLflow

```python
# training/train.py
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
import numpy as np
from typing import Dict, Any
import joblib

class MLflowTrainer:
    """Model training with MLflow tracking"""

    def __init__(self, config: ExperimentConfig):
        self.config = config
        self.config.setup()

    def train_model(
        self,
        X: np.ndarray,
        y: np.ndarray,
        model_params: Dict[str, Any],
        tags: Dict[str, str] = None
    ) -> str:
        """Train model and log to MLflow"""

        # Start MLflow run
        with mlflow.start_run(tags=tags) as run:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )

            # Log parameters
            mlflow.log_params(model_params)
            mlflow.log_param("train_size", len(X_train))
            mlflow.log_param("test_size", len(X_test))

            # Train model
            model = RandomForestClassifier(**model_params, random_state=42)
            model.fit(X_train, y_train)

            # Cross-validation
            cv_scores = cross_val_score(
                model, X_train, y_train, cv=5, scoring='roc_auc'
            )
            mlflow.log_metric("cv_roc_auc_mean", cv_scores.mean())
            mlflow.log_metric("cv_roc_auc_std", cv_scores.std())

            # Predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]

            # Log metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred),
                'recall': recall_score(y_test, y_pred),
                'f1': f1_score(y_test, y_pred),
                'roc_auc': roc_auc_score(y_test, y_pred_proba)
            }
            mlflow.log_metrics(metrics)

            # Log confusion matrix as artifact
            cm = confusion_matrix(y_test, y_pred)
            np.savetxt("confusion_matrix.txt", cm, fmt='%d')
            mlflow.log_artifact("confusion_matrix.txt")

            # Log feature importances
            feature_importance = pd.DataFrame({
                'feature': range(X.shape[1]),
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            feature_importance.to_csv("feature_importance.csv", index=False)
            mlflow.log_artifact("feature_importance.csv")

            # Log model
            mlflow.sklearn.log_model(
                model,
                "model",
                registered_model_name=f"{self.config.experiment_name}-model"
            )

            print(f"✅ Model trained successfully")
            print(f"Run ID: {run.info.run_id}")
            print(f"Metrics: {metrics}")

            return run.info.run_id

# Usage
trainer = MLflowTrainer(config)
run_id = trainer.train_model(
    X, y,
    model_params={
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 5,
        'min_samples_leaf': 2
    },
    tags={
        'version': 'v1',
        'model_type': 'random_forest',
        'engineer': 'Dr.AI-ML'
    }
)
```

### 4. Hyperparameter Tuning with Optuna + MLflow

```python
# training/hyperparameter_tuning.py
import optuna
from optuna.integration.mlflow import MLflowCallback
import mlflow
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
import numpy as np

class OptunaMLflowTuner:
    """Hyperparameter tuning with Optuna + MLflow integration"""

    def __init__(self, config: ExperimentConfig):
        self.config = config
        self.config.setup()

    def objective(self, trial: optuna.Trial, X: np.ndarray, y: np.ndarray) -> float:
        """Optuna objective function"""

        # Suggest hyperparameters
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300),
            'max_depth': trial.suggest_int('max_depth', 5, 30),
            'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
            'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
            'max_features': trial.suggest_categorical(
                'max_features', ['sqrt', 'log2', None]
            ),
            'random_state': 42
        }

        # Train model with cross-validation
        model = RandomForestClassifier(**params)
        scores = cross_val_score(
            model, X, y, cv=5, scoring='roc_auc', n_jobs=-1
        )

        return scores.mean()

    def tune(
        self,
        X: np.ndarray,
        y: np.ndarray,
        n_trials: int = 100
    ) -> Dict[str, Any]:
        """Run hyperparameter tuning"""

        # Create MLflow callback
        mlflow_callback = MLflowCallback(
            tracking_uri=self.config.tracking_uri,
            metric_name="roc_auc_cv"
        )

        # Create study
        study = optuna.create_study(
            study_name=f"{self.config.experiment_name}-tuning",
            direction='maximize',
            sampler=optuna.samplers.TPESampler(seed=42)
        )

        # Optimize
        study.optimize(
            lambda trial: self.objective(trial, X, y),
            n_trials=n_trials,
            callbacks=[mlflow_callback],
            n_jobs=-1
        )

        print(f"✅ Tuning complete")
        print(f"Best ROC-AUC: {study.best_value:.4f}")
        print(f"Best params: {study.best_params}")

        return {
            'best_params': study.best_params,
            'best_value': study.best_value,
            'study': study
        }

# Usage
tuner = OptunaMLflowTuner(config)
results = tuner.tune(X, y, n_trials=100)

# Train final model with best params
trainer = MLflowTrainer(config)
run_id = trainer.train_model(X, y, results['best_params'])
```

---

## Kubeflow Pipelines

### 1. Pipeline Component

```python
# kubeflow/components/preprocess.py
from kfp import dsl
from kfp.dsl import Dataset, Input, Output, Model

@dsl.component(
    base_image='python:3.10',
    packages_to_install=['pandas==2.0.0', 'scikit-learn==1.3.0']
)
def preprocess_data(
    input_data: Input[Dataset],
    output_features: Output[Dataset],
    test_size: float = 0.2
):
    """Preprocess data for training"""
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import pickle

    # Load data
    df = pd.read_csv(input_data.path)

    # Feature engineering
    X = df.drop(columns=['target'])
    y = df['target']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save processed data
    processed_data = {
        'X_train': X_train_scaled,
        'X_test': X_test_scaled,
        'y_train': y_train.values,
        'y_test': y_test.values,
        'scaler': scaler
    }

    with open(output_features.path, 'wb') as f:
        pickle.dump(processed_data, f)

@dsl.component(
    base_image='python:3.10',
    packages_to_install=['scikit-learn==1.3.0', 'mlflow==2.8.0']
)
def train_model(
    input_features: Input[Dataset],
    output_model: Output[Model],
    n_estimators: int = 100,
    max_depth: int = 10
):
    """Train ML model"""
    import pickle
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, roc_auc_score
    import mlflow

    # Load processed data
    with open(input_features.path, 'rb') as f:
        data = pickle.load(f)

    X_train = data['X_train']
    y_train = data['y_train']
    X_test = data['X_test']
    y_test = data['y_test']

    # Train model
    with mlflow.start_run():
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)

        # Log metrics
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("roc_auc", roc_auc)

        # Save model
        with open(output_model.path, 'wb') as f:
            pickle.dump({'model': model, 'scaler': data['scaler']}, f)

        print(f"Accuracy: {accuracy:.4f}, ROC-AUC: {roc_auc:.4f}")
```

### 2. Pipeline Definition

```python
# kubeflow/pipelines/training_pipeline.py
from kfp import dsl
from kfp.dsl import Dataset, Model

@dsl.pipeline(
    name='ML Training Pipeline',
    description='End-to-end ML training pipeline with Kubeflow'
)
def training_pipeline(
    data_path: str,
    n_estimators: int = 100,
    max_depth: int = 10,
    test_size: float = 0.2
):
    """Complete ML training pipeline"""

    # Step 1: Load data
    load_data_task = load_data(data_path=data_path)

    # Step 2: Preprocess
    preprocess_task = preprocess_data(
        input_data=load_data_task.outputs['output_data'],
        test_size=test_size
    )

    # Step 3: Train model
    train_task = train_model(
        input_features=preprocess_task.outputs['output_features'],
        n_estimators=n_estimators,
        max_depth=max_depth
    )

    # Step 4: Evaluate model
    evaluate_task = evaluate_model(
        input_model=train_task.outputs['output_model'],
        input_features=preprocess_task.outputs['output_features']
    )

    # Step 5: Deploy if metrics pass threshold
    with dsl.Condition(evaluate_task.outputs['roc_auc'] >= 0.85):
        deploy_model(
            input_model=train_task.outputs['output_model'],
            model_name='churn-predictor'
        )

# Compile pipeline
from kfp import compiler

compiler.Compiler().compile(
    pipeline_func=training_pipeline,
    package_path='training_pipeline.yaml'
)

# Submit pipeline
from kfp.client import Client

client = Client(host='http://kubeflow.company.com')
run = client.create_run_from_pipeline_func(
    training_pipeline,
    arguments={
        'data_path': 's3://ml-data/churn-data.csv',
        'n_estimators': 200,
        'max_depth': 15,
        'test_size': 0.2
    }
)
```

---

## Distributed Training with Ray

### Ray Train Example

```python
# training/ray_distributed.py
import ray
from ray import train
from ray.train import ScalingConfig
from ray.train.torch import TorchTrainer
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

def train_func(config: dict):
    """Training function for Ray"""

    # Get data from Ray
    train_dataset = train.get_dataset_shard("train")

    # Create model
    model = nn.Sequential(
        nn.Linear(config['input_dim'], 128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, 64),
        nn.ReLU(),
        nn.Linear(64, 1),
        nn.Sigmoid()
    )

    # Wrap model with Ray
    model = train.torch.prepare_model(model)

    # Optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=config['lr'])
    criterion = nn.BCELoss()

    # Training loop
    for epoch in range(config['epochs']):
        model.train()
        total_loss = 0

        for batch in train_dataset.iter_torch_batches(batch_size=config['batch_size']):
            X = batch['features']
            y = batch['labels']

            optimizer.zero_grad()
            outputs = model(X)
            loss = criterion(outputs, y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        # Report metrics to Ray
        train.report({
            'epoch': epoch,
            'loss': total_loss / len(train_dataset)
        })

# Initialize Ray
ray.init(address='auto')  # Connect to Ray cluster

# Create trainer
trainer = TorchTrainer(
    train_func,
    train_loop_config={
        'input_dim': 100,
        'lr': 0.001,
        'epochs': 10,
        'batch_size': 128
    },
    scaling_config=ScalingConfig(
        num_workers=4,  # 4 distributed workers
        use_gpu=True
    ),
    datasets={'train': ray_dataset}
)

# Train
result = trainer.fit()
print(f"Final metrics: {result.metrics}")
```

---

## Resources

### scripts/
- `execute-mlflow-training.py` - Run MLflow training pipeline
- `execute-kubeflow-pipeline.py` - Submit Kubeflow pipeline
- `execute-hyperparameter-tuning.py` - Run Optuna tuning

### references/
- `references/mlflow-setup.md` - MLflow server setup and configuration
- `references/kubeflow-components.md` - Kubeflow component library
- `references/feature-engineering-patterns.md` - Common feature engineering techniques
- `references/distributed-training.md` - Ray/Horovod distributed training

### assets/
- `assets/pipeline-templates/` - Kubeflow YAML templates
- `assets/mlflow-configs/` - MLflow tracking server configs

## Related Skills

- `rag-optimization` - RAG system training and fine-tuning
- `model-deployment` - Deploy trained models to production
- `vector-databases` - Feature store and embedding storage
- `testing-strategies` - ML model testing and validation
