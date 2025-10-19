---
name: help
description: Get help with VERSATIL framework features, agents, rules, and troubleshooting
tags: [help, documentation, guide, reference, support]
---

# VERSATIL Help Command

**VERSATIL SDLC Framework v6.4.0** - AI-Native Development with OPERA Agents & Compounding Engineering

## Quick Start (5 Minutes)

```bash
# 1. Check Framework Health
npm run monitor              # Health check (<5 seconds)

# 2. Agents Work Automatically
# → Edit test file → Maria-QA auto-activates
# → Edit API file → Marcus-Backend auto-activates
# → Edit UI file → James-Frontend auto-activates

# 3. Fix Issues (if any)
npm run doctor               # Auto-fix framework issues

# 4. Run Tests
npm run test:coverage        # Run tests with coverage

# 5. Interactive Dashboard
npm run dashboard            # Real-time monitoring (TUI)
```

**You're ready!** Agents activate as you work. No commands needed.

---

## Help Topics

### Core Concepts
- `/help quick-start` - 5-minute getting started guide
- `/help agents` - All 18 OPERA agents (8 core + 10 sub-agents)
- `/help rules` - 5-Rule automation system
- `/help mcp` - 12 MCP integrations
- `/help workflows` - EVERY workflow (5 phases)
- `/help commands` - All slash commands
- `/help troubleshooting` - Common issues & fixes

### Specific Agents
- `/help maria-qa` - Quality Guardian (testing, coverage)
- `/help marcus-backend` - API Architect (security, performance)
- `/help james-frontend` - UI/UX Expert (accessibility, responsive)
- `/help dana-database` - Database Architect (schema, migrations)
- `/help alex-ba` - Requirements Analyst (user stories, contracts)
- `/help sarah-pm` - Project Coordinator (planning, reporting)
- `/help dr-ai-ml` - AI/ML Specialist (models, optimization)
- `/help oliver-mcp` - MCP Orchestrator (intelligent routing)

### Specific Rules
- `/help rule-1` - Parallel Task Execution
- `/help rule-2` - Automated Stress Testing
- `/help rule-3` - Daily Health Audits
- `/help rule-4` - Intelligent Onboarding
- `/help rule-5` - Automated Releases

### Workflows
- `/help every` - EVERY workflow (Plan → Assess → Delegate → Work → Codify)
- `/help three-tier` - Three-tier parallel development
- `/help instinctive-testing` - Instinctive Testing workflow

### Tools & Monitoring
- `/help monitoring` - Framework health checks
- `/help context` - Context management & memory
- `/help isolation` - Framework-project separation

---

## Quick Reference

### Most Common Actions

```bash
# Health & Diagnostics
npm run monitor              # Quick health check
npm run doctor               # Auto-fix issues
npm run dashboard            # Interactive monitoring
npm run validate:isolation   # Check framework separation

# Testing
npm run test                 # Run all tests
npm run test:coverage        # Tests with coverage report
npm run test:stress          # Run stress tests (Rule 2)

# Workflows (EVERY)
/plan "feature description"  # Phase 1: Research & design
/assess "work target"        # Phase 2: Validate readiness
/delegate "task pattern"     # Phase 3: Distribute work
/work "work target"          # Phase 4: Execute with tracking
/learn "feature branch"      # Phase 5: Codify learnings

# Agent Manual Activation (Fallback)
/maria review test coverage
/marcus review API security
/james optimize component performance
/dana optimize database queries
/alex refine user story
/sarah update project timeline
/dr-ai-ml deploy ML model
/oliver route MCP task
```

### Framework Structure

```
~/.versatil/                 # Framework home (isolated)
├── agents/                  # 18 OPERA agents
├── memories/                # Agent-specific patterns
├── docs/                    # Documentation cache
├── stats/                   # Context & performance stats
├── sessions/                # Session history
└── logs/                    # Framework logs

Your Project/                # User project (separate)
├── src/                     # Your code
├── tests/                   # Your tests
└── .versatil-project.json   # ONLY framework file here
```

---

## Core Concepts

### 1. Proactive Agents
Agents work **automatically** based on file patterns:
- Edit `*.test.ts` → Maria-QA activates
- Edit `*.tsx` → James-Frontend activates
- Edit `/api/*` → Marcus-Backend activates
- Edit `*.sql` → Dana-Database activates

**No slash commands needed!** Agents observe your work and assist proactively.

