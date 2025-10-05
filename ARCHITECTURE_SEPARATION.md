# 🏗️ VERSATIL Architecture: Clean Separation of Concerns

## Overview

To maintain a robust and scalable framework, VERSATIL v1.2.0 enforces strict separation between:
1. **SDLC Framework Core** - The methodology and orchestration
2. **Environment Context** - The specific project implementation
3. **MCP Integrations** - External tool connections

---

## 🎯 Architecture Principles

### 1. **Layered Architecture**

```
┌─────────────────────────────────────────────────┐
│            Application Layer                     │
│         (User Projects & Implementations)        │
├─────────────────────────────────────────────────┤
│            Integration Layer                     │
│              (MCP Connectors)                    │
├─────────────────────────────────────────────────┤
│           Orchestration Layer                    │
│         (Opera & Agent Registry)                │
├─────────────────────────────────────────────────┤
│            Intelligence Layer                    │
│          (RAG Memory & Learning)                 │
├─────────────────────────────────────────────────┤
│              Core SDLC Layer                     │
│        (Methodology & Frameworks)                │
└─────────────────────────────────────────────────┘
```

### 2. **Strict Boundaries**

Each layer can only communicate with adjacent layers through well-defined interfaces.

---

## 📋 Separation Rules

### Rule 1: SDLC Core Independence
```typescript
// ❌ WRONG: SDLC coupled with environment
class SDLCPhase {
  execute() {
    const tech = environmentScanner.getTech(); // Direct coupling
    if (tech === 'react') { /* ... */ }
  }
}

// ✅ CORRECT: SDLC receives context via interface
class SDLCPhase {
  execute(context: SDLCContext) {
    // SDLC logic independent of specific tech
    const strategy = this.selectStrategy(context.constraints);
  }
}
```

### Rule 2: Environment Context Abstraction
```typescript
// ❌ WRONG: Environment aware of SDLC phases
class EnvironmentScanner {
  adaptToSDLC() {
    if (this.inTestingPhase()) { /* ... */ } // Knows about SDLC
  }
}

// ✅ CORRECT: Environment provides data only
class EnvironmentScanner {
  getContext(): ProjectContext {
    return {
      technology: { /* ... */ },
      structure: { /* ... */ }
      // Pure data, no SDLC knowledge
    };
  }
}
```

### Rule 3: MCP Tool Isolation
```typescript
// ❌ WRONG: Direct MCP usage in agents
class DeveloperAgent {
  async develop() {
    await githubMCP.createPR(); // Direct dependency
  }
}

// ✅ CORRECT: MCP accessed through abstraction
class DeveloperAgent {
  constructor(private tools: ToolRegistry) {}
  
  async develop() {
    const vcs = await this.tools.get('version-control');
    await vcs.createPullRequest(); // Abstract interface
  }
}
```

### Rule 4: Opera Orchestration Neutrality
```typescript
// ❌ WRONG: Opera knows specific implementations
class OperaOrchestrator {
  planGoal(goal: Goal) {
    if (project.usesReact) {
      return new ReactPlan(); // Coupled to React
    }
  }
}

// ✅ CORRECT: Opera uses strategies
class OperaOrchestrator {
  planGoal(goal: Goal, context: Context) {
    const strategy = this.strategySelector.select(context);
    return strategy.createPlan(goal);
  }
}
```

### Rule 5: RAG Memory Categorization
```typescript
// ❌ WRONG: Mixed concerns in memory
{
  content: {
    sdlcPhase: 'testing',
    reactVersion: '18.0',
    testFramework: 'jest'
  }
}

// ✅ CORRECT: Separated memory domains
// SDLC Memory
{
  domain: 'sdlc',
  content: {
    phase: 'testing',
    patterns: ['unit-first', 'coverage-driven']
  }
}

// Environment Memory
{
  domain: 'environment',
  content: {
    technology: { framework: 'react', version: '18.0' }
  }
}
```

---

## 🔧 Implementation Structure

