# VERSATIL SDLC Framework - Project Context

**Project Name**: VERSATIL SDLC Framework
**Domain**: Software Development Lifecycle Management / AI-Powered Development
**Status**: v6.6.0 - Production Ready
**Last Updated**: 2025-10-26

---

## 🎯 What This Project Does

VERSATIL is an **AI-powered SDLC framework** that implements the OPERA methodology (8 specialized AI agents) with Compounding Engineering principles. It makes development 40% faster by learning from historical implementations.

### Core Value Proposition
- **8 OPERA Agents**: Maria-QA, James-Frontend, Marcus-Backend, Alex-BA, Dana-Database, Dr.AI-ML, Sarah-PM, Oliver-MCP
- **Compounding Engineering**: Each feature makes the next 40% faster through RAG-powered pattern learning
- **Native Claude Code SDK**: Deep integration with Claude Code IDE
- **Four-Layer Context System**: User > Library > Project > Framework

---

## 🏗️ Architecture Decisions

### Why These Technologies?

#### TypeScript (100% codebase)
**Decision**: Pure TypeScript, no JavaScript mixed in
**Reason**: Type safety for complex agent orchestration
**Trade-off**: Requires compilation, but worth it for reliability

#### Jest 29.7.0 (NOT 30)
**Decision**: Stay on Jest 29.7.0, explicitly avoid Jest 30
**Reason**: Jest 30 has breaking changes with Native SDK
**Critical**: Use `ts-jest`, NEVER `babel-jest` (Native SDK uses ts-node)

#### GraphRAG > Vector Store > Local
**Decision**: Three-tier fallback chain for RAG
**Reason**: GraphRAG offline + free, Vector needs Supabase, Local always works
**Performance**: <500ms for pattern search, <50ms local fallback

#### Supabase for Storage
**Decision**: Supabase (PostgreSQL + pgvector + RLS)
**Reason**: Built-in vector search, RLS for privacy isolation
**Alternative Considered**: Neo4j for GraphRAG (optional, not required)

