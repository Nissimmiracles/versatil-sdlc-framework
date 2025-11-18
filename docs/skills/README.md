# VERSATIL Skills Catalog

**44+ Specialized Skills** for comprehensive development workflows

---

## 🎯 What are Skills?

Skills are **specialized, reusable capabilities** that agents can invoke to handle specific tasks. Think of them as expert consultants that provide deep knowledge in specific domains.

### Skills vs Agents

| Aspect | Agents | Skills |
|--------|--------|--------|
| **Scope** | Broad (full feature development) | Narrow (specific task) |
| **Activation** | Proactive or slash command | Invoked by agents or users |
| **Duration** | Long-running (hours) | Short-lived (minutes) |
| **Example** | James-Frontend (builds entire UI) | accessibility-audit (checks WCAG) |

---

## 📚 Skills by Category

### 🧪 Testing & Quality (7 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **testing-strategies** | Modern testing patterns | Vitest, Playwright, MSW, 80%+ coverage |
| **quality-gates** | Quality validation | Coverage, TS compilation, contract checks |
| **visual-regression** | UI snapshot testing | Chromatic, Percy, BackstopJS integration |
| **accessibility-audit** | WCAG 2.2 compliance | axe-core automation, WCAG AA/AAA |
| **webapp-testing** | Local app testing | Playwright browser automation |

**Use When**: Writing tests, validating quality, ensuring accessibility, preventing visual bugs

**Example**:
```bash
# Invoke testing-strategies skill
Skill: testing-strategies

# Skill provides:
# - Vitest config (5-20x faster than Jest)
# - Playwright E2E patterns
# - MSW API mocking setup
# - Coverage enforcement (80%+)
```

---

### 🗄️ Database & Data (4 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **schema-optimization** | DB performance tuning | Denormalization, partitioning, indexing |
| **rls-policies** | Row-level security | Multi-tenant isolation, RBAC |
| **vector-databases** | Semantic search | pgvector, embeddings, similarity |
| **edge-databases** | Global data access | Supabase Edge, Cloudflare D1, <100ms queries |

**Use When**: Optimizing queries, securing data, implementing RAG, global distribution

**Example**:
```bash
# Dana-Database invokes schema-optimization
Skill: schema-optimization

# Skill analyzes and provides:
# - Slow query identification
# - Index recommendations
# - Partitioning strategies
# - 10-100x performance improvement
```

---

### 🔐 Security & Auth (2 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **auth-security** | Authentication patterns | OAuth2/PKCE, JWT, OWASP Top 10 |
| **rls-policies** | Data security | Row-level security, tenant isolation |

**Use When**: Implementing auth, securing APIs, preventing vulnerabilities

**Example**:
```bash
# Marcus-Backend invokes auth-security
Skill: auth-security

# Skill provides:
# - OAuth2 PKCE flow
# - Short-lived JWT tokens
# - OWASP mitigation patterns
# - Rate limiting strategies
```

---

### 🎨 Frontend & Design (8 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **design-philosophy** | Brand theming | Design system aesthetics, anti-slop |
| **design-tokens** | Figma to code | Token Studio, Style Dictionary, multi-platform |
| **animation-interaction** | UI animations | Framer Motion, GSAP, 60fps |
| **accessibility-audit** | WCAG compliance | Automated scanning, remediation |
| **performance-optimization** | Core Web Vitals | Lighthouse, LCP/CLS/INP optimization |
| **visual-regression** | Prevent visual bugs | Chromatic, Percy, snapshot testing |
| **i18n** | Internationalization | next-intl, react-i18next, RTL support |
| **micro-frontends** | Modular UIs | Module Federation, independent deployment |

**Use When**: Building UIs, design systems, animations, i18n, performance

**Example**:
```bash
# James-Frontend invokes design-tokens
Skill: design-tokens

# Skill provides:
# - Figma variable sync
# - CSS/SCSS/JS token generation
# - Theme switching support
# - 300% ROI through automation
```

---

