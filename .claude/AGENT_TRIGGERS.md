# VERSATIL Agent Auto-Activation Triggers

**Version**: 6.6.0
**Purpose**: Reference guide for when each OPERA agent should be automatically activated

---

## 🎯 How Auto-Activation Works

### Flow:
```
File Edit/Build → Hook Fires → JSON Output → Claude Sees Suggestion → Invokes Agent via Task Tool
```

### Hook System:
- **PostToolUse(Edit|Write)** → `.claude/hooks/post-file-edit.ts` → Outputs agent suggestion JSON
- **Claude** → Reads suggestion → Uses **Task tool** with `subagent_type` parameter
- **Agent** → Executes task with full context

---

## 🤖 Core OPERA Agents (8)

### 1. Maria-QA ✅

**When to Activate**: Test files, quality checks, coverage analysis

**File Patterns**:
- `*.test.*` (e.g., `LoginForm.test.tsx`)
- `*.spec.*` (e.g., `auth.spec.ts`)
- `**/__tests__/**` (e.g., `__tests__/components/Button.test.tsx`)
- `**/test/**`, `**/tests/**`

**Code Patterns**:
- `describe(`, `it(`, `test(`, `expect(`
- `jest.`, `vitest.`, `@testing-library/`
- Coverage reports, quality gate failures

