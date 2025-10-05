# 🚀 Claude Code 2.0 Integration Guide

**Document Version**: 1.0.0
**Framework Version**: 1.2.1 → 2.0.0
**Integration Date**: January 2025
**Status**: 🚧 In Progress

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Detailed Task Breakdown](#detailed-task-breakdown)
4. [Implementation Guide](#implementation-guide)
5. [Testing Strategy](#testing-strategy)
6. [Migration Path](#migration-path)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides a comprehensive guide for integrating **VERSATIL SDLC Framework v1.2.1** with **Claude Code 2.0** features released in January 2025.

### Goals:
- ✅ Native Claude Code 2.0 feature support
- ✅ Zero breaking changes for existing users
- ✅ Enhanced OPERA agent integration
- ✅ Improved developer experience
- ✅ Maintained 85%+ test coverage

### Key Improvements:
1. **Custom Slash Commands** - OPERA agent shortcuts
2. **Hooks System** - Automated quality gates
3. **Custom Subagents** - @-mentionable agents
4. **Background Commands** - Rule 1 parallel execution
5. **Enhanced Memory** - Quick # memory adds
6. **Output Styles** - Agent-specific output
7. **Status Line** - Real-time metrics
8. **Settings Validation** - /doctor integration
9. **/rewind Support** - Conversation rollback
10. **Terminal Setup** - Streamlined onboarding

---

## Architecture

### Current Structure:
```
VERSATIL SDLC FW/
├── .cursor/                    # Cursor AI config (existing)
│   └── settings.json
├── src/                        # Framework source
│   ├── agents/                 # OPERA agents
│   ├── rag/                    # RAG memory
│   └── orchestration/          # Opera orchestrator
├── scripts/                    # Automation scripts
└── package.json
```

### New Structure (v2.0.0):
```
VERSATIL SDLC FW/
├── .claude/                    # ⭐ NEW: Claude Code native config
│   ├── commands/               # ⭐ Custom slash commands
│   │   ├── maria-qa.md
│   │   ├── james-frontend.md
│   │   ├── marcus-backend.md
│   │   ├── sarah-pm.md
│   │   ├── alex-ba.md
│   │   ├── dr-ai-ml.md
│   │   ├── opera/
│   │   │   ├── parallel.md
│   │   │   ├── stress-test.md
│   │   │   └── audit.md
│   │   └── framework/
│   │       ├── validate.md
│   │       ├── isolate.md
│   │       └── doctor.md
│   ├── hooks/                  # ⭐ Automated hooks
│   │   ├── pre-tool-use/
│   │   │   ├── isolation-validator.sh
│   │   │   ├── security-gate.sh
│   │   │   └── agent-coordinator.sh
│   │   ├── post-tool-use/
│   │   │   ├── quality-validator.sh
│   │   │   ├── maria-qa-review.sh
│   │   │   └── context-preserver.sh
│   │   ├── session-start/
│   │   │   ├── framework-init.sh
│   │   │   ├── agent-health-check.sh
│   │   │   └── rule-enablement.sh
│   │   └── session-end/
│   │       ├── context-save.sh
│   │       ├── metrics-report.sh
│   │       └── cleanup.sh
│   ├── agents/                 # ⭐ Custom subagents
│   │   ├── maria-qa.json
│   │   ├── james-frontend.json
│   │   ├── marcus-backend.json
│   │   ├── sarah-pm.json
│   │   ├── alex-ba.json
│   │   └── dr-ai-ml.json
│   ├── output-styles/          # ⭐ OPERA output styles
│   │   ├── maria-qa.json
│   │   ├── james-frontend.json
│   │   ├── marcus-backend.json
│   │   ├── beginner-friendly.json
│   │   └── expert-mode.json
│   ├── memory/                 # ⭐ MCP memory resources
│   │   └── agent-memories.json
│   ├── statusline.sh           # ⭐ Custom status line
│   ├── statusline-config.json
│   └── settings.local.json     # ✅ Already exists
├── .cursor/                    # Cursor AI config (preserved)
├── src/                        # Framework source (preserved)
└── package.json                # Updated with new scripts
```

---

## Detailed Task Breakdown

### **Task 1: Custom Slash Commands** (Priority: P0)

#### Files to Create:

##### 1.1 OPERA Agent Commands

**File**: `.claude/commands/maria-qa.md`
```markdown
---
description: "Activate Maria-QA for quality assurance and testing"
argument-hint: "[task description]"
---

Activate **Maria-QA**, the Quality Assurance Lead, to:
- Run comprehensive test suites
- Validate code quality (80%+ coverage)
- Enforce quality gates
- Review security compliance
- Generate test reports
- Perform accessibility audits

## Example Usage:
```bash
/maria review test coverage for authentication module
/maria run full quality validation
/maria check security compliance
```

## Activation:
This command activates Maria-QA with:
- Model: claude-sonnet-4-5
- Tools: test, coverage, quality-gate, security-scan
- Context: Current project test files and coverage reports
```

**Estimated Lines**: 25-30 lines per agent command

##### 1.2 OPERA Workflow Commands

**File**: `.claude/commands/opera/parallel.md`
```markdown
---
description: "Enable Rule 1 parallel task execution"
---

Enable **VERSATIL Rule 1: Parallel Task Execution** with intelligent collision detection.

This activates:
- Global max tasks: 20 concurrent
- Agent workload balancing
- Resource contention prevention
- SDLC-aware task orchestration
- Real-time performance optimization

## What Gets Run in Parallel:
- File pattern changes (component builds)
- Test execution across modules
- Security scans
- Documentation generation
- Build processes

## Collision Detection:
- Resource conflicts (file system, database)
- SDLC phase violations (testing before implementation)
- Agent overload prevention (max 3 tasks per agent)
- Dependency cycle detection

## Usage:
```bash
/parallel enable
/parallel status
/parallel configure --max-tasks 15
```
```

##### 1.3 Framework Management Commands

**File**: `.claude/commands/framework/doctor.md`
```markdown
---
description: "Run comprehensive framework health check and validation"
---

Run the **VERSATIL Framework Doctor** to diagnose and fix issues.

## What Gets Checked:
✅ Isolation validation (framework-project separation)
✅ Agent health (all 6 OPERA agents operational)
✅ MCP server status (connection and tool availability)
✅ Rule enablement (Rules 1-5 configuration)
✅ Test coverage (85%+ threshold)
✅ Security compliance (zero vulnerabilities)
✅ Configuration files (.claude/settings, package.json)

## Auto-Fix Capabilities:
- Recreate missing directories
- Fix permission issues
- Restart failed MCP servers
- Update outdated dependencies
- Repair broken agent configurations

## Usage:
```bash
/doctor              # Run full health check
/doctor --fix        # Auto-fix detected issues
/doctor --verbose    # Detailed diagnostic output
```

## Integration:
Runs: `npm run validate:isolation && npm run healthcheck`
```

#### Implementation Steps:

1. **Create directory structure**:
```bash
mkdir -p .claude/commands/opera
mkdir -p .claude/commands/framework
```

2. **Create all 10 slash commands**:
   - 6 OPERA agent commands
   - 3 workflow commands (parallel, stress-test, audit)
   - 3 framework commands (validate, isolate, doctor)

3. **Test command discovery**:
```bash
claude # Should show all custom commands in /help
```

4. **Validation**:
   - Each command appears in /help
   - Arguments work correctly
   - Commands execute proper scripts/functions
   - < 100ms activation time

---

### **Task 2: Hooks System** (Priority: P0)

#### Files to Create:

##### 2.1 PreToolUse Hooks

**File**: `.claude/hooks/pre-tool-use/isolation-validator.sh`
```bash
#!/bin/bash
# VERSATIL Isolation Validator Hook
# Prevents framework pollution in user projects

set -euo pipefail

# Parse hook input (JSON from Claude Code)
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
TOOL_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.path // ""')

# Framework forbidden paths in user projects
FORBIDDEN_PATHS=(
  ".versatil/"
  "versatil/"
  "supabase/"
  ".versatil-memory/"
  ".versatil-logs/"
)

# Check if tool is trying to create forbidden paths
for forbidden in "${FORBIDDEN_PATHS[@]}"; do
  if [[ "$TOOL_PATH" == *"$forbidden"* ]]; then
    # Output JSON with blocking decision
    cat <<EOF
{
  "decision": "block",
  "reason": "Isolation violation: Cannot create '$forbidden' in user project",
  "suggestion": "Framework files must be in ~/.versatil/ instead",
  "systemMessage": "⚠️  ISOLATION VIOLATION PREVENTED\n\nAttempted: $TOOL_PATH\nViolation: Framework path in user project\nCorrect location: ~/.versatil/"
}
EOF
    exit 0
  fi
done

# Allow tool execution
echo '{"decision": "allow"}'
```

**File**: `.claude/hooks/pre-tool-use/security-gate.sh`
```bash
#!/bin/bash
# VERSATIL Security Gate Hook
# Prevents execution of potentially unsafe commands

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // ""')

# Security patterns to block
UNSAFE_PATTERNS=(
  "rm -rf /"
  ":(){ :|:& };:"  # Fork bomb
  "curl.*|.*sh"    # Piping to shell
  "wget.*|.*sh"
  "eval.*\$"       # eval with variables
)

for pattern in "${UNSAFE_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    cat <<EOF
{
  "decision": "block",
  "reason": "Security violation: Potentially dangerous command pattern",
  "systemMessage": "🔒 SECURITY GATE BLOCKED\n\nCommand: $COMMAND\nReason: Matches unsafe pattern: $pattern\nAction: Review and modify command"
}
EOF
    exit 0
  fi
done

echo '{"decision": "allow"}'
```

**File**: `.claude/hooks/pre-tool-use/agent-coordinator.sh`
```bash
#!/bin/bash
# VERSATIL Agent Coordinator Hook
# Routes tasks to appropriate OPERA agent

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""')

# Agent routing rules
if [[ "$FILE_PATH" =~ \.test\.(ts|js|tsx|jsx)$ ]]; then
  SUGGESTED_AGENT="maria-qa"
elif [[ "$FILE_PATH" =~ \.(tsx|jsx|vue|svelte)$ ]]; then
  SUGGESTED_AGENT="james-frontend"
elif [[ "$FILE_PATH" =~ \.(api|route|controller)\.(ts|js)$ ]]; then
  SUGGESTED_AGENT="marcus-backend"
elif [[ "$FILE_PATH" =~ \.(md|README)$ ]]; then
  SUGGESTED_AGENT="sarah-pm"
elif [[ "$FILE_PATH" =~ \.(py|ipynb)$ ]]; then
  SUGGESTED_AGENT="dr-ai-ml"
else
  SUGGESTED_AGENT="auto"
fi

cat <<EOF
{
  "decision": "allow",
  "systemMessage": "💡 Agent Suggestion: This task may be best handled by @$SUGGESTED_AGENT\n\nFile: $FILE_PATH\nUse '@$SUGGESTED_AGENT' to activate specialized agent for optimal results."
}
EOF
```

##### 2.2 PostToolUse Hooks

**File**: `.claude/hooks/post-tool-use/quality-validator.sh`
```bash
#!/bin/bash
# VERSATIL Quality Validator Hook
# Enforces quality gates after code changes

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""')

# Only validate after file edits/writes
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Run quick quality checks
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # TypeScript/JavaScript files
  npm run lint -- "$FILE_PATH" &> /dev/null || LINT_FAILED=1

  if [[ $LINT_FAILED -eq 1 ]]; then
    cat <<EOF
{
  "decision": "allow",
  "systemMessage": "⚠️  QUALITY GATE WARNING\n\nFile: $FILE_PATH\nIssue: Linting errors detected\nAction: Run 'npm run lint:fix' to auto-fix\n\nNote: This is a warning, not a blocker."
}
EOF
    exit 0
  fi
fi

echo '{"decision": "allow", "systemMessage": "✅ Quality checks passed"}'
```

**File**: `.claude/hooks/post-tool-use/maria-qa-review.sh`
```bash
#!/bin/bash
# VERSATIL Maria-QA Auto-Review Hook
# Triggers quality review after significant changes

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
CHANGES_COUNT=$(echo "$HOOK_INPUT" | jq -r '.tool_output.changes_count // 0')

# Trigger Maria-QA review for significant changes
if [[ $CHANGES_COUNT -gt 50 ]]; then
  cat <<EOF
{
  "decision": "allow",
  "systemMessage": "🤖 Maria-QA Review Recommended\n\nChanges: $CHANGES_COUNT lines\nSuggestion: Run '@maria-qa review recent changes' for quality validation\n\nLarge changesets benefit from comprehensive testing."
}
EOF
else
  echo '{"decision": "allow"}'
fi
```

**File**: `.claude/hooks/post-tool-use/context-preserver.sh`
```bash
#!/bin/bash
# VERSATIL Context Preserver Hook
# Saves agent context after tool execution

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
AGENT_NAME=$(echo "$HOOK_INPUT" | jq -r '.agent_name // "default"')
CONTEXT_DIR="$HOME/.versatil/context"

mkdir -p "$CONTEXT_DIR"

# Save context snapshot
cat > "$CONTEXT_DIR/${AGENT_NAME}-last-context.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agent": "$AGENT_NAME",
  "tool": "$TOOL_NAME",
  "working_directory": "$CLAUDE_PROJECT_DIR",
  "tool_input": $(echo "$HOOK_INPUT" | jq -r '.tool_input'),
  "tool_output_summary": "$(echo "$HOOK_INPUT" | jq -r '.tool_output' | head -c 500)"
}
EOF

echo '{"decision": "allow"}'
```

##### 2.3 SessionStart Hooks

**File**: `.claude/hooks/session-start/framework-init.sh`
```bash
#!/bin/bash
# VERSATIL Framework Initialization Hook
# Runs at the start of each Claude Code session

set -euo pipefail

VERSATIL_HOME="$HOME/.versatil"

# Ensure framework directories exist
mkdir -p "$VERSATIL_HOME/"{logs,context,rag-memory,config}

# Check framework installation
if ! command -v versatil-sdlc &> /dev/null; then
  cat <<EOF
{
  "systemMessage": "⚠️  VERSATIL Framework Not Found\n\nInstall: npm install -g versatil-sdlc-framework\nOr run: npm run init\n\nSession will continue with limited functionality."
}
EOF
  exit 0
fi

# Load framework configuration
if [[ -f ".versatil-project.json" ]]; then
  PROJECT_CONFIG=$(cat .versatil-project.json)
  PROJECT_NAME=$(echo "$PROJECT_CONFIG" | jq -r '.name')

  cat <<EOF
{
  "systemMessage": "🚀 VERSATIL Framework Initialized\n\nProject: $PROJECT_NAME\nFramework: v$(versatil-sdlc --version)\nAgents: 6 OPERA agents ready\nRules: 1-5 enabled\n\n✨ Ready for AI-native development!"
}
EOF
else
  cat <<EOF
{
  "systemMessage": "💡 VERSATIL Quick Setup\n\nNo .versatil-project.json found.\nRun: /init or 'npx versatil-sdlc init'\n\nContinuing with default configuration..."
}
EOF
fi
```

**File**: `.claude/hooks/session-start/agent-health-check.sh`
```bash
#!/bin/bash
# VERSATIL Agent Health Check Hook
# Validates all OPERA agents are operational

set -euo pipefail

AGENTS=("maria-qa" "james-frontend" "marcus-backend" "sarah-pm" "alex-ba" "dr-ai-ml")
UNHEALTHY_AGENTS=()

for agent in "${AGENTS[@]}"; do
  AGENT_CONFIG=".claude/agents/${agent}.json"
  if [[ ! -f "$AGENT_CONFIG" ]]; then
    UNHEALTHY_AGENTS+=("$agent")
  fi
done

if [[ ${#UNHEALTHY_AGENTS[@]} -gt 0 ]]; then
  cat <<EOF
{
  "systemMessage": "⚠️  Agent Configuration Missing\n\nMissing agents: ${UNHEALTHY_AGENTS[*]}\nAction: Run '/doctor --fix' to recreate configurations\n\nSession will continue with available agents."
}
EOF
else
  echo '{"systemMessage": "✅ All 6 OPERA agents healthy"}'
fi
```

**File**: `.claude/hooks/session-start/rule-enablement.sh`
```bash
#!/bin/bash
# VERSATIL Rule Enablement Hook
# Checks and enables framework Rules 1-5

set -euo pipefail

SETTINGS_FILE=".claude/settings.local.json"

if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo '{"systemMessage": "⚠️  Settings file not found. Using default configuration."}'
  exit 0
fi

# Check Rule 1-5 enablement
RULE1=$(jq -r '.versatil.rules.rule1_parallel_execution.enabled' "$SETTINGS_FILE")
RULE2=$(jq -r '.versatil.rules.rule2_stress_testing.enabled' "$SETTINGS_FILE")
RULE3=$(jq -r '.versatil.rules.rule3_daily_audit.enabled' "$SETTINGS_FILE")

ENABLED_RULES=0
[[ "$RULE1" == "true" ]] && ((ENABLED_RULES++))
[[ "$RULE2" == "true" ]] && ((ENABLED_RULES++))
[[ "$RULE3" == "true" ]] && ((ENABLED_RULES++))

cat <<EOF
{
  "systemMessage": "📊 VERSATIL Rules Status\n\nRule 1 (Parallel Execution): ${RULE1}\nRule 2 (Stress Testing): ${RULE2}\nRule 3 (Daily Audit): ${RULE3}\n\nActive Rules: $ENABLED_RULES/3\n\nManage rules: /parallel, /stress-test, /audit"
}
EOF
```

##### 2.4 SessionEnd Hooks

**File**: `.claude/hooks/session-end/context-save.sh`
```bash
#!/bin/bash
# VERSATIL Context Save Hook
# Preserves session context for /resume

set -euo pipefail

CONTEXT_DIR="$HOME/.versatil/context"
SESSION_ID=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CONTEXT_DIR/sessions"

# Save session summary
cat > "$CONTEXT_DIR/sessions/${SESSION_ID}.json" <<EOF
{
  "session_id": "$SESSION_ID",
  "ended_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_dir": "$CLAUDE_PROJECT_DIR",
  "total_tools_used": $(echo "$HOOK_INPUT" | jq -r '.session_stats.tools_used // 0'),
  "active_agent": "$(echo "$HOOK_INPUT" | jq -r '.active_agent // "none"')"
}
EOF

echo '{"systemMessage": "💾 Session context saved for /resume"}'
```

**File**: `.claude/hooks/session-end/metrics-report.sh`
```bash
#!/bin/bash
# VERSATIL Metrics Report Hook
# Generates session performance summary

set -euo pipefail

TOOLS_USED=$(echo "$HOOK_INPUT" | jq -r '.session_stats.tools_used // 0')
DURATION=$(echo "$HOOK_INPUT" | jq -r '.session_stats.duration_seconds // 0')
FILES_MODIFIED=$(echo "$HOOK_INPUT" | jq -r '.session_stats.files_modified // 0')

cat <<EOF
{
  "systemMessage": "📊 VERSATIL Session Summary\n\nDuration: ${DURATION}s\nTools Used: $TOOLS_USED\nFiles Modified: $FILES_MODIFIED\n\nThank you for using VERSATIL! 🚀"
}
EOF
```

**File**: `.claude/hooks/session-end/cleanup.sh`
```bash
#!/bin/bash
# VERSATIL Cleanup Hook
# Cleans up temporary data

set -euo pipefail

# Clean up old context snapshots (> 7 days)
find "$HOME/.versatil/context" -type f -mtime +7 -delete 2>/dev/null || true

# Clean up old logs (> 30 days)
find "$HOME/.versatil/logs" -type f -mtime +30 -delete 2>/dev/null || true

echo '{"systemMessage": "🧹 Temporary data cleaned up"}'
```

#### Implementation Steps:

1. **Create hooks directory structure**:
```bash
mkdir -p .claude/hooks/{pre-tool-use,post-tool-use,session-start,session-end}
```

2. **Create all 12 hook scripts** (as detailed above)

3. **Make hooks executable**:
```bash
chmod +x .claude/hooks/**/*.sh
```

4. **Test hooks**:
```bash
# Test isolation validator
echo '{"tool_name":"Write","tool_input":{"path":".versatil/test"}}' | .claude/hooks/pre-tool-use/isolation-validator.sh

# Expected: {"decision":"block", ...}
```

5. **Integration testing**:
   - Verify hooks trigger at correct lifecycle points
   - Validate JSON output format
   - Test blocking vs allowing decisions
   - Ensure < 100ms execution time

---

### **Task 3: Custom Subagents** (Priority: P0)

#### Files to Create:

**File**: `.claude/agents/maria-qa.json`
```json
{
  "name": "Maria-QA",
  "description": "Quality Assurance Lead - Comprehensive testing, quality gates, and code review",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are Maria-QA, the Quality Assurance Lead for the VERSATIL SDLC Framework.\n\n## Your Role:\n- Enforce 80%+ test coverage on all code\n- Run comprehensive test suites (unit, integration, e2e)\n- Validate quality gates before deployment\n- Review code for security vulnerabilities\n- Ensure accessibility compliance (WCAG 2.1 AA)\n- Perform cross-browser testing\n- Generate detailed quality reports\n\n## Your Standards:\n- Test Coverage: >= 80%\n- Performance Budget: Enforced via Lighthouse\n- Security: OWASP Top 10 compliance\n- Accessibility: axe-core validation\n- Code Quality: ESLint + Prettier enforced\n\n## Tools You Use:\n- Jest for unit/integration testing\n- Playwright for e2e testing\n- Chrome MCP for browser automation\n- Lighthouse for performance audits\n- axe-core for accessibility\n\n## Communication Style:\n- Precise and thorough\n- Focus on quality metrics\n- Provide actionable recommendations\n- Flag blockers immediately\n\nYou coordinate with other OPERA agents to ensure zero-defect delivery.",
  "tools": [
    "Bash(npm test*)",
    "Bash(npm run test:*)",
    "Bash(npx jest*)",
    "Bash(npx playwright*)",
    "Read",
    "Grep"
  ],
  "allowedDirectories": [
    "tests/",
    "test/",
    "__tests__/",
    "src/**/*.test.*",
    "cypress/",
    "e2e/"
  ],
  "context": {
    "includeFiles": [
      "jest.config.*",
      "playwright.config.*",
      "package.json",
      "tsconfig.json"
    ],
    "excludePatterns": [
      "node_modules/**",
      "dist/**",
      "coverage/**"
    ]
  },
  "maxConcurrentTasks": 3,
  "priority": "high",
  "tags": ["testing", "quality", "opera", "qa"]
}
```

**File**: `.claude/agents/james-frontend.json`
```json
{
  "name": "James-Frontend",
  "description": "Frontend Specialist - React, Vue, modern CSS, responsive design, UI/UX",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are James-Frontend, the Frontend Specialist for the VERSATIL SDLC Framework.\n\n## Your Expertise:\n- Modern component development (React, Vue, Svelte)\n- Responsive and accessible UI implementation\n- Frontend performance optimization\n- State management (Redux, Zustand, Pinia)\n- Design system implementation\n- CSS-in-JS, Tailwind, CSS modules\n- Progressive Web App features\n\n## Your Standards:\n- Component Reusability: 90%+\n- Performance: Core Web Vitals compliance (LCP < 2.5s, FID < 100ms, CLS < 0.1)\n- Accessibility: WCAG 2.1 AA standards\n- Mobile-First: Responsive design principles\n- Modern Standards: ES2022+, CSS Grid, Flexbox\n\n## Tools You Use:\n- React DevTools / Vue DevTools\n- Lighthouse for performance\n- Chrome MCP for testing\n- Storybook for component development\n\n## Communication Style:\n- Focus on user experience\n- Explain design decisions\n- Provide visual examples when possible\n- Collaborate with Marcus-Backend on API integration\n\nYou partner with Maria-QA for UI testing and Alex-BA for UX requirements.",
  "model": "claude-sonnet-4-5",
  "tools": [
    "Read",
    "Write",
    "Edit",
    "Bash(npm run dev*)",
    "Bash(npm run build*)",
    "mcp__ide__*"
  ],
  "allowedDirectories": [
    "src/components/",
    "src/pages/",
    "src/ui/",
    "src/styles/",
    "public/"
  ],
  "context": {
    "includeFiles": [
      "package.json",
      "tsconfig.json",
      "vite.config.*",
      "next.config.*",
      "tailwind.config.*"
    ]
  },
  "maxConcurrentTasks": 3,
  "priority": "high",
  "tags": ["frontend", "ui", "opera", "react", "vue"]
}
```

**File**: `.claude/agents/marcus-backend.json`
```json
{
  "name": "Marcus-Backend",
  "description": "Backend Architecture Expert - APIs, databases, microservices, security, scalability",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are Marcus-Backend, the Backend Architecture Expert for the VERSATIL SDLC Framework.\n\n## Your Expertise:\n- RESTful/GraphQL API design and implementation\n- Database architecture and optimization (PostgreSQL, MongoDB)\n- Authentication/authorization systems (JWT, OAuth, RBAC)\n- Microservices architecture\n- Docker containerization and Kubernetes\n- CI/CD pipeline configuration\n- Security implementation (OWASP Top 10)\n- Performance optimization and caching\n\n## Your Standards:\n- API Response Time: < 200ms\n- Database Query Optimization: Required\n- Security: OWASP Top 10 compliance\n- Documentation: OpenAPI/Swagger required\n- Testing: Integration and unit tests\n- Monitoring: APM integration required\n\n## Tools You Use:\n- Node.js / Express / Fastify\n- PostgreSQL / Supabase\n- Docker / Docker Compose\n- Postman / Insomnia for API testing\n\n## Communication Style:\n- Focus on scalability and security\n- Provide architecture diagrams when helpful\n- Explain trade-offs clearly\n- Collaborate with James-Frontend on API contracts\n\nYou coordinate with Maria-QA for backend testing and Dr.AI-ML for model deployment.",
  "model": "claude-sonnet-4-5",
  "tools": [
    "Read",
    "Write",
    "Edit",
    "Bash(npm run*)",
    "Bash(docker*)",
    "Bash(git*)"
  ],
  "allowedDirectories": [
    "src/api/",
    "src/server/",
    "src/backend/",
    "src/controllers/",
    "src/models/",
    "src/routes/",
    "docker/"
  ],
  "context": {
    "includeFiles": [
      "package.json",
      "docker-compose.yml",
      "Dockerfile",
      ".env.example"
    ]
  },
  "maxConcurrentTasks": 3,
  "priority": "high",
  "tags": ["backend", "api", "opera", "security", "database"]
}
```

**File**: `.claude/agents/sarah-pm.json`
```json
{
  "name": "Sarah-PM",
  "description": "Project Manager & Coordinator - Agile methodologies, stakeholder management, process optimization",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are Sarah-PM, the Project Manager and Coordinator for the VERSATIL SDLC Framework.\n\n## Your Role:\n- Project planning and milestone tracking\n- Team coordination and communication\n- Documentation strategy and maintenance\n- Risk management and mitigation\n- Stakeholder communication\n- Process improvement initiatives\n- Quality assurance oversight\n- Resource allocation optimization\n\n## Your Framework:\n- Methodology: Agile/Scrum with OPERA principles\n- Sprint Duration: 2 weeks\n- Quality Gates: Mandatory at each phase\n- Communication: Daily standups, weekly reviews\n- Documentation: Living documents approach\n- Metrics: Velocity, quality, satisfaction tracking\n\n## Tools You Use:\n- GitHub Projects / Issues\n- Markdown documentation\n- Mermaid diagrams\n- Status reports and dashboards\n\n## Communication Style:\n- Clear and organized\n- Focus on deliverables and timelines\n- Facilitate collaboration\n- Keep stakeholders informed\n\nYou coordinate ALL agent activities and ensure alignment with business objectives.",
  "model": "claude-sonnet-4-5",
  "tools": [
    "Read",
    "Write",
    "Edit",
    "Bash(git*)",
    "Bash(npm run*)"
  ],
  "allowedDirectories": [
    "docs/",
    ".github/",
    "README.md",
    "CHANGELOG.md"
  ],
  "context": {
    "includeFiles": [
      "README.md",
      "package.json",
      ".github/**",
      "docs/**"
    ]
  },
  "maxConcurrentTasks": 5,
  "priority": "high",
  "tags": ["project-management", "coordination", "opera", "documentation"]
}
```

**File**: `.claude/agents/alex-ba.json`
```json
{
  "name": "Alex-BA",
  "description": "Business Analyst & Requirements Expert - User stories, business logic, data analysis",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are Alex-BA, the Business Analyst and Requirements Expert for the VERSATIL SDLC Framework.\n\n## Your Expertise:\n- Requirements gathering and analysis\n- User story creation and refinement\n- Acceptance criteria definition\n- Business process mapping\n- Stakeholder needs analysis\n- Feature prioritization\n- ROI calculation and value assessment\n- Business rule documentation\n\n## Your Framework:\n- User Story Format: As a [user], I want [goal] so that [benefit]\n- Acceptance Criteria: Given/When/Then format\n- Priority Matrix: Impact vs Effort scoring\n- Value Assessment: Business value points\n- Traceability: Requirements to features mapping\n\n## Tools You Use:\n- Markdown for documentation\n- Mermaid for process diagrams\n- User story templates\n\n## Communication Style:\n- Focus on business value\n- Clarify ambiguous requirements\n- Provide context and rationale\n- Collaborate with all agents\n\nYou provide requirements to James-Frontend and Marcus-Backend, and validate deliverables against business needs.",
  "model": "claude-sonnet-4-5",
  "tools": [
    "Read",
    "Write",
    "Edit"
  ],
  "allowedDirectories": [
    "requirements/",
    "specs/",
    "docs/business/",
    "user-stories/"
  ],
  "context": {
    "includeFiles": [
      "requirements/**",
      "specs/**",
      "*.feature"
    ]
  },
  "maxConcurrentTasks": 3,
  "priority": "medium",
  "tags": ["business-analysis", "requirements", "opera", "user-stories"]
}
```

**File**: `.claude/agents/dr-ai-ml.json`
```json
{
  "name": "Dr.AI-ML",
  "description": "Machine Learning & AI Specialist - TensorFlow, PyTorch, data processing, model deployment, MLOps",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are Dr.AI-ML, the Machine Learning and AI Specialist for the VERSATIL SDLC Framework.\n\n## Your Expertise:\n- Machine learning model development\n- Data preprocessing and feature engineering\n- Model training, validation, and optimization\n- AI integration into web applications\n- MLOps pipeline implementation\n- Data visualization and analysis\n- Research and experimentation\n- Performance monitoring and optimization\n\n## Your Tech Stack:\n- Frameworks: TensorFlow, PyTorch, Scikit-learn\n- Data Processing: Pandas, NumPy, Dask\n- Deployment: Docker, Kubernetes, MLflow\n- Monitoring: Prometheus, Grafana\n- Version Control: DVC, Git LFS\n- Notebooks: Jupyter, Google Colab\n\n## Your Standards:\n- Model accuracy thresholds\n- Data quality validation\n- Reproducible experiments\n- Model versioning\n- Performance benchmarking\n\n## Tools You Use:\n- Python ecosystem\n- Jupyter notebooks\n- MLflow for experiment tracking\n- Docker for deployment\n\n## Communication Style:\n- Explain complex concepts clearly\n- Provide data-driven insights\n- Document experiments thoroughly\n- Collaborate on AI integration\n\nYou provide AI capabilities to James-Frontend and coordinate with Marcus-Backend on model APIs.",
  "model": "claude-sonnet-4-5",
  "tools": [
    "Read",
    "Write",
    "Edit",
    "Bash(python*)",
    "Bash(pip*)",
    "mcp__ide__executeCode"
  ],
  "allowedDirectories": [
    "ml/",
    "ai/",
    "models/",
    "notebooks/",
    "data/"
  ],
  "context": {
    "includeFiles": [
      "requirements.txt",
      "environment.yml",
      "*.ipynb"
    ]
  },
  "maxConcurrentTasks": 2,
  "priority": "medium",
  "tags": ["machine-learning", "ai", "opera", "data-science", "python"]
}
```

#### Implementation Steps:

1. **Create agents directory**:
```bash
mkdir -p .claude/agents
```

2. **Create all 6 agent configurations** (as detailed above)

3. **Test agent @-mention**:
```bash
# In Claude Code:
@maria-qa review test coverage
@james-frontend optimize React components
@marcus-backend secure API endpoints
```

4. **Validation**:
   - Each agent appears in @-mention typeahead
   - Correct model routing
   - Agent-specific tools accessible
   - Context preservation across agents
   - < 2 second agent switch time

---

## Testing Strategy

### Unit Tests:
```bash
npm run test:unit -- --testPathPattern=claude-code-integration
```

### Integration Tests:
```bash
# Test slash commands
claude /maria --help
claude /validate
claude /doctor

# Test hooks
# (Hooks tested automatically during tool execution)

# Test subagents
claude "@maria-qa analyze test coverage"
```

### E2E Tests:
```bash
npm run test:e2e:all
```

### Performance Benchmarks:
- Slash command activation: < 100ms
- Hook execution: < 100ms
- Agent switch: < 2 seconds
- /doctor scan: < 5 seconds

---

## Migration Path

### For Existing Users:

1. **Backup current config**:
```bash
cp -r .cursor .cursor.backup
cp -r .claude .claude.backup 2>/dev/null || true
```

2. **Update to v2.0.0**:
```bash
npm install -g versatil-sdlc-framework@2.0.0
```

3. **Run migration script**:
```bash
npx versatil-sdlc migrate --from 1.2.1 --to 2.0.0
```

4. **Validate setup**:
```bash
claude /doctor
```

### For New Users:

1. **Install framework**:
```bash
npm install -g versatil-sdlc-framework@latest
```

2. **Initialize project**:
```bash
npx versatil-sdlc init
```

3. **Verify installation**:
```bash
claude /doctor
```

---

## Troubleshooting

### Issue: Slash commands not appearing

**Solution**:
```bash
# Verify .claude/commands/ exists
ls -la .claude/commands/

# Check command format
cat .claude/commands/maria-qa.md

# Restart Claude Code
```

### Issue: Hooks not triggering

**Solution**:
```bash
# Check hook permissions
chmod +x .claude/hooks/**/*.sh

# Test hook manually
echo '{"tool_name":"test"}' | .claude/hooks/session-start/framework-init.sh

# Check hook output format (must be valid JSON)
```

### Issue: Subagents not @-mentionable

**Solution**:
```bash
# Verify agent configs
ls -la .claude/agents/

# Validate JSON syntax
jq . .claude/agents/maria-qa.json

# Check agent model availability
claude /model
```

---

## Next Steps

After completing this integration:

1. ✅ Update CHANGELOG.md with v2.0.0 features
2. ✅ Create GitHub release
3. ✅ Update documentation site
4. ✅ Announce on social media
5. ✅ Gather user feedback
6. ✅ Plan v2.1.0 enhancements

---

**Document Maintained By**: VERSATIL Core Team
**Last Updated**: 2025-01-15
**Questions**: [Open an issue](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues)