---
name: schema-optimization
description: Database schema optimization using denormalization, partitioning (range/list/hash), composite indexes, and query optimization. Use when optimizing database performance, scaling databases, or reducing query times. Achieves 10-100x query performance improvements through strategic indexing and schema design.
---

# Schema Optimization

## Overview

Database schema optimization techniques including denormalization strategies, table partitioning, composite indexing, and query optimization. Provides dramatic performance improvements for high-traffic applications and large datasets.

**Goal**: 10-100x query performance improvement through strategic schema design

## When to Use This Skill

Use this skill when:
- Optimizing slow database queries
- Scaling databases for high traffic
- Implementing table partitioning for large tables
- Designing composite indexes
- Denormalizing for read-heavy workloads
- Migrating to sharded architecture
- Optimizing JOIN queries
- Reducing database costs through efficiency

**Triggers**: "database optimization", "slow queries", "indexing", "partitioning", "denormalization", "query performance", "database scaling"

---

## Quick Start: Optimization Strategy Decision Tree

### When to Use Indexing vs Denormalization vs Partitioning

**Indexes** (Fast Lookups):
- ✅ Frequently queried columns (WHERE, JOIN, ORDER BY)
- ✅ Unique constraints (email, username)
- ✅ Foreign keys (relationships)
- ✅ Composite indexes (multi-column queries)
- ✅ Best for: Read-heavy workloads, point lookups

**Denormalization** (Duplicate Data):
- ✅ Reduce JOIN overhead (copy data to avoid JOINs)
- ✅ Read-heavy workloads (99% reads, 1% writes)
- ✅ Calculated fields (totals, counts, aggregates)
- ✅ Best for: High-traffic read queries, reporting, dashboards

**Partitioning** (Split Tables):
- ✅ Very large tables (100M+ rows)
- ✅ Time-series data (partition by date)
- ✅ Multi-tenant data (partition by tenant_id)
- ✅ Archive old data (drop old partitions)
- ✅ Best for: Massive datasets, time-series, multi-tenancy

**Sharding** (Horizontal Scaling):
- ✅ Beyond single-server capacity
- ✅ Global distribution (geographic sharding)
- ✅ Tenant isolation (one shard per large customer)
- ✅ Best for: Massive scale, distributed systems

---

## Indexing Patterns

### 1. Single-Column Indexes

```sql
-- Index frequently queried columns
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- Unique index (constraint + index)
CREATE UNIQUE INDEX idx_users_username ON users (username);

-- Partial index (index subset of rows)
CREATE INDEX idx_active_users ON users (email)
WHERE deleted_at IS NULL;

-- Performance comparison
-- Without index: Sequential scan (1000ms)
-- With index: Index scan (10ms) → 100x faster
```

### 2. Composite Indexes (Multi-Column)

```sql
-- Index for multi-column queries
CREATE INDEX idx_users_status_created ON users (status, created_at DESC);

-- ✅ Good - Uses index
SELECT * FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Good - Uses index (leftmost prefix)
SELECT * FROM users WHERE status = 'active';

-- ❌ Bad - Doesn't use index (wrong column order)
SELECT * FROM users WHERE created_at > '2024-01-01';

-- Index column order matters:
-- 1. Equality filters first (status = 'active')
-- 2. Range filters second (created_at > '...')
-- 3. Sort columns last (ORDER BY created_at)
```

### 3. Covering Indexes (Index-Only Scans)

```sql
-- Include commonly selected columns in index
CREATE INDEX idx_users_email_name_created ON users (email) INCLUDE (name, created_at);

-- ✅ Good - Index-only scan (no table lookup)
SELECT name, created_at FROM users WHERE email = 'user@example.com';

-- Performance: Index-only scan is 2-5x faster than index + table lookup
```

### 4. Expression Indexes (Computed Columns)

```sql
-- Index on expression
CREATE INDEX idx_users_lower_email ON users (LOWER(email));

-- ✅ Uses index
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Full-text search index
CREATE INDEX idx_posts_content_fts ON posts USING GIN (to_tsvector('english', content));

-- ✅ Uses full-text index
SELECT * FROM posts WHERE to_tsvector('english', content) @@ to_tsquery('postgresql');
```

