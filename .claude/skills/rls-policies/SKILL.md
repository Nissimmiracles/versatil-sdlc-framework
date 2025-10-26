---
name: rls-policies
description: Row-Level Security (RLS) policies for multi-tenant PostgreSQL/Supabase applications. Use when implementing tenant isolation, role-based access control, or securing data at the row level. Provides automatic security enforcement at the database layer without application-level checks.
---

# Row-Level Security (RLS) Policies

## Overview

Row-Level Security (RLS) policies in PostgreSQL/Supabase for automatic tenant isolation and role-based access control. Enforces security at the database layer, ensuring users can only access their own data without application-level security checks.

**Goal**: Automatic, database-enforced multi-tenant security and RBAC

## When to Use This Skill

Use this skill when:
- Building multi-tenant SaaS applications
- Implementing role-based access control (RBAC)
- Securing data at the row level
- Migrating to Supabase (RLS required for security)
- Enforcing organization/team data isolation
- Implementing user-level data privacy
- Preventing data leaks between tenants
- Simplifying application security logic

**Triggers**: "RLS", "row-level security", "multi-tenant", "tenant isolation", "Supabase security", "RBAC", "data isolation"

---

## Quick Start: RLS Strategy Decision Tree

### When to Use RLS vs Application-Level Security

**RLS (Database-Level Security)**:
- ✅ Automatic enforcement (can't be bypassed)
- ✅ Multi-tenant SaaS (tenant isolation)
- ✅ Works across all queries (no code changes needed)
- ✅ Performance optimized by database
- ✅ Audit-friendly (security in one place)
- ✅ Best for: Multi-tenant apps, Supabase, strict security requirements

**Application-Level Security**:
- ✅ Complex business logic (dynamic rules)
- ✅ Cross-database queries
- ✅ Easier debugging (visible in code)
- ✅ More flexibility
- ✅ Best for: Simple apps, complex authorization logic, non-PostgreSQL

**Hybrid** (RLS + Application):
- ✅ RLS for base security (tenant isolation)
- ✅ Application for business logic (permissions, features)
- ✅ Best for: Production SaaS applications

---

## Basic RLS Patterns

### 1. Enable RLS on Table

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Now all queries are blocked by default (no rows returned)
-- Must create policies to allow access
```

### 2. Simple User Isolation

```sql
-- Users can only see their own posts
CREATE POLICY user_isolation ON posts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own posts
CREATE POLICY user_insert ON posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own posts
CREATE POLICY user_update ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own posts
CREATE POLICY user_delete ON posts
FOR DELETE
USING (auth.uid() = user_id);

-- Test queries
SELECT * FROM posts;  -- Only returns posts where user_id = current user
INSERT INTO posts (user_id, title) VALUES (auth.uid(), 'My Post');  -- ✅ Allowed
INSERT INTO posts (user_id, title) VALUES ('other-user-id', 'Hack');  -- ❌ Blocked
```

### 3. Multi-Tenant Isolation

```sql
-- Schema: Each table has organization_id column
ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON projects
FOR ALL
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));

-- Alternative: Using custom claim in JWT
CREATE POLICY tenant_isolation ON projects
FOR ALL
USING (organization_id = auth.jwt() ->> 'organization_id');

-- Result: Users can ONLY access data from their organization
SELECT * FROM projects;  -- Only returns projects from user's organization
```

---

## Role-Based Access Control (RBAC)

### 1. Role Hierarchy

```sql
-- User roles enum
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'owner');

-- Users table with role
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';

-- Policy: Admins can see all posts
CREATE POLICY admin_all_access ON posts
FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- Policy: Regular users can only see their own posts
CREATE POLICY user_own_posts ON posts
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
);
```

### 2. Permission-Based Access

```sql
-- Permissions table
CREATE TABLE permissions (
  user_id UUID REFERENCES users(id),
  resource TEXT,
  action TEXT,
  PRIMARY KEY (user_id, resource, action)
);

-- Policy: Check permissions table
CREATE POLICY permission_based ON documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM permissions
    WHERE user_id = auth.uid()
      AND resource = 'documents'
      AND action = 'read'
  )
);
```

### 3. Team-Based Access

```sql
-- Team membership table
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role TEXT,
  PRIMARY KEY (team_id, user_id)
);

-- Projects belong to teams
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id);

-- Policy: Team members can access team projects
CREATE POLICY team_access ON projects
FOR ALL
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);
```

---

## Advanced RLS Patterns

### 1. Conditional Policies (Public + Private)

```sql
-- Posts can be public or private
ALTER TABLE posts ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Policy: Users can see public posts OR their own private posts
CREATE POLICY public_or_own ON posts
FOR SELECT
USING (
  is_public = true
  OR
  user_id = auth.uid()
);
```

### 2. Hierarchical Policies (Organization + Team + User)

```sql
-- Policy combining multiple levels
CREATE POLICY hierarchical_access ON documents
FOR SELECT
USING (
  -- Same organization
  organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  AND (
    -- Public to organization
    visibility = 'organization'
    OR
    -- Same team
    (visibility = 'team' AND team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ))
    OR
    -- Owner
    user_id = auth.uid()
  )
);
```

### 3. Time-Based Policies

```sql
-- Policy: Only show active projects (not archived)
CREATE POLICY active_projects ON projects
FOR SELECT
USING (
  archived_at IS NULL
  OR
  archived_at > NOW() - INTERVAL '30 days'
);
```

### 4. Bypass RLS for Service Roles

```sql
-- Create service role (for background jobs, admin tasks)
CREATE ROLE service_role;