### Directory Organization
```
src/
├── core/               # SDLC Core (No env dependencies)
│   ├── sdlc/
│   ├── methodology/
│   └── patterns/
├── intelligence/       # Learning & Memory
│   ├── rag/
│   ├── learning/
│   └── analytics/
├── orchestration/      # Coordination
│   ├── opera/
│   ├── agents/
│   └── registry/
├── environment/        # Context Collection
│   ├── scanner/
│   ├── monitor/
│   └── analyzer/
├── integrations/       # External Tools
│   ├── mcp/
│   ├── adapters/
│   └── connectors/
└── application/        # User-facing APIs
    ├── cli/
    ├── api/
    └── ui/
```

### Interface Contracts

#### 1. Context Provider Interface
```typescript
interface IContextProvider {
  getContext(): Promise<Context>;
  subscribeToChanges(callback: (changes: Change[]) => void): void;
}

// Environment implements this
class EnvironmentScanner implements IContextProvider { }
// But could be swapped for other providers
class MockContextProvider implements IContextProvider { }
```

#### 2. Tool Abstraction Interface
```typescript
interface ITool {
  id: string;
  capabilities: Capability[];
  execute(action: Action): Promise<Result>;
}

// MCPs implement this
class GitHubMCPAdapter implements ITool { }
class SupabaseMCPAdapter implements ITool { }
```

#### 3. Memory Domain Interface
```typescript
interface IMemoryDomain {
  domain: 'sdlc' | 'environment' | 'integration';
  store(memory: Memory): Promise<string>;
  query(query: Query): Promise<Memory[]>;
}
```

---

## 🚦 Communication Flow

### Correct Data Flow
```
User Request
    ↓
Application Layer (parses request)
    ↓
Orchestration (Opera plans)
    ↓
Context Request → Environment Scanner
    ↓              ↓
    ←  Context Data
    ↓
Strategy Selection (based on context)
    ↓
Agent Activation
    ↓
Tool Request → Integration Layer → MCP
    ↓              ↓                   ↓
    ←  Abstract Result ←────────────────
    ↓
Memory Storage (categorized by domain)
```

### Prohibited Flows
- ❌ SDLC Core → Environment Scanner (direct)
- ❌ Agents → MCPs (direct)
- ❌ Environment → SDLC Phases (direct)
- ❌ MCPs → Core Logic (direct)

---

## 📊 Benefits of Separation

### 1. **Testability**
- Each layer can be tested independently
- Mock implementations easy to create
- No environment setup needed for core tests

### 2. **Flexibility**
- Swap implementations without changing core
- Add new MCPs without touching SDLC
- Support multiple environments simultaneously

### 3. **Maintainability**
- Clear boundaries reduce coupling
- Changes isolated to specific layers
- Easier to understand and modify

### 4. **Scalability**
- Add new tools without core changes
- Support multiple projects simultaneously
- Distribute layers across services

---

## 🔍 Validation Checklist

Before committing code, ensure:

- [ ] No imports cross layer boundaries
- [ ] All external dependencies go through interfaces
- [ ] Memory domains are properly categorized
- [ ] Context data is pure (no behavior)
- [ ] Tools are accessed via registry
- [ ] SDLC logic has no environment specifics
- [ ] Environment has no SDLC knowledge
- [ ] MCPs are wrapped in adapters

---

## 🛡️ Enforcement Mechanisms

### 1. **Linting Rules**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '../environment',
            importNames: ['*'],
            message: 'Core cannot import from environment'
          }
        ]
      }
    ]
  }
};
```

### 2. **TypeScript Project References**
```json
// tsconfig.json
{
  "references": [
    { "path": "./src/core" },
    { "path": "./src/environment" },
    { "path": "./src/integrations" }
  ],
  "files": []
}
```

### 3. **Dependency Injection**
```typescript
// All cross-layer dependencies injected
class OperaOrchestrator {
  constructor(
    private contextProvider: IContextProvider,
    private toolRegistry: IToolRegistry,
    private memoryStore: IMemoryStore
  ) {}
}
```

---

## 🚀 Migration Guide

For existing code violating these principles:

1. **Identify violations** using the validation checklist
2. **Extract interfaces** for cross-layer communication
3. **Create adapters** for external dependencies
4. **Inject dependencies** instead of direct imports
5. **Categorize memories** by domain
6. **Test in isolation** to verify separation

---

This architecture ensures VERSATIL remains flexible, maintainable, and scalable while supporting any development environment or toolset.
