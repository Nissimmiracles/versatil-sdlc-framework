# Feature Engineering Pipeline - ML Workflow Automation

**Status**: Pending
**Priority**: P1 (Critical - Blocks Wave 4)
**Assigned**: Dr.AI-ML
**Estimated**: 40h
**Wave**: 1 (Foundation Infrastructure)
**Created**: 2025-10-29

## Mission

Implement comprehensive feature engineering pipeline supporting image, text, tabular, and time-series data with preprocessing, transformation, augmentation, and feature store integration for ML model training and inference.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No `src/ml/` directory or Python ML code
- No feature processing modules
- No feature store integration
- No data transformation pipelines

**Why This Blocks Other Work**:
- Pattern recognition (Wave 4) needs preprocessed features
- Model training (Wave 2) requires engineered features
- Dataset tools (Wave 4) depend on transformation pipelines
- Predictions need consistent feature preprocessing

## Requirements

### Data Modalities (4 Types)

#### 1. Image Processing
**Formats**: JPEG, PNG, TIFF, DICOM
**Operations**:
- Resizing (224x224, 384x384, 512x512)
- Normalization (ImageNet mean/std)
- Augmentation (rotation, flip, crop, color jitter)
- Format conversion (RGB, grayscale)

#### 2. Text Processing
**Formats**: Plain text, JSON, CSV
**Operations**:
- Tokenization (WordPiece, SentencePiece, BPE)
- Embeddings (BERT, GPT, Sentence-BERT)
- Cleaning (lowercase, punctuation, stopwords)
- Feature extraction (TF-IDF, n-grams)

#### 3. Tabular Processing
**Formats**: CSV, Parquet, JSON
**Operations**:
- Scaling (StandardScaler, MinMaxScaler, RobustScaler)
- Encoding (one-hot, label, target, ordinal)
- Missing value imputation (mean, median, KNN, model-based)
- Feature selection (correlation, mutual info, PCA)

#### 4. Time-Series Processing
**Formats**: CSV, Parquet
**Operations**:
- Resampling (upsampling, downsampling)
- Windowing (sliding, rolling)
- Feature extraction (lag, rolling stats, FFT)
- Seasonality decomposition

### Feature Store Integration

**Purpose**: Centralized feature management with versioning and serving

**Options**:
1. **Vertex AI Feature Store** (GCP native)
2. **Feast** (open-source)
3. **Custom Feature Store** (PostgreSQL + Redis cache)

**Recommended**: Vertex AI Feature Store for GCP integration

**Operations**:
- Feature registration
- Feature serving (online/offline)
- Feature monitoring (drift detection)
- Feature lineage tracking

## Acceptance Criteria

- [ ] 4 processor modules implemented (image, text, tabular, time-series)
- [ ] Each processor supports preprocessing, transformation, augmentation
- [ ] Feature store client created (`src/ml/feature_store/client.ts` or `.py`)
- [ ] Feature registration API implemented
- [ ] Feature serving API implemented (online + offline)
- [ ] Pipeline orchestration with caching
- [ ] Unit tests for all processors (85%+ coverage)
- [ ] Integration tests with sample datasets
- [ ] Performance benchmarks (throughput, latency)
- [ ] Documentation with code examples

## Technical Approach

### Language Choice

**Option 1: Python** (Recommended for ML ecosystem)
```
src/ml/
├── feature_engineering/
│   ├── processors/
│   │   ├── image_processor.py
│   │   ├── text_processor.py
│   │   ├── tabular_processor.py
│   │   └── time_series_processor.py
│   ├── pipeline.py
│   └── config.py
├── feature_store/
│   ├── client.py
│   ├── registry.py
│   └── serving.py
└── utils/
    ├── validation.py
    └── caching.py
```

**Option 2: TypeScript** (Consistency with framework)
```
src/ml/
├── feature-engineering/
│   ├── processors/
│   │   ├── image-processor.ts
│   │   ├── text-processor.ts
│   │   ├── tabular-processor.ts
│   │   └── time-series-processor.ts
│   ├── pipeline.ts
│   └── config.ts
├── feature-store/
│   ├── client.ts
│   ├── registry.ts
│   └── serving.ts
└── utils/
    ├── validation.ts
    └── caching.ts
```