### 2. Isolation First
Framework is **completely separated** from user projects:
- Framework data: `~/.versatil/`
- User projects: `$(pwd)`
- **Only** `.versatil-project.json` in user projects

**Benefits**: Clean projects, no git pollution, multi-project support.

### 3. 5-Rule Automation
1. **Parallel Execution** - Run tasks simultaneously (3x faster)
2. **Stress Testing** - Auto-generate tests on code changes
3. **Daily Audits** - Health checks (99.9% reliability)
4. **Intelligent Onboarding** - Zero-config setup
5. **Automated Releases** - Bug tracking, versioning, releases

### 4. Compounding Engineering
Each feature makes the next **40% faster** through:
- Pattern codification (learned patterns stored)
- Template updates (real code examples)
- Effort estimation (planned vs actual)
- RAG memory (similarity search)

**EVERY Workflow**: Plan → Assess → Delegate → Work → Codify (repeat)

### 5. Quality Gates
Enforced at every phase:
- Development: Code review, unit tests (80%+ coverage), linting, security scan
- Integration: Integration testing, API validation, performance benchmarking
- Deployment: E2E testing, security verification, performance validation

### 6. Triple Memory System
- **Claude Memory**: User preferences, project decisions
- **Memory Tool**: Agent-specific patterns (last 30 days)
- **VERSATIL RAG**: Historical patterns (vector search)

**Result**: <0.5% context loss across sessions.

---

## Agent Directory (18 Total)

### Core OPERA Team (8 Agents)

#### 1. Alex-BA - Requirements Analyst
- **Triggers**: `requirements/**`, `*.feature`, issues
- **Capabilities**: User stories, API contracts, acceptance criteria
- **Example**: "Define authentication requirements"
- **Manual**: `/alex refine user story`

#### 2. Dana-Database - Database Architect
- **Triggers**: `*.sql`, `migrations/**`, `supabase/**`, `prisma/**`
- **Capabilities**: Schema design, RLS policies, query optimization
- **Example**: "Optimize slow database queries"
- **Manual**: `/dana optimize queries`

#### 3. Marcus-Backend - API Architect
- **Triggers**: `*.api.*`, `routes/**`, `controllers/**`
- **Capabilities**: Security scans, stress tests, API implementation
- **Sub-Agents**: marcus-node, marcus-python, marcus-rails, marcus-go, marcus-java
- **Example**: "Review API security"
- **Manual**: `/marcus review security`

#### 4. James-Frontend - UI/UX Expert
- **Triggers**: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
- **Capabilities**: Accessibility (WCAG 2.1 AA), performance, responsive design
- **Sub-Agents**: james-react, james-vue, james-nextjs, james-angular, james-svelte
- **Example**: "Optimize component performance"
- **Manual**: `/james optimize performance`

#### 5. Maria-QA - Quality Guardian
- **Triggers**: `*.test.*`, `__tests__/**`
- **Capabilities**: Test coverage (80%+ required), bug detection, e2e validation
- **Example**: "Review test coverage"
- **Manual**: `/maria review coverage`

#### 6. Sarah-PM - Project Coordinator
- **Triggers**: `*.md`, `docs/**`, project events
- **Capabilities**: Sprint reports, milestone tracking, agent coordination
- **Example**: "Update project timeline"
- **Manual**: `/sarah update timeline`

#### 7. Dr.AI-ML - AI/ML Specialist
- **Triggers**: `*.py`, `*.ipynb`, `models/**`
- **Capabilities**: Model validation, performance monitoring, deployment
- **Example**: "Deploy ML model"
- **Manual**: `/dr-ai-ml deploy model`

#### 8. Oliver-MCP - MCP Orchestrator
- **Triggers**: `**/mcp/**`, `*.mcp.*`, MCP tasks
- **Capabilities**: Intelligent MCP routing, anti-hallucination detection
- **Example**: "Route task to optimal MCP"
- **Manual**: `/oliver route task`

### Marcus Backend Sub-Agents (5)

1. **marcus-node**: Node.js 18+, Express/Fastify, async/await
2. **marcus-python**: Python 3.11+, FastAPI/Django, async Python
3. **marcus-rails**: Ruby on Rails 7+, Active Record, Hotwire
4. **marcus-go**: Go 1.21+, Gin/Echo, goroutines
5. **marcus-java**: Java 17+, Spring Boot 3, Spring Data JPA

### James Frontend Sub-Agents (5)

