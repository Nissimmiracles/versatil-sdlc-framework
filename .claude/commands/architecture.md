---
name: architecture
description: Complete VERSATIL architecture - slash commands, SDK integration, agents, skills, hooks, MCP, and context enforcement
tags: [architecture, documentation, sdk, agents, skills, hooks, mcp, commands, cursor]
---

# VERSATIL Framework Architecture

**Complete guide to how everything connects**

---

## Executive Summary

**VERSATIL** is an AI-native software development lifecycle (SDLC) framework that integrates deeply with **Claude Agent SDK** and **Cursor IDE** to provide:

- **30 Slash Commands** - Chat-based workflows (no extension needed)
- **18 OPERA Agents** - Auto-activating specialists (8 core + 10 sub-agents)
- **Native SDK Hooks** - Lifecycle automation (not custom YAML)
- **Skills-First Architecture** - 94% token savings via progressive disclosure
- **Context Isolation** - Framework-dev vs user-project enforcement
- **Compounding Engineering** - Each feature 40% faster through learning

**Key Innovation**: Uses **Claude Agent SDK native hooks** (not custom YAML), making it work seamlessly in Claude Code, Cursor, and future Claude-enabled IDEs.

---

## The Complete Stack

```
┌─────────────────────────────────────────────────────────┐
│                     Cursor IDE                          │
│            (or Claude Code / Claude Desktop)            │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Claude Agent SDK   │ ← Native hooks, Task tool
          │   (v1.18.2+)       │
          └──────────┬──────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         VERSATIL SDLC Framework (v7.6.0)                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Slash Commands (30 total)                      │  │
│  │  .claude/commands/*.md                          │  │
│  │                                                  │  │
│  │  /setup, /onboard, /plan, /work, /learn,       │  │
│  │  /maria-qa, /marcus-backend, /help, etc.       │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Native SDK Hooks (.claude/settings.json)      │  │
│  │                                                  │  │
│  │  UserPromptSubmit → before-prompt.ts           │  │
│  │    - Context detection (framework-dev/user)    │  │
│  │    - Enforcement boundaries injection          │  │
│  │    - Skill/pattern detection                   │  │
│  │                                                  │  │
│  │  PostToolUse → post-file-edit.ts               │  │
│  │    - Agent auto-activation triggers            │  │
│  │    - File pattern matching                     │  │
│  │                                                  │  │
│  │  SubagentStop → subagent-stop.ts               │  │
│  │    - Test execution after Task completion      │  │
│  │    - Coverage validation                       │  │
│  │                                                  │  │
│  │  Stop → session-codify.ts                      │  │
│  │    - CODIFY phase (compounding engineering)    │  │
│  │    - Learning extraction & storage             │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Skills-First Architecture (v7.0.0)            │  │
│  │  .claude/skills/                                │  │
│  │                                                  │  │
│  │  • 15 Library Guides (94.1% token savings)     │  │
│  │  • 5 Code Generators (5.5x faster dev)         │  │
│  │  • 5 RAG Patterns (historical learnings)       │  │
│  │  • 5 Custom Skills (framework-specific)        │  │
│  │                                                  │  │
│  │  Progressive disclosure: 11,235 tokens → 10    │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  OPERA Agents (18 total)                       │  │
│  │  .claude/agents/                                │  │
│  │                                                  │  │
│  │  Core (8): Maria-QA, James-Frontend,           │  │
│  │           Marcus-Backend, Dana-Database,       │  │
│  │           Alex-BA, Sarah-PM, Dr.AI-ML,         │  │
│  │           Oliver-MCP                           │  │
│  │                                                  │  │
│  │  Sub-agents (10): React, Vue, Angular,         │  │
│  │                   Next.js, Python, Node.js,    │  │
│  │                   Rails, Go, Java, Svelte      │  │
│  │                                                  │  │
│  │  Auto-activation via file pattern matching     │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  MCP Server (bin/versatil-mcp.js)              │  │
│  │                                                  │  │
│  │  • 65 tools (versatil_*, opera_*)              │  │
│  │  • 6 resources (agent status, metrics)         │  │
│  │  • 5 prompts (common patterns)                 │  │
│  │  • Context isolation guards (v7.6.0)           │  │
│  │  • Lazy-loaded (<500ms startup)               │  │
│  └─────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Enforcement Infrastructure (v7.6.0)           │  │
│  │                                                  │  │
│  │  • BoundaryEnforcementEngine (filesystem)      │  │
│  │  • ZeroTrustProjectIsolation (threats)         │  │
│  │  • MultiProjectManager (context switching)     │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   Infrastructure                        │
│                                                         │
│  • GraphRAG (Neo4j) + Vector stores (pgvector)         │
│  • RAG namespaces (framework-dev / user-project)       │
│  • Learning storage (.versatil/learning/)              │
│  • Audit logs (boundary violations, threats)           │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Slash Commands System

### How Slash Commands Work

**Claude Agent SDK** scans `.claude/commands/*.md` files on startup and makes them available as slash commands in chat.

**File Structure**:
```
.claude/commands/
├── architecture.md       ← This file (you're reading it!)
├── onboard.md           ← /onboard command
├── setup.md             ← /setup command
├── plan.md              ← /plan command
├── maria-qa.md          ← /maria-qa command
└── ... (30 total)
```

**Frontmatter Format**:
```yaml
---
name: command-name
description: What this command does
tags: [category1, category2]
---
```

**Activation**: Reload Cursor window after adding new commands
1. `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: "Developer: Reload Window"
3. Press Enter

### All 30 Slash Commands

#### Setup & Configuration (4 commands)
| Command | Description | New in v7.6.0 |
|---------|-------------|---------------|
| `/setup` | Context-aware setup wizard (framework-dev vs user-project) | ✅ NEW |
| `/onboard` | Interactive onboarding with auto-detection | |
| `/update` | Version update wizard with changelog | |
| `/config-wizard` | Visual configuration interface | |

#### EVERY Workflow (5 commands)
| Command | Description | OPERA Phase |
|---------|-------------|-------------|
| `/plan` | Research & design with templates | PLAN |
| `/assess` | Validate readiness before work | OBSERVE |
| `/delegate` | Distribute work to agents | EXECUTE |
| `/work` | Execute with tracking | EXECUTE |
| `/learn` | Codify learnings to RAG | CODIFY |

#### OPERA Agents (8 commands)
| Command | Agent | Auto-Activation Trigger |
|---------|-------|------------------------|
| `/maria-qa` | Quality Guardian | Edit `*.test.*`, `*.spec.*` |
| `/james-frontend` | UI/UX Expert | Edit `*.tsx`, `*.jsx`, `*.vue` |
| `/marcus-backend` | API Architect | Edit `api/**`, `routes/**` |
| `/dana-database` | Database Architect | Edit `*.sql`, `migrations/**` |
| `/alex-ba` | Requirements Analyst | Edit `requirements/**` |
| `/sarah-pm` | Project Coordinator | Manual only (framework-dev mode) |
| `/dr-ai-ml` | AI/ML Specialist | Edit `*.ipynb`, `ml/**/*.py` |
| `/oliver-mcp` | MCP Orchestrator | Manual invocation |

#### Utilities (13 commands)
| Command | Purpose |
|---------|---------|
| `/architecture` | **This guide** - complete architecture overview |
| `/help` | Get help with framework features |
| `/monitor` | Framework health checks |
| `/framework-debug` | Debug framework issues |
| `/generate` | Code generation (tests, docs, types) |
| `/triage` | Issue triage and prioritization |
| `/resolve` | Issue resolution |
| `/review` | Multi-agent code review |
| `/context` | Context management & memory |
| `/validate-workflow` | Workflow validation |
| `/roadmap-test` | Roadmap testing |
| `/delegate` | Smart work distribution |
| `/learn` | Pattern codification |

### Creating Custom Slash Commands

1. **Create file**: `.claude/commands/my-command.md`
2. **Add frontmatter**:
   ```yaml
   ---
   name: my-command
   description: What it does
   tags: [category]
   ---
   ```
3. **Write instructions**: Markdown content for Claude to follow
4. **Reload Cursor**: `Cmd+Shift+P` → "Developer: Reload Window"
5. **Test**: `/my-command` in chat

**Template**: See `.claude/skills/code-generators/command-creator/assets/command-template.md`

**After displaying architecture, invoke Victor-Verifier for consistency validation:**

```typescript
await Task({
  subagent_type: "Victor-Verifier",
  description: "Validate architecture consistency",
  prompt: `Verify architecture documentation matches implementation. Check integration points, version compatibility, missing components. Return validation with evidence_score and safe_to_proceed boolean.`
});
```

---

## 2. Claude Native SDK Integration

### What Is Claude Agent SDK?

**Claude Agent SDK** is Anthropic's official framework for building AI-powered tools. VERSATIL uses SDK **native hooks** (not custom YAML) to trigger automation.

### Why Native SDK Matters

**Before v6.6.0** (Custom YAML):
```yaml
lifecycle_hooks:
  afterFileEdit: ".claude/hooks/post-file-edit.sh"  # ❌ Custom, not standard