**Recommendation**: Python for ML libraries (scikit-learn, TensorFlow, PyTorch) + TypeScript for orchestration

### Image Processor Implementation

```python
# src/ml/feature_engineering/processors/image_processor.py
import numpy as np
from PIL import Image
from typing import Dict, Any
import albumentations as A
from albumentations.pytorch import ToTensorV2

class ImageProcessor:
    """Image preprocessing and augmentation pipeline."""

    def __init__(self, config: Dict[str, Any]):
        self.target_size = config.get('target_size', (224, 224))
        self.normalize = config.get('normalize', True)
        self.augment = config.get('augment', False)

        # ImageNet normalization
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]

        # Augmentation pipeline
        if self.augment:
            self.transform = A.Compose([
                A.Resize(*self.target_size),
                A.HorizontalFlip(p=0.5),
                A.RandomBrightnessContrast(p=0.3),
                A.Rotate(limit=15, p=0.3),
                A.Normalize(mean=self.mean, std=self.std),
                ToTensorV2()
            ])
        else:
            self.transform = A.Compose([
                A.Resize(*self.target_size),
                A.Normalize(mean=self.mean, std=self.std),
                ToTensorV2()
            ])

    def preprocess(self, image_path: str) -> np.ndarray:
        """Preprocess single image."""
        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)
        transformed = self.transform(image=image_np)
        return transformed['image']

    def preprocess_batch(self, image_paths: List[str]) -> np.ndarray:
        """Preprocess batch of images."""
        return np.stack([self.preprocess(path) for path in image_paths])
```

### Text Processor Implementation

```python
# src/ml/feature_engineering/processors/text_processor.py
from transformers import AutoTokenizer, AutoModel
import torch
from typing import List, Dict, Any

class TextProcessor:
    """Text preprocessing and embedding pipeline."""

    def __init__(self, config: Dict[str, Any]):
        self.model_name = config.get('model_name', 'bert-base-uncased')
        self.max_length = config.get('max_length', 512)

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)

    def preprocess(self, text: str) -> Dict[str, torch.Tensor]:
        """Tokenize and prepare text."""
        return self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

    def embed(self, text: str) -> np.ndarray:
        """Generate embeddings for text."""
        inputs = self.preprocess(text)
        with torch.no_grad():
            outputs = self.model(**inputs)
        # Use [CLS] token embedding
        return outputs.last_hidden_state[:, 0, :].numpy()

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for batch of texts."""
        return np.vstack([self.embed(text) for text in texts])
```

### Tabular Processor Implementation

```python
# src/ml/feature_engineering/processors/tabular_processor.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from typing import List, Dict, Any

class TabularProcessor:
    """Tabular data preprocessing pipeline."""

    def __init__(self, config: Dict[str, Any]):
        self.numeric_features = config.get('numeric_features', [])
        self.categorical_features = config.get('categorical_features', [])

        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        self.imputer = SimpleImputer(strategy='mean')

        self.fitted = False

    def fit(self, df: pd.DataFrame):
        """Fit preprocessing transformers."""
        if self.numeric_features:
            self.imputer.fit(df[self.numeric_features])
            df_imputed = self.imputer.transform(df[self.numeric_features])
            self.scaler.fit(df_imputed)

        if self.categorical_features:
            self.encoder.fit(df[self.categorical_features])

        self.fitted = True

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform dataframe to processed features."""
        if not self.fitted:
            raise ValueError("Processor must be fitted before transform")

        features = []

        if self.numeric_features:
            numeric_imputed = self.imputer.transform(df[self.numeric_features])
            numeric_scaled = self.scaler.transform(numeric_imputed)
            features.append(numeric_scaled)

        if self.categorical_features:
            categorical_encoded = self.encoder.transform(df[self.categorical_features])
            features.append(categorical_encoded)

        return np.hstack(features)

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Fit and transform in one step."""
        self.fit(df)
        return self.transform(df)
```