1. **james-react**: React 18+, hooks, TypeScript, TanStack Query
2. **james-vue**: Vue 3, Composition API, Pinia, VeeValidate
3. **james-nextjs**: Next.js 14+, App Router, Server Components
4. **james-angular**: Angular 17+, standalone components, signals
5. **james-svelte**: Svelte 4/5, SvelteKit, stores

---

## 5-Rule Automation System

### Rule 1: Parallel Task Execution
**What**: Run multiple tasks simultaneously without conflicts
- Automatic parallelization when editing multiple files
- Collision detection (prevents file conflicts)
- 3x faster development velocity

**Example**:
```bash
# Editing 3 files at once:
# → src/api/users.ts (Marcus-Backend)
# → src/components/UserList.tsx (James-Frontend)
# → migrations/add_users.sql (Dana-Database)
# All work in parallel, no conflicts!
```

### Rule 2: Automated Stress Testing
**What**: Auto-generate and run stress tests on code changes
- New API endpoint → stress tests auto-created
- 89% reduction in production bugs
- Performance validation (< 200ms response time)

**Example**:
```bash
# You write: POST /api/users
# Rule 2 generates:
# - 100 concurrent requests test
# - Rate limiting test
# - Error handling test
# Auto-runs on save!
```

### Rule 3: Daily Health Audits
**What**: Comprehensive system health check (daily minimum)
- Runs at 2 AM, immediate audit on issues
- 99.9% system reliability
- Proactive issue detection

**Example**:
```bash
npm run audit              # Manual audit
# Checks: Dependencies, security, performance, tests, build
# Auto-fixes: Outdated packages, missing configs
```

### Rule 4: Intelligent Onboarding
**What**: Auto-detect project type, setup agents automatically
- New project → zero-config setup wizard
- 90% faster onboarding
- Tech stack detection (React, Node.js, etc.)

**Example**:
```bash
npm run init
# → Detects: React + TypeScript + Node.js
# → Configures: james-react, marcus-node, Dana, Maria
# → Sets up: Test templates, quality gates, CI/CD
```

### Rule 5: Automated Releases
**What**: Bug tracking, version management, automated releases
- Test failure → auto-create issue → fix → release
- 95% reduction in release overhead
- Semantic versioning (major.minor.patch)

**Example**:
```bash
# Test fails:
# → Creates GitHub issue automatically
# → Assigns to relevant agent
# → Tracks fix progress
# → Auto-releases on merge
```

---

## MCP Ecosystem (12 Integrations)

### Core Development MCPs (5)

#### 1. Playwright/Chrome - Browser Automation
- **Agents**: Maria-QA, James-Frontend
- **Use Cases**: Visual regression, E2E testing, performance monitoring
- **Example**: Automated UI testing with Lighthouse scores

#### 2. Playwright Stealth - Design Scraping & Bot Bypass
- **Agents**: James-Frontend, Maria-QA
- **Use Cases**: Design research, component analysis, accessibility benchmarking
- **Example**: Study competitor design systems (92% bot bypass rate)
- **Ethical**: Rate limiting, public data only, audit logs

#### 3. GitHub - Repository Operations
- **Agents**: Marcus-Backend, Sarah-PM, Alex-BA
- **Use Cases**: PR feedback, CI/CD, issue tracking
- **Example**: Auto-generate PR comments with code review

#### 4. Exa - AI-Powered Search
- **Agents**: Alex-BA, Dr.AI-ML
- **Use Cases**: Research, documentation, competitive analysis
- **Example**: Find similar implementations for feature planning

#### 5. GitMCP - GitHub Documentation Access
- **Agents**: All agents
- **Use Cases**: Framework docs, code examples, pattern research
- **Example**: Query `tiangolo/fastapi` for OAuth2 patterns

### AI/ML Operations MCPs (2)

#### 6. Vertex AI - Google Cloud AI
- **Agents**: Dr.AI-ML, Marcus-Backend
- **Use Cases**: Gemini models, AI predictions, ML deployment
- **Example**: Deploy ML model to Google Cloud

#### 7. Supabase - Vector Database
- **Agents**: Marcus-Backend, Dr.AI-ML
- **Use Cases**: RAG memory, similarity search, embeddings
- **Example**: Store code patterns for future retrieval

### Automation & Monitoring MCPs (6)

#### 8. n8n - Workflow Automation
- **Agents**: Sarah-PM, Marcus, Maria-QA
- **Use Cases**: 525+ nodes, API integrations, scheduled tasks
- **Example**: Auto-notify team on test failures

