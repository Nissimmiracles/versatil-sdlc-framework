# VERSATIL SDLC Framework - Claude Code Integration

**Version**: 7.16.2
**Mode**: Claude Code CLI (Native SDK Integration)
**Framework**: OPERA Multi-Agent Orchestration
**Agents**: 12 primary + 10 sub-agents
**Commands**: 34 slash commands
**Skills**: 78 specialized skills

---

## MANDATORY: Auto-Activation Rules for Claude Code

When working in Claude Code CLI (not Cursor IDE), Claude MUST automatically invoke the appropriate OPERA agent based on task detection. This replaces the daemon-based file watching system used in Cursor.

---

## Primary Agents (12)

### Agent Auto-Activation Matrix

| Agent | Command | Keywords | Priority |
|-------|---------|----------|----------|
| **Maria-QA** | `/maria-qa` | test, coverage, qa, e2e, unit test, jest, vitest, playwright | CRITICAL |
| **James-Frontend** | `/james-frontend` | component, ui, react, vue, css, frontend, accessibility | HIGH |
| **Marcus-Backend** | `/marcus-backend` | api, endpoint, backend, server, security, owasp, rest | HIGH |
| **Dana-Database** | `/dana-database` | database, schema, migration, sql, postgres, prisma, rls | HIGH |
| **Dr.AI-ML** | `/dr-ai-ml` | ml, model, training, embedding, rag, vertex ai, pytorch | HIGH |
| **Alex-BA** | `/alex-ba` | requirement, user story, acceptance criteria, specification | MEDIUM |
| **Sarah-PM** | `/sarah-pm` | project, plan, sprint, milestone, coordinate, delegate | MEDIUM |
| **Oliver-MCP** | `/oliver-mcp` | mcp, integration, playwright, github, anti-hallucination | MEDIUM |
| **Victor-Verifier** | Task agent | verify, hallucination, fact-check, proof, confidence | MEDIUM |
| **Iris-Guardian** | `/guardian` | health, monitor, auto-fix, remediation, framework | LOW |
| **Feedback-Codifier** | Task agent | feedback, pattern, codify, learning, improvement | LOW |
| **Inventory-Manager** | Task agent | inventory, stock, warehouse, supply chain | LOW |

---

## Sub-Agents (10)

### James-Frontend Sub-Agents (Framework-Specific)

| Sub-Agent | Trigger Keywords | Use When |
|-----------|-----------------|----------|
| **james-react-frontend** | react, hooks, useState, jsx, redux | React/Next.js projects |
| **james-nextjs-frontend** | nextjs, app router, server components | Next.js 13+ projects |
| **james-vue-frontend** | vue, vuex, pinia, composition api | Vue.js projects |
| **james-angular-frontend** | angular, rxjs, ngrx, typescript | Angular projects |
| **james-svelte-frontend** | svelte, sveltekit, stores | Svelte projects |

**Auto-Detection**: Claude detects framework from `package.json` or file patterns and uses appropriate sub-agent.

### Marcus-Backend Sub-Agents (Language-Specific)

| Sub-Agent | Trigger Keywords | Use When |
|-----------|-----------------|----------|
| **marcus-node-backend** | node, express, fastify, nestjs | Node.js/TypeScript |
| **marcus-python-backend** | python, fastapi, django, flask | Python backends |
| **marcus-go-backend** | go, golang, gin, fiber | Go backends |
| **marcus-java-backend** | java, spring, springboot, maven | Java/Spring |
| **marcus-rails-backend** | ruby, rails, activerecord | Ruby on Rails |

**Auto-Detection**: Claude detects language from file extensions and project structure.

---

## Detailed Trigger Rules

### Maria-QA (Quality Assurance) - CRITICAL
```yaml
keywords:
  - test, spec, coverage, qa, validation
  - e2e, unit test, integration test
  - playwright, vitest, jest, mocha
  - quality gate, assertion, mock
file_patterns:
  - "*.test.*", "*.spec.*"
  - "__tests__/", "test/", "tests/"
  - "*.e2e.ts", "*.integration.ts"
code_patterns:
  - "describe(", "it(", "test("
  - "expect(", "assert", "should"
  - "beforeEach", "afterEach", "mock"
actions:
  - Writing tests
  - Fixing test failures
  - Improving coverage (target: 80%+)
  - Security testing (OWASP)
  - Accessibility audits (WCAG)
  - Performance validation
```

