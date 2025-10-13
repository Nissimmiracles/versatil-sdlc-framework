# CLAUDE.md - Claude Opera by VERSATIL Core Configuration

**Claude Opera by VERSATIL v1.0** - Production-Ready OPERA Orchestration for Claude

This document defines the core methodology for Claude Opera by VERSATIL. For detailed configuration, see:
- 📖 **Agent Details**: `.claude/AGENTS.md` (6 OPERA agents, triggers, collaboration patterns)
- 📖 **Rules System**: `.claude/rules/README.md` (5-Rule system, automation, quality gates)

---

## 🔒 CRITICAL: ISOLATION ENFORCEMENT

### Framework-Project Separation (MANDATORY)

The VERSATIL framework is **COMPLETELY ISOLATED** from user projects. This is **NON-NEGOTIABLE**.

```yaml
Framework_Home: "~/.versatil/"           # All framework data here
User_Project: "$(pwd)"                   # User's project (current directory)

Forbidden_In_Project:
  - ".versatil/" "versatil/" "supabase/" ".versatil-memory/" ".versatil-logs/"

Allowed_In_Project:
  - ".versatil-project.json"  # ✅ ONLY this file (project config)
```

**Why?**
1. **Clean Projects**: No framework pollution in user's codebase
2. **Git Safety**: No accidental commits of framework data
3. **Multi-Project**: Same framework works with ALL projects
4. **Updates**: Framework updates don't touch user code
5. **Security**: Framework credentials stay in ~/.versatil/.env

**Validation**: `npm run validate:isolation` (auto-runs on install/start)

**⚠️ AGENTS MUST:**
1. **NEVER** create framework files in user's project
2. **ALWAYS** use `~/.versatil/` for framework data
3. **CHECK** isolation before any file operation
4. **VALIDATE** paths don't cross boundaries
5. **WARN** user if isolation is violated

---

## 🎯 OPERA Methodology Overview

**OPERA** = **B**usiness Analyst + **M**arcus Backend + **A**lex Requirements + **D**evelopment Team

OPERA represents a revolutionary approach to AI-native software development, where specialized agents work in harmony through:

### Core Principles
1. **Proactive Intelligence** - Agents work automatically via daemon (`versatil-daemon start`)
2. **Isolation First** - Framework and project completely separated
3. **Specialization over Generalization** - Each agent masters specific domains
4. **Context Preservation** - Zero information loss through RAG + Claude memory
5. **Quality-First Approach** - Maria-QA reviews all deliverables
6. **Business Alignment** - Alex-BA ensures requirements traceability
7. **Continuous Integration** - Real-time collaboration and feedback

---

## 🤖 PROACTIVE AGENT SYSTEM

### Automatic Agent Activation (No Slash Commands Required)

Agents activate **automatically** based on file patterns and code context:

```yaml
Proactive_Activation_Examples:

  Scenario_1_Test_File:
    User_Action: "Edit LoginForm.test.tsx"
    Auto_Activation: "Maria-QA"
    Agent_Actions:
      - Run test coverage analysis
      - Check for missing test cases
      - Validate assertions
      - Show inline suggestions
    User_Experience: "Run 'versatil-daemon start' to enable auto-activation"

  Scenario_2_Component:
    User_Action: "Edit Button.tsx"
    Auto_Activation: "James-Frontend"
    Agent_Actions:
      - Validate component structure
      - Check accessibility (WCAG 2.1 AA)
      - Verify responsive design
      - Suggest performance optimizations
    User_Experience: "Quality checks run on save, results in statusline"

  Scenario_3_API:
    User_Action: "Edit /api/users.ts"
    Auto_Activation: "Marcus-Backend"
    Agent_Actions:
      - Validate security patterns
      - Check OWASP Top 10 compliance
      - Generate stress tests (Rule 2)
      - Verify < 200ms response time
    User_Experience: "Security validation + auto-generated tests"

  Scenario_4_Three_Tier_Feature:
    User_Action: "Create new feature: User authentication"
    Auto_Activation: "Alex-BA → [Dana + Marcus + James in parallel] → Maria-QA"

    Phase_1_Requirements:
      Alex-BA:
        - Extract requirements
        - Define API contract (endpoints + schemas)
        - Create acceptance criteria
        - Time: 30 minutes

    Phase_2_Parallel_Development:
      Dana_Database:
        - Design users/sessions tables
        - Add RLS policies
        - Create migration scripts
        - Time: 45 minutes (parallel)

      Marcus_Backend:
        - Implement /api/auth/* endpoints
        - Use mock database initially
        - Add JWT generation
        - Time: 60 minutes (parallel)

      James_Frontend:
        - Build LoginForm component
        - Use mock API initially
        - Add form validation
        - Time: 50 minutes (parallel)

      Parallel_Time: max(45, 60, 50) = 60 minutes

    Phase_3_Integration:
      - Dana → Marcus: Connect real database
      - Marcus → James: Connect real API
      - Time: 15 minutes

    Phase_4_Quality:
      Maria-QA:
        - Run test suite
        - Validate coverage (80%+)
        - Check security compliance
        - Time: 20 minutes

    Total_Time: 30 + 60 + 15 + 20 = 125 minutes (2.1 hours)
    Sequential_Estimate: 30 + 45 + 60 + 50 + 15 + 20 = 220 minutes (3.7 hours)
    Time_Saved: 95 minutes (43% faster via parallel 3-tier)

    User_Experience: "Full-stack feature with simultaneous frontend, backend, database attention"
```