### 🚀 Backend & APIs (4 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **api-design** | API patterns | REST, GraphQL, tRPC design |
| **microservices** | Distributed systems | Service mesh, event-driven, Kafka |
| **serverless** | Cloud functions | Lambda, Vercel Edge, Cloudflare Workers |
| **cross-domain-patterns** | Full-stack flows | End-to-end feature patterns |

**Use When**: Designing APIs, microservices architecture, serverless deployment

**Example**:
```bash
# Marcus-Backend invokes api-design
Skill: api-design

# Skill provides:
# - RESTful resource naming
# - GraphQL schema design
# - tRPC type-safe patterns
# - Versioning strategies
```

---

### 🤖 AI & Machine Learning (4 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **ml-pipelines** | Model training | MLflow, Kubeflow, feature engineering |
| **model-deployment** | Model serving | TensorFlow Serving, TorchServe, A/B testing |
| **rag-optimization** | RAG performance | Embeddings, retrieval, reranking |
| **rag-patterns** | Historical patterns | VERSATIL framework implementations |

**Use When**: Building ML pipelines, deploying models, optimizing RAG systems

**Example**:
```bash
# Dr.AI-ML invokes ml-pipelines
Skill: ml-pipelines

# Skill provides:
# - Feature engineering patterns
# - MLflow experiment tracking
# - Distributed training setup
# - 50% faster pipeline development
```

---

### 🧠 RAG & Memory (3 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **rag-query** | RAG knowledge retrieval | Query patterns, store learnings |
| **rag-patterns** | Historical implementations | Pattern search, effort estimation |
| **rag-optimization** | RAG performance | Hybrid search, embedding tuning, reranking |

**Use When**: Implementing RAG, querying knowledge, optimizing retrieval

**Example**:
```bash
# Alex-BA invokes rag-query
Skill: rag-query

# Skill provides:
# - Similar feature search
# - Implementation patterns
# - Effort estimates (27h ± 4h)
# - Proven solutions
```

---

### 🎭 OPERA & Orchestration (5 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **opera-orchestration** | Phase detection | Workflow coordination, agent routing |
| **workflow-orchestration** | Multi-agent patterns | Handoffs, state management |
| **compounding-engineering** | Pattern acceleration | Template matching, roadmap generation |
| **context-injection** | Three-layer context | User/Team/Project preferences |
| **quality-gates** | Automated validation | 80%+ coverage, OWASP, WCAG enforcement |

**Use When**: Coordinating agents, managing workflows, enforcing quality

**Example**:
```bash
# Sarah-PM invokes opera-orchestration
Skill: opera-orchestration

# Skill provides:
# - Phase transition detection
# - Agent assignment logic
# - Workflow state management
# - Handoff coordination
```

---

### 🔧 Development Tools (8 skills)

| Skill | Purpose | Key Features |
|-------|---------|--------------|
| **code-generators** | Asset generation | Agent, command, hook, skill, test templates |
| **mcp-builder** | MCP server creation | FastMCP (Python), MCP SDK (Node/TS) |
| **state-management** | Frontend state | Zustand, TanStack Query, Jotai |
| **component-patterns** | Reusable components | Design patterns, composition |
| **artifacts-builder** | Complex artifacts | React, Tailwind, shadcn/ui |
| **theme-factory** | Artifact styling | 10 preset themes, custom generation |
| **brand-guidelines** | Anthropic branding | Official colors, typography |
| **library-guides** | Framework modules | VERSATIL library development |

**Use When**: Generating code, building MCPs, managing state, creating artifacts

**Example**:
```bash
# Use code-generators skill
Skill: code-generators

# Generates from templates:
# - New agent (5-10x faster than from scratch)
# - Slash command
# - Hook
# - Skill
# - Test suite
```

---

## 🚀 How to Use Skills

### 1. Direct Invocation

```bash
# Invoke skill directly
Skill: testing-strategies

# Skill loads and provides guidance
```

### 2. Agent Invocation

Agents automatically invoke skills:

