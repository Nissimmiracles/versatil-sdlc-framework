# Skill Combination Guide

## Overview

This guide demonstrates how to combine multiple VERSATIL skills for common real-world use cases. Each use case includes architecture diagrams, integration patterns, code examples, and testing strategies.

**Key Benefits**:
- Proven architectural patterns for common scenarios
- Complete code examples showing skill integration
- Performance optimization strategies
- Testing patterns for combined systems
- Decision trees for when to use specific combinations

---

## Use Case 1: Multi-Tenant SaaS Application

### Skills Required

**Primary Skills**:
- `rls-policies` - Automatic tenant isolation at database layer
- `auth-security` - OAuth2/JWT authentication with RBAC
- `testing-strategies` - Tenant isolation tests + E2E security tests
- `api-design` - REST/GraphQL APIs with tenant context

**Supporting Skills**:
- `schema-optimization` - Indexes for multi-tenant queries
- `edge-databases` - Global distribution with tenant data isolation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  (React + TanStack Query + Zustand for UI state)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JWT (org_id claim)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Edge                        │
│  - JWT Verification (auth-security)                         │
│  - Rate Limiting per tenant                                 │
│  - CORS, CSP headers                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Authenticated Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  - Express/tRPC API (api-design)                            │
│  - Request validation (Zod schemas)                         │
│  - Organization context extraction                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Query with org context
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  - PostgreSQL with RLS (rls-policies)                       │
│  - Automatic tenant filtering                               │
│  - Composite indexes: (org_id, created_at)                  │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Database Schema with RLS

```sql
-- Enable RLS on all tenant-scoped tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access projects from their organization
CREATE POLICY tenant_isolation ON projects
FOR ALL
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));

-- Composite index for multi-tenant queries
CREATE INDEX idx_projects_org_created ON projects (organization_id, created_at DESC);
```

#### 2. JWT Authentication with Organization Context

```typescript
// auth-security: JWT generation with org_id claim
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
}

function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    organizationId: user.organization_id,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  });
}

// Middleware to extract org context
function extractOrgContext(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Add to request context
    req.user = {
      id: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### 3. API Design with Tenant Context

```typescript
// api-design: tRPC router with automatic tenant filtering
import { router, protectedProcedure } from './trpc';
import { z } from 'zod';

export const projectRouter = router({
  // List projects (automatically filtered by RLS)
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20)
    }))
    .query(async ({ input, ctx }) => {
      // RLS automatically filters by organization_id
      const projects = await ctx.db.project.findMany({
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { created_at: 'desc' }
      });

      return projects;
    }),

  // Create project (org_id from JWT)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.project.create({
        data: {
          name: input.name,
          organization_id: ctx.user.organizationId
        }
      });
    })
});
```

#### 4. Testing Tenant Isolation

```typescript
// testing-strategies: Automated tenant isolation tests
import { test, expect } from 'vitest';
import { createTestUser, createTestProject } from './test-utils';

test('users can only access their own organization data', async () => {
  // Create two organizations
  const org1 = await db.organization.create({ data: { name: 'Org 1' } });
  const org2 = await db.organization.create({ data: { name: 'Org 2' } });

  // Create users in each org
  const user1 = await createTestUser({ organizationId: org1.id });
  const user2 = await createTestUser({ organizationId: org2.id });

  // Create projects for each org
  const project1 = await createTestProject({ organizationId: org1.id });
  const project2 = await createTestProject({ organizationId: org2.id });

  // Authenticate as user1
  const token1 = generateAccessToken(user1);

  // Query projects - should only see org1's projects
  const response1 = await fetch('/api/projects', {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const data1 = await response1.json();

  expect(data1).toHaveLength(1);
  expect(data1[0].id).toBe(project1.id);
  expect(data1[0].organization_id).toBe(org1.id);

  // Authenticate as user2
  const token2 = generateAccessToken(user2);

  // Query projects - should only see org2's projects
  const response2 = await fetch('/api/projects', {
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  const data2 = await response2.json();

  expect(data2).toHaveLength(1);
  expect(data2[0].id).toBe(project2.id);
  expect(data2[0].organization_id).toBe(org2.id);
});

// Playwright E2E test for tenant isolation
test('tenant isolation in UI', async ({ page }) => {
  // Login as org1 user
  await page.goto('/login');
  await page.fill('[name="email"]', 'user1@org1.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  // Verify only org1 projects are visible
  const projects = await page.locator('[data-testid="project-card"]').all();
  for (const project of projects) {
    const orgName = await project.locator('[data-testid="org-name"]').textContent();
    expect(orgName).toBe('Org 1');
  }

  // Attempt to directly access org2 project (should fail)
  await page.goto('/projects/org2-project-id');
  await expect(page.locator('text=404')).toBeVisible();
});
```

### Performance Considerations

1. **Index Strategy**: Composite indexes on `(organization_id, created_at)` for efficient multi-tenant queries
2. **Connection Pooling**: Use Supavisor or PgBouncer for connection management
3. **RLS Performance**: Cache `current_setting()` values to avoid repeated function calls
4. **Query Optimization**: Always include `organization_id` in WHERE clauses for partition pruning

### Security Checklist

- ✅ RLS enabled on all tenant-scoped tables
- ✅ JWT includes `organization_id` claim
- ✅ API validates organization context on every request
- ✅ Composite indexes include `organization_id` as first column
- ✅ E2E tests verify tenant isolation
- ✅ Rate limiting per organization
- ✅ Audit logging includes organization context

---

## Use Case 2: Global E-Commerce Platform

### Skills Required

**Primary Skills**:
- `edge-databases` - Global read replicas + edge caching
- `serverless` - Edge functions for low-latency API responses
- `microservices` - Independent services for catalog, cart, checkout
- `schema-optimization` - Denormalization for fast product queries

**Supporting Skills**:
- `api-design` - GraphQL federation for unified API
- `testing-strategies` - E2E tests with Playwright across regions
- `state-management` - TanStack Query for server state caching

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      Global CDN Layer                          │
│  - Cloudflare/Vercel Edge Functions (serverless)             │
│  - Static assets cached globally                              │
│  - Edge caching (KV/Redis) for product data                   │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Region-aware routing
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Regional API Gateways                         │
│  - US-East, EU-West, AP-South                                  │
│  - GraphQL Federation (api-design)                             │
└────┬──────────────┬──────────────┬──────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌──────────┐
│ Catalog │   │  Cart   │   │ Checkout │  (microservices)
│ Service │   │ Service │   │ Service  │
└────┬────┘   └────┬────┘   └────┬─────┘
     │              │              │
     │              │              │ Write to primary
     ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                                │
│  - Primary DB (US-East) - Writes only                           │
│  - Read Replicas (EU-West, AP-South) - Reads only              │
│  - Materialized views for product catalog                       │
│  - Denormalized product data (pre-computed)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Edge Function for Product Catalog

```typescript
// serverless + edge-databases: Product catalog at the edge
export const runtime = 'edge';

import { kv } from '@vercel/kv';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const cacheKey = `products:category:${category}`;

  // 1. Try edge cache first (KV store - <10ms)
  const cached = await kv.get(cacheKey);
  if (cached) {
    return Response.json({ products: cached, source: 'edge-cache' });
  }

  // 2. Query nearest read replica (schema-optimization: materialized view)
  const { rows } = await sql`
    SELECT id, name, price, image_url, rating, stock
    FROM product_catalog_mv
    WHERE category = ${category}
    ORDER BY popularity_score DESC
    LIMIT 50
  `;

  // 3. Cache for 5 minutes
  await kv.setex(cacheKey, 300, JSON.stringify(rows));

  return Response.json({
    products: rows,
    source: 'database',
    region: process.env.VERCEL_REGION
  });
}
```

#### 2. Denormalized Product Schema

```sql
-- schema-optimization: Denormalized product catalog
CREATE MATERIALIZED VIEW product_catalog_mv AS
SELECT
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.category,
  p.stock,
  COALESCE(AVG(r.rating), 0) AS rating,
  COUNT(r.id) AS review_count,
  -- Pre-computed popularity score
  (COUNT(DISTINCT o.id) * 0.7 + COALESCE(AVG(r.rating), 0) * 0.3) AS popularity_score
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
WHERE p.active = true
GROUP BY p.id, p.name, p.description, p.price, p.image_url, p.category, p.stock;

-- Index for fast category filtering
CREATE INDEX idx_product_catalog_category ON product_catalog_mv (category, popularity_score DESC);

-- Refresh every 10 minutes (background job)
REFRESH MATERIALIZED VIEW CONCURRENTLY product_catalog_mv;
```

#### 3. Microservices with GraphQL Federation

```typescript
// api-design: GraphQL federation for unified API

// Catalog service schema
const typeDefs = gql`
  extend type Query {
    products(category: String, limit: Int = 50): [Product!]!
    product(id: ID!): Product
  }

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    price: Float!
    category: String!
    rating: Float!
    reviews: [Review!]!
  }
`;

// Cart service schema
const typeDefs = gql`
  extend type Query {
    cart: Cart!
  }

  extend type Product @key(fields: "id") {
    id: ID! @external
  }

  type Cart {
    items: [CartItem!]!
    total: Float!
  }

  type CartItem {
    product: Product!
    quantity: Int!
  }

  type Mutation {
    addToCart(productId: ID!, quantity: Int!): Cart!
  }
`;

// Apollo Gateway - Combines all services
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'catalog', url: 'https://catalog-service.com/graphql' },
      { name: 'cart', url: 'https://cart-service.com/graphql' },
      { name: 'checkout', url: 'https://checkout-service.com/graphql' }
    ]
  })
});

// Client query spans multiple services
const QUERY = gql`
  query ProductPage($id: ID!) {
    product(id: $id) {           # Catalog service
      name
      price
      rating
      reviews { text rating }     # Catalog service
    }
    cart {                        # Cart service
      items {
        product { name }
        quantity
      }
      total
    }
  }
`;
```

#### 4. Read Replica Routing

```typescript
// edge-databases: Auto-route reads to nearest replica
import { Pool } from 'pg';

const replicaPools = {
  'us-east': new Pool({ host: 'replica-us-east.db.com', max: 50 }),
  'eu-west': new Pool({ host: 'replica-eu-west.db.com', max: 50 }),
  'ap-south': new Pool({ host: 'replica-ap-south.db.com', max: 50 })
};

const primaryPool = new Pool({ host: 'primary.db.com', max: 20 });

export function getDbPool(operation: 'read' | 'write', region?: string) {
  if (operation === 'write') {
    return primaryPool;
  }

  // Read from nearest replica based on edge region
  const replicaRegion = region || process.env.VERCEL_REGION || 'us-east';
  return replicaPools[replicaRegion] || replicaPools['us-east'];
}

// Usage in edge function
export async function GET(request: Request) {
  const pool = getDbPool('read', request.headers.get('x-vercel-region'));
  const result = await pool.query('SELECT * FROM product_catalog_mv WHERE category = $1', ['electronics']);
  return Response.json(result.rows);
}
```

### Performance Optimizations

1. **Edge Caching**: 90%+ cache hit rate for product catalog (reduces DB load by 10x)
2. **Materialized Views**: Pre-computed aggregates (rating, review_count) → 50x faster queries
3. **Read Replicas**: <100ms query latency globally (vs 300-500ms single region)
4. **Denormalization**: Avoid JOINs for product queries (10x faster)
5. **Connection Pooling**: Reuse connections across edge function invocations

### Testing Strategy

```typescript
// testing-strategies: E2E test with Playwright across regions
import { test, expect } from '@playwright/test';

test('product search performance across regions', async ({ page }) => {
  // Test from multiple regions
  const regions = ['us-east', 'eu-west', 'ap-south'];

  for (const region of regions) {
    // Set region header
    await page.setExtraHTTPHeaders({ 'x-test-region': region });

    const startTime = Date.now();

    await page.goto('/products?category=electronics');

    // Products should load in <200ms
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 200 });

    const loadTime = Date.now() - startTime;
    console.log(`${region}: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(200); // Verify low latency
  }
});

test('cart persistence across page reloads', async ({ page }) => {
  // Add items to cart
  await page.goto('/products/123');
  await page.click('button[data-testid="add-to-cart"]');

  // Reload page
  await page.reload();

  // Cart should persist
  const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
  expect(cartCount).toBe('1');
});
```

---

## Use Case 3: Large-Scale Enterprise Dashboard

### Skills Required

**Primary Skills**:
- `micro-frontends` - Module Federation for independent team deployments
- `state-management` - Zustand for UI state + TanStack Query for server data
- `vector-databases` - Semantic search over documentation/analytics
- `styling-architecture` - Design system with CSS-in-JS (Emotion/Styled Components)

**Supporting Skills**:
- `api-design` - GraphQL for flexible data fetching
- `testing-strategies` - Component testing + visual regression
- `performance-optimization` - Code splitting, lazy loading

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       Shell Application                        │
│  - React 18 + Module Federation host                          │
│  - Shared design system (styling-architecture)                │
│  - Shared state (Zustand) + shared eventBus                   │
└────┬──────────────┬──────────────┬──────────────────────────────┘
     │              │              │
     │ remoteEntry.js loads
     ▼              ▼              ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│Analytics│   │ Reports  │   │  Search  │  (micro-frontends)
│  Team   │   │   Team   │   │   Team   │  - Independent deploys
└────┬────┘   └────┬─────┘   └────┬─────┘  - Different React versions OK
     │              │              │
     │ GraphQL queries (api-design)
     ▼              ▼              ▼
┌───────────────────────────────────────────────────────────────┐
│                    API Gateway (GraphQL)                       │
│  - Schema stitching                                            │
│  - DataLoader (N+1 prevention)                                 │
└────┬──────────────┬──────────────┬──────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│PostgreSQL│   │  Redis   │   │ pgvector DB  │  (vector-databases)
│(metrics) │   │ (cache)  │   │(semantic search)
└──────────┘   └──────────┘   └──────────────┘
```

### Implementation

#### 1. Micro-Frontend Setup (Module Federation)

```javascript
// Shell app: webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        analytics: 'analytics@https://cdn.example.com/analytics/remoteEntry.js',
        reports: 'reports@https://cdn.example.com/reports/remoteEntry.js',
        search: 'search@https://cdn.example.com/search/remoteEntry.js'
      },
      exposes: {
        './store': './src/store',
        './eventBus': './src/eventBus',
        './designSystem': './src/designSystem'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@emotion/react': { singleton: true },
        zustand: { singleton: true }
      }
    })
  ]
};

