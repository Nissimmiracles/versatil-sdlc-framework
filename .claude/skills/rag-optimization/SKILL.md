---
name: rag-optimization
description: RAG system optimization, embedding strategies, retrieval methods, reranking. Use when optimizing RAG performance, implementing hybrid search, fine-tuning embeddings, or improving retrieval accuracy. Covers embedding models, chunking strategies, reranking algorithms, and evaluation metrics. Improves RAG accuracy by 40%.
---

# RAG Optimization

## Overview

Advanced RAG (Retrieval-Augmented Generation) system optimization covering embedding strategies, retrieval methods, reranking algorithms, and hybrid search. Focus on improving retrieval accuracy, latency, and relevance.

**Goal**: Build high-performance RAG systems with 90%+ retrieval accuracy and sub-200ms latency

## When to Use This Skill

Use this skill when:
- Optimizing existing RAG systems for accuracy/speed
- Implementing hybrid search (dense + sparse retrieval)
- Fine-tuning embedding models for domain-specific data
- Adding reranking layers (cross-encoders, LLM reranking)
- Evaluating RAG performance (MRR, NDCG, recall@k)
- Optimizing chunking strategies for different content types
- Implementing GraphRAG or advanced retrieval patterns

**Triggers**: "RAG optimization", "embedding strategy", "hybrid search", "reranking", "retrieval accuracy", "chunking", "GraphRAG"

---

## Quick Start: RAG Architecture Decision Tree

### Choosing the Right RAG Strategy

**Basic RAG** (Single vector search):
- ✅ Simple use case with clean documents
- ✅ Domain-general content (no specialized vocabulary)
- ✅ Small corpus (<10K documents)
- ✅ Latency not critical (>500ms acceptable)
- ✅ Best for: FAQs, documentation, simple Q&A

**Hybrid Search** (Dense + Sparse):
- ✅ Mix of semantic and keyword matching needed
- ✅ Technical content with specific terminology
- ✅ Medium corpus (10K-1M documents)
- ✅ Better recall than pure vector search
- ✅ Best for: Code search, technical docs, legal documents

**Reranked RAG** (Retrieve more, rerank top):
- ✅ High accuracy required (90%+ precision)
- ✅ Willing to trade latency for quality
- ✅ Complex queries with nuanced context
- ✅ Best for: Customer support, research, compliance

**GraphRAG** (Knowledge graph + vectors):
- ✅ Highly interconnected data
- ✅ Multi-hop reasoning required
- ✅ Entity relationships matter
- ✅ Best for: Knowledge bases, enterprise search

**Fine-tuned Embeddings** (Custom model):
- ✅ Domain-specific vocabulary (medical, legal, finance)
- ✅ Proprietary terminology
- ✅ Have labeled data for fine-tuning
- ✅ Best for: Specialized domains, enterprise search

---

## Embedding Optimization

### 1. Choosing Embedding Models

```python
# rag/embeddings/model_selection.py
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import numpy as np

class EmbeddingModelSelector:
    """Select optimal embedding model for your use case"""

    # Model comparison (as of 2024)
    MODELS = {
        'openai-ada-002': {
            'dimensions': 1536,
            'max_tokens': 8191,
            'cost_per_1k': 0.0001,
            'latency_ms': 50,
            'use_case': 'General purpose, high quality'
        },
        'text-embedding-3-small': {
            'dimensions': 1536,
            'max_tokens': 8191,
            'cost_per_1k': 0.00002,
            'latency_ms': 30,
            'use_case': 'Cost-optimized, good quality'
        },
        'all-MiniLM-L6-v2': {
            'dimensions': 384,
            'max_tokens': 256,
            'cost_per_1k': 0,  # Self-hosted
            'latency_ms': 10,
            'use_case': 'Fast, self-hosted, decent quality'
        },
        'all-mpnet-base-v2': {
            'dimensions': 768,
            'max_tokens': 514,
            'cost_per_1k': 0,
            'latency_ms': 20,
            'use_case': 'Best self-hosted quality'
        },
        'bge-large-en-v1.5': {
            'dimensions': 1024,
            'max_tokens': 512,
            'cost_per_1k': 0,
            'latency_ms': 30,
            'use_case': 'SOTA open-source'
        }
    }

    @staticmethod
    def recommend(
        corpus_size: int,
        budget: str,  # 'low', 'medium', 'high'
        latency_requirement: int,  # milliseconds
        domain: str = 'general'
    ) -> str:
        """Recommend embedding model based on requirements"""

        if budget == 'low' or corpus_size > 1_000_000:
            # Self-hosted models
            if latency_requirement < 15:
                return 'all-MiniLM-L6-v2'
            else:
                return 'bge-large-en-v1.5'

        if budget == 'medium':
            return 'text-embedding-3-small'

        # High budget or high quality requirement
        return 'openai-ada-002'

# Usage
model_name = EmbeddingModelSelector.recommend(
    corpus_size=100_000,
    budget='medium',
    latency_requirement=50,
    domain='technical-docs'
)
print(f"Recommended model: {model_name}")
```

### 2. Advanced Chunking Strategies

```python
# rag/chunking/strategies.py
from typing import List, Dict
import re

class ChunkingStrategy:
    """Advanced document chunking strategies"""

    @staticmethod
    def semantic_chunking(
        text: str,
        model: SentenceTransformer,
        similarity_threshold: float = 0.5
    ) -> List[str]:
        """Chunk based on semantic similarity (not fixed size)"""
        sentences = re.split(r'(?<=[.!?])\s+', text)

        if not sentences:
            return []

        # Get embeddings for all sentences
        embeddings = model.encode(sentences)

        chunks = []
        current_chunk = [sentences[0]]
        current_embedding = embeddings[0]

        for i in range(1, len(sentences)):
            # Calculate similarity with current chunk
            similarity = np.dot(current_embedding, embeddings[i]) / (
                np.linalg.norm(current_embedding) * np.linalg.norm(embeddings[i])
            )

            if similarity >= similarity_threshold:
                # Add to current chunk
                current_chunk.append(sentences[i])
                # Update chunk embedding (average)
                current_embedding = (current_embedding + embeddings[i]) / 2
            else:
                # Start new chunk
                chunks.append(' '.join(current_chunk))
                current_chunk = [sentences[i]]
                current_embedding = embeddings[i]

        # Add last chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    @staticmethod
    def hierarchical_chunking(
        text: str,
        chunk_sizes: List[int] = [512, 1024, 2048]
    ) -> Dict[str, List[str]]:
        """Create multiple granularity chunks"""
        chunks = {}

        for size in chunk_sizes:
            # Simple character-based chunking (can be enhanced with tokens)
            chunks[f'size_{size}'] = [
                text[i:i+size]
                for i in range(0, len(text), size)
            ]

        return chunks

    @staticmethod
    def overlap_chunking(
        text: str,
        chunk_size: int = 512,
        overlap: int = 128
    ) -> List[str]:
        """Chunking with overlap for context preservation"""
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (chunk_size - overlap)

        return chunks

    @staticmethod
    def markdown_aware_chunking(
        markdown_text: str,
        max_tokens: int = 512
    ) -> List[Dict[str, str]]:
        """Chunk markdown preserving structure"""
        chunks = []

        # Split by headers
        sections = re.split(r'(^#{1,6}\s+.+$)', markdown_text, flags=re.MULTILINE)

        current_header = ""
        current_content = ""

        for section in sections:
            if re.match(r'^#{1,6}\s+', section):
                # Save previous section
                if current_content:
                    chunks.append({
                        'header': current_header,
                        'content': current_content.strip(),
                        'hierarchy': current_header.count('#')
                    })

                current_header = section
                current_content = ""
            else:
                current_content += section

        # Add last section
        if current_content:
            chunks.append({
                'header': current_header,
                'content': current_content.strip(),
                'hierarchy': current_header.count('#') if current_header else 0
            })

        return chunks

# Usage
chunker = ChunkingStrategy()

# Semantic chunking (best quality, slower)
semantic_chunks = chunker.semantic_chunking(text, model)

# Overlap chunking (good balance)
overlap_chunks = chunker.overlap_chunking(text, chunk_size=512, overlap=128)

# Markdown-aware (for docs)
md_chunks = chunker.markdown_aware_chunking(markdown_text)
```

