# Dataset Building Tools - ML Workflow Automation

**Status**: Pending
**Priority**: P2 (Important - Data Pipeline)
**Assigned**: Dr.AI-ML
**Estimated**: 40h
**Wave**: 4 (ML Capabilities)
**Created**: 2025-10-29

## Mission

Build comprehensive dataset management tools supporting data ingestion, auto-labeling, augmentation, quality validation, and versioning with GCS integration and dataset profiling.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No dataset tools in `src/ml/dataset/`
- No ingestion pipelines
- No labeling automation
- No validation tools

**Why This is Important**:
- High-quality datasets are critical for ML success
- Manual labeling is expensive and slow (auto-labeling saves 70% time)
- Data quality issues cause 80% of ML failures
- Dataset versioning ensures reproducibility

**Not Critical Path**: Manual dataset preparation works, but automation dramatically improves velocity

## Requirements

### Dataset Tools (4 Categories)

#### 1. Data Ingestion Pipelines
**Sources**:
- Local files (CSV, JSON, Parquet, images, text)
- GCS buckets (batch import)
- APIs (REST, GraphQL)
- Databases (PostgreSQL, Firestore)

**Features**:
- Parallel upload to GCS (10 workers)
- Progress tracking
- Resume on failure
- Schema detection
- Format conversion

#### 2. Auto-Labeling Tools
**Methods**:
- Pre-trained model predictions (zero-shot)
- Active learning (label uncertain samples)
- Weak supervision (label aggregation)
- Semi-supervised learning

**Supported Tasks**:
- Image classification (ViT/CLIP)
- Text classification (BERT)
- Named Entity Recognition (NER)
- Object detection (YOLO)

**Features**:
- Confidence thresholds
- Human-in-the-loop review
- Label quality metrics

#### 3. Augmentation Pipelines
**Image Augmentation**:
- Geometric (rotate, flip, crop, zoom)
- Color (brightness, contrast, saturation)
- Noise (Gaussian, salt-and-pepper)
- Advanced (CutMix, MixUp)

**Text Augmentation**:
- Synonym replacement
- Back-translation
- Paraphrasing (T5)
- Entity replacement

**Tabular Augmentation**:
- SMOTE (Synthetic Minority Oversampling)
- ADASYN (Adaptive Synthetic Sampling)
- Gaussian noise injection

**Features**:
- Configurable pipelines
- Deterministic (seeded) augmentation
- Quality preservation

#### 4. Quality Validation
**Checks**:
- Missing values (threshold: <5%)
- Duplicates (hash-based detection)
- Outliers (Z-score, IQR methods)
- Class imbalance (warn if ratio >10:1)
- Label consistency (multi-rater agreement)
- Schema validation (expected columns/types)

**Features**:
- Automated quality reports (JSON)
- Warnings and blockers
- Suggestions for remediation

## Acceptance Criteria

- [ ] 4 tool categories implemented (ingestion, labeling, augmentation, validation)
- [ ] Support for 3 data modalities (image, text, tabular)
- [ ] GCS integration for storage
- [ ] Progress tracking for long-running operations
- [ ] Quality report generation
- [ ] Unit tests for all tools (85%+ coverage)
- [ ] Integration tests with sample datasets
- [ ] Documentation with examples

## Technical Approach

### Language: Python

**File Structure**:
```
src/ml/dataset/
├── __init__.py
├── ingestion/
│   ├── __init__.py
│   ├── file_ingestor.py
│   ├── gcs_ingestor.py
│   ├── api_ingestor.py
│   └── db_ingestor.py
├── labeling/
│   ├── __init__.py
│   ├── auto_labeler.py
│   ├── active_learner.py
│   └── label_aggregator.py
├── augmentation/
│   ├── __init__.py
│   ├── image_augmenter.py
│   ├── text_augmenter.py
│   └── tabular_augmenter.py
├── validation/
│   ├── __init__.py
│   ├── quality_checker.py
│   ├── schema_validator.py
│   └── outlier_detector.py
├── versioning/
│   ├── __init__.py
│   └── dataset_version_manager.py
└── utils.py

tests/ml/dataset/
├── test_ingestion.py
├── test_labeling.py
├── test_augmentation.py
└── test_validation.py
```

### Data Ingestion Implementation

