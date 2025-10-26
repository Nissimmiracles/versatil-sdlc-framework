---
name: vector-databases
description: Vector databases and semantic search using pgvector, embeddings, and similarity algorithms (cosine, euclidean, HNSW, IVFFlat). Use when implementing RAG systems, semantic search, recommendation engines, or AI features requiring embeddings. Provides 10-100x faster similarity search compared to brute-force approaches.
---

# Vector Databases

## Overview

Vector databases for storing and querying embeddings (high-dimensional vectors) using pgvector, similarity search algorithms (HNSW, IVFFlat), and semantic search patterns. Essential for RAG (Retrieval-Augmented Generation), recommendation systems, and AI-powered features.

**Goal**: Efficient storage and retrieval of embeddings for semantic search and similarity matching

## When to Use This Skill

Use this skill when:
- Implementing RAG systems (semantic search over documents)
- Building recommendation engines (similar products, content)
- Creating AI features (chatbots, Q&A, document search)
- Storing embeddings from OpenAI, Cohere, or custom models
- Optimizing similarity search performance (HNSW vs IVFFlat)
- Implementing hybrid search (vector + full-text)
- Migrating from Pinecone/Weaviate to pgvector

**Triggers**: "vector database", "pgvector", "embeddings", "semantic search", "similarity search", "RAG", "HNSW", "IVFFlat"

---

## Quick Start: Vector Database Decision Tree

### When to Use pgvector vs Pinecone vs Weaviate

**pgvector** (PostgreSQL extension):
- ✅ Already using PostgreSQL
- ✅ Want single database (relational + vector data)
- ✅ Cost-effective (no separate vector DB service)
- ✅ ACID transactions (join vectors with relational data)
- ✅ Up to 10M vectors (scales with PostgreSQL)
- ✅ Best for: Supabase projects, existing Postgres apps, cost optimization

**Pinecone** (Managed vector DB):
- ✅ 100M+ vectors (massive scale)
- ✅ Real-time updates (low-latency writes)
- ✅ Metadata filtering (fast pre-filtering)
- ✅ Fully managed (no infrastructure)
- ✅ Multi-region replication
- ✅ Best for: Large-scale production apps, high-traffic APIs

**Weaviate** (Open-source vector DB):
- ✅ Self-hosted (full control)
- ✅ Built-in vectorization (BERT, GPT, CLIP)
- ✅ GraphQL API
- ✅ Hybrid search (vector + keyword)
- ✅ Multi-tenancy support
- ✅ Best for: Self-hosted infrastructure, complex data models

**Use Multiple** when:
- pgvector for main app + Pinecone for external API (fast public queries)
- Weaviate for document search + pgvector for user data

---

## pgvector Patterns

### 1. Installation & Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Create table with vector column
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimensions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for similarity search (HNSW - fast, approximate)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Alternative: IVFFlat index (faster build time, slower queries)
-- CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2. Storing Embeddings

```typescript
import OpenAI from 'openai';
import { db } from './db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function storeDocument(content: string, metadata?: any) {
  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: content
  });

  const embedding = response.data[0].embedding; // Array of 1536 floats

  // Store in database
  const result = await db.query(
    `INSERT INTO documents (content, embedding, metadata)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [content, embedding, metadata]
  );

  return result.rows[0].id;
}

// Example usage
await storeDocument(
  'PostgreSQL is a powerful, open source object-relational database system.',
  { category: 'database', source: 'docs' }
);
```

### 3. Similarity Search (Cosine, Euclidean, Inner Product)

```sql
-- Cosine similarity (most common for embeddings)
-- Range: -1 (opposite) to 1 (identical)
-- 1 - (embedding <=> query_embedding) converts distance to similarity
SELECT
  id,
  content,
  1 - (embedding <=> $1::vector) AS similarity
FROM documents
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- Euclidean distance (L2 distance)
-- Lower distance = more similar
SELECT
  id,
  content,
  embedding <-> $1::vector AS distance
FROM documents
ORDER BY embedding <-> $1::vector
LIMIT 10;

-- Inner product (dot product)
-- Higher value = more similar
SELECT
  id,
  content,
  embedding <#> $1::vector AS inner_product