auto_activation_rules:
  - pattern: "*.test.ts"  # ❌ Custom YAML field
    agent: "Maria-QA"
```

**Problems**:
- ❌ Doesn't work in Claude Code or Cursor without custom scripts
- ❌ Not marketplace-compatible
- ❌ Manual agent invocation required

**After v6.6.0** (Native SDK):
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{"type": "command", "command": ".claude/hooks/post-file-edit.ts"}]
    }]
  }
}
```

**Benefits**:
- ✅ Works in Claude Code, Cursor, and future IDEs
- ✅ Marketplace-ready
- ✅ Agents auto-activate natively
- ✅ No manual configuration

### Hook Types (4 Total)

**File**: `.claude/settings.json`

| Hook Type | When It Fires | VERSATIL Usage |
|-----------|---------------|----------------|
| `UserPromptSubmit` | Before Claude sees user's message | Context detection, enforcement boundaries injection, skill notifications |
| `PostToolUse` | After Claude uses a tool (Read, Write, Edit, Bash, Task) | Agent auto-activation, quality gates, build validation |
| `SubagentStop` | After Task tool completes (agent finishes) | Test execution, coverage validation, quality checks |
| `Stop` | End of session (user closes chat or stops Claude) | CODIFY phase - extract learnings, update patterns, compounding engineering |