---

## Denormalization Patterns

### 1. Duplicate Foreign Key Data

```sql
-- ❌ Bad - Requires JOIN for every query
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  author_id INTEGER REFERENCES users(id)
);

-- Query requires JOIN
SELECT posts.*, users.name AS author_name
FROM posts
JOIN users ON users.id = posts.author_id;

-- ✅ Good - Denormalized (duplicate author_name)
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  author_id INTEGER REFERENCES users(id),
  author_name TEXT  -- Denormalized field
);

-- Query avoids JOIN (10x faster)
SELECT * FROM posts;

-- Trade-off: Must update author_name when user changes name
-- Solution: Use trigger to maintain consistency
CREATE OR REPLACE FUNCTION update_post_author_name()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET author_name = NEW.name
  WHERE author_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_on_user_name_change
AFTER UPDATE OF name ON users
FOR EACH ROW
EXECUTE FUNCTION update_post_author_name();
```

### 2. Pre-Calculated Aggregates

```sql
-- ❌ Bad - Calculate COUNT on every request
SELECT posts.*, COUNT(comments.id) AS comment_count
FROM posts
LEFT JOIN comments ON comments.post_id = posts.id
GROUP BY posts.id;

-- ✅ Good - Store comment_count in posts table
ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Update trigger to maintain count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Query is now simple (100x faster)
SELECT * FROM posts WHERE comment_count > 10;
```

### 3. Materialized Views (Pre-Computed Queries)

```sql
-- Create materialized view for expensive query
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  users.id,
  users.name,
  COUNT(DISTINCT posts.id) AS post_count,
  COUNT(DISTINCT comments.id) AS comment_count,
  MAX(posts.created_at) AS last_post_at
FROM users
LEFT JOIN posts ON posts.author_id = users.id
LEFT JOIN comments ON comments.author_id = users.id
GROUP BY users.id, users.name;

-- Create index on materialized view
CREATE INDEX idx_user_stats_id ON user_stats (id);

-- Query materialized view (instant results)
SELECT * FROM user_stats WHERE post_count > 100;

-- Refresh materialized view periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;

-- Schedule refresh with pg_cron or application cron job
-- Recommendation: Refresh every 5-60 minutes depending on requirements
```

---

## Partitioning Patterns

### 1. Range Partitioning (Time-Series Data)

```sql
-- Create partitioned table
CREATE TABLE orders (
  id BIGSERIAL,
  user_id INTEGER,
  total DECIMAL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions (one per quarter)
CREATE TABLE orders_2024_q1 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE orders_2024_q3 PARTITION OF orders
FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE orders_2024_q4 PARTITION OF orders
FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- Create indexes on each partition
CREATE INDEX idx_orders_2024_q1_user_id ON orders_2024_q1 (user_id);
CREATE INDEX idx_orders_2024_q2_user_id ON orders_2024_q2 (user_id);

-- Query automatically uses correct partition (partition pruning)
SELECT * FROM orders
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01';
-- Only scans orders_2024_q2 partition → Much faster

-- Archive old partitions
DETACH PARTITION orders_2024_q1; -- Remove from parent table
DROP TABLE orders_2024_q1; -- Or move to archive
```

### 2. List Partitioning (Categories)

```sql
-- Partition by region
CREATE TABLE sales (
  id BIGSERIAL,
  amount DECIMAL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  PRIMARY KEY (id, region)
) PARTITION BY LIST (region);

CREATE TABLE sales_us PARTITION OF sales FOR VALUES IN ('US');
CREATE TABLE sales_eu PARTITION OF sales FOR VALUES IN ('EU', 'UK', 'FR', 'DE');
CREATE TABLE sales_asia PARTITION OF sales FOR VALUES IN ('JP', 'CN', 'IN');

-- Query only scans relevant partition
SELECT * FROM sales WHERE region = 'US';
-- Only scans sales_us partition
```

### 3. Hash Partitioning (Distribute Load)

```sql
-- Partition by hash (distribute evenly)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT,
  name TEXT
) PARTITION BY HASH (id);

-- Create 4 partitions
CREATE TABLE users_p0 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE users_p1 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE users_p2 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE users_p3 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Rows distributed evenly across partitions
-- Good for load balancing, not for querying specific partitions
```