FROM documents
ORDER BY embedding <#> $1::vector DESC
LIMIT 10;
```

### 4. Semantic Search Implementation

```typescript
import OpenAI from 'openai';
import { db } from './db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function semanticSearch(query: string, limit: number = 10) {
  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const queryEmbedding = response.data[0].embedding;

  // Search for similar documents
  const result = await db.query(
    `SELECT
       id,
       content,
       metadata,
       1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     WHERE 1 - (embedding <=> $1::vector) > 0.7 -- Threshold: 70% similarity
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [queryEmbedding, limit]
  );

  return result.rows;
}

// Example usage
const results = await semanticSearch('How do I optimize PostgreSQL queries?');
console.log(results);
// [
//   { content: 'PostgreSQL query optimization guide...', similarity: 0.89 },
//   { content: 'Indexes in PostgreSQL...', similarity: 0.82 }
// ]
```

### 5. Hybrid Search (Vector + Full-Text)

```sql
-- Create full-text search index
ALTER TABLE documents ADD COLUMN content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX ON documents USING GIN (content_tsv);

-- Hybrid search (combines vector similarity + keyword matching)
SELECT
  id,
  content,
  1 - (embedding <=> $1::vector) AS vector_similarity,
  ts_rank(content_tsv, to_tsquery('english', $2)) AS text_rank,
  (1 - (embedding <=> $1::vector)) * 0.7 +
    ts_rank(content_tsv, to_tsquery('english', $2)) * 0.3 AS combined_score
FROM documents
WHERE content_tsv @@ to_tsquery('english', $2)  -- Filter by keyword first
ORDER BY combined_score DESC
LIMIT 10;
```

```typescript
// Hybrid search implementation
async function hybridSearch(query: string, limit: number = 10) {
  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const embedding = response.data[0].embedding;

  // Convert query to tsquery format (replace spaces with &)
  const tsquery = query.split(' ').join(' & ');

  const result = await db.query(
    `SELECT
       id,
       content,
       1 - (embedding <=> $1::vector) AS vector_similarity,
       ts_rank(content_tsv, to_tsquery('english', $2)) AS text_rank,
       (1 - (embedding <=> $1::vector)) * 0.7 +
         ts_rank(content_tsv, to_tsquery('english', $2)) * 0.3 AS combined_score
     FROM documents
     WHERE content_tsv @@ to_tsquery('english', $2)
     ORDER BY combined_score DESC
     LIMIT $3`,
    [embedding, tsquery, limit]
  );

  return result.rows;
}
```

### 6. Metadata Filtering

```sql
-- Search with metadata filters
SELECT
  id,
  content,
  metadata,
  1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE
  metadata->>'category' = 'database' AND
  metadata->>'language' = 'en' AND
  (metadata->>'created_at')::timestamptz > NOW() - INTERVAL '30 days'
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

```typescript
// Filtered semantic search
interface SearchFilters {
  category?: string;
  language?: string;
  dateAfter?: Date;
}

async function filteredSearch(
  query: string,
  filters: SearchFilters = {},
  limit: number = 10
) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const embedding = response.data[0].embedding;

  // Build WHERE clause dynamically
  const conditions: string[] = [];
  const params: any[] = [embedding, limit];
  let paramIndex = 3;

  if (filters.category) {
    conditions.push(`metadata->>'category' = $${paramIndex++}`);
    params.push(filters.category);
  }

  if (filters.language) {
    conditions.push(`metadata->>'language' = $${paramIndex++}`);
    params.push(filters.language);
  }

  if (filters.dateAfter) {
    conditions.push(`(metadata->>'created_at')::timestamptz > $${paramIndex++}`);
    params.push(filters.dateAfter);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await db.query(
    `SELECT
       id,
       content,
       metadata,
       1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     ${whereClause}
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    params
  );

  return result.rows;
}
```

---

## Index Optimization

### 1. HNSW vs IVFFlat

```sql
-- HNSW (Hierarchical Navigable Small World)
-- ✅ Pros: Fastest queries (10-100x faster than IVFFlat)
-- ✅ Pros: No training required
-- ❌ Cons: Slower index build time
-- ❌ Cons: Larger index size
-- Best for: Production apps with frequent queries

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Parameters:
-- m = 16: Number of bi-directional links (higher = better recall, slower build)
-- ef_construction = 64: Size of dynamic candidate list (higher = better recall, slower build)

-- Query-time parameters:
SET hnsw.ef_search = 100; -- Higher = better recall, slower queries


-- IVFFlat (Inverted File with Flat Compression)
-- ✅ Pros: Faster index build time
-- ✅ Pros: Smaller index size
-- ❌ Cons: Requires training (VACUUM ANALYZE)
-- ❌ Cons: Slower queries than HNSW
-- Best for: Development, infrequent queries, large batch updates

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Parameters:
-- lists = sqrt(num_rows): Number of clusters
-- Example: 1M rows → lists = 1000, 10M rows → lists = 3162

-- Query-time parameters:
SET ivfflat.probes = 10; -- Higher = better recall, slower queries
```

### 2. Index Selection Guide

```typescript
// Index selection based on dataset size and query patterns

// Small dataset (< 100K vectors)
// No index needed - brute force is fast enough
// ALTER TABLE documents DROP INDEX IF EXISTS documents_embedding_idx;

// Medium dataset (100K - 1M vectors)
// Use IVFFlat for development, HNSW for production
const indexConfig = {
  development: 'ivfflat (embedding vector_cosine_ops) WITH (lists = 316)',
  production: 'hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)'
};

// Large dataset (1M - 10M vectors)
// Use HNSW with tuned parameters
const indexConfig = {
  production: 'hnsw (embedding vector_cosine_ops) WITH (m = 24, ef_construction = 128)'
};

// Very large dataset (10M+ vectors)
// Consider sharding or Pinecone
```

### 3. Index Maintenance

```sql
-- Rebuild index after bulk inserts
REINDEX INDEX documents_embedding_idx;

-- Update statistics (required for IVFFlat)
VACUUM ANALYZE documents;

-- Monitor index size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'documents';
```

---

## RAG (Retrieval-Augmented Generation) Pattern

### 1. Complete RAG Implementation

```typescript
import OpenAI from 'openai';
import { db } from './db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Step 1: Store documents with embeddings
async function indexDocument(content: string, metadata?: any) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: content
  });

  const embedding = response.data[0].embedding;

  await db.query(
    `INSERT INTO documents (content, embedding, metadata)
     VALUES ($1, $2, $3)`,
    [content, embedding, metadata]
  );
}

// Step 2: Retrieve relevant context
async function retrieveContext(query: string, limit: number = 5) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const embedding = response.data[0].embedding;

  const result = await db.query(
    `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     WHERE 1 - (embedding <=> $1::vector) > 0.7
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embedding, limit]
  );

  return result.rows.map(row => row.content);
}