### James-Frontend (UI/UX) - HIGH
```yaml
keywords:
  - component, ui, css, frontend
  - react, vue, angular, svelte
  - responsive, accessibility, a11y, wcag
  - tailwind, styled, emotion, sass
  - animation, transition, layout
file_patterns:
  - "*.tsx", "*.jsx", "*.vue", "*.svelte"
  - "*.css", "*.scss", "*.sass", "*.less"
  - "components/", "pages/", "views/"
code_patterns:
  - "useState", "useEffect", "useMemo"
  - "className", "style=", "<div"
  - "props", "children", "render"
actions:
  - Building components
  - Styling and theming
  - Accessibility fixes
  - Responsive design
  - Animation/interaction
  - Performance optimization (LCP, FID, CLS)
```

### Marcus-Backend (API/Server) - HIGH
```yaml
keywords:
  - api, endpoint, backend, server
  - security, authentication, authorization
  - owasp, rest, graphql, grpc
  - middleware, controller, route
  - jwt, session, oauth
file_patterns:
  - "**/routes/**", "**/controllers/**"
  - "**/api/**", "**/server/**"
  - "*.controller.ts", "*.service.ts"
code_patterns:
  - "router.", "app.", "express."
  - "fastify.", "async function"
  - "req, res", "@Get", "@Post"
actions:
  - Building APIs
  - Security hardening (OWASP Top 10)
  - Authentication/authorization
  - Performance optimization (<200ms)
  - Rate limiting
  - Error handling
```

### Dana-Database (Database/Schema) - HIGH
```yaml
keywords:
  - database, schema, migration, query
  - sql, postgres, mysql, mongodb
  - supabase, prisma, drizzle, knex
  - rls, policy, index, table
  - optimization, n+1, join
file_patterns:
  - "*.sql", "**/migrations/**"
  - "schema.prisma", "**/supabase/**"
  - "**/models/**", "**/entities/**"
code_patterns:
  - "CREATE TABLE", "ALTER TABLE"
  - "SELECT", "INSERT", "UPDATE"
  - "RLS", "POLICY", "INDEX"
actions:
  - Schema design
  - Migration creation
  - Query optimization (<50ms)
  - RLS policies (multi-tenant)
  - Index optimization
  - N+1 query detection
```

### Dr.AI-ML (Machine Learning/AI) - HIGH
```yaml
keywords:
  - machine learning, ml, ai, model
  - training, dataset, embedding
  - rag, vector, similarity
  - tensorflow, pytorch, scikit
  - vertex ai, sagemaker, openai
file_patterns:
  - "*.py", "*.ipynb"
  - "**/models/**", "**/ml/**"
  - "**/training/**", "**/inference/**"
code_patterns:
  - "import tensorflow", "import torch"
  - "model.", "train(", "predict("
  - "embedding", "vector", "similarity"
actions:
  - ML pipelines
  - Model training
  - Embeddings/RAG systems
  - Model deployment (Vertex AI)
  - Feature engineering
  - Model evaluation
```

### Alex-BA (Business Analysis) - MEDIUM
```yaml
keywords:
  - requirement, user story, feature
  - acceptance criteria, specification
  - stakeholder, business logic
  - domain model, api contract
file_patterns:
  - "*.feature", "**/requirements/**"
  - "**/specs/**", "*.story"
code_patterns:
  - "As a", "Given", "When", "Then"
  - "Scenario", "Feature:"
actions:
  - Requirements gathering
  - User story creation
  - API contract definition
  - Acceptance criteria
  - Domain modeling
```

### Sarah-PM (Project Management) - MEDIUM
```yaml
keywords:
  - project, plan, milestone, sprint
  - coordination, status, report
  - roadmap, delegate, orchestrate
  - timeline, priority, resource
actions:
  - Planning (/plan command)
  - Multi-agent coordination
  - Sprint management
  - Status reporting
  - Resource allocation
  - Conflict resolution
```

### Oliver-MCP (MCP Integration) - MEDIUM
```yaml
keywords:
  - mcp, integration, server
  - playwright, github, filesystem
  - anti-hallucination, routing
file_patterns:
  - "**/mcp/**", "*.mcp.*"
  - "mcp_config.json"
actions:
  - MCP server setup
  - Anti-hallucination (GitMCP)
  - Tool routing
  - Integration testing
```

