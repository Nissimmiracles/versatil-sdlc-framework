/**
 * VERSATIL Memory Tool Configuration
 *
 * Integrates Claude's Memory Tool (beta) with VERSATIL's isolated architecture
 *
 * Features:
 * - Agent-specific memory directories (maria-qa/, james-frontend/, etc.)
 * - Context editing integration for long conversations
 * - Pattern storage and retrieval across sessions
 * - Isolation enforcement (~/.versatil/memories/ not in projects)
 *
 * References:
 * - https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 * - https://docs.claude.com/en/docs/build-with-claude/context-editing
 */

import path from 'path';
import os from 'os';

export interface MemoryToolConfig {
  /** Beta flag for Context Management features */
  beta: string;

  /** Root directory for all agent memories (isolated from projects) */
  memoryDirectory: string;

  /** Context editing configuration */
  contextManagement: ContextManagementConfig;

  /** Tools to exclude from context clearing */
  excludeTools: string[];

  /** Agent-specific memory subdirectories */
  agentMemoryPaths: Record<AgentId, string>;

  /** Memory file retention policy */
  retentionPolicy: RetentionPolicy;
}

export interface ContextManagementConfig {
  edits: ContextEdit[];
}

export interface ContextEdit {
  /** Type of context edit operation */
  type: 'clear_tool_uses_20250919';

  /** When to trigger context editing */
  trigger: TokenTrigger;

  /** How many recent tool uses to preserve */
  keep: ToolUsesKeep;

  /** Minimum tokens to clear when triggered */
  clearAtLeast: TokenClearAtLeast;
}

export interface TokenTrigger {
  type: 'input_tokens';
  value: number;
}

export interface ToolUsesKeep {
  type: 'tool_uses';
  value: number;
}

export interface TokenClearAtLeast {
  type: 'input_tokens';
  value: number;
}

export interface RetentionPolicy {
  /** Documentation cache TTL in days */
  documentationCacheTTL: number;

  /** Pattern cache TTL in days (0 = never expire) */
  patternCacheTTL: number;

  /** Maximum memory directory size in MB */
  maxMemorySizeMB: number;

  /** Auto-cleanup threshold (% of max size) */
  cleanupThresholdPercent: number;
}

export type AgentId =
  | 'maria-qa'
  | 'james-frontend'
  | 'marcus-backend'
  | 'dana-database'
  | 'alex-ba'
  | 'sarah-pm'
  | 'dr-ai-ml';

/**
 * Default Memory Tool configuration for VERSATIL
 *
 * Memory Directory Structure:
 * ~/.versatil/memories/
 * ├── maria-qa/
 * │   ├── test-patterns.md
 * │   ├── bug-signatures.md
 * │   └── coverage-strategies.md
 * ├── james-frontend/
 * │   ├── component-patterns.md
 * │   ├── accessibility-fixes.md
 * │   └── performance-optimizations.md
 * ├── marcus-backend/
 * │   ├── api-security-patterns.md
 * │   ├── database-optimization.md
 * │   └── authentication-flows.md
 * ├── dana-database/
 * │   ├── schema-patterns.md
 * │   ├── migration-strategies.md
 * │   └── rls-policies.md
 * ├── alex-ba/
 * │   ├── requirement-templates.md
 * │   └── user-story-patterns.md
 * ├── sarah-pm/
 * │   ├── sprint-patterns.md
 * │   └── coordination-strategies.md
 * ├── dr-ai-ml/
 * │   ├── model-architectures.md
 * │   └── deployment-patterns.md
 * └── project-knowledge/
 *     ├── architecture-decisions.md
 *     └── tech-stack-preferences.md
 */