// Step 3: Generate answer with context
async function askQuestion(question: string) {
  // Retrieve relevant documents
  const context = await retrieveContext(question);

  if (context.length === 0) {
    return { answer: 'No relevant information found.', sources: [] };
  }

  // Generate answer using context
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant. Answer the question based on the following context. If the answer is not in the context, say "I don't have enough information to answer this question."\n\nContext:\n${context.join('\n\n')}`
      },
      {
        role: 'user',
        content: question
      }
    ]
  });

  return {
    answer: completion.choices[0].message.content,
    sources: context
  };
}

// Example usage
const result = await askQuestion('How do I optimize PostgreSQL queries?');
console.log('Answer:', result.answer);
console.log('Sources:', result.sources);
```

### 2. Chunking Strategies

```typescript
// Split large documents into chunks for better retrieval
function chunkDocument(text: string, chunkSize: number = 500, overlap: number = 50) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap; // Overlap to maintain context
  }

  return chunks;
}

// Example: Index a large document
async function indexLargeDocument(title: string, content: string) {
  const chunks = chunkDocument(content);

  for (const [index, chunk] of chunks.entries()) {
    await indexDocument(chunk, {
      title,
      chunk_index: index,
      total_chunks: chunks.length
    });
  }
}
```

---

## Performance Optimization

### 1. Batch Embedding Generation

```typescript
// ✅ Good - Batch embeddings (up to 2048 inputs)
async function batchEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts // Array of up to 2048 strings
  });

  return response.data.map(item => item.embedding);
}

// Store in single transaction
async function batchIndexDocuments(documents: { content: string; metadata?: any }[]) {
  const contents = documents.map(doc => doc.content);
  const embeddings = await batchEmbeddings(contents);

  await db.query('BEGIN');

  for (let i = 0; i < documents.length; i++) {
    await db.query(
      `INSERT INTO documents (content, embedding, metadata)
       VALUES ($1, $2, $3)`,
      [documents[i].content, embeddings[i], documents[i].metadata]
    );
  }

  await db.query('COMMIT');
}
```

### 2. Query Optimization

```sql
-- ✅ Good - Use index with similarity threshold
SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE 1 - (embedding <=> $1::vector) > 0.7 -- Pre-filter with threshold
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- ❌ Bad - Full scan without threshold
SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### 3. Caching Embeddings

```typescript
import { Redis } from 'ioredis';

const redis = new Redis();

async function getCachedEmbedding(text: string): Promise<number[] | null> {
  const cached = await redis.get(`embedding:${text}`);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
  await redis.setex(`embedding:${text}`, 3600, JSON.stringify(embedding)); // 1 hour TTL
}

async function getEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cached = await getCachedEmbedding(text);
  if (cached) return cached;

  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });

  const embedding = response.data[0].embedding;

  // Cache result
  await setCachedEmbedding(text, embedding);

  return embedding;
}
```

---

## Resources

### scripts/
- `generate-embeddings.py` - Batch generate embeddings from CSV/JSON
- `migrate-to-pgvector.js` - Migrate from Pinecone/Weaviate to pgvector

### references/
- `references/similarity-metrics.md` - Cosine vs Euclidean vs Inner Product comparison
- `references/index-tuning.md` - HNSW vs IVFFlat parameter tuning guide
- `references/rag-patterns.md` - RAG architecture patterns and chunking strategies
- `references/embedding-models.md` - OpenAI, Cohere, Hugging Face embedding comparison

### assets/
- `assets/migration-scripts/` - Pinecone → pgvector migration scripts
- `assets/benchmark-data/` - Performance benchmark datasets

## Related Skills

- `schema-optimization` - Database indexing and query performance
- `rls-policies` - Row-level security for multi-tenant vector data
- `api-design` - REST/GraphQL APIs for semantic search
- `edge-databases` - Supabase Edge Functions with pgvector