### VERSATIL Lifecycle → SDK Hooks Mapping

| VERSATIL Event | SDK Hook | Matcher | File |
|----------------|----------|---------|------|
| `beforePrompt` | `UserPromptSubmit` | `*` | `.claude/hooks/before-prompt.ts` |
| `afterFileEdit` | `PostToolUse` | `Edit\|Write\|MultiEdit` | `.claude/hooks/post-file-edit.ts` |
| `afterBuild` | `PostToolUse` | `Bash` | `.claude/hooks/post-build.ts` |
| `afterTaskCompletion` | `SubagentStop` | `*` | `.claude/hooks/subagent-stop.ts` |
| `sessionEnd` | `Stop` | `*` | `.claude/hooks/session-codify.ts` |

---

## 3. Agent System (18 Agents)

### Core Agents (8)

| Agent | Role | Auto-Activation | Tools |
|-------|------|----------------|-------|
| **Maria-QA** | Quality Guardian | `*.test.*`, `*.spec.*`, `__tests__/**` | Jest, Playwright, axe-core |
| **James-Frontend** | UI/UX Expert | `*.tsx`, `*.jsx`, `*.vue`, `*.css` | React, accessibility tools |
| **Marcus-Backend** | API Architect | `api/**`, `routes/**`, `*.api.*` | Security scanners, load testing |
| **Dana-Database** | Database Architect | `*.sql`, `migrations/**`, `*.prisma` | Prisma, pgvector, query optimization |
| **Alex-BA** | Requirements Analyst | `requirements/**`, `*.feature` | User story templates |
| **Sarah-PM** | Project Coordinator | Manual only (framework-dev mode) | Planning, reporting |
| **Dr.AI-ML** | AI/ML Specialist | `*.ipynb`, `ml/**/*.py`, `models/**` | TensorFlow, PyTorch |
| **Oliver-MCP** | MCP Orchestrator | `mcp/**`, `*.mcp.*` | MCP server management |

### Sub-Agents (10)

Framework-specific specialists that route from core agents:

**Frontend** (routed from James-Frontend):
- James-React
- James-Vue
- James-Angular
- James-Next.js
- James-Svelte

**Backend** (routed from Marcus-Backend):
- Marcus-Node.js
- Marcus-Python
- Marcus-Rails
- Marcus-Go
- Marcus-Java

### Auto-Activation Flow

```
1. User edits file: src/components/LoginForm.test.tsx
   ↓
2. PostToolUse hook fires (Edit tool used)
   ↓
3. post-file-edit.ts runs:
   - Detects file pattern: *.test.tsx
   - Matches rule: "test files → Maria-QA"
   - Checks: Last activation <5min? (debounce)
   ↓
4. If activation warranted:
   - Invokes Maria-QA via Task tool
   - Context: { file: "LoginForm.test.tsx", trigger: "file_edit" }
   ↓
5. Maria-QA analyzes:
   - Runs tests: npm test LoginForm.test.tsx
   - Checks coverage: ≥80%?
   - Validates AAA pattern
   ↓
6. SubagentStop hook fires (Task tool complete)
   ↓
7. subagent-stop.ts runs:
   - Validates test results
   - Logs to telemetry
   - Updates quality metrics
```

### Manual Invocation

```bash
# Via slash commands
/maria-qa review test coverage for src/auth.test.ts

# Via chat (Claude uses Task tool internally)
User: Can Maria-QA check if my tests are good?
Claude: [Invokes Task tool with subagent_type: "Maria-QA"]
```

---

## 4. Skills-First Architecture (v7.0.0)

### The Problem Solved

**Before v7.0.0**: Full-file context injection
- Load entire `src/rag/claude.md` (2,350 tokens)
- Load `src/agents/core/agent-registry.ts` docs (1,500 tokens)
- Total: **11,235 tokens** injected per prompt
- Result: Context window bloat, slow responses

**After v7.0.0**: Progressive disclosure
- Load skill notification only: "See `rag-library` skill" (10 tokens)
- Details loaded on-demand when needed
- Total: **10 tokens** injected initially
- Result: **94.1% token savings**

### Three Levels of Disclosure

```
Level 1: Metadata (YAML frontmatter)
  ~15 tokens, always in context
  Example: "rag-library - Pattern search conventions"
  ↓ User mentions "how to use RAG"

Level 2: SKILL.md (main documentation)
  ~500 tokens, loaded on-demand
  Example: Complete rag-library guide with examples
  ↓ User asks "show me GraphRAG code"

Level 3: references/*.md (detailed docs)
  ~2,000 tokens each, loaded as-needed
  Example: GraphRAG setup guide, vector store integration
```

### Skill Categories (25 Total)

#### 1. Library Guides (15 skills)
**Location**: `.claude/skills/library-guides/`