// Shell app: Load micro-frontends dynamically
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const AnalyticsDashboard = lazy(() => import('analytics/Dashboard'));
const ReportsPage = lazy(() => import('reports/ReportsPage'));
const SearchPage = lazy(() => import('search/SearchPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Skeleton />}>
        <Routes>
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

#### 2. Shared State Management

```typescript
// state-management: Shell exposes shared store
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DashboardStore {
  user: User | null;
  theme: 'light' | 'dark';
  selectedOrganization: string | null;
  setUser: (user: User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setOrganization: (orgId: string) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        theme: 'light',
        selectedOrganization: null,
        setUser: (user) => set({ user }),
        setTheme: (theme) => set({ theme }),
        setOrganization: (orgId) => set({ selectedOrganization: orgId })
      }),
      { name: 'dashboard-storage' }
    )
  )
);

// Micro-frontend imports shared store
import { useDashboardStore } from 'shell/store';

function AnalyticsWidget() {
  const organization = useDashboardStore(state => state.selectedOrganization);
  const theme = useDashboardStore(state => state.theme);

  const { data } = useQuery({
    queryKey: ['analytics', organization],
    queryFn: () => fetchAnalytics(organization)
  });

  return <Chart data={data} theme={theme} />;
}
```

#### 3. Semantic Search with pgvector

```typescript
// vector-databases: Semantic search over dashboard documentation
import OpenAI from 'openai';
import { sql } from '@vercel/postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Store documentation with embeddings
async function indexDocumentation(title: string, content: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: content
  });

  const embedding = response.data[0].embedding;

  await sql`
    INSERT INTO documentation (title, content, embedding)
    VALUES (${title}, ${content}, ${embedding})
  `;
}

// Search documentation
async function searchDocs(query: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const queryEmbedding = response.data[0].embedding;

  const { rows } = await sql`
    SELECT title, content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM documentation
    WHERE 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  return rows;
}

// Search micro-frontend
function SearchPage() {
  const [query, setQuery] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchDocs(query),
    enabled: query.length > 2
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documentation..."
      />
      {isLoading && <Spinner />}
      {results?.map(doc => (
        <SearchResult key={doc.title} {...doc} />
      ))}
    </div>
  );
}
```

#### 4. Shared Design System

```typescript
// styling-architecture: Shared design system with Emotion
import { css } from '@emotion/react';
import styled from '@emotion/styled';

// Theme
export const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px'
  }
};

// Button component (exported from shell)
export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => theme.spacing.md};
  background: ${props => theme.colors[props.variant || 'primary']};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

// Micro-frontend uses shared design system
import { Button, theme } from 'shell/designSystem';

function ReportsPage() {
  return (
    <div>
      <h1>Reports</h1>
      <Button variant="primary" onClick={() => generateReport()}>
        Generate Report
      </Button>
    </div>
  );
}
```

### Testing Strategy

```typescript
// testing-strategies: Component testing + visual regression
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { AnalyticsWidget } from './AnalyticsWidget';

test('renders analytics widget with data', async () => {
  render(<AnalyticsWidget organizationId="org-123" />);

  // Wait for data to load
  await screen.findByText('Analytics Dashboard');

  // Verify chart is rendered
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});

// Visual regression test with Playwright
import { test, expect } from '@playwright/test';

test('analytics dashboard visual regression', async ({ page }) => {
  await page.goto('/analytics');

  // Wait for charts to render
  await page.waitForSelector('[data-testid="chart"]');

  // Take screenshot
  await expect(page).toHaveScreenshot('analytics-dashboard.png');
});

