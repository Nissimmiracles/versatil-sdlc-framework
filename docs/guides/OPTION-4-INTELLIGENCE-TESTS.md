# Option 4: Intelligence Testing & Validation

**Goal:** Validate framework's AI capabilities through systematic testing

**Time:** 30-45 minutes for setup, ongoing for validation

**Benefit:** Ensure framework intelligence operates at peak performance

---

## Overview

This guide provides comprehensive testing procedures for validating the framework's AI-powered intelligence systems:

1. **RAG Intelligence** - Pattern storage, retrieval, learning
2. **Agent Coordination** - Multi-agent handoffs, parallel execution
3. **Quality Gates** - Coverage, security, performance enforcement
4. **User Intent Understanding** - Natural language parsing, context coherence

---

## Test Category 1: RAG Intelligence (20 tests)

### Purpose
Validate that the framework learns from your patterns and provides intelligent suggestions.

### Test Suite 1.1: Pattern Storage & Retrieval (8 tests)

**Test 1: Store coding pattern**
```bash
# Setup: Create a component following your pattern
cat > src/components/TestComponent.tsx << 'EOF'
import { memo } from 'react';

interface Props {
  title: string;
}

export const TestComponent = memo(function TestComponent({ title }: Props) {
  return <h1>{title}</h1>;
});
EOF

# Expected: Framework learns pattern
# Wait 5 seconds for RAG indexing

# Validation: Query for pattern
npx @versatil/sdlc-framework query "How do I create a React component?"

# Expected output should include:
# ✓ "Use memo() for performance"
# ✓ "Named function inside memo"
# ✓ "TypeScript interface for props"
```

**Test 2: Retrieve learned pattern in new file**
```bash
# Create new file, ask for help
cat > src/components/NewComponent.tsx << 'EOF'
// TODO: Create component
EOF

# In Cursor Chat, type: "Create a React component"
# Expected: Suggestion matches TestComponent pattern (memo, named function)
```

**Test 3: Privacy isolation (user-level patterns)**
```bash
# Store user-specific pattern
npx @versatil/sdlc-framework rag store \
  --pattern "Always use Zod for validation" \
  --privacy "user" \
  --userId "test-user-123"

# Query as different user
npx @versatil/sdlc-framework rag query \
  --query "How do I validate input?" \
  --userId "different-user-456"

# Expected: Should NOT return Zod pattern (privacy isolated)
```

**Test 4: Team-level pattern sharing**
```bash
# Store team pattern
npx @versatil/sdlc-framework rag store \
  --pattern "Use React Query for all API calls" \
  --privacy "team" \
  --teamId "team-alpha"

# Query as team member
npx @versatil/sdlc-framework rag query \
  --query "How do I fetch data?" \
  --userId "user-1" \
  --teamId "team-alpha"

# Expected: Returns React Query pattern (team sharing works)
```

**Test 5: Semantic similarity search**
```bash
# Store multiple patterns
npx @versatil/sdlc-framework rag store --pattern "Use async/await for promises"
npx @versatil/sdlc-framework rag store --pattern "Use Promise.then() chains"

# Query with semantic similarity
npx @versatil/sdlc-framework rag query \
  --query "How do I handle asynchronous code?" \
  --limit 5

# Expected: Returns both patterns (semantic similarity detected)
# Expected: Ranked by relevance score
```

**Test 6: Pattern ranking by usage**
```bash
# Store pattern and record usage
npx @versatil/sdlc-framework rag store \
  --pattern "Use JWT for authentication" \
  --usage-count 0

# Simulate usage (framework auto-increments)
for i in {1..10}; do
  npx @versatil/sdlc-framework rag record-usage --pattern-id "jwt-auth-pattern"
done

# Query patterns
npx @versatil/sdlc-framework rag query --query "authentication" --sort-by "usage"

# Expected: JWT pattern ranked higher due to usage count
```

**Test 7: Pattern decay (staleness)**
```bash
# Store old pattern with timestamp
npx @versatil/sdlc-framework rag store \
  --pattern "Use class components" \
  --timestamp "2020-01-01T00:00:00Z"

# Store new pattern
npx @versatil/sdlc-framework rag store \
  --pattern "Use functional components with hooks" \
  --timestamp "2025-01-01T00:00:00Z"

# Query with staleness filter
npx @versatil/sdlc-framework rag query \
  --query "React components" \
  --max-age-days 365

# Expected: Only returns functional components (class components too old)
```

**Test 8: Pattern pruning**
```bash
# Check pattern count
npx @versatil/sdlc-framework rag stats

# Expected output:
# Total patterns: ~1,500
# User patterns: ~500
# Team patterns: ~800
# Public patterns: ~200

# Run pruning (removes unused patterns older than 6 months)
npx @versatil/sdlc-framework rag prune --dry-run

# Expected: Shows patterns to be removed
# Expected: Keeps frequently used patterns regardless of age
```

### Test Suite 1.2: GraphRAG Knowledge Graph (6 tests)

**Test 9: Entity extraction**
```bash
# Create code with entities
cat > src/services/payment-processor.ts << 'EOF'
import { Stripe } from 'stripe';
import { User } from './models/user';

export class PaymentProcessor {
  async processPayment(user: User, amount: number) {
    const stripe = new Stripe(process.env.STRIPE_KEY);
    return await stripe.charges.create({ amount, currency: 'usd' });
  }
}
EOF

# Index file
npx @versatil/sdlc-framework rag index src/services/payment-processor.ts

# Query graph for entities
npx @versatil/sdlc-framework rag graph entities --type "class"

# Expected: Returns PaymentProcessor as entity
# Expected: Shows relationships: uses Stripe, uses User
```

**Test 10: Relationship traversal**
```bash
# Query relationships
npx @versatil/sdlc-framework rag graph relationships \
  --entity "PaymentProcessor" \
  --depth 2

# Expected output:
# PaymentProcessor
#   → uses → Stripe (external library)
#   → uses → User (internal model)
#     → uses → Database (persistence layer)
```

**Test 11: Pattern-based queries**
```bash
# Find all payment-related patterns
npx @versatil/sdlc-framework rag graph query \
  --pattern "payment" \
  --include-related true

# Expected: Returns PaymentProcessor, Stripe integration, error handling patterns
```

**Test 12: Graph visualization**
```bash
# Generate visual graph
npx @versatil/sdlc-framework rag graph visualize \
  --output graph.html \
  --max-nodes 50

# Open graph.html in browser
# Expected: Interactive graph showing entities, relationships, patterns
```

**Test 13: Cycle detection**
```bash
# Check for circular dependencies
npx @versatil/sdlc-framework rag graph cycles

# Expected output (if healthy):
# ✓ No cycles detected
# ✓ Graph is acyclic

# Expected output (if issues):
# ⚠️  Cycle detected: A → B → C → A
```

**Test 14: Pattern propagation**
```bash
# Add pattern to entity
npx @versatil/sdlc-framework rag graph annotate \
  --entity "PaymentProcessor" \
  --pattern "Always validate amount > 0"

# Query related entities
npx @versatil/sdlc-framework rag graph query \
  --related-to "PaymentProcessor"

# Expected: Related entities (e.g., RefundProcessor) show inherited patterns
```

### Test Suite 1.3: Adaptive Learning (6 tests)

**Test 15: Feedback incorporation**
```bash
# Get suggestion
npx @versatil/sdlc-framework query "How do I handle errors?"

# Suggestion: "Use try/catch blocks"

# Provide feedback
npx @versatil/sdlc-framework rag feedback \
  --suggestion-id "error-handling-1" \
  --rating 2 \
  --comment "Prefer Result<T, E> type instead"

# Re-query
npx @versatil/sdlc-framework query "How do I handle errors?"

# Expected: Adjusted suggestion incorporating feedback
```

**Test 16: Context-aware suggestions**
```bash
# Query in React context
cd src/components
npx @versatil/sdlc-framework query "error handling"

# Expected: React-specific suggestions (Error Boundaries)

# Query in Node.js context
cd ../../api
npx @versatil/sdlc-framework query "error handling"

# Expected: Node.js-specific suggestions (async error middleware)
```

**Test 17: Learning from corrections**
```bash
# Framework suggests wrong pattern
# (Simulated by editing suggested code)

# Framework detects correction in git diff
git add src/components/UserForm.tsx
git commit -m "fix: Use react-hook-form instead of manual state"

# Framework learns from commit message + diff
# Expected: Next time, suggests react-hook-form for forms
```

**Test 18: A/B testing suggestions**
```bash
# Enable A/B testing
npx @versatil/sdlc-framework rag config \
  --enable-ab-testing true \
  --split-ratio 0.5

# Half the time: Suggestion A
# Half the time: Suggestion B
# Framework tracks which gets better feedback

# After 100 trials:
npx @versatil/sdlc-framework rag ab-results

# Expected: Shows winner, automatically promotes better suggestion
```

**Test 19: Reinforcement learning from outcomes**
```bash
# Framework tracks outcomes
# Suggestion → Code → Test Pass/Fail → CI Pass/Fail

# Query learning metrics
npx @versatil/sdlc-framework rag learning-stats

# Expected output:
# Suggestion: "Use Zod validation"
#   → Test pass rate: 94%
#   → CI pass rate: 89%
#   → User rating: 4.2/5
#   → Confidence: HIGH

# Suggestion: "Manual validation with if/else"
#   → Test pass rate: 67%
#   → CI pass rate: 61%
#   → User rating: 2.8/5
#   → Confidence: LOW (deprioritized)
```

**Test 20: Transfer learning across projects**
```bash
# Enable global learning (opt-in)
npx @versatil/sdlc-framework rag config \
  --enable-global-learning true \
  --anonymize-data true

# Your patterns contribute to global knowledge base (anonymized)
# You benefit from patterns learned across all opt-in users

# Check global pattern pool
npx @versatil/sdlc-framework rag global-stats

# Expected: Access to 100,000+ anonymized patterns from community
```

---

## Test Category 2: Agent Coordination (15 tests)

### Purpose
Validate multi-agent workflows execute efficiently and correctly.

### Test Suite 2.1: Handoff Speed (5 tests)

**Test 21: Two-agent handoff (Alex → James)**
```bash
# Time the handoff
time npx @versatil/sdlc-framework test-handoff \
  --from "alex-ba" \
  --to "james-frontend" \
  --task "Create user story, then implement UI"

# Expected: <150ms handoff latency
# Expected output:
# Alex-BA: 2.3s (user story creation)
# Handoff: 127ms
# James-Frontend: 8.1s (UI implementation)
# Total: 10.527s
```

**Test 22: Three-agent chain (Alex → Marcus → Maria)**
```bash
time npx @versatil/sdlc-framework test-handoff \
  --chain "alex-ba,marcus-backend,maria-qa" \
  --task "Create API user story, implement, test"

# Expected: <150ms per handoff
# Expected: Total time < sum(agent times) + 300ms
```

**Test 23: Parallel agent execution**
```bash
# Test parallel execution (James + Marcus simultaneously)
time npx @versatil/sdlc-framework test-parallel \
  --agents "james-frontend,marcus-backend" \
  --task "Implement feature"

# Expected: Total time ≈ max(James time, Marcus time), NOT sum
# Expected: Both agents start within 50ms of each other
```

**Test 24: Agent pool warm start**
```bash
# Cold start (no agent pool)
npx @versatil/sdlc-framework stop  # Stop daemon
time npx @versatil/sdlc-framework agent invoke --agent "james-frontend"

# Expected: ~500ms (cold start)

# Warm start (agent pool active)
npx @versatil/sdlc-framework start --daemon
sleep 5  # Wait for pool to warm up
time npx @versatil/sdlc-framework agent invoke --agent "james-frontend"

# Expected: ~150ms (50% faster with pool)
```