export const MEMORY_TOOL_CONFIG: MemoryToolConfig = {
  // Enable Claude's context management beta
  beta: 'context-management-2025-06-27',

  // Memory directory in VERSATIL home (isolated from user projects)
  memoryDirectory: path.join(os.homedir(), '.versatil', 'memories'),

  // Context editing configuration
  contextManagement: {
    edits: [{
      type: 'clear_tool_uses_20250919',

      // Trigger context editing at 100k input tokens
      trigger: {
        type: 'input_tokens',
        value: 100000
      },

      // Keep last 3 tool interactions
      keep: {
        type: 'tool_uses',
        value: 3
      },

      // Clear at least 5k tokens when triggered
      clearAtLeast: {
        type: 'input_tokens',
        value: 5000
      }
    }]
  },

  // Never clear these tools (critical for workflow continuity)
  excludeTools: [
    'memory',       // Memory operations must persist
    'Read',         // File reads needed for context
    'Write',        // File writes needed for deliverables
    'TodoWrite',    // Task tracking must persist
    'Edit',         // Code edits must be visible
    'Bash'          // Command history helpful for debugging
  ],

  // Agent-specific memory paths
  agentMemoryPaths: {
    'maria-qa': 'maria-qa/',
    'james-frontend': 'james-frontend/',
    'marcus-backend': 'marcus-backend/',
    'dana-database': 'dana-database/',
    'alex-ba': 'alex-ba/',
    'sarah-pm': 'sarah-pm/',
    'dr-ai-ml': 'dr-ai-ml/'
  },

  // Memory retention and cleanup policy
  retentionPolicy: {
    // Documentation cached for 7 days (fresh docs needed regularly)
    documentationCacheTTL: 7,

    // Patterns never expire (core learning)
    patternCacheTTL: 0,

    // Max 500MB for all memories
    maxMemorySizeMB: 500,

    // Cleanup when 80% full
    cleanupThresholdPercent: 80
  }
};

/**
 * Memory file templates for each agent
 */