| Priority | Skill | Token Savings | When Detected |
|----------|-------|---------------|---------------|
| HIGH | `agents-library` | ~1,500 (94.6%) | Mention "agent", "OPERA" |
| HIGH | `rag-library` | ~2,350 (94.8%) | Mention "RAG", "pattern search" |
| HIGH | `orchestration-library` | ~1,800 (93.9%) | Mention "orchestrator", "workflow" |
| HIGH | `testing-library` | ~1,350 (95.1%) | Mention "test", "coverage" |
| MEDIUM | `planning-library` | ~685 (88.2%) | Mention "plan", "todo" |
| MEDIUM | `mcp-library` | ~430 (87.9%) | Mention "MCP", "protocol" |
| MEDIUM | `templates-library` | ~500 (89.0%) | Mention "template", "matching" |
| ... | 8 more libraries | ~3,115 total | Various keywords |

**Total**: 15 skills, **~11,235 tokens saved** (94.1%)

#### 2. Code Generators (5 skills)
**Location**: `.claude/skills/code-generators/`

| Skill | Productivity Gain | Template Location |
|-------|-------------------|-------------------|
| `agent-creator` | 6x faster (60min → 10min) | `assets/agent-template.md` |
| `command-creator` | 5.6x faster (45min → 8min) | `assets/command-template.md` |
| `hook-creator` | 5x faster (30min → 6min) | `assets/hook-template.ts` |
| `skill-creator` | 5x faster (40min → 8min) | `assets/SKILL-template.md` |
| `test-creator` | 5x faster (25min → 5min) | `assets/unit-test-template.ts` |

**Usage**: Copy template, replace `{{PLACEHOLDERS}}`

#### 3. RAG Patterns (5 skills)
**Location**: `.claude/skills/rag-patterns/`

| Pattern | Success Rate | Description |
|---------|-------------|-------------|
| `native-sdk-integration` | 98% | Hook implementation patterns (v6.6.0) |
| `victor-verifier` | 95% | Anti-hallucination (Chain-of-Verification) |
| `assessment-engine` | 92% | Quality audits (Lighthouse, axe-core, Semgrep) |
| `session-codify` | 94% | Learning codification on Stop hook |
| `marketplace-organization` | 90% | Plugin metadata cleanup patterns |

**Detection**: Keyword-triggered via `KEYWORD_MAP` in `before-prompt.ts`

#### 4. Custom Skills (5 skills)
**Location**: `.claude/skills/`

| Skill | Purpose |
|-------|---------|
| `compounding-engineering` | Pattern search, template matching, todo generation |
| `quality-gates` | 80%+ coverage enforcement, TypeScript validation |
| `opera-orchestration` | OPERA phase detection, multi-agent coordination |
| `context-injection` | Three-layer context (User > Library > Team > Framework) |
| `rag-query` | RAG memory operations (query and store) |

### How Skills Are Detected

**File**: `.claude/hooks/before-prompt.ts`

```typescript
// User message: "How do I use the RAG system?"

1. before-prompt.ts hook fires
   ↓
2. detectLibraryMentions(userMessage):
   - Keyword "RAG" detected
   - Matches library: "rag"
   ↓
3. Inject notification:
   "📚 [Library Guides] rag-library skill available
    See rag-library skill for: GraphRAG → Vector → Local fallback chain"
   ↓
4. Claude receives minimal context (10 tokens)
   ↓
5. If Claude needs details:
   - Loads .claude/skills/library-guides/rag-library/SKILL.md
   - 500 tokens of detailed conventions
   ↓
6. If Claude needs code examples:
   - Loads .claude/skills/library-guides/rag-library/references/graphrag-setup.md
   - 2,000 tokens of implementation code
```

---

## 5. Hook System Lifecycle

