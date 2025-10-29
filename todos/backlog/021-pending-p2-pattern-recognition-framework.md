# Pattern Recognition Framework - ML Workflow Automation

**Status**: Pending
**Priority**: P2 (Important - Advanced ML Feature)
**Assigned**: Dr.AI-ML
**Estimated**: 80h
**Wave**: 4 (ML Capabilities)
**Created**: 2025-10-29

## Mission

Implement comprehensive pattern recognition framework supporting vision (ViT), text (BERT/GPT), time-series (LSTM), and anomaly detection with pre-trained models, fine-tuning capabilities, and explainability features.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No pattern recognition code in `src/ml/patterns/`
- No pre-trained model integrations
- No inference pipelines
- No explainability tools

**Why This is Important**:
- Core ML capability for automated pattern detection
- Enables image classification, text analysis, anomaly detection
- Differentiator for VERSATIL ML platform
- Foundation for AutoML features

**Not Critical Path**: Basic ML workflows function without this, but pattern recognition is a key value-add

## Requirements

### Pattern Types (4 Categories)

#### 1. Vision Patterns (ViT - Vision Transformer)
**Use Cases**:
- Image classification (objects, scenes)
- Object detection
- Image segmentation
- Visual similarity search

**Models**:
- ViT-Base (google/vit-base-patch16-224)
- ViT-Large (google/vit-large-patch16-224)
- CLIP (openai/clip-vit-base-patch32)

**Features**:
- Pre-trained model inference
- Fine-tuning on custom datasets
- Attention map visualization (explainability)
- Feature extraction for similarity search

#### 2. Text Patterns (BERT/GPT)
**Use Cases**:
- Sentiment analysis
- Named entity recognition (NER)
- Text classification
- Semantic search

**Models**:
- BERT (bert-base-uncased)
- RoBERTa (roberta-base)
- GPT-2 (gpt2)

**Features**:
- Pre-trained inference
- Fine-tuning on labeled data
- Token-level attention scores
- Embedding extraction

#### 3. Time-Series Patterns (LSTM/Transformer)
**Use Cases**:
- Forecasting (sales, stock prices)
- Anomaly detection (system metrics)
- Sequence classification
- Pattern matching

**Models**:
- LSTM networks (custom implementation)
- Temporal Fusion Transformer
- Prophet (Facebook)

**Features**:
- Multi-step ahead forecasting
- Seasonality decomposition
- Trend analysis
- Confidence intervals

#### 4. Anomaly Detection
**Use Cases**:
- Fraud detection
- System monitoring
- Quality control
- Outlier identification

**Algorithms**:
- Isolation Forest
- One-Class SVM
- Autoencoder-based
- DBSCAN clustering

**Features**:
- Unsupervised detection
- Anomaly scoring
- Threshold tuning
- Explanation (feature contributions)

## Acceptance Criteria

- [ ] 4 pattern recognition modules implemented (vision, text, time-series, anomaly)
- [ ] Pre-trained model loading and inference
- [ ] Fine-tuning pipelines for all pattern types
- [ ] Explainability features (attention maps, SHAP values)
- [ ] Feature extraction for embeddings
- [ ] Batch inference support
- [ ] Model registry integration (save/load fine-tuned models)
- [ ] Unit tests for all modules (85%+ coverage)
- [ ] Benchmark results (accuracy, latency)
- [ ] Documentation with examples

## Technical Approach

### Language: Python

**File Structure**:
```
src/ml/patterns/
├── __init__.py
├── vision/
│   ├── __init__.py
│   ├── vit_classifier.py
│   ├── clip_embeddings.py
│   └── attention_maps.py
├── text/
│   ├── __init__.py
│   ├── bert_classifier.py
│   ├── gpt_generator.py
│   └── ner_tagger.py
├── time_series/
│   ├── __init__.py
│   ├── lstm_forecaster.py
│   ├── prophet_forecaster.py
│   └── trend_analyzer.py
├── anomaly/
│   ├── __init__.py
│   ├── isolation_forest.py
│   ├── autoencoder.py
│   └── dbscan_detector.py
├── base.py (abstract base classes)
├── explainability.py (SHAP, LIME)
└── utils.py

tests/ml/patterns/
├── test_vision.py
├── test_text.py
├── test_time_series.py
└── test_anomaly.py
```

### Vision Pattern Implementation