**Test 25: Handoff under load**
```bash
# Simulate 10 concurrent handoffs
for i in {1..10}; do
  npx @versatil/sdlc-framework test-handoff \
    --from "alex-ba" --to "james-frontend" &
done
wait

# Expected: All complete successfully
# Expected: Average latency <200ms (slight degradation under load acceptable)
```

### Test Suite 2.2: Context Preservation (5 tests)

**Test 26: Context passed between agents**
```bash
# Start workflow with context
npx @versatil/sdlc-framework workflow start \
  --task "Create auth feature" \
  --context '{"userId": "test-user", "preferences": {"framework": "react"}}'

# Validate context preserved through chain
npx @versatil/sdlc-framework workflow status --show-context

# Expected output:
# Alex-BA: ✓ (received context: userId, preferences)
# Marcus-Backend: ✓ (received context from Alex)
# James-Frontend: ✓ (used preference: react)
```

**Test 27: RAG context sharing**
```bash
# Alex stores pattern
npx @versatil/sdlc-framework workflow start \
  --agent "alex-ba" \
  --task "Analyze existing auth patterns"

# Marcus retrieves Alex's patterns
npx @versatil/sdlc-framework workflow continue \
  --agent "marcus-backend" \
  --task "Implement auth using learned patterns"

# Expected: Marcus's implementation uses patterns Alex discovered
```

**Test 28: Conversation history maintained**
```bash
# Multi-turn conversation
npx @versatil/sdlc-framework chat start
> "Create a user dashboard"
> "Add a chart showing login history"
> "Make it responsive"
> "Add dark mode"

# Check conversation history
npx @versatil/sdlc-framework chat history

# Expected: All 4 turns preserved, context builds incrementally
```

**Test 29: File context awareness**
```bash
# Edit file
code src/components/UserDashboard.tsx

# In Cursor Chat: "Optimize this component"
# Expected: Agent knows you're referring to UserDashboard.tsx (file context)
# Expected: Suggestions specific to that file
```

**Test 30: Project context isolation**
```bash
# Work on Project A
cd ~/project-a
npx @versatil/sdlc-framework context set --project "project-a"

# Store pattern
npx @versatil/sdlc-framework rag store --pattern "Use Redux for state"

# Switch to Project B
cd ~/project-b
npx @versatil/sdlc-framework context set --project "project-b"

# Query patterns
npx @versatil/sdlc-framework rag query "state management"

# Expected: Redux pattern NOT returned (project isolation)
```

### Test Suite 2.3: Error Recovery (5 tests)

**Test 31: Agent failure with fallback**
```bash
# Simulate agent failure
npx @versatil/sdlc-framework test-failure \
  --agent "marcus-backend" \
  --failure-mode "timeout"

# Expected: Framework detects timeout
# Expected: Automatically retries with fallback agent
# Expected: Workflow completes successfully
```

**Test 32: Partial failure recovery**
```bash
# Simulate partial failure (2 of 3 agents succeed)
npx @versatil/sdlc-framework workflow start \
  --agents "alex-ba,marcus-backend,james-frontend" \
  --simulate-failure "marcus-backend"

# Expected: Alex and James succeed
# Expected: Marcus failure logged
# Expected: User prompted: "Marcus failed, retry or continue without backend?"
```

**Test 33: Rollback on quality gate failure**
```bash
# Start workflow
npx @versatil/sdlc-framework workflow start \
  --task "Implement feature" \
  --enforce-quality-gates true

# Simulate test failure
# Expected: Workflow detects test failure
# Expected: Automatically rolls back code changes
# Expected: Preserves working state
```

**Test 34: Retry with exponential backoff**
```bash
# Simulate transient failure (network issue)
npx @versatil/sdlc-framework test-retry \
  --agent "dana-database" \
  --failure-mode "network-timeout" \
  --failure-count 2

# Expected retry schedule:
# Attempt 1: Immediate (fails)
# Attempt 2: +1s delay (fails)
# Attempt 3: +2s delay (succeeds)
# Total: ~3s with exponential backoff
```