### Complete Request Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER SENDS MESSAGE                                   │
│    "Add authentication to my app"                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 2. BEFORE PROMPT (UserPromptSubmit hook)                │
│    .claude/hooks/before-prompt.ts                       │
│                                                          │
│    ✅ Detect context identity                           │
│       → Framework-dev or user-project?                  │
│       → Git remote check, package.json analysis         │
│                                                          │
│    ✅ Inject enforcement boundaries                     │
│       → "You are in USER PROJECT mode"                  │
│       → "Sarah-PM BLOCKED, framework source BLOCKED"    │
│                                                          │
│    ✅ Detect library/pattern mentions                   │
│       → "authentication" detected                       │
│       → Suggest rag-pattern: jwt-auth-cookies           │
│                                                          │
│    ✅ Inject skill notifications                        │
│       → "marcus-backend-library skill available"        │
│                                                          │
│    Total injection: ~300 tokens (vs 11,235 before)      │
└──────────────────────┬──────��───────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 3. CLAUDE RECEIVES ENRICHED CONTEXT                     │
│    System message includes:                             │
│    - Enforcement boundaries (context isolation)         │
│    - Skill notifications (progressive disclosure)       │
│    - RAG pattern suggestions (compounding)              │
│    - Historical learnings (from previous sessions)      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 4. CLAUDE USES TOOLS                                    │
│    - Read package.json                                  │
│    - Write src/auth.ts                                  │
│    - Edit src/app.ts                                    │
│    - Task(subagent_type: "Marcus-Backend", ...)         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 5. POST TOOL USE (PostToolUse hook)                     │
│    .claude/hooks/post-file-edit.ts                      │
│                                                          │
│    For each file edit:                                  │
│    ✅ Check file pattern                                │
│       → src/auth.ts → Backend API file                  │
│       → Should activate: Marcus-Backend                 │
│                                                          │
│    ✅ Check debounce                                    │
│       → Last activation <5min? Skip                     │
│       → >5min? Proceed                                  │
│                                                          │
│    ✅ Invoke agent via Task tool                        │
│       → Task(subagent_type: "Marcus-Backend")           │
│       → Context: {file: "auth.ts", trigger: "edit"}     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 6. TASK TOOL EXECUTES                                   │
│    Claude Agent SDK starts Marcus-Backend sub-agent     │
│                                                          │
│    Marcus-Backend:                                      │
│    - Reviews auth.ts code                               │
│    - Suggests security improvements                     │
│    - Recommends adding tests                            │
│    - Creates test file: auth.test.ts                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 7. SUBAGENT STOP (SubagentStop hook)                    │
│    .claude/hooks/subagent-stop.ts                       │
│                                                          │
│    ✅ Run tests                                         │
│       → npm test auth.test.ts                           │
│       → Coverage: 85% ✓ (≥80% required)                 │
│                                                          │
│    ✅ Validate quality                                  │
│       → AAA pattern used ✓                              │
│       → No skipped tests ✓                              │
│                                                          │
│    ✅ Log metrics                                       │
│       → Telemetry: agent=Marcus-Backend, success=true   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 8. SESSION CONTINUES                                    │
│    User asks follow-up questions, Claude responds       │
│    More tools used, more hooks fire                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 9. SESSION ENDS (Stop hook)                             │
│    .claude/hooks/session-codify.ts                      │
│                                                          │
│    ✅ Extract session learnings                         │
│       → Files edited: auth.ts, auth.test.ts             │
│       → Pattern detected: TDD (test + impl together)    │
│       → Agents used: Marcus-Backend, Maria-QA           │
│       → Decision made: JWT in httpOnly cookies          │
│                                                          │
│    ✅ Store learnings                                   │
│       → .versatil/learning/session-history.jsonl        │
│       → Pattern: jwt-auth-cookies (success)             │
│                                                          │
│    ✅ Update CLAUDE.md                                  │
│       → Add to "Recent Learnings" section              │
│       → "Auth: JWT cookies worked well (85% cov)"       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ 10. NEXT SESSION BENEFITS (Compounding)                 │
│                                                          │
│     User: "Add password reset"                          │
│       ↓                                                  │
│     before-prompt.ts loads learnings                    │
│       ↓                                                  │
│     Suggests: "Use JWT cookie pattern (proven, 85%)"    │
│       ↓                                                  │
│     Implementation 40% faster (compounding achieved!)   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. MCP Server (Model Context Protocol)

### What Is MCP?

**MCP** (Model Context Protocol) is a standardized protocol for AI models to access tools, resources, and context from external systems.

**VERSATIL MCP Server** exposes 65 tools, 6 resources, and 5 prompts to Claude.

### Architecture

**Entry Point**: `bin/versatil-mcp.js`

**Startup Flow**:
```
1. Detect context identity (framework-dev vs user-project)
   ↓
2. Initialize enforcement engines
   - BoundaryEnforcementEngine
   - ZeroTrustProjectIsolation
   ↓
3. Create MCP server instance (lazy-init mode)
   - Connects stdio transport FIRST (<500ms)
   - Heavy dependencies loaded on first tool use
   ↓
4. Register 65 tools
   - versatil_* (framework tools)
   - opera_* (agent tools)
   ↓
5. Listen for MCP protocol messages
```

### Tools (65 Total)

**Categories**:
- **Agent Management** (8): `opera_invoke_agent`, `opera_get_status`, etc.
- **RAG/Pattern Search** (12): `versatil_search_patterns`, `versatil_query_rag`, etc.
- **Quality/Testing** (10): `versatil_run_tests`, `versatil_check_coverage`, etc.
- **Planning** (8): `versatil_generate_plan`, `versatil_create_todos`, etc.
- **Health/Monitoring** (6): `versatil_health_check`, `versatil_get_metrics`, etc.
- **Documentation** (4): `versatil_search_docs`, `versatil_get_guide`, etc.
- **MCP Integrations** (12): Supabase, GitHub, Semgrep, Sentry, etc.
- **Context** (5): `versatil_get_context`, `versatil_switch_project`, etc.

**Example Tool**:
```typescript
server.tool(
  'versatil_search_patterns',
  'Search historical implementation patterns from RAG',
  {
    query: z.string(),
    min_similarity: z.number().optional()
  },
  async (args) => {
    // Phase 7.6.0: Context enforcement
    this.checkFileAccess(args.query); // Validate access

    const rawResults = await ragSearch(args.query);

    // Filter results by context boundary
    const filteredResults = this.filterRagResults(rawResults);

    return { results: filteredResults, enforced: true };
  }
);
```

### Resources (6 Total)

**Resources** are read-only data sources exposed via URIs:

- `versatil://agent-status/{agentId}` - Agent health status
- `versatil://quality-metrics` - Test coverage, quality scores
- `versatil://performance-metrics` - Framework performance data
- `versatil://project-context` - Current project context
- `versatil://rag-namespace` - Active RAG namespace info
- `versatil://session-history` - Recent session learnings

