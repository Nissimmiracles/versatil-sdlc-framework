---
name: api-design
description: Modern API design patterns for REST, GraphQL, and tRPC. Use when designing APIs, implementing endpoints, versioning, or optimizing API performance. Covers resource naming, HTTP methods, status codes, GraphQL schema design, and type-safe RPC with tRPC. Reduces API design time by 50% through proven patterns.
---

# API Design

## Overview

Modern API design patterns covering RESTful APIs, GraphQL, and tRPC (type-safe RPC). Provides battle-tested patterns for resource naming, versioning, error handling, and performance optimization.

**Goal**: Design consistent, scalable, and developer-friendly APIs following industry best practices

## When to Use This Skill

Use this skill when:
- Designing new API endpoints (REST, GraphQL, tRPC)
- Implementing resource CRUD operations
- Setting up API versioning strategies
- Handling errors and validation
- Optimizing API performance (caching, pagination)
- Creating API documentation (OpenAPI/Swagger)
- Migrating between API paradigms

**Triggers**: "API design", "REST endpoint", "GraphQL schema", "tRPC", "API versioning", "endpoint naming", "HTTP methods"

---

## Quick Start: API Paradigm Decision Tree

### When to Use REST vs GraphQL vs tRPC

**REST** (Resource-oriented, HTTP-based):
- ✅ Simple CRUD operations
- ✅ Public APIs with broad client support
- ✅ Caching with HTTP semantics (ETags, Cache-Control)
- ✅ Stateless operations
- ✅ Well-understood by most developers
- ✅ Best for: Public APIs, microservices, traditional web apps

**GraphQL** (Query language, flexible data fetching):
- ✅ Complex data relationships
- ✅ Multiple resources in single request
- ✅ Frontend-driven data requirements
- ✅ Real-time subscriptions
- ✅ Strongly typed schema
- ✅ Best for: Complex frontends, mobile apps, data aggregation

**tRPC** (Type-safe RPC, TypeScript-first):
- ✅ Full-stack TypeScript projects
- ✅ End-to-end type safety
- ✅ No code generation needed
- ✅ Automatic API client generation
- ✅ React Query integration
- ✅ Best for: TypeScript monorepos, internal APIs, Next.js apps

**Use Multiple** when:
- REST for public API + tRPC for internal admin API
- GraphQL for frontend + REST for third-party integrations

---

## REST API Patterns

### 1. Resource Naming

```http
# ✅ Good - Plural nouns, hierarchical
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user
PATCH  /api/v1/users/:id          # Update user (partial)
PUT    /api/v1/users/:id          # Replace user (full)
DELETE /api/v1/users/:id          # Delete user

# Nested resources (1-2 levels max)
GET    /api/v1/users/:id/posts    # Get user's posts
POST   /api/v1/users/:id/posts    # Create post for user

# ❌ Bad - Verbs, singular, inconsistent
GET    /api/v1/getUser/:id        # Don't use verbs
GET    /api/v1/user               # Use plural
GET    /api/v1/users-list         # No hyphens in resource names
```

### 2. HTTP Methods & Status Codes

```typescript
// Express.js example
import { Router } from 'express';

const router = Router();

// GET - Retrieve resource(s)
router.get('/users', async (req, res) => {
  const users = await db.user.findMany();
  res.status(200).json(users); // 200 OK
});

// POST - Create resource
router.post('/users', async (req, res) => {
  const user = await db.user.create({ data: req.body });
  res.status(201).json(user); // 201 Created
});

// PATCH - Partial update
router.patch('/users/:id', async (req, res) => {
  const user = await db.user.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.status(200).json(user); // 200 OK
});

// DELETE - Remove resource
router.delete('/users/:id', async (req, res) => {
  await db.user.delete({ where: { id: req.params.id } });
  res.status(204).send(); // 204 No Content
});

// Common status codes:
// 200 OK - Success
// 201 Created - Resource created
// 204 No Content - Success, no response body
// 400 Bad Request - Invalid input
// 401 Unauthorized - Missing/invalid auth
// 403 Forbidden - Authenticated but no permission
// 404 Not Found - Resource doesn't exist
// 409 Conflict - Resource conflict (duplicate)
// 422 Unprocessable Entity - Validation error
// 500 Internal Server Error - Server error
```

### 3. Pagination

```typescript
// Offset pagination (simple, page-based)
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({ skip, take: limit }),
    db.user.count()
  ]);

  res.json({
    data: users,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
});

// Cursor pagination (better for large datasets, real-time data)
router.get('/users', async (req, res) => {
  const { cursor, limit = 20 } = req.query;

  const users = await db.user.findMany({
    take: limit + 1, // Fetch one extra to check if there's a next page
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' }
  });

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, -1) : users;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.json({
    data,
    meta: {
      next_cursor: nextCursor,
      has_more: hasMore
    }
  });
});
```

