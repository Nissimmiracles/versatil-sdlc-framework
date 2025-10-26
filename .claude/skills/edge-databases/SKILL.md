---
name: edge-databases
description: Edge database patterns using Supabase Edge Functions, Cloudflare D1, and read replicas for globally distributed, low-latency data access. Use when building apps requiring <100ms database queries worldwide. Optimizes for edge caching, connection pooling, and geo-distribution. Best for user-facing applications with global audiences.
---

# Edge Databases

## Overview

Edge database patterns for globally distributed, low-latency data access using Supabase Edge Functions, Cloudflare D1, read replicas, and edge caching strategies. Enables <100ms database queries from anywhere in the world.

**Goal**: Sub-100ms database access globally through edge computing and strategic data distribution

## When to Use This Skill

Use this skill when:
- Building global applications with users worldwide
- Reducing database latency from 200-500ms to <100ms
- Scaling read-heavy workloads (10:1 read/write ratio or higher)
- Implementing edge authentication and authorization
- Processing user requests at the edge (closest to user)
- Reducing backend server costs with edge caching
- Building real-time collaborative applications
- Serving static + dynamic content from the edge

**Triggers**: "edge database", "read replicas", "global distribution", "low latency", "edge functions", "D1", "edge caching"

---

## Quick Start: Architecture Decision Tree

### When to Use Each Pattern

**Supabase Edge Functions + Postgres**:
- ✅ Full PostgreSQL compatibility (relationships, transactions)
- ✅ RLS (Row-Level Security) at edge
- ✅ Real-time subscriptions
- ✅ Built-in auth integration
- ✅ Best for: PostgreSQL apps, multi-tenant SaaS, real-time features

**Cloudflare D1 (SQLite at Edge)**:
- ✅ SQLite at every edge location (200+ cities)
- ✅ Zero cold starts (<1ms queries)
- ✅ Global replication (eventual consistency)
- ✅ Best for: Read-heavy apps, static + dynamic content, low-cost scaling

**PlanetScale (MySQL at Edge)**:
- ✅ MySQL compatibility
- ✅ Branching (database per feature branch)
- ✅ Global read replicas
- ✅ Best for: MySQL apps, team collaboration, schema changes

**Vercel Postgres (Neon)**:
- ✅ Serverless PostgreSQL
- ✅ Auto-scaling (scale to zero)
- ✅ Branching for preview deployments
- ✅ Best for: Next.js apps, Vercel ecosystem

**Read Replicas + Edge Cache**:
- ✅ Traditional databases (PostgreSQL, MySQL)
- ✅ Replicas in multiple regions
- ✅ Edge caching (Redis, Cloudflare KV)
- ✅ Best for: Existing apps, gradual migration

---

## Supabase Edge Functions

### 1. Basic Edge Function with Postgres

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Query runs from edge (closest to user)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ users: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 2. Edge Function with RLS (Row-Level Security)

```typescript
// Edge function with user authentication
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Get JWT from Authorization header
  const authHeader = req.headers.get('Authorization')?.split(' ')[1];

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: `Bearer ${authHeader}` }
      }
    }
  );

  // RLS policies automatically applied based on JWT
  const { data: userPosts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  return new Response(JSON.stringify({ posts: userPosts }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 3. Edge Function with Connection Pooling

```typescript
// Optimize for high concurrency - connection pooling
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

// Create pool outside handler - reused across invocations
const pool = new Pool({
  user: Deno.env.get('DB_USER'),
  password: Deno.env.get('DB_PASSWORD'),
  database: Deno.env.get('DB_NAME'),
  hostname: Deno.env.get('DB_HOST'),
  port: 5432,
  tls: { enabled: true }
}, 3);  // Max 3 connections per isolate