### Real-Time Feedback via Statusline

```bash
# As you code, statusline shows agent activity:
🤖 Maria-QA analyzing... │ ████████░░ 80% coverage │ ⚠️ 2 missing tests
🤖 James validating UI... │ ✅ Accessible │ ⚠️ Missing aria-label
🤖 Marcus security scan... │ ✅ OWASP compliant │ ⏱️ 180ms response
```

---

## 👥 7 OPERA Agents (Brief Overview)

For complete details, see **`.claude/agents/README.md`**

### Core OPERA Team:

1. **Alex-BA** - Requirements Analyst
   - Auto-activates on: `requirements/**`, `*.feature`, issues
   - Proactive: Extract requirements, create user stories, define API contracts

### Three-Tier Development Team:

2. **Dana-Database** - Database Architect (NEW)
   - Auto-activates on: `*.sql`, `migrations/**`, `supabase/**`, `prisma/**`
   - Proactive: Schema design, RLS policies, query optimization, migrations
   - **Three-Tier Role**: Data layer specialist (works parallel with Marcus & James)

3. **Marcus-Backend** - API Architect
   - Auto-activates on: `*.api.*`, `routes/**`, `controllers/**`
   - Proactive: Security scans, stress test generation, API implementation
   - **Three-Tier Role**: API layer specialist (integrates Dana's database with James's UI)