**Auto-Activation**: ✅ **HIGH PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Maria-QA",
  "filePath": "src/auth.test.ts",
  "filePattern": "*.test.*",
  "autoActivate": true,
  "priority": "high"
}
```

**Task Tool Invocation**:
```typescript
// When I see the above JSON, I invoke:
await Task({
  subagent_type: "Maria-QA",
  description: "Quality validation",
  prompt: "Review test coverage and quality for src/auth.test.ts"
});
```

---

### 2. James-Frontend 🎨

**When to Activate**: UI components, styling, accessibility

**File Patterns**:
- `*.tsx`, `*.jsx` (React components)
- `*.vue` (Vue components)
- `*.svelte` (Svelte components)
- `*.css`, `*.scss`, `*.sass`, `*.less` (Styles)
- `components/**`, `pages/**`, `ui/**`

**Code Patterns**:
- `useState`, `useEffect`, `component`, `props`
- `className`, `style`, `aria-*`
- JSX/TSX syntax

**Sub-Agent Routing**:
- `*.tsx|*.jsx` → **james-react** (React expertise)
- `*.vue` → **james-vue** (Vue expertise)
- `*.svelte` → **james-svelte** (Svelte expertise)
- Next.js imports → **james-nextjs**
- Angular decorators → **james-angular**

**Auto-Activation**: ✅ **MEDIUM PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "James-Frontend",
  "subAgent": "james-react",
  "filePath": "src/components/Button.tsx",
  "filePattern": "*.tsx",
  "techStack": "React",
  "autoActivate": true,
  "priority": "medium"
}
```

---

### 3. Marcus-Backend ⚙️

**When to Activate**: APIs, backend logic, security

**File Patterns**:
- `**/api/**`, `**/routes/**`, `**/controllers/**`
- `**/server/**`, `**/backend/**`, `**/services/**`
- `*.api.*` (e.g., `users.api.ts`)

**Code Patterns**:
- `router.`, `app.get`, `app.post`, `express.`
- `async function`, REST/GraphQL endpoints
- Authentication, authorization logic

**Sub-Agent Routing**:
- `.ts|.js` in api/ → **marcus-node** (Node.js/Express)
- `.py` in api/ → **marcus-python** (FastAPI/Django)
- `.rb` in api/ → **marcus-rails** (Ruby on Rails)
- `.go` in api/ → **marcus-go** (Gin/Echo)
- `.java` in api/ → **marcus-java** (Spring Boot)

**Auto-Activation**: ✅ **HIGH PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Marcus-Backend",
  "subAgent": "marcus-node",
  "filePath": "src/api/auth.ts",
  "techStack": "Node.js",
  "autoActivate": true,
  "priority": "high"
}
```

---

### 4. Dana-Database 🗄️

**When to Activate**: Database schemas, migrations, queries

**File Patterns**:
- `*.sql` (SQL scripts)
- `*.prisma` (Prisma schema)
- `**/migrations/**`, `**/schema/**`
- `**/supabase/**`, `**/database/**`

**Code Patterns**:
- `CREATE TABLE`, `ALTER TABLE`, `CREATE POLICY`
- SQL queries, RLS policies
- Database migration scripts

**Auto-Activation**: ✅ **HIGH PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Dana-Database",
  "filePath": "migrations/001_create_users.sql",
  "filePattern": "*.sql",
  "autoActivate": true,
  "priority": "high"
}
```

---

### 5. Dr.AI-ML 🤖

**When to Activate**: ML/AI code, model training, RAG systems

**File Patterns**:
- `*.py` in `ml/`, `models/`, `ai/`, `training/`
- `*.ipynb` (Jupyter notebooks)
- `**/rag/**`, `**/embeddings/**`

**Code Patterns**:
- `import tensorflow`, `import torch`, `import transformers`
- `model.fit`, `model.train`, `model.predict`
- RAG pipelines, vector databases

**Auto-Activation**: ✅ **MEDIUM PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Dr.AI-ML",
  "filePath": "ml/models/classifier.py",
  "filePattern": "ml/**/*.py",
  "autoActivate": true,
  "priority": "medium"
}
```

---

### 6. Alex-BA 📊

**When to Activate**: Requirements, user stories, business logic

**File Patterns**:
- `**/requirements/**`, `**/specs/**`
- `*.feature` (Gherkin/BDD specs)
- `**/stories/**`, `**/features/**`

**Code Patterns**:
- User stories, acceptance criteria
- Business logic validation
- API contract definitions

**Auto-Activation**: ✅ **MEDIUM PRIORITY**

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Alex-BA",
  "filePath": "requirements/auth.md",
  "filePattern": "requirements/**",
  "autoActivate": true,
  "priority": "medium"
}
```

---

### 7. Sarah-PM 👔

**When to Activate**: Project docs, coordination, planning

**File Patterns**:
- `*.md` (Markdown docs)
- `**/docs/**`, `README.*`
- Project planning documents

**Code Patterns**:
- Sprint planning, roadmaps
- Multi-agent coordination
- Timeline estimation

**Auto-Activation**: ⚠️ **LOW PRIORITY** (usually manual)

**Example Trigger**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Sarah-PM",
  "filePath": "docs/ROADMAP.md",
  "filePattern": "*.md",
  "autoActivate": false,
  "priority": "low"
}
```

---

### 8. Oliver-MCP 🔌

**When to Activate**: MCP server work, hallucination detection

**File Patterns**:
- `**/mcp/**`
- `*.mcp.*` (MCP configs)
- MCP server integrations

**Code Patterns**:
- MCP tool implementations
- Anti-hallucination logic
- Intelligent routing

**Auto-Activation**: ✅ **MEDIUM PRIORITY**

---

## 🔄 Sub-Agent Routing

### James-Frontend Sub-Agents (5)

| Sub-Agent | Trigger | Confidence | Example |
|-----------|---------|------------|---------|
| **james-react** | `*.tsx|*.jsx` + React imports | >50% | `useState`, `useEffect` |
| **james-vue** | `*.vue` + Vue imports | >70% | `<template>`, `setup()` |
| **james-nextjs** | Next.js imports | >70% | `next/link`, `next/image` |
| **james-angular** | Angular decorators | >70% | `@Component`, `@NgModule` |
| **james-svelte** | `*.svelte` | >70% | Svelte stores, reactivity |

### Marcus-Backend Sub-Agents (5)

| Sub-Agent | Trigger | Confidence | Example |
|-----------|---------|------------|---------|
| **marcus-node** | `.ts|.js` in api/ + Express/Fastify | >70% | `app.get`, `router.post` |
| **marcus-python** | `.py` in api/ + FastAPI/Django | >60% | `@app.get`, `async def` |
| **marcus-rails** | `.rb` in api/ + Rails patterns | >60% | `ActiveRecord`, `has_many` |
| **marcus-go** | `.go` in api/ + Gin/Echo | >60% | `router.GET`, `c.JSON` |
| **marcus-java** | `.java` in api/ + Spring | >60% | `@RestController`, `@GetMapping` |

---

## 📊 Priority Matrix

| Agent | Auto-Activate | Priority | Frequency | Typical Use Case |
|-------|--------------|----------|-----------|------------------|
| Maria-QA | ✅ Yes | High | Very High | Every test file edit, build |
| Marcus-Backend | ✅ Yes | High | High | API/backend development |
| Dana-Database | ✅ Yes | High | Medium | Schema changes, migrations |
| James-Frontend | ✅ Yes | Medium | High | UI component development |
| Dr.AI-ML | ✅ Yes | Medium | Low | ML model training, RAG |
| Alex-BA | ✅ Yes | Medium | Low | Requirements analysis |
| Sarah-PM | ⚠️ Manual | Low | Very Low | Strategic planning |
| Oliver-MCP | ✅ Yes | Medium | Low | MCP integrations |

---

## 🎯 Usage Examples

### Example 1: Test File Edited

**User Action**: Edit `src/auth.test.ts`

**Hook Output**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Maria-QA",
  "filePath": "src/auth.test.ts",
  "autoActivate": true,
  "priority": "high"
}
```

**Claude Response**:
```typescript
// I see Maria-QA should be activated
await Task({
  subagent_type: "Maria-QA",
  description: "Test quality validation",
  prompt: "Review test coverage and quality for src/auth.test.ts. Ensure 80%+ coverage and validate test assertions."
});
```

---

### Example 2: React Component Edited

**User Action**: Edit `src/components/LoginForm.tsx`

**Hook Output**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "James-Frontend",
  "subAgent": "james-react",
  "filePath": "src/components/LoginForm.tsx",
  "techStack": "React",
  "autoActivate": true,
  "priority": "medium"
}
```

**Claude Response**:
```typescript
// I see James-Frontend (React) should be activated
await Task({
  subagent_type: "James-Frontend",
  description": "UI component validation",
  prompt: "Review React component LoginForm.tsx. Check accessibility (WCAG 2.1 AA), responsive design, and component structure. Consider activating james-react sub-agent for React-specific optimizations."
});
```

---

### Example 3: API Endpoint Edited

**User Action**: Edit `src/api/users.ts`

**Hook Output**:
```json
{
  "hookType": "agent-activation-suggestion",
  "agent": "Marcus-Backend",
  "subAgent": "marcus-node",
  "filePath": "src/api/users.ts",
  "techStack": "Node.js",
  "autoActivate": true,
  "priority": "high"
}
```

**Claude Response**:
```typescript
// I see Marcus-Backend (Node.js) should be activated
await Task({
  subagent_type: "Marcus-Backend",
  description: "API security and performance",
  prompt: "Review API endpoint src/api/users.ts. Validate OWASP security patterns, response time (<200ms target), error handling, and authentication. Consider activating marcus-node sub-agent for Node.js-specific optimizations."
});
```

---

## 🔧 Configuration

### Hook Configuration (`.claude/settings.json`)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{"command": ".claude/hooks/post-file-edit.ts"}]
      }
    ]
  }
}
```

### Hook Output Format

All hooks output structured JSON:

```typescript
interface AgentSuggestion {
  hookType: 'agent-activation-suggestion';
  agent: string;           // e.g., "Maria-QA"
  subAgent?: string;       // e.g., "james-react" (optional)
  filePath: string;        // e.g., "src/auth.test.ts"
  filePattern: string;     // e.g., "*.test.*"
  techStack?: string;      // e.g., "React" (optional)
  trigger: 'file-edit';
  recommendation: string;  // Human-readable explanation
  autoActivate: boolean;   // Should activate automatically?
  priority: 'low' | 'medium' | 'high';
}
```

---

## 🎓 Best Practices

### For Claude (Me):

1. **Read hook output** - Always check for agent suggestions after Edit/Write/Bash tools
2. **Invoke proactively** - Use Task tool immediately when `autoActivate: true`
3. **Respect priority** - High priority = activate immediately, Low = ask user first
4. **Consider sub-agents** - When tech stack is detected, mention it in Task prompt
5. **Provide context** - Pass file path and specific concerns to agent

### For Users:

1. **Trust the system** - Agents will activate automatically when needed
2. **Manual override** - Use `/maria-qa`, `/james-frontend` slash commands for manual activation
3. **Disable if needed** - Edit `.claude/settings.json` to disable specific hooks
4. **Monitor logs** - Check hook output to understand activation decisions

---

## 📚 Related Documentation

- **Native SDK Integration**: [NATIVE_SDK_INTEGRATION.md](../docs/NATIVE_SDK_INTEGRATION.md)
- **Hook System**: [.claude/hooks/README.md](.claude/hooks/README.md)
- **Agent Definitions**: [.claude/agents/README.md](.claude/agents/README.md)
- **Project Memory**: [CLAUDE.md](../CLAUDE.md)

---

**Last Updated**: 2025-10-26
**Version**: 6.6.0
**Maintained By**: VERSATIL Framework Team