// Test micro-frontend integration
test('micro-frontends share state correctly', async ({ page }) => {
  await page.goto('/analytics');

  // Change organization in dropdown
  await page.selectOption('select[name="organization"]', 'org-456');

  // Navigate to reports
  await page.click('a[href="/reports"]');

  // Verify organization selection persisted
  const selectedOrg = await page.inputValue('select[name="organization"]');
  expect(selectedOrg).toBe('org-456');
});
```

### Performance Optimizations

1. **Code Splitting**: Each micro-frontend loaded on demand (lazy loading)
2. **Shared Dependencies**: React, Emotion loaded once (singleton pattern)
3. **TanStack Query**: Aggressive caching reduces API calls by 80%
4. **Vector Search**: HNSW index for <10ms semantic search queries
5. **Materialized Views**: Pre-computed analytics → 50x faster dashboards

---

## Use Case 4: Real-Time Collaborative App

### Skills Required

**Primary Skills**:
- `serverless` - Edge functions for WebSocket connections
- `edge-databases` - Low-latency reads with Supabase Edge Functions
- `microservices` - Event-driven architecture with Kafka/RabbitMQ
- `testing-strategies` - E2E tests for real-time features

**Supporting Skills**:
- `state-management` - Optimistic updates with TanStack Query
- `api-design` - GraphQL subscriptions for real-time data

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       Client (React)                           │
│  - WebSocket connection to edge                                │
│  - Optimistic updates (state-management)                       │
│  - Conflict resolution (last-write-wins or CRDT)              │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ WebSocket (serverless)
                     ▼
┌───────────────────────────────────────────────────────────────┐
│              Edge Functions (Cloudflare Workers)               │
│  - Durable Objects for WebSocket rooms                        │
│  - Broadcast updates to connected clients                      │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Publish events
                     ▼
┌───────────────────────────────────────────────────────────────┐
│                  Event Bus (Kafka/Redis)                       │
│  - Pub/sub for real-time updates                              │
│  - Event sourcing for audit trail                             │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Persist changes
                     ▼
┌───────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                         │
│  - PostgreSQL for document storage                            │
│  - Realtime subscriptions (edge-databases)                    │
└───────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. WebSocket with Durable Objects

```typescript
// serverless: Cloudflare Worker with Durable Objects for WebSocket rooms
export class DocumentRoom {
  state: DurableObjectState;
  sessions: Map<string, WebSocket>;
  document: any;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());

      const userId = new URL(request.url).searchParams.get('userId');

      // Add to active sessions
      this.sessions.set(userId!, server);
      server.accept();

      // Handle incoming messages
      server.addEventListener('message', async (event) => {
        const message = JSON.parse(event.data as string);

        if (message.type === 'update') {
          // Broadcast update to all clients except sender
          for (const [id, session] of this.sessions) {
            if (id !== userId) {
              session.send(JSON.stringify({
                type: 'update',
                userId,
                changes: message.changes
              }));
            }
          }

          // Persist to database
          await this.persistChanges(message.changes);
        }
      });

      server.addEventListener('close', () => {
        this.sessions.delete(userId!);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async persistChanges(changes: any) {
    // Persist to Supabase
    await fetch(process.env.SUPABASE_URL + '/rest/v1/documents', {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ changes })
    });
  }
}
```

#### 2. Optimistic Updates with TanStack Query

```typescript
// state-management: Optimistic updates for instant feedback
import { useMutation, useQueryClient } from '@tanstack/react-query';

function DocumentEditor({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient();
  const ws = useWebSocket(`wss://api.example.com/rooms/${documentId}`);

  // Optimistic update mutation
  const updateDocument = useMutation({
    mutationFn: async (changes: any) => {
      // Send via WebSocket
      ws.send(JSON.stringify({ type: 'update', changes }));

      // Also persist via HTTP (fallback)
      return fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
    },
    onMutate: async (changes) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['document', documentId] });

      // Snapshot previous value
      const previousDoc = queryClient.getQueryData(['document', documentId]);

      // Optimistically update
      queryClient.setQueryData(['document', documentId], (old: any) => ({
        ...old,
        content: applyChanges(old.content, changes)
      }));

      return { previousDoc };
    },
    onError: (err, changes, context) => {
      // Rollback on error
      queryClient.setQueryData(['document', documentId], context?.previousDoc);
    },
    onSuccess: () => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  // Listen for remote updates via WebSocket
  useEffect(() => {
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'update') {
        // Apply remote changes to local state
        queryClient.setQueryData(['document', documentId], (old: any) => ({
          ...old,
          content: applyChanges(old.content, message.changes)
        }));
      }
    };
  }, [ws, documentId]);

  return (
    <Editor
      value={document.content}
      onChange={(changes) => updateDocument.mutate(changes)}
    />
  );
}
```

#### 3. Event-Driven Architecture with Kafka

```typescript
// microservices: Kafka for event sourcing
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'document-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'document-updates' });

// Publish document update event
async function publishDocumentUpdate(documentId: string, changes: any) {
  await producer.send({
    topic: 'document.updated',
    messages: [{
      key: documentId,
      value: JSON.stringify({
        documentId,
        changes,
        timestamp: new Date().toISOString()
      })
    }]
  });
}