**Test 35: Circuit breaker pattern**
```bash
# Simulate repeated failures
for i in {1..10}; do
  npx @versatil/sdlc-framework agent invoke --agent "failing-agent"
done

# Expected: After 5 failures, circuit breaker opens
# Expected: Subsequent requests fail-fast (no retry)
# Expected: Circuit half-opens after 30s for retry
```

---

## Test Category 3: Quality Gates (20 tests)

### Purpose
Validate that quality standards are enforced automatically.

### Test Suite 3.1: Test Coverage Gates (5 tests)

**Test 36: Block commit on low coverage**
```bash
# Create file without tests
cat > src/utils/calculator.ts << 'EOF'
export function add(a: number, b: number): number {
  return a + b;
}
EOF

# Try to commit
git add src/utils/calculator.ts
git commit -m "Add calculator"

# Expected: BLOCKED
# Expected output:
# ⚠️  Quality Gate: FAILED
# Coverage: 0% (target: 80%)
# Missing tests: src/utils/calculator.ts
```

**Test 37: Allow commit with sufficient coverage**
```bash
# Create file WITH tests
cat > src/utils/calculator.test.ts << 'EOF'
import { add } from './calculator';
test('adds numbers', () => {
  expect(add(1, 2)).toBe(3);
});
EOF

# Commit both
git add src/utils/calculator.ts src/utils/calculator.test.ts
git commit -m "Add calculator with tests"

# Expected: SUCCESS
# Expected: Coverage: 100% ✓
```

**Test 38: Coverage trend monitoring**
```bash
# Check coverage trend
npx @versatil/sdlc-framework quality coverage-trend --days 7

# Expected output:
# Day 1: 78%
# Day 2: 79%
# Day 3: 81% ✓ (reached target)
# Day 4: 82%
# Day 5: 80%
# Day 6: 79% ⚠️  (regression)
# Day 7: 81% ✓ (recovered)
```

**Test 39: Per-file coverage requirements**
```bash
# Set file-specific coverage
cat > .versatil/coverage-rules.json << 'EOF'
{
  "global": 80,
  "critical": 95,
  "patterns": {
    "src/api/**": 90,
    "src/utils/**": 85,
    "src/components/**": 75
  }
}
EOF

# Test enforcement
git add src/api/auth.ts  # 89% coverage
git commit -m "Update auth"

# Expected: BLOCKED (requires 90% for API files)
```

**Test 40: Incremental coverage improvement**
```bash
# Enable incremental mode (only check new/modified files)
npx @versatil/sdlc-framework quality config \
  --coverage-mode "incremental"

# Modify file with existing low coverage
sed -i '' 's/function/export function/g' src/legacy/old-code.ts

# Commit
git add src/legacy/old-code.ts
git commit -m "Export old-code function"

# Expected: SUCCESS (incremental mode ignores pre-existing low coverage)
# Expected: NEW code must meet 80% threshold
```

### Test Suite 3.2: Security Gates (5 tests)

**Test 41: Detect SQL injection**
```bash
# Create vulnerable code
cat > src/api/users.ts << 'EOF'
app.get('/users', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  db.query(query);
});
EOF

# Try to commit
git add src/api/users.ts
git commit -m "Add user API"

# Expected: BLOCKED
# Expected output:
# 🚨 Security Gate: FAILED
# Vulnerability: SQL Injection (CRITICAL)
# Line 2: Unsanitized user input in SQL query
```

**Test 42: Detect hardcoded secrets**
```bash
# Create file with secret
cat > src/config.ts << 'EOF'
export const API_KEY = "sk_live_1234567890abcdef";
EOF

# Try to commit
git add src/config.ts
git commit -m "Add config"

# Expected: BLOCKED
# Expected output:
# 🚨 Security Gate: FAILED
# Issue: Hardcoded secret detected
# Line 1: API key should use environment variable
```

