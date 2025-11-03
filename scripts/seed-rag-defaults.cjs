#!/usr/bin/env node
/**
 * RAG Default Patterns Seeding Script
 *
 * Seeds universal best practices and patterns that work for any project.
 * These patterns provide baseline knowledge for new users and projects.
 *
 * Usage:
 *   node scripts/seed-rag-defaults.cjs           # Seed all defaults
 *   node scripts/seed-rag-defaults.cjs --dry-run # Preview without storing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

/**
 * Universal patterns categorized by agent domain
 */
const DEFAULT_PATTERNS = {
  'maria-qa': [
    {
      title: 'React Testing Library Best Practices',
      content: `// React Testing Library - Query Priority
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('button click updates counter', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  // ✅ Prefer accessible queries
  const button = screen.getByRole('button', { name: /increment/i });
  const count = screen.getByText(/count:/i);

  // ✅ User-centric interactions
  await user.click(button);

  // ✅ Semantic assertions
  expect(count).toHaveTextContent('Count: 1');
});

// Query Priority (RTL best practice):
// 1. getByRole (most accessible)
// 2. getByLabelText (forms)
// 3. getByPlaceholderText
// 4. getByText
// 5. getByTestId (last resort)`,
      type: 'code',
      tags: ['testing', 'react', 'jest', 'accessibility', 'best-practices'],
      language: 'typescript',
    },
    {
      title: 'Jest Test Structure Pattern',
      content: `// AAA Pattern (Arrange-Act-Assert)
describe('UserService', () => {
  // Setup and teardown
  beforeEach(() => {
    // Arrange: Reset state
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('creates user with valid data', async () => {
      // Arrange: Prepare test data
      const userData = { name: 'John', email: 'john@example.com' };
      const mockDB = jest.fn().mockResolvedValue({ id: 1, ...userData });

      // Act: Execute function
      const result = await createUser(userData, mockDB);

      // Assert: Verify outcome
      expect(result).toEqual({ id: 1, ...userData });
      expect(mockDB).toHaveBeenCalledWith(userData);
    });

    it('throws error for invalid email', async () => {
      // Arrange
      const invalidData = { name: 'John', email: 'invalid' };

      // Act & Assert: Expect error
      await expect(createUser(invalidData)).rejects.toThrow('Invalid email');
    });
  });
});`,
      type: 'code',
      tags: ['testing', 'jest', 'unit-test', 'pattern', 'best-practices'],
      language: 'typescript',
    },
    {
      title: 'Test Coverage Standards',
      content: `Test Coverage Requirements:
- Overall coverage: >= 80%
- Critical paths: >= 95%
- Edge cases: >= 70%
- Integration tests: >= 60%

Focus Areas:
1. Business logic (highest priority)
2. User-facing features
3. Security-critical code
4. Error handling paths
5. Edge cases and boundaries

Don't Test:
- Third-party libraries
- Framework internals
- Simple getters/setters
- Constants and config

Coverage Metrics:
- Statements: % of code lines executed
- Branches: % of if/else paths covered
- Functions: % of functions called
- Lines: % of lines executed`,
      type: 'text',
      tags: ['testing', 'coverage', 'standards', 'best-practices'],
      language: 'markdown',
    },
  ],

  'james-frontend': [
    {
      title: 'Accessible React Component Pattern',
      content: `// WCAG 2.1 AA Compliant Button Component
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  ariaLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={\`btn btn-\${variant}\`}
      // ✅ Keyboard accessible by default
      // ✅ Screen reader friendly
      // ✅ Focus visible (via CSS)
    >
      {children}
    </button>
  );
};

// Accessibility Checklist:
// ✅ Semantic HTML (button, not div)
// ✅ ARIA labels for icon-only buttons
// ✅ Disabled state properly conveyed
// ✅ Keyboard navigable (tab, enter, space)
// ✅ Focus indicator visible (outline/ring)
// ✅ Color contrast >= 4.5:1`,
      type: 'code',
      tags: ['frontend', 'react', 'accessibility', 'wcag', 'component', 'best-practices'],
      language: 'typescript',
    },
    {
      title: 'Responsive Design Breakpoints',
      content: `// Mobile-First Breakpoints (Tailwind CSS style)
const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X extra large
};

// CSS-in-JS (styled-components)
const Container = styled.div\`
  padding: 1rem;

  @media (min-width: \${breakpoints.md}) {
    padding: 2rem;
  }

  @media (min-width: \${breakpoints.lg}) {
    padding: 3rem;
  }
\`;

// Tailwind CSS classes
<div className="p-4 md:p-8 lg:p-12">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
    Responsive Heading
  </h1>
</div>

// Mobile-First Approach:
// 1. Default styles for mobile
// 2. Add complexity at larger breakpoints
// 3. Test on real devices
// 4. Use responsive images (srcset)`,
      type: 'code',
      tags: ['frontend', 'responsive', 'css', 'mobile-first', 'best-practices'],
      language: 'typescript',
    },
    {
      title: 'React Performance Optimization',
      content: `// Performance Best Practices
import React, { memo, useMemo, useCallback } from 'react';

// 1. Memoize expensive computations
const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]); // Only recompute when data changes

  return <List items={processedData} />;
};

// 2. Memoize callbacks to prevent re-renders
const ParentComponent = () => {
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // Callback never changes

  return <ChildComponent onClick={handleClick} />;
};

// 3. Memoize components with React.memo
const ChildComponent = memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
}); // Only re-renders if onClick changes

// 4. Code splitting with lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 5. Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={1000}
  itemSize={50}
>
  {Row}
</FixedSizeList>`,
      type: 'code',
      tags: ['frontend', 'react', 'performance', 'optimization', 'best-practices'],
      language: 'typescript',
    },
  ],

  'marcus-backend': [
    {
      title: 'Secure API Endpoint Pattern',
      content: `// Express API with OWASP Best Practices
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

const app = express();

// 1. Security headers (helmet)
app.use(helmet());

// 2. Rate limiting (OWASP A4:2021)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// 3. Input validation (OWASP A3:2021)
app.post('/api/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim(),
  async (req, res) => {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Sanitize
    const { email, password } = req.body;

    // Process
    try {
      const user = await createUser(email, password);
      res.status(201).json(user);
    } catch (error) {
      // 4. Error handling (don't leak details)
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Security Checklist:
// ✅ Input validation
// ✅ Rate limiting
// ✅ Security headers
// ✅ Error handling
// ✅ Authentication/Authorization
// ✅ SQL injection prevention
// ✅ XSS protection`,
      type: 'code',
      tags: ['backend', 'api', 'security', 'owasp', 'express', 'best-practices'],
      language: 'typescript',
    },
    {
      title: 'API Response Standards',
      content: `// Consistent API Response Format
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

// Success Response
res.status(200).json({
  success: true,
  data: { id: 1, name: 'John' },
  meta: {
    timestamp: new Date().toISOString(),
    requestId: req.id,
  },
});

// Error Response
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    details: { field: 'email', reason: 'not_email' },
  },
  meta: {
    timestamp: new Date().toISOString(),
    requestId: req.id,
  },
});

// HTTP Status Codes:
// 200 OK - Success
// 201 Created - Resource created
// 400 Bad Request - Invalid input
// 401 Unauthorized - Not authenticated
// 403 Forbidden - Not authorized
// 404 Not Found - Resource doesn't exist
// 500 Internal Server Error - Server error`,
      type: 'code',
      tags: ['backend', 'api', 'response', 'standards', 'best-practices'],
      language: 'typescript',
    },
  ],

  'dana-database': [
    {
      title: 'Supabase Row Level Security (RLS) Pattern',
      content: `-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all published posts
CREATE POLICY "Allow public read access to published posts"
ON posts FOR SELECT
USING (status = 'published');

-- Policy: Users can only update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only insert posts with their own user_id
CREATE POLICY "Users can insert own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Admin role can do everything
CREATE POLICY "Admins have full access"
ON posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Best Practices:
-- 1. Enable RLS on all user-facing tables
-- 2. Use auth.uid() for user-specific access
-- 3. Combine USING (read) and WITH CHECK (write)
-- 4. Test policies with different user roles
-- 5. Use service_role key to bypass RLS (server-side only)`,
      type: 'code',
      tags: ['database', 'supabase', 'security', 'rls', 'postgres', 'best-practices'],
      language: 'sql',
    },
    {
      title: 'Database Migration Pattern',
      content: `-- Migration: Add user profiles table
-- File: migrations/20250118_create_user_profiles.sql

-- Up Migration (apply changes)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read all profiles"
ON user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Down Migration (rollback)
-- DROP TRIGGER update_user_profiles_updated_at ON user_profiles;
-- DROP FUNCTION update_updated_at_column();
-- DROP POLICY "Users can update own profile" ON user_profiles;
-- DROP POLICY "Users can read all profiles" ON user_profiles;
-- DROP TABLE user_profiles;`,
      type: 'code',
      tags: ['database', 'migration', 'postgres', 'supabase', 'schema', 'best-practices'],
      language: 'sql',
    },
  ],

  'alex-ba': [
    {
      title: 'User Story Template',
      content: `User Story Format (Gherkin syntax):

**As a** [role/persona]
**I want** [feature/capability]
**So that** [business value/benefit]

**Acceptance Criteria:**

**Given** [initial context/state]
**When** [action/event occurs]
**Then** [expected outcome/behavior]

**Example:**

**As a** registered user
**I want** to reset my password via email
**So that** I can regain access if I forget my password

**Acceptance Criteria:**

1. **Given** I am on the login page
   **When** I click "Forgot Password" and enter my email
   **Then** I receive a password reset link via email within 5 minutes

2. **Given** I have a valid reset link
   **When** I click the link and enter a new password (min 8 chars)
   **Then** my password is updated and I'm redirected to login

3. **Given** the reset link is older than 1 hour
   **When** I click the link
   **Then** I see an error "Link expired" and option to request new link

**Definition of Done:**
- [ ] Backend API endpoint implemented
- [ ] Email template created
- [ ] Frontend UI implemented
- [ ] Unit tests (80%+ coverage)
- [ ] E2E tests passing
- [ ] Security review complete
- [ ] Documentation updated`,
      type: 'text',
      tags: ['requirements', 'user-story', 'gherkin', 'acceptance-criteria', 'best-practices'],
      language: 'markdown',
    },
  ],

  'sarah-pm': [
    {
      title: 'Sprint Planning Template',
      content: `Sprint Planning Checklist:

**Sprint Goal:**
[Clear, measurable objective for this sprint]

**Sprint Duration:** 2 weeks
**Start Date:** YYYY-MM-DD
**End Date:** YYYY-MM-DD

**Team Capacity:**
- Developers: X hours
- QA: Y hours
- Design: Z hours

**Sprint Backlog:**

High Priority:
1. [User Story] - 8 story points - Assigned: Developer A
2. [Bug Fix] - 3 story points - Assigned: Developer B

Medium Priority:
3. [Feature] - 13 story points - Assigned: Developer C

Low Priority (if time permits):
4. [Tech Debt] - 5 story points - Unassigned

**Definition of Done:**
- [ ] Code reviewed and approved
- [ ] Tests passing (80%+ coverage)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA approved
- [ ] Product owner accepted

**Risks:**
- [Risk 1]: Dependency on external API (Mitigation: Mock for dev)
- [Risk 2]: Team member on vacation (Mitigation: Cross-train)

**Daily Standup Time:** 9:30 AM
**Sprint Review:** [Date/Time]
**Sprint Retro:** [Date/Time]`,
      type: 'text',
      tags: ['project-management', 'sprint', 'planning', 'agile', 'best-practices'],
      language: 'markdown',
    },
  ],

  'dr-ai-ml': [
    {
      title: 'RAG Pipeline Pattern',
      content: `# Retrieval-Augmented Generation (RAG) Pipeline

## Architecture:
1. Document Ingestion → 2. Chunking → 3. Embedding → 4. Vector Storage → 5. Retrieval → 6. Generation

## Implementation:

\`\`\`python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Supabase
from langchain.chains import RetrievalQA

# 1. Chunk documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\\n\\n", "\\n", " ", ""]
)
chunks = text_splitter.split_documents(documents)

# 2. Generate embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 3. Store in vector database
vector_store = Supabase.from_documents(
    chunks,
    embeddings,
    client=supabase_client,
    table_name="documents"
)

# 4. Create retrieval chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)

# 5. Query
result = qa_chain({"query": "What are the best practices for RAG?"})
\`\`\`

## Best Practices:
- Chunk size: 500-1500 tokens (balance context vs precision)
- Overlap: 10-20% (prevents context loss at boundaries)
- Top-K retrieval: 3-10 (more = better context, slower)
- Embedding model: text-embedding-3-small (cheaper, fast)
- Reranking: Use cross-encoder for better relevance
- Metadata filtering: Add timestamps, categories, authors`,
      type: 'code',
      tags: ['ai', 'ml', 'rag', 'langchain', 'embeddings', 'best-practices'],
      language: 'python',
    },
  ],

  'general': [
    {
      title: 'Git Commit Message Convention',
      content: `Conventional Commits Format:

<type>(<scope>): <subject>

<body>

<footer>

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style (formatting, no logic change)
- refactor: Code refactoring
- perf: Performance improvements
- test: Adding/updating tests
- chore: Build process, dependencies, etc.

**Examples:**

feat(auth): add password reset functionality

Implement password reset via email with time-limited tokens.
Includes backend API, email template, and frontend UI.

Closes #123

---

fix(api): prevent race condition in user creation

Add mutex lock to prevent duplicate user creation when
multiple requests arrive simultaneously.

Fixes #456

---

docs(readme): update installation instructions

Add troubleshooting section for common pnpm install errors.

**Guidelines:**
- Use present tense ("add" not "added")
- Keep subject line <= 50 characters
- Capitalize subject line
- No period at end of subject
- Body explains "what" and "why" (not "how")`,
      type: 'text',
      tags: ['git', 'commit', 'convention', 'best-practices', 'general'],
      language: 'markdown',
    },
    {
      title: 'Environment Variables Best Practices',
      content: `# Environment Variables Security

## .env File (NEVER commit):
\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_SSL=true

# API Keys (secrets)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...

# App Config
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
\`\`\`

## .env.example (commit this):
\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_SSL=true

# API Keys (secrets - replace with your own)
OPENAI_API_KEY=your-openai-key-here
STRIPE_SECRET_KEY=your-stripe-key-here

# App Config
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
\`\`\`

## .gitignore:
\`\`\`
.env
.env.local
.env.*.local
*.key
*.pem
credentials.json
\`\`\`

## Best Practices:
1. NEVER commit .env files
2. Use .env.example as template (no secrets)
3. Validate required env vars on startup
4. Use different .env files per environment (.env.dev, .env.prod)
5. Rotate secrets regularly
6. Use secret management tools (Vault, AWS Secrets Manager)
7. Never log sensitive env vars
8. Use strong, unique values for each environment`,
      type: 'text',
      tags: ['security', 'environment', 'secrets', 'best-practices', 'general'],
      language: 'markdown',
    },
  ],
};