serve(async (req) => {
  const client = await pool.connect();

  try {
    const result = await client.queryObject`
      SELECT * FROM users WHERE active = true
    `;

    return new Response(JSON.stringify({ users: result.rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    client.release();
  }
});
```

### 4. Edge Function with Caching

```typescript
// Edge caching with Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cache = new Map();

serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const cacheKey = `user:${userId}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return new Response(JSON.stringify({ user: cached.data, cached: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Cache miss - query database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return new Response(JSON.stringify({ user: data, cached: false }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## Cloudflare D1 (SQLite at Edge)

### 1. Basic D1 Query

```typescript
// Cloudflare Worker with D1 database
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/users') {
      // Query runs at edge (200+ locations)
      const { results } = await env.DB.prepare(
        'SELECT * FROM users WHERE active = 1 LIMIT 10'
      ).all();

      return Response.json({ users: results });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

### 2. D1 with Prepared Statements

```typescript
// Secure queries with prepared statements (prevents SQL injection)
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    // Prepared statement - safe from SQL injection
    const stmt = env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId);
    const user = await stmt.first();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  }
};
```

### 3. D1 Batch Operations

```typescript
// Batch writes for better performance
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST') {
      const { users } = await request.json();

      // Batch insert - single round trip
      const results = await env.DB.batch([
        ...users.map((user: any) =>
          env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind(
            user.name,
            user.email
          )
        )
      ]);

      return Response.json({
        inserted: results.length,
        results
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
```

### 4. D1 Migrations

```sql
-- migrations/0001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- migrations/0002_create_posts.sql
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
```

```bash
# Apply migrations
wrangler d1 migrations apply my-database --remote

# Rollback
wrangler d1 execute my-database --file=migrations/rollback.sql --remote
```

---

## Read Replicas Pattern

### 1. PostgreSQL Read Replicas

```typescript
// Primary + read replicas with automatic routing
import { Pool } from 'pg';

// Primary database (writes)
const primaryPool = new Pool({
  host: 'primary.db.example.com',
  database: 'myapp',
  user: 'app_user',
  password: process.env.DB_PASSWORD,
  max: 20
});

// Read replicas (reads) - geographically distributed
const replicaPools = {
  'us-east': new Pool({
    host: 'replica-us-east.db.example.com',
    database: 'myapp',
    user: 'app_user',
    password: process.env.DB_PASSWORD,
    max: 50
  }),
  'eu-west': new Pool({
    host: 'replica-eu-west.db.example.com',
    database: 'myapp',
    user: 'app_user',
    password: process.env.DB_PASSWORD,
    max: 50
  }),
  'ap-south': new Pool({
    host: 'replica-ap-south.db.example.com',
    database: 'myapp',
    user: 'app_user',
    password: process.env.DB_PASSWORD,
    max: 50
  })
};

// Auto-route based on region
export function getDbPool(operation: 'read' | 'write', region?: string) {
  if (operation === 'write') {
    return primaryPool;
  }

  // Read from nearest replica
  const replicaRegion = region || process.env.AWS_REGION || 'us-east';
  const pool = replicaPools[replicaRegion] || replicaPools['us-east'];
  return pool;
}

// Usage
export async function getUser(userId: string, region?: string) {
  const pool = getDbPool('read', region);
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}

export async function updateUser(userId: string, data: any) {
  const pool = getDbPool('write');
  const result = await pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
    [data.name, data.email, userId]
  );
  return result.rows[0];
}
```

### 2. Replica Lag Handling

```typescript
// Handle replication lag gracefully
import { Pool } from 'pg';

interface WriteResult {
  data: any;
  version: number;  // Timestamp or version number
}

// Write to primary and return version
export async function createPost(userId: string, title: string): Promise<WriteResult> {
  const pool = getDbPool('write');
  const result = await pool.query(
    `INSERT INTO posts (user_id, title, created_at)
     VALUES ($1, $2, NOW())
     RETURNING *, EXTRACT(EPOCH FROM created_at) as version`,
    [userId, title]
  );

  return {
    data: result.rows[0],
    version: result.rows[0].version
  };
}

// Read from replica with version check
export async function getPost(postId: string, minVersion?: number, region?: string) {
  const pool = getDbPool('read', region);

  if (minVersion) {
    // Wait for replica to catch up (max 5 seconds)
    for (let i = 0; i < 10; i++) {
      const result = await pool.query(
        `SELECT *, EXTRACT(EPOCH FROM created_at) as version
         FROM posts WHERE id = $1`,
        [postId]
      );

      if (result.rows[0] && result.rows[0].version >= minVersion) {
        return result.rows[0];
      }

      // Replica lagging - wait 500ms and retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Fallback to primary if replica too slow
    console.warn('Replica lag too high, reading from primary');
    const primaryPool = getDbPool('write');
    const result = await primaryPool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    return result.rows[0];
  }

  // No version check - allow stale data
  const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
  return result.rows[0];
}
```

---

## Edge Caching Strategies

### 1. Redis at Edge (Upstash)

```typescript
// Upstash Redis - globally distributed
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export async function getUserCached(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    return cached;
  }

  // Cache miss - query database
  const user = await db.users.findUnique({ where: { id: userId } });

  // Cache for 1 hour
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  return user;
}

// Invalidate cache on write
export async function updateUserCached(userId: string, data: any) {
  const user = await db.users.update({
    where: { id: userId },
    data
  });

  // Update cache
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  return user;
}
```

### 2. Cloudflare KV (Key-Value Store)

```typescript
// Cloudflare KV - edge caching with eventual consistency
interface Env {
  USER_CACHE: KVNamespace;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Try KV cache first (edge - <1ms)
    const cached = await env.USER_CACHE.get(`user:${userId}`, { type: 'json' });
    if (cached) {
      return Response.json({ user: cached, cached: true });
    }

    // Cache miss - query D1 database
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();

    // Cache in KV (60s TTL)
    await env.USER_CACHE.put(`user:${userId}`, JSON.stringify(user), {
      expirationTtl: 60
    });

    return Response.json({ user, cached: false });
  }
};
```

### 3. Stale-While-Revalidate Pattern

```typescript
// Next.js Edge API with SWR caching
export const runtime = 'edge';

import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const cacheKey = `user:${userId}`;

  // Get from cache
  const cached = await kv.get(cacheKey);

  if (cached) {
    // Serve cached data immediately
    const response = Response.json({ user: cached, cached: true });

    // Revalidate in background (non-blocking)
    revalidateUser(userId, cacheKey);

    return response;
  }

  // Cache miss - fetch and cache
  const user = await fetchUser(userId);
  await kv.setex(cacheKey, 3600, JSON.stringify(user));

  return Response.json({ user, cached: false });
}

// Background revalidation
async function revalidateUser(userId: string, cacheKey: string) {
  try {
    const user = await fetchUser(userId);
    await kv.setex(cacheKey, 3600, JSON.stringify(user));
  } catch (error) {
    console.error('Revalidation failed:', error);
  }
}
```

---

## Multi-Region Deployment

### 1. Fly.io Multi-Region Postgres

```toml
# fly.toml - Deploy to multiple regions
app = "myapp"
primary_region = "iad"  # US East (primary)

[env]
  DATABASE_URL = "postgresql://..."

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

# Read replicas in multiple regions
[[services.regions]]
  region = "iad"  # US East (primary)

[[services.regions]]
  region = "lhr"  # London

[[services.regions]]
  region = "syd"  # Sydney
```

### 2. PlanetScale Global Reads

```typescript
// PlanetScale - automatic read routing
import { connect } from '@planetscale/database';

const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD
};

// Connects to nearest replica automatically
const conn = connect(config);

export async function getUsers() {
  // Reads from nearest replica
  const results = await conn.execute('SELECT * FROM users');
  return results.rows;
}

export async function createUser(name: string, email: string) {
  // Writes go to primary
  const results = await conn.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );
  return results.insertId;
}
```

---

## Performance Optimization

### 1. Connection Pooling

```typescript
// Supabase with Supavisor (connection pooler)
import { createClient } from '@supabase/supabase-js';

// Use transaction mode for short-lived connections
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-connection-mode': 'transaction'  // Pool connections
      }
    }
  }
);

// Session mode for long-lived connections (edge functions)
const supabaseSession = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      headers: {
        'x-connection-mode': 'session'
      }
    }
  }
);
```

### 2. Query Optimization for Edge

```typescript
// Optimize queries for edge latency
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// BAD: Multiple round trips
async function getUserWithPostsBad(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);

  return { user, posts };  // 2 round trips!
}

// GOOD: Single round trip with join
async function getUserWithPostsGood(userId: string) {
  const { data } = await supabase
    .from('users')
    .select(`
      *,
      posts (*)
    `)
    .eq('id', userId)
    .single();

  return data;  // 1 round trip!
}
```

### 3. Materialized Views for Edge

```sql
-- Create materialized view for frequently accessed data
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id,
  u.name,
  COUNT(p.id) as post_count,
  MAX(p.created_at) as last_post_at
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, u.name;

CREATE INDEX idx_user_stats_id ON user_stats(id);

-- Refresh periodically (cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

```typescript
// Query materialized view at edge - blazing fast!
const { data } = await supabase
  .from('user_stats')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## Resources

### scripts/
- `setup-read-replicas.sh` - Configure PostgreSQL read replicas
- `deploy-edge-function.sh` - Deploy Supabase/Cloudflare edge functions

### references/
- `references/edge-db-comparison.md` - D1 vs Supabase vs PlanetScale
- `references/replication-lag.md` - Handling eventual consistency
- `references/edge-caching.md` - Caching strategies for edge

### assets/
- `assets/edge-configs/` - Edge function configuration examples
- `assets/migration-scripts/` - D1/Supabase migration scripts

## Related Skills

- `serverless` - Serverless functions at the edge
- `rls-policies` - Row-Level Security for multi-tenant edge apps
- `schema-optimization` - Database schema design for edge performance