#### 9. Semgrep - Security Scanning
- **Agents**: Marcus-Backend, Maria-QA, Dr.AI-ML
- **Use Cases**: 30+ languages, OWASP Top 10, vulnerability detection
- **Example**: Scan for SQL injection vulnerabilities

#### 10. Sentry - Error Monitoring
- **Agents**: Maria-QA, Marcus, Sarah-PM
- **Use Cases**: Error tracking, AI analysis, performance monitoring
- **Example**: Detect and report production errors

#### 11. Shadcn - Component Library
- **Agents**: James-Frontend
- **Use Cases**: React components, design system, accessibility
- **Example**: Generate accessible UI components

#### 12. Ant Design - React Components
- **Agents**: James-Frontend
- **Use Cases**: Enterprise UI, React components, responsive design
- **Example**: Build enterprise dashboard UI

---

## EVERY Workflow (5 Phases)

**Compounding Engineering**: Each feature makes the next 40% faster.

### Phase 1: PLAN
```bash
/plan "Add user authentication"
```
- **Purpose**: Research and design with templates + historical context
- **Agents**: Alex-BA, Dana, Marcus, James (parallel research)
- **Output**: Detailed plan with effort estimates, risks, alternatives
- **Compounding**: Uses templates from past features (40% faster planning)

### Phase 2: ASSESS
```bash
/assess "Add user authentication"
```
- **Purpose**: Validate readiness before work starts
- **Checks**: Framework health ≥80%, git clean, deps installed, DB connected, build passing
- **Compounding**: Catches blockers early (prevents wasted effort)

### Phase 3: DELEGATE
```bash
/delegate "authentication todos"
```
- **Purpose**: Distribute work to optimal agents
- **Features**: Smart agent selection, parallel execution, load balancing
- **Compounding**: Learns best agent assignments over time