/**
 * Load environment variables
 */
function loadEnv() {
  const envPath = path.join(process.env.HOME, '.versatil', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('No .env file found at ~/.versatil/.env');
    log.info('Run: pnpm run rag:setup');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

/**
 * Generate hash-based embedding
 */
function generateHashEmbedding(content) {
  const hash = crypto.createHash('sha256').update(content).digest();
  const embedding = new Array(1536);

  for (let i = 0; i < 1536; i++) {
    const byteIndex = i % hash.length;
    embedding[i] = (hash[byteIndex] / 255) * 2 - 1;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Store patterns in Supabase
 */
async function storePatterns(supabase, patterns, dryRun = false) {
  if (dryRun) {
    log.info(`DRY RUN: Would store ${patterns.length} patterns`);
    return { success: patterns.length, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const pattern of patterns) {
    try {
      const embedding = generateHashEmbedding(pattern.content);

      const record = {
        content: pattern.content,
        content_type: pattern.contentType,
        embedding: embedding,
        metadata: {
          title: pattern.title,
          type: pattern.type,
          language: pattern.language,
          tags: pattern.tags,
          seeded_at: new Date().toISOString(),
          source: 'defaults',
        },
        agent_id: pattern.agentDomain,
      };

      const { error } = await supabase
        .from('versatil_memories')
        .insert([record]);

      if (error) {
        log.warn(`Failed to store pattern "${pattern.title}": ${error.message}`);
        failed++;
      } else {
        success++;
      }

    } catch (error) {
      log.warn(`Error processing pattern: ${error.message}`);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Main seeding function
 */
async function seedDefaultPatterns() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const silent = args.includes('--silent');

  if (!silent) {
    log.title('🌱 Seeding Universal Default Patterns to RAG');
  }

  if (dryRun && !silent) {
    log.warn('DRY RUN MODE - Patterns will not be stored');
  }

  // Load environment
  if (!silent) log.info('Loading Supabase credentials...');
  const env = loadEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    if (!silent) log.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    if (silent) process.exit(0); // Silent fail in postinstall
    process.exit(1);
  }

  if (env.SUPABASE_URL.includes('your-') || env.SUPABASE_SERVICE_KEY.includes('your-')) {
    if (!silent) log.error('Placeholder credentials detected. Run: pnpm run rag:setup');
    if (silent) process.exit(0); // Silent fail in postinstall
    process.exit(1);
  }

  // Connect to Supabase
  if (!silent) log.info('Connecting to Supabase...');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Test connection
  try {
    const { data, error } = await supabase.from('versatil_memories').select('id').limit(1);
    if (error) {
      if (!silent) log.error(`Connection failed: ${error.message}`);
      if (silent) process.exit(0); // Silent fail in postinstall
      process.exit(1);
    }
    if (!silent) log.success('Connected to Supabase');
  } catch (error) {
    if (!silent) log.error(`Connection test failed: ${error.message}`);
    if (silent) process.exit(0); // Silent fail in postinstall
    process.exit(1);
  }

  // Prepare patterns
  if (!silent) log.info('Preparing default patterns...');
  const allPatterns = [];

  for (const [agentDomain, patterns] of Object.entries(DEFAULT_PATTERNS)) {
    for (const pattern of patterns) {
      allPatterns.push({
        ...pattern,
        agentDomain,
        contentType: pattern.type === 'code' ? 'code' : 'text',
      });
    }
  }

  if (!silent) log.success(`Prepared ${allPatterns.length} universal patterns`);

  // Show breakdown
  const breakdown = {};
  for (const pattern of allPatterns) {
    breakdown[pattern.agentDomain] = (breakdown[pattern.agentDomain] || 0) + 1;
  }

  if (!silent) {
    log.info('Pattern breakdown by agent:');
    for (const [agent, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${agent.padEnd(20)} : ${count} patterns`);
    }
  }

  // Store patterns
  if (!silent) log.info('\nStoring patterns in Supabase...');
  const { success, failed } = await storePatterns(supabase, allPatterns, dryRun);

  // Summary
  if (!silent) {
    log.title('✅ Seeding Complete');
    log.success(`${success} patterns stored successfully`);
    if (failed > 0) {
      log.warn(`${failed} patterns failed to store`);
    }

    if (!dryRun) {
      log.info('\nVerify patterns: pnpm run rag:test');
      log.info('Add framework patterns: pnpm run rag:seed-framework');
    }
  }
}

// Run
seedDefaultPatterns().catch(error => {
  log.error('Seeding failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
