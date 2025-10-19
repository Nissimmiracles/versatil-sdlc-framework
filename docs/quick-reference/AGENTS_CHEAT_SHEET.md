# VERSATIL Agents - Quick Reference Cheat Sheet

**18 OPERA Agents** (8 Core + 10 Sub-Agents) - AI-Native Development Team

---

## Core OPERA Team (8 Agents)

### 1. Alex-BA - Requirements Analyst
```yaml
Role: Business Analysis & Requirements
Triggers: requirements/**, *.feature, issues
Capabilities:
  - User story creation
  - API contract definition
  - Acceptance criteria
  - Requirements traceability
Manual: /alex refine user story
Example: "Define authentication requirements"
```

### 2. Dana-Database - Database Architect
```yaml
Role: Database Design & Optimization
Triggers: *.sql, migrations/**, supabase/**, prisma/**
Capabilities:
  - Schema design (normalized, efficient)
  - RLS policies (row-level security)
  - Query optimization (< 100ms)
  - Migration scripts
Manual: /dana optimize queries
Example: "Optimize slow database queries"
```

### 3. Marcus-Backend - API Architect
```yaml
Role: API Design & Security
Triggers: *.api.*, routes/**, controllers/**
Capabilities:
  - Security scans (OWASP Top 10)
  - Stress test generation (Rule 2)
  - API implementation
  - Performance validation (< 200ms)
Sub-Agents: marcus-node, marcus-python, marcus-rails, marcus-go, marcus-java
Manual: /marcus review security
Example: "Review API security patterns"
```

### 4. James-Frontend - UI/UX Expert
```yaml
Role: Frontend Development & Accessibility
Triggers: *.tsx, *.jsx, *.vue, *.css
Capabilities:
  - Accessibility (WCAG 2.1 AA)
  - Performance optimization
  - Responsive design
  - Component architecture
Sub-Agents: james-react, james-vue, james-nextjs, james-angular, james-svelte
Manual: /james optimize performance
Example: "Optimize component rendering"
```

### 5. Maria-QA - Quality Guardian
```yaml
Role: Testing & Quality Assurance
Triggers: *.test.*, __tests__/**
Capabilities:
  - Test coverage analysis (80%+ required)
  - Bug detection
  - E2E validation
  - Quality gate enforcement
Manual: /maria review coverage
Example: "Review test coverage for authentication"
Quality Gates:
  - Unit tests: 80%+ coverage
  - Integration tests: All critical paths
  - E2E tests: User flows
  - Performance: Lighthouse >= 90
```

### 6. Sarah-PM - Project Coordinator
```yaml
Role: Project Management & Coordination
Triggers: *.md, docs/**, project events
Capabilities:
  - Sprint planning
  - Milestone tracking
  - Agent coordination
  - Progress reporting
Manual: /sarah update timeline
Example: "Generate sprint report"
```

### 7. Dr.AI-ML - AI/ML Specialist
```yaml
Role: AI/ML Development & Deployment
Triggers: *.py, *.ipynb, models/**
Capabilities:
  - Model validation
  - Performance monitoring
  - Deployment automation
  - ML optimization
Manual: /dr-ai-ml deploy model
Example: "Deploy ML model to production"
```

### 8. Oliver-MCP - MCP Orchestrator
```yaml
Role: MCP Integration & Routing
Triggers: **/mcp/**, *.mcp.*, MCP tasks
Capabilities:
  - Intelligent MCP routing
  - Anti-hallucination detection (GitMCP)
  - MCP health monitoring
  - Tool selection optimization
Manual: /oliver route task
Example: "Route task to optimal MCP server"
```

---

## Marcus Backend Sub-Agents (5)

### marcus-node (Node.js 18+)
```yaml
Framework: Node.js, Express, Fastify
Patterns:
  - async/await error handling
  - Middleware composition
  - RESTful API design
  - JWT authentication
Auto-Activates: Detects package.json + Node.js patterns
Best For: Scalable APIs, microservices
```

### marcus-python (Python 3.11+)
```yaml
Framework: FastAPI, Django, Flask
Patterns:
  - Type hints (Pydantic)
  - Async Python (asyncio)
  - Dependency injection
  - API documentation (OpenAPI)
Auto-Activates: Detects requirements.txt + Python patterns
Best For: Data APIs, ML services
```

### marcus-rails (Ruby on Rails 7+)
```yaml
Framework: Ruby on Rails
Patterns:
  - Active Record ORM
  - Convention over configuration
  - Hotwire (Turbo + Stimulus)
  - ActionCable (WebSockets)
Auto-Activates: Detects Gemfile + Rails patterns
Best For: Full-stack apps, rapid prototyping
```

### marcus-go (Go 1.21+)
```yaml
Framework: Gin, Echo, Go standard library
Patterns:
  - Goroutines & channels
  - Struct validation
  - Middleware chains
  - Error wrapping
Auto-Activates: Detects go.mod + Go patterns
Best For: High-performance APIs, microservices
```

### marcus-java (Java 17+)
```yaml
Framework: Spring Boot 3, Spring Data JPA
Patterns:
  - Dependency injection
  - JPA repositories
  - REST controllers
  - Spring Security
Auto-Activates: Detects pom.xml/build.gradle + Java patterns
Best For: Enterprise applications
```

---

## James Frontend Sub-Agents (5)