**Test 43: Detect outdated dependencies**
```bash
# Add vulnerable dependency
npm install express@4.16.0  # Old version with known CVEs

# Try to commit package-lock.json
git add package-lock.json
git commit -m "Add express"

# Expected: BLOCKED
# Expected output:
# 🚨 Security Gate: FAILED
# Vulnerability: CVE-2022-24999 (express@4.16.0)
# Fix: npm install express@latest
```

**Test 44: OWASP Top 10 validation**
```bash
# Run OWASP security scan
npx @versatil/sdlc-framework quality security-scan \
  --standard "owasp-top-10"

# Expected checks:
# ✓ A01: Broken Access Control
# ✓ A02: Cryptographic Failures
# ✓ A03: Injection
# ✓ A04: Insecure Design
# ✓ A05: Security Misconfiguration
# ✓ A06: Vulnerable Components
# ✓ A07: Auth Failures
# ✓ A08: Software Integrity Failures
# ✓ A09: Logging Failures
# ✓ A10: SSRF

# Expected: Report with pass/fail for each
```

**Test 45: Security audit automation**
```bash
# Enable automated security audits (weekly)
npx @versatil/sdlc-framework quality config \
  --security-audit-schedule "0 0 * * 0"  # Every Sunday

# Trigger manual audit
npx @versatil/sdlc-framework quality security-audit

# Expected: Full scan of codebase
# Expected: Report sent to configured channels (Slack, email)
```

### Test Suite 3.3: Performance Gates (5 tests)

**Test 46: API response time check**
```bash
# Create slow endpoint
cat > src/api/slow.ts << 'EOF'
app.get('/api/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 5000));  // 5s delay
  res.json({ message: 'ok' });
});
EOF

# Run performance test
npx @versatil/sdlc-framework quality perf-test \
  --endpoint "/api/slow" \
  --threshold 200

# Expected: FAILED
# Expected output:
# ⚠️  Performance Gate: FAILED
# Response time: 5,000ms (target: <200ms)
```

**Test 47: Bundle size validation**
```bash
# Add large dependency
npm install moment  # ~70KB

# Build and check bundle
pnpm run build
npx @versatil/sdlc-framework quality bundle-size \
  --max-size 500

# Expected: Check bundle size
# Expected: Warn if >500KB, suggest alternatives (date-fns instead of moment)
```

**Test 48: Memory leak detection**
```bash
# Run memory leak test
npx @versatil/sdlc-framework quality memory-leak \
  --duration 60 \
  --threshold 10

# Expected: Monitors memory usage for 60s
# Expected: Fails if memory increases >10MB without GC
```

**Test 49: Lighthouse performance score**
```bash
# Run Lighthouse audit
npx @versatil/sdlc-framework quality lighthouse \
  --url "http://localhost:3000" \
  --min-score 90

# Expected scores:
# Performance: 92 ✓
# Accessibility: 95 ✓
# Best Practices: 88 ⚠️  (below threshold)
# SEO: 100 ✓
```

**Test 50: Database query optimization**
```bash
# Detect N+1 queries
npx @versatil/sdlc-framework quality db-queries \
  --log-slow-queries true \
  --threshold 100

# Expected: Logs queries taking >100ms
# Expected: Suggests indexes or query optimization
```

### Test Suite 3.4: Accessibility Gates (5 tests)

**Test 51: WCAG AA compliance**
```bash
# Create component
cat > src/components/Button.tsx << 'EOF'
export const Button = () => <button>Click</button>;
EOF

# Run accessibility audit
npx @versatil/sdlc-framework quality accessibility \
  --standard "wcag-aa" \
  --file "src/components/Button.tsx"

# Expected: FAILED
# Expected issues:
# - Missing aria-label
# - No keyboard focus indicator
# - Insufficient color contrast
```

**Test 52: Screen reader compatibility**
```bash
# Test with screen reader
npx @versatil/sdlc-framework quality screen-reader \
  --url "http://localhost:3000/profile"

# Expected: Simulates screen reader
# Expected: Verifies all interactive elements are announced
```