```python
# src/ml/dataset/ingestion/file_ingestor.py
from pathlib import Path
from google.cloud import storage
import pandas as pd
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

logger = logging.getLogger(__name__)

class FileIngestor:
    """Ingest local files to GCS with parallel uploads."""

    def __init__(
        self,
        project_id: str,
        bucket_name: str,
        max_workers: int = 10
    ):
        self.project_id = project_id
        self.bucket_name = bucket_name
        self.max_workers = max_workers
        self.storage_client = storage.Client(project=project_id)
        self.bucket = self.storage_client.bucket(bucket_name)

    def ingest_directory(
        self,
        local_dir: str,
        gcs_prefix: str,
        file_pattern: str = '*',
        progress_callback: callable = None
    ) -> Dict[str, Any]:
        """
        Upload directory to GCS with parallel workers.

        Args:
            local_dir: Local directory path
            gcs_prefix: GCS path prefix (e.g., 'datasets/images/')
            file_pattern: Glob pattern (*.jpg, *.csv, etc.)
            progress_callback: Function called with (completed, total)

        Returns:
            {
                'files_uploaded': 150,
                'total_bytes': 1024000,
                'errors': []
            }
        """
        local_path = Path(local_dir)
        files = list(local_path.glob(f'**/{file_pattern}'))

        logger.info(f"Found {len(files)} files to upload")

        uploaded = 0
        errors = []
        total_bytes = 0

        def upload_file(file_path: Path):
            nonlocal uploaded, total_bytes
            try:
                relative_path = file_path.relative_to(local_path)
                gcs_path = f"{gcs_prefix}/{relative_path}"

                blob = self.bucket.blob(gcs_path)
                blob.upload_from_filename(str(file_path))

                file_size = file_path.stat().st_size
                uploaded += 1
                total_bytes += file_size

                if progress_callback:
                    progress_callback(uploaded, len(files))

                return {'status': 'success', 'file': str(file_path)}
            except Exception as e:
                logger.error(f"Error uploading {file_path}: {e}")
                errors.append({'file': str(file_path), 'error': str(e)})
                return {'status': 'error', 'file': str(file_path)}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = [executor.submit(upload_file, f) for f in files]
            for future in as_completed(futures):
                future.result()

        return {
            'files_uploaded': uploaded,
            'total_bytes': total_bytes,
            'errors': errors
        }

    def ingest_csv(
        self,
        csv_path: str,
        gcs_path: str,
        convert_to_parquet: bool = True
    ) -> str:
        """
        Upload CSV to GCS, optionally converting to Parquet.

        Returns:
            GCS path of uploaded file
        """
        df = pd.read_csv(csv_path)

        if convert_to_parquet:
            # Convert to Parquet for better performance
            parquet_path = csv_path.replace('.csv', '.parquet')
            df.to_parquet(parquet_path, index=False)
            upload_path = parquet_path
            gcs_path = gcs_path.replace('.csv', '.parquet')
        else:
            upload_path = csv_path

        blob = self.bucket.blob(gcs_path)
        blob.upload_from_filename(upload_path)

        return f"gs://{self.bucket_name}/{gcs_path}"
```

### Auto-Labeling Implementation

```python
# src/ml/dataset/labeling/auto_labeler.py
from transformers import pipeline
from typing import List, Dict, Any
import numpy as np

class AutoLabeler:
    """Automatic labeling using pre-trained models."""

    def __init__(self, task: str = 'image-classification'):
        """
        Args:
            task: 'image-classification', 'text-classification', 'ner', etc.
        """
        self.task = task
        self.pipeline = pipeline(task)

    def label_batch(
        self,
        inputs: List[str],  # File paths or text
        confidence_threshold: float = 0.8
    ) -> List[Dict[str, Any]]:
        """
        Label batch of samples with confidence filtering.

        Returns:
            [
                {
                    'input': 'image.jpg',
                    'label': 'dog',
                    'confidence': 0.95,
                    'status': 'auto_labeled'  # or 'needs_review'
                },
                ...
            ]
        """
        results = []

        predictions = self.pipeline(inputs)

        for input_item, pred in zip(inputs, predictions):
            if isinstance(pred, list):
                pred = pred[0]  # Top prediction

            confidence = pred['score']
            label = pred['label']

            status = 'auto_labeled' if confidence >= confidence_threshold else 'needs_review'

            results.append({
                'input': input_item,
                'label': label,
                'confidence': float(confidence),
                'status': status
            })

        return results

    def get_uncertain_samples(
        self,
        inputs: List[str],
        top_k: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Find most uncertain samples for active learning.

        Uses entropy as uncertainty measure.

        Returns:
            Top-k most uncertain samples
        """
        predictions = self.pipeline(inputs, top_k=5)  # Get top 5 predictions

        uncertainties = []
        for input_item, pred in zip(inputs, predictions):
            # Calculate entropy
            probs = np.array([p['score'] for p in pred])
            entropy = -np.sum(probs * np.log(probs + 1e-10))

            uncertainties.append({
                'input': input_item,
                'entropy': float(entropy),
                'top_predictions': pred
            })

        # Sort by entropy (higher = more uncertain)
        uncertainties.sort(key=lambda x: x['entropy'], reverse=True)

        return uncertainties[:top_k]
```