### james-react (React 18+)
```yaml
Framework: React, TypeScript, hooks
Patterns:
  - Functional components
  - Custom hooks
  - TanStack Query (data fetching)
  - Zustand/Redux (state management)
Auto-Activates: Detects package.json + React imports
Best For: SPAs, dashboards
```

### james-vue (Vue 3)
```yaml
Framework: Vue 3, Composition API, Pinia
Patterns:
  - <script setup> syntax
  - Composables
  - Pinia stores
  - VeeValidate (forms)
Auto-Activates: Detects package.json + Vue patterns
Best For: Progressive web apps
```

### james-nextjs (Next.js 14+)
```yaml
Framework: Next.js, App Router, RSC
Patterns:
  - Server Components
  - Server Actions
  - Dynamic routes
  - Middleware
Auto-Activates: Detects next.config.js + App Router
Best For: SEO-critical apps, hybrid rendering
```

### james-angular (Angular 17+)
```yaml
Framework: Angular, standalone components, signals
Patterns:
  - Standalone components
  - Signals (reactivity)
  - Dependency injection
  - RxJS observables
Auto-Activates: Detects angular.json + Angular patterns
Best For: Enterprise frontends
```

### james-svelte (Svelte 4/5)
```yaml
Framework: Svelte, SvelteKit
Patterns:
  - Reactive declarations ($:)
  - Stores (writable, readable)
  - SvelteKit routing
  - Form actions
Auto-Activates: Detects svelte.config.js + .svelte files
Best For: Lightweight apps, animations
```

---

## Agent Collaboration Patterns

### Three-Tier Parallel Development
```
User Request: "Add user authentication"

┌────────────────────────────────────────────────────┐
│ Alex-BA (30 min)                                   │
│ → User stories, API contract, acceptance criteria  │
└────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Parallel Phase (60 min)                                         │
├──────────────────┬──────────────────┬──────────────────────────┤
│ Dana-Database    │ Marcus-Backend   │ James-Frontend           │
│ (45 min)         │ (60 min)         │ (50 min)                 │
│                  │                  │                          │
│ • Schema design  │ • API endpoints  │ • LoginForm component   │
│ • RLS policies   │ • JWT logic      │ • Form validation       │
│ • Migrations     │ • Mock database  │ • Mock API              │
└──────────────────┴──────────────────┴──────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│ Integration (15 min)                                │
│ → Connect database to API, API to frontend         │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│ Maria-QA (20 min)                                  │
│ → Test coverage, security scan, quality gates      │
└────────────────────────────────────────────────────┘

Total: 125 min (vs 220 min sequential) = 43% faster!
```

### Proactive Activation Examples

```yaml
Scenario_1_Test_File:
  User_Action: "Edit LoginForm.test.tsx"
  Auto_Activation: Maria-QA
  Actions:
    - Run coverage analysis
    - Check for missing test cases
    - Validate assertions
    - Suggest improvements

Scenario_2_API_File:
  User_Action: "Edit /api/users.ts"
  Auto_Activation: Marcus-Backend → marcus-node
  Actions:
    - Security scan (OWASP)
    - Generate stress tests (Rule 2)
    - Validate response time (< 200ms)
    - Check error handling

Scenario_3_Component:
  User_Action: "Edit Button.tsx"
  Auto_Activation: James-Frontend → james-react
  Actions:
    - Accessibility check (WCAG 2.1 AA)
    - Performance validation
    - Responsive design check
    - Suggest optimizations
```

---

## Quick Commands

```bash
# Manual Agent Activation (Fallback)
/maria review test coverage
/marcus review API security
/james optimize component performance
/dana optimize database queries
/alex refine user story
/sarah update project timeline
/dr-ai-ml deploy ML model
/oliver route MCP task

# Multi-Agent Collaboration
/collaborate james marcus "API integration"
/handoff james maria "UI ready for testing"

# Emergency Protocols
/emergency "Critical production issue"
/escalate "Security vulnerability detected"
```

---

## Agent Performance Metrics

```yaml
Maria-QA:
  Test_Coverage: 80%+ required
  Bug_Detection: 89% reduction
  Quality_Gates: 100% enforcement

Marcus-Backend:
  Response_Time: < 200ms
  Security_Score: A+ (OWASP)
  Stress_Tests: Auto-generated (Rule 2)

James-Frontend:
  Accessibility: WCAG 2.1 AA
  Performance: Lighthouse >= 90
  Responsive: 100% mobile-friendly

Dana-Database:
  Query_Performance: < 100ms
  Schema_Quality: 100% normalized
  RLS_Coverage: 100% secure
```

---

## Agent Triggers (File Patterns)

```yaml
Test_Files: *.test.*, *.spec.*, __tests__/** → Maria-QA
API_Files: *.api.*, routes/**, controllers/** → Marcus-Backend
UI_Files: *.tsx, *.jsx, *.vue, *.css → James-Frontend
DB_Files: *.sql, migrations/**, supabase/** → Dana-Database
Requirements: requirements/**, *.feature → Alex-BA
Docs: *.md, docs/** → Sarah-PM
ML_Files: *.py, *.ipynb, models/** → Dr.AI-ML
MCP_Files: **/mcp/**, *.mcp.* → Oliver-MCP
```

---

**Framework Version**: 6.4.0
**Total Agents**: 18 (8 core + 10 sub-agents)
**Last Updated**: 2025-10-19

For detailed documentation: `/help agents` or see `.claude/AGENTS.md`
