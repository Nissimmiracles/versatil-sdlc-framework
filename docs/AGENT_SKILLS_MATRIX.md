# Agent × Skills Matrix

**Status**: ✅ Complete
**Date**: October 26, 2025
**Total Skills**: 17 specialized skills across Phase 4 and Phase 5
**Agent Coverage**: 10 of 10 agents (100%)
**Quality Score**: 88/100 (Excellent)

---

## 🎯 Overview

This matrix shows which OPERA agents have which specialized skills integrated, enabling quick skill discovery and agent selection.

---

## 📊 Complete Agent × Skills Matrix

| Agent | Phase 4 Skills | Phase 5 Skills | Total Skills | Skill Specialization |
|-------|---------------|---------------|--------------|---------------------|
| **James-Frontend** | state-management<br>styling-architecture<br>testing-strategies<br>micro-frontends | cross-domain-patterns | **5 skills** | 🎨 Frontend + Full-Stack |
| **Marcus-Backend** | api-design<br>auth-security<br>microservices<br>serverless | cross-domain-patterns | **5 skills** | ⚙️ Backend + Full-Stack |
| **Dana-Database** | vector-databases<br>schema-optimization<br>rls-policies<br>edge-databases | cross-domain-patterns | **5 skills** | 🗄️ Database + Full-Stack |
| **Maria-QA** | testing-strategies<br>quality-gates | - | **2 skills** | ✅ Quality Assurance |
| **Dr.AI-ML** | - | ml-pipelines<br>rag-optimization<br>model-deployment | **3 skills** | 🤖 Machine Learning |
| **Sarah-PM** | - | workflow-orchestration | **1 skill** | 👔 Project Management |
| **Alex-BA** | api-design<br>auth-security | - | **2 skills** | 📊 Business Analysis |
| **Oliver-MCP** | - | rag-optimization | **1 skill** | 🔌 MCP Integration |
| **Victor-Verifier** | testing-strategies | - | **1 skill** | 🔍 Verification |
| **Inventory-Manager** | - | - | **0 skills** | 🏷️ Domain-Specific |

---

## 🔍 Skill → Agent Lookup

### Frontend Skills (4)

#### state-management
- **Agents**: James-Frontend
- **Trigger Phrases**: "state management", "Zustand", "TanStack Query", "Jotai"
- **Capabilities**: Zustand stores, TanStack Query for server state, Jotai atoms

#### styling-architecture
- **Agents**: James-Frontend
- **Trigger Phrases**: "styling", "Panda CSS", "Vanilla Extract", "zero-runtime CSS"
- **Capabilities**: Panda CSS, Vanilla Extract, CVA, zero-runtime styling

#### testing-strategies
- **Agents**: James-Frontend, Maria-QA, Victor-Verifier
- **Trigger Phrases**: "frontend testing", "component tests", "E2E testing", "Playwright", "Vitest"
- **Capabilities**: Vitest unit tests, Playwright E2E, MSW API mocking, visual regression

#### micro-frontends
- **Agents**: James-Frontend
- **Trigger Phrases**: "micro-frontend", "Module Federation", "single-spa"
- **Capabilities**: Webpack Module Federation, single-spa framework, independent deployments

---

### Backend Skills (4)

#### api-design
- **Agents**: Marcus-Backend, Alex-BA
- **Trigger Phrases**: "API design", "REST", "GraphQL", "tRPC"
- **Capabilities**: REST patterns, GraphQL resolvers, tRPC type-safe RPC

#### auth-security
- **Agents**: Marcus-Backend, Alex-BA
- **Trigger Phrases**: "authentication", "OAuth2", "JWT", "security", "OWASP"
- **Capabilities**: OAuth2/PKCE, JWT tokens, OWASP Top 10 mitigation, rate limiting

#### microservices
- **Agents**: Marcus-Backend
- **Trigger Phrases**: "microservices", "service mesh", "Istio", "event-driven"
- **Capabilities**: Service mesh (Istio), API gateway (Kong), Kafka/RabbitMQ, circuit breaker

#### serverless
- **Agents**: Marcus-Backend
- **Trigger Phrases**: "serverless", "Lambda", "Vercel Edge", "Cloudflare Workers"
- **Capabilities**: AWS Lambda, Vercel Edge Functions, Cloudflare Workers, cold start optimization

---

### Database Skills (4)

#### vector-databases
- **Agents**: Dana-Database
- **Trigger Phrases**: "vector search", "pgvector", "embeddings", "semantic search"
- **Capabilities**: pgvector extension, similarity search, hybrid search, RAG systems