4. **James-Frontend** - UI/UX Expert
   - Auto-activates on: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
   - Proactive: Accessibility checks, performance validation, responsive design
   - **Three-Tier Role**: Presentation layer specialist (builds UI consuming Marcus's APIs)

### Quality & Coordination:

5. **Maria-QA** - Quality Guardian
   - Auto-activates on: `*.test.*`, `__tests__/**`
   - Proactive: Test coverage analysis, bug detection, e2e validation

6. **Sarah-PM** - Project Coordinator
   - Auto-activates on: `*.md`, `docs/**`, project events
   - Proactive: Sprint reports, milestone tracking, agent coordination

7. **Dr.AI-ML** - AI/ML Specialist
   - Auto-activates on: `*.py`, `*.ipynb`, `models/**`
   - Proactive: Model validation, performance monitoring

---

## 🚀 5-Rule Automation System (Brief Overview)

For complete details, see **`.claude/rules/README.md`**

### Rule 1: Parallel Task Execution 🔄
- **What**: Run multiple tasks simultaneously without conflicts
- **Proactive**: Auto-parallelizes when editing multiple files
- **Benefit**: 3x faster development velocity

### Rule 2: Automated Stress Testing 🧪
- **What**: Auto-generate and run stress tests on code changes
- **Proactive**: New API endpoint → stress tests auto-created
- **Benefit**: 89% reduction in production bugs

### Rule 3: Daily Health Audits 📊
- **What**: Comprehensive system health check (daily minimum)
- **Proactive**: Runs at 2 AM, immediate audit on issues
- **Benefit**: 99.9% system reliability

### Rule 4: Intelligent Onboarding 🎯
- **What**: Auto-detect project type, setup agents automatically
- **Proactive**: New project → zero-config setup wizard
- **Benefit**: 90% faster onboarding

### Rule 5: Automated Releases 🚀
- **What**: Bug tracking, version management, automated releases
- **Proactive**: Test failure → auto-create issue → fix → release
- **Benefit**: 95% reduction in release overhead

---

## 🔄 Agent Collaboration Workflow

```yaml
Proactive_Workflow_Example:

  User_Request: "Add user authentication"

  Auto_Activation_Sequence:
    1. Alex-BA (auto-activates on feature request):
       - Analyzes request
       - Creates user stories:
         * "As a user, I want to login with email/password"
         * "As a user, I want secure session management"
       - Defines acceptance criteria

    2. Marcus-Backend (handoff from Alex-BA):
       - Implements /api/auth/login endpoint
       - Adds JWT token generation
       - Implements OWASP security patterns
       - Rule 2: Auto-generates stress tests

    3. James-Frontend (parallel with Marcus):
       - Creates LoginForm.tsx component
       - Adds accessibility (WCAG 2.1 AA)
       - Implements responsive design
       - Integrates with Marcus's API

    4. Maria-QA (watches both):
       - Validates test coverage (80%+ required)
       - Runs visual regression tests
       - Checks security compliance
       - Blocks merge if quality gates fail

    5. Sarah-PM (coordinates):
       - Updates sprint board
       - Tracks progress in statusline
       - Generates completion report

  User_Experience:
    - Types: "Add user authentication"
    - Agents work in background
    - Statusline shows: "🤖 4 agents collaborating │ ████░░ 60% complete"
    - Receives: Complete feature with tests, docs, and quality validation
    - Time: 1/3 of manual development
```

---

## 🔄 Context Preservation (RAG + Claude Memory)

### Dual Memory System

```yaml
Claude_Memory:  # Conversational context
  purpose: "Remember user preferences, project decisions, conversation history"
  examples:
    - "User prefers TypeScript over JavaScript"
    - "Project uses Tailwind CSS, not Bootstrap"
    - "Team follows conventional commits"

VERSATIL_RAG:  # Technical pattern memory
  purpose: "Learn from code patterns, test examples, project standards"
  storage: "Supabase vector database (~/.versatil/)"
  examples:
    - "Successful test patterns for React hooks"
    - "API security patterns used in this project"
    - "Component architecture conventions"

Integration:
  - Claude memory: High-level decisions and preferences
  - VERSATIL RAG: Low-level code patterns and examples
  - Together: Zero context loss across sessions
```

### How They Work Together

```yaml
Example_Scenario:
  User_Preference: "I prefer React Testing Library over Enzyme"
  → Stored in: Claude memory

  Code_Pattern: "How this project writes React component tests"
  → Stored in: VERSATIL RAG (vector embeddings)

  Next_Session:
    User: "Write tests for UserProfile component"
    Maria-QA:
      - Recalls from Claude memory: Use React Testing Library ✅
      - Retrieves from RAG: Similar test patterns from project ✅
      - Generates: Tests matching both preference + project style ✅
```

---

## 🛠️ Chrome MCP Testing Integration

### Primary Testing Framework

```yaml
Chrome_MCP_Setup:
  Primary_Browser: Chrome
  Config: playwright.config.ts

  Test_Types:
    - Visual Regression Testing (Percy integration)
    - Performance Monitoring (Lighthouse)
    - Accessibility Audits (axe-core, pa11y)
    - Security Testing (OWASP ZAP)
    - Cross-browser Validation

  Maria_QA_Integration:
    - Automated test suite execution
    - Visual regression detection
    - Performance regression alerts
    - Accessibility violation reporting
    - Security vulnerability scanning

  Proactive_Triggers:
    - UI component change: Auto-run visual tests
    - API endpoint change: Auto-run integration tests
    - Before commit: Full test suite via quality gates
```

---

## 📊 Quality Gates & Standards

### Mandatory Checkpoints (Enforced by Maria-QA)

```yaml
Code_Quality_Gates:
  Development_Phase:
    - Code review by Maria-QA
    - Unit tests (80%+ coverage)
    - Linting and formatting
    - Security scan (SAST)

  Integration_Phase:
    - Integration testing
    - API contract validation
    - Performance benchmarking
    - Accessibility audit

  Deployment_Phase:
    - E2E testing via Chrome MCP
    - Security verification (DAST)
    - Performance validation
    - Documentation review

Quality_Metrics:
  - Code Coverage: >= 80%
  - Performance Score: >= 90 (Lighthouse)
  - Security Score: A+ (Observatory)
  - Accessibility Score: >= 95 (axe)
  - User Satisfaction: >= 4.5/5
```

---

## 🚨 Emergency Response Protocol

```yaml
Emergency_Triggers:
  - Keywords: "urgent", "critical", "emergency", "hotfix", "production issue"
  - System events: Test failures, security alerts, performance degradation

Response_Protocol:
  1. Immediate_Activation: Maria-QA takes lead
  2. Team_Assembly: All relevant agents activated
  3. Triage: Issue assessment and prioritization
  4. Response: Coordinated resolution strategy
  5. Communication: Stakeholder updates via Sarah-PM
  6. Post_Mortem: Root cause analysis and prevention

Escalation_Matrix:
  - P0 (Critical): All agents, immediate response
  - P1 (High): Primary agents, 1-hour response
  - P2 (Medium): Relevant agents, same-day response
  - P3 (Low): Standard workflow
```

---

## ⚙️ Configuration Files

```yaml
Core_Configuration:
  - CLAUDE.md: This file (core methodology)
  - .cursor/settings.json: Proactive agent rules
  - .claude/agents/README.md: Agent details
  - .claude/rules/README.md: 5-Rule system
  - .claude/commands/: Slash commands (fallback)
  - .claude/hooks/: Automation hooks

Agent_Configuration:
  - src/agents/enhanced-maria.ts: Maria-QA implementation
  - src/agents/enhanced-james.ts: James-Frontend implementation
  - src/agents/enhanced-marcus.ts: Marcus-Backend implementation
  - src/agents/sarah-pm.ts: Sarah-PM implementation
  - src/agents/alex-ba.ts: Alex-BA implementation
  - src/agents/dr-ai-ml.ts: Dr.AI-ML implementation

Orchestration:
  - src/orchestration/parallel-task-manager.ts: Rule 1
  - src/testing/automated-stress-test-generator.ts: Rule 2
  - src/audit/daily-audit-orchestrator.ts: Rule 3
  - src/onboarding/intelligent-onboarding-system.ts: Rule 4
  - src/automation/release-orchestrator.ts: Rule 5
```

---

## 📈 Performance Metrics

```yaml
Framework_Performance:
  - Development Velocity: +300% (Rule 1: Parallel execution)
  - Defect Reduction: +89% (Rule 2: Stress testing)
  - System Reliability: +99.9% (Rule 3: Daily audits)
  - Onboarding Efficiency: +90% (Rule 4: Intelligent setup)
  - Release Automation: +95% (Rule 5: Automated releases)
  - Code Quality: +94% (CodeRabbit integration)
  - Team Productivity: +350% (Complete automation suite)

Agent_Performance:
  - Agent Switch Time: < 2 seconds
  - Context Accuracy: >= 99.9%
  - Task Completion Rate: >= 95%
  - Code Quality Score: >= 8.5/10
  - User Satisfaction: >= 4.5/5
  - Proactive Activation Success: >= 90%
```

---

## 🎯 Getting Started

### For New Projects

```bash
# Install framework
npm install -g versatil-sdlc-framework

# Initialize (Rule 4 auto-onboarding)
npm run init
# → Framework detects your tech stack
# → Configures agents automatically
# → Sets up quality gates
# → Creates test templates

# Start coding
# → Agents activate automatically as you work
# → Real-time feedback in statusline
# → Quality gates enforce before commits
```

### For Existing Projects

```bash
# Add framework
npm install --save-dev versatil-sdlc-framework

# Migrate existing code
npm run migrate:versatil
# → Analyzes existing codebase
# → Recommends agent configurations
# → Integrates with current workflow

# Gradual adoption
# → Enable Rule 1 (parallel) first
# → Add Rule 2 (testing) when ready
# → Full adoption at your pace
```

---

## 🔧 Slash Commands (Fallback/Manual Override)

While agents work proactively, slash commands remain available for manual control:

```bash
# Manual agent activation (if needed)
/maria review test coverage for authentication
/james optimize React component performance
/marcus review API security implementation
/sarah update project timeline
/alex refine user story acceptance criteria
/dr-ai-ml deploy ML model to production

# Multi-agent collaboration
/collaborate james marcus "API integration"
/handoff james maria "UI ready for testing"

# Emergency protocols
/emergency "Critical production issue"
/escalate "Security vulnerability detected"

# Framework health checks
/framework:doctor              # Comprehensive health audit
/framework:validate            # Quick validation check
```

**Note**: These are fallbacks. In normal operation, agents activate proactively without commands.

### Native npm Scripts (Preferred)

For automated tasks, use native npm scripts instead of slash commands:

```bash
# Comprehensive health audit
npm run doctor

# Stress testing
npm run test:stress

# Quality gates
npm run test:coverage          # Test coverage analysis
npm run validate               # Full validation suite
npm run build                  # Build with type checking

# Parallel execution is automatic (Rule 1)
# → No manual command needed
# → Daemon handles parallelization
# → Collision detection built-in
```

**Why Native Scripts?**
- ✅ Integrated with CI/CD pipelines
- ✅ Works without slash command infrastructure
- ✅ Standard npm workflow
- ✅ Better for automation and scripting

---

## 📚 Framework Evolution

### Version Control Strategy

```yaml
Framework_Versioning:
  - Major: Breaking changes to agent interfaces
  - Minor: New agent capabilities or workflows
  - Patch: Bug fixes and performance improvements

Release_Cycle:
  - Development: Continuous integration
  - Testing: Automated quality gates (Rule 2+3)
  - Staging: Chrome MCP validation
  - Production: Automated releases (Rule 5)
  - Monitoring: Real-time performance tracking

Backwards_Compatibility:
  - Agent interface stability
  - Configuration migration tools
  - Legacy support for 2 major versions
```

---

## 🎓 Key Concepts Summary

1. **Proactive Agents**: Work automatically, not on command
2. **Isolation**: Framework completely separate from user projects
3. **5 Rules**: Automation that transforms development experience
4. **RAG + Claude Memory**: Dual memory system for zero context loss
5. **Quality Gates**: Enforced standards at every phase
6. **Chrome MCP**: Real browser testing with extended validation
7. **Zero-Config**: Rule 4 handles onboarding automatically

---

## 🚀 Workflow Automation Rules

### Rule: Auto-Approve Planned Tools

When Claude presents an execution plan with specific tools, **automatically approve** all tools listed in the plan. This eliminates manual approval friction and speeds up development workflow.

**Auto-Approve When Plan Includes**:
- Specific tool names (Read, Write, Edit, Bash, Grep, etc.)
- Clear task breakdown with tool usage
- Tool-based implementation steps

**Applies To**:
- ✅ File operations (Read, Write, Edit, Glob, Grep)
- ✅ Code execution (Bash, npm commands, git commands)
- ✅ Analysis tools (Agent tools, MCP tools)
- ✅ Testing tools (Jest, Playwright, test runners)

**Exceptions (Manual Approval Required)**:
- ⚠️ Destructive operations (rm -rf, git reset --hard, DROP DATABASE)
- ⚠️ Production deployments (npm publish, git push --force to main)
- ⚠️ Credential modifications (.env changes, API key updates)

### Rule: Pre-Test All MCP Servers

**BEFORE** using any MCP server in a workflow, **ALWAYS** verify it's functional. This prevents workflow interruptions from broken MCP integrations.

**MCP Pre-Testing Protocol**:

1. **Test MCP Server Health**:
   - Check if MCP server process is running
   - Verify MCP server responds to health check
   - Validate configuration is correct
   - Confirm required environment variables are set

2. **MCP Servers to Test**:
   - Chrome MCP (Playwright) - Browser automation
   - GitHub MCP - Repository access
   - Vertex AI MCP - Google Cloud AI
   - Supabase MCP - Database connection
   - n8n MCP - Workflow automation
   - Semgrep MCP - Security scanning
   - Sentry MCP - Error monitoring
   - Exa Search MCP - Search API

3. **Test Commands**:
   ```bash
   # Chrome MCP - Test browser automation
   chrome_navigate to example.com

   # GitHub MCP - Test repository access
   Fetch repository metadata

   # General MCP Health
   versatil-mcp --health-check
   ```

4. **Failure Handling**:
   - If MCP test fails → Report specific error to user
   - If MCP unavailable → Suggest alternative approach
   - If config issue → Provide fix instructions
   - **Never proceed with broken MCP** - always notify user first

5. **Before Critical Operations**:
   - Frontend testing → Test Chrome MCP first
   - GitHub operations → Test GitHub MCP first
   - AI/ML tasks → Test Vertex AI MCP first
   - Search operations → Test Exa MCP first

**Benefits**:
- ✅ Prevents mid-workflow MCP failures
- ✅ Early warning of configuration issues
- ✅ Reliable automation execution
- ✅ Reduced user frustration

---

**Framework Version**: 1.0.0
**Release Date**: 2025-10-12
**Cursor Compatibility**: ✅ Fully Optimized
**Claude Desktop Integration**: ✅ Complete
**Proactive Intelligence**: ✅ Enabled
**MCP Ecosystem**: ✅ 11 Integrations
**Last Updated**: 2025-10-12
**Maintained By**: Claude Opera by VERSATIL Team

---

## 📖 Further Reading

- **Agent Details**: `.claude/AGENTS.md` - Complete agent configuration
- **Rules System**: `.claude/rules/README.md` - 5-Rule automation details
- **Commands**: `.claude/commands/` - Slash command references
- **GitHub**: https://github.com/versatil-sdlc-framework
- **Documentation**: https://docs.versatil.dev