### Configuration

**Cursor**: `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "claude-opera": {
      "command": "node",
      "args": [
        "/Users/you/VERSATIL SDLC FW/bin/versatil-mcp.js",
        "/Users/you/VERSATIL SDLC FW"
      ],
      "env": {
        "VERSATIL_PROJECT_PATH": "/Users/you/VERSATIL SDLC FW",
        "VERSATIL_MCP_MODE": "true"
      },
      "timeout": 60000
    }
  }
}
```

**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (same format)

### Context Isolation Guards (v7.6.0)

**Three Guard Methods**:

1. **checkAgentAccess(agentName)**
   ```typescript
   // Before invoking agent via Task tool
   this.checkAgentAccess("Sarah-PM");
   // Throws if blocked in user-project context
   ```

2. **checkFileAccess(targetPath)**
   ```typescript
   // Before reading/writing files
   this.checkFileAccess("/framework/src/agents/core/agent-registry.ts");
   // Throws if blocked (user trying to access framework source)
   ```

3. **filterRagResults(results)**
   ```typescript
   // After RAG query, before returning results
   const rawResults = await ragSearch("agent patterns");
   const filtered = this.filterRagResults(rawResults);
   // Removes framework-dev patterns in user-project context
   ```

---

## 7. Context Isolation Enforcement (v7.6.0)

### The META Problem

**Challenge**: VERSATIL is a context framework that uses itself to enhance itself.

**Risk**:
- Framework development patterns leak to customer recommendations
- Customer project data pollutes framework learnings

**Solution**: Five-layer runtime enforcement

### Two Operating Modes

#### Framework Development Mode 🛠️
**Detected via**: Git remote contains `versatil-sdlc-framework`

**Access**:
- ✅ Full framework source (`src/`, `.claude/agents/`, `docs/`)
- ✅ All OPERA agents (including Sarah-PM)
- ✅ RAG namespace: `~/.versatil-global/framework-dev/`
- ✅ Modify agents, hooks, skills

**Blocked**:
- ❌ Customer project data (`~/.versatil-global/projects/**`)
- ❌ User project learnings

#### User Project Mode 👤
**Detected via**: `@versatil/sdlc-framework` in package.json dependencies

**Access**:
- ✅ Your project files
- ✅ Customer-facing agents (Maria-QA, James-Frontend, Marcus-Backend, Dana-Database, Dr.AI-ML, Alex-BA)
- ✅ RAG namespace: `/project/.versatil/`
- ✅ Shared cross-project patterns

**Blocked**:
- ❌ Framework source code (`**/VERSATIL*/src/**`)
- ❌ Sarah-PM agent (framework architecture only)
- ❌ Framework development patterns

### Five Enforcement Layers

```
Layer 1: Hook Injection (before-prompt.ts)
  ✅ Detects context on EVERY prompt
  ✅ Injects explicit boundaries into system message
  ✅ Claude knows what's allowed/blocked

Layer 2: MCP Tool Guards (versatil-mcp-server-v2.ts)
  ✅ Validates permissions before tool execution
  ✅ checkAgentAccess(), checkFileAccess(), filterRagResults()
  ✅ Throws "Context Violation" error if blocked

Layer 3: Filesystem Guards (BoundaryEnforcementEngine)
  ✅ Real-time OS-level file monitoring
  ✅ Blocks unauthorized access physically
  ✅ Logs violations to audit trail

Layer 4: Threat Detection (ZeroTrustProjectIsolation)
  ✅ Behavioral analysis of access patterns
  ✅ Detects lateral movement attempts
  ✅ Automatic quarantine on suspicious activity

Layer 5: Skill Filtering (Skills-First Architecture)
  ✅ Framework-only skills don't load in user context
  ✅ Progressive disclosure based on role
  ✅ Memory-efficient (not even loaded)
```

### Verification

```bash
/setup --verify

# Expected output:
✅ Context Isolation: ACTIVE
  - Mode: Framework Development
  - RAG Namespace: ~/.versatil-global/framework-dev/
  - Boundary: framework-internals

✅ Hook Injection: ACTIVE
  - before-prompt.ts injects boundaries

✅ MCP Server Guards: READY
  - Tool validation enabled
  - Agent checks active

✅ Enforcement Engines: INITIALIZED
  - BoundaryEnforcementEngine: Monitoring
  - ZeroTrustProjectIsolation: Active
```

---

## 8. Cursor-Specific Features

### Chat-Based GUI Wizards

**Innovation**: Visual interfaces rendered in **chat** (not sidebar extensions)

**Commands**:
- `/onboard` - Tables, checkboxes, progress bars in chat
- `/update` - Changelog with diff views
- `/config-wizard` - Interactive configuration

**Why Chat-Based?**:
- ✅ Works in Cursor AND Claude Desktop
- ✅ No extension development needed
- ✅ Rich markdown rendering (tables, code blocks)
- ✅ Instant deployment (no marketplace approval)

### Reload Requirement