-- Grant bypass RLS privilege
GRANT service_role TO postgres;
ALTER ROLE service_role BYPASSRLS;

-- Use service role for admin operations
SET ROLE service_role;
SELECT * FROM posts;  -- Returns ALL posts (RLS bypassed)
RESET ROLE;
```

---

## Performance Optimization

### 1. Policy Performance

```sql
-- ❌ Bad - Subquery executes for every row
CREATE POLICY slow_policy ON posts
FOR SELECT
USING (
  user_id IN (SELECT user_id FROM team_members WHERE team_id = '...')
);

-- ✅ Good - Use JOIN instead
CREATE POLICY fast_policy ON posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.user_id = posts.user_id
      AND team_members.team_id = '...'
  )
);

-- ✅ Better - Cache current user context
-- Set session variable at connection time
SET myapp.current_user_id = '123';
SET myapp.current_organization_id = '456';

CREATE POLICY cached_policy ON posts
FOR SELECT
USING (
  organization_id = current_setting('myapp.current_organization_id')::UUID
);
```

### 2. Index for RLS

```sql
-- Create indexes on columns used in RLS policies
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_posts_organization_id ON posts (organization_id);
CREATE INDEX idx_team_members_user_id ON team_members (user_id);

-- Composite index for multi-column policies
CREATE INDEX idx_posts_org_user ON posts (organization_id, user_id);
```

---

## Testing RLS Policies

### 1. Test as Different Users

```sql
-- Test as user 1
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-1-id';

SELECT * FROM posts;  -- Should only see user 1's posts

-- Test as user 2
SET request.jwt.claim.sub = 'user-2-id';

SELECT * FROM posts;  -- Should only see user 2's posts

-- Reset
RESET ROLE;
```

### 2. Automated Policy Tests

```sql
-- Test function
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS void AS $$
DECLARE
  user1_id UUID := 'user-1';
  user2_id UUID := 'user-2';
BEGIN
  -- Test user isolation
  SET request.jwt.claim.sub = user1_id;

  IF (SELECT COUNT(*) FROM posts WHERE user_id != user1_id) > 0 THEN
    RAISE EXCEPTION 'User 1 can see other users posts!';
  END IF;

  -- Test insert restriction
  BEGIN
    INSERT INTO posts (user_id, title) VALUES (user2_id, 'Hack');
    RAISE EXCEPTION 'User 1 inserted post as user 2!';
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;

  RAISE NOTICE 'All RLS tests passed!';
END;
$$ LANGUAGE plpgsql;

-- Run tests
SELECT test_rls_policies();
```

---

## Supabase-Specific Patterns

### 1. Auth Helpers

```typescript
// Client-side: Supabase automatically adds JWT to requests
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login user
await supabase.auth.signInWithPassword({ email, password });

// Query automatically filtered by RLS
const { data } = await supabase.from('posts').select('*');
// Only returns posts allowed by RLS policies

// auth.uid() in policies automatically uses JWT from request
```

### 2. Service Role for Admin

```typescript
// Server-side: Use service role to bypass RLS
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Has BYPASSRLS permission
);

// Returns ALL rows (RLS bypassed)
const { data } = await supabaseAdmin.from('posts').select('*');
```

### 3. Custom Claims in JWT

```sql
-- Policy using custom JWT claim
CREATE POLICY organization_access ON projects
FOR ALL
USING (
  organization_id = (auth.jwt() ->> 'organization_id')::UUID
);
```

---

## Security Best Practices

### 1. Always Enable RLS

```sql
-- ✅ Good - Enable RLS on all user tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ❌ Bad - Forgetting to enable RLS = data leak
-- Table without RLS = ALL users can see ALL data!
```

### 2. Test with Multiple Users

```sql
-- Always test policies with:
-- 1. Owner of resource
-- 2. Different user in same organization
-- 3. User in different organization
-- 4. Unauthenticated user
-- 5. Admin/service role
```

### 3. Audit RLS Policies

```sql
-- List all tables without RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies
  )
  AND tablename NOT LIKE 'pg_%';

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

## Resources

### scripts/
- `audit-rls.js` - Find tables without RLS enabled
- `test-rls-policies.js` - Automated RLS policy testing

### references/
- `references/rls-patterns.md` - Common RLS patterns for SaaS
- `references/supabase-auth.md` - Supabase auth.uid() and JWT helpers
- `references/rls-performance.md` - RLS query optimization techniques
- `references/multi-tenant-architecture.md` - Multi-tenant database design

### assets/
- `assets/policy-templates/` - RLS policy templates for common use cases
- `assets/test-scripts/` - RLS testing scripts

## Related Skills

- `auth-security` - Authentication integration with RLS
- `schema-optimization` - Index optimization for RLS policies
- `api-design` - Supabase client integration with RLS
- `vector-databases` - RLS for multi-tenant vector data
