# VERSATIL Architecture Diagrams

Visual guide to understanding VERSATIL's architecture, agent coordination, and workflow patterns.

---

## 🏛️ System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph "User Layer"
        U[User/Developer]
        CLI[CLI Interface]
        MCP[MCP Servers]
    end

    subgraph "OPERA Framework"
        direction TB
        SARAH[Sarah-PM<br/>Orchestrator]

        subgraph "Core Agents"
            ALEX[Alex-BA]
            JAMES[James-Frontend]
            MARCUS[Marcus-Backend]
            DANA[Dana-Database]
            MARIA[Maria-QA]
            DR[Dr.AI-ML]
        end

        subgraph "Infrastructure Agents"
            OLIVER[Oliver-MCP]
            IRIS[Iris-Guardian]
            VICTOR[Victor-Verifier]
            FEEDBACK[Feedback-Codifier]
        end

        subgraph "Skills (44+)"
            S1[testing-strategies]
            S2[schema-optimization]
            S3[auth-security]
            S4[accessibility-audit]
            SN[...]
        end
    end

    subgraph "Data Layer"
        RAG[(RAG Memory<br/>Public + Private)]
        VECTOR[(Vector DB<br/>pgvector)]
        META[(Metadata<br/>Firestore/Supabase)]
    end

    subgraph "Wave 4 Engine"
        WAVE[Wave Executor]
        COLLISION[Collision Detector]
        CHECKPOINT[Checkpoint Manager]
        DEPS[Dependency Resolver]
    end

    U -->|Commands| CLI
    U -->|Claude Desktop| MCP
    CLI --> SARAH
    MCP --> OLIVER
    OLIVER --> SARAH

    SARAH -->|Coordinates| ALEX
    SARAH -->|Coordinates| JAMES
    SARAH -->|Coordinates| MARCUS
    SARAH -->|Coordinates| DANA
    SARAH -->|Coordinates| MARIA
    SARAH -->|Coordinates| DR

    SARAH -->|Uses| WAVE
    WAVE -->|Prevents Conflicts| COLLISION
    WAVE -->|State Management| CHECKPOINT
    WAVE -->|Orders Tasks| DEPS

    ALEX -->|Queries| RAG
    DR -->|Manages| VECTOR
    IRIS -->|Monitors| SARAH
    VICTOR -->|Verifies| MARIA

    JAMES -.->|Invokes| S4
    MARCUS -.->|Invokes| S3
    DANA -.->|Invokes| S2
    MARIA -.->|Invokes| S1

    RAG -->|Stores| META
    VECTOR -->|Stores| META
```

---

## 🌊 Wave 4 Coordination Flow

### Parallel Execution Pattern

```mermaid
sequenceDiagram
    participant User
    participant Sarah as Sarah-PM
    participant Wave as Wave Executor
    participant Dana as Dana-Database
    participant Marcus as Marcus-Backend
    participant James as James-Frontend
    participant Maria as Maria-QA

    User->>Sarah: /work "Add authentication"
    Sarah->>Wave: Generate execution plan

    Note over Wave: Wave 1: Requirements (Serial)
    Wave->>Sarah: Assign Wave 1 tasks
    Sarah->>Sarah: Create project structure
    Sarah-->>Wave: Wave 1 complete

    Note over Wave: Wave 2: Development (Parallel)
    Wave->>Sarah: Assign Wave 2 tasks

    par Parallel Execution
        Sarah->>Dana: Design schema
        Dana->>Dana: users table + RLS
        Dana-->>Sarah: Schema ready

        Sarah->>Marcus: Build API (mock DB)
        Marcus->>Marcus: Auth endpoints
        Marcus-->>Sarah: API ready

        Sarah->>James: Build UI (mock API)
        James->>James: Login/Register forms
        James-->>Sarah: UI ready
    end

    Note over Wave: Wave 3: Integration (Serial)
    Wave->>Sarah: Connect components
    Sarah->>Marcus: Connect real DB
    Sarah->>James: Connect real API
    Sarah-->>Wave: Wave 3 complete

    Note over Wave: Wave 4: Quality (Parallel)
    Wave->>Maria: Run QA validation

    par Quality Checks
        Maria->>Maria: E2E tests
        Maria->>Maria: Coverage check
        Maria->>Maria: WCAG audit
    end

    Maria-->>User: ✅ Feature complete