**When new slash commands are added**:
1. `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: "Developer: Reload Window"
3. Press Enter

**Why needed**: Claude Agent SDK scans `.claude/commands/` on **startup only**

### Workspace Awareness

**MCP server automatically detects**:
- Current workspace path (Cursor window)
- Project type (framework-dev vs user-project)
- Git context (branch, remote)

**No manual configuration** - works across multiple Cursor windows

### Settings Integration

**Files**:
- `.claude/settings.json` - Hook configuration, permissions
- `.cursorrules` - IDE-specific rules for Cursor AI

**Permissions** (defined in settings):
```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(git:*)",
      "Read(/Users/you/project/**)",
      "Write(/Users/you/project/**)"
    ]
  }
}
```

---

## 9. Compounding Engineering (Every Inc Methodology)

### Goal: 40% Faster Each Feature

**Inspired by**: Every Inc's approach to product development

**Mechanism**: Stop hook → CODIFY phase → Learning extraction

### How It Works

```
Session 1: Build auth (baseline - 10 hours)
  ↓
Stop hook captures:
  - Pattern: JWT in httpOnly cookies
  - Test coverage: 85%
  - Agents used: Marcus-Backend + Maria-QA
  ↓
Stored in: .versatil/learning/session-history.jsonl

Session 2: Build password reset (8.3 hours - 17% faster)
  ↓
before-prompt.ts loads: "Auth pattern: JWT cookies (proven, 85%)"
  ↓
Claude reuses pattern → Faster implementation

Session 3: Build email verification (7.4 hours - 26% faster)
  ↓
Loads: Auth + password reset patterns
  ↓
Compound learning effect

Session 4: Build OAuth integration (6.9 hours - 31% faster)
  ↓
Multiple patterns available

Session 5: Build 2FA (6 hours - 40% faster) ✅
  ↓
Compounding target achieved!
```

### What Gets Captured

**File**: `.claude/hooks/session-codify.ts`

**Learnings Extracted**:
- Files edited (patterns detected: TDD, API-first, etc.)
- Commands run (workflows identified)
- Agents used (coordination patterns)
- Decisions made (architectural choices)
- Tests written (coverage achieved)
- Time spent (effort estimation for next time)

**Storage**:
- `.versatil/learning/session-history.jsonl` (append-only log)
- `CLAUDE.md` (updated with "Recent Learnings" section)

### Pattern Reuse

**Next Session**: `before-prompt.ts` reads learnings and suggests:
```
📚 Historical Pattern Available

Pattern: jwt-auth-cookies
Success Rate: 98% (3 uses)
Avg Effort: 6.8 hours
Coverage: 85%+

