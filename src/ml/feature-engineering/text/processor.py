"""
Text Feature Engineering Processor
Handles tokenization, embeddings, and text preprocessing
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
import tensorflow as tf
from transformers import AutoTokenizer, AutoModel
import torch
import re


@dataclass
class TextProcessorConfig:
    """Configuration for text processing"""
    max_length: int = 512
    tokenizer_model: str = "bert-base-uncased"
    embedding_model: str = "bert-base-uncased"
    lowercase: bool = True
    remove_special_chars: bool = True
    remove_stopwords: bool = False
    padding: str = "max_length"  # max_length, longest, do_not_pad
    truncation: bool = True


class TextProcessor:
    """Text feature engineering processor"""

    def __init__(self, config: TextProcessorConfig):
        self.config = config
        self.tokenizer = AutoTokenizer.from_pretrained(config.tokenizer_model)
        self.embedding_model = None  # Lazy load

    def preprocess(self, text: str) -> str:
        """
        Preprocess single text

        Args:
            text: Input text

        Returns:
            Preprocessed text
        """
        # Lowercase
        if self.config.lowercase:
            text = text.lower()

        # Remove special characters
        if self.config.remove_special_chars:
            text = re.sub(r'[^a-zA-Z0-9\s]', '', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        # Remove stopwords (basic implementation)
        if self.config.remove_stopwords:
            stopwords = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
            words = text.split()
            text = ' '.join([w for w in words if w not in stopwords])

        return text

    def tokenize(
        self,
        texts: Union[str, List[str]],
        return_tensors: Optional[str] = "pt"
    ) -> Dict:
        """
        Tokenize text(s)

        Args:
            texts: Single text or list of texts
            return_tensors: Return format (pt, tf, np, or None)

        Returns:
            Tokenized outputs (input_ids, attention_mask, etc.)
        """
        if isinstance(texts, str):
            texts = [texts]

        # Preprocess
        texts = [self.preprocess(t) for t in texts]

        # Tokenize
        encoded = self.tokenizer(
            texts,
            max_length=self.config.max_length,
            padding=self.config.padding,
            truncation=self.config.truncation,
            return_tensors=return_tensors
        )

        return encoded

    def get_embeddings(
        self,
        texts: Union[str, List[str]],
        pooling: str = "mean"
    ) -> np.ndarray:
        """
        Get BERT embeddings for text(s)

        Args:
            texts: Single text or list of texts
            pooling: Pooling strategy (mean, max, cls)

        Returns:
            Embeddings as numpy array
        """
        # Lazy load model
        if self.embedding_model is None:
            self.embedding_model = AutoModel.from_pretrained(self.config.embedding_model)
            self.embedding_model.eval()

        # Tokenize
        encoded = self.tokenize(texts, return_tensors="pt")

        # Get embeddings
        with torch.no_grad():
            outputs = self.embedding_model(**encoded)
            last_hidden_state = outputs.last_hidden_state  # (batch, seq_len, hidden_size)

        # Apply pooling
        if pooling == "mean":
            # Mean of all tokens (excluding padding)
            attention_mask = encoded['attention_mask'].unsqueeze(-1)
            embeddings = (last_hidden_state * attention_mask).sum(1) / attention_mask.sum(1)
        elif pooling == "max":
            # Max pooling
            embeddings = torch.max(last_hidden_state, dim=1)[0]
        elif pooling == "cls":
            # Use [CLS] token
            embeddings = last_hidden_state[:, 0, :]
        else:
            raise ValueError(f"Unknown pooling: {pooling}")

        return embeddings.numpy()

    def extract_features(
        self,
        texts: Union[str, List[str]],
        include_embeddings: bool = True,
        include_stats: bool = True
    ) -> Dict[str, np.ndarray]:
        """
        Extract comprehensive text features

        Args:
            texts: Single text or list of texts
            include_embeddings: Include BERT embeddings
            include_stats: Include statistical features

        Returns:
            Dictionary of features
        """
        if isinstance(texts, str):
            texts = [texts]

        features = {}

        # BERT embeddings
        if include_embeddings:
            features['embeddings'] = self.get_embeddings(texts)

        # Statistical features
        if include_stats:
            stats = []
            for text in texts:
                text_stats = {
                    'length': len(text),
                    'word_count': len(text.split()),
                    'avg_word_length': np.mean([len(w) for w in text.split()]),
                    'unique_words': len(set(text.split())),
                    'uppercase_ratio': sum(1 for c in text if c.isupper()) / (len(text) + 1e-7),
                    'digit_ratio': sum(1 for c in text if c.isdigit()) / (len(text) + 1e-7),
                }
                stats.append(list(text_stats.values()))

            features['stats'] = np.array(stats)

        return features

    def to_tfrecord(
        self,
        texts: List[str],
        labels: Optional[List[int]],
        output_path: str
    ) -> None:
        """
        Create TFRecord dataset for Vertex AI

        Args:
            texts: List of texts
            labels: Optional list of labels
            output_path: Output TFRecord file path
        """
        with tf.io.TFRecordWriter(output_path) as writer:
            for idx, text in enumerate(texts):
                # Tokenize
                encoded = self.tokenize(text, return_tensors=None)

                # Create feature dict
                feature = {
                    'input_ids': tf.train.Feature(
                        int64_list=tf.train.Int64List(value=encoded['input_ids'][0])
                    ),
                    'attention_mask': tf.train.Feature(
                        int64_list=tf.train.Int64List(value=encoded['attention_mask'][0])
                    ),
                }

                if labels is not None:
                    feature['label'] = tf.train.Feature(
                        int64_list=tf.train.Int64List(value=[labels[idx]])
                    )

                # Create example and write
                example = tf.train.Example(features=tf.train.Features(feature=feature))
                writer.write(example.SerializeToString())

    def to_vertex_ai_format(
        self,
        texts: List[str],
        labels: Optional[List[int]] = None
    ) -> Dict:
        """
        Convert to Vertex AI training format

        Args:
            texts: List of texts
            labels: Optional list of labels

        Returns:
            Dictionary in Vertex AI format
        """
        # Get embeddings
        embeddings = self.get_embeddings(texts)

        instances = []
        for idx, text in enumerate(texts):
            instance = {
                "text": text,
                "embedding": embeddings[idx].tolist()
            }

            if labels is not None:
                instance["label"] = labels[idx]

            instances.append(instance)

        return {"instances": instances}


# Specialized processors

class SentimentAnalyzer:
    """Sentiment analysis using BERT"""

    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        from transformers import pipeline
        self.classifier = pipeline("sentiment-analysis", model=model_name)

    def analyze(self, texts: Union[str, List[str]]) -> List[Dict]:
        """
        Analyze sentiment

        Args:
            texts: Single text or list of texts

        Returns:
            List of sentiment results
        """
        if isinstance(texts, str):
            texts = [texts]

        results = self.classifier(texts)
        return results


class NamedEntityRecognizer:
    """Named entity recognition using BERT"""

    def __init__(self, model_name: str = "dslim/bert-base-NER"):
        from transformers import pipeline
        self.ner = pipeline("ner", model=model_name, aggregation_strategy="simple")

    def extract_entities(self, texts: Union[str, List[str]]) -> List[List[Dict]]:
        """
        Extract named entities

        Args:
            texts: Single text or list of texts

        Returns:
            List of entity results
        """
        if isinstance(texts, str):
            texts = [texts]

        results = [self.ner(text) for text in texts]
        return results


# Utility functions

def create_vocabulary(
    texts: List[str],
    vocab_size: int = 10000,
    min_frequency: int = 2
) -> Dict[str, int]:
    """
    Create vocabulary from texts

    Args:
        texts: List of texts
        vocab_size: Maximum vocabulary size
        min_frequency: Minimum word frequency

    Returns:
        Word to index mapping
    """
    from collections import Counter

    # Count words
    word_counts = Counter()
    for text in texts:
        words = text.lower().split()
        word_counts.update(words)

    # Filter by frequency
    filtered = {word: count for word, count in word_counts.items() if count >= min_frequency}

    # Sort by frequency and take top vocab_size
    sorted_words = sorted(filtered.items(), key=lambda x: x[1], reverse=True)[:vocab_size]

    # Create vocab (reserve 0 for padding, 1 for unknown)
    vocab = {"<PAD>": 0, "<UNK>": 1}
    vocab.update({word: idx + 2 for idx, (word, _) in enumerate(sorted_words)})

    return vocab


def text_to_sequence(
    text: str,
    vocab: Dict[str, int],
    max_length: int = 512
) -> List[int]:
    """
    Convert text to sequence of indices

    Args:
        text: Input text
        vocab: Vocabulary mapping
        max_length: Maximum sequence length

    Returns:
        List of token indices
    """
    words = text.lower().split()
    sequence = [vocab.get(word, vocab["<UNK>"]) for word in words]

    # Truncate or pad
    if len(sequence) > max_length:
        sequence = sequence[:max_length]
    else:
        sequence = sequence + [vocab["<PAD>"]] * (max_length - len(sequence))

    return sequence