### Victor-Verifier (Fact Verification) - MEDIUM
```yaml
keywords:
  - verify, verification, fact-check
  - hallucination, proof, evidence
  - confidence, ground truth
actions:
  - Statement verification
  - Hallucination detection
  - Proof log generation
  - Confidence scoring
  - Chain-of-Verification (CoVe)
```

### Iris-Guardian (System Health) - LOW
```yaml
keywords:
  - health, monitor, guardian
  - auto-fix, remediation
  - framework, system
commands:
  - /guardian (health check)
  - /guardian-logs (view logs)
  - /monitor (real-time)
actions:
  - Framework health monitoring
  - Auto-remediation (90%+ confidence)
  - RAG health checks
  - Version management
```

---

## Skills (78 Total)

### How to Use Skills
Claude can invoke skills using the Skill tool: `skill: "skill-name"`

### Core Development Skills
| Skill | Use When |
|-------|----------|
| `testing-strategies` | Writing tests (Vitest, Playwright, MSW) |
| `component-patterns` | Building accessible components (shadcn/ui, Radix) |
| `api-design` | Designing REST/GraphQL/tRPC APIs |
| `state-management` | Managing state (Zustand, TanStack Query, Jotai) |
| `auth-security` | Implementing auth (OAuth2, JWT, OWASP) |
| `styling-architecture` | CSS-in-JS (Panda CSS, Vanilla Extract, CVA) |

### Database Skills
| Skill | Use When |
|-------|----------|
| `schema-optimization` | Optimizing database schemas |
| `rls-policies` | Row-Level Security for multi-tenant |
| `vector-databases` | pgvector, embeddings, semantic search |
| `edge-databases` | Supabase Edge, Cloudflare D1 |

### ML/AI Skills
| Skill | Use When |
|-------|----------|
| `ml-pipelines` | Training pipelines, MLflow, Kubeflow |
| `model-deployment` | TensorFlow Serving, TorchServe |
| `rag-patterns` | RAG implementation patterns |
| `rag-query` | Querying RAG systems |

### Architecture Skills
| Skill | Use When |
|-------|----------|
| `microservices` | Service mesh, API gateways, event-driven |
| `serverless` | Lambda, Edge Functions, Workers |
| `cross-domain-patterns` | Full-stack feature implementation |

### Quality Skills
| Skill | Use When |
|-------|----------|
| `quality-gates` | Pre-commit/PR quality validation |
| `accessibility-audit` | WCAG 2.2 compliance |
| `visual-regression` | Chromatic, Percy, BackstopJS |

### Framework Skills
| Skill | Use When |
|-------|----------|
| `opera-orchestration` | Multi-agent workflow coordination |
| `compounding-engineering` | Pattern search, template matching |
| `context-injection` | Loading user/team/project context |
| `code-generators` | Generating agents, commands, hooks, skills |

### Document Skills
| Skill | Use When |
|-------|----------|
| `document-skills/pdf` | Working with PDFs |
| `document-skills/xlsx` | Working with Excel files |
| `document-skills/docx` | Working with Word documents |
| `document-skills/pptx` | Working with PowerPoints |

### Creative Skills
| Skill | Use When |
|-------|----------|
| `algorithmic-art` | Generative art with p5.js |
| `canvas-design` | Visual art, posters, designs |
| `slack-gif-creator` | Animated GIFs for Slack |
| `theme-factory` | Applying themes to artifacts |

---

## All Slash Commands (34)

### Agent Commands
| Command | Agent | Purpose |
|---------|-------|---------|
| `/maria-qa [task]` | Maria-QA | Quality assurance, testing |
| `/james-frontend [task]` | James-Frontend | UI/UX development |
| `/marcus-backend [task]` | Marcus-Backend | API/backend development |
| `/dana-database [task]` | Dana-Database | Database tasks |
| `/dr-ai-ml [task]` | Dr.AI-ML | ML/AI development |
| `/alex-ba [task]` | Alex-BA | Business analysis |
| `/sarah-pm [task]` | Sarah-PM | Project coordination |
| `/oliver-mcp [task]` | Oliver-MCP | MCP integration |

### Workflow Commands
| Command | Purpose |
|---------|---------|
| `/plan [feature]` | Plan feature with OPERA agents |
| `/work [target]` | Execute implementation with tracking |
| `/review [branch]` | Multi-agent code review |
| `/delegate [task]` | Distribute work to optimal agents |
| `/resolve [todos]` | Resolve todos in parallel |
| `/assess [target]` | Pre-work quality assessment |
| `/triage [findings]` | Triage findings into todos |
| `/learn [summary]` | Learn from completed work |