### Augmentation Implementation

```python
# src/ml/dataset/augmentation/image_augmenter.py
import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image
import numpy as np
from typing import List, Dict, Any

class ImageAugmenter:
    """Image augmentation pipeline."""

    def __init__(self, augmentation_config: Dict[str, Any]):
        """
        Args:
            augmentation_config: {
                'horizontal_flip': 0.5,
                'rotation_limit': 15,
                'brightness_limit': 0.2,
                'blur_limit': 3
            }
        """
        transforms = []

        if augmentation_config.get('horizontal_flip'):
            transforms.append(A.HorizontalFlip(p=augmentation_config['horizontal_flip']))

        if augmentation_config.get('rotation_limit'):
            transforms.append(A.Rotate(
                limit=augmentation_config['rotation_limit'],
                p=0.5
            ))

        if augmentation_config.get('brightness_limit'):
            transforms.append(A.RandomBrightnessContrast(
                brightness_limit=augmentation_config['brightness_limit'],
                p=0.3
            ))

        if augmentation_config.get('blur_limit'):
            transforms.append(A.Blur(
                blur_limit=augmentation_config['blur_limit'],
                p=0.3
            ))

        self.transform = A.Compose(transforms)

    def augment_image(self, image_path: str, num_augmentations: int = 5) -> List[np.ndarray]:
        """
        Generate augmented versions of image.

        Args:
            image_path: Path to image
            num_augmentations: Number of augmented versions

        Returns:
            List of augmented images (numpy arrays)
        """
        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)

        augmented = []
        for _ in range(num_augmentations):
            transformed = self.transform(image=image_np)
            augmented.append(transformed['image'])

        return augmented
```

### Quality Validation Implementation

```python
# src/ml/dataset/validation/quality_checker.py
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from scipy import stats

class QualityChecker:
    """Dataset quality validation."""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {
            'missing_threshold': 0.05,  # 5% max missing values
            'imbalance_ratio_threshold': 10.0,  # 10:1 class imbalance
            'outlier_z_score': 3.0
        }

    def validate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Run all quality checks.

        Returns:
            {
                'status': 'pass' | 'warning' | 'fail',
                'checks': {
                    'missing_values': {...},
                    'duplicates': {...},
                    'outliers': {...},
                    'class_imbalance': {...}
                },
                'recommendations': [...]
            }
        """
        checks = {}
        recommendations = []
        overall_status = 'pass'

        # Check 1: Missing values
        missing_check = self._check_missing_values(df)
        checks['missing_values'] = missing_check
        if missing_check['status'] == 'fail':
            overall_status = 'fail'
            recommendations.append(missing_check['recommendation'])

        # Check 2: Duplicates
        duplicate_check = self._check_duplicates(df)
        checks['duplicates'] = duplicate_check
        if duplicate_check['count'] > 0:
            recommendations.append(duplicate_check['recommendation'])

        # Check 3: Outliers
        outlier_check = self._check_outliers(df)
        checks['outliers'] = outlier_check

        # Check 4: Class imbalance (if 'label' column exists)
        if 'label' in df.columns:
            imbalance_check = self._check_class_imbalance(df)
            checks['class_imbalance'] = imbalance_check
            if imbalance_check['status'] == 'warning':
                recommendations.append(imbalance_check['recommendation'])

        return {
            'status': overall_status,
            'checks': checks,
            'recommendations': recommendations
        }

    def _check_missing_values(self, df: pd.DataFrame) -> Dict[str, Any]:
        missing_pct = df.isnull().sum() / len(df)
        max_missing = missing_pct.max()

        status = 'pass' if max_missing < self.config['missing_threshold'] else 'fail'

        return {
            'status': status,
            'max_missing_percentage': float(max_missing),
            'columns_with_missing': missing_pct[missing_pct > 0].to_dict(),
            'recommendation': f"Impute or remove columns with >{self.config['missing_threshold']*100}% missing"
        }

    def _check_duplicates(self, df: pd.DataFrame) -> Dict[str, Any]:
        duplicate_count = df.duplicated().sum()

        return {
            'count': int(duplicate_count),
            'percentage': float(duplicate_count / len(df)),
            'recommendation': 'Remove duplicate rows' if duplicate_count > 0 else None
        }

    def _check_outliers(self, df: pd.DataFrame) -> Dict[str, Any]:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        outliers_by_col = {}

        for col in numeric_cols:
            z_scores = np.abs(stats.zscore(df[col].dropna()))
            outlier_count = (z_scores > self.config['outlier_z_score']).sum()
            outliers_by_col[col] = int(outlier_count)

        return {
            'outliers_by_column': outliers_by_col,
            'total_outliers': sum(outliers_by_col.values())
        }

    def _check_class_imbalance(self, df: pd.DataFrame) -> Dict[str, Any]:
        value_counts = df['label'].value_counts()
        ratio = value_counts.max() / value_counts.min()

        status = 'pass' if ratio < self.config['imbalance_ratio_threshold'] else 'warning'

        return {
            'status': status,
            'class_distribution': value_counts.to_dict(),
            'imbalance_ratio': float(ratio),
            'recommendation': 'Consider SMOTE or class weighting' if status == 'warning' else None
        }
```