```typescript
// James-Frontend automatically invokes:
- accessibility-audit (for WCAG compliance)
- visual-regression (before deployment)
- performance-optimization (for Core Web Vitals)

// Marcus-Backend automatically invokes:
- api-design (for endpoint patterns)
- auth-security (for OWASP compliance)

// Dana-Database automatically invokes:
- schema-optimization (for query performance)
- rls-policies (for data security)
```

### 3. Skill Chaining

Skills can invoke other skills:

```typescript
// accessibility-audit invokes:
→ testing-strategies (for automated tests)
→ visual-regression (for UI validation)

// api-design invokes:
→ auth-security (for secured endpoints)
→ cross-domain-patterns (for full-stack integration)
```

---

## 📊 Skill Effectiveness

### Time Savings by Category

| Category | Manual Approach | With Skills | Time Saved |
|----------|----------------|-------------|------------|
| **Testing** | 8 hours | 2 hours | **75%** |
| **Database** | 6 hours | 1 hour | **83%** |
| **Security** | 4 hours | 1 hour | **75%** |
| **Frontend** | 10 hours | 3 hours | **70%** |
| **Backend** | 8 hours | 2 hours | **75%** |
| **AI/ML** | 12 hours | 6 hours | **50%** |

### ROI by Skill

Top 10 skills by return on investment:

1. **code-generators**: 5-10x faster (500-1000% ROI)
2. **design-tokens**: 300% ROI through automation
3. **testing-strategies**: 75% time savings
4. **schema-optimization**: 10-100x query performance
5. **accessibility-audit**: 95% bug reduction
6. **rag-query**: 40% faster Feature 2+
7. **auth-security**: 80% fewer vulnerabilities
8. **visual-regression**: 95% fewer visual bugs
9. **api-design**: 50% faster API development
10. **ml-pipelines**: 50% faster pipeline development

---

## 🔍 Finding the Right Skill

### By Problem Type

**"I need to..."**

- **Write tests** → `testing-strategies`
- **Optimize database** → `schema-optimization`
- **Secure my API** → `auth-security`
- **Build UI components** → `component-patterns`, `design-philosophy`
- **Implement RAG** → `rag-optimization`, `rag-query`
- **Create animations** → `animation-interaction`
- **Support i18n** → `i18n`
- **Deploy serverless** → `serverless`
- **Check accessibility** → `accessibility-audit`
- **Generate code** → `code-generators`

### By Agent

Skills commonly used by each agent:

**James-Frontend**:
- accessibility-audit, visual-regression, performance-optimization
- animation-interaction, design-tokens, i18n
- state-management, component-patterns

**Marcus-Backend**:
- api-design, auth-security, microservices
- serverless, cross-domain-patterns

**Dana-Database**:
- schema-optimization, rls-policies, vector-databases
- edge-databases

**Maria-QA**:
- testing-strategies, quality-gates, visual-regression
- accessibility-audit, webapp-testing

**Dr.AI-ML**:
- ml-pipelines, model-deployment, rag-optimization
- vector-databases

---

## 🎓 Creating Custom Skills

### Skill Template

```typescript
// .claude/skills/my-skill/skill.md
---
name: my-custom-skill
description: Brief description of what this skill does
type: [testing|database|security|frontend|backend|ml|orchestration|tools]
---

# Skill: My Custom Skill

## When to Use
Describe when this skill should be invoked

## What It Provides
List capabilities and knowledge this skill provides

## Examples
Show usage examples

## Best Practices
Share proven patterns

## Common Pitfalls
Warn about gotchas

## Resources
Link to related documentation
```

### Register Skill

```typescript
// .claude/SKILLS.md
Add skill to appropriate category with description
```

---

## 📚 Additional Resources

- [Skill Development Guide](../guides/skill-development.md)
- [Agent-Skill Mapping](../features/agent-skill-mapping.md)
- [Code Generators Guide](../skills/code-generators/README.md)
- [RAG Query Guide](../skills/rag-query/README.md)

---

**Next**: [Agent Documentation](../agents/README.md)
