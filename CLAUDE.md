# CLAUDE.md - Claude Opera by VERSATIL Core Configuration

**Claude Opera by VERSATIL v1.0** - Production-Ready OPERA Orchestration for Claude with 12-MCP Ecosystem

This document defines the core methodology for Claude Opera by VERSATIL. For detailed configuration, see:
- 📖 **Agent Details**: `.claude/AGENTS.md` (8 core OPERA agents + 10 language-specific sub-agents = 18 total, triggers, collaboration patterns)
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

OPERA represents a revolutionary approach to AI-native software development, where specialized agents work in harmony through **Compounding Engineering** - Compounding Engineering methodology where each unit of work makes subsequent units 40% faster.

### Core Principles
1. **Proactive Intelligence** - Agents work automatically via daemon (`versatil-daemon start`)
2. **Isolation First** - Framework and project completely separated
3. **Specialization over Generalization** - Each agent masters specific domains
4. **Context Preservation** - Zero information loss through RAG + Claude memory
5. **Quality-First Approach** - Maria-QA reviews all deliverables
6. **Business Alignment** - Alex-BA ensures requirements traceability
7. **Continuous Integration** - Real-time collaboration and feedback
8. **Compounding Engineering** - Each feature improves the next through learning codification

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

## 📋 Plan Mode Integration (Cursor 1.7+)

### Complex Task Planning

VERSATIL leverages Cursor 1.7's **Plan Mode** to handle complex multi-step workflows with detailed upfront planning.

**When Plan Mode Activates**:
- Multi-agent coordination required (3+ agents)
- Long-horizon tasks (estimated > 30 minutes)
- Complex refactoring across multiple files
- Full-stack feature implementation
- Database migrations with API updates

### Plan Mode Workflow

```yaml
Plan_Mode_Example: "Implement user authentication system"

Phase_1_Planning:
  Trigger: User requests complex feature
  Plan_Mode: Enabled
  Sarah-PM_Actions:
    - Break down feature into agent tasks
    - Estimate duration per task
    - Identify dependencies
    - Create structured todo list
    - Present plan for approval

  Example_Plan:
    1. Alex-BA: Define requirements (30 min)
       - User stories
       - API contract
       - Acceptance criteria

    2. Parallel Development (60 min):
       - Dana-Database: Schema design
       - Marcus-Backend: API with mocks
       - James-Frontend: UI with mocks

    3. Integration Phase (40 min):
       - Connect database to API
       - Connect API to frontend
       - End-to-end testing

    4. Quality Validation (20 min):
       - Maria-QA: Test coverage
       - Security scan
       - Performance validation

    Total_Estimated: 150 minutes (2.5 hours)

Phase_2_Approval:
  User_Review: Shows plan in readable format
  User_Action: Approve / Modify / Cancel
  If_Approved: Execute with TodoWrite tracking

Phase_3_Execution:
  Sarah-PM:
    - Coordinates agent handoffs
    - Tracks progress in real-time
    - Updates statusline
    - Handles errors and blockers

  Real_Time_Updates:
    - "🤖 Alex-BA: Defining requirements... (30% complete)"
    - "🤖 Dana + Marcus + James: Parallel development... (60% complete)"
    - "🤖 Integration in progress... (85% complete)"
    - "🤖 Maria-QA: Running quality checks... (95% complete)"
    - "✅ Feature complete! All quality gates passed."

Phase_4_Completion:
  Maria-QA_Validation:
    - All tests passing
    - Coverage >= 80%
    - Security scan clean
    - Performance within budget

  Sarah-PM_Report:
    - Actual vs estimated time
    - Quality metrics
    - Lessons learned
    - Codify to RAG memory
```

### Plan Mode Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Predictability** | Know exactly what will happen before execution | Reduced surprises |
| **Transparency** | See full task breakdown upfront | Better decision-making |
| **Optimization** | Sarah-PM optimizes agent coordination | Faster execution |
| **Error Prevention** | Catch issues in planning phase | Fewer runtime errors |
| **Learning** | Plan vs actual comparison improves estimates | Continuous improvement |

### Manual Plan Mode Activation

```bash
# Activate plan mode for complex tasks
/plan "Implement user authentication with OAuth"

# Output: Detailed plan with agent breakdown
📋 PLAN: User Authentication with OAuth

Phase 1: Requirements Analysis (Alex-BA) - 30 min
  ✓ Define OAuth flow requirements
  ✓ Create user stories
  ✓ Document API contract

Phase 2: Database Layer (Dana-Database) - 45 min [PARALLEL]
  ✓ Design users/oauth_tokens tables
  ✓ Add RLS policies for multi-tenant
  ✓ Create migration scripts

Phase 3: API Layer (Marcus-Backend) - 60 min [PARALLEL]
  ✓ Implement OAuth endpoints
  ✓ Add token validation
  ✓ Security patterns (OWASP)

Phase 4: Frontend Layer (James-Frontend) - 50 min [PARALLEL]
  ✓ OAuth login button component
  ✓ Token management
  ✓ Accessibility (WCAG 2.1 AA)

Phase 5: Integration - 40 min
  ✓ Connect database to API
  ✓ Connect API to frontend
  ✓ End-to-end testing

Phase 6: Quality Assurance (Maria-QA) - 20 min
  ✓ Test coverage validation (80%+)
  ✓ Security scan
  ✓ Performance testing

TOTAL ESTIMATED: 2.5 hours
PARALLEL OPTIMIZATION: Saves 95 minutes vs sequential

Approve plan? [Y/n]
```

### Plan Mode + TodoWrite Integration

Plan Mode automatically creates TodoWrite tasks for tracking:

