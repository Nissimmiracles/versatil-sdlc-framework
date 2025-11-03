# Option 2: Setup Framework for Your Actual Development Workflow

**Goal:** Configure VERSATIL Framework to work with YOUR real project (not the framework itself)

**Time:** 30-45 minutes

**Benefit:** Start getting automatic agent assistance in YOUR codebase TODAY

---

## Overview

This guide walks you through setting up the VERSATIL Framework to monitor and assist with your actual development project. After setup, agents will automatically activate when you edit files, providing real-time suggestions, quality checks, and testing assistance.

---

## Prerequisites

**Required:**
- Node.js 18+ installed
- Your project directory accessible
- Cursor or Claude Code installed

**Optional:**
- Git repository initialized
- Existing test suite
- CI/CD pipeline

---

## Step 1: Project Detection (5 minutes)

### 1.1 Navigate to Your Project

```bash
cd /path/to/your/actual/project
```

### 1.2 Run Framework Discovery

```bash
npx @versatil/sdlc-framework init --scan
```

**What This Does:**
- Scans your project structure
- Detects tech stack (React/Vue/Angular, Node/Python/Go, etc.)
- Identifies existing patterns
- Analyzes file organization

**Example Output:**
```
🔍 Scanning project: /Users/you/my-saas-app

✅ Detected Stack:
   Frontend: React 18 + TypeScript
   Backend: Node.js + Express
   Database: PostgreSQL (Supabase)
   Testing: Vitest + React Testing Library

✅ Detected Patterns:
   - 127 React components
   - 34 API endpoints
   - 89 test files (42% coverage)
   - ESLint + Prettier configured

✅ Recommended Agents:
   - James-Frontend (React specialist)
   - Marcus-Backend (Node.js specialist)
   - Dana-Database (PostgreSQL specialist)
   - Maria-QA (Testing specialist)
```

---

## Step 2: Interactive Configuration (10 minutes)

### 2.1 Answer Setup Questions

```bash
npx @versatil/sdlc-framework configure
```

**Questions & Recommendations:**

**Q1: Which agents do you want to enable?**
```
✓ James-Frontend (React)
✓ Marcus-Backend (Node.js/Express)
✓ Dana-Database (PostgreSQL)
✓ Maria-QA (Testing)
✓ Sarah-PM (Project Management)
○ Alex-BA (Business Analysis)
○ Dr.AI-ML (Machine Learning)
○ Oliver-MCP (MCP Orchestration)

Recommended: ✓ (Based on your stack)
Custom selection? [Y/n]: n
```

**Q2: Enable automatic agent activation?**
```
Automatic activation means agents watch your files and
activate without manual commands.

Enable? [Y/n]: Y

✅ Agents will auto-activate on file changes
```

**Q3: Configure quality gates?**
```
Quality gates enforce standards before commit/push.

Minimum test coverage? [80]: 75
Block commits on test failures? [Y/n]: Y
Enforce security scans? [Y/n]: Y
Performance checks (<200ms)? [Y/n]: Y

✅ Quality gates configured
```

**Q4: File watching preferences?**
```
Which directories should we watch?

✓ src/
✓ tests/
✓ api/
○ scripts/
○ docs/

Watch all by default? [Y/n]: Y
```

### 2.2 Generated Configuration Files

After answering questions, framework generates:

**File: `.cursorrules`**
```yaml
# Auto-generated for: my-saas-app
# Stack: React + Node.js + PostgreSQL

james-frontend_triggers:
  auto_activate: true
  priority: 5
  file_patterns:
    - "*.tsx"
    - "*.jsx"
    - "src/components/**/*"
  focus: React components, accessibility, performance

marcus-backend_triggers:
  auto_activate: true
  priority: 5
  file_patterns:
    - "api/**/*.ts"
    - "src/services/**/*"
  focus: API security, OWASP compliance, performance

dana-database_triggers:
  auto_activate: true
  priority: 5
  file_patterns:
    - "supabase/migrations/*.sql"
    - "prisma/schema.prisma"
  focus: Schema validation, RLS policies, query optimization

maria-qa_triggers:
  auto_activate: true
  priority: 10
  file_patterns:
    - "**/*.test.*"
    - "**/*.spec.*"
  focus: Test coverage (75%+), quality assurance
```

**File: `.cursor/settings.json`**
```json
{
  "versatil.project": {
    "name": "my-saas-app",
    "stack": {
      "frontend": "react",
      "backend": "nodejs",
      "database": "postgresql"
    }
  },

  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "background_monitoring": true,

    "activation_triggers": {
      "james-frontend": {
        "file_patterns": ["*.tsx", "*.jsx", "components/**/*"],
        "auto_run_on_save": true,
        "proactive_actions": [
          "accessibility_check_wcag",
          "performance_optimization_suggestions"
        ]
      },
      "marcus-backend": {
        "file_patterns": ["api/**/*.ts", "services/**/*"],
        "auto_run_on_save": true,
        "proactive_actions": [
          "security_pattern_validation_owasp",
          "response_time_check_200ms"
        ]
      }
    }
  },

  "versatil.quality_gates": {
    "enforce_on_commit": true,
    "block_on_failure": true,
    "minimum_coverage": 75,
    "maximum_response_time_ms": 200
  }
}
```

