# Cursor IDE Integration Guide

**VERSATIL SDLC Framework v6.4.0** - Complete Cursor Workflow Integration

This guide provides everything you need to use VERSATIL with Cursor IDE, including auto-activation setup, automatic roadmap generation, workflow templates, and troubleshooting.

**NEW in v6.4.0**:
- 📍 **Automatic Roadmap Generation** - Get a personalized 4-week development plan during installation
- 🤖 **18 OPERA agents** - 8 core agents + 10 language-specific sub-agents
- 🎯 **Smart Agent Matching** - Automatically recommends agents based on your tech stack

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- Cursor IDE installed ([download](https://cursor.sh))
- VERSATIL SDLC Framework installed globally (`npm install -g @versatil/sdlc-framework`)
- Node.js >= 18.0.0

### Initial Setup

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize Cursor integration (auto-generates roadmap)
versatil cursor:init

# This creates:
# - .cursorrules (Cursor-specific agent configuration)
# - .cursor/settings.json (Auto-activation rules)
# - .versatil-project.json (Project-specific config)
# - docs/VERSATIL_ROADMAP.md (📍 Your personalized 4-week development plan)

# 📍 Review Your Personalized Roadmap
cat docs/VERSATIL_ROADMAP.md
# → Includes: 4-week plan, agent recommendations, quality gates, best practices
```

### Verify Auto-Activation

```bash
# Test agent activation
versatil test-activation

# Expected output:
# ✅ Cursor IDE detected
# ✅ .cursorrules found
# ✅ Agent triggers configured
# ✅ Proactive orchestrator ready
# ✅ Roadmap generated: docs/VERSATIL_ROADMAP.md
#
# 📊 Project Analysis:
#    - Type: fullstack
#    - Technologies: React, Node.js, TypeScript
#    - Recommended Agents: 7 (James-React, Marcus-Node, Maria-QA, etc.)
#
# 🤖 Edit a test file to verify:
#    - Create src/LoginForm.test.tsx → Maria-QA should activate
#    - Create src/Button.tsx → James-Frontend + James-React should activate
#    - Create src/api/users.ts → Marcus-Backend + Marcus-Node should activate
```

---

## 🎯 Cursor 1.7+ Features (NEW)

### Advanced Agent Lifecycle Control

VERSATIL v6.4.0+ integrates deeply with Cursor 1.7's latest features for enhanced agent orchestration:

#### 1. Cursor Hooks (Agent Lifecycle Events)

**What are Hooks?**
Hooks are extensible scripts that run at specific points in the agent lifecycle, allowing you to observe, control, and modify agent behavior.

**VERSATIL Hooks Configuration**: `~/.cursor/hooks.json`

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      {
        "command": "~/.versatil/hooks/afterFileEdit.sh",
        "description": "VERSATIL: Format code, validate isolation, update RAG"
      }
    ],
    "beforeShellExecution": [
      {
        "command": "~/.versatil/hooks/beforeShellExecution.sh",
        "description": "VERSATIL: Security checks, block destructive commands"
      }
    ],
    "beforeReadFile": [
      {
        "command": "~/.versatil/hooks/beforeReadFile.sh",
        "description": "VERSATIL: Context tracking for RAG memory"
      }
    ],
    "beforeSubmitPrompt": [
      {
        "command": "~/.versatil/hooks/beforeSubmitPrompt.sh",
        "description": "VERSATIL: Agent activation suggestions"
      }
    ],
    "stop": [
      {
        "command": "~/.versatil/hooks/stop.sh",
        "description": "VERSATIL: Session cleanup, learning codification"
      }
    ]
  }
}
```

**Hook Capabilities**:

| Hook | What It Does | VERSATIL Use Case |
|------|-------------|-------------------|
| `afterFileEdit` | Runs after agent edits file | Auto-format with prettier/black, validate framework isolation, update RAG memory |
| `beforeShellExecution` | Runs before executing commands | Block destructive commands (`rm -rf`, `DROP DATABASE`), audit logging, security checks |
| `beforeReadFile` | Runs before reading files | Track context for RAG, warn on sensitive files (.env, credentials) |
| `beforeSubmitPrompt` | Runs before sending prompt | Suggest relevant OPERA agents, enrich context with project info |
| `stop` | Runs when agent session ends | Save metrics, codify learned patterns to RAG, cleanup temp files |

**Example: Security Guardrails**

```bash
# beforeShellExecution hook blocks dangerous commands
User Agent Action: Run `rm -rf node_modules/`
→ Hook Intercepts: "🚨 BLOCKED: Destructive command detected"
→ User Prompt: "This command requires explicit approval. Continue? [y/N]"
```

**Example: Automatic Formatting**

```bash
# afterFileEdit hook auto-formats code
Agent Edits: src/api/users.ts
→ Hook Runs: prettier --write src/api/users.ts
→ RAG Update: Store API pattern for future reference (async)
→ Result: ✅ File formatted and pattern learned
```

**View Hook Logs**:
```bash
# Real-time hook execution log
tail -f ~/.versatil/logs/hooks.log

# Session metrics
cat ~/.versatil/logs/session-metrics.log

# Agent performance data
cat ~/.versatil/metrics/agent-Maria-QA.json
```

#### 2. Plan Mode Integration

**What is Plan Mode?**
Plan Mode (Cursor 1.7+) allows agents to create detailed execution plans before starting complex tasks, providing transparency and control.

**When VERSATIL Uses Plan Mode**:
- Multi-agent coordination required (3+ agents)
- Long-horizon tasks (estimated > 30 minutes)
- Complex refactoring across multiple files
- Full-stack feature implementation
- Database migrations with API changes

**Plan Mode Workflow**:

```yaml
User Request: "Add user authentication system"

Phase 1: Planning (Sarah-PM coordinates)
  → Analyze complexity: High (multi-agent, multi-tier)
  → Activate Plan Mode: ✅
  → Break down into phases:
    1. Requirements (Alex-BA) - 30 min
    2. Parallel Development:
       - Database schema (Dana-Database) - 45 min
       - API implementation (Marcus-Backend) - 60 min
       - UI components (James-Frontend) - 50 min
    3. Integration - 40 min
    4. Quality validation (Maria-QA) - 20 min
  → Total Estimate: 2.5 hours
  → Present plan to user

Phase 2: User Approval
  User sees plan in readable format
  Options: [Approve] [Modify] [Cancel]

Phase 3: Execution with TodoWrite Tracking
  Each phase becomes a todo item:
  - "Phase 1: Requirements Analysis (Alex-BA)" - in_progress
  - "Phase 2: Database Layer (Dana-Database)" - pending
  - "Phase 3: API Layer (Marcus-Backend)" - pending
  - "Phase 4: Frontend Layer (James-Frontend)" - pending
  - "Phase 5: Integration" - pending
  - "Phase 6: Quality Validation (Maria-QA)" - pending

  Real-time updates in statusline:
  🤖 Phase 2/6 in progress │ ████░░░░ 40% │ ETA: 1.5 hours
```

**Manual Plan Mode Activation**:

```bash
# Activate plan mode for complex tasks
/plan "Implement OAuth authentication with Google/GitHub"

# Output: Detailed breakdown with time estimates
📋 PLAN: OAuth Authentication

Phase 1: Requirements (Alex-BA) - 30 min
  ✓ Define OAuth flow requirements
  ✓ Document security considerations
  ✓ Create user stories

Phase 2: Database (Dana-Database) - 45 min [PARALLEL]
  ✓ Design oauth_providers table
  ✓ Add RLS policies
  ✓ Create migration scripts

Phase 3: API (Marcus-Backend) - 60 min [PARALLEL]
  ✓ Implement OAuth endpoints
  ✓ Add Google/GitHub integration
  ✓ Token validation & refresh

Phase 4: UI (James-Frontend) - 50 min [PARALLEL]
  ✓ OAuth login buttons
  ✓ Callback handling
  ✓ Error states & loading

Phase 5: Integration - 40 min
  ✓ End-to-end OAuth flow testing
  ✓ Security validation

Phase 6: QA (Maria-QA) - 20 min
  ✓ Test coverage (80%+)
  ✓ Security audit
  ✓ Cross-browser testing

TOTAL: 2.5 hours (parallel optimization saves 95 minutes)
Approve plan? [Y/n]
```

**Configure Plan Mode**:

```json
// .cursor/settings.json
{
  "versatil": {
    "plan_mode": {
      "enabled": true,
      "auto_activate_threshold": "complex",  // "simple" | "complex" | "always"
      "show_estimates": true,
      "require_approval": true,
      "parallel_optimization": true
    }
  }
}
```

#### 3. Cursor Commands (Native Command System)

**What are Cursor Commands?**
Cursor Commands (v1.2+) are reusable prompts stored in `.cursor/commands/[name].md` that integrate natively with the IDE.

**VERSATIL Command Migration**:
All OPERA agent commands are now available in Cursor-native format:

```bash
# Location: .cursor/commands/
/maria-qa "Review test coverage"
/james-frontend "Create accessible form component"
/marcus-backend "Implement OAuth endpoints"
/dana-database "Design users table schema"
/plan "Add authentication system"
/monitor "Check framework health"
```

**Advantages over Slash Commands**:
- ✅ Autocomplete in Agent input (press `/` to see all commands)
- ✅ Team sharing via git (`.cursor/commands/` checked into repo)
- ✅ Per-command model selection
- ✅ Better IDE integration

**Create Custom Command**:

```bash
# Create .cursor/commands/run-linter.md
---
description: "Run linter and fix all issues"
argument-hint: ""
model: "claude-sonnet-4-5"
allowed-tools: ["Bash", "Read", "Edit"]
---

# Run Linter and Auto-Fix

Please run the project linter and fix all issues:

1. Run `npm run lint` to check for issues
2. Run `npm run lint:fix` to auto-fix
3. Report any remaining issues that need manual fixes
```

Then use via: `/run-linter` in Cursor Agent input

#### 4. Agent Autocomplete

**What is Agent Autocomplete?**
Context-aware suggestions based on recent changes and file patterns (Cursor 1.7+).

**VERSATIL Integration**:
Agent autocomplete enhances proactive agent suggestions:

```bash
# Scenario: You just edited LoginForm.tsx
→ Autocomplete suggests:
  - "Add tests for LoginForm" (Maria-QA)
  - "Make LoginForm accessible" (James-Frontend)
  - "Connect LoginForm to /api/auth/login" (Marcus-Backend)

# Scenario: You just added a new API endpoint
→ Autocomplete suggests:
  - "Generate stress tests for new endpoint" (Rule 2)
  - "Add OpenAPI documentation" (Marcus-Backend)
  - "Create frontend integration" (James-Frontend)
```

**Enable in Settings**:

```json
// .cursor/settings.json
{
  "versatil": {
    "agent_autocomplete": {
      "enabled": true,
      "context_window": 10,  // Consider last 10 file edits
      "suggest_related_tasks": true,
      "show_in_statusline": true
    }
  }
}
```

#### 5. MCP Elicitation Support

**What is MCP Elicitation?**
Cursor 1.7 added support for MCP servers to request structured input from users (part of MCP spec).

**VERSATIL MCP Servers with Elicitation**:

```yaml
Chrome_MCP:
  Elicitation_Example:
    Agent Action: "Run visual regression test"
    → MCP Requests:
      - Which browsers? [Chrome, Firefox, Safari]
      - Which viewports? [Mobile, Tablet, Desktop, All]
      - Baseline branch? [main, staging, develop]
    → User Selects: Chrome, All viewports, main branch
    → Test Runs: With user-specified configuration

GitHub_MCP:
  Elicitation_Example:
    Agent Action: "Create pull request"
    → MCP Requests:
      - Target branch? [main, develop, staging]
      - Reviewers? [@alice, @bob, @carol]
      - Labels? [feature, bugfix, enhancement]
    → User Selects: develop, @alice, feature
    → PR Created: With user-specified settings
```

**Benefits**:
- ✅ More control over agent actions
- ✅ Structured input (not freeform text)
- ✅ Faster than typing full prompts
- ✅ Reduces ambiguity in agent tasks

---

## 📍 Automatic Roadmap Generation (NEW in v6.4.0)

When you run `versatil cursor:init`, the framework automatically analyzes your project and generates a personalized development roadmap.

### What Gets Auto-Generated

**1. Project Analysis**
```bash
📊 Analyzing project at: /Users/you/my-react-app

Detected:
  - Type: frontend
  - Technologies: React, TypeScript, Next.js
  - Framework: Next.js
  - Complexity: moderate
  - Tests: Present (Jest, Playwright)
  - CI/CD: Configured (GitHub Actions)
```

**2. Agent Recommendations** (from 17 available agents)
```
🤖 Recommended OPERA Agents:

Critical Agents (Primary Development):
  ⭐ James-Frontend - UI/UX development, accessibility
  ⭐ James-React - React hooks, performance, component patterns
  ⭐ James-NextJS - Next.js SSR/SSG, App Router, Edge functions
  ⭐ Maria-QA - Testing automation, coverage analysis
  ⭐ Marcus-Backend - API routes, serverless functions
  ⭐ Marcus-Node - Node.js optimization, middleware

Recommended Agents (Enhanced Workflow):
  📌 Sarah-PM - Project coordination, documentation
  📌 Alex-BA - Requirements, user stories
```

**3. Personalized 4-Week Roadmap** (`docs/VERSATIL_ROADMAP.md`)

```markdown
# 🗺️ my-react-app - VERSATIL Development Roadmap

## Week 1: Foundation & Architecture
**Primary Agents**: Alex-BA, Sarah-PM, James-NextJS

Tasks:
- [ ] Review and refine requirements with Alex-BA
- [ ] Set up Next.js 14 with App Router
- [ ] Configure TypeScript strict mode
- [ ] Set up linting and formatting (ESLint, Prettier)
- [ ] Initialize database (Prisma + PostgreSQL)
- [ ] Configure CI/CD pipeline

Quality Gates:
- ✅ All developers can run project locally
- ✅ Linting rules enforced
- ✅ CI pipeline passes

## Week 2: Core Feature Development
**Primary Agents**: James-React, Marcus-Node, Maria-QA

Tasks:
- [ ] Implement core UI components with accessibility
- [ ] Set up API routes with validation
- [ ] Implement authentication (NextAuth.js)
- [ ] Add database migrations
- [ ] Write unit tests (80%+ coverage)

Quality Gates:
- ✅ Unit tests passing
- ✅ Code review by Maria-QA passed
- ✅ No critical security vulnerabilities
- ✅ Accessibility (WCAG 2.1 AA)

## Week 3: Integration & Quality Assurance
**Primary Agents**: Maria-QA, James-NextJS, Marcus-Node

Tasks:
- [ ] E2E testing with Playwright
- [ ] Performance optimization (Lighthouse >= 90)
- [ ] Security audit (OWASP compliance)
- [ ] Visual regression testing
- [ ] Load testing (< 200ms API response)

Quality Gates:
- ✅ All E2E tests passing
- ✅ Lighthouse score >= 90
- ✅ Security scan passed

## Week 4: Polish & Production Readiness
**Primary Agents**: Sarah-PM, Maria-QA, James-NextJS

Tasks:
- [ ] User acceptance testing (UAT)
- [ ] Complete API documentation
- [ ] Set up monitoring (Sentry, Vercel Analytics)
- [ ] Configure CDN and caching
- [ ] Production deployment to Vercel
- [ ] Post-deployment verification

Quality Gates:
- ✅ All production checklist completed
- ✅ Documentation complete
- ✅ Monitoring operational
```

### Roadmap Templates by Project Type

The framework includes pre-built templates for common stacks:

| Your Stack | Template | Recommended Agents |
|------------|----------|-------------------|
| **React + Node.js** | [react-node-fullstack.md](../../templates/roadmaps/react-node-fullstack.md) | James-React, Marcus-Node, Maria-QA |
| **Vue + Python** | [vue-python-backend.md](../../templates/roadmaps/vue-python-backend.md) | James-Vue, Marcus-Python, Maria-QA |
| **Next.js Monorepo** | [nextjs-monorepo.md](../../templates/roadmaps/nextjs-monorepo.md) | James-NextJS, Marcus-Node, Maria-QA |
| **Python ML/AI** | [python-ml.md](../../templates/roadmaps/python-ml.md) | Dr.AI-ML, Marcus-Python, Maria-QA |
| **Rails Backend** | Auto-generated | Marcus-Rails, Maria-QA, Sarah-PM |
| **Go Microservices** | Auto-generated | Marcus-Go, Oliver-DevOps, Maria-QA |

### How Agent Matching Works

The roadmap generator analyzes your project and automatically recommends the right agents:

```typescript
// Detected: package.json with "react": "^18.0.0"
→ Recommends: James-Frontend + James-React

// Detected: package.json with "next": "^14.0.0"
→ Recommends: James-Frontend + James-React + James-NextJS

// Detected: package.json with "express": "^4.0.0"
→ Recommends: Marcus-Backend + Marcus-Node

// Detected: requirements.txt with "django"
→ Recommends: Marcus-Backend + Marcus-Python

// Detected: go.mod
→ Recommends: Marcus-Backend + Marcus-Go

// Detected: Gemfile with "rails"
→ Recommends: Marcus-Backend + Marcus-Rails

// Detected: requirements.txt with "tensorflow"
→ Recommends: Dr.AI-ML + Marcus-Python
```

### Benefits of Auto-Generated Roadmaps

✅ **Zero Planning Overhead**: No need to manually create development plans
✅ **Tech Stack Alignment**: Roadmap tailored to your specific technologies
✅ **Agent Discovery**: Automatically find the right agents for your project
✅ **Best Practices**: Industry-standard practices embedded in each template
✅ **Quality Gates**: Pre-defined success criteria for each phase
✅ **Time Savings**: 83% faster setup (30 min → 5 min)

---

## 🤖 How Auto-Activation Works

### File Pattern Matching

VERSATIL agents activate automatically based on file patterns and code context:

```yaml
Scenario 1: Test File Editing
File: src/LoginForm.test.tsx
Trigger: *.test.*, describe(, it(, expect(
Auto-Activates: Maria-QA
Actions:
  - Test coverage analysis
  - Missing test detection
  - Assertion validation
  - Inline suggestions appear as you type

Scenario 2: React Component
File: src/components/Button.tsx
Trigger: *.tsx, useState, useEffect, component
Auto-Activates: James-Frontend
Actions:
  - Accessibility check (WCAG 2.1 AA)
  - Component structure validation
  - Responsive design verification
  - Performance optimization suggestions

Scenario 3: API Endpoint
File: src/api/users.ts
Trigger: *.api.*, router., async function
Auto-Activates: Marcus-Backend
Actions:
  - Security pattern validation (OWASP)
  - Response time check (< 200ms target)
  - Stress test generation
  - Database query optimization

Scenario 4: Multi-Agent Collaboration
User Request: "Add user authentication feature"
Auto-Activates: Alex-BA → Marcus-Backend → James-Frontend → Maria-QA
Workflow:
  1. Alex-BA: Extracts requirements, creates user stories
  2. Marcus: Implements /api/auth/login, JWT, OWASP security
  3. James: Creates LoginForm.tsx, accessibility validation
  4. Maria: Generates test suite, runs coverage analysis
```

### Real-Time Feedback (Statusline)

As you code, Cursor's statusline shows agent activity:

```
🤖 Maria-QA analyzing... │ ████████░░ 80% coverage │ ⚠️  2 missing tests
🤖 James validating UI... │ ✅ Accessible │ ⚠️  Missing aria-label
🤖 Marcus security scan... │ ✅ OWASP compliant │ ⏱️  180ms response
```

---

## 📝 .cursorrules Template

The `.cursorrules` file configures Cursor-specific behavior for VERSATIL agents.

### Basic Template

```yaml
# VERSATIL SDLC Framework - Cursor Configuration
# Generated by: versatil cursor:init

# Project Context
project_name: "My Project"
project_type: "fullstack"  # Options: fullstack, frontend, backend, mobile, ai-ml
tech_stack:
  frontend: ["React", "TypeScript", "Tailwind CSS"]
  backend: ["Node.js", "Express", "PostgreSQL"]
  testing: ["Jest", "React Testing Library", "Playwright"]

# Agent Preferences
agents:
  maria-qa:
    enabled: true
    auto_run_on_save: true
    coverage_threshold: 80
    test_frameworks: ["jest", "playwright"]

  james-frontend:
    enabled: true
    accessibility_standard: "WCAG 2.1 AA"
    responsive_breakpoints: [320, 768, 1024, 1920]
    css_framework: "tailwind"

  marcus-backend:
    enabled: true
    security_standard: "OWASP Top 10 2023"
    performance_target_ms: 200
    auto_stress_test: true

  sarah-pm:
    enabled: true
    sprint_duration_days: 14
    daily_standup_time: "09:00"

  alex-ba:
    enabled: true
    requirement_format: "user_stories"
    acceptance_criteria_format: "gherkin"

  dr-ai-ml:
    enabled: false  # Only for AI/ML projects

# Quality Gates
quality_gates:
  pre_commit:
    enabled: true
    require_tests: true
    min_coverage: 80
    lint_check: true

  pre_deploy:
    enabled: true
    require_e2e_tests: true
    security_scan: true
    performance_check: true

# Proactive Features
proactive:
  inline_suggestions: true
  statusline_updates: true
  background_monitoring: true
  auto_documentation: true

# Custom Rules (Optional)
custom_rules:
  - "Always use TypeScript strict mode"
  - "Follow conventional commits format"
  - "Prefer functional components over class components"
  - "All API endpoints must have OpenAPI documentation"
```

### Advanced Template (Enterprise)

```yaml
# Enterprise Configuration with Team Workflows

# Team Configuration
team:
  size: 8
  roles:
    - frontend_developers: 3
    - backend_developers: 2
    - qa_engineers: 2
    - product_manager: 1

  workflow: "gitflow"  # Options: gitflow, trunk-based, feature-branch

  code_review:
    required_reviewers: 2
    auto_assign_maria: true
    block_on_quality_gate_failure: true

# Advanced Agent Configuration
agents:
  maria-qa:
    proactive_actions:
      test_coverage_analysis:
        enabled: true
        threshold: 85
        report_format: "html"

      missing_test_detection:
        enabled: true
        scan_on_file_save: true
        suggest_test_cases: true

      assertion_validation:
        enabled: true
        check_edge_cases: true
        validate_error_scenarios: true

      visual_regression:
        enabled: true
        browser: "chrome"
        viewports: [375, 768, 1920]

  james-frontend:
    proactive_actions:
      accessibility_check_wcag:
        enabled: true
        level: "AA"
        auto_fix_simple_issues: true

      component_structure_validation:
        enabled: true
        enforce_patterns: ["composition", "container-presentational"]

      responsive_design_verification:
        enabled: true
        breakpoints: [320, 768, 1024, 1920]
        test_orientation: true

      performance_optimization_suggestions:
        enabled: true
        target_lighthouse_score: 90
        check_bundle_size: true
        suggest_code_splitting: true

# MCP Integration
mcp:
  enabled: true
  server: "claude-desktop"
  auto_sync: true
  memory_persistence: true

# RAG Memory System
rag:
  enabled: true
  vector_storage: "supabase"
  learning_mode: "continuous"
  pattern_recognition: true

  project_patterns:
    - "Component naming conventions"
    - "API response structures"
    - "Test assertion patterns"
    - "Error handling approaches"

# Monitoring & Analytics
monitoring:
  track_agent_performance: true
  collect_usage_analytics: false  # Privacy-first
  error_reporting: true

  dashboards:
    realtime_sdlc_tracker: true
    quality_metrics: true
    velocity_tracking: true
```

---

## 🔧 Cursor Settings Integration

### .cursor/settings.json

This file is auto-generated by `versatil cursor:init` but can be customized:

```json
{
  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "background_monitoring": true,
    "inline_suggestions": true,
    "statusline_updates": true,
    "slash_commands_fallback": true,

    "activation_triggers": {
      "maria-qa": {
        "file_patterns": [
          "*.test.*",
          "**/__tests__/**",
          "**/test/**",
          "*.spec.*"
        ],
        "code_patterns": [
          "describe(",
          "it(",
          "test(",
          "expect(",
          "jest.",
          "vitest."
        ],
        "keywords": ["test", "spec", "coverage", "quality"],
        "auto_run_on_save": true,
        "background_analysis": true,
        "proactive_actions": [
          "test_coverage_analysis",
          "missing_test_detection",
          "assertion_validation",
          "quality_gate_enforcement"
        ]
      },

      "james-frontend": {
        "file_patterns": [
          "*.tsx",
          "*.jsx",
          "*.vue",
          "*.svelte",
          "*.css",
          "*.scss"
        ],
        "code_patterns": [
          "useState",
          "useEffect",
          "component",
          "props",
          "className"
        ],
        "keywords": ["component", "react", "vue", "ui", "frontend"],
        "auto_run_on_save": true,
        "background_analysis": true,
        "proactive_actions": [
          "accessibility_check_wcag",
          "component_structure_validation",
          "responsive_design_verification",
          "performance_optimization_suggestions"
        ]
      },

      "marcus-backend": {
        "file_patterns": [
          "*.api.*",
          "**/routes/**",
          "**/controllers/**",
          "**/server/**"
        ],
        "code_patterns": [
          "router.",
          "app.",
          "express.",
          "fastify.",
          "async function"
        ],
        "keywords": ["api", "server", "database", "auth", "security"],
        "auto_run_on_save": true,
        "background_analysis": true,
        "proactive_actions": [
          "security_pattern_validation_owasp",
          "response_time_check_200ms",
          "stress_test_generation",
          "database_query_optimization"
        ]
      }
    }
  }
}
```

---

## 🚨 Troubleshooting Auto-Activation

### Problem 1: Agents Not Activating

**Symptoms**: Edit a test file, but Maria-QA doesn't activate

**Diagnosis**:
```bash
# Run activation test
versatil test-activation

# Check if monitoring is running
versatil agents --status

# Enable debug mode
VERSATIL_DEBUG=true versatil agents --watch
```

**Common Causes & Fixes**:

1. **Missing .cursorrules file**
   ```bash
   # Regenerate
   versatil cursor:init --force
   ```

2. **Proactive agents disabled**
   ```bash
   # Check status
   versatil config show | grep proactive

   # Enable
   versatil config set proactive_agents.enabled=true
   ```

3. **File patterns not matching**
   ```bash
   # Test specific file
   versatil test-activation --file src/LoginForm.test.tsx

   # Should output matching agents and why they matched
   ```

4. **Cursor IDE extension issue**
   - Restart Cursor IDE
   - Check Cursor settings: Settings → Extensions → VERSATIL
   - Ensure extension is enabled

### Problem 2: Statusline Not Updating

**Symptoms**: Agents activate but no statusline feedback

**Fix**:
```json
// .cursor/settings.json
{
  "versatil.proactive_agents": {
    "statusline_updates": true,  // ← Ensure this is true
    "inline_suggestions": true
  }
}
```

**Restart Cursor IDE after changing settings**

### Problem 3: Too Many Agent Activations

**Symptoms**: Multiple agents activating for simple edits

**Fix - Adjust sensitivity**:
```yaml
# .cursorrules
agents:
  maria-qa:
    auto_run_on_save: false  # Only activate on demand
    background_analysis: true  # Still run in background
```

### Problem 4: Slow Performance

**Symptoms**: Cursor lags when editing files

**Fix - Reduce background monitoring**:
```json
// .cursor/settings.json
{
  "versatil.proactive_agents": {
    "background_monitoring": false,  // Disable for large projects
    "auto_activation": true  // Keep on-save activation
  }
}
```

---

## 🎬 Workflow Examples

### Workflow 1: Feature Development (Full OPERA Cycle)

```bash
# Step 1: User types feature request in Cursor
# "Add user authentication with email/password"

# Auto-Activation Sequence:
# 🤖 Alex-BA activates (detects feature request)
#    - Analyzes: "user authentication" keyword
#    - Creates user stories:
#      * "As a user, I want to login with email/password"
#      * "As a user, I want secure session management"
#    - Defines acceptance criteria (Gherkin format)

# 🤖 Marcus-Backend activates (handoff from Alex)
#    - Implements: src/api/auth/login.ts
#    - Adds: JWT token generation, bcrypt password hashing
#    - Security: OWASP validation (SQL injection, XSS prevention)
#    - Auto-generates: Stress tests (1000 concurrent logins)

# 🤖 James-Frontend activates (parallel with Marcus)
#    - Creates: src/components/LoginForm.tsx
#    - Accessibility: aria-labels, keyboard navigation, focus management
#    - Responsive: Mobile-first design, tested at 4 breakpoints
#    - Integrates: API calls to Marcus's /api/auth/login

# 🤖 Maria-QA activates (watches both)
#    - Validates: Test coverage 85% (both frontend + backend)
#    - Runs: Visual regression tests (3 browsers x 4 viewports)
#    - Checks: Security compliance (OWASP Top 10)
#    - Quality Gate: BLOCKS merge if coverage < 80%

# 🤖 Sarah-PM activates (coordinates)
#    - Updates: Sprint board (moves card to "In Review")
#    - Tracks: Progress in statusline
#    - Generates: Completion report with metrics

# Statusline shows:
# 🤖 5 agents collaborating │ ████████░░ 85% complete │ ETA: 2 min
```

### Workflow 2: Bug Fix (Targeted Agent Use)

```bash
# User opens: src/components/UserProfile.tsx
# User comments: "// BUG: Avatar image not loading"

# Auto-Activation:
# 🤖 James-Frontend activates (*.tsx file)
#    - Detects: "BUG" keyword
#    - Analyzes: Image loading code
#    - Suggests: Add error boundary, lazy loading, placeholder

# User fixes code, saves file

# 🤖 Maria-QA activates (on save)
#    - Checks: Test coverage for error scenarios
#    - Suggests: Add test for broken image URL
#    - Runs: Visual regression (avatar states)

# Statusline shows:
# ✅ Bug fix validated │ 90% coverage │ 0 visual regressions
```

### Workflow 3: Code Review (Quality Enforcement)

```bash
# User creates pull request in GitHub

# Auto-Activation (via GitHub Actions + VERSATIL):
# 🤖 Maria-QA (PR validation mode)
#    - Runs: Full test suite
#    - Checks: Coverage delta (new code must have 80%+ coverage)
#    - Validates: No regressions in existing tests
#    - Reports: Inline PR comments with test suggestions

# 🤖 Marcus-Backend (if API changes detected)
#    - Security: OWASP scan on changed endpoints
#    - Performance: Stress test (ensures < 200ms response)
#    - Breaking Changes: API contract validation

# 🤖 James-Frontend (if UI changes detected)
#    - Accessibility: WCAG 2.1 AA audit
#    - Visual Regression: Screenshot comparison
#    - Bundle Size: Checks for size increase

# Quality Gate Decision:
# ✅ PASS: PR can be merged (all gates green)
# ❌ FAIL: PR blocked (coverage 75%, needs 80%)
#
# Maria comments on PR:
# "⚠️  Quality gate failed:
#  - Test coverage: 75% (required: 80%)
#  - Missing tests for: UserProfile error handling
#  - Suggested test cases:
#    * should show placeholder when avatar fails to load
#    * should retry avatar load on error"
```

---

## 🎯 Best Practices

### 1. File Organization for Optimal Auto-Activation

```
src/
├── components/           # James-Frontend auto-activates
│   ├── Button.tsx
│   ├── LoginForm.tsx
│   └── __tests__/        # Maria-QA auto-activates
│       ├── Button.test.tsx
│       └── LoginForm.test.tsx
│
├── api/                  # Marcus-Backend auto-activates
│   ├── auth/
│   │   └── login.ts
│   └── users/
│       └── profile.ts
│
├── features/             # Alex-BA watches for *.feature files
│   └── authentication.feature
│
└── ml-models/            # Dr.AI-ML auto-activates
    └── recommendation.py
```

### 2. Naming Conventions

```typescript
// ✅ GOOD - Triggers correct agent activation
// File: src/components/LoginForm.test.tsx
describe('LoginForm', () => {  // Maria-QA detects 'describe('
  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
});

// File: src/api/auth/login.ts
router.post('/api/auth/login', async (req, res) => {  // Marcus detects 'router.'
  // Implementation
});

// ❌ BAD - May not trigger auto-activation
// File: src/components/forms.tsx (generic name)
function SomeComponent() {  // No clear pattern
  // Less likely to match activation triggers
}
```

### 3. Agent Collaboration Patterns

```yaml
# Pattern 1: Sequential Handoff
Alex-BA (requirements) → Marcus-Backend (implementation) → Maria-QA (testing)

# Pattern 2: Parallel Execution
Marcus-Backend (API) || James-Frontend (UI) → Maria-QA (integration tests)

# Pattern 3: Continuous Monitoring
Sarah-PM (watches all) + Maria-QA (enforces quality gates)

# Pattern 4: Emergency Response
User: "URGENT: Production API timeout"
→ Marcus-Backend (immediate analysis)
→ Maria-QA (stress test generation)
→ Sarah-PM (stakeholder communication)
```

### 4. Quality Gate Integration

```yaml
# Pre-Commit Gate (Local)
Trigger: git commit
Agents: Maria-QA + Marcus-Backend
Checks:
  - Lint check (ESLint, Prettier)
  - Unit tests (must pass)
  - Coverage threshold (80%+)
  - Security scan (basic SAST)
Block: true (prevent commit if fails)

# Pre-Push Gate (CI)
Trigger: git push
Agents: All relevant agents
Checks:
  - Full test suite
  - Integration tests
  - Visual regression
  - Performance benchmarks
Block: true (prevent push if fails)

# Pre-Deploy Gate (CD)
Trigger: Deployment to staging/production
Agents: Full OPERA team
Checks:
  - E2E tests (Playwright + Chrome MCP)
  - Security audit (OWASP ZAP, Snyk)
  - Performance validation (Lighthouse)
  - Accessibility audit (axe, pa11y)
  - API contract validation
Block: true (prevent deployment if fails)
```

---

## 🔗 Integration with Other Tools

### GitHub Actions Integration

```yaml
# .github/workflows/versatil-quality-gate.yml
name: VERSATIL Quality Gate

on: [pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install VERSATIL
        run: npm install -g @versatil/sdlc-framework

      - name: Run Quality Gate
        run: |
          versatil quality-gate pre-deploy

      - name: Maria-QA Review
        run: versatil agents maria --review-pr ${{ github.event.pull_request.number }}

      - name: Comment Results
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./versatil-report.json');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report.markdown
            });
```

### VS Code / Cursor Extensions

```json
// .vscode/settings.json (also works in Cursor)
{
  "versatil.autoActivation": true,
  "versatil.statusBar": true,
  "versatil.inlineSuggestions": true,

  "editor.codeActionsOnSave": {
    "source.fixAll.versatil": true
  },

  "versatil.agents": {
    "maria-qa": {
      "showCoverageGutters": true,
      "highlightUncoveredCode": true
    },
    "james-frontend": {
      "showAccessibilityHints": true
    }
  }
}
```

---

## 📊 Monitoring Agent Performance

### Real-Time Agent Dashboard

```bash
# Start live agent monitoring
versatil agents --watch

# Output:
# 🤖 VERSATIL Agent Dashboard
# ┌─────────────────┬──────────┬───────────┬──────────────┐
# │ Agent           │ Status   │ Active    │ Last Action  │
# ├─────────────────┼──────────┼───────────┼──────────────┤
# │ Maria-QA        │ Running  │ Yes       │ 2s ago       │
# │ James-Frontend  │ Idle     │ No        │ 5m ago       │
# │ Marcus-Backend  │ Running  │ Yes       │ 10s ago      │
# │ Sarah-PM        │ Idle     │ No        │ 1h ago       │
# │ Alex-BA         │ Idle     │ No        │ 3h ago       │
# │ Dr.AI-ML        │ Disabled │ No        │ Never        │
# └─────────────────┴──────────┴───────────┴──────────────┘
#
# Current Tasks:
# 🤖 Maria-QA: Analyzing test coverage for LoginForm.test.tsx
# 🤖 Marcus-Backend: Running stress test on /api/auth/login (1000 req)
#
# Press Ctrl+C to exit
```

### Agent Performance Metrics

```bash
# View agent statistics
versatil agents --stats

# Output:
# 📊 Agent Performance (Last 7 Days)
#
# Maria-QA:
#   - Activations: 247
#   - Avg Response Time: 1.8s
#   - Tests Generated: 89
#   - Bugs Detected: 12
#   - Coverage Improvement: +15%
#
# James-Frontend:
#   - Activations: 183
#   - Accessibility Fixes: 34
#   - Performance Improvements: 21
#   - Components Optimized: 67
#
# Marcus-Backend:
#   - Activations: 156
#   - Security Issues Found: 8
#   - APIs Optimized: 23
#   - Stress Tests Generated: 45
```

---

## 🚀 Next Steps

1. **Run Initial Setup** (auto-generates roadmap)
   ```bash
   versatil cursor:init
   ```

2. **Review Your Personalized Roadmap** 📍
   ```bash
   cat docs/VERSATIL_ROADMAP.md
   ```

3. **Test Auto-Activation**
   ```bash
   versatil test-activation
   ```

4. **Start Coding** - Agents will activate automatically based on roadmap recommendations!

5. **Monitor Performance**
   ```bash
   versatil agents --watch
   ```

6. **Read Advanced Docs**
   - [Installation Guide](../getting-started/installation.md) - Updated for v6.4.0
   - [Roadmap Templates](../../templates/roadmaps/) - Example roadmaps by project type
   - [Agent Reference](../../.claude/AGENTS.md) - All 18 agents documented
   - [5-Rule System](../../.claude/rules/README.md) - Automation rules
   - [Quality Gates Guide](QUALITY_GATES.md) - Quality enforcement

---

## 💡 Tips from First Production User (VERSSAI Team)

> "After working with VERSATIL on our 85-90% complete enterprise platform, here are our recommendations:"

1. **Start Small** - Enable Maria-QA first, then add other agents gradually
2. **Customize .cursorrules** - Tailor agent behavior to your project's needs
3. **Use Quality Gates** - Pre-commit gates caught 23 bugs before they reached PR
4. **Monitor Agent Activity** - `versatil agents --watch` helps understand what's happening
5. **Trust the Auto-Activation** - Agents are smart about when to activate
6. **Review Agent Suggestions** - Not all suggestions need to be followed immediately
7. **Leverage RAG Memory** - The more you use VERSATIL, the smarter it gets

---

**Framework Version**: 6.4.0
**Last Updated**: 2025-10-12
**Maintained By**: VERSATIL Development Team
**Community**: [GitHub Discussions](https://github.com/versatil-sdlc-framework/discussions)

**What's New in v6.4.0**:
- 📍 Automatic roadmap generation during installation
- 🤖 18 OPERA agents (8 core + 10 language-specific sub-agents)
- 🎯 Smart agent matching based on detected technologies
- ⚡ 83% faster setup (30 min → 5 min)

---

## 📖 Related Documentation

- [Getting Started Guide](GET_STARTED.md)
- [Agent Reference](.claude/AGENTS.md)
- [5-Rule System](.claude/rules/README.md)
- [MCP Integration](mcp-integration.md)
- [Quality Gates](QUALITY_GATES.md)
- [Migration Guide](MIGRATION_EXISTING_PROJECT.md)