```yaml
Todo_List_Generated:
  - "Phase 1: Requirements Analysis (Alex-BA)" - pending
  - "Phase 2: Database Layer (Dana-Database)" - pending
  - "Phase 3: API Layer (Marcus-Backend)" - pending
  - "Phase 4: Frontend Layer (James-Frontend)" - pending
  - "Phase 5: Integration" - pending
  - "Phase 6: Quality Assurance (Maria-QA)" - pending

During_Execution:
  - Todos marked as in_progress when agent starts
  - Todos marked as completed when agent finishes
  - Real-time statusline updates
  - Progress percentage tracked
```

### Disabling Plan Mode

For simple tasks, plan mode is automatically skipped:

```yaml
Simple_Task_Examples:
  - "Fix typo in README.md" → Direct execution (no plan needed)
  - "Add console.log to debug" → Direct execution
  - "Run tests" → Direct execution

Complex_Task_Examples:
  - "Refactor authentication system" → Plan mode activated
  - "Add full-stack feature" → Plan mode activated
  - "Database migration with API changes" → Plan mode activated
```

**Configuration**:
```json
// .cursor/settings.json
{
  "versatil": {
    "plan_mode": {
      "enabled": true,
      "auto_activate_threshold": "complex", // "simple" | "complex" | "always"
      "show_estimates": true,
      "require_approval": true
    }
  }
}
```

---

## 👥 18 OPERA Agents (8 Core + 10 Sub-Agents)

**Status**: VERSATIL v6.4.0 includes 18 fully implemented agents:
- **8 Core OPERA Agents**: Production-ready specialists (Alex-BA, Dana, Marcus, James, Maria, Sarah, Dr.AI, Oliver)
- **10 Language-Specific Sub-Agents**: Framework specialists that auto-activate based on project tech stack
  - **5 Marcus Backend Sub-Agents**: marcus-node, marcus-python, marcus-rails, marcus-go, marcus-java
  - **5 James Frontend Sub-Agents**: james-react, james-vue, james-nextjs, james-angular, james-svelte

**How Sub-Agents Work**: Core agents (Marcus/James) automatically detect your project's tech stack and route to specialized sub-agents. Example: Marcus-Backend editing a Node.js file → auto-routes to marcus-node for Node.js best practices.

For complete details, see **`.claude/agents/README.md`**

### Core OPERA Team (8 Agents):

1. **Alex-BA** - Requirements Analyst
   - Auto-activates on: `requirements/**`, `*.feature`, issues
   - Proactive: Extract requirements, create user stories, define API contracts

### Three-Tier Development Team:

2. **Dana-Database** - Database Architect ⭐ **v6.4.0**
   - Auto-activates on: `*.sql`, `migrations/**`, `supabase/**`, `prisma/**`
   - Proactive: Schema design, RLS policies, query optimization, migrations
   - **Three-Tier Role**: Data layer specialist (works parallel with Marcus & James)
   - **Status**: Fully implemented ✅

3. **Marcus-Backend** - API Architect
   - Auto-activates on: `*.api.*`, `routes/**`, `controllers/**`
   - Proactive: Security scans, stress test generation, API implementation
   - **Three-Tier Role**: API layer specialist (integrates Dana's database with James's UI)
   - **Sub-Agents**: Auto-routes to marcus-node, marcus-python, marcus-rails, marcus-go, or marcus-java based on project

4. **James-Frontend** - UI/UX Expert
   - Auto-activates on: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
   - Proactive: Accessibility checks, performance validation, responsive design
   - **Three-Tier Role**: Presentation layer specialist (builds UI consuming Marcus's APIs)
   - **Sub-Agents**: Auto-routes to james-react, james-vue, james-nextjs, james-angular, or james-svelte based on project

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

### MCP Ecosystem:

8. **Oliver-MCP** - MCP Orchestrator ⭐ **v6.4.1**
   - Auto-activates on: `**/mcp/**`, `*.mcp.*`, MCP-related tasks
   - Proactive: Intelligent MCP routing, anti-hallucination detection via GitMCP
   - **Status**: Fully implemented ✅

---

### Language-Specific Sub-Agents (10 Implemented):

**Marcus Backend Sub-Agents (5)** - *v6.4.0*:
- **marcus-node**: Node.js 18+, Express/Fastify, async/await patterns
- **marcus-python**: Python 3.11+, FastAPI/Django, async Python
- **marcus-rails**: Ruby on Rails 7+, Active Record, Hotwire
- **marcus-go**: Go 1.21+, Gin/Echo, goroutines & channels
- **marcus-java**: Java 17+, Spring Boot 3, Spring Data JPA

**James Frontend Sub-Agents (5)** - *v6.4.0*:
- **james-react**: React 18+, hooks, TypeScript, TanStack Query
- **james-vue**: Vue 3, Composition API, Pinia, VeeValidate
- **james-nextjs**: Next.js 14+, App Router, Server Components
- **james-angular**: Angular 17+, standalone components, signals
- **james-svelte**: Svelte 4/5, SvelteKit, stores

**Total Agent Count**:
- **v6.4.0 (Current)**: 18 agents fully implemented ✅
  - 8 core OPERA agents (production-ready)
  - 10 language-specific sub-agents (production-ready)

**Auto-Routing Logic**:
```yaml
Example_Node_Project:
  User_Action: "Edit src/api/users.ts"
  Detection: "TypeScript + Node.js patterns detected"
  Routing: "Marcus-Backend → marcus-node (automatic)"
  Result: "Node.js best practices applied (Express, async/await, error handling)"

Example_React_Project:
  User_Action: "Edit src/components/Button.tsx"
  Detection: "React + TypeScript patterns detected"
  Routing: "James-Frontend → james-react (automatic)"
  Result: "React best practices applied (hooks, TypeScript, accessibility)"
```

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

## 🔄 Context Preservation (Triple Memory System)

### Triple Memory Architecture

VERSATIL achieves **<0.5% context loss** through three complementary memory systems:

```yaml
1. Claude_Memory:  # Conversational context (built-in)
   purpose: "Remember user preferences, project decisions, conversation history"
   examples:
     - "User prefers TypeScript over JavaScript"
     - "Project uses Tailwind CSS, not Bootstrap"
     - "Team follows conventional commits"
   retention: "Lifetime of conversation"

2. Memory_Tool:  # Agent-specific patterns (Phase 1+2)
   purpose: "Cross-session learning for each OPERA agent"
   storage: "~/.versatil/memories/[agent-id]/"
   examples:
     - "React hook testing patterns (Maria-QA)"
     - "API security patterns (Marcus-Backend)"
     - "Component architecture (James-Frontend)"
   retention: "Permanent (until manually deleted)"
   features:
     - Agent-specific directories
     - File-based storage (markdown)
     - 6 operations (view, create, str_replace, insert, delete, rename)
     - Context editing integration (100k token auto-clear)

3. VERSATIL_RAG:  # Project-wide embeddings (existing)
   purpose: "Vector search across all code patterns and examples"
   storage: "Supabase vector database"
   examples:
     - "All test patterns across features"
     - "Historical API designs"
     - "Performance optimization history"
   retention: "Permanent with similarity search"

Integration:
  - Claude Memory: User preferences + high-level decisions
  - Memory Tool: Agent knowledge + recent patterns (last 30 days)
  - VERSATIL RAG: Historical patterns + similarity search
  - Together: <0.5% context loss + 40% faster development
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

## 📚 Claude Official Documentation Access

### Integrated Documentation System

VERSATIL provides seamless access to Claude's official documentation through multiple channels, ensuring agents always have the latest information on Memory Tool, Context Editing, and Claude SDK features.

**Documentation Sources**:

1. **Local Clone (Offline Access)** ✅
   - Location: `~/.versatil/docs/claude-cookbooks/`
   - Repository: `anthropics/claude-cookbooks`
   - Update: `cd ~/.versatil/docs/claude-cookbooks/ && git pull`
   - Access: Direct file reads for offline development

2. **GitHub MCP (Real-Time Access)** ✅
   - Server: `github` (configured in `.cursor/mcp_config.json`)
   - Repository: `anthropics/claude-cookbooks`
   - Usage: Real-time file fetching and search
   - Best For: Finding specific examples or latest updates

3. **WebFetch (Official Docs)** ✅
   - Base URL: `https://docs.claude.com/en/docs`
   - Key Endpoints:
     - Memory Tool: `/agents-and-tools/tool-use/memory-tool`
     - Context Editing: `/build-with-claude/context-editing`
     - Agent SDK: `/build-with-claude/agents`
   - Best For: Always current official documentation

### Documentation Workflow

**When implementing Claude features**:

```yaml
Step_1_Research:
  Action: "Fetch latest official documentation"
  Tool: WebFetch
  Example: "WebFetch('https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool')"
  Purpose: "Get authoritative, up-to-date feature information"

Step_2_Reference:
  Action: "Check cookbooks for code examples"
  Tool: Read or GitHub MCP
  Example: "Read('~/.versatil/docs/claude-cookbooks/tool_use/memory_tool.py')"
  Purpose: "Find working code patterns and implementation details"

Step_3_Implement:
  Action: "Apply to VERSATIL with isolation patterns"
  Location: "~/.versatil/ (NOT user projects)"
  Pattern: "Agent-specific directories, security validation, context-aware wrappers"

Step_4_Store:
  Action: "Codify learnings to agent memories"
  Location: "~/.versatil/memories/[agent-id]/"
  Format: "Markdown files with patterns, examples, lessons learned"

Step_5_Learn:
  Action: "Run /learn to store in RAG"
  Purpose: "Make patterns retrievable for future features"
  Result: "Next similar feature is 40% faster (Compounding Engineering)"
```

### Key Documentation Resources

**Memory Tool Implementation**:
- Cookbook: `~/.versatil/docs/claude-cookbooks/tool_use/memory_cookbook.ipynb`
- Reference Code: `tool_use/memory_tool.py`
- Tests: `tool_use/tests/test_memory_tool.py`
- VERSATIL Implementation: [Memory Tool Integration Guide](docs/enhancements/MEMORY_TOOL_INTEGRATION.md)

**Context Editing**:
- Official Docs: `https://docs.claude.com/en/docs/build-with-claude/context-editing`
- Beta Flag: `context-management-2025-06-27`
- VERSATIL Config: [src/memory/memory-tool-config.ts](src/memory/memory-tool-config.ts)

**Claude Code SDK**:
- Examples: `~/.versatil/docs/claude-cookbooks/claude_code_sdk/`
- VERSATIL Agents: [src/agents/sdk/](src/agents/sdk/)

### Agent Memory + Claude Documentation

All 18 OPERA agents (8 core + 10 sub-agents) follow this pattern:

```yaml
Agent_Documentation_Pattern:
  1. Check_Memories_First:
     Location: "~/.versatil/memories/[agent-id]/"
     Purpose: "Use previously learned patterns (fastest)"

  2. Fetch_If_Needed:
     Sources: "Claude Cookbooks (local) → GitHub MCP → WebFetch"
     Purpose: "Get latest info when pattern not found or outdated"

  3. Apply_Pattern:
     Action: "Use in current implementation"

  4. Update_Memories:
     Action: "Store successful pattern for future use"
     Format: "Markdown with code examples, usage notes, warnings"
```

**Example (Maria-QA)**:
```yaml
User_Request: "Write tests for new authentication feature"

Maria_QA_Workflow:
  1. Checks: ~/.versatil/memories/maria-qa/test-patterns.md
  2. Finds: "Authentication test patterns from previous feature"
  3. Retrieves: Code examples, setup patterns, edge cases
  4. Applies: Patterns to new feature (40% faster)
  5. Stores: New learnings back to memory (for next time)
```

### Documentation Maintenance

**Update Local Cookbooks**: Before starting new Claude feature work
```bash
cd ~/.versatil/docs/claude-cookbooks/
git pull origin main
ls -la tool_use/ capabilities/
```

**Clear Doc Cache**: After major Claude updates
```bash
# Clear cached docs (keeps patterns!)
rm ~/.versatil/memories/*/docs-cache-*.md

# Or use npm script
npm run memory:cleanup
```

**Verify Access**:
```bash
# Test GitHub MCP
gh repo view anthropics/claude-cookbooks

# Test local clone
ls ~/.versatil/docs/claude-cookbooks/

# Test WebFetch (use in Claude conversation)
# WebFetch('https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool')
```

**See Also**:
- Complete documentation guide: [docs/reference/claude-mcp-docs.md](docs/reference/claude-mcp-docs.md)
- Memory Tool integration: [docs/enhancements/MEMORY_TOOL_INTEGRATION.md](docs/enhancements/MEMORY_TOOL_INTEGRATION.md)
- MCP configuration: [.cursor/mcp_config.json](.cursor/mcp_config.json)

---

## 📊 Context Statistics & Monitoring (Phase 2)

### Real-Time Context Management Tracking

VERSATIL provides **comprehensive monitoring** of context usage, memory operations, and token management through an integrated statistics system.

**Quick Check**:
```bash
npm run context:stats     # View current statistics
npm run context:report    # Generate detailed report
npm run context:cleanup   # Clean up old stats (30 days)
```

### What Gets Tracked

```yaml
Context_Clear_Events:
  - Timestamp of each clear
  - Input tokens at clear (e.g., 105,000)
  - Tool uses cleared (e.g., 15 old results)
  - Tokens saved (e.g., 3,500)
  - Trigger type (auto at 100k or manual)
  - Agent ID (maria-qa, marcus-backend, etc.)

Memory_Operations:
  - Every view, create, str_replace, insert, delete, rename
  - Success/failure status
  - Agent performing operation
  - Estimated tokens used
  - Timestamp for trend analysis

Session_Metrics:
  - Total input/output tokens
  - Number of clear events
  - Total tokens saved
  - Memory operations count
  - Peak token usage
  - Agent-specific performance
```

### Statistics Dashboard Output

```bash
$ npm run context:stats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 VERSATIL Context Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Summary Statistics

  Total Tokens Processed: 450,000
  Total Clear Events: 4
  Total Tokens Saved: 14,000
  Avg Tokens per Clear: 3,500
  Total Memory Operations: 67
  Uptime: 1.25 hours

🔧 Memory Operations by Type

  view        : █████████████████████ 42
  create      : ███████ 15
  str_replace : ████ 8
  insert      : █ 1
  delete      : █ 1

📊 Clear Events by Agent

  maria-qa            : ███ 2
  marcus-backend      : █ 1
  james-frontend      : █ 1

⏱️  Last Clear Event

  Timestamp: 2025-10-18T14:32:15.000Z
  Input Tokens: 105,000
  Tool Uses Cleared: 15
  Tokens Saved: 3,500
  Agent: maria-qa
```

### Monitoring Commands

**View Statistics**:
```bash
npm run context:stats
```
- Shows summary statistics
- Visual charts for operations and clears
- Last clear event details
- Fast overview (~5 seconds)

**Generate Report**:
```bash
npm run context:report
```
- Detailed markdown report
- Token savings rate calculation
- Memory ops per clear ratio
- Recent clear events (last 5)
- Efficiency metrics

**Cleanup Old Data**:
```bash
npm run context:cleanup
```
- Removes stats older than 30 days
- Keeps recent data for trends
- Prevents unbounded growth

### Storage Location

```
~/.versatil/stats/
├── clear-events.json      # Last 1,000 context clear events
├── memory-ops.json        # Last 5,000 memory operations
└── sessions.jsonl         # All session metrics (append-only)
```

**Size**: ~50KB per 1,000 operations (negligible disk usage)
**Isolation**: Stored in `~/.versatil/`, never in user projects

### Use Cases

**Debugging Context Issues**:
```bash
# User reports: "Agent forgot our discussion"

npm run context:stats

# Check last clear event:
# - When did it happen?
# - Was it expected (>100k tokens)?
# - What was cleared?
# - Did agent store patterns to memory before clear?
```

**Performance Optimization**:
```bash
npm run context:report

# Identify:
# - Which agents use context most efficiently
# - Average tokens saved per clear
# - Memory operation patterns
# - Opportunities for optimization
```

**Team Reports**:
```bash
npm run context:report > weekly-stats.md

# Share with team:
# - Total tokens processed this week
# - Context clearing efficiency
# - Memory operation trends
# - Agent utilization patterns
```

### Integration with Memory Tool

Context statistics automatically track all Memory Tool operations:
- Every `view`, `create`, `str_replace`, etc. logged
- Agent attribution tracked
- Token usage estimated (1 token ≈ 4 characters)
- Zero performance impact (<1ms overhead)

**Example Workflow**:
```yaml
1. Maria-QA creates test pattern:
   → Tracked: create operation, maria-qa agent, 125 tokens

2. Context reaches 100k tokens:
   → Tracked: Clear event, 15 tools cleared, 3,500 tokens saved

3. Marcus reads security pattern:
   → Tracked: view operation, marcus-backend agent, 87 tokens

4. End of day:
   → Run: npm run context:stats
   → See: Complete picture of context usage
```

### Performance Metrics

- **Tracking Overhead**: <1ms per operation
- **Storage Growth**: ~50KB per 1,000 operations
- **Query Performance**: O(n) for time-range queries
- **Memory Impact**: Negligible (async tracking)

**See Also**:
- Phase 2 Documentation: [docs/enhancements/CONTEXT_EDITING_PHASE2.md](docs/enhancements/CONTEXT_EDITING_PHASE2.md)
- Phase 2 Learnings: [~/.versatil/memories/project-knowledge/context-editing-phase2-learnings.md](~/.versatil/memories/project-knowledge/context-editing-phase2-learnings.md)
- Implementation: [src/memory/context-stats-tracker.ts](src/memory/context-stats-tracker.ts)

---

## 🪝 Cursor Hooks Integration (v1.7+)

### Lifecycle Hooks for Agent Control

VERSATIL leverages Cursor 1.7's **Hooks** system to observe, control, and extend agent behavior at runtime. Hooks provide automated guardrails and intelligence at every stage of the agent lifecycle.

**Configuration**: `~/.cursor/hooks.json` (automatically created on install)

### Enabled Hooks

```yaml
Cursor_Hooks:
  afterFileEdit:
    Purpose: "Format code, validate isolation, update RAG memory"
    Actions:
      - Run prettier/black on edited files
      - Check for isolation violations (framework files in project)
      - Update RAG memory with code patterns (async)
      - Block edits that violate framework-project separation
    Script: "~/.versatil/hooks/afterFileEdit.sh"

  beforeShellExecution:
    Purpose: "Security checks, audit logging, prevent destructive operations"
    Actions:
      - Block destructive commands (rm -rf, DROP DATABASE, etc.)
      - Block production deployments without approval
      - Validate isolation (prevent .versatil/ modification from projects)
      - Audit all shell commands to log file
    Script: "~/.versatil/hooks/beforeShellExecution.sh"
    Safety_Patterns:
      - "rm -rf" → BLOCKED
      - "git push --force" → BLOCKED
      - "npm publish" → BLOCKED (requires manual approval)
      - "DROP DATABASE" → BLOCKED

  beforeReadFile:
    Purpose: "Context tracking, access logging, security warnings"
    Actions:
      - Track file access for RAG context building
      - Warn when reading sensitive files (.env, credentials.json)
      - Log access patterns for agent performance analysis
      - Update context tracker (async)
    Script: "~/.versatil/hooks/beforeReadFile.sh"

  onSessionOpen:
    Purpose: "Display last session context automatically"
    Actions:
      - Load last session data from ~/.versatil/sessions/
      - Display session metrics (time saved, quality score, impact)
      - Show active agents from previous session
      - Present top patterns learned
      - Provide recommendations for next session
      - Show git status and project context
    Script: "~/.versatil/hooks/onSessionOpen.sh"
    Trigger: "First user interaction (beforeSubmitPrompt)"
    Display_Format: "Brief mode for fast startup"
    Session_Data:
      - Time saved: "104 minutes"
      - Quality score: "89.5%"
      - Impact score: "7.1/10"
      - Active agents: "Maria-QA, James-Frontend, Marcus-Backend"
      - Top patterns: "React Testing Library, API security, Component optimization"

  beforeSubmitPrompt:
    Purpose: "Agent activation suggestions, context enrichment"
    Actions:
      - Detect agent keywords in prompt
      - Suggest relevant OPERA agents
      - Enrich prompt with project context
      - Provide proactive hints
    Script: "~/.versatil/hooks/beforeSubmitPrompt.sh"
    Agent_Detection:
      - "test|coverage|quality" → Suggest Maria-QA
      - "component|ui|react" → Suggest James-Frontend
      - "api|backend|security" → Suggest Marcus-Backend
      - "schema|migration|sql" → Suggest Dana-Database
      - "plan|milestone" → Suggest Sarah-PM

  stop:
    Purpose: "Session cleanup, learning codification, metrics"
    Actions:
      - Log session metrics (duration, actions, agent)
      - Codify learned patterns to RAG memory
      - Generate session report for Sarah-PM
      - Update agent performance metrics
      - Cleanup temporary files
    Script: "~/.versatil/hooks/stop.sh"
```

### Hook Benefits

| Hook | Primary Benefit | Impact |
|------|----------------|--------|
| onSessionOpen | Automatic session context display | Zero friction context recovery |
| afterFileEdit | Automatic formatting + isolation enforcement | 100% compliance |
| beforeShellExecution | Security guardrails + audit trail | 0 destructive accidents |
| beforeReadFile | Context tracking + sensitive file warnings | Enhanced RAG accuracy |
| beforeSubmitPrompt | Proactive agent suggestions | Better agent utilization |
| stop | Learning codification + metrics | Continuous improvement |

### Logs and Monitoring

```bash
# View hook execution logs
tail -f ~/.versatil/logs/hooks.log

# View file access patterns
tail -f ~/.versatil/logs/file-access.log

# View session metrics
cat ~/.versatil/logs/session-metrics.log

# Agent performance metrics
cat ~/.versatil/metrics/agent-Maria-QA.json
```

### Hook Lifecycle Example

```yaml
User_Action: "Edit src/api/users.ts"

Hook_Sequence:
  1. beforeReadFile:
     - Logs: Reading src/api/users.ts
     - Tracks: Context for RAG
     - Returns: Allowed

  2. Agent_Edit: Marcus-Backend modifies file

  3. afterFileEdit:
     - Runs: prettier --write src/api/users.ts
     - Validates: No isolation violations ✅
     - Updates: RAG memory with API pattern (async)
     - Returns: Allowed with metadata

  4. beforeShellExecution: "npm test"
     - Logs: Running test command
     - Validates: Safe command ✅
     - Returns: Allowed

  5. stop:
     - Saves: Session metrics to ~/.versatil/metrics/
     - Codifies: Learned patterns to RAG
     - Generates: Session report
     - Cleanup: Temp files removed
```

### Custom Hook Configuration

Advanced users can extend hooks in `~/.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      {
        "command": "~/.versatil/hooks/afterFileEdit.sh",
        "description": "VERSATIL: Format, validate, update RAG"
      },
      {
        "command": "/path/to/custom-hook.sh",
        "description": "Your custom post-edit logic"
      }
    ]
  },
  "settings": {
    "timeout": 5000,
    "enableLogging": true,
    "logPath": "~/.versatil/logs/hooks.log"
  }
}
```

**See Also**: [Cursor Hooks Documentation](https://cursor.com/docs/agent/hooks)

---

## 🔄 Compounding Engineering: The VELOCITY Workflow

### What is Compounding Engineering?

**Compounding Engineering** (pioneered by Every Inc) is a development methodology where each unit of work makes subsequent units **40% faster** through systematic learning and pattern codification.

**Key Insight**: Traditional development treats each feature independently. Compounding Engineering treats each feature as an investment that pays dividends on every future feature.

### The VELOCITY Workflow (5-Phase Cycle)

VERSATIL implements the complete EVERY workflow through slash commands:

```yaml
EVERY_Workflow:
  Phase_1_PLAN:
    Command: "/plan [feature description]"
    Purpose: "Research and design with templates + historical context"
    Agents: Alex-BA, Dana, Marcus, James (parallel research)
    Output: Detailed plan with effort estimates, risks, alternatives
    Compounding: Uses templates from past features (40% faster planning)

  Phase_2_ASSESS:
    Command: "/assess [work target]"
    Purpose: "Validate readiness before work starts"
    Checks:
      - Framework health ≥ 80%
      - Git status clean
      - Dependencies installed
      - Database connected
      - Environment variables set
      - Build and tests passing
    Compounding: Catches blockers early (prevents wasted effort)

  Phase_3_DELEGATE:
    Command: "/delegate [todos pattern]"
    Purpose: "Distribute work to optimal agents"
    Features:
      - Smart agent selection based on historical performance
      - Parallel execution with collision detection
      - Sub-agent spawning for specialization
      - Real-time load balancing
    Compounding: Learns best agent assignments over time

  Phase_4_WORK:
    Command: "/work [work target]"
    Purpose: "Execute implementation with tracking"
    Features:
      - Loads persistent todos (todos/*.md)
      - Real-time progress tracking (TodoWrite)
      - Continuous monitoring (--monitor flag)
      - Quality gate enforcement
    Compounding: Applies learned patterns automatically

  Phase_5_CODIFY:
    Command: "/learn [feature branch]"
    Purpose: "Extract and store patterns for future use"
    Actions:
      - Analyze completed work (git diff, tests, docs)
      - Extract reusable patterns
      - Update effort estimates (planned vs actual)
      - Capture lessons learned ("watch out for X")
      - Update plan templates with real data
      - Store in RAG memory for retrieval
    Compounding: Future features benefit from this feature's learnings
```

### Compounding in Action (Example)

```yaml
Feature_1_User_Authentication:
  Week_1: "Implement from scratch"
  Effort: 28 hours
  Learnings:
    - "Use bcrypt with 12 rounds for password hashing"
    - "JWT expiry should be 24 hours for security"
    - "Add index on users.email for fast lookups"
    - "RLS policies prevent unauthorized access"

  After_Feature_1:
    Run: "/learn feature/auth"
    Result: "Patterns stored in RAG, template updated with real code examples"

Feature_2_Admin_Authentication:
  Week_2: "Implement with historical context"
  Effort: 19 hours (32% faster!)
  Why_Faster:
    - Template pre-filled with proven patterns
    - Code examples from Feature_1 surfaced automatically
    - No trial-and-error on bcrypt rounds or JWT expiry
    - Index patterns already known

  Compounding_Effect: 9 hours saved (from learning codification)

Feature_3_OAuth_Integration:
  Week_3: "Build on existing auth system"
  Effort: 15 hours (46% faster than baseline!)
  Why_Faster:
    - Auth template includes OAuth patterns now
    - Database schema reusable (just add oauth_providers table)
    - Frontend components extend existing AuthProvider

  Compounding_Effect: 13 hours saved (cumulative learning)
```

### Cursor 1.7 Hooks Enhance VELOCITY Workflow

The Cursor 1.7 hooks system **automatically** integrates with EVERY phases:

| Hook | EVERY Phase | Enhancement |
|------|-------------|-------------|
| `beforeSubmitPrompt` | PLAN | Suggests relevant agents based on prompt keywords |
| `beforeReadFile` | ASSESS | Tracks context for better planning |
| `beforeShellExecution` | ASSESS | Blocks destructive commands (safety) |
| `afterFileEdit` | CODIFY | Auto-updates RAG after code changes |
| `stop` | CODIFY | Saves session metrics, codifies learnings |

**Result**: Compounding happens automatically without manual intervention.

### Measuring Compounding Success

Track compounding effectiveness with these metrics:

```bash
# View feature velocity over time
/compounding-report

# Expected Output:
📊 Compounding Engineering Metrics (Last 30 Days)

Feature Velocity Trend:
  Week 1: 28 hours/feature (baseline)
  Week 2: 19 hours/feature (32% faster)
  Week 3: 15 hours/feature (46% faster)
  Week 4: 13 hours/feature (54% faster)

Pattern Reuse Rate: 73%
  - Templates used: 18/20 features
  - RAG patterns retrieved: 145 times
  - Code examples referenced: 67 times

Effort Estimate Accuracy: 87% (±20%)
  - Improving over time (was 65% in Week 1)

RAG Memory Growth:
  - Patterns stored: 234
  - Code examples: 156
  - Lessons learned: 89
  - Templates updated: 5

Compounding Score: 85/100 ✅
  → Compounding is working effectively!
```

### Quick Start with VELOCITY Workflow

```bash
# 1. Plan a feature (with templates + historical context)
/plan "Add user profile page"

# 2. Assess readiness (automated quality gates)
/assess "Add user profile page"

# 3. Execute work (agents coordinate automatically)
/work --monitor "Add user profile page"

# 4. Codify learnings (make next feature faster)
/learn "feature/user-profile"

# Result: Next similar feature will be 40% faster!
```

**See Also**:
- [Plan Command Documentation](.claude/commands/plan.md)
- [Assess Command Documentation](.claude/commands/assess.md)
- [Delegate Command Documentation](.claude/commands/delegate.md)
- [Work Command Documentation](.claude/commands/work.md)
- [Learn Command Documentation](.claude/commands/learn.md)
- [Compounding Engineering Philosophy](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it)

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

## 🔌 MCP Ecosystem Integration

VERSATIL Framework provides **12 production-ready MCP integrations** for comprehensive development capabilities:

### Core Development MCPs (5)
1. **Playwright/Chrome** - Browser automation for testing (Maria-QA, James-Frontend)
2. **Playwright Stealth** - Bot detection bypass + design scraping with 92% effectiveness (James-Frontend, Maria-QA)
3. **GitHub** - Repository operations and CI/CD (Marcus-Backend, Sarah-PM, Alex-BA)
4. **Exa** - AI-powered search and research (Alex-BA, Dr.AI-ML)
5. **GitMCP** - GitHub repository documentation access (Alex-BA, Marcus, James, Dr.AI-ML)

### AI/ML Operations MCPs (2)
5. **Vertex AI** - Google Cloud AI with Gemini models (Dr.AI-ML, Marcus-Backend)
6. **Supabase** - Vector database with pgvector for RAG (Marcus-Backend, Dr.AI-ML)

### Automation & Monitoring MCPs (6)
7. **n8n** - Workflow automation with 525+ nodes (Sarah-PM, Marcus, Maria-QA)
8. **Semgrep** - Security scanning for 30+ languages (Marcus-Backend, Maria-QA, Dr.AI-ML)
9. **Sentry** - Error monitoring with AI analysis (Maria-QA, Marcus, Sarah-PM)
10. **Shadcn** - Component library integration (James-Frontend)
11. **Ant Design** - React component system (James-Frontend)
12. **Claude Code** - Enhanced Claude Code integration

### GitMCP.io - GitHub Documentation Hub

**Purpose**: Transform any GitHub repository into a real-time documentation source for agents.

**Key Features**:
- **Zero Installation**: Remote MCP server (no local package)
- **Universal Access**: Query ANY public GitHub repository
- **Eliminate Hallucinations**: Up-to-date code context from repositories
- **Agent Research**: Enables agents to learn from successful implementations

**Use Cases**:
- **Alex-BA**: Research requirements patterns from similar projects
- **Marcus + Sub-Agents**: Access framework docs (Express, FastAPI, Rails, Go, Java)
- **James + Sub-Agents**: Study component patterns (React, Vue, Next.js, Angular, Svelte)
- **Maria-QA**: Find testing strategies from well-tested projects
- **Dr.AI-ML**: Access ML framework documentation and deployment patterns

**Configuration**:
```json
{
  "gitmcp": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://gitmcp.io/docs"],
    "description": "GitMCP for GitHub repository documentation access"
  }
}
```

**Agent Workflow Example**:
```yaml
User_Request: "Implement FastAPI authentication"

Marcus-Python_Workflow:
  1. Query GitMCP: "https://gitmcp.io/tiangolo/fastapi"
  2. Extract: OAuth2 patterns, security best practices
  3. Apply: Patterns to current implementation
  4. Store: Learnings in RAG memory for future use

Result: 40% faster implementation with proven patterns
```

### Playwright Stealth - Design Intelligence & Bot Bypass

**Purpose**: Enable ethical design research and reliable E2E testing through bot detection avoidance.

**Key Capabilities**:
- **92% Bot Detection Bypass**: Using `playwright-extra` + `puppeteer-extra-plugin-stealth`
- **Design System Extraction**: Colors, typography, spacing, layout patterns
- **Component Analysis**: Buttons, cards, forms, modals with accessibility metrics
- **Performance Benchmarking**: Load times, bundle sizes, request analysis
- **Accessibility Research**: WCAG compliance patterns from production sites

**Technical Implementation**:
```yaml
Stealth_Features:
  Detection_Avoidance:
    - "Patches navigator.webdriver flag"
    - "Simulates browser plugins"
    - "Fixes WebGL metadata fingerprints"
    - "Adds real browser quirks"

  Design_Scraping:
    - "Color palette extraction (CSS variables, computed styles)"
    - "Typography analysis (font families, sizes, weights)"
    - "Layout detection (flexbox, grid, responsive breakpoints)"
    - "Component structure parsing (React, Vue patterns)"

  Ethical_Safeguards:
    - "Rate limiting: 2 seconds between requests"
    - "Respects robots.txt (planned)"
    - "Public data only"
    - "Research purpose, not code copying"
    - "Audit logging for all scraping"
```

**Use Cases for James-Frontend**:

1. **Design Research**:
   ```typescript
   // Research competitor design system
   const report = await jamesDesignResearch.research('https://example.com');
   // Returns: colors, fonts, spacing, components, accessibility, performance
   ```

2. **Component Inspiration**:
   ```typescript
   // Analyze component patterns
   const components = await jamesDesignResearch.analyzeComponents('https://example.com');
   // Returns: button styles, card layouts, form patterns with accessibility data
   ```

3. **Accessibility Benchmarking**:
   ```typescript
   // Study WCAG compliance patterns
   const a11y = await jamesDesignResearch.checkAccessibility('https://example.com');
   // Returns: ARIA usage, landmarks, skip links, image alt text
   ```

4. **Performance Comparison**:
   ```typescript
   // Benchmark against competitors
   const perf = await jamesDesignResearch.benchmarkPerformance('https://example.com');
   // Returns: load times, bundle sizes, request counts
   ```

**Use Cases for Maria-QA**:
- Bypass anti-bot systems in E2E tests
- Test against real-world bot detection
- More reliable test automation (92% vs 60% success rate)

**Saved Reports**:
- Location: `~/.versatil/design-research/`
- Formats: JSON + Markdown
- Naming: `hostname_YYYY-MM-DD.{json,md}`
- Example: `airbnb-com_2025-01-19.md`

**Configuration**:
```json
{
  "playwright-stealth": {
    "command": "node",
    "args": ["/path/to/versatil-mcp.js"],
    "env": {
      "VERSATIL_STEALTH_MODE": "true",
      "VERSATIL_RATE_LIMIT": "2000"
    },
    "description": "Stealth scraping with ethical safeguards"
  }
}
```

**Agent Workflow Example**:
```yaml
User_Request: "Design a modern dashboard UI"

James-Frontend_Workflow:
  1. Research: "Scrape Vercel, Linear, Notion dashboards"
  2. Extract: "Color schemes, component patterns, layout grids"
  3. Analyze: "Accessibility compliance, performance metrics"
  4. Apply: "Adapt patterns to user's brand (not copy)"
  5. Build: "Create dashboard with proven UI patterns"
  6. Codify: "Store learnings for future dashboards"

Result:
  - Dashboard built 40% faster
  - WCAG AA compliant (learned from best practices)
  - Sub-2s load time (optimized from benchmarks)
  - Professional design (inspired by proven patterns)
```

**Ethical Guidelines**:
```yaml
Legal_Scraping_Only:
  Allowed:
    - "Public websites for design research"
    - "Competitor UIs for inspiration (not copying)"
    - "Accessibility pattern benchmarking"
    - "Performance comparison studies"

  Prohibited:
    - "Bypassing authentication/paywalls"
    - "Scraping private/proprietary data"
    - "Direct code copying"
    - "Excessive requests (DDoS)"
    - "Ignoring robots.txt directives"

Built_In_Protection:
  - "Rate limiting enforced (2s/request)"
  - "User-agent identifies as research bot"
  - "Audit logs track all scraping activity"
  - "Public data only validation"
```

**See Also**:
- Implementation: [src/mcp/playwright-stealth-executor.ts](src/mcp/playwright-stealth-executor.ts)
- Design Scraper: [src/mcp/design-scraper.ts](src/mcp/design-scraper.ts)
- James Integration: [src/agents/opera/james-frontend/design-research.ts](src/agents/opera/james-frontend/design-research.ts)
- Usage Guide: [docs/guides/design-scraping.md](docs/guides/design-scraping.md)

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

## 🔍 Framework Monitoring

### Real-Time Health Tracking

VERSATIL includes **comprehensive monitoring infrastructure** to track framework health, agent performance, and workflow execution.

**Quick Health Check:**
```bash
/monitor              # Quick health check (5 seconds)
npm run monitor       # Same via npm
```

**Output:**
- 🟢 Health score (0-100%)
- ✅ All 18 agents status (8 core + 10 sub-agents)
- ✅ Proactive system accuracy
- ✅ 5-Rule system efficiency
- ✅ Framework integrity check
- ⚠️ Issues + recommendations

**Interactive Dashboard:**
```bash
/monitor dashboard    # Launch interactive TUI
npm run dashboard     # Same via npm
```

**Features:**
- Real-time workflow visualization
- Live agent progress bars
- Data flow animation
- Node selection with metrics
- Keyboard navigation (arrow keys, Tab, Space)

**Monitoring Modes:**
```bash
/monitor              # Quick health check
/monitor dashboard    # Interactive dashboard
/monitor watch        # Continuous monitoring (every 60s)
/monitor report       # Generate comprehensive debug report
/monitor agents       # Show all agent metrics
/monitor logs         # View recent framework logs
/monitor stress       # Run stress tests
/monitor background start  # Start background monitor
```

**Health Score Interpretation:**
- 🟢 **90-100%**: Excellent health
- 🟡 **75-89%**: Good, minor issues
- 🟠 **50-74%**: Degraded, needs attention
- 🔴 **<50%**: Critical issues, run `/doctor --fix`

**What's Monitored:**
- **Agent Health** (30%): All 18 agents operational (8 core + 10 sub-agents)
- **Proactive System** (30%): Triggers + orchestration working
- **Rules Efficiency** (20%): 5 rules enabled and functional
- **Framework Integrity** (20%): Critical files present

**Production Monitoring:**
```bash
# Background monitoring (logs to .versatil/logs/)
npm run dashboard:background

# View logs
npm run dashboard:logs

# Stop background monitor
npm run dashboard:stop
```

**For troubleshooting:**
```bash
# Generate debug report (JSON + Markdown)
/monitor report

# Auto-fix issues
/doctor --fix

# Validate isolation
npm run validate:isolation
```

**See also:** [Complete Monitoring Guide](docs/guides/monitoring-guide.md)

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

Monitoring_Performance:
  - Health Check Time: < 5 seconds
  - Dashboard Refresh: 500ms (real-time)
  - StatusLine Update: 100ms
  - Background Monitor CPU: < 1%
  - Background Monitor RAM: < 50MB
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
**MCP Ecosystem**: ✅ 12 Integrations
**Last Updated**: 2025-10-12
**Maintained By**: Claude Opera by VERSATIL Team

---

## 📖 Further Reading

- **Agent Details**: `.claude/AGENTS.md` - Complete agent configuration
- **Rules System**: `.claude/rules/README.md` - 5-Rule automation details
- **Commands**: `.claude/commands/` - Slash command references
- **GitHub**: https://github.com/versatil-sdlc-framework
- **Documentation**: https://docs.versatil.dev