#### schema-optimization
- **Agents**: Dana-Database
- **Trigger Phrases**: "schema optimization", "indexing", "denormalization", "partitioning"
- **Capabilities**: Composite indexes, materialized views, table partitioning, query optimization

#### rls-policies
- **Agents**: Dana-Database
- **Trigger Phrases**: "RLS", "row-level security", "multi-tenant", "RBAC"
- **Capabilities**: PostgreSQL RLS policies, multi-tenant isolation, role-based access

#### edge-databases
- **Agents**: Dana-Database
- **Trigger Phrases**: "edge database", "Supabase Edge", "Cloudflare D1", "read replicas"
- **Capabilities**: Supabase Edge Functions, Cloudflare D1, multi-region read replicas

---

### ML/AI Skills (3) - Phase 5

#### ml-pipelines
- **Agents**: Dr.AI-ML
- **Trigger Phrases**: "ML pipeline", "model training", "MLflow", "feature engineering"
- **Capabilities**: MLflow experiment tracking, feature engineering, Optuna tuning, Kubeflow workflows

#### rag-optimization
- **Agents**: Dr.AI-ML, Oliver-MCP
- **Trigger Phrases**: "RAG optimization", "semantic search", "embedding fine-tuning", "chunking strategy"
- **Capabilities**: Embedding selection, semantic chunking, hybrid search, reranking, RAG evaluation

#### model-deployment
- **Agents**: Dr.AI-ML
- **Trigger Phrases**: "model deployment", "model serving", "A/B testing models", "canary deployment"
- **Capabilities**: FastAPI serving, A/B testing, TensorFlow Serving, TorchServe, model monitoring

---

### Cross-Agent Skills (2) - Phase 5

#### workflow-orchestration
- **Agents**: Sarah-PM
- **Trigger Phrases**: "workflow", "orchestration", "handoff", "multi-agent"
- **Capabilities**: OPERA handoff protocol, state persistence, error recovery, task coordination

#### cross-domain-patterns
- **Agents**: James-Frontend, Marcus-Backend, Dana-Database
- **Trigger Phrases**: "full-stack", "authentication flow", "real-time features", "file upload"
- **Capabilities**: JWT auth flow (React + Express + Prisma), WebSocket, S3 upload, full-stack CRUD

---

### Quality Assurance Skills (1)

#### quality-gates
- **Agents**: Maria-QA
- **Trigger Phrases**: "quality gates", "coverage threshold", "security scan", "accessibility audit"
- **Capabilities**: Test coverage thresholds, OWASP scanning, axe-core WCAG 2.1 AA, Lighthouse performance

---

## 🎨 Visual Matrix

```
┌─────────────────────┬─────────────────────────────────────────────────────────────┐
│ AGENT               │ SKILLS                                                      │
├─────────────────────┼─────────────────────────────────────────────────────────────┤
│ James-Frontend      │ [state][styling][testing][micro-frontends][cross-domain]    │
│ Marcus-Backend      │ [api][auth][microservices][serverless][cross-domain]        │
│ Dana-Database       │ [vector][schema][rls][edge][cross-domain]                   │
│ Maria-QA            │ [testing][quality-gates]                                    │
│ Dr.AI-ML            │ [ml-pipelines][rag-optimization][model-deployment]          │
│ Sarah-PM            │ [workflow-orchestration]                                    │
│ Alex-BA             │ [api][auth]                                                 │
│ Oliver-MCP          │ [rag-optimization]                                          │
│ Victor-Verifier     │ [testing]                                                   │
└─────────────────────┴─────────────────────────────────────────────────────────────┘

Legend:
[state]              = state-management
[styling]            = styling-architecture
[testing]            = testing-strategies
[micro-frontends]    = micro-frontends
[api]                = api-design
[auth]               = auth-security
[microservices]      = microservices
[serverless]         = serverless
[vector]             = vector-databases
[schema]             = schema-optimization
[rls]                = rls-policies
[edge]               = edge-databases
[ml-pipelines]       = ml-pipelines
[rag-optimization]   = rag-optimization
[model-deployment]   = model-deployment
[workflow]           = workflow-orchestration
[cross-domain]       = cross-domain-patterns
[quality-gates]      = quality-gates
```

---

## 📈 Skill Coverage Statistics