// Consume events for audit trail / analytics
async function startConsumer() {
  await consumer.subscribe({ topic: 'document.updated' });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const update = JSON.parse(message.value!.toString());

      // Store in audit log
      await db.auditLog.create({
        data: {
          documentId: update.documentId,
          changes: update.changes,
          timestamp: update.timestamp
        }
      });
    }
  });
}
```

#### 4. Testing Real-Time Features

```typescript
// testing-strategies: E2E test for real-time collaboration
import { test, expect } from '@playwright/test';

test('real-time collaboration between two users', async ({ browser }) => {
  // Create two browser contexts (two users)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Both users open same document
  await page1.goto('/documents/123');
  await page2.goto('/documents/123');

  // User 1 types
  await page1.fill('[data-testid="editor"]', 'Hello from user 1');

  // User 2 should see the update in real-time
  await expect(page2.locator('[data-testid="editor"]')).toHaveValue('Hello from user 1', {
    timeout: 1000 // Should update within 1 second
  });

  // User 2 types
  await page2.fill('[data-testid="editor"]', 'Hello from user 2');

  // User 1 should see the update
  await expect(page1.locator('[data-testid="editor"]')).toHaveValue('Hello from user 2', {
    timeout: 1000
  });

  await context1.close();
  await context2.close();
});

// Test optimistic updates
test('optimistic updates show immediately', async ({ page }) => {
  await page.goto('/documents/123');

  const startTime = Date.now();

  // Type in editor
  await page.fill('[data-testid="editor"]', 'Testing optimistic updates');

  // UI should update immediately (<100ms)
  const value = await page.locator('[data-testid="editor"]').inputValue();
  const updateTime = Date.now() - startTime;

  expect(value).toBe('Testing optimistic updates');
  expect(updateTime).toBeLessThan(100); // Optimistic - instant feedback
});
```

### Performance Optimizations

1. **WebSocket at Edge**: <50ms latency globally (Cloudflare Workers in 200+ cities)
2. **Optimistic Updates**: Instant UI feedback (0ms perceived latency)
3. **Event Batching**: Batch multiple changes into single event (reduce network overhead)
4. **CRDT**: Conflict-free replicated data types for automatic conflict resolution
5. **Read Replicas**: Supabase edge functions query nearest replica

---

## Use Case 5: AI-Powered Search Platform

### Skills Required

**Primary Skills**:
- `vector-databases` - pgvector for semantic search
- `rag-optimization` - RAG system for context-aware responses (Future Phase 5 skill)
- `api-design` - REST API for search queries
- `auth-security` - JWT authentication + rate limiting

**Supporting Skills**:
- `schema-optimization` - HNSW indexes for fast vector search
- `testing-strategies` - Search relevance testing
- `edge-databases` - Distributed vector search

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       Client Application                       │
│  - Search input with autocomplete                             │
│  - Semantic search results                                     │
│  - RAG-powered chat interface                                 │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ API requests (auth-security: JWT)
                     ▼
┌───────────────────────────────────────────────────────────────┐
│                    API Gateway / Rate Limiter                  │
│  - JWT verification                                            │
│  - Rate limiting (100 req/min per user)                       │
│  - Request validation                                          │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Search query
                     ▼
┌───────────────────────────────────────────────────────────────┐
│                   Search Service (Node.js)                     │
│  - Generate embeddings (OpenAI API)                           │
│  - Vector similarity search                                    │
│  - Re-ranking with cross-encoder                              │
│  - RAG context retrieval                                      │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Vector query
                     ▼
┌───────────────────────────────────────────────────────────────┐
│            PostgreSQL + pgvector (vector-databases)            │
│  - Documents with embeddings (1536 dims)                      │
│  - HNSW index for fast similarity search                     │
│  - Hybrid search (vector + full-text)                        │
└───────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Vector Database Setup

```sql
-- vector-databases: PostgreSQL with pgvector
CREATE EXTENSION vector;

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimensions
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast similarity search (10-100x faster)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search index for hybrid search
ALTER TABLE documents ADD COLUMN content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED;

CREATE INDEX ON documents USING GIN (content_tsv);

-- Composite index for filtering
CREATE INDEX idx_documents_category_created ON documents (category, created_at DESC);
```

#### 2. Semantic Search API

```typescript
// api-design: Search API with JWT authentication
import express from 'express';
import OpenAI from 'openai';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// auth-security: Rate limiting
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many search requests'
});