### Feature Store Client

```python
# src/ml/feature_store/client.py
from google.cloud import aiplatform
from typing import Dict, List, Any
import pandas as pd

class FeatureStoreClient:
    """Client for Vertex AI Feature Store."""

    def __init__(self, project_id: str, region: str):
        self.project_id = project_id
        self.region = region
        aiplatform.init(project=project_id, location=region)

    def create_feature_store(self, name: str) -> str:
        """Create new feature store."""
        feature_store = aiplatform.Featurestore.create(
            featurestore_id=name,
            online_store_fixed_node_count=1
        )
        return feature_store.resource_name

    def register_features(
        self,
        entity_type: str,
        features: Dict[str, str]  # feature_name -> feature_type
    ):
        """Register features in feature store."""
        # Implementation details
        pass

    def write_features(
        self,
        entity_type: str,
        features_df: pd.DataFrame
    ):
        """Write features to online store."""
        # Implementation details
        pass

    def read_features(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_ids: List[str]
    ) -> pd.DataFrame:
        """Read features from online store."""
        # Implementation details
        pass
```

## Dependencies

**Required Libraries** (Python):
```bash
pip install \
  numpy>=1.24.0 \
  pandas>=2.0.0 \
  scikit-learn>=1.3.0 \
  pillow>=10.0.0 \
  albumentations>=1.3.0 \
  transformers>=4.30.0 \
  torch>=2.0.0 \
  google-cloud-aiplatform>=1.30.0
```

**Blocks**:
- 021-pattern-recognition-framework.md (needs feature preprocessing)
- 022-dataset-building-tools.md (depends on transformation pipelines)
- 018-vertex-ai-integration.md (needs feature store client)

**Depends On**:
- 015-gcp-infrastructure-setup.md (needs service accounts, buckets)

**Parallel with**: 014 (Database Schema)

## Testing Requirements

### Unit Tests
```python
# tests/ml/feature_engineering/test_image_processor.py
def test_image_resize():
    processor = ImageProcessor({'target_size': (224, 224)})
    image = processor.preprocess('test_image.jpg')
    assert image.shape == (3, 224, 224)

def test_image_normalization():
    processor = ImageProcessor({'normalize': True})
    image = processor.preprocess('test_image.jpg')
    assert image.mean() < 1.0  # Normalized values
```

### Integration Tests
- Test with real datasets (MNIST, CIFAR-10, IMDB)
- Benchmark preprocessing speed (images/sec, texts/sec)
- Test feature store round-trip (write → read → validate)

**Target Coverage**: 85%+

## Performance Requirements

| Operation | Target | Method |
|-----------|--------|--------|
| Image preprocessing | >100 images/sec | Batching, GPU acceleration |
| Text embedding | >50 texts/sec | Batching, model caching |
| Tabular transform | >10K rows/sec | Vectorized operations |
| Feature store write | <100ms latency | Online store |
| Feature store read | <50ms latency | Redis cache |

## Files to Create

1. `src/ml/feature_engineering/processors/image_processor.py`
2. `src/ml/feature_engineering/processors/text_processor.py`
3. `src/ml/feature_engineering/processors/tabular_processor.py`
4. `src/ml/feature_engineering/processors/time_series_processor.py`
5. `src/ml/feature_engineering/pipeline.py`
6. `src/ml/feature_store/client.py`
7. `tests/ml/feature_engineering/test_processors.py`
8. `docs/feature-engineering.md`

## Success Metrics

- [ ] All 4 processors implemented and tested
- [ ] Feature store integration working
- [ ] 85%+ test coverage
- [ ] Performance targets met
- [ ] Documentation complete with examples
- [ ] Benchmarks published

## Related Todos

- **Blocks**: Todos 021, 022, 018
- **Part of**: Wave 1 (Foundation Infrastructure)
- **Depends on**: Todo 015 (GCP Setup)

---

**Agent**: Dr.AI-ML
**Auto-Activate**: YES (ML/AI expertise required)
**Estimated**: 40 hours
**Priority**: P1 (Critical path blocker)
