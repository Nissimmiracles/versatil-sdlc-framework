"""
Image Feature Engineering Processor
Handles preprocessing and augmentation for image datasets
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
import tensorflow as tf
from PIL import Image
import io


@dataclass
class ImageProcessorConfig:
    """Configuration for image processing"""
    target_size: Tuple[int, int] = (224, 224)
    normalization: str = "standard"  # standard, minmax, imagenet
    augmentation: bool = True
    augmentation_strength: float = 0.5  # 0.0 to 1.0


class ImageProcessor:
    """Image feature engineering processor"""

    def __init__(self, config: ImageProcessorConfig):
        self.config = config
        self.augmentation_layer = self._build_augmentation_pipeline() if config.augmentation else None

    def _build_augmentation_pipeline(self) -> tf.keras.Sequential:
        """Build data augmentation pipeline"""
        strength = self.config.augmentation_strength

        layers = [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.1 * strength),
            tf.keras.layers.RandomZoom(0.1 * strength),
            tf.keras.layers.RandomContrast(0.2 * strength),
            tf.keras.layers.RandomBrightness(0.2 * strength),
        ]

        return tf.keras.Sequential(layers)

    def preprocess(
        self,
        image: Union[np.ndarray, bytes, str],
        apply_augmentation: bool = False
    ) -> np.ndarray:
        """
        Preprocess single image

        Args:
            image: Input image (numpy array, bytes, or file path)
            apply_augmentation: Whether to apply augmentation

        Returns:
            Preprocessed image as numpy array
        """
        # Load image if needed
        if isinstance(image, str):
            img = Image.open(image).convert('RGB')
            image = np.array(img)
        elif isinstance(image, bytes):
            img = Image.open(io.BytesIO(image)).convert('RGB')
            image = np.array(img)

        # Resize
        image = tf.image.resize(image, self.config.target_size)

        # Normalize
        image = self._normalize(image)

        # Apply augmentation
        if apply_augmentation and self.augmentation_layer is not None:
            image = self.augmentation_layer(tf.expand_dims(image, 0), training=True)[0]

        return image.numpy()

    def preprocess_batch(
        self,
        images: List[Union[np.ndarray, bytes, str]],
        apply_augmentation: bool = False
    ) -> np.ndarray:
        """
        Preprocess batch of images

        Args:
            images: List of input images
            apply_augmentation: Whether to apply augmentation

        Returns:
            Batch of preprocessed images
        """
        processed = [self.preprocess(img, apply_augmentation) for img in images]
        return np.array(processed)

    def _normalize(self, image: tf.Tensor) -> tf.Tensor:
        """Normalize image based on configuration"""
        if self.config.normalization == "standard":
            # Standardize to mean=0, std=1
            mean = tf.reduce_mean(image)
            std = tf.math.reduce_std(image)
            return (image - mean) / (std + 1e-7)

        elif self.config.normalization == "minmax":
            # Scale to [0, 1]
            min_val = tf.reduce_min(image)
            max_val = tf.reduce_max(image)
            return (image - min_val) / (max_val - min_val + 1e-7)

        elif self.config.normalization == "imagenet":
            # ImageNet mean and std
            mean = tf.constant([0.485, 0.456, 0.406])
            std = tf.constant([0.229, 0.224, 0.225])
            return (image / 255.0 - mean) / std

        else:
            raise ValueError(f"Unknown normalization: {self.config.normalization}")

    def extract_features(
        self,
        image: Union[np.ndarray, bytes, str],
        model: Optional[tf.keras.Model] = None
    ) -> np.ndarray:
        """
        Extract features using pre-trained model

        Args:
            image: Input image
            model: Pre-trained model (default: ResNet50)

        Returns:
            Feature vector
        """
        if model is None:
            # Use ResNet50 by default
            model = tf.keras.applications.ResNet50(
                weights='imagenet',
                include_top=False,
                pooling='avg'
            )

        # Preprocess
        processed = self.preprocess(image)

        # Extract features
        features = model.predict(tf.expand_dims(processed, 0), verbose=0)[0]

        return features

    def augment(self, image: np.ndarray, n_augmentations: int = 5) -> List[np.ndarray]:
        """
        Generate multiple augmented versions

        Args:
            image: Input image
            n_augmentations: Number of augmented versions to generate

        Returns:
            List of augmented images
        """
        if self.augmentation_layer is None:
            raise ValueError("Augmentation not enabled")

        augmented = []
        for _ in range(n_augmentations):
            aug_img = self.augmentation_layer(
                tf.expand_dims(image, 0),
                training=True
            )[0]
            augmented.append(aug_img.numpy())

        return augmented

    def to_vertex_ai_format(
        self,
        images: List[np.ndarray],
        labels: Optional[List[int]] = None
    ) -> Dict:
        """
        Convert to Vertex AI training format

        Args:
            images: List of preprocessed images
            labels: Optional list of labels

        Returns:
            Dictionary in Vertex AI format
        """
        data = {
            "instances": [{"image": img.tolist()} for img in images]
        }

        if labels is not None:
            for i, label in enumerate(labels):
                data["instances"][i]["label"] = label

        return data


# Utility functions

def create_tfrecord_dataset(
    image_paths: List[str],
    labels: List[int],
    output_path: str,
    processor: ImageProcessor
) -> None:
    """
    Create TFRecord dataset for Vertex AI

    Args:
        image_paths: List of image file paths
        labels: List of corresponding labels
        output_path: Output TFRecord file path
        processor: Image processor instance
    """
    with tf.io.TFRecordWriter(output_path) as writer:
        for img_path, label in zip(image_paths, labels):
            # Preprocess image
            image = processor.preprocess(img_path)

            # Create feature dict
            feature = {
                'image': tf.train.Feature(
                    float_list=tf.train.FloatList(value=image.flatten())
                ),
                'label': tf.train.Feature(
                    int64_list=tf.train.Int64List(value=[label])
                ),
                'shape': tf.train.Feature(
                    int64_list=tf.train.Int64List(value=image.shape)
                ),
            }

            # Create example and write
            example = tf.train.Example(features=tf.train.Features(feature=feature))
            writer.write(example.SerializeToString())


def load_tfrecord_dataset(
    file_path: str,
    batch_size: int = 32,
    shuffle: bool = True
) -> tf.data.Dataset:
    """
    Load TFRecord dataset

    Args:
        file_path: TFRecord file path
        batch_size: Batch size
        shuffle: Whether to shuffle

    Returns:
        TensorFlow dataset
    """
    def parse_example(example_proto):
        feature_description = {
            'image': tf.io.FixedLenFeature([], tf.string),
            'label': tf.io.FixedLenFeature([], tf.int64),
            'shape': tf.io.FixedLenFeature([3], tf.int64),
        }
        parsed = tf.io.parse_single_example(example_proto, feature_description)

        # Decode image
        image = tf.io.decode_raw(parsed['image'], tf.float32)
        image = tf.reshape(image, parsed['shape'])

        label = parsed['label']

        return image, label

    dataset = tf.data.TFRecordDataset(file_path)
    dataset = dataset.map(parse_example)

    if shuffle:
        dataset = dataset.shuffle(buffer_size=1000)

    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)

    return dataset