export const AGENT_MEMORY_TEMPLATES: Record<AgentId, MemoryTemplate[]> = {
  'maria-qa': [
    {
      filename: 'test-patterns.md',
      description: 'Successful test patterns and strategies',
      initialContent: `# Maria-QA Test Patterns

## Successful Test Patterns

### Pattern: React Component Testing
\`\`\`typescript
// Pattern for testing React components with hooks
import { render, screen, fireEvent } from '@testing-library/react';

test('component renders and handles interaction', () => {
  render(<Component />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
\`\`\`

### Pattern: API Testing
\`\`\`typescript
// Pattern for testing API endpoints
describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@example.com' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
\`\`\`

## Notes
- Always test happy path first, then edge cases
- Use descriptive test names (what/when/expected)
- Aim for 80%+ coverage (MANDATORY)
`
    },
    {
      filename: 'bug-signatures.md',
      description: 'Known bug patterns and detection strategies',
      initialContent: `# Maria-QA Bug Signatures

## Common Bug Patterns

### Bug Signature: Async State Update After Unmount
**Pattern**: React component updates state after unmounting
**Detection**: Warning in test console
**Fix**: Cleanup in useEffect return
\`\`\`typescript
useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setState(data);
  });
  return () => { isMounted = false; };
}, []);
\`\`\`

### Bug Signature: Missing Error Handling
**Pattern**: API calls without try-catch
**Detection**: Unhandled promise rejections
**Fix**: Wrap async operations
\`\`\`typescript
try {
  const result = await apiCall();
} catch (error) {
  console.error('API call failed:', error);
  setError(error.message);
}
\`\`\`

## Notes
- Log all bug signatures for pattern matching
- Update detection rules when new bugs found
`
    },
    {
      filename: 'coverage-strategies.md',
      description: 'Strategies for achieving 80%+ test coverage',
      initialContent: `# Maria-QA Coverage Strategies

## Coverage Improvement Tactics

### Strategy 1: Identify Uncovered Branches
\`\`\`bash
npm run test:coverage
# Check coverage/lcov-report/index.html for red/yellow areas
\`\`\`

### Strategy 2: Test Edge Cases
- Null/undefined inputs
- Empty arrays/objects
- Boundary values (0, -1, MAX_INT)
- Error states

### Strategy 3: Integration Tests
- Test component interactions
- Test API contract compliance
- Test full user journeys (E2E)

## Coverage Targets
- Statements: 80%+ (MANDATORY)
- Branches: 75%+ (RECOMMENDED)
- Functions: 80%+ (MANDATORY)
- Lines: 80%+ (MANDATORY)
`
    }
  ],

  'james-frontend': [
    {
      filename: 'component-patterns.md',
      description: 'Reusable React/Vue component architectures',
      initialContent: `# James-Frontend Component Patterns

## Successful Component Architectures

### Pattern: Compound Component
\`\`\`typescript
// Flexible, composable UI components
export const Accordion = ({ children }) => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <AccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      {children}
    </AccordionContext.Provider>
  );
};
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;
\`\`\`

### Pattern: Custom Hooks for Business Logic
\`\`\`typescript
// Separate business logic from UI
function useUserData(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setData).finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}
\`\`\`

## Notes
- Keep components small (<200 lines)
- Separate logic from presentation
- Use composition over inheritance
`
    },
    {
      filename: 'accessibility-fixes.md',
      description: 'Common accessibility patterns (WCAG 2.1 AA)',
      initialContent: `# James-Frontend Accessibility Fixes

## Common A11y Patterns

### Pattern: Keyboard Navigation
\`\`\`typescript
// Ensure all interactive elements are keyboard accessible
<button
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Submit form"
>
  Submit
</button>
\`\`\`

### Pattern: Screen Reader Support
\`\`\`typescript
// Provide context for screen readers
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/" aria-current="page">Home</a></li>
  </ul>
</nav>
\`\`\`

### Pattern: Focus Management
\`\`\`typescript
// Manage focus for modals and dynamic content
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);
\`\`\`

## WCAG 2.1 AA Checklist
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] All interactive elements keyboard accessible
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Focus indicators visible
- [ ] No content flashing more than 3x per second
`
    },
    {
      filename: 'performance-optimizations.md',
      description: 'Frontend performance optimization strategies',
      initialContent: `# James-Frontend Performance Optimizations

## Performance Patterns

### Pattern: Code Splitting
\`\`\`typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
\`\`\`

### Pattern: Memoization
\`\`\`typescript
// Prevent unnecessary re-renders
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  );
  return <div>{processedData}</div>;
});
\`\`\`

### Pattern: Image Optimization
\`\`\`typescript
// Use next-gen formats with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <source srcSet="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>
\`\`\`

## Performance Targets
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms
- Lighthouse Score: 90+ (REQUIRED)
`
    }
  ],

  'marcus-backend': [
    {
      filename: 'api-security-patterns.md',
      description: 'OWASP-compliant API security patterns',
      initialContent: `# Marcus-Backend API Security Patterns

## OWASP Top 10 Compliance

### Pattern: Input Validation
\`\`\`typescript
// Validate ALL user input
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120)
});

app.post('/users', (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  // Process validated data
});
\`\`\`

### Pattern: Authentication & Authorization
\`\`\`typescript
// JWT-based auth with proper validation
import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
\`\`\`

### Pattern: SQL Injection Prevention
\`\`\`typescript
// Use parameterized queries ALWAYS
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email] // Parameterized - safe from SQL injection
);
\`\`\`

## Security Checklist
- [ ] Input validation on ALL endpoints
- [ ] Parameterized database queries
- [ ] JWT tokens with expiry
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting (prevent DoS)
- [ ] CORS configured properly
- [ ] Secrets in environment variables (never in code)
`
    },
    {
      filename: 'database-optimization.md',
      description: 'Query performance and optimization patterns',
      initialContent: `# Marcus-Backend Database Optimization

## Query Performance Patterns

### Pattern: Index Optimization
\`\`\`sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
\`\`\`

### Pattern: N+1 Query Prevention
\`\`\`typescript
// BAD: N+1 queries
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// GOOD: Single query with join
const users = await User.findAll({
  include: [{ model: Post }]
});
\`\`\`

### Pattern: Query Explain Analysis
\`\`\`sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM users
WHERE email = 'test@example.com';
-- Look for: Index Scan (good), Seq Scan (bad for large tables)
\`\`\`

## Performance Targets
- Simple queries: <50ms
- Complex queries: <200ms
- Index all foreign keys
- Use connection pooling
`
    },
    {
      filename: 'authentication-flows.md',
      description: 'JWT and OAuth authentication patterns',
      initialContent: `# Marcus-Backend Authentication Flows

## JWT Authentication Pattern

### Pattern: Token Generation
\`\`\`typescript
import jwt from 'jsonwebtoken';

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
\`\`\`

### Pattern: Token Refresh
\`\`\`typescript
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    const newTokens = generateTokens(user);
    res.json(newTokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
\`\`\`

## OAuth 2.0 Pattern

### Pattern: OAuth Flow
\`\`\`typescript
// 1. Redirect to OAuth provider
app.get('/auth/google', (req, res) => {
  const authUrl = \`https://accounts.google.com/o/oauth2/v2/auth?
    client_id=\${CLIENT_ID}&
    redirect_uri=\${REDIRECT_URI}&
    response_type=code&
    scope=openid email profile\`;
  res.redirect(authUrl);
});

// 2. Handle callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  // Exchange code for tokens
  // Create/update user
  // Generate JWT
});
\`\`\`

## Security Best Practices
- Access tokens: Short-lived (15min)
- Refresh tokens: Longer-lived (7 days)
- Store refresh tokens in httpOnly cookies
- Rotate refresh tokens on use
- Revoke tokens on logout
`
    }
  ],

  'dana-database': [
    {
      filename: 'schema-patterns.md',
      description: 'Database schema design patterns',
      initialContent: `# Dana-Database Schema Patterns

## Schema Design Patterns

### Pattern: User Authentication Schema
\`\`\`sql
-- Users table with authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for token management
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
\`\`\`

### Pattern: Multi-Tenant Schema
\`\`\`sql
-- Organization (tenant) table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization relationship
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (organization_id, user_id)
);
\`\`\`

## Design Principles
- Use UUIDs for IDs (better for distributed systems)
- Add created_at/updated_at timestamps
- Foreign keys with ON DELETE CASCADE for automatic cleanup
- Index all foreign keys for join performance
`
    },
    {
      filename: 'migration-strategies.md',
      description: 'Safe database migration approaches',
      initialContent: `# Dana-Database Migration Strategies

## Safe Migration Patterns

### Pattern: Additive Migrations (Zero-Downtime)
\`\`\`sql
-- Step 1: Add new column (nullable initially)
ALTER TABLE users ADD COLUMN phone TEXT;

-- Step 2: Backfill data (if needed)
UPDATE users SET phone = '' WHERE phone IS NULL;

-- Step 3: Add constraint (after backfill)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
\`\`\`

### Pattern: Renaming Columns Safely
\`\`\`sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Step 2: Copy data
UPDATE users SET full_name = name;

-- Step 3: Deploy code using full_name

-- Step 4: Drop old column (after code deployed)
ALTER TABLE users DROP COLUMN name;
\`\`\`

### Pattern: Reversible Migrations
\`\`\`typescript
// Always provide up AND down migrations
export async function up(db) {
  await db.schema.createTable('new_table', (table) => {
    table.uuid('id').primary();
    table.text('name').notNullable();
  });
}

export async function down(db) {
  await db.schema.dropTable('new_table');
}
\`\`\`

## Migration Checklist
- [ ] Test migration on staging first
- [ ] Have rollback plan ready
- [ ] Avoid locking tables during peak hours
- [ ] Use transactions for data integrity
- [ ] Monitor query performance after migration
`
    },
    {
      filename: 'rls-policies.md',
      description: 'Row-Level Security policies for multi-tenant data',
      initialContent: `# Dana-Database RLS Policies

## Row-Level Security Patterns (Supabase)

### Pattern: User Can Only See Their Own Data
\`\`\`sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own posts
CREATE POLICY posts_select_own
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert posts as themselves
CREATE POLICY posts_insert_own
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own posts
CREATE POLICY posts_update_own
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);
\`\`\`

### Pattern: Organization-Based Access
\`\`\`sql
-- Policy: Users can access data from their organizations
CREATE POLICY organization_data_access
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
\`\`\`

### Pattern: Role-Based Access
\`\`\`sql
-- Policy: Only admins can delete
CREATE POLICY admin_delete_policy
  ON posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
\`\`\`

## RLS Best Practices
- Enable RLS on ALL multi-tenant tables
- Test policies with different user roles
- Use indexes on policy columns for performance
- Document policy logic clearly
- Audit policies regularly for security gaps
`
    }
  ],

  'alex-ba': [
    {
      filename: 'requirement-templates.md',
      description: 'Successful requirement documentation formats',
      initialContent: `# Alex-BA Requirement Templates

## Requirement Documentation Patterns

### Template: Feature Requirement
\`\`\`markdown
# Feature: User Authentication

## Business Context
Users need to securely access the application using email/password or OAuth providers (Google, GitHub).

## User Stories
1. As a new user, I want to sign up with email/password so that I can create an account
2. As a returning user, I want to log in with my credentials so that I can access my data
3. As a user, I want to log in with Google/GitHub so that I can avoid creating another password

## Acceptance Criteria

### Sign Up
- Given I am a new user
- When I provide valid email and password (min 8 chars, 1 number, 1 special char)
- Then an account is created and I am logged in
- And I receive a confirmation email

### Log In
- Given I have an existing account
- When I provide correct credentials
- Then I am logged in and redirected to dashboard
- And a session token is created (expires in 7 days)

### OAuth Login
- Given I choose "Login with Google"
- When I authorize the application
- Then my account is created/linked and I am logged in

## Non-Functional Requirements
- Response time: <200ms for authentication
- Security: Passwords hashed with bcrypt (12 rounds)
- Availability: 99.9% uptime for auth service
- Compliance: GDPR-compliant user data handling

## API Contract
\`\`\`typescript
POST /api/auth/signup
Body: { email: string, password: string }
Response: { user: User, accessToken: string, refreshToken: string }

POST /api/auth/login
Body: { email: string, password: string }
Response: { user: User, accessToken: string, refreshToken: string }

GET /api/auth/google
Response: Redirect to Google OAuth

GET /api/auth/google/callback?code=...
Response: { user: User, accessToken: string, refreshToken: string }
\`\`\`

## Dependencies
- Database: users and sessions tables (Dana-Database)
- Backend: JWT implementation (Marcus-Backend)
- Frontend: Login/signup forms (James-Frontend)

## Success Metrics
- 95%+ successful login rate
- <1% failed authentication (false rejects)
- 0 security incidents in first 90 days
\`\`\`
`
    },
    {
      filename: 'user-story-patterns.md',
      description: 'Effective user story structures',
      initialContent: `# Alex-BA User Story Patterns

## User Story Format

### Pattern: Standard User Story
\`\`\`
As a [user role]
I want [goal/desire]
So that [benefit/value]

Acceptance Criteria:
Given [precondition]
When [action]
Then [expected result]
And [additional expected result]
\`\`\`

### Example: Task Management
\`\`\`
As a project manager
I want to assign tasks to team members
So that work is distributed evenly and deadlines are met

Acceptance Criteria:
Given I am viewing a task
When I select a team member from the assignee dropdown
Then the task is assigned to that team member
And the team member receives an email notification
And the task appears in their "My Tasks" view
\`\`\`

## Story Sizing

### Small (1-2 days)
- Single feature, clear scope
- Example: "Add a search box to navbar"

### Medium (3-5 days)
- Multiple related features
- Example: "Implement task filtering by status, assignee, and due date"

### Large (1-2 weeks)
- Complex feature with multiple components
- Example: "Build complete authentication system with OAuth"
- **Action**: Break into smaller stories

## Quality Criteria

### Good User Story
- [ ] Independent (can be developed separately)
- [ ] Negotiable (details can be discussed)
- [ ] Valuable (delivers business value)
- [ ] Estimable (team can estimate effort)
- [ ] Small (fits in sprint)
- [ ] Testable (clear acceptance criteria)

### Red Flags
- ❌ Technical jargon in story (should be user-focused)
- ❌ No acceptance criteria
- ❌ Too large to fit in sprint
- ❌ Dependent on many other stories
`
    }
  ],

  'sarah-pm': [
    {
      filename: 'sprint-patterns.md',
      description: 'Successful sprint planning and execution patterns',
      initialContent: `# Sarah-PM Sprint Patterns

## Sprint Planning Patterns

### Pattern: Two-Week Sprint Structure
\`\`\`
Week 1:
- Monday: Sprint Planning (2 hours)
  - Review backlog
  - Prioritize stories
  - Assign work to agents
  - Set sprint goal

- Tuesday-Thursday: Development
  - Daily standups (15 min)
  - Agent collaboration
  - Quality gates

- Friday: Mid-sprint review
  - Check progress
  - Adjust if needed

Week 2:
- Monday-Wednesday: Development & testing
  - Complete remaining work
  - Maria-QA validation

- Thursday: Sprint Review (1 hour)
  - Demo completed work
  - Gather feedback

- Friday: Sprint Retrospective (1 hour)
  - What went well
  - What to improve
  - Action items for next sprint
\`\`\`

### Pattern: Sprint Metrics
\`\`\`markdown
## Sprint #23 Metrics

### Velocity
- Planned: 30 story points
- Completed: 28 story points
- Velocity: 93%

### Quality
- Test Coverage: 87% (target: 80%+) ✅
- Bug Count: 2 (target: <5) ✅
- Code Review: 100% reviewed ✅

### Agent Utilization
- Maria-QA: 85%
- James-Frontend: 92%
- Marcus-Backend: 88%
- Dana-Database: 78%

### Blockers
- Supabase outage (2 hours) - resolved
- Dependency update issue - resolved
\`\`\`

## Sprint Retrospective Template
\`\`\`
What went well:
- Three-tier coordination worked smoothly
- No critical bugs in production
- Documentation kept up-to-date

What to improve:
- Start testing earlier in sprint
- Better estimation for database migrations
- More frequent syncs between Marcus and James

Action items:
- [ ] Create estimation guide for migrations
- [ ] Add daily sync for frontend-backend integration
- [ ] Implement automated test runs on PR creation
\`\`\`
`
    },
    {
      filename: 'coordination-strategies.md',
      description: 'Multi-agent coordination and handoff strategies',
      initialContent: `# Sarah-PM Coordination Strategies

## Agent Coordination Patterns

### Pattern: Sequential Handoff
\`\`\`
Alex-BA (Requirements)
  ↓ [API Contract + User Stories]
Dana-Database (Schema)
  ↓ [Database Schema + Migrations]
Marcus-Backend (API Implementation)
  ↓ [API Endpoints + Documentation]
James-Frontend (UI Implementation)
  ↓ [Complete Feature]
Maria-QA (Testing & Validation)
  ↓ [Quality Approval]
PRODUCTION ✅
\`\`\`

### Pattern: Parallel Three-Tier Development
\`\`\`
Alex-BA (Requirements)
  ↓ [API Contract]
  ├─────────────┬─────────────┐
  ↓             ↓             ↓
Dana-DB    Marcus-BE    James-FE
(Schema)   (API w/mocks) (UI w/mocks)
  ↓             ↓             ↓
  └─────────────┴─────────────┘
            ↓ [Integration]
       Maria-QA (Validation)
            ↓
       PRODUCTION ✅

Time Saved: 40-50% vs sequential
\`\`\`

### Pattern: Handoff Contract
\`\`\`typescript
// Before handoff, validate contract
{
  from: 'alex-ba',
  to: ['dana-database', 'marcus-backend', 'james-frontend'],
  deliverables: {
    apiContract: {
      path: 'memories/alex-ba/api-contract.json',
      validated: true
    },
    userStories: {
      path: 'memories/alex-ba/user-stories.md',
      validated: true
    }
  },
  context: {
    businessGoals: 'Enable user authentication',
    technicalConstraints: 'Must support OAuth',
    performanceTargets: '<200ms response time'
  },
  qualityGates: ['80%+ test coverage', 'WCAG 2.1 AA compliance']
}
\`\`\`

## Blocker Resolution

### Pattern: Blocker Escalation
\`\`\`
1. Agent identifies blocker
   ↓
2. Sarah-PM notified immediately
   ↓
3. Sarah assesses impact:
   - Can work continue in parallel?
   - Is blocker critical to sprint goal?
   ↓
4. Resolution:
   - P0: Immediate team focus
   - P1: Resolve within 24 hours
   - P2: Resolve within sprint
   - P3: Add to backlog
\`\`\`

## Communication Patterns

### Daily Standups (Async)
\`\`\`markdown
## Agent: Maria-QA
**Yesterday**: Completed test suite for authentication
**Today**: E2E testing for user flows
**Blockers**: None

## Agent: Marcus-Backend
**Yesterday**: Implemented JWT authentication
**Today**: OAuth integration (Google, GitHub)
**Blockers**: Waiting for OAuth credentials

## Agent: James-Frontend
**Yesterday**: Login/signup forms complete
**Today**: OAuth buttons and redirects
**Blockers**: None (using mocks while Marcus completes OAuth)
\`\`\`
`
    }
  ],

  'dr-ai-ml': [
    {
      filename: 'model-architectures.md',
      description: 'ML model architecture patterns',
      initialContent: `# Dr.AI-ML Model Architectures

## Model Architecture Patterns

### Pattern: Text Classification
\`\`\`python
import transformers

# Use pre-trained models for text classification
model = transformers.AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=3
)

tokenizer = transformers.AutoTokenizer.from_pretrained(
    "distilbert-base-uncased"
)

# Fine-tune on custom dataset
# Deploy with FastAPI or similar
\`\`\`

### Pattern: RAG (Retrieval-Augmented Generation)
\`\`\`python
from transformers import AutoTokenizer, AutoModel
import chromadb

# 1. Generate embeddings
model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')
tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')

# 2. Store in vector database
client = chromadb.Client()
collection = client.create_collection("code_patterns")

# 3. Retrieve relevant context
def retrieve_context(query, top_k=5):
    results = collection.query(
        query_texts=[query],
        n_results=top_k
    )
    return results

# 4. Generate response with context
# Use Claude API or similar
\`\`\`

## Model Selection Guide

### Task: Text Generation
- **GPT-based models**: For creative writing, code generation
- **T5 models**: For text-to-text tasks
- **BART**: For summarization

### Task: Embeddings
- **Sentence Transformers**: For semantic similarity
- **OpenAI embeddings**: For general-purpose embeddings
- **Custom fine-tuned**: For domain-specific tasks

### Task: Computer Vision
- **CLIP**: For image-text matching
- **ResNet/ViT**: For image classification
- **YOLO**: For object detection
`
    },
    {
      filename: 'deployment-patterns.md',
      description: 'ML model deployment and monitoring patterns',
      initialContent: `# Dr.AI-ML Deployment Patterns

## Model Deployment Patterns

### Pattern: FastAPI ML Service
\`\`\`python
from fastapi import FastAPI
import torch

app = FastAPI()

# Load model once at startup
model = torch.load('model.pth')
model.eval()

@app.post("/predict")
async def predict(input_data: dict):
    # Preprocess
    tensor = preprocess(input_data)

    # Inference
    with torch.no_grad():
        prediction = model(tensor)

    # Postprocess
    result = postprocess(prediction)

    return {"prediction": result}
\`\`\`

### Pattern: Model Versioning
\`\`\`
models/
├── v1/
│   ├── model.pth
│   ├── tokenizer/
│   └── metadata.json
├── v2/
│   ├── model.pth
│   ├── tokenizer/
│   └── metadata.json
└── production -> v2/  # Symlink to active version
\`\`\`

### Pattern: A/B Testing
\`\`\`python
import random

def get_model_version(user_id):
    # Route 90% to v2, 10% to v1
    if hash(user_id) % 100 < 10:
        return load_model('v1')
    else:
        return load_model('v2')

# Track performance metrics per version
# Promote better-performing model to 100%
\`\`\`

## Monitoring Patterns

### Pattern: Model Performance Metrics
\`\`\`python
import prometheus_client

# Track prediction latency
prediction_latency = prometheus_client.Histogram(
    'model_prediction_seconds',
    'Time spent on prediction'
)

# Track prediction distribution
prediction_distribution = prometheus_client.Counter(
    'predictions_by_class',
    'Prediction counts by class',
    ['class_name']
)

@prediction_latency.time()
def predict(input_data):
    result = model.predict(input_data)
    prediction_distribution.labels(class_name=result).inc()
    return result
\`\`\`

## Production Checklist
- [ ] Model performance acceptable (accuracy, latency)
- [ ] Inference time <100ms (target)
- [ ] Error handling for invalid inputs
- [ ] Monitoring and alerting configured
- [ ] A/B testing setup (if applicable)
- [ ] Model versioning implemented
- [ ] Rollback plan ready
`
    }
  ]
};

export interface MemoryTemplate {
  filename: string;
  description: string;
  initialContent: string;
}

/**
 * Get memory path for a specific agent
 */
export function getAgentMemoryPath(agentId: AgentId): string {
  const basePath = MEMORY_TOOL_CONFIG.memoryDirectory;
  const agentPath = MEMORY_TOOL_CONFIG.agentMemoryPaths[agentId];
  return path.join(basePath, agentPath);
}

/**
 * Get full path to a memory file
 */
export function getMemoryFilePath(agentId: AgentId, filename: string): string {
  return path.join(getAgentMemoryPath(agentId), filename);
}