```python
# src/ml/patterns/vision/vit_classifier.py
from transformers import ViTForImageClassification, ViTImageProcessor
from PIL import Image
import torch
from typing import List, Dict, Any
import numpy as np

class ViTClassifier:
    """Vision Transformer for image classification."""

    def __init__(
        self,
        model_name: str = 'google/vit-base-patch16-224',
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.model_name = model_name
        self.device = device

        self.processor = ViTImageProcessor.from_pretrained(model_name)
        self.model = ViTForImageClassification.from_pretrained(model_name)
        self.model.to(device)
        self.model.eval()

    def predict(self, image_path: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Predict image class with top-k results.

        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return

        Returns:
            [
                {'label': 'dog', 'score': 0.95},
                {'label': 'cat', 'score': 0.03},
                ...
            ]
        """
        image = Image.open(image_path).convert('RGB')
        inputs = self.processor(images=image, return_tensors='pt')
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0]

        top_k_indices = probs.topk(top_k).indices.cpu().numpy()
        top_k_probs = probs.topk(top_k).values.cpu().numpy()

        results = []
        for idx, prob in zip(top_k_indices, top_k_probs):
            label = self.model.config.id2label[idx]
            results.append({'label': label, 'score': float(prob)})

        return results

    def extract_features(self, image_path: str) -> np.ndarray:
        """Extract feature embeddings (768-dim for ViT-Base)."""
        image = Image.open(image_path).convert('RGB')
        inputs = self.processor(images=image, return_tensors='pt')
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs, output_hidden_states=True)
            # Use [CLS] token from last hidden state
            features = outputs.hidden_states[-1][:, 0, :].cpu().numpy()

        return features[0]  # (768,)

    def get_attention_map(self, image_path: str, layer: int = -1) -> np.ndarray:
        """
        Extract attention map for explainability.

        Args:
            image_path: Path to image
            layer: Which transformer layer (-1 for last)

        Returns:
            Attention map (14x14 for ViT-Base with patch size 16)
        """
        image = Image.open(image_path).convert('RGB')
        inputs = self.processor(images=image, return_tensors='pt')
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
            # Average attention across heads
            attention = outputs.attentions[layer].mean(dim=1)[0].cpu().numpy()

        # attention shape: (num_patches + 1, num_patches + 1)
        # Remove [CLS] token and reshape to spatial grid
        attention = attention[0, 1:]  # Attention from [CLS] to patches
        grid_size = int(np.sqrt(attention.shape[0]))
        attention_map = attention.reshape(grid_size, grid_size)

        return attention_map
```

### Text Pattern Implementation

```python
# src/ml/patterns/text/bert_classifier.py
from transformers import BertForSequenceClassification, BertTokenizer
import torch
from typing import List, Dict, Any

class BERTClassifier:
    """BERT for text classification (sentiment, topic, etc.)."""

    def __init__(
        self,
        model_name: str = 'bert-base-uncased',
        num_labels: int = 2,  # Binary classification by default
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.model_name = model_name
        self.device = device

        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        )
        self.model.to(device)
        self.model.eval()

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Classify text.

        Returns:
            {
                'label': 0,  # Class index
                'score': 0.95,  # Confidence
                'probabilities': [0.05, 0.95]  # All class probabilities
            }
        """
        inputs = self.tokenizer(
            text,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        label = int(probs.argmax())
        score = float(probs[label])

        return {
            'label': label,
            'score': score,
            'probabilities': probs.tolist()
        }

    def get_attention_scores(self, text: str) -> Dict[str, Any]:
        """
        Get token-level attention scores for explainability.

        Returns:
            {
                'tokens': ['hello', 'world'],
                'attention': [0.6, 0.4]  # Importance scores
            }
        """
        inputs = self.tokenizer(
            text,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
            # Average attention across layers and heads
            attentions = outputs.attentions  # Tuple of (batch, heads, seq, seq)
            avg_attention = torch.stack(attentions).mean(dim=[0, 1])  # (seq, seq)
            # Attention to [CLS] token
            cls_attention = avg_attention[0].cpu().numpy()

        tokens = self.tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])

        return {
            'tokens': tokens,
            'attention': cls_attention.tolist()
        }
```

### Time-Series Pattern Implementation

```python
# src/ml/patterns/time_series/lstm_forecaster.py
import torch
import torch.nn as nn
import numpy as np
from typing import Tuple

class LSTMForecaster(nn.Module):
    """LSTM for time-series forecasting."""

    def __init__(
        self,
        input_size: int = 1,
        hidden_size: int = 64,
        num_layers: int = 2,
        output_size: int = 1,
        dropout: float = 0.2
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, sequence_length, input_size)
        lstm_out, _ = self.lstm(x)
        # Use last timestep output
        last_output = lstm_out[:, -1, :]
        predictions = self.fc(last_output)
        return predictions

    def predict(
        self,
        sequence: np.ndarray,
        steps_ahead: int = 1
    ) -> np.ndarray:
        """
        Multi-step ahead forecasting.

        Args:
            sequence: Historical data (seq_len, features)
            steps_ahead: Number of steps to forecast

        Returns:
            Predictions (steps_ahead,)
        """
        self.eval()
        predictions = []

        # Start with historical sequence
        current_seq = torch.from_numpy(sequence).float().unsqueeze(0)

        with torch.no_grad():
            for _ in range(steps_ahead):
                pred = self.forward(current_seq)
                predictions.append(pred.item())

                # Update sequence (sliding window)
                new_point = pred.unsqueeze(1)  # (1, 1, 1)
                current_seq = torch.cat([current_seq[:, 1:, :], new_point], dim=1)

        return np.array(predictions)
```