```

---

## 🔄 OPERA Methodology Flow

```mermaid
graph LR
    O[Observe<br/>User Request] --> P[Plan<br/>Sarah-PM]
    P --> E[Execute<br/>Multi-Agent]
    E --> R[Review<br/>Maria-QA]
    R --> A[Adapt<br/>Feedback]
    A -.->|Learn| O

    style O fill:#e1f5ff
    style P fill:#fff3cd
    style E fill:#d4edda
    style R fill:#f8d7da
    style A fill:#e2e3e5
```

### Phase Transitions

```mermaid
stateDiagram-v2
    [*] --> Observe: User request
    Observe --> Plan: Requirements clear
    Plan --> Execute: Plan approved
    Execute --> Review: Implementation done
    Review --> Adapt: Tests pass
    Review --> Execute: Tests fail (retry)
    Adapt --> [*]: Feature complete
    Adapt --> RAG: Store patterns

    note right of Execute
        Wave 4 parallel
        execution happens here
    end note

    note right of Adapt
        Patterns stored
        for future reuse
    end note
```

---

## 👥 Agent Interaction Patterns

### Pattern 1: Full-Stack Feature

```mermaid
graph TD
    START[User Request] --> ALEX[Alex-BA<br/>Requirements]
    ALEX --> SARAH[Sarah-PM<br/>Coordinate]

    SARAH --> WAVE1{Wave 2<br/>Parallel}

    WAVE1 -->|Parallel| DANA[Dana<br/>Schema]
    WAVE1 -->|Parallel| MARCUS[Marcus<br/>API]
    WAVE1 -->|Parallel| JAMES[James<br/>UI]

    DANA --> INTEGRATE{Wave 3<br/>Integration}
    MARCUS --> INTEGRATE
    JAMES --> INTEGRATE

    INTEGRATE --> MARIA[Maria-QA<br/>Validation]
    MARIA --> VICTOR[Victor<br/>Verify]
    VICTOR --> END[✅ Complete]

    style WAVE1 fill:#d4edda
    style INTEGRATE fill:#fff3cd
    style END fill:#28a745,color:#fff
```

### Pattern 2: Emergency Bug Fix

```mermaid
sequenceDiagram
    participant User
    participant Iris as Iris-Guardian
    participant Sarah as Sarah-PM
    participant Dana
    participant Marcus
    participant James
    participant Maria

    Note over Iris: Continuous monitoring
    Iris->>Iris: Detect error spike
    Iris->>Sarah: Create TODO
    Sarah->>User: 🚨 Bug detected

    User->>Sarah: /work [bug-todo]

    par Parallel Investigation
        Sarah->>Dana: Check DB queries
        Sarah->>Marcus: Check API logs
        Sarah->>James: Check UI errors
    end

    Dana-->>Sarah: ✅ DB queries OK
    Marcus-->>Sarah: ❌ Found bug (null check)
    James-->>Sarah: ✅ UI code OK

    Sarah->>Marcus: Fix the bug
    Marcus->>Marcus: Add null safety
    Marcus-->>Sarah: Fixed

    Sarah->>Maria: Run regression tests
    Maria->>Maria: All tests pass ✅
    Maria-->>User: Bug fixed & verified
```

---

## 🧠 RAG Memory Architecture

```mermaid
graph TB
    subgraph "Input Sources"
        GIT[Git History]
        DOCS[Documentation]
        CODE[Codebase]
        FEEDBACK[User Feedback]
    end

    subgraph "Processing"
        CHUNK[Chunking<br/>1000 chars, 200 overlap]
        EMBED[Embedding<br/>OpenAI Ada-002]
    end

    subgraph "Storage (Dual-Mode)"
        PUBLIC[(Public RAG<br/>Framework Patterns<br/>1,247 patterns)]
        PRIVATE[(Private RAG<br/>Project Patterns<br/>Your proprietary code)]
    end

    subgraph "Retrieval"
        QUERY[User Query]
        VECTOR[Vector Search<br/>Cosine similarity]
        RERANK[Reranking<br/>Cross-encoder]
        RESULTS[Top K Results]
    end

    GIT --> CHUNK
    DOCS --> CHUNK
    CODE --> CHUNK
    FEEDBACK --> CHUNK

    CHUNK --> EMBED
    EMBED -->|Framework patterns| PUBLIC
    EMBED -->|Your patterns| PRIVATE

    QUERY --> VECTOR
    VECTOR -->|Search| PUBLIC
    VECTOR -->|Search| PRIVATE
    PUBLIC --> RERANK
    PRIVATE --> RERANK
    RERANK --> RESULTS

    style PUBLIC fill:#90EE90
    style PRIVATE fill:#FFB6C1