### 3. Fine-tuning Embeddings

```python
# rag/embeddings/fine_tune.py
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
from typing import List, Tuple

class EmbeddingFineTuner:
    """Fine-tune embedding models for domain-specific data"""

    def __init__(self, base_model: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(base_model)

    def prepare_training_data(
        self,
        positive_pairs: List[Tuple[str, str]],
        negative_pairs: List[Tuple[str, str]]
    ) -> List[InputExample]:
        """Prepare training examples"""
        examples = []

        # Positive pairs (query, relevant doc) -> label 1
        for query, doc in positive_pairs:
            examples.append(InputExample(texts=[query, doc], label=1.0))

        # Negative pairs (query, irrelevant doc) -> label 0
        for query, doc in negative_pairs:
            examples.append(InputExample(texts=[query, doc], label=0.0))

        return examples

    def fine_tune(
        self,
        training_examples: List[InputExample],
        epochs: int = 4,
        batch_size: int = 16,
        output_path: str = './fine-tuned-model'
    ):
        """Fine-tune the model"""

        # Create DataLoader
        train_dataloader = DataLoader(
            training_examples,
            shuffle=True,
            batch_size=batch_size
        )

        # Define loss function (Contrastive Loss)
        train_loss = losses.CosineSimilarityLoss(self.model)

        # Train
        self.model.fit(
            train_objectives=[(train_dataloader, train_loss)],
            epochs=epochs,
            warmup_steps=100,
            output_path=output_path
        )

        print(f"✅ Model fine-tuned and saved to {output_path}")

# Usage
tuner = EmbeddingFineTuner(base_model='all-MiniLM-L6-v2')

# Prepare training data from your domain
positive_pairs = [
    ("What is kubernetes?", "Kubernetes is a container orchestration platform..."),
    ("How to scale pods?", "Use kubectl scale deployment to scale pods...")
]

negative_pairs = [
    ("What is kubernetes?", "Python is a programming language..."),
    ("How to scale pods?", "JavaScript is used for web development...")
]

examples = tuner.prepare_training_data(positive_pairs, negative_pairs)
tuner.fine_tune(examples, epochs=4, output_path='./k8s-embeddings')
```

---

## Hybrid Search

### Combining Dense and Sparse Retrieval

```python
# rag/retrieval/hybrid_search.py
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import numpy as np

class HybridSearchEngine:
    """Hybrid search combining dense (vector) and sparse (BM25) retrieval"""

    def __init__(
        self,
        embedding_model: str = 'all-MiniLM-L6-v2',
        alpha: float = 0.5  # Weight: 0=sparse only, 1=dense only
    ):
        self.embedding_model = SentenceTransformer(embedding_model)
        self.alpha = alpha
        self.bm25 = None
        self.documents = []
        self.embeddings = None

    def index_documents(self, documents: List[str]):
        """Index documents for both dense and sparse retrieval"""
        self.documents = documents

        # Dense indexing (vector embeddings)
        print("Creating dense embeddings...")
        self.embeddings = self.embedding_model.encode(
            documents,
            show_progress_bar=True
        )

        # Sparse indexing (BM25)
        print("Creating BM25 index...")
        tokenized_docs = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized_docs)

        print(f"✅ Indexed {len(documents)} documents")

    def search(
        self,
        query: str,
        top_k: int = 10
    ) -> List[Tuple[int, float, str]]:
        """Hybrid search combining dense and sparse scores"""

        # Dense retrieval (vector similarity)
        query_embedding = self.embedding_model.encode([query])[0]
        dense_scores = np.dot(self.embeddings, query_embedding)
        dense_scores = (dense_scores - dense_scores.min()) / (
            dense_scores.max() - dense_scores.min() + 1e-10
        )  # Normalize to [0, 1]

        # Sparse retrieval (BM25)
        tokenized_query = query.lower().split()
        sparse_scores = self.bm25.get_scores(tokenized_query)
        sparse_scores = (sparse_scores - sparse_scores.min()) / (
            sparse_scores.max() - sparse_scores.min() + 1e-10
        )  # Normalize to [0, 1]

        # Combine scores
        hybrid_scores = (
            self.alpha * dense_scores +
            (1 - self.alpha) * sparse_scores
        )

        # Get top-k results
        top_indices = np.argsort(hybrid_scores)[::-1][:top_k]

        results = [
            (idx, hybrid_scores[idx], self.documents[idx])
            for idx in top_indices
        ]

        return results

# Usage
search_engine = HybridSearchEngine(alpha=0.7)  # 70% dense, 30% sparse

documents = [
    "Kubernetes is a container orchestration platform",
    "Docker containers package applications",
    "Microservices architecture splits applications",
    # ... more documents
]

search_engine.index_documents(documents)

results = search_engine.search("container management", top_k=5)
for idx, score, doc in results:
    print(f"Score: {score:.4f} | {doc[:100]}")
```