// Semantic search endpoint
app.post('/api/search', authenticateJWT, searchLimiter, async (req, res) => {
  const { query, category, limit = 10 } = req.body;

  // 1. Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const queryEmbedding = response.data[0].embedding;

  // 2. Hybrid search: Vector + full-text
  const results = await db.query(`
    SELECT
      id,
      title,
      content,
      category,
      1 - (embedding <=> $1::vector) AS vector_similarity,
      ts_rank(content_tsv, to_tsquery('english', $2)) AS text_rank,
      (1 - (embedding <=> $1::vector)) * 0.7 +
        ts_rank(content_tsv, to_tsquery('english', $2)) * 0.3 AS combined_score
    FROM documents
    WHERE
      ($3::text IS NULL OR category = $3) AND
      (1 - (embedding <=> $1::vector) > 0.6 OR content_tsv @@ to_tsquery('english', $2))
    ORDER BY combined_score DESC
    LIMIT $4
  `, [queryEmbedding, query.split(' ').join(' & '), category, limit]);

  res.json({
    query,
    results: results.rows,
    count: results.rowCount
  });
});

// RAG-powered Q&A endpoint
app.post('/api/ask', authenticateJWT, searchLimiter, async (req, res) => {
  const { question, category } = req.body;

  // 1. Retrieve relevant context (semantic search)
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question
  });

  const queryEmbedding = response.data[0].embedding;

  const context = await db.query(`
    SELECT content
    FROM documents
    WHERE
      ($1::text IS NULL OR category = $1) AND
      1 - (embedding <=> $2::vector) > 0.7
    ORDER BY embedding <=> $2::vector
    LIMIT 5
  `, [category, queryEmbedding]);

  const contextText = context.rows.map(row => row.content).join('\n\n');

  // 2. Generate answer with GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant. Answer the question based on the following context. If the answer is not in the context, say "I don't have enough information."\n\nContext:\n${contextText}`
      },
      {
        role: 'user',
        content: question
      }
    ]
  });

  res.json({
    question,
    answer: completion.choices[0].message.content,
    sources: context.rows.length
  });
});
```

#### 3. Document Indexing Pipeline

```typescript
// schema-optimization: Batch indexing with embeddings
import OpenAI from 'openai';
import { Pool } from 'pg';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Batch generate embeddings (up to 2048 inputs)
async function batchEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts
  });

  return response.data.map(item => item.embedding);
}

// Index documents in batches
async function indexDocuments(documents: { title: string; content: string }[]) {
  // Generate embeddings in batches of 100
  const batchSize = 100;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const embeddings = await batchEmbeddings(batch.map(doc => doc.title + ' ' + doc.content));

    // Insert in single transaction
    await db.query('BEGIN');

    for (let j = 0; j < batch.length; j++) {
      await db.query(`
        INSERT INTO documents (title, content, embedding, category)
        VALUES ($1, $2, $3, $4)
      `, [batch[j].title, batch[j].content, embeddings[j], batch[j].category]);
    }

    await db.query('COMMIT');
  }
}
```

#### 4. Testing Search Relevance

```typescript
// testing-strategies: Search relevance testing
import { test, expect } from 'vitest';

test('semantic search returns relevant results', async () => {
  // Index test documents
  await indexDocuments([
    { title: 'PostgreSQL Tutorial', content: 'Learn SQL and PostgreSQL database...' },
    { title: 'React Hooks Guide', content: 'useState, useEffect, custom hooks...' },
    { title: 'Node.js Best Practices', content: 'Express, async/await, error handling...' }
  ]);

  // Search for PostgreSQL
  const results = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'database queries and SQL' })
  });

  const data = await results.json();

  // Should return PostgreSQL tutorial as top result
  expect(data.results[0].title).toContain('PostgreSQL');
  expect(data.results[0].vector_similarity).toBeGreaterThan(0.8);
});

test('RAG system provides accurate answers', async () => {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question: 'How do I use React hooks?' })
  });

  const data = await response.json();

  expect(data.answer).toContain('useState');
  expect(data.answer).toContain('useEffect');
  expect(data.sources).toBeGreaterThan(0);
});

// Playwright E2E test
test('search interface returns results', async ({ page }) => {
  await page.goto('/search');

  // Type search query
  await page.fill('input[name="search"]', 'PostgreSQL database');
  await page.click('button[type="submit"]');

  // Wait for results
  await page.waitForSelector('[data-testid="search-result"]');

  // Verify results are relevant
  const firstResult = await page.locator('[data-testid="search-result"]').first().textContent();
  expect(firstResult).toContain('PostgreSQL');
});
```

### Performance Optimizations

1. **HNSW Index**: 10-100x faster than brute-force similarity search
2. **Embedding Cache**: Cache embeddings in Redis (avoid regenerating)
3. **Batch Processing**: Generate embeddings in batches (2048 max)
4. **Hybrid Search**: Combine vector (70%) + full-text (30%) for best results
5. **Read Replicas**: Distribute search queries across replicas

### Security Considerations

- ✅ JWT authentication on all endpoints
- ✅ Rate limiting (100 req/min per user)
- ✅ Input sanitization (prevent prompt injection)
- ✅ API key rotation for OpenAI
- ✅ Row-level security for multi-tenant data

---

## Decision Trees

### When to Combine Skills

```
Is the app multi-tenant?
├─ Yes → Use rls-policies + auth-security + schema-optimization
└─ No → Continue