## Dependencies

**Required Libraries** (Python):
```bash
pip install \
  pandas>=2.0.0 \
  numpy>=1.24.0 \
  google-cloud-storage>=2.10.0 \
  albumentations>=1.3.0 \
  transformers>=4.35.0 \
  scikit-learn>=1.3.0 \
  scipy>=1.11.0 \
  pillow>=10.0.0 \
  pyarrow>=14.0.0  # For Parquet
```

**Blocks**: None

**Depends On**:
- 015-gcp-infrastructure-setup.md (needs GCS buckets)
- 016-feature-engineering-pipeline.md (uses processors)

**Parallel with**: 021 (Pattern Recognition)

## Testing Requirements

### Unit Tests
```python
# tests/ml/dataset/test_validation.py
def test_quality_checker_missing_values():
    df = pd.DataFrame({
        'col1': [1, 2, None, 4, 5],
        'col2': [1, 2, 3, 4, 5]
    })

    checker = QualityChecker({'missing_threshold': 0.1})
    result = checker.validate(df)

    assert result['checks']['missing_values']['max_missing_percentage'] == 0.2
    assert result['status'] == 'fail'
```

**Target Coverage**: 85%+

## Performance Requirements

| Operation | Target | Method |
|-----------|--------|--------|
| File ingestion | >10 MB/s | Parallel uploads (10 workers) |
| Auto-labeling | >50 images/sec | GPU, batching |
| Augmentation | >100 images/sec | Albumentations (C++ backend) |
| Quality validation | <5 sec (10K rows) | Vectorized operations |

## Files to Create

1. `src/ml/dataset/ingestion/file_ingestor.py`
2. `src/ml/dataset/ingestion/gcs_ingestor.py`
3. `src/ml/dataset/labeling/auto_labeler.py`
4. `src/ml/dataset/labeling/active_learner.py`
5. `src/ml/dataset/augmentation/image_augmenter.py`
6. `src/ml/dataset/augmentation/text_augmenter.py`
7. `src/ml/dataset/validation/quality_checker.py`
8. `tests/ml/dataset/test_*.py` (6+ files)
9. `docs/dataset-tools.md`

## Success Metrics

- [ ] All 4 tool categories implemented
- [ ] GCS integration working
- [ ] 85%+ test coverage
- [ ] Performance targets met
- [ ] Documentation complete

## Related Todos

- **Blocks**: None
- **Part of**: Wave 4 (ML Capabilities)
- **Depends on**: Todos 015, 016

---

**Agent**: Dr.AI-ML
**Auto-Activate**: YES (ML/AI expertise required)
**Estimated**: 40 hours
**Priority**: P2 (Data pipeline enhancement)