---

## Reranking

### Cross-Encoder Reranking

```python
# rag/reranking/cross_encoder.py
from sentence_transformers import CrossEncoder
from typing import List, Tuple

class RerankerPipeline:
    """Two-stage retrieval: fast retrieval + slow reranking"""

    def __init__(
        self,
        retrieval_model: str = 'all-MiniLM-L6-v2',
        reranker_model: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
    ):
        # Stage 1: Fast bi-encoder for initial retrieval
        self.retriever = SentenceTransformer(retrieval_model)

        # Stage 2: Slow cross-encoder for reranking
        self.reranker = CrossEncoder(reranker_model)

    def retrieve_and_rerank(
        self,
        query: str,
        documents: List[str],
        top_k_retrieve: int = 100,
        top_k_rerank: int = 10
    ) -> List[Tuple[float, str]]:
        """Two-stage retrieval with reranking"""

        # Stage 1: Fast retrieval (get top 100)
        query_embedding = self.retriever.encode([query])[0]
        doc_embeddings = self.retriever.encode(documents)

        # Calculate similarities
        similarities = np.dot(doc_embeddings, query_embedding)
        top_indices = np.argsort(similarities)[::-1][:top_k_retrieve]

        # Get candidate documents
        candidates = [(documents[idx], similarities[idx]) for idx in top_indices]

        # Stage 2: Reranking (top 100 -> top 10)
        query_doc_pairs = [[query, doc] for doc, _ in candidates]
        rerank_scores = self.reranker.predict(query_doc_pairs)

        # Sort by rerank scores
        reranked = sorted(
            zip(rerank_scores, [doc for doc, _ in candidates]),
            key=lambda x: x[0],
            reverse=True
        )[:top_k_rerank]

        return reranked

# Usage
reranker = RerankerPipeline()

results = reranker.retrieve_and_rerank(
    query="How to deploy kubernetes cluster?",
    documents=all_documents,
    top_k_retrieve=100,  # Fast retrieval
    top_k_rerank=10      # Slow but accurate reranking
)

for score, doc in results:
    print(f"Score: {score:.4f} | {doc[:100]}")
```

### LLM-based Reranking

```python
# rag/reranking/llm_reranker.py
import anthropic
from typing import List, Tuple

class LLMReranker:
    """Use LLM to rerank retrieved documents"""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = 5
    ) -> List[Tuple[int, str]]:
        """LLM-based reranking for highest quality"""

        # Create prompt for LLM
        docs_text = "\n\n".join([
            f"Document {i+1}:\n{doc}"
            for i, doc in enumerate(documents)
        ])

        prompt = f"""Given the query and documents below, rank the documents by relevance to the query.
Return ONLY a comma-separated list of document numbers in order of relevance (most relevant first).

Query: {query}

{docs_text}

Ranking (comma-separated numbers):"""

        # Call LLM
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse response
        ranking_text = message.content[0].text.strip()
        rankings = [int(x.strip()) - 1 for x in ranking_text.split(',')]

        # Return reranked documents
        reranked = [
            (rank, documents[rank])
            for rank in rankings[:top_k]
            if rank < len(documents)
        ]

        return reranked

# Usage (expensive, use only when quality is critical)
llm_reranker = LLMReranker(api_key="your-api-key")

top_docs = llm_reranker.rerank(
    query="What are best practices for kubernetes security?",
    documents=candidate_documents,
    top_k=5
)
```