```

---

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Request Flow"
        REQ[Incoming Request]
        RATE[Rate Limiter<br/>5 req/min]
        AUTH[Auth Middleware<br/>JWT Verification]
        VALIDATE[Input Validation<br/>Zod Schema]
    end

    subgraph "Application Layer"
        API[API Handler]
        BIZ[Business Logic]
    end

    subgraph "Data Layer"
        RLS[Row-Level Security]
        DB[(PostgreSQL)]
    end

    REQ --> RATE
    RATE -->|✅ Under limit| AUTH
    RATE -->|❌ Exceeded| REJECT1[429 Too Many Requests]

    AUTH -->|✅ Valid token| VALIDATE
    AUTH -->|❌ Invalid| REJECT2[401 Unauthorized]

    VALIDATE -->|✅ Valid input| API
    VALIDATE -->|❌ Invalid| REJECT3[400 Bad Request]

    API --> BIZ
    BIZ --> RLS
    RLS -->|✅ Has permission| DB
    RLS -->|❌ No permission| REJECT4[403 Forbidden]

    DB --> RESPONSE[200 OK + Data]

    style RATE fill:#fff3cd
    style AUTH fill:#d4edda
    style VALIDATE fill:#cfe2ff
    style RLS fill:#f8d7da
```

---

## 📦 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Developer]
        LOCAL[Local Environment<br/>pnpm dev]
    end

    subgraph "CI/CD Pipeline"
        GIT[Git Push]
        ACTIONS[GitHub Actions]
        BUILD[Build & Test]
        MARIA[Maria-QA<br/>Quality Gates]
    end

    subgraph "Staging"
        STAGING_API[Staging API]
        STAGING_DB[(Staging DB)]
    end

    subgraph "Production"
        EDGE[Edge Functions<br/>Vercel/Cloudflare]
        API[Production API]
        DB[(Production DB<br/>Supabase)]
        CDN[CDN<br/>Static Assets]
    end

    DEV --> LOCAL
    LOCAL -->|git push| GIT
    GIT --> ACTIONS
    ACTIONS --> BUILD
    BUILD --> MARIA

    MARIA -->|✅ Pass| STAGING_API
    MARIA -->|❌ Fail| REJECT[Deployment Blocked]

    STAGING_API --> STAGING_DB
    STAGING_API -->|Manual Approval| EDGE
    STAGING_API -->|Manual Approval| API

    EDGE --> CDN
    API --> DB

    style MARIA fill:#ffc107
    style REJECT fill:#dc3545,color:#fff
```

---

## 🎓 Learning & Compounding

```mermaid
graph LR
    F1[Feature 1<br/>Auth System<br/>125 min] --> LEARN1[/learn]
    LEARN1 --> RAG[(RAG Memory)]

    RAG -->|Retrieve patterns| F2[Feature 2<br/>Admin Panel<br/>75 min<br/>40% faster]

    F2 --> LEARN2[/learn]
    LEARN2 --> RAG

    RAG -->|More patterns| F3[Feature 3<br/>User Profile<br/>60 min<br/>52% faster]

    F3 --> LEARN3[/learn]
    LEARN3 --> RAG

    RAG -->|Even more patterns| F5[Feature 5<br/>Dashboard<br/>50 min<br/>60% faster]

    style F1 fill:#e3f2fd
    style F2 fill:#c8e6c9
    style F3 fill:#fff9c4
    style F5 fill:#c5e1a5
    style RAG fill:#f8bbd0