**Test 53: Keyboard navigation**
```bash
# Test keyboard-only navigation
npx @versatil/sdlc-framework quality keyboard-nav \
  --url "http://localhost:3000"

# Expected: Simulates Tab, Shift+Tab, Enter, Escape
# Expected: Verifies all UI is accessible via keyboard
```

**Test 54: Color contrast validation**
```bash
# Check contrast ratios
npx @versatil/sdlc-framework quality color-contrast \
  --file "src/styles/theme.css"

# Expected checks:
# Text: 4.5:1 minimum (AA)
# Large text: 3:1 minimum (AA)
# Non-text: 3:1 minimum (AA)
```

**Test 55: Semantic HTML validation**
```bash
# Validate HTML structure
npx @versatil/sdlc-framework quality semantic-html \
  --file "src/pages/Dashboard.tsx"

# Expected checks:
# ✓ Proper heading hierarchy (h1 → h2 → h3)
# ✓ Semantic elements (<nav>, <main>, <article>)
# ✗ Div soup detected (suggest semantic alternatives)
```

---

## Test Category 4: User Intent Understanding (10 tests)

### Purpose
Validate the framework correctly interprets natural language requests.

### Test Suite 4.1: Request Parsing (5 tests)

**Test 56: Simple request**
```bash
# Query: "Create a login form"
npx @versatil/sdlc-framework intent parse "Create a login form"

# Expected output:
# Intent: CREATE_COMPONENT
# Type: FORM
# Subtypes: [LOGIN, AUTHENTICATION]
# Required Agents: [james-frontend, marcus-backend]
# Estimated Complexity: LOW (1-2 files)
```

**Test 57: Complex multi-step request**
```bash
# Query: "Build a dashboard with charts showing user activity, make it responsive, add export to PDF"
npx @versatil/sdlc-framework intent parse "Build a dashboard with charts showing user activity, make it responsive, add export to PDF"

# Expected output:
# Intent: CREATE_FEATURE
# Components:
#   1. Dashboard layout (james-frontend)
#   2. Charts (james-frontend + data fetching from marcus-backend)
#   3. Responsive design (james-frontend)
#   4. PDF export (marcus-backend + library integration)
# Required Agents: [alex-ba, james-frontend, marcus-backend, maria-qa]
# Estimated Complexity: MEDIUM (8-12 files)
```

**Test 58: Ambiguous request clarification**
```bash
# Query: "Fix the bug"
npx @versatil/sdlc-framework intent parse "Fix the bug"

# Expected output:
# Intent: FIX_BUG
# ⚠️  Ambiguous: Which bug?
# Clarification needed:
#   1. Which file/component?
#   2. What is the expected behavior?
#   3. What is the current behavior?
```

**Test 59: Context-aware parsing**
```bash
# Set context (user is editing UserProfile.tsx)
npx @versatil/sdlc-framework context set \
  --file "src/components/UserProfile.tsx"

# Query: "Optimize this"
npx @versatil/sdlc-framework intent parse "Optimize this"

# Expected output:
# Intent: OPTIMIZE_COMPONENT
# Target: src/components/UserProfile.tsx (from context)
# Optimization types: [PERFORMANCE, BUNDLE_SIZE, ACCESSIBILITY]
# Agent: james-frontend
```

**Test 60: Multi-intent request**
```bash
# Query: "Create auth API and add tests"
npx @versatil/sdlc-framework intent parse "Create auth API and add tests"

# Expected output:
# Intents:
#   1. CREATE_API (marcus-backend)
#   2. CREATE_TESTS (maria-qa)
# Execution: Sequential (API first, then tests)
# Estimated time: 30-45 seconds
```

### Test Suite 4.2: Coherence Monitoring (5 tests)

**Test 61: Detect context switches**
```bash
# Conversation:
> "Create a user dashboard"
> "Add a chart"
> "What's the weather?"  # ← Context switch

npx @versatil/sdlc-framework coherence check

# Expected: Detects context switch
# Expected: Asks: "Switch topic to weather, or continue with dashboard?"
```