### Framework Commands
| Command | Purpose |
|---------|---------|
| `/monitor` | Real-time framework health |
| `/guardian` | System health & auto-fix |
| `/guardian-logs` | View Guardian activity logs |
| `/help` | Framework help & troubleshooting |
| `/onboard` | Interactive onboarding wizard |
| `/config-wizard` | Configuration settings |
| `/update` | Version update wizard |
| `/approve` | Approve Guardian suggestions |

### Debug Commands
| Command | Purpose |
|---------|---------|
| `/framework-debug` | Collect debug information |
| `/framework:doctor` | Health check & auto-fix |
| `/framework:validate` | Validate isolation |

### Advanced Commands
| Command | Purpose |
|---------|---------|
| `/rag` | Manage RAG storage & patterns |
| `/generate [purpose]` | Generate workflow commands |
| `/roadmap-test [template]` | Execute roadmap stress tests |
| `/validate-workflow [desc]` | Validate multi-hour workflows |
| `/architecture` | View complete framework architecture |

---

## Multi-Agent Collaboration

### Automatic Collaboration Patterns

**Feature Implementation** (triggers `/plan`):
```
User: "Build user authentication"

Auto-orchestration:
1. Alex-BA → Define requirements & acceptance criteria
2. Dana-Database → Design users/sessions schema (parallel)
3. Marcus-Backend → Implement auth API (parallel)
4. James-Frontend → Build login/register UI (parallel)
5. Maria-QA → Write tests & validate quality gates
```

**Bug Fix** (triggers primary agent + Maria-QA):
```
User: "Fix the login not working"

Auto-orchestration:
1. Marcus-Backend → Investigate & fix API issue
2. Maria-QA → Validate fix with tests
```

**Performance Issue** (triggers `/assess` first):
```
User: "The dashboard is slow"

Auto-orchestration:
1. /assess → Identify bottlenecks
2. Dana-Database → Optimize queries (if DB issue)
3. James-Frontend → Optimize rendering (if UI issue)
4. Marcus-Backend → Optimize API (if backend issue)
5. Maria-QA → Validate performance targets
```

---

## Quality Gates (Enforced)

| Gate | Target | Validated By |
|------|--------|--------------|
| Test Coverage | >= 80% | Maria-QA |
| Security | OWASP Top 10 compliant | Marcus-Backend |
| Accessibility | WCAG 2.1 AA | James-Frontend |
| API Performance | < 200ms (p95) | Marcus-Backend |
| Database Queries | < 50ms | Dana-Database |
| Frontend Performance | LCP < 2.5s | James-Frontend |

**Before completing ANY task, validate with `/maria-qa`**

---

## OPERA Methodology

```
O - Orchestrate: Sarah-PM coordinates multi-agent workflows
P - Plan: Alex-BA defines requirements and acceptance criteria
E - Execute: Domain agents implement (Marcus, James, Dana, Dr.AI)
R - Review: Maria-QA validates quality gates
A - Adapt: Iris-Guardian monitors and auto-remediates
```

---

## Framework Detection

Claude Code mode is active when:
- Running in terminal/CLI (not Cursor IDE)
- No Cursor daemon process running
- Direct `claude` command invocation

**In Claude Code mode, YOU (Claude) are the orchestrator. Actively detect context and invoke agents.**

---

## Project Structure

```
.claude/
├── agents/           # 12 primary agent definitions
│   └── sub-agents/   # 10 framework/language-specific agents
├── commands/         # 34 slash commands
├── skills/           # 78 specialized skills
├── hooks/            # Claude Code SDK hooks
│   └── run-hook.sh   # Hook runner (fixes PATH issues)
├── rules/            # 5-Rule automation system
└── settings.json     # Claude Code configuration

src/
├── agents/           # Agent implementations
├── orchestration/    # Parallel execution
├── testing/          # Stress testing
├── audit/            # Health monitoring
├── rag/              # Pattern learning
└── mcp/              # MCP integrations
```

---

## Getting Started

1. **Simple tasks**: Describe what you need → Claude auto-activates right agent
2. **Complex tasks**: Use `/plan [feature]` → Multi-agent orchestration
3. **Quality checks**: Use `/maria-qa` → Validate before commit
4. **Help**: Use `/help` → Framework assistance

**Remember**: In Claude Code CLI, YOU must detect context and invoke agents. There is no background daemon.
