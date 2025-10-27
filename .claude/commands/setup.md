# /setup - Intelligent Context-Aware Setup

**Auto-detects context and provides appropriate guidance**

---

## What It Does

The `/setup` command intelligently detects whether you're working in:
1. **Framework Development Mode** - Enhancing VERSATIL itself
2. **User Project Mode** - Building applications with VERSATIL

And provides context-appropriate setup steps.

---

## Usage

```bash
/setup           # Auto-detect and provide setup steps
/setup --verify  # Check enforcement status
/setup --reset   # Reinitialize context detection
```

---

## Detection Logic

### Framework Development Mode
Detected when:
- Git remote contains `versatil-sdlc-framework`
- Framework marker files exist (`src/agents/core/agent-registry.ts`, etc.)
- package.json name is `@versatil/sdlc-framework`

### User Project Mode
Detected when:
- package.json has `@versatil/sdlc-framework` as dependency
- `.versatil/` directory exists with project configuration

---

## Example: Framework Development Mode

```
User: /setup

Claude:
🔍 Detected: Framework Development Mode
📍 Repository: /Users/you/VERSATIL SDLC FW
✅ Git remote: versatil-sdlc-framework.git

## Next Steps

### 1. Update Repository
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Framework
```bash
npm run build
```

### 4. Verify Installation
```bash
npm run doctor
```

---

## 🔒 Enforcement Status

✅ **Context Isolation**: ACTIVE
  - Mode: Framework Development
  - RAG Namespace: ~/.versatil-global/framework-dev/
  - Boundary: framework-internals

✅ **Hook Injection**: ACTIVE
  - before-prompt.ts injects boundaries on every prompt
  - Context detected automatically

✅ **MCP Server Guards**: READY
  - Tool permission validation enabled
  - Agent invocation checks active
  - File access filtering ready

✅ **Enforcement Engines**: INITIALIZED
  - BoundaryEnforcementEngine: Monitoring filesystem
  - ZeroTrustProjectIsolation: Threat detection active

---

## Access Permissions (Framework Dev)

✅ **Allowed**:
- Full framework internals (src/, .claude/, docs/)
- All OPERA agents (including Sarah-PM)
- Framework development RAG patterns
- Modify agent definitions, hooks, skills

❌ **Blocked**:
- Customer project data
- User project learnings
- Customer-specific patterns
```

---

## Example: User Project Mode

```
User: /setup

Claude:
🔍 Detected: User Project Mode
📍 Project: /Users/you/my-app
✅ VERSATIL dependency found

## Next Steps

### 1. Initialize Configuration
Run the onboarding wizard to customize VERSATIL for your project:

```bash
/onboard
```

This will:
- Detect your project type and tech stack
- Configure OPERA agents for your needs
- Generate a personalized 4-week roadmap
- Set up quality gates and testing standards

### 2. Verify Installation
```bash
npm run versatil:doctor
```

### 3. Start Building
Use VERSATIL commands to accelerate development:

```bash
/plan "Add user authentication"   # Generate implementation plan
/work todos/001-pending-p1-auth.md  # Execute with OPERA agents
/learn "Completed auth in 6h"      # Store for compounding
```

---

## 🔒 Enforcement Status

✅ **Context Isolation**: ACTIVE
  - Mode: User Project
  - RAG Namespace: /Users/you/my-app/.versatil/
  - Boundary: customer-project

✅ **Hook Injection**: ACTIVE
  - before-prompt.ts injects boundaries on every prompt
  - Framework internals blocked automatically

✅ **MCP Server Guards**: READY
  - Framework source code access denied
  - Sarah-PM agent blocked (framework-only)
  - RAG queries filtered to project namespace

✅ **Enforcement Engines**: INITIALIZED
  - BoundaryEnforcementEngine: Protecting framework files
  - ZeroTrustProjectIsolation: Preventing lateral access

---

## Access Permissions (User Project)

✅ **Allowed**:
- Your project files (/Users/you/my-app/**)
- Public VERSATIL APIs and documentation
- Customer-facing agents: Maria-QA, James-Frontend, Marcus-Backend, Dana-Database, Dr.AI-ML, Alex-BA
- Shared cross-project patterns
- Project-specific RAG patterns

❌ **Blocked**:
- Framework source code (src/, .claude/agents/)
- Framework development patterns
- Sarah-PM agent (framework architecture)
- Framework internals RAG namespace
```

---

## Verify Enforcement (/setup --verify)

```bash
/setup --verify
```

Checks:
- ✅ Context detection working
- ✅ Hook injection active
- ✅ MCP server guards enabled
- ✅ Boundary rules loaded
- ✅ Threat detection monitoring
- ✅ RAG namespace isolation

Returns detailed status report with diagnostics.

---

## Reset Context (/setup --reset)

```bash
/setup --reset
```

- Clears cached context identity
- Re-detects project mode
- Reinitializes enforcement engines
- Useful if project type changed

---

## Troubleshooting

### Context Not Detected
**Symptom**: `/setup` says "Unable to determine context"

**Fix**:
1. Verify git repository is initialized
2. Check package.json exists
3. Ensure VERSATIL is installed as dependency (user projects)
4. Run `/setup --reset` to force re-detection

### Enforcement Not Active
**Symptom**: No boundaries shown in prompt

**Fix**:
1. Check `.claude/hooks/before-prompt.ts` is compiled
2. Run `npm run build` to recompile hooks
3. Verify `.claude/settings.json` has UserPromptSubmit hook configured
4. Check `~/.versatil/logs/hooks/before-prompt.log` for errors

### Wrong Context Detected
**Symptom**: Framework dev detected as user project (or vice versa)

**Fix**:
1. Verify git remote: `git remote -v`
2. Check package.json name field
3. Run `/setup --reset`
4. If still wrong, report issue with diagnostics

---

## Implementation

**Auto-Detection Flow**:
```
1. Check git remote for versatil-sdlc-framework
   ↓ YES → Framework Development Mode
   ↓ NO  → Continue

2. Check package.json for @versatil/sdlc-framework dependency
   ↓ YES → User Project Mode
   ↓ NO  → Default to User Project Mode (safest)
```

**Hook Execution** (every prompt):
```
before-prompt.ts
  ↓
detectContextIdentity(workingDir)
  ↓
generateEnforcementContext(identity)
  ↓
Inject into system message
  ↓
Claude receives explicit boundaries
```

**MCP Server Guards** (every tool call):
```
Tool invoked
  ↓
checkAgentAccess(agentName) OR checkFileAccess(path)
  ↓
validateAccess/validateAgent with contextIdentity
  ↓
ALLOW or THROW "Context Violation"
```

---

## Related Commands

- `/onboard` - Full onboarding wizard for user projects
- `/update` - Update framework version
- `/config-wizard` - Modify VERSATIL configuration
- `/help` - Get help with framework features

---

## Documentation

- **Context Isolation Architecture**: [docs/CONTEXT_ENFORCEMENT.md](docs/CONTEXT_ENFORCEMENT.md)
- **Enforcement Stress Tests**: [tests/enforcement-stress-test.ts](tests/enforcement-stress-test.ts)
- **Context Identity API**: [src/isolation/context-identity.ts](src/isolation/context-identity.ts)
- **Main Guide**: [CLAUDE.md](CLAUDE.md)

---

**Version**: 7.6.0
**Status**: ✅ Production Ready
**Implementation**: Chat-based (no VSCode extension required)
