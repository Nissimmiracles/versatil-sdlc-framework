# VERSATIL Framework Architecture Map: Parallelization vs Specialization

**Last Updated:** 2025-10-28
**Version:** v7.9.0
**Status:** Authoritative Reference

---

## Executive Summary

The VERSATIL framework uses **two distinct architectural patterns** that are often confused:

1. **Parallelization** → Native Claude Code SDK Task tool (NO sub-agents needed)
2. **Specialization** → 10 sub-agents for framework-specific expertise

**Key Insight:** You do NOT need sub-agents for parallel execution. The SDK handles concurrency natively.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLELIZATION LAYER                         │
│              (Native SDK Task Tool - Concurrency)                │
│                                                                  │
│   Single Message with Multiple Task Calls:                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │  Maria-QA   │  │ James-Front │  │ Marcus-Back │           │
│   │  Testing    │  │  UI Review  │  │ API Audit   │           │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│          │                 │                 │                   │
│          └─────────────────┴─────────────────┘                  │
│                   Promise.all([...])                            │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                   No sub-agents needed for
                   parallel execution!
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                    SPECIALIZATION LAYER                          │
│              (Sub-Agents - Framework Expertise)                  │
│                                                                  │
│   Marcus-Backend (Coordinator)                                   │
│   ├── marcus-node-backend     (Express/Fastify)                 │
│   ├── marcus-python-backend   (FastAPI/Django)                  │
│   ├── marcus-rails-backend    (Ruby on Rails)                   │
│   ├── marcus-go-backend       (Gin/Echo)                        │
│   └── marcus-java-backend     (Spring Boot)                     │
│                                                                  │
│   James-Frontend (Coordinator)                                   │
│   ├── james-react-frontend    (React 18+ hooks)                 │
│   ├── james-vue-frontend      (Vue 3 Composition API)           │
│   ├── james-nextjs-frontend   (Next.js 14+ App Router)          │
│   ├── james-angular-frontend  (Angular 17+ standalone)          │
│   └── james-svelte-frontend   (SvelteKit)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Parallelization Architecture (Native SDK)

### What It Is

**Concurrent execution of multiple agents** using the Claude Code SDK's `Task` tool.

### How It Works

**Single message with multiple Task tool calls:**

```typescript
// ✅ CORRECT: Parallel execution without sub-agents
await Promise.all([
  Task({
    subagent_type: "Maria-QA",
    description: "Test coverage validation",
    prompt: "Validate test coverage for src/auth.test.ts. Ensure 80%+ coverage."
  }),
  Task({
    subagent_type: "James-Frontend",
    description: "UI accessibility audit",
    prompt: "Run WCAG 2.1 AA audit on LoginForm.tsx component."
  }),
  Task({
    subagent_type: "Marcus-Backend",
    description: "API security scan",
    prompt: "Validate OWASP Top 10 compliance for /api/auth routes."
  })
]);
```

**Result:** All 3 agents execute concurrently, no sub-agents involved.

### Implementation Files

| File | Purpose | Key Function |
|------|---------|--------------|
| [parallel-task-manager.ts](../../src/orchestration/parallel-task-manager.ts) | Intelligent task batching, dependency detection, resource management | `executeParallel()` (line 210) |
| [proactive-agent-orchestrator.ts](../../src/orchestration/proactive-agent-orchestrator.ts) | File change → multi-agent activation | `activateAgents()` (line 294) |

### Key Code Pattern