---

## Query Optimization

### 1. EXPLAIN ANALYZE (Query Planning)

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT posts.*, users.name AS author_name
FROM posts
JOIN users ON users.id = posts.author_id
WHERE posts.created_at > NOW() - INTERVAL '7 days'
ORDER BY posts.created_at DESC
LIMIT 10;

-- Output shows:
-- - Execution time
-- - Index usage (Seq Scan vs Index Scan)
-- - Join method (Nested Loop, Hash Join, Merge Join)
-- - Rows scanned vs rows returned

-- ❌ Bad - Sequential Scan (slow)
-- Seq Scan on posts  (cost=0.00..10000.00 rows=100000 width=100) (actual time=0.012..150.234 rows=100000 loops=1)

-- ✅ Good - Index Scan (fast)
-- Index Scan using idx_posts_created_at on posts  (cost=0.42..8.44 rows=10 width=100) (actual time=0.012..0.034 rows=10 loops=1)
```

### 2. N+1 Query Problem

```typescript
// ❌ Bad - N+1 queries (1 query + N queries for each post)
const posts = await db.post.findMany();
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } });
}
// Result: 1 + 100 = 101 queries for 100 posts

// ✅ Good - Single query with JOIN
const posts = await db.post.findMany({
  include: { author: true }
});
// Result: 1 query for 100 posts (100x faster)

// ✅ Good - Batch queries with DataLoader (see api-design skill)
const posts = await db.post.findMany();
const authors = await userLoader.loadMany(posts.map(p => p.authorId));
// Result: 2 queries total (1 for posts, 1 batched for users)
```

### 3. SELECT Only Needed Columns

```sql
-- ❌ Bad - Fetches all columns (slower, more memory)
SELECT * FROM users WHERE id = 123;

-- ✅ Good - Only fetch needed columns
SELECT id, name, email FROM users WHERE id = 123;

-- Performance impact:
-- 10 columns: 100% baseline
-- 3 columns: 30% of baseline (3.3x faster)
```

### 4. LIMIT with Pagination

```sql
-- ❌ Bad - OFFSET with large values is slow
SELECT * FROM posts
ORDER BY created_at DESC
OFFSET 10000 LIMIT 10;
-- Must scan 10,010 rows to skip first 10,000

-- ✅ Good - Cursor pagination (keyset pagination)
SELECT * FROM posts
WHERE created_at < '2024-01-15 10:30:00'  -- Last seen cursor
ORDER BY created_at DESC
LIMIT 10;
-- Only scans 10 rows using index
```

---

## Database Configuration

### 1. Connection Pooling

```typescript
import { Pool } from 'pg';

// ✅ Good - Connection pool (reuse connections)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'password',
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Reuse connections
const result = await pool.query('SELECT * FROM users WHERE id = $1', [123]);
```

### 2. PostgreSQL Tuning

```sql
-- Increase shared_buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '4GB';

-- Increase work_mem (for complex queries)
ALTER SYSTEM SET work_mem = '64MB';

-- Increase maintenance_work_mem (for VACUUM, INDEX creation)
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Enable query planning statistics
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;

-- Reload configuration
SELECT pg_reload_conf();
```

---

## Resources

### scripts/
- `analyze-slow-queries.js` - Find and analyze slow queries from logs
- `generate-indexes.js` - Suggest indexes based on query patterns

### references/
- `references/postgres-performance.md` - PostgreSQL tuning guide
- `references/partitioning-strategies.md` - When and how to partition tables
- `references/denormalization-patterns.md` - Safe denormalization techniques
- `references/index-types.md` - B-tree, Hash, GIN, GiST, BRIN indexes

### assets/
- `assets/query-examples/` - Optimized query templates
- `assets/monitoring-dashboards/` - Grafana dashboards for database metrics

## Related Skills

- `vector-databases` - pgvector index optimization (HNSW vs IVFFlat)
- `rls-policies` - Performance impact of RLS policies
- `api-design` - N+1 query prevention with DataLoader
- `edge-databases` - Read replicas and connection pooling