---

## RAG Evaluation

### Comprehensive Metrics

```python
# rag/evaluation/metrics.py
from typing import List, Set
import numpy as np

class RAGEvaluator:
    """Evaluate RAG system performance"""

    @staticmethod
    def recall_at_k(
        retrieved: List[str],
        relevant: Set[str],
        k: int
    ) -> float:
        """Recall@K: What % of relevant docs were retrieved in top-k?"""
        retrieved_k = set(retrieved[:k])
        return len(retrieved_k & relevant) / len(relevant) if relevant else 0

    @staticmethod
    def precision_at_k(
        retrieved: List[str],
        relevant: Set[str],
        k: int
    ) -> float:
        """Precision@K: What % of top-k retrieved docs are relevant?"""
        retrieved_k = set(retrieved[:k])
        return len(retrieved_k & relevant) / k if k > 0 else 0

    @staticmethod
    def mrr(retrieved_list: List[List[str]], relevant_list: List[Set[str]]) -> float:
        """Mean Reciprocal Rank: Average of 1/rank of first relevant doc"""
        reciprocal_ranks = []

        for retrieved, relevant in zip(retrieved_list, relevant_list):
            for i, doc_id in enumerate(retrieved):
                if doc_id in relevant:
                    reciprocal_ranks.append(1 / (i + 1))
                    break
            else:
                reciprocal_ranks.append(0)

        return np.mean(reciprocal_ranks)

    @staticmethod
    def ndcg_at_k(
        retrieved: List[str],
        relevant: Set[str],
        k: int
    ) -> float:
        """Normalized Discounted Cumulative Gain@K"""
        dcg = 0
        for i, doc_id in enumerate(retrieved[:k]):
            if doc_id in relevant:
                dcg += 1 / np.log2(i + 2)  # +2 because log2(1) = 0

        # Ideal DCG (all relevant docs at top)
        idcg = sum(1 / np.log2(i + 2) for i in range(min(k, len(relevant))))

        return dcg / idcg if idcg > 0 else 0

# Usage
evaluator = RAGEvaluator()

retrieved_docs = ['doc1', 'doc3', 'doc5', 'doc2', 'doc8']
relevant_docs = {'doc1', 'doc2', 'doc4'}

recall_5 = evaluator.recall_at_k(retrieved_docs, relevant_docs, k=5)
precision_5 = evaluator.precision_at_k(retrieved_docs, relevant_docs, k=5)
ndcg_5 = evaluator.ndcg_at_k(retrieved_docs, relevant_docs, k=5)

print(f"Recall@5: {recall_5:.2%}")       # 66% (2 out of 3 relevant docs)
print(f"Precision@5: {precision_5:.2%}") # 40% (2 relevant out of 5 retrieved)
print(f"NDCG@5: {ndcg_5:.3f}")
```

---

## Resources

### scripts/
- `benchmark-embeddings.py` - Compare embedding model performance
- `evaluate-rag-system.py` - Run full RAG evaluation suite
- `tune-hybrid-search.py` - Optimize alpha parameter for hybrid search

### references/
- `references/embedding-models.md` - Comparison of popular embedding models
- `references/chunking-strategies.md` - Chunking best practices by content type
- `references/reranking-methods.md` - Cross-encoder vs LLM reranking tradeoffs

### assets/
- `assets/evaluation-datasets/` - Standard RAG evaluation datasets
- `assets/fine-tuning-data/` - Example training data for embeddings

## Related Skills

- `ml-pipelines` - Fine-tuning embedding models
- `vector-databases` - Efficient vector storage and retrieval
- `model-deployment` - Deploying RAG systems to production