Does the app need global low latency?
├─ Yes → Use edge-databases + serverless + microservices
└─ No → Continue

Large teams with independent deploys?
├─ Yes → Use micro-frontends + state-management + testing-strategies
└─ No → Continue

Real-time collaboration features?
├─ Yes → Use serverless (WebSocket) + edge-databases + state-management
└─ No → Continue

AI-powered search?
├─ Yes → Use vector-databases + api-design + auth-security
└─ No → Use standard patterns
```

### Architecture Pattern Selection

| Use Case | Primary Pattern | Key Skills | When to Use |
|----------|----------------|------------|-------------|
| **Multi-Tenant SaaS** | Database-enforced isolation | RLS, Auth, Testing | Multiple customers sharing infrastructure |
| **Global E-Commerce** | Edge-first architecture | Edge DB, Serverless, Microservices | Users worldwide, <100ms latency required |
| **Enterprise Dashboard** | Micro-frontends | Module Federation, State Mgmt, Vector DB | Large teams, independent deployments |
| **Real-Time Collaboration** | Event-driven + WebSocket | Serverless, Edge DB, Microservices | Live updates, multi-user editing |
| **AI-Powered Search** | RAG + Vector DB | Vector DB, API Design, Auth | Semantic search, Q&A systems |

---

## Common Integration Patterns

### 1. State Management + API Design

**Pattern**: TanStack Query for server state + Zustand for UI state

```typescript
// Server state (API data)
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000 // Cache 5 minutes
});

// UI state (local only)
const theme = useStore(state => state.theme);
const setTheme = useStore(state => state.setTheme);
```

**Benefits**: Clear separation, optimized re-renders, automatic caching

---

### 2. RLS Policies + Schema Optimization

**Pattern**: Composite indexes include tenant_id for efficient RLS queries

```sql
-- RLS policy
CREATE POLICY tenant_isolation ON projects
USING (organization_id = current_setting('app.org_id')::uuid);

-- Matching composite index
CREATE INDEX idx_projects_org_created ON projects (organization_id, created_at DESC);
```

**Benefits**: RLS queries use index, 10x faster than sequential scan

---

### 3. Serverless + Edge Databases

**Pattern**: Edge functions query nearest read replica

```typescript
export const runtime = 'edge';

import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  // Queries nearest replica automatically
  const { rows } = await sql`SELECT * FROM products LIMIT 10`;
  return Response.json(rows);
}
```

**Benefits**: <100ms database queries globally, auto-scaling

---

## Performance Metrics

| Use Case | Latency (Before) | Latency (After) | Improvement |
|----------|-----------------|-----------------|-------------|
| Multi-Tenant Query (RLS + Indexes) | 500ms | 50ms | **10x faster** |
| Global E-Commerce (Edge + Replicas) | 300ms | 30ms | **10x faster** |
| Dashboard Aggregates (Materialized Views) | 5000ms | 100ms | **50x faster** |
| Real-Time Updates (WebSocket + Optimistic) | 200ms | 0ms perceived | **Instant** |
| Semantic Search (HNSW Index) | 1000ms | 10ms | **100x faster** |

---

## Summary

This guide demonstrated five real-world use cases combining multiple VERSATIL skills:

1. **Multi-Tenant SaaS**: RLS + Auth + Testing + API Design
2. **Global E-Commerce**: Edge DB + Serverless + Microservices + Schema Optimization
3. **Enterprise Dashboard**: Micro-frontends + State Management + Vector DB + Styling
4. **Real-Time Collaboration**: Serverless + Edge DB + Microservices + Testing
5. **AI-Powered Search**: Vector DB + API Design + Auth + Schema Optimization

**Key Takeaways**:
- Combine complementary skills for complete solutions
- Use decision trees to select appropriate patterns
- Test integrations thoroughly (unit + E2E + visual regression)
- Optimize for performance (indexes, caching, edge deployment)
- Enforce security at multiple layers (RLS, JWT, rate limiting)

**Next Steps**:
- Review individual skill documentation for deep dives
- Use provided code examples as templates
- Adapt patterns to your specific requirements
- Monitor performance metrics in production
- Iterate based on real-world usage patterns