**File: `.versatil-project.json`** (Framework metadata)
```json
{
  "project_id": "my-saas-app-d4f8e9a2",
  "framework_version": "7.16.2",
  "setup_date": "2025-11-03T18:00:00Z",
  "enabled_agents": [
    "james-frontend",
    "marcus-backend",
    "dana-database",
    "maria-qa",
    "sarah-pm"
  ],
  "quality_gates": {
    "coverage_threshold": 75,
    "security_scan": true,
    "performance_check": true
  }
}
```

---

## Step 3: Start Background Monitoring (2 minutes)

### 3.1 Launch Framework Daemon

```bash
# Option A: Run in background
npx @versatil/sdlc-framework start --daemon

# Option B: Run in terminal (see real-time logs)
npx @versatil/sdlc-framework start --foreground
```

**Output:**
```
🚀 VERSATIL Framework Starting...

✅ Project: my-saas-app
✅ Agents: 5 loaded (James, Marcus, Dana, Maria, Sarah)
✅ File Watcher: Active (watching 2,847 files)
✅ Quality Gates: Enforced
✅ RAG System: Connected
✅ MCP Servers: 3 healthy

🤖 Framework ready. Agents will auto-activate on file changes.

PID: 12845
Logs: ~/.versatil/logs/my-saas-app-daemon.log
```

### 3.2 Verify Monitoring

```bash
# Check framework status
npx @versatil/sdlc-framework status

# Output:
# ✅ Daemon running (PID: 12845)
# ✅ 5 agents active
# ✅ 0 activations in last 5min
# ✅ File watcher: healthy
```

---

## Step 4: Validation Test (5 minutes)

### 4.1 Test File Watching

**Test 1: Edit a React Component**

```bash
# Edit any .tsx file
code src/components/UserCard.tsx
```

Make a simple change (add a comment), save.

**Expected:** Within 2 seconds, you should see:
```
[Cursor Chat or Terminal]
🤖 James-Frontend activated
   Analyzing: src/components/UserCard.tsx

   ✅ Component structure: Good
   ✅ Accessibility: WCAG AA compliant
   ⚠️  Performance: Consider memoizing props

   Suggestion: Wrap component with React.memo()
```

**Test 2: Edit an API Endpoint**

```bash
code api/users.ts
```

Add a new endpoint, save.

**Expected:**
```
🤖 Marcus-Backend activated
   Analyzing: api/users.ts

   ⚠️  Security: Input validation missing
   ⚠️  Performance: No rate limiting

   Suggestions:
   1. Add Zod schema validation
   2. Implement rate limiting (express-rate-limit)
```

**Test 3: Run Tests**

```bash
npm test
```

**Expected:**
```
🤖 Maria-QA activated
   Analyzing test results...

   Tests: 89 total, 87 passing, 2 failing
   Coverage: 42% (target: 75%)

   ⚠️  Quality Gate: FAILED
   Reason: Coverage below 75%

   Missing tests for:
   - src/utils/validation.ts
   - api/auth.ts
   - src/components/Dashboard.tsx
```

### 4.2 Test Quality Gate

```bash
git add .
git commit -m "Test commit"
```

**Expected (if tests failing or coverage low):**
```
⚠️  VERSATIL Quality Gate: BLOCKED

Issues:
✗ Test coverage: 42% (required: 75%)
✗ 2 tests failing

Cannot commit. Fix issues first or use:
  git commit --no-verify (not recommended)
```

### 4.3 Test Agent Coordination

**In Cursor Chat, type:**
```
"Add a user profile page with avatar upload"
```

**Expected (within 30 seconds):**
```
🤖 VERSATIL Multi-Agent Workflow Activated

Coordinating agents:
→ Alex-BA: Creating user story... ✓ (3s)
→ Sarah-PM: Breaking into tasks... ✓ (2s)
→ Dana: Creating profile table... ✓ (4s)
→ Marcus: Creating API endpoints... ✓ (8s)
→ James: Creating UI components... ✓ (12s)
→ Maria: Generating tests... ✓ (5s)

✅ Feature Complete (34 seconds)

Files Created:
- src/components/ProfilePage.tsx
- api/profile.ts
- supabase/migrations/20250103_profiles.sql
- tests/ProfilePage.test.tsx

Tests: 23/23 passing ✓
Coverage: 78% ✓
Ready to review!
```

---