**From [parallel-task-manager.ts:210-269](../../src/orchestration/parallel-task-manager.ts#L210-L269):**

```typescript
async executeParallel(taskIds: string[]): Promise<Map<string, TaskExecution>> {
  const executionPlan = await this.createExecutionPlan(taskIds);
  const results = new Map<string, TaskExecution>();

  // Execute tasks in parallel batches based on dependencies
  for (const batch of executionPlan.batches) {
    const batchPromises = batch.map(taskId => this.executeTask(taskId));
    const batchResults = await Promise.allSettled(batchPromises);

    // Handle results...
  }

  return results;
}
```

**From [proactive-agent-orchestrator.ts:294-318](../../src/orchestration/proactive-agent-orchestrator.ts#L294-L318):**

```typescript
private async activateAgents(agentIds: string[], filePath: string): Promise<void> {
  console.log(`🤖 Activating agents: ${agentIds.join(', ')} for ${filePath}`);

  // Create activation contexts
  const activationPromises = agentIds.map(agentId => {
    return this.activateAgent(agentId, filePath);
  });

  // Execute in parallel (Rule 1: Parallel Task Execution)
  try {
    const results = await Promise.all(activationPromises);
    this.emit('agents-completed', { agentIds, filePath, results });
  } catch (error) {
    this.emit('agents-failed', { agentIds, filePath, error });
  }
}
```

### When to Use

✅ **Use parallel execution when:**
- Multiple agents can work on **independent tasks** (no file conflicts)
- Tasks have **no dependencies** (frontend doesn't wait for backend)
- Resource contention is **low** (different files, different domains)

❌ **DO NOT use parallel execution when:**
- Tasks have **sequential dependencies** (database → backend → frontend)
- Exclusive resources needed (build system, test environment)
- SDLC phase violations (testing before implementation complete)

### Performance Characteristics

| Metric | Value |
|--------|-------|
| Max parallel tasks | 10 (configurable via `maxParallelTasks`) |
| Max concurrent tasks per agent | 3 |
| Collision detection overhead | < 50ms |
| Resource reallocation | < 100ms |
| Dependency resolution | O(n) where n = task count |

---

## 2. Specialization Architecture (Sub-Agents)

### What It Is

**Framework-specific expertise** through technology-specialized sub-agents. Sub-agents are NOT for parallelization - they provide deep knowledge of specific tech stacks.

### The 10 Sub-Agents

#### Marcus-Backend (5 sub-agents)

**File:** [.claude/agents/marcus-backend.md](../../.claude/agents/marcus-backend.md#L34-L39)

```yaml
sub_agents:
  - marcus-node-backend      # Node.js/Express/Fastify
  - marcus-python-backend    # FastAPI/Django/Flask
  - marcus-rails-backend     # Ruby on Rails
  - marcus-go-backend        # Go/Gin/Echo
  - marcus-java-backend      # Spring Boot/Quarkus
```

**Specializations:**
- **marcus-node**: Express/Fastify routing, async/await patterns, NPM ecosystem
- **marcus-python**: FastAPI async patterns, Django ORM, Pydantic validation
- **marcus-rails**: Rails conventions, Active Record, Hotwire/Turbo
- **marcus-go**: Gin/Echo routers, goroutines, gRPC microservices
- **marcus-java**: Spring Boot annotations, JPA repositories, Spring Security

#### James-Frontend (5 sub-agents)

**File:** [.claude/agents/james-frontend.md](../../.claude/agents/james-frontend.md#L35-L40)

```yaml
sub_agents:
  - james-react-frontend     # React 18+ with hooks
  - james-vue-frontend       # Vue 3 Composition API
  - james-nextjs-frontend    # Next.js 14+ App Router
  - james-angular-frontend   # Angular 17+ standalone
  - james-svelte-frontend    # Svelte/SvelteKit
```

**Specializations:**
- **james-react**: Hooks optimization, Server Components, React 18+ features
- **james-vue**: Composition API, Pinia state, Vite optimization
- **james-nextjs**: App Router, Server Actions, SSR/ISR strategies
- **james-angular**: Standalone components, signals, RxJS patterns, NgRx
- **james-svelte**: Compiler optimization, stores, reactive declarations

### Auto-Routing Logic

#### Detection Triggers

**From [marcus-backend.md:85-105](../../.claude/agents/marcus-backend.md#L85-L105):**

| Framework | Detection Patterns |
|-----------|-------------------|
| **Node.js** | package.json, .js/.ts files, require/import statements, express/fastify patterns |
| **Python** | requirements.txt, .py files, from fastapi/django/flask import, async def patterns |
| **Rails** | Gemfile, .rb files, Rails.application, ActiveRecord patterns, config/routes.rb |
| **Go** | go.mod, .go files, package main, gin.Engine/echo.Echo patterns |
| **Java** | pom.xml/build.gradle, .java files, @SpringBootApplication, @RestController |

**From [james-frontend.md:76-81](../../.claude/agents/james-frontend.md#L76-L81):**

| Framework | Detection Patterns |
|-----------|-------------------|
| **React** | import from 'react', useState, useEffect, .tsx/.jsx files, package.json with "react" |
| **Vue** | .vue files, Composition API patterns, <script setup>, package.json with "vue" |
| **Next.js** | app/ directory, Server Components, next.config.js, @next/* imports |
| **Angular** | .component.ts, standalone: true, @angular/* imports, angular.json |
| **Svelte** | .svelte files, $: reactive statements, svelte.config.js, SvelteKit patterns |

#### Routing Confidence Levels

**From [marcus-backend.md:91-105](../../.claude/agents/marcus-backend.md#L91-L105):**

```
High (0.8-1.0)     → Auto-route to sub-agent with notification
                     Example: "Routing to marcus-node-backend for Express.js API optimization..."

Medium (0.5-0.79)  → Suggest sub-agent, ask for confirmation
                     Example: "Detected Node.js patterns. Shall I engage marcus-node-backend?"

Low (<0.5)         → Use general backend knowledge, no sub-agent routing
```

### When to Route (Specialization Needed)

**From [marcus-backend.md:124-129](../../.claude/agents/marcus-backend.md#L124-L129):**

✅ **Route to sub-agent when:**
- Framework-specific API design (Express middleware vs Django views)
- Language-specific performance optimization (Go goroutines vs Node async/await)
- ORM/database integration (SQLAlchemy vs Active Record vs Prisma)
- Framework security patterns (Rails CSRF tokens vs Spring Security)
- Build/deployment configuration (npm vs pip vs go build)

### When NOT to Route (General Knowledge Sufficient)

**From [marcus-backend.md:133-137](../../.claude/agents/marcus-backend.md#L133-L137):**

❌ **Stay as parent agent (Marcus/James) when:**
- General API design principles (REST vs GraphQL architecture)
- Cross-language security (OWASP Top 10 concepts)
- Database design (schema normalization, indexing strategies)
- Microservices architecture patterns
- Multi-language projects (provide language-agnostic guidance)

### Implementation Example

**Routing Example - Node.js API:**

```typescript
// User edits: src/api/users.ts
// File contains: import express from 'express'

// Detection:
const confidence = detectFramework('src/api/users.ts');
// Result: { framework: 'express', confidence: 0.93 }

// Action: Auto-route to marcus-node-backend
console.log("Engaging marcus-node-backend for Express.js API implementation with OWASP security patterns...");

// Sub-agent applies Node.js-specific patterns:
// - Express middleware chaining
// - async/await error handling
// - helmet.js security headers
// - rate limiting with express-rate-limit
```

**Routing Example - FastAPI Endpoint:**

```python
# User edits: app/api/auth.py
# File contains: from fastapi import FastAPI, Depends

# Detection:
confidence = detect_framework('app/api/auth.py')
# Result: { framework: 'fastapi', confidence: 0.91 }

# Action: Auto-route to marcus-python-backend
print("Routing to marcus-python-backend for async FastAPI implementation with Pydantic validation...")

# Sub-agent applies Python-specific patterns:
# - FastAPI dependency injection with Depends()
# - Pydantic models for request/response validation
# - SQLAlchemy async ORM patterns
# - Python type hints for FastAPI auto-documentation
```

### Sub-Agent Code Implementation

**File:** [sub-agent-selector.ts](../../src/agents/core/sub-agent-selector.ts)

```typescript
export class SubAgentSelector {
  detectFramework(filePath: string, content: string): FrameworkDetection {
    const detectors: FrameworkDetector[] = [
      this.detectReact,
      this.detectVue,
      this.detectNextJS,
      this.detectAngular,
      this.detectSvelte,
      this.detectExpress,
      this.detectFastAPI,
      this.detectRails,
      this.detectGo,
      this.detectSpringBoot
    ];

    const results = detectors.map(detector => detector(filePath, content))
      .filter(result => result.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence);

    return results[0] || { framework: 'unknown', confidence: 0 };
  }

  selectSubAgent(parentAgent: string, framework: FrameworkDetection): string | null {
    if (framework.confidence < 0.5) return null;

    const subAgentMap: Record<string, Record<string, string>> = {
      'marcus-backend': {
        'express': 'marcus-node-backend',
        'fastapi': 'marcus-python-backend',
        'rails': 'marcus-rails-backend',
        'gin': 'marcus-go-backend',
        'spring': 'marcus-java-backend'
      },
      'james-frontend': {
        'react': 'james-react-frontend',
        'vue': 'james-vue-frontend',
        'nextjs': 'james-nextjs-frontend',
        'angular': 'james-angular-frontend',
        'svelte': 'james-svelte-frontend'
      }
    };

    return subAgentMap[parentAgent]?.[framework.framework] || null;
  }
}
```

---

## 3. Decision Matrix

### Question 1: Do I need multiple agents working concurrently?

```
YES → Use Parallelization (Native SDK Task Tool)
      ├─ Call multiple Task tools in one message
      ├─ Use Promise.all() for concurrent execution
      └─ NO sub-agents needed

NO  → Continue to Question 2
```

**Example Use Cases:**
- Maria-QA tests + James-Frontend UI audit + Marcus-Backend API scan (all parallel)
- Dana-Database migration + Marcus-Backend schema validation (parallel)
- Alex-BA requirements analysis + Sarah-PM planning (parallel)

### Question 2: Does the work require framework-specific expertise?

```
YES → Use Specialization (Sub-Agent Routing)
      ├─ Parent agent detects framework patterns
      ├─ Auto-routes to appropriate sub-agent
      └─ Sub-agent applies framework-specific patterns

NO  → Use parent agent's general knowledge
```

**Example Use Cases:**
- Express.js middleware optimization → marcus-node-backend
- React hooks performance → james-react-frontend
- FastAPI Pydantic models → marcus-python-backend
- Next.js Server Components → james-nextjs-frontend

### Combined Example: Both Parallelization + Specialization

```typescript
// Scenario: Full-stack feature review

// 1. PARALLELIZATION: Multiple agents in parallel
await Promise.all([
  Task({
    subagent_type: "James-Frontend",
    description: "React component review",
    prompt: "Review LoginForm.tsx for React 18+ best practices."
    // James detects React patterns (0.95 confidence)
    // SPECIALIZATION: Auto-routes to james-react-frontend
    // james-react-frontend applies hooks optimization, memoization patterns
  }),
  Task({
    subagent_type: "Marcus-Backend",
    description: "FastAPI endpoint audit",
    prompt: "Audit /api/auth endpoint for OWASP compliance."
    // Marcus detects FastAPI patterns (0.91 confidence)
    // SPECIALIZATION: Auto-routes to marcus-python-backend
    // marcus-python-backend validates Pydantic models, async patterns
  }),
  Task({
    subagent_type: "Maria-QA",
    description: "E2E test coverage",
    prompt: "Validate end-to-end test coverage for login flow."
    // Maria uses Playwright/Cypress (no sub-agents needed)
  })
]);

// Result: 3 agents run in parallel (SDK native concurrency)
//         2 of them auto-route to sub-agents (framework specialization)
```

---

## 4. Performance Comparison

### Parallelization (No Sub-Agents)

| Metric | Value |
|--------|-------|
| Agents invoked concurrently | 3-10 typical |
| Execution time (3 agents) | ~30-60 seconds (parallel) |
| Execution time (sequential) | ~90-180 seconds (3x slower) |
| Speedup | **3x faster** with parallelization |
| Overhead | < 50ms (collision detection) |

### Specialization (Sub-Agents)

| Metric | Value |
|--------|-------|
| Framework detection | < 100ms |
| Sub-agent routing decision | < 50ms |
| Accuracy improvement | **40% higher** (framework-specific patterns) |
| Code quality | **96% vs 75%** (measured via code reviews) |
| Rework reduction | **88% less** (5% vs 40% without sub-agents) |

**Source:** [THREE_LAYER_CONTEXT_FRAMEWORK_IMPACT.md](../../docs/releases/v6.6.0/THREE_LAYER_CONTEXT_FRAMEWORK_IMPACT.md)

---

## 5. Common Misconceptions

### ❌ Misconception 1: "Sub-agents are for parallel execution"

**FALSE.** Sub-agents are for **specialization**, not parallelization.

**Correct:**
- Parallelization → Use multiple `Task` calls in one message
- Specialization → Parent agent auto-routes to sub-agent

### ❌ Misconception 2: "I need to manually invoke sub-agents"

**FALSE.** Sub-agents are **auto-invoked** by parent agents based on detection patterns.

**Correct:**
- User invokes: `Task({ subagent_type: "Marcus-Backend", ... })`
- Marcus detects FastAPI (confidence: 0.91)
- Marcus auto-routes to `marcus-python-backend`
- User never directly invokes sub-agents

### ❌ Misconception 3: "More sub-agents = better parallelization"

**FALSE.** Sub-agents do NOT improve parallelization.

**Correct:**
- Parallelization = multiple parent agents concurrently
- Sub-agents = one parent agent delegates to specialized child

### ❌ Misconception 4: "I can run sub-agents in parallel"

**PARTIALLY TRUE.** You can run **multiple parent agents** in parallel (each may route to their own sub-agent), but sub-agents themselves execute sequentially after detection.

**Example:**
```typescript
// ✅ CORRECT: Parallel parent agents (each routes to sub-agent internally)
await Promise.all([
  Task({ subagent_type: "James-Frontend", ... }), // Routes to james-react-frontend
  Task({ subagent_type: "Marcus-Backend", ... })  // Routes to marcus-python-backend
]);
// Result: 2 parent agents run in parallel, each with their own sub-agent

// ❌ WRONG: Trying to invoke sub-agents directly
await Promise.all([
  Task({ subagent_type: "james-react-frontend", ... }),  // Sub-agents not in SDK registry
  Task({ subagent_type: "marcus-python-backend", ... })  // Will fail
]);
```

---

## 6. Common Anti-Patterns

### ❌ Anti-Pattern 1: Using Sub-Agents for Parallelization

**Problem**: Trying to invoke sub-agents directly for concurrent execution

**Wrong**:
```typescript
// ❌ INCORRECT: Trying to invoke sub-agents directly
await Promise.all([
  Task({ subagent_type: "james-react-frontend", ... }),  // Sub-agent not in SDK registry
  Task({ subagent_type: "marcus-python-backend", ... })  // Will fail
]);
```

**Correct**:
```typescript
// ✅ CORRECT: Invoke parent agents, they auto-route to sub-agents
await Promise.all([
  Task({ subagent_type: "James-Frontend", ... }),  // Parent agent
  Task({ subagent_type: "Marcus-Backend", ... })   // Parent agent
]);
// Parent agents detect frameworks and route to sub-agents internally
```

**Why It Fails**:
- Sub-agents are not registered in SDK's agent registry
- SDK only recognizes parent agents (Marcus-Backend, James-Frontend, etc.)
- Sub-agent routing happens AFTER parent agent activation

---

### ❌ Anti-Pattern 2: Parallelizing Dependent Tasks

**Problem**: Running tasks in parallel that depend on each other

**Wrong**:
```typescript
// ❌ INCORRECT: Database migration + backend deployment in parallel
await Promise.all([
  Task({
    subagent_type: "Dana-Database",
    prompt: "Run database migration: add users table"
  }),
  Task({
    subagent_type: "Marcus-Backend",
    prompt: "Deploy API that uses users table"
    // FAILS: users table doesn't exist yet!
  })
]);
```

**Correct**:
```typescript
// ✅ CORRECT: Run sequentially with dependencies
await Task({
  subagent_type: "Dana-Database",
  prompt: "Run database migration: add users table"
});

// Wait for migration to complete, THEN deploy
await Task({
  subagent_type: "Marcus-Backend",
  prompt: "Deploy API that uses users table"
});
```

**Why It Fails**:
- Database migration must complete before backend can use new schema
- Parallel execution doesn't guarantee order
- Results in deployment failures

---

### ❌ Anti-Pattern 3: Ignoring Resource Conflicts

**Problem**: Multiple agents editing the same file concurrently

**Wrong**:
```typescript
// ❌ INCORRECT: Two agents editing same file
await Promise.all([
  Task({
    subagent_type: "James-Frontend",
    prompt: "Add login form to App.tsx"
  }),
  Task({
    subagent_type: "Maria-QA",
    prompt: "Add test coverage to App.tsx"
  })
]);
// Collision: Both agents modify App.tsx simultaneously!
```

**Correct**:
```typescript
// ✅ CORRECT: Sequential execution for same file
await Task({
  subagent_type: "James-Frontend",
  prompt: "Add login form to App.tsx"
});

await Task({
  subagent_type: "Maria-QA",
  prompt: "Add test coverage to App.tsx"
});

// OR: Work on different files in parallel
await Promise.all([
  Task({
    subagent_type: "James-Frontend",
    prompt: "Add login form to LoginForm.tsx"  // Different file
  }),
  Task({
    subagent_type: "Maria-QA",
    prompt: "Add test coverage to App.test.tsx"  // Different file
  })
]);
```

**Why It Fails**:
- File conflicts cause merge issues
- Last write wins, potentially losing work
- Use `ParallelTaskManager` collision detection to prevent this

---

### ❌ Anti-Pattern 4: Assuming Sub-Agents Improve Parallelization

**Problem**: Thinking more sub-agents = better parallel performance

**Wrong Assumption**:
```
"I have 10 sub-agents, so I can run 10 tasks in parallel faster!"
```

**Reality**:
```
Sub-agents are for SPECIALIZATION, not PARALLELIZATION.

Parallelization is handled by the SDK Task tool natively.
Sub-agents execute AFTER parent agent activation (sequential routing step).
```

**Correct Understanding**:
```typescript
// Parallelization = Multiple parent agents
await Promise.all([
  Task({ subagent_type: "James-Frontend", ... }),
  Task({ subagent_type: "Marcus-Backend", ... }),
  Task({ subagent_type: "Maria-QA", ... })
]);
// 3 parent agents run in parallel
// Each MAY route to sub-agent internally (but that's sequential)

// Result: 3x speedup from parallelization
//         + 96% accuracy from sub-agent framework expertise
```

---

### ❌ Anti-Pattern 5: Not Using Parallelization When Possible

**Problem**: Running independent tasks sequentially

**Wrong**:
```typescript
// ❌ INEFFICIENT: Sequential execution for independent tasks
await Task({ subagent_type: "Maria-QA", prompt: "Test coverage" });
await Task({ subagent_type: "James-Frontend", prompt: "UI audit" });
await Task({ subagent_type: "Marcus-Backend", prompt: "API scan" });
// Total time: ~90-120 seconds (sequential)
```

**Correct**:
```typescript
// ✅ EFFICIENT: Parallel execution
await Promise.all([
  Task({ subagent_type: "Maria-QA", prompt: "Test coverage" }),
  Task({ subagent_type: "James-Frontend", prompt: "UI audit" }),
  Task({ subagent_type: "Marcus-Backend", prompt: "API scan" })
]);
// Total time: ~30-40 seconds (3x faster!)
```

**Why It's Bad**:
- Wastes time on independent tasks
- No dependencies, no file conflicts → perfect for parallelization
- Simple fix with huge performance gain

---

## 7. Visual Architecture Diagrams

### Diagram 1: Parallelization Flow

**Shows**: How SDK Task tool executes 3 agents concurrently without sub-agents

![Parallelization Flow](diagrams/parallelization-flow.mmd)

**Key Points**:
- Single message with 3 Task calls
- `Promise.all()` executes concurrently
- No sub-agents needed
- **3x faster** than sequential execution (~30-40s vs ~90-120s)

---

### Diagram 2: Sub-Agent Routing Flow

**Shows**: How Marcus-Backend detects FastAPI and auto-routes to marcus-python-backend

![Sub-Agent Routing Flow](diagrams/subagent-routing-flow.mmd)

**Key Points**:
- Framework detection via pattern matching
- Confidence threshold: ≥ 0.8 for auto-routing
- FastAPI-specific patterns applied
- **96% accuracy** vs 75% with general knowledge

---

## 7. Implementation Checklist

### For Parallelization (No Sub-Agents)

- [ ] Identify independent tasks (no file conflicts, no dependencies)
- [ ] Create single message with multiple `Task` calls
- [ ] Use `Promise.all()` to execute concurrently
- [ ] Verify no resource conflicts (same files, exclusive resources)
- [ ] Monitor via [ParallelTaskManager](../../src/orchestration/parallel-task-manager.ts)

### For Specialization (Sub-Agent Routing)

- [ ] Invoke parent agent (Marcus-Backend or James-Frontend)
- [ ] Parent agent detects framework patterns automatically
- [ ] Parent agent routes to sub-agent if confidence ≥ 0.8
- [ ] Sub-agent applies framework-specific patterns
- [ ] Verify routing decision via logs

### For Combined Use Cases

- [ ] Invoke multiple parent agents in parallel (parallelization)
- [ ] Each parent agent detects framework and routes (specialization)
- [ ] Monitor parallel execution summary
- [ ] Verify framework-specific patterns applied

---

## 8. Code References

### Parallelization Implementation

| File | Lines | Purpose |
|------|-------|---------|
| [parallel-task-manager.ts](../../src/orchestration/parallel-task-manager.ts) | 1-1050 | Intelligent task batching, collision detection, resource management |
| [parallel-task-manager.ts](../../src/orchestration/parallel-task-manager.ts#L210-L269) | 210-269 | `executeParallel()` - Batch execution with Promise.allSettled |
| [proactive-agent-orchestrator.ts](../../src/orchestration/proactive-agent-orchestrator.ts) | 1-489 | File change → multi-agent activation |
| [proactive-agent-orchestrator.ts](../../src/orchestration/proactive-agent-orchestrator.ts#L294-L318) | 294-318 | `activateAgents()` - Parallel activation with Promise.all |

### Specialization Implementation

| File | Lines | Purpose |
|------|-------|---------|
| [marcus-backend.md](../../.claude/agents/marcus-backend.md) | 1-330 | Marcus-Backend agent definition + 5 sub-agents |
| [marcus-backend.md](../../.claude/agents/marcus-backend.md#L34-L39) | 34-39 | Sub-agent registry (Node/Python/Rails/Go/Java) |
| [marcus-backend.md](../../.claude/agents/marcus-backend.md#L85-L105) | 85-105 | Framework detection triggers |
| [james-frontend.md](../../.claude/agents/james-frontend.md) | 1-887 | James-Frontend agent definition + 5 sub-agents |
| [james-frontend.md](../../.claude/agents/james-frontend.md#L35-L40) | 35-40 | Sub-agent registry (React/Vue/Next/Angular/Svelte) |
| [james-frontend.md](../../.claude/agents/james-frontend.md#L76-L81) | 76-81 | Framework detection triggers |
| [sub-agent-selector.ts](../../src/agents/core/sub-agent-selector.ts) | 1-200 | Framework detection + sub-agent routing logic |
| [tech-stack-detector.ts](../../src/agents/core/tech-stack-detector.ts) | 1-300 | Pattern matching for framework detection |

---

## 8. FAQ

### Q1: Can I create my own sub-agents for other frameworks?

**Yes.** Follow the template at [.claude/skills/code-generators/agent-creator/assets/agent-template.md](../../.claude/skills/code-generators/agent-creator/assets/agent-template.md).

**Steps:**
1. Create sub-agent definition in `.claude/agents/sub-agents/[parent]/[name].md`
2. Add detection patterns to parent agent's `systemPrompt`
3. Update sub-agent registry in parent agent's frontmatter
4. Test framework detection with confidence scoring

### Q2: How does collision detection work for parallel execution?

**Answer:** See [parallel-task-manager.ts:274-332](../../src/orchestration/parallel-task-manager.ts#L274-L332).

**Collision Types:**
- Resource conflict (exclusive file access)
- Dependency cycle
- SDLC phase violation (testing before implementation)
- Agent overload (max 3 concurrent tasks per agent)
- Build system conflict

**Resolution:**
- **SERIALIZE**: Wait for conflicting tasks
- **RESCHEDULE**: Delay execution
- **RESOURCE_ALLOCATION**: Adjust resource allocation
- **AGENT_REASSIGNMENT**: Route to less loaded agent
- **TASK_SPLITTING**: Break into smaller parallel chunks

### Q3: What's the max number of parallel agents?

**Answer:** 10 concurrent agents (configurable via `maxParallelTasks` in [parallel-task-manager.ts:165](../../src/orchestration/parallel-task-manager.ts#L165)).

### Q4: Do sub-agents work with RAG patterns?

**Yes.** Sub-agents inherit RAG context from parent agents. For example, marcus-python-backend has access to Python-specific RAG patterns (FastAPI auth, Pydantic validation, SQLAlchemy optimization).

### Q5: Can I disable sub-agent routing?

**Yes.** Set confidence threshold to 1.0 in parent agent's systemPrompt to disable auto-routing. Parent agents will use general knowledge instead.

---

## 9. Related Documentation

- [VERSATIL_ARCHITECTURE.md](../VERSATIL_ARCHITECTURE.md) - Complete framework architecture
- [AGENT_TRIGGERS.md](../../.claude/AGENT_TRIGGERS.md) - Auto-activation patterns for all agents
- [SUB_AGENT_ENHANCEMENT_COMPLETE_PLAN.md](../archive/completions/SUB_AGENT_ENHANCEMENT_COMPLETE_PLAN.md) - Sub-agent implementation history
- [THREE_LAYER_CONTEXT_FRAMEWORK_IMPACT.md](../releases/v6.6.0/THREE_LAYER_CONTEXT_FRAMEWORK_IMPACT.md) - Sub-agent performance metrics
- [parallel-task-manager.ts](../../src/orchestration/parallel-task-manager.ts) - Parallelization implementation
- [sub-agent-selector.ts](../../src/agents/core/sub-agent-selector.ts) - Sub-agent routing logic

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2025-10-28 | Initial comprehensive architecture map |

---

**Bottom Line:**

- **Need parallel work?** → Use multiple `Task` calls (NO sub-agents)
- **Need framework expertise?** → Parent agents auto-route to sub-agents
- **Need both?** → Parallel parent agents, each with their own sub-agent routing

**Sub-agents are for specialization, not parallelization.**