### 4. Filtering & Sorting

```typescript
// Query parameters for filtering
router.get('/users', async (req, res) => {
  const { status, role, sort = '-created_at', search } = req.query;

  const where = {};
  if (status) where.status = status;
  if (role) where.role = role;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  // Sort: "-created_at" = descending, "created_at" = ascending
  const [sortField, sortOrder] = sort.startsWith('-')
    ? [sort.slice(1), 'desc']
    : [sort, 'asc'];

  const users = await db.user.findMany({
    where,
    orderBy: { [sortField]: sortOrder }
  });

  res.json(users);
});

// Example requests:
// GET /users?status=active&role=admin&sort=-created_at
// GET /users?search=john&sort=name
```

### 5. Error Handling

```typescript
// Consistent error response format
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error middleware
app.use((err, req, res, next) => {
  console.error(err);

  // Validation error (Zod, Joi, etc.)
  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: err.errors
      }
    });
  }

  // Not found
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message
      }
    });
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

### 6. API Versioning

```typescript
// URL versioning (recommended for REST)
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Header versioning (alternative)
app.use((req, res, next) => {
  const version = req.headers['api-version'] || '1';
  if (version === '1') return v1Routes(req, res, next);
  if (version === '2') return v2Routes(req, res, next);
  res.status(400).json({ error: 'Invalid API version' });
});

// Migration strategy:
// 1. Deprecate v1 endpoint, add warning header
// 2. Run both v1 and v2 in parallel (6-12 months)
// 3. Monitor v1 usage, communicate sunset date
// 4. Remove v1 after adoption threshold (e.g., <5% traffic)
```

---

## GraphQL Patterns

### 1. Schema Design

```graphql
# Type definitions
type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  published: Boolean!
  tags: [String!]!
  createdAt: DateTime!
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

# Queries
type Query {
  # Get single resource
  user(id: ID!): User
  post(id: ID!): Post

  # List resources with pagination
  users(
    filter: UserFilter
    sort: UserSort
    page: Int = 1
    limit: Int = 20
  ): UserConnection!

  posts(
    filter: PostFilter
    sort: PostSort
    cursor: String
    limit: Int = 20
  ): PostConnection!
}

# Mutations
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!
}

# Subscriptions (real-time)
type Subscription {
  postCreated: Post!
  userOnline(userId: ID!): User!
}

# Input types
input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER
}

input UpdateUserInput {
  name: String
  email: String
  role: Role
}

input UserFilter {
  role: Role
  search: String
  createdAfter: DateTime
}

# Connection types (pagination)
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 2. Resolvers

```typescript
import { GraphQLContext } from './context';

const resolvers = {
  Query: {
    user: async (_parent, { id }, context: GraphQLContext) => {
      return context.db.user.findUnique({ where: { id } });
    },

    users: async (_parent, { filter, page = 1, limit = 20 }, context: GraphQLContext) => {
      const skip = (page - 1) * limit;

      const where = {};
      if (filter?.role) where.role = filter.role;
      if (filter?.search) where.name = { contains: filter.search };

      const [users, total] = await Promise.all([
        context.db.user.findMany({ where, skip, take: limit }),
        context.db.user.count({ where })
      ]);

      return {
        edges: users.map(user => ({ node: user, cursor: user.id })),
        pageInfo: {
          hasNextPage: skip + users.length < total,
          hasPreviousPage: page > 1
        },
        totalCount: total
      };
    }
  },

  Mutation: {
    createUser: async (_parent, { input }, context: GraphQLContext) => {
      // Authorization check
      if (!context.user) throw new Error('Unauthorized');

      // Validation
      if (!input.email.includes('@')) {
        throw new Error('Invalid email');
      }

      return context.db.user.create({ data: input });
    },

    updateUser: async (_parent, { id, input }, context: GraphQLContext) => {
      // Authorization check
      if (!context.user || context.user.id !== id) {
        throw new Error('Forbidden');
      }

      return context.db.user.update({
        where: { id },
        data: input
      });
    }
  },

  // Field resolvers (relationships)
  User: {
    posts: async (user, _args, context: GraphQLContext) => {
      return context.db.post.findMany({
        where: { authorId: user.id }
      });
    }
  },

  Post: {
    author: async (post, _args, context: GraphQLContext) => {
      return context.db.user.findUnique({
        where: { id: post.authorId }
      });
    }
  }
};
```

### 3. DataLoader (N+1 Prevention)