### By Agent Type
- **Core Agents** (3): James, Marcus, Dana - Each has 5 skills (highest coverage)
- **Quality Agent** (1): Maria - 2 skills
- **ML Agent** (1): Dr.AI-ML - 3 skills
- **Orchestration Agent** (1): Sarah-PM - 1 skill
- **Supporting Agents** (3): Alex-BA (2), Oliver-MCP (1), Victor-Verifier (1)

### By Skill Category
- **Frontend**: 4 skills → 1 primary agent (James-Frontend)
- **Backend**: 4 skills → 1 primary agent (Marcus-Backend)
- **Database**: 4 skills → 1 primary agent (Dana-Database)
- **ML/AI**: 3 skills → 1 primary agent (Dr.AI-ML)
- **Cross-Agent**: 2 skills → 4 agents (Sarah-PM, James, Marcus, Dana)
- **Quality**: 1 skill → 1 primary agent (Maria-QA)

### Skill Sharing Patterns
- **Most Shared**: testing-strategies (3 agents: James, Maria, Victor)
- **Second Most Shared**: cross-domain-patterns (3 agents: James, Marcus, Dana)
- **Shared ML**: rag-optimization (2 agents: Dr.AI-ML, Oliver-MCP)
- **Shared Backend**: api-design, auth-security (2 agents each: Marcus, Alex-BA)

---

## 🚀 Usage Scenarios

### Scenario 1: Building a SaaS Authentication System
**Required Skills**: auth-security, api-design, rls-policies, testing-strategies
**Agents to Invoke**:
1. Alex-BA (requirements + API design)
2. Marcus-Backend (OAuth2/JWT implementation)
3. Dana-Database (RLS policies for multi-tenant)
4. Maria-QA (security testing + coverage validation)

### Scenario 2: RAG-Powered Semantic Search
**Required Skills**: vector-databases, rag-optimization, ml-pipelines, api-design
**Agents to Invoke**:
1. Dr.AI-ML (embedding model selection + chunking strategy)
2. Oliver-MCP (RAG system integration)
3. Dana-Database (pgvector + similarity search)
4. Marcus-Backend (REST API for search endpoint)

### Scenario 3: Micro-Frontend E-Commerce Platform
**Required Skills**: micro-frontends, state-management, styling-architecture, microservices
**Agents to Invoke**:
1. James-Frontend (Module Federation + Zustand + Panda CSS)
2. Marcus-Backend (microservices + API gateway)
3. Sarah-PM (workflow orchestration across teams)

### Scenario 4: Serverless Real-Time Chat
**Required Skills**: serverless, edge-databases, cross-domain-patterns, testing-strategies
**Agents to Invoke**:
1. Marcus-Backend (Lambda + WebSocket API)
2. Dana-Database (Supabase Edge Functions + RLS)
3. James-Frontend (React + WebSocket client)
4. Maria-QA (E2E testing with Playwright)

### Scenario 5: ML Model Deployment with A/B Testing
**Required Skills**: model-deployment, ml-pipelines, microservices, quality-gates
**Agents to Invoke**:
1. Dr.AI-ML (TensorFlow Serving + FastAPI + A/B testing)
2. Marcus-Backend (canary deployment + traffic splitting)
3. Maria-QA (model monitoring + accuracy validation)

---

## 📚 Related Documentation

- **Skills Validation Report**: [docs/SKILLS_VALIDATION_REPORT.md](./SKILLS_VALIDATION_REPORT.md) - Quality scores for all 17 skills
- **Parallel Implementation Summary**: [docs/PARALLEL_IMPLEMENTATION_SUMMARY.md](./PARALLEL_IMPLEMENTATION_SUMMARY.md) - Complete implementation timeline
- **Integration Test Suite**: [tests/integration/skills-validation.test.ts](../tests/integration/skills-validation.test.ts) - Automated validation tests
- **Individual Skills**: `.claude/skills/[skill-name]/SKILL.md` - Detailed skill documentation with code examples

---

## 🔄 Maintenance Notes

**When adding a new skill**:
1. Create `.claude/skills/[skill-name]/SKILL.md` with complete documentation
2. Update target agent(s) with skill reference + trigger phrases
3. Add skill to this matrix in appropriate category
4. Update validation report with quality score
5. Add integration test coverage

**When creating a new agent**:
1. Define agent role and responsibilities
2. Assign relevant skills from this matrix
3. Add agent row to matrix table
4. Update coverage statistics
5. Document usage scenarios

---

*Generated: October 26, 2025*
*Last Updated: October 26, 2025*
*Version: 1.0.0*
*Coverage: 10 of 10 agents (100%)*