```

---

## 🔄 Collision Detection System

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> RequestLock: Agent requests resource
    RequestLock --> CheckAvailability: Check if available

    CheckAvailability --> AcquireLock: Resource free
    CheckAvailability --> Queue: Resource locked

    AcquireLock --> Working: Agent working
    Queue --> WaitForRelease: Wait in queue

    Working --> ReleaseLock: Agent done
    ReleaseLock --> NotifyQueued: Notify next in queue

    NotifyQueued --> AcquireLock: Assign to queued agent
    WaitForRelease --> AcquireLock: Lock released

    ReleaseLock --> Idle: No queue

    note right of Queue
        Multiple agents
        can queue for
        same resource
    end note

    note right of Working
        Timeout: 5 minutes
        Auto-release on timeout
    end note
```

---

## 🛡️ Guardian Monitoring Flow

```mermaid
sequenceDiagram
    participant System
    participant Iris as Iris-Guardian
    participant Sarah as Sarah-PM
    participant Agent as Specialist Agent
    participant User

    loop Every 5 minutes
        Iris->>System: Health check
        System-->>Iris: Status report

        alt Issue Detected
            Iris->>Iris: Analyze issue severity

            alt Critical
                Iris->>Sarah: Create high-priority TODO
                Sarah->>User: 🚨 Critical issue
                Sarah->>Agent: Auto-assign specialist
                Agent->>Agent: Auto-remediation
            else Warning
                Iris->>Sarah: Create low-priority TODO
                Sarah->>User: ⚠️ Warning
            else Info
                Iris->>System: Log event
            end
        else No Issues
            Iris->>System: Update health metrics
        end
    end
```

---

## 📊 Metrics & Observability

```mermaid
graph TB
    subgraph "Data Collection"
        AGENTS[Agent Activity]
        TESTS[Test Results]
        BUILDS[Build Status]
        PERF[Performance Metrics]
    end

    subgraph "Processing"
        AGGREGATE[Aggregation]
        ANALYZE[Analysis]
    end

    subgraph "Storage"
        TIMESERIES[(Time-Series DB)]
        LOGS[(Log Storage)]
    end

    subgraph "Visualization"
        DASH[Dashboard<br/>Real-time]
        REPORTS[Reports<br/>Weekly/Monthly]
        ALERTS[Alerts<br/>Slack/Email]
    end

    AGENTS --> AGGREGATE
    TESTS --> AGGREGATE
    BUILDS --> AGGREGATE
    PERF --> AGGREGATE

    AGGREGATE --> ANALYZE
    ANALYZE --> TIMESERIES
    ANALYZE --> LOGS

    TIMESERIES --> DASH
    TIMESERIES --> REPORTS
    LOGS --> ALERTS

    style DASH fill:#d4edda
    style ALERTS fill:#f8d7da
```

---

## 🔗 Integration Architecture

```mermaid
graph TB
    subgraph "VERSATIL Core"
        CORE[VERSATIL Framework]
    end

    subgraph "Development Tools"
        CURSOR[Cursor IDE]
        CLAUDE[Claude Desktop]
        VSCODE[VS Code]
    end

    subgraph "MCP Servers (12)"
        MCP1[GitHub MCP]
        MCP2[Playwright MCP]
        MCP3[Supabase MCP]
        MCP4[Vertex AI MCP]
        MCPN[...]
    end

    subgraph "External Services"
        GH[GitHub]
        SUPA[Supabase]
        VERTEX[Vertex AI]
        OPENAI[OpenAI]
    end

    CURSOR -->|MCP Protocol| CORE
    CLAUDE -->|MCP Protocol| CORE
    VSCODE -->|Extension| CORE

    CORE -->|Oliver-MCP| MCP1
    CORE -->|Oliver-MCP| MCP2
    CORE -->|Oliver-MCP| MCP3
    CORE -->|Oliver-MCP| MCP4

    MCP1 --> GH
    MCP3 --> SUPA
    MCP4 --> VERTEX
    CORE --> OPENAI

    style CORE fill:#90EE90
    style CURSOR fill:#cfe2ff
    style CLAUDE fill:#f8d7da
```

---

**Next**: [Wave 4 Coordination](./features/wave-4-coordination.md) | [Agent Overview](./agents/agents-overview.md)