#### Dual Todo System
**Decision**: TodoWrite (ephemeral) + todos/*.md files (persistent)
**Reason**: TodoWrite for in-session UX, .md files survive restarts
**Pattern**: Always create both, never just one

---

## 🧩 Custom Abstractions & Patterns

### 1. ThreeTierHandoffBuilder
**What**: Contract-based coordination for Database → API → Frontend features
**Where**: `src/agents/contracts/three-tier-handoff.ts`
**Critical Rule**: Must have ≥1 work item, validates to ≥90 score
**Example**:
```typescript
const builder = new ThreeTierHandoffBuilder({ name: 'User Auth', ... });
builder.withDatabaseTier({ schemaDesign, migrations, rlsPolicies });
builder.withAPITier({ endpoints, securityPatterns });
builder.withFrontendTier({ components, accessibility });
const contract = await builder.buildAndValidate(); // Throws if score <90
```

### 2. PatternSearchService (RAG Singleton)
**What**: Singleton for searching historical implementations
**Where**: `src/rag/pattern-search.ts`
**Critical Rule**: Always use fallback chain (GraphRAG → Vector → Local)
**Example**:
```typescript
import { patternSearchService } from '@/rag/pattern-search.js';
const result = await patternSearchService.searchSimilarFeatures({
  description: 'Add JWT authentication',
  min_similarity: 0.75,
  limit: 5
});
// result.search_method: 'graphrag' | 'vector' | 'local' | 'none'
```

### 3. VERSATILLogger (NOT console.log)
**What**: Structured logging with context
**Where**: `src/utils/logger.js`
**Critical Rule**: NEVER use console.log in production code
**Example**:
```typescript
import { VERSATILLogger } from '@/utils/logger.js';
const logger = new VERSATILLogger();
logger.info('Agent activated', { agent: 'Maria-QA', file: 'auth.ts' }, 'agents');
logger.error('Validation failed', { error }, 'contracts');
```

### 4. Privacy Isolation (Four Layers)
**What**: User > Team > Project > Public access control
**Where**: `src/memory/`, `src/rag/`
**Critical Rule**: Always filter by user/team/project context
**Example**:
```typescript
// Memory and RAG automatically filter by:
// 1. User patterns (private to user)
// 2. Team patterns (shared with team)
// 3. Project patterns (shared with project contributors)
// 4. Framework patterns (public to all)
```

---

## ⚠️ Project-Specific Gotchas

### Gotcha 1: Babel Conflicts with Native SDK
**Problem**: If any @babel/* package exists, Jest auto-uses babel-jest → breaks Native SDK
**Solution**: Remove ALL Babel packages, use ts-jest with `babelConfig: false`
**Fixed In**: v6.6.0 (see commit fedc84e)
**Prevention**: Never install @babel/* packages, check package.json

### Gotcha 2: ThreeTierHandoffBuilder Requires Work Items
**Problem**: Contract validation fails with "must have at least one work item"
**Solution**: Always add work items to baseBuilder before buildAndValidate()
**Code**:
```typescript
if (workItems.length === 0) {
  workItems.push({
    id: `work-plan-${Date.now()}`,
    type: 'planning',
    description: 'Plan implementation',
    acceptanceCriteria: ['Requirements analyzed'],
    estimatedEffort: 1,
    priority: 'high'
  });
}
workItems.forEach(item => baseBuilder.addWorkItem(item));
```

### Gotcha 3: Hook Shebangs Must Use tsx (NOT ts-node)
**Problem**: Hooks with `#!/usr/bin/env ts-node` fail silently
**Solution**: Use `#!/usr/bin/env -S npx tsx` for all hooks
**Reason**: Native SDK uses tsx runtime, not ts-node
**Fixed In**: v6.6.0 (see commit eddbb0e)

### Gotcha 4: Empty Test Assertions (toBeLessThan vs toBeLessThanOrEqual)
**Problem**: `expect(90).toBeLessThan(90)` fails when score exactly hits threshold
**Solution**: Use `toBeLessThanOrEqual(90)` for boundary values
**Example**: `tests/unit/contracts/contract-validator.test.ts:678`

### Gotcha 5: Library Context Only Loads on Keyword Match
**Problem**: Asking "How do I test?" won't load testing/ context (too generic)
**Solution**: Mention library explicitly: "How do I test using the testing library?"
**Trigger**: Must match `\btesting\b` or `src/testing/` regex pattern

---

## 📐 Code Conventions (Project-Wide)

### File Organization
```
src/
├── agents/           # OPERA agents (8 core + 10 sub-agents)
├── orchestration/    # Multi-agent workflows
├── rag/              # Pattern search, GraphRAG
├── testing/          # Jest config, quality gates
├── mcp/              # MCP server integration
├── templates/        # Plan templates (YAML)
├── planning/         # Todo generation
├── intelligence/     # AI/ML decision engine
├── memory/           # Vector store, persistence
├── learning/         # Pattern codification
├── ui/               # React components
├── hooks/            # Native SDK hooks
├── context/          # CRG, CAG, priority resolution
├── validation/       # Schema validation
└── dashboard/        # Metrics visualization
```

### Naming Conventions
- **Agents**: `EnhancedMaria`, `MarcusBackend` (PascalCase with descriptive name)
- **Services**: `patternSearchService`, `templateMatcher` (camelCase singletons)
- **Files**: `kebab-case.ts` (e.g., `three-tier-handoff.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts` (never `*.e2e.ts` in Jest)

### Import Style
```typescript
// ✅ Good - Use .js extensions for ESM compatibility
import { BaseAgent } from '@/agents/core/base-agent.js';
import { patternSearchService } from '@/rag/pattern-search.js';

// ❌ Bad - Missing .js extension
import { BaseAgent } from '@/agents/core/base-agent';
```

### Async Patterns
- **Preferred**: `async/await` (100% of codebase)
- **Never**: Raw promises or callbacks

### Error Handling
```typescript
// ✅ Good - Log with context, then throw
try {
  const result = await service.execute();
} catch (error) {
  this.logger.error('Execution failed', { error, context }, 'module');
  throw new Error(`Failed to execute: ${error.message}`);
}

// ❌ Bad - Silent failure or bare console.log
try {
  const result = await service.execute();
} catch (error) {
  console.log('Error:', error); // Don't do this!
}
```

---

## 🎨 Business Domain Context

### Target Users
- **Primary**: Solo developers and small teams (1-5 people)
- **Secondary**: Mid-size teams (5-20 people) with OPERA adoption
- **Use Cases**: Greenfield projects, legacy modernization, AI-powered development

### Success Metrics
- **Development Velocity**: 40% faster by feature 5 (Compounding Engineering)
- **Code Accuracy**: 96% (vs 75% without context system)
- **Code Rework**: 5% (vs 40% without RAG patterns)
- **Test Coverage**: 80%+ minimum (Enhanced Maria-QA standard)

### Business Rules
1. **Quality Over Speed**: 80%+ coverage enforced, no shortcuts
2. **Privacy First**: Four-layer isolation (User > Team > Project > Public)
3. **Compounding Required**: Must codify patterns after every feature
4. **Native SDK Only**: Deep Claude Code integration, no generic LLM adapters

---

## 🔗 Integration Points

### External Services (Optional)
- **Supabase**: Vector store, pgvector, RLS (optional - has local fallback)
- **Neo4j**: GraphRAG knowledge graph (optional - has vector + local fallback)
- **GitHub API**: PR sync, issue tracking (via `gh` CLI)

### Claude Code Native SDK
- **Version**: v1.0+ required
- **Hooks Used**: before-prompt, after-file-edit, after-build
- **Critical**: All hooks must use tsx runtime (NOT ts-node)

### MCP Servers (Optional)
- **Chrome MCP**: Browser automation, visual regression
- **GitHub MCP**: Repository operations
- **Postgres MCP**: Database queries

---

## 📊 Performance Targets

### Response Times
- **Pattern search**: <500ms (GraphRAG), <1s (Vector), <50ms (Local)
- **Library context load**: <50ms per library, <200ms for 5 libraries
- **Agent activation**: <100ms per agent
- **Contract validation**: <50ms

### Coverage Thresholds
- **Minimum**: 80% (all code)
- **Agents**: 85% (src/agents/)
- **Testing**: 90% (src/testing/)
- **Critical paths**: 90% (auth, payments, security)

### Quality Gates
- **Contract validation**: Score ≥90 required
- **Pre-commit**: 80%+ coverage + linting + type check
- **Build**: Must pass all quality gates

---

## 🚀 Common Workflows

### Adding a New Feature
1. Run `/plan "Feature description"` → gets historical context + template
2. Review generated todos/*.md files
3. Execute waves in order (parallel where possible)
4. Validate with Enhanced Maria-QA (80%+ coverage)
5. Commit with pattern codification (automatic via stop hook)

### Creating a New OPERA Agent
1. Read `src/agents/claude.md` for conventions
2. Extend `BaseAgent` from `src/agents/core/base-agent.ts`
3. Implement `systemPrompt` and `activate()` method
4. Export singleton instance
5. Register in `.claude/AGENT_TRIGGERS.md`
6. Add 85%+ test coverage

### Adding a New Library
1. Copy `templates/context/library-claude.md.template`
2. Fill in Purpose, Concepts, Rules, Patterns, Gotchas
3. Place in `src/[library]/claude.md`
4. Update `.claude/hooks/before-prompt.ts` library array
5. Add trigger keywords to detection regex

---

## 📚 Key Documentation

- **[CLAUDE.md](CLAUDE.md)** - Team conventions, agent config (Team Layer)
- **[PROJECT.md](PROJECT.md)** - This file (Project Layer)
- **[src/*/claude.md](src/)** - Library-specific guides (Library Layer)
- **[VERSATIL_ROADMAP.md](docs/VERSATIL_ROADMAP.md)** - 4-week development plan
- **[THREE_LAYER_CONTEXT_SYSTEM.md](docs/THREE_LAYER_CONTEXT_SYSTEM.md)** - Context system architecture
- **[LIBRARY_AUDIT_REPORT.md](docs/context/LIBRARY_AUDIT_REPORT.md)** - Library context audit
- **[LIBRARY_CONTEXT_QUICKSTART.md](docs/LIBRARY_CONTEXT_QUICKSTART.md)** - Quick-start guide

---

## 🔄 Project History Highlights

### v6.6.0 (Current - 2025-10-26)
- ✅ Four-layer context system complete
- ✅ 15 library context files created
- ✅ Native SDK integration (hooks with tsx)
- ✅ Removed Babel (Jest uses ts-jest only)
- ✅ ThreeTierHandoffBuilder contract validation
- ✅ 92 tests passing (was ~3 passing in v6.5.0)

### v6.5.0 (Previous)
- Three-layer context system (User > Team > Framework)
- OPERA agents with sub-agent routing
- GraphRAG + Vector RAG system
- Compounding Engineering foundation

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadProjectContext()`
**Priority Layer**: User Preferences > Library Context > **Project Context** > Framework Defaults