Recommended: Use this proven pattern for authentication
```

**Result**: 40% faster implementation through pattern reuse

---

## 10. Integration Flow Example

### Complete Workflow: "Add Authentication"

```
┌────────────────────────────────────────────────┐
│ USER: /plan "Add authentication"               │
└────────┬───────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 1. SLASH COMMAND INVOKES PLANNING SYSTEM        │
│    .claude/commands/plan.md                     │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 2. BEFORE PROMPT HOOK FIRES                     │
│    - Detect context: user-project               │
│    - Inject boundaries: "Sarah-PM blocked"      │
│    - Detect keyword: "authentication"           │
│    - Suggest RAG pattern: jwt-auth-cookies      │
│    - Suggest skills: marcus-backend-library     │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 3. CLAUDE PLANS WITH CONSTRAINTS                │
│    - Uses Marcus-Backend ✅ (allowed)           │
│    - Does NOT use Sarah-PM ❌ (blocked)         │
│    - Searches RAG: /project/.versatil/ ✅       │
│    - Loads skill: marcus-backend-library ✅     │
│    - Suggests jwt-auth-cookies pattern ✅       │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 4. PLAN GENERATED                                │
│    - Todos created: todos/001-auth-api.md       │
│    - Agents assigned: Marcus-Backend, Maria-QA  │
│    - Estimate: 8 hours (vs 10 hours baseline)  │
│    - Pattern: JWT cookies (98% success)         │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ USER: /work todos/001-auth-api.md               │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 5. WORK COMMAND EXECUTES                        │
│    - Invokes Marcus-Backend via Task tool       │
│    - MCP server validates: ✅ allowed           │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 6. MARCUS EDITS FILES                           │
│    - Creates: src/api/auth.ts                   │
│    - PostToolUse hook fires                     │
│    - Detects: api/** pattern → Backend file     │
│    - Suggestion: "Add tests"                    │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 7. MARCUS INVOKES MARIA-QA (Task tool)          │
│    - SubagentStop hook will fire when done      │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 8. MARIA CREATES TESTS                          │
│    - Creates: src/api/auth.test.ts              │
│    - PostToolUse hook fires                     │
│    - Detects: *.test.ts → Test file             │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 9. SUBAGENT STOP HOOK FIRES                     │
│    - Runs: npm test auth.test.ts                │
│    - Coverage: 87% ✅ (≥80%)                    │
│    - AAA pattern: ✅ validated                  │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 10. SESSION ENDS - STOP HOOK FIRES              │
│     - session-codify.ts extracts learnings      │
│     - Pattern: JWT cookies worked (87% cov)     │
│     - Effort: 7.5 hours (vs 8 estimated)        │
│     - Store: .versatil/learning/                │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 11. NEXT SESSION (Password Reset)               │
│     - before-prompt.ts loads auth pattern       │
│     - Suggests: "Reuse JWT cookie pattern"      │
│     - Estimate: 6.2 hours (17% faster!)         │
│     - COMPOUNDING ACHIEVED ✅                   │
└─────────────────────────────────────────────────┘
```

---

## 11. Troubleshooting

### Slash Commands Don't Appear

**Symptom**: Typing `/` doesn't show commands in autocomplete

**Solution**:
1. Verify files exist: `ls .claude/commands/*.md | wc -l` (should be 30+)
2. Reload Cursor: `Cmd+Shift+P` → "Developer: Reload Window"
3. Try again: Type `/` in chat

**Why**: Claude SDK scans `.claude/commands/` only on startup

### Hooks Don't Fire

**Symptom**: No agent auto-activation, no learning captured

**Solution**:
1. Check `.claude/settings.json` has hooks configured
2. Rebuild hooks: `npm run build` (compiles TypeScript → dist/)
3. Check hook logs: `~/.versatil/logs/hooks/`

**Why**: Hooks must be compiled to `.cjs` files in `dist/` directory

### Context Not Detected

**Symptom**: `/setup --verify` shows "Unable to determine context"

**Solution**:
1. Verify git repo: `git status` (must be in git repo)
2. Check package.json exists (for user-project detection)
3. Run: `/setup --reset` (force re-detection)

**Why**: Context detection relies on git remote + package.json

### MCP Server Not Connecting

**Symptom**: Tools don't work, "MCP server unavailable" errors

**Solution**:
1. Check logs: `cat ~/.versatil/mcp-server.log`
2. Verify config: `cat ~/.cursor/mcp.json` (Cursor) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Claude Desktop)
3. Test manually: `node bin/versatil-mcp.js`

**Why**: MCP server must be configured in IDE settings to connect

### Wrong Context Detected

**Symptom**: Framework-dev detected as user-project (or vice versa)

**Solution**:
1. Check git remote: `git remote -v` (should contain `versatil-sdlc-framework` for framework-dev)
2. Check package.json name field (should be `@versatil/sdlc-framework` for framework-dev)
3. Run: `/setup --reset`

**Why**: Detection logic checks git remote THEN package.json dependency

---

## 12. Resources & Documentation

### Architecture & Design
- **docs/VERSATIL_ARCHITECTURE.md** - Complete architecture guide (this was source material)
- **docs/CONTEXT_ENFORCEMENT.md** - Context isolation implementation (v7.6.0)
- **docs/NATIVE_SDK_INTEGRATION.md** - Native SDK hooks vs custom YAML
- **docs/SKILLS_FIRST_ARCHITECTURE_TRANSFORMATION.md** - Skills migration guide

### User Guides
- **CLAUDE.md** - Main framework guide (updated with context enforcement v7.6.0)
- **docs/CURSOR_GUI_WIZARDS.md** - Chat-based GUI wizards (/onboard, /update, /config-wizard)
- **docs/SLASH_COMMANDS_ACTIVATION.md** - Slash command activation guide
- **.claude/commands/README.md** - All 30 slash commands reference

### Implementation Guides
- **.claude/skills/library-guides/** - 15 library-specific guides
- **.claude/skills/code-generators/** - 5 template generators
- **.claude/skills/rag-patterns/** - 5 historical patterns
- **src/*/claude.md** - Per-library context files

### MCP & Integrations
- **docs/guides/CURSOR_MCP_SETUP.md** - MCP server setup
- **docs/reference/claude-mcp-docs.md** - MCP protocol reference
- **config/mcp.json** - MCP configuration

---

## Summary

### Key Takeaways

1. **Slash Commands** = Chat-based workflows (30 total, no extension needed)
2. **Native SDK Hooks** = Lifecycle automation (not custom YAML, marketplace-ready)
3. **Skills-First** = 94% token savings (progressive disclosure)
4. **18 OPERA Agents** = Auto-activating specialists (8 core + 10 sub-agents)
5. **MCP Server** = 65 tools exposed to Claude (context-aware)
6. **Context Isolation** = Framework-dev vs user-project enforcement
7. **Compounding Engineering** = 40% faster features through learning
8. **Cursor Integration** = Native support (chat GUI, workspace awareness)

### The Complete Picture

```
VERSATIL = Claude Agent SDK + OPERA Agents + Skills + Hooks + MCP + Context Isolation

Result: AI-native SDLC framework that works natively in Cursor/Claude Code,
        auto-activates agents, progressively loads context, enforces boundaries,
        and gets 40% faster with each feature through compounding engineering.
```

### Next Steps

```bash
# Understand the system
/architecture          # Read this guide (you just did!)

# Get started
/setup                 # Context-aware setup wizard
/onboard               # Full onboarding (if new user)

# Learn more
/help                  # Framework help system
/setup --verify        # Check enforcement status

# Build something
/plan "feature"        # Plan implementation
/work todos/001.md     # Execute with agents
/learn "summary"       # Codify learnings
```

---

**Version**: 7.6.0
**Last Updated**: 2025-10-27
**Status**: ✅ Production Ready

---

*This architecture guide is itself a slash command. Type `/architecture` in chat to access it anytime!*