**Test 62: Maintain multi-turn context**
```bash
# Conversation:
> "Create a button"
> "Make it blue"
> "Add an icon"
> "Center it"

npx @versatil/sdlc-framework coherence check

# Expected: All requests coherent (all modify same button)
# Expected: Context preserved through 4 turns
```

**Test 63: Detect contradictions**
```bash
# Conversation:
> "Use Redux for state management"
> "Don't use Redux, use Context API"  # ← Contradiction

npx @versatil/sdlc-framework coherence check

# Expected: Detects contradiction
# Expected: Asks: "Replace Redux with Context, or use both?"
```

**Test 64: Infer implicit requests**
```bash
# Conversation:
> "Create a payment form"

# Framework infers:
# - Need validation (implicit)
# - Need security (implicit)
# - Need error handling (implicit)
# - Need tests (implicit)

npx @versatil/sdlc-framework intent infer

# Expected: Suggests additional tasks based on best practices
```

**Test 65: User expertise adaptation**
```bash
# New user (detected from interaction history)
npx @versatil/sdlc-framework user profile --id "new-user"

# Query: "Optimize performance"
# Expected response: Detailed explanations, step-by-step guidance

# Experienced user
npx @versatil/sdlc-framework user profile --id "expert-user"

# Query: "Optimize performance"
# Expected response: Concise technical suggestions, assume knowledge
```

---

## Success Criteria

### RAG Intelligence
- ✅ Patterns stored and retrieved accurately
- ✅ Privacy isolation enforced (user/team/project)
- ✅ Semantic similarity search working
- ✅ Learning from feedback and corrections
- ✅ GraphRAG knowledge graph operational

### Agent Coordination
- ✅ Handoffs <150ms latency
- ✅ Context preserved across agents
- ✅ Parallel execution working
- ✅ Error recovery with fallbacks
- ✅ Circuit breaker prevents cascading failures

### Quality Gates
- ✅ Test coverage enforced (80%+)
- ✅ Security vulnerabilities blocked
- ✅ Performance thresholds validated
- ✅ Accessibility compliance checked (WCAG AA)
- ✅ Gates can be bypassed with --no-verify (emergency)

### User Intent Understanding
- ✅ Simple requests parsed correctly
- ✅ Complex requests broken into steps
- ✅ Ambiguous requests trigger clarification
- ✅ Context maintained across conversation
- ✅ Contradictions detected and resolved

---

## Continuous Testing

### Automated Daily Tests
```bash
# Add to CI/CD pipeline
npx @versatil/sdlc-framework test intelligence --suite all

# Runs all 65 intelligence tests
# Expected: <5 minutes total
# Expected: Generate report with pass/fail for each
```

### Weekly Intelligence Audit
```bash
# Full system audit (Fridays)
npx @versatil/sdlc-framework audit intelligence \
  --comprehensive true \
  --report-to "team@company.com"

# Expected: Comprehensive report covering:
# - RAG learning rate
# - Agent coordination efficiency
# - Quality gate effectiveness
# - User satisfaction (from feedback)
```

---

## Next Steps

After validating intelligence:
1. **Optimize Patterns** → Refine based on test results
2. **Tune Quality Gates** → Adjust thresholds if too strict/lenient
3. **Expand Learning** → Enable global learning for community patterns
4. **Custom Agents** → Create domain-specific intelligence

**Related Guides:**
- [OPTION-1-TESTING-ROADMAP.md](./OPTION-1-TESTING-ROADMAP.md) - Code coverage testing
- [OPTION-2-PROJECT-SETUP.md](./OPTION-2-PROJECT-SETUP.md) - Framework setup
- [OPTION-5-AUTO-ACTIVATION-PATTERNS.md](./OPTION-5-AUTO-ACTIVATION-PATTERNS.md) - Customize triggers

---

**Congratulations! You now have a comprehensive intelligence testing framework. Validate regularly to ensure peak AI performance. 🧠**