## Step 5: Customization (10 minutes)

### 5.1 Add Custom File Patterns

**Edit: `.cursor/settings.json`**

```json
{
  "versatil.proactive_agents": {
    "activation_triggers": {
      "james-frontend": {
        "file_patterns": [
          "*.tsx",
          "*.jsx",
          "src/components/**/*",
          "src/pages/**/*",        // ADD: Your pages dir
          "src/features/**/*"       // ADD: Your features dir
        ]
      }
    }
  }
}
```

### 5.2 Add Custom Keywords

```json
{
  "activation_triggers": {
    "marcus-backend": {
      "keywords": [
        "api",
        "endpoint",
        "auth",
        "webhook",            // ADD: Custom keyword
        "subscription"        // ADD: Custom keyword
      ]
    }
  }
}
```

### 5.3 Adjust Quality Thresholds

```json
{
  "versatil.quality_gates": {
    "minimum_coverage": 75,     // Lower if needed
    "maximum_response_time_ms": 300,  // Increase if needed
    "enforce_on_commit": true,
    "enforce_on_push": true,
    "block_on_failure": true    // Set false for warnings only
  }
}
```

### 5.4 Configure Agent Priorities

```yaml
# .cursorrules
james-frontend_triggers:
  priority: 5     # 1-10 (10 = highest)

marcus-backend_triggers:
  priority: 5

maria-qa_triggers:
  priority: 10    # QA always highest priority
```

---

## Step 6: Team Setup (Optional, 10 minutes)

### 6.1 Commit Configuration to Git

```bash
git add .cursorrules .cursor/ .versatil-project.json
git commit -m "chore: Add VERSATIL Framework configuration"
git push origin main
```

### 6.2 Team Onboarding

**Team members just need:**

```bash
# 1. Clone repo (already has config)
git clone <your-repo>
cd <your-project>

# 2. Install framework
npm install -g @versatil/sdlc-framework

# 3. Start daemon
npx @versatil/sdlc-framework start --daemon

# Done! Framework configured automatically from committed files
```

---

## Troubleshooting

### Issue: Agents Not Activating

**Check:**
```bash
# 1. Is daemon running?
npx @versatil/sdlc-framework status

# 2. Are file patterns correct?
cat .cursor/settings.json | grep file_patterns

# 3. Check logs
tail -f ~/.versatil/logs/my-saas-app-daemon.log
```

**Solution:**
```bash
# Restart daemon
npx @versatil/sdlc-framework restart
```

### Issue: Too Many Activations

**Reduce sensitivity:**

```json
{
  "versatil.proactive_agents": {
    "debounce_ms": 2000,           // Wait 2s after save
    "min_change_size": 10,         // Ignore small edits
    "background_analysis": false   // Only on explicit save
  }
}
```

### Issue: Quality Gates Too Strict

**Temporarily disable:**

```bash
git commit --no-verify -m "WIP: Testing feature"
```

**Or adjust thresholds:**

```json
{
  "versatil.quality_gates": {
    "minimum_coverage": 60,     // Lower threshold
    "block_on_failure": false   // Warn but don't block
  }
}
```

---

## Next Steps

### After Setup:

1. **Test Drive (1 hour)**
   - Edit various files
   - See automatic activations
   - Review suggestions
   - Get familiar with workflow

2. **Customize (ongoing)**
   - Add project-specific patterns
   - Adjust quality thresholds
   - Fine-tune agent triggers

3. **Monitor & Iterate (ongoing)**
   - Check activation logs
   - Review agent suggestions
   - Refine configuration

### Advanced Features:

- **RAG Integration** - Framework learns your patterns
- **MCP Tools** - Connect external tools (GitHub, Playwright, etc.)
- **Custom Agents** - Create domain-specific agents
- **CI/CD Integration** - Run quality gates in pipeline

---

## Success Criteria

**Setup Complete When:**
- ✅ Configuration files generated
- ✅ Daemon running
- ✅ File watcher active
- ✅ Agents auto-activate on edits
- ✅ Quality gates enforcing
- ✅ Team can replicate setup

**You'll Know It's Working When:**
- Editing `.tsx` → James activates automatically
- Editing `.api.ts` → Marcus activates automatically
- Running tests → Maria validates coverage
- Committing code → Quality gate enforces standards
- Describing features → Multi-agent workflow executes

---

## Support

**Issues?**
- Check logs: `~/.versatil/logs/`
- Run diagnostics: `npx @versatil/sdlc-framework doctor`
- Report issues: https://github.com/versatil-sdlc/framework/issues

**Need Help?**
- Documentation: https://docs.versatil.dev
- Discord: https://discord.gg/versatil
- Email: support@versatil.dev

---

**Congratulations! Your project is now enhanced with VERSATIL Framework's automatic agent assistance. Start coding and watch the agents help you build faster and better. 🚀**