### Anomaly Detection Implementation

```python
# src/ml/patterns/anomaly/isolation_forest.py
from sklearn.ensemble import IsolationForest
import numpy as np
from typing import Dict, Any, List

class IsolationForestDetector:
    """Isolation Forest for anomaly detection."""

    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100,
        max_samples: int = 256,
        random_state: int = 42
    ):
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state
        )
        self.fitted = False

    def fit(self, X: np.ndarray):
        """Fit on training data."""
        self.model.fit(X)
        self.fitted = True

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Detect anomalies.

        Returns:
            {
                'predictions': [-1, 1, 1, -1],  # -1 = anomaly, 1 = normal
                'scores': [-0.2, 0.5, 0.4, -0.3],  # Anomaly scores
                'anomaly_indices': [0, 3]  # Indices of anomalies
            }
        """
        if not self.fitted:
            raise ValueError("Model must be fitted before prediction")

        predictions = self.model.predict(X)
        scores = self.model.score_samples(X)
        anomaly_indices = np.where(predictions == -1)[0].tolist()

        return {
            'predictions': predictions.tolist(),
            'scores': scores.tolist(),
            'anomaly_indices': anomaly_indices,
            'anomaly_count': len(anomaly_indices)
        }
```

## Dependencies

**Required Libraries** (Python):
```bash
pip install \
  transformers>=4.35.0 \
  torch>=2.1.0 \
  torchvision>=0.16.0 \
  scikit-learn>=1.3.0 \
  prophet>=1.1.0 \
  shap>=0.43.0 \
  pillow>=10.0.0 \
  numpy>=1.24.0 \
  pandas>=2.0.0
```

**Blocks**: None (advanced feature)

**Depends On**:
- 016-feature-engineering-pipeline.md (needs preprocessing)
- 018-vertex-ai-integration.md (for model training)

**Parallel with**: 022 (Dataset Tools)

## Testing Requirements

### Unit Tests
```python
# tests/ml/patterns/test_vision.py
def test_vit_classifier_predict():
    classifier = ViTClassifier()
    results = classifier.predict('test_images/dog.jpg', top_k=3)

    assert len(results) == 3
    assert all('label' in r and 'score' in r for r in results)
    assert sum(r['score'] for r in results) <= 1.0

def test_vit_feature_extraction():
    classifier = ViTClassifier()
    features = classifier.extract_features('test_images/dog.jpg')

    assert features.shape == (768,)  # ViT-Base embedding size
```

**Target Coverage**: 85%+

## Performance Requirements

| Operation | Target | Method |
|-----------|--------|--------|
| ViT inference | <200ms per image | GPU acceleration, batching |
| BERT inference | <100ms per text | GPU, model quantization |
| LSTM forecasting | <50ms (100 steps) | CPU sufficient |
| Anomaly detection | <10ms (1000 points) | Scikit-learn optimized |

## Files to Create

1. `src/ml/patterns/vision/vit_classifier.py`
2. `src/ml/patterns/vision/clip_embeddings.py`
3. `src/ml/patterns/text/bert_classifier.py`
4. `src/ml/patterns/text/gpt_generator.py`
5. `src/ml/patterns/time_series/lstm_forecaster.py`
6. `src/ml/patterns/time_series/prophet_forecaster.py`
7. `src/ml/patterns/anomaly/isolation_forest.py`
8. `src/ml/patterns/anomaly/autoencoder.py`
9. `src/ml/patterns/explainability.py`
10. `tests/ml/patterns/test_*.py` (8+ files)
11. `docs/pattern-recognition.md`

## Success Metrics

- [ ] All 4 pattern types implemented
- [ ] Pre-trained models working
- [ ] Explainability features functional
- [ ] 85%+ test coverage
- [ ] Performance targets met
- [ ] Documentation complete

## Related Todos

- **Blocks**: None
- **Part of**: Wave 4 (ML Capabilities)
- **Depends on**: Todos 016, 018

---

**Agent**: Dr.AI-ML
**Auto-Activate**: YES (ML/AI expertise required)
**Estimated**: 80 hours
**Priority**: P2 (Advanced ML feature)