```typescript
import DataLoader from 'dataloader';

// Create loaders to batch database queries
export function createLoaders(db: PrismaClient) {
  return {
    userLoader: new DataLoader(async (ids: string[]) => {
      const users = await db.user.findMany({
        where: { id: { in: ids } }
      });
      // Return in same order as input
      return ids.map(id => users.find(user => user.id === id));
    }),

    postsByAuthorLoader: new DataLoader(async (authorIds: string[]) => {
      const posts = await db.post.findMany({
        where: { authorId: { in: authorIds } }
      });
      // Group by authorId
      return authorIds.map(id => posts.filter(post => post.authorId === id));
    })
  };
}

// Usage in resolver
const resolvers = {
  User: {
    posts: async (user, _args, context: GraphQLContext) => {
      // Batches queries automatically
      return context.loaders.postsByAuthorLoader.load(user.id);
    }
  }
};

// Without DataLoader: N+1 queries (1 + N)
// With DataLoader: 2 queries (1 for users, 1 batched query for all posts)
```

---

## tRPC Patterns

### 1. Router Definition

```typescript
// server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const userRouter = router({
  // Query (GET-like)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.user.findUnique({ where: { id: input.id } });
    }),

  // List with pagination
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      role: z.enum(['USER', 'ADMIN']).optional()
    }))
    .query(async ({ input, ctx }) => {
      const { page, limit, role } = input;
      const skip = (page - 1) * limit;

      const where = role ? { role } : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({ where, skip, take: limit }),
        ctx.db.user.count({ where })
      ]);

      return {
        users,
        meta: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      };
    }),

  // Mutation (POST/PUT/DELETE-like)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(['USER', 'ADMIN']).default('USER')
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.create({ data: input });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Authorization check
      if (ctx.user.id !== id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.db.user.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete
      if (ctx.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.db.user.delete({ where: { id: input.id } });
    })
});
```

### 2. Root Router

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter
});

// Export type for client
export type AppRouter = typeof appRouter;
```

### 3. Client Usage (React)

```typescript
// client/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

// components/UserList.tsx
import { trpc } from '../client/trpc';

function UserList() {
  // Full type safety - TypeScript knows the return type!
  const { data, isLoading } = trpc.user.list.useQuery({
    page: 1,
    limit: 20,
    role: 'ADMIN' // TypeScript error if invalid role
  });

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useContext().user.list.invalidate();
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}

      <button onClick={() => createUser.mutate({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER'
      })}>
        Create User
      </button>
    </div>
  );
}
```

### 4. Subscriptions (Real-Time)

```typescript
// server/routers/user.ts
export const userRouter = router({
  onUserCreated: publicProcedure
    .subscription(async ({ ctx }) => {
      // Return an observable
      return observable<User>((emit) => {
        const listener = (user: User) => emit.next(user);

        // Subscribe to event emitter
        ctx.eventEmitter.on('userCreated', listener);

        // Cleanup
        return () => {
          ctx.eventEmitter.off('userCreated', listener);
        };
      });
    })
});

// client/UserSubscription.tsx
function UserSubscription() {
  trpc.user.onUserCreated.useSubscription(undefined, {
    onData: (user) => {
      console.log('New user created:', user);
      // Show notification, update UI, etc.
    }
  });

  return <div>Listening for new users...</div>;
}
```

---

## Performance Optimization

### 1. Response Caching

```typescript
// HTTP caching (REST)
import { Router } from 'express';

router.get('/users/:id', async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.params.id } });

  // Cache for 5 minutes
  res.set('Cache-Control', 'public, max-age=300');

  // ETag for conditional requests
  const etag = `"${user.updated_at.getTime()}"`;
  res.set('ETag', etag);

  // Return 304 Not Modified if ETag matches
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.json(user);
});
```

### 2. Database Query Optimization

```typescript
// ❌ Bad - N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  user.posts = await db.post.findMany({ where: { authorId: user.id } });
}

// ✅ Good - Single query with include
const users = await db.user.findMany({
  include: { posts: true }
});

// ✅ Good - Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
    // Don't fetch unnecessary fields
  }
});
```

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Apply to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

---

## Resources

### scripts/
- `generate-openapi.js` - Generate OpenAPI/Swagger docs from code
- `validate-api-design.js` - Lint API design (naming, status codes)

### references/
- `references/rest-conventions.md` - REST API naming and HTTP method guidelines
- `references/graphql-best-practices.md` - GraphQL schema design patterns
- `references/trpc-patterns.md` - tRPC router organization and error handling
- `references/api-security.md` - CORS, rate limiting, authentication

### assets/
- `assets/openapi-templates/` - OpenAPI 3.0 specification templates
- `assets/postman-collections/` - Example Postman collections

## Related Skills

- `auth-security` - OAuth2, JWT, API authentication
- `schema-optimization` - Database query optimization
- `testing-strategies` - API testing with Supertest/Playwright
- `microservices` - API gateway patterns, service mesh
