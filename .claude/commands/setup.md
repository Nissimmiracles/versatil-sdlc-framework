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

✅ **RAG Storage**: CONFIGURED
  - Public RAG: Firestore (versatil-public-rag) ✅ Connected
  - Private RAG: Not configured (framework patterns only)
  - Edge Acceleration: Cloud Run (50-100ms avg)

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

**After displaying setup steps, ALWAYS invoke Oliver-MCP + Iris-Guardian for validation:**

```typescript
await Task({
  subagent_type: "Oliver-MCP",
  description: "Validate setup environment",
  prompt: `
You are Oliver-MCP, the environment validation and prerequisite checking agent.

## Your Task

Validate the complete setup environment and verify all prerequisites are met.

## Context

Setup mode: [Framework Development / User Project]
Repository: [insert pwd]
Dependencies installed: [check node_modules/]
Configuration files: [check .claude/, .versatil/]

## Steps to Execute

### 1. Environment Validation
- Node.js version (≥18.0.0 required)
- npm version (≥9.0.0 recommended)
- Git installation and configuration
- Disk space available (≥1GB required)
- Memory available (≥4GB recommended)

### 2. Dependency Verification
- All package.json dependencies installed
- No missing peer dependencies
- No security vulnerabilities (npm audit)
- TypeScript compiler available
- Jest test framework configured

### 3. Configuration Validation
- .claude/settings.json exists and valid
- .claude/agents/*.md all present (13 files)
- .claude/commands/*.md all present (30 files)
- .claude/hooks/*.ts all present
- package.json scripts complete

### 4. MCP Integration Check
- MCP servers configured (if applicable)
- Supabase MCP (if private RAG)
- GitHub MCP (if version control)
- Chrome MCP (if browser automation)

### 5. RAG Storage Validation
- Public RAG connection (Firestore)
- Private RAG configured (if applicable)
- RAG router functional
- Pattern search working

## Expected Output

\`\`\`typescript
interface SetupValidationResult {
  environment: {
    nodejs_version: string;
    npm_version: string;
    git_installed: boolean;
    disk_space_gb: number;
    memory_gb: number;
    issues: string[];
  };

  dependencies: {
    total: number;
    installed: number;
    missing: string[];
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    typescript_available: boolean;
    jest_available: boolean;
  };

  configuration: {
    settings_valid: boolean;
    agents_count: number;  // Should be 13
    commands_count: number;  // Should be 30
    hooks_count: number;  // Should be ≥3
    scripts_complete: boolean;
    issues: string[];
  };

  mcp_integration: {
    servers_configured: number;
    servers_working: number;
    server_details: Array<{
      name: string;
      status: 'connected' | 'disconnected' | 'error';
      latency_ms?: number;
    }>;
  };

  rag_storage: {
    public_rag_status: 'connected' | 'disconnected' | 'error';
    private_rag_status: 'connected' | 'not_configured' | 'error';
    pattern_search_working: boolean;
    query_latency_ms: number;
  };

  overall_assessment: {
    setup_complete: boolean;
    readiness_score: number;  // 0-100
    critical_issues: number;
    warnings: number;
    safe_to_proceed: boolean;  // BLOCKING
    next_steps: string[];
  };
}
\`\`\`

## Example Output

\`\`\`typescript
{
  environment: {
    nodejs_version: "v20.10.0",
    npm_version: "10.2.3",
    git_installed: true,
    disk_space_gb: 45.2,
    memory_gb: 16,
    issues: []
  },

  dependencies: {
    total: 87,
    installed: 87,
    missing: [],
    vulnerabilities: {
      critical: 0,
      high: 0,
      medium: 2,
      low: 5
    },
    typescript_available: true,
    jest_available: true
  },

  configuration: {
    settings_valid: true,
    agents_count: 13,
    commands_count: 30,
    hooks_count: 3,
    scripts_complete: true,
    issues: []
  },

  mcp_integration: {
    servers_configured: 2,
    servers_working: 2,
    server_details: [
      {
        name: "supabase-mcp",
        status: "connected",
        latency_ms: 45
      },
      {
        name: "github-mcp",
        status: "connected",
        latency_ms: 120
      }
    ]
  },

  rag_storage: {
    public_rag_status: "connected",
    private_rag_status: "not_configured",
    pattern_search_working: true,
    query_latency_ms: 68
  },

  overall_assessment: {
    setup_complete: true,
    readiness_score: 95,
    critical_issues: 0,
    warnings: 2,
    safe_to_proceed: true,
    next_steps: [
      "Run 'npm run build' to compile TypeScript",
      "Consider configuring Private RAG for proprietary patterns",
      "Review 2 medium and 5 low security vulnerabilities"
    ]
  }
}
\`\`\`

Return the complete validation result.
`
});
```

**Display Validation Results**:

```typescript
// Show readiness score
console.log(`\n🎯 SETUP READINESS: ${validation.overall_assessment.readiness_score}/100`);

if (validation.overall_assessment.setup_complete) {
  console.log("✅ Setup is complete and ready!");
} else {
  console.log("⚠️  Setup incomplete - address issues below");
}

// Show critical issues
if (validation.overall_assessment.critical_issues > 0) {
  console.log(`\n🚨 CRITICAL ISSUES: ${validation.overall_assessment.critical_issues}`);
  validation.environment.issues.forEach(issue => console.log(`  - ${issue}`));
  validation.configuration.issues.forEach(issue => console.log(`  - ${issue}`));
}

// Show environment status
console.log(`\n💻 ENVIRONMENT`);
console.log(`  Node.js: ${validation.environment.nodejs_version}`);
console.log(`  npm: ${validation.environment.npm_version}`);
console.log(`  Disk: ${validation.environment.disk_space_gb} GB free`);
console.log(`  Memory: ${validation.environment.memory_gb} GB`);

// Show dependency status
console.log(`\n📦 DEPENDENCIES`);
console.log(`  Installed: ${validation.dependencies.installed}/${validation.dependencies.total}`);
if (validation.dependencies.missing.length > 0) {
  console.log(`  Missing: ${validation.dependencies.missing.join(', ')}`);
}
if (validation.dependencies.vulnerabilities.critical > 0 ||
    validation.dependencies.vulnerabilities.high > 0) {
  console.log(`  ⚠️  Vulnerabilities: ${validation.dependencies.vulnerabilities.critical} critical, ${validation.dependencies.vulnerabilities.high} high`);
}

// Show RAG status
console.log(`\n🧠 RAG STORAGE`);
console.log(`  Public RAG: ${validation.rag_storage.public_rag_status}`);
console.log(`  Private RAG: ${validation.rag_storage.private_rag_status}`);
if (validation.rag_storage.pattern_search_working) {
  console.log(`  Query latency: ${validation.rag_storage.query_latency_ms}ms`);
}

// Show next steps
if (validation.overall_assessment.next_steps.length > 0) {
  console.log(`\n📋 NEXT STEPS`);
  validation.overall_assessment.next_steps.forEach((step, i) => {
    console.log(`  ${i+1}. ${step}`);
  });
}
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

✅ **RAG Storage**: CONFIGURED
  - Public RAG: Firestore (versatil-public-rag) ✅ Connected
  - Private RAG: 🔒 Firestore (my-project-rag) ✅ Connected
    - Backend: firestore
    - Project: my-google-project-id
    - Patterns stored: 127
  - Edge Acceleration: Cloud Run (68ms avg)

**Not using Private RAG?** Run `npm run setup:private-rag` to configure it (2 minutes)

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