### Phase 4: WORK
```bash
/work "authentication feature"
```
- **Purpose**: Execute implementation with tracking
- **Features**: Persistent todos (todos/*.md), real-time tracking, quality gates
- **Compounding**: Applies learned patterns automatically

### Phase 5: CODIFY
```bash
/learn "feature/auth"
```
- **Purpose**: Extract and store patterns for future use
- **Actions**: Analyze completed work, extract patterns, update estimates, store in RAG
- **Compounding**: Future features benefit from this feature's learnings

---

## Three-Tier Parallel Development

**Concept**: Frontend, backend, and database work **simultaneously**.

### Workflow Example: User Authentication

```yaml
Phase_1_Requirements (Alex-BA): 30 minutes
  - Define user stories
  - Create API contract
  - Document acceptance criteria

Phase_2_Parallel_Development: 60 minutes (parallel!)
  Dana_Database (45 min):
    - Design users/sessions tables
    - Add RLS policies
    - Create migration scripts

  Marcus_Backend (60 min):
    - Implement /api/auth/* endpoints
    - Use mock database initially
    - Add JWT generation

  James_Frontend (50 min):
    - Build LoginForm component
    - Use mock API initially
    - Add form validation

  Parallel_Time: max(45, 60, 50) = 60 minutes

Phase_3_Integration: 15 minutes
  - Dana → Marcus: Connect real database
  - Marcus → James: Connect real API

Phase_4_Quality (Maria-QA): 20 minutes
  - Run test suite
  - Validate coverage (80%+)
  - Check security compliance

Total_Time: 30 + 60 + 15 + 20 = 125 minutes (2.1 hours)
Sequential_Estimate: 220 minutes (3.7 hours)
Time_Saved: 95 minutes (43% faster via parallel 3-tier)
```

**Key Insight**: Mocks enable parallel work. Integration happens at the end.

---

## Instinctive Testing Workflow

**Concept**: Tests written **before** implementation (proactive, not reactive).

### Workflow
1. **Requirements** (Alex-BA) → User stories + acceptance criteria
2. **Test Design** (Maria-QA) → Test cases from requirements
3. **Implementation** (Dana, Marcus, James) → Code to pass tests
4. **Validation** (Maria-QA) → Coverage + quality gates

### Benefits
- **Fewer Bugs**: Tests catch issues during development (not after)
- **Better Design**: Writing tests first improves code structure
- **Faster Debugging**: Tests pinpoint exact failure location
- **Higher Coverage**: 80%+ coverage guaranteed (not optional)

---

## Command Reference

### Workflow Commands
```bash
/plan [feature]              # Phase 1: Research & design
  --validate                 # Run /validate-workflow after planning
  --dry-run                  # Simulate without creating todos
  --template=NAME            # Use specific template

/assess [work target]        # Phase 2: Validate readiness
  --fix                      # Auto-fix issues
  --verbose                  # Show detailed health report

/delegate [task pattern]     # Phase 3: Distribute work
  --agents=LIST              # Specify agents (e.g., "maria,marcus")
  --parallel                 # Force parallel execution

/work [work target]          # Phase 4: Execute with tracking
  --monitor                  # Continuous monitoring
  --auto-commit              # Auto-commit on completion

/learn [feature branch]      # Phase 5: Codify learnings
  --template                 # Update plan templates
  --rag                      # Store in RAG memory
```

### Agent Commands
```bash
/maria [task]                # Quality Guardian
/marcus [task]               # API Architect
/james [task]                # UI/UX Expert
/dana [task]                 # Database Architect
/alex [task]                 # Requirements Analyst
/sarah [task]                # Project Coordinator
/dr-ai-ml [task]             # AI/ML Specialist
/oliver [task]               # MCP Orchestrator
```

### Monitoring Commands
```bash
/monitor                     # Quick health check (5 seconds)
/monitor dashboard           # Interactive TUI
/monitor watch               # Continuous monitoring (every 60s)
/monitor report              # Generate debug report
/monitor agents              # Show all agent metrics
/monitor logs                # View recent logs
/monitor stress              # Run stress tests
/monitor background start    # Start background monitor
```

### Utility Commands
```bash
/doctor                      # Auto-fix framework issues
  --fix                      # Apply fixes automatically
  --verbose                  # Show detailed diagnostics

/context                     # Context management
  stats                      # View context statistics
  report                     # Generate context report
  cleanup                    # Clean old stats

/generate                    # Code generation
  test [file]                # Generate tests
  docs [file]                # Generate documentation
  types [file]               # Generate TypeScript types

/triage [issue]              # Issue triage
  --priority=P0|P1|P2|P3     # Set priority level
  --assign=AGENT             # Assign to specific agent

/resolve [issue]             # Issue resolution
  --verify                   # Verify fix after resolution
```

---

## Troubleshooting

### Common Issues

#### 1. Framework Health Below 80%
```bash
# Symptom: /monitor shows health score < 80%

# Solution:
npm run doctor --fix         # Auto-fix issues
npm run validate:isolation   # Check framework separation
npm run monitor report       # Generate debug report
```

#### 2. Agents Not Activating Proactively
```bash
# Symptom: Editing files doesn't trigger agents

# Checks:
1. Verify daemon running: ps aux | grep versatil-daemon
2. Check .cursor/settings.json: proactive agents enabled?
3. Validate file patterns: Edit known trigger file (*.test.ts)

# Solution:
npm run init                 # Re-run onboarding (Rule 4)
```

#### 3. Context Loss / Agent "Forgot" Information
```bash
# Symptom: Agent doesn't remember previous discussion

# Checks:
npm run context:stats        # Check context clear events
cat ~/.versatil/stats/clear-events.json  # View recent clears

# Solution:
1. Agent stores patterns to memory before clear (automatic)
2. Check ~/.versatil/memories/[agent-id]/ for stored patterns
3. Use /context stats to monitor future clears
```

#### 4. MCP Server Errors
```bash
# Symptom: "MCP server unavailable" errors

# Diagnosis:
versatil-mcp --health-check  # Test all MCPs
cat ~/.cursor/mcp_config.json  # Verify configuration

# Common Fixes:
- GitHub MCP: gh auth login
- Chrome MCP: Check playwright installation
- Supabase MCP: Verify SUPABASE_URL and SUPABASE_ANON_KEY
```

#### 5. Test Coverage Below 80%
```bash
# Symptom: Maria-QA blocks commit due to low coverage

# Solution:
npm run test:coverage        # See which files lack coverage
/maria generate tests [file]  # Auto-generate missing tests
npm run test:coverage        # Verify coverage now >= 80%
```

#### 6. Build Failures
```bash
# Symptom: npm run build fails

# Diagnosis:
npm run build 2>&1 | tee build-error.log  # Capture errors

# Common Fixes:
npm ci                       # Clean install dependencies
npm run lint --fix           # Auto-fix linting errors
npm run type-check           # Identify TypeScript errors
```

#### 7. Isolation Violations
```bash
# Symptom: Framework files appearing in user project

# Diagnosis:
npm run validate:isolation   # Check for violations

# Solution:
# Remove framework files from project (NEVER commit these):
rm -rf .versatil/ versatil/ supabase/ .versatil-memory/ .versatil-logs/

# Keep only:
# .versatil-project.json (this is OK!)
```

#### 8. Performance Degradation
```bash
# Symptom: Framework feels slow

# Diagnosis:
npm run monitor stress       # Run stress tests
npm run dashboard            # Check agent load

# Solutions:
npm run context:cleanup      # Clean old stats (30 days)
rm -rf ~/.versatil/logs/*.log  # Clear old logs
npm ci                       # Reinstall dependencies
```

### Emergency Protocols

#### Critical Production Issue (P0)
```bash
/emergency "Critical production issue: [description]"

# Auto-activates:
# - Maria-QA (test validation)
# - Marcus-Backend (security & performance)
# - Sarah-PM (stakeholder communication)
# All agents respond immediately
```

#### Security Vulnerability (P0)
```bash
/escalate "Security vulnerability: [description]"

# Auto-activates:
# - Marcus-Backend (security scan)
# - Maria-QA (test validation)
# - Sarah-PM (incident report)
# Immediate response with security patches
```

### Diagnostic Commands

```bash
# Framework Health
npm run monitor              # Quick health check
npm run doctor               # Auto-fix issues
npm run validate:isolation   # Check framework separation

# Logs
tail -f ~/.versatil/logs/framework.log       # Framework logs
tail -f ~/.versatil/logs/hooks.log           # Hook execution logs
tail -f ~/.versatil/logs/session-metrics.log # Session metrics

# Context & Memory
npm run context:stats        # Context statistics
npm run context:report       # Detailed context report
ls -la ~/.versatil/memories/  # View agent memories

# Agent Performance
cat ~/.versatil/metrics/agent-Maria-QA.json  # Maria metrics
cat ~/.versatil/metrics/agent-Marcus-Backend.json  # Marcus metrics

# MCP Health
versatil-mcp --health-check  # Test all MCP servers
cat ~/.cursor/mcp_config.json  # View MCP configuration
```

---

## Documentation Locations

### Core Documentation
- **CLAUDE.md** - Framework methodology (this file)
- **.claude/AGENTS.md** - Complete agent details (18 agents)
- **.claude/rules/README.md** - 5-Rule system documentation

### Agent Commands
- **.claude/commands/** - All slash command definitions
  - **plan.md** - /plan command
  - **assess.md** - /assess command
  - **delegate.md** - /delegate command
  - **work.md** - /work command
  - **learn.md** - /learn command
  - **monitor.md** - /monitor command

### Quick Reference (Printable)
- **docs/quick-reference/AGENTS_CHEAT_SHEET.md** - Agent quick reference
- **docs/quick-reference/RULES_CHEAT_SHEET.md** - Rules quick reference
- **docs/quick-reference/MCP_CHEAT_SHEET.md** - MCP quick reference
- **docs/quick-reference/WORKFLOW_CHEAT_SHEET.md** - Workflow quick reference

### Detailed Guides
- **docs/guides/monitoring-guide.md** - Complete monitoring guide
- **docs/guides/context-management.md** - Context & memory guide
- **docs/guides/design-scraping.md** - Playwright Stealth guide

### Implementation Details
- **docs/enhancements/MEMORY_TOOL_INTEGRATION.md** - Memory Tool Phase 1+2
- **docs/enhancements/CONTEXT_EDITING_PHASE2.md** - Context statistics
- **docs/reference/claude-mcp-docs.md** - Claude documentation access

---

## Next Steps

### For Beginners
1. Run `npm run monitor` to check framework health
2. Edit a test file to see Maria-QA auto-activate
3. Edit a component file to see James-Frontend auto-activate
4. Try `/plan "simple feature"` to see EVERY workflow
5. Read `.claude/AGENTS.md` to understand all 18 agents

### For Advanced Users
1. Study **Compounding Engineering** in CLAUDE.md
2. Learn **EVERY Workflow** (5 phases)
3. Explore **Three-Tier Parallel Development**
4. Master **Instinctive Testing**
5. Configure **MCP integrations** for your needs

### Resources
- **GitHub**: https://github.com/versatil-sdlc-framework
- **Documentation**: https://docs.versatil.dev
- **Community**: https://discord.gg/versatil

---

**Framework Version**: 6.4.0
**Last Updated**: 2025-10-19
**Maintained By**: VERSATIL Team

Need specific help? Use `/help [topic]` from the list above!
