---
description: "Generate custom workflow commands for VERSATIL OPERA Framework"
argument-hint: "[command purpose]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
---

# Generate Custom Workflow Commands

## Introduction

Dynamically create custom workflow commands for VERSATIL OPERA Framework. This command generates new slash commands tailored to your project's specific needs, automatically updates plugin.json, and follows proven workflow command patterns (inspired by Compounding Engineering methodology).

## Command Specification

<command_spec> #$ARGUMENTS </command_spec>

## Main Tasks

### 1. Analyze Command Requirements

<thinking>
Understand what the custom command should do, which agents it involves, and what workflow pattern it follows.
</thinking>

**Requirement Gathering:**

```yaml
Command_Details:
  name: [command-name]  # e.g., "security-audit", "deploy-to-staging"
  description: [what it does]
  agents_involved: [list of OPERA agents]
  workflow_pattern: [plan|review|work|resolve|custom]
  arguments: [required, optional]
  output_format: [report|todos|action]
```

**Example Specifications:**

```yaml
Example_1_Security_Audit:
  name: security-audit
  description: "Comprehensive security audit of codebase with OWASP Top 10 validation"
  agents: [Marcus-Backend, Maria-QA]
  workflow: custom
  pattern:
    1. Scan codebase for vulnerabilities (Marcus)
    2. Run automated security tests (Maria)
    3. Generate findings report
    4. Create todos for critical issues
  arguments:
    - target: [directory path, default: src/]
    - depth: [shallow|deep, default: deep]

Example_2_Deploy_Feature:
  name: deploy-feature
  description: "Deploy feature branch to staging with automated validation"
  agents: [Marcus-Backend, Maria-QA, Sarah-PM]
  workflow: sequential
  pattern:
    1. Run full test suite (Maria)
    2. Build for staging (Marcus)
    3. Deploy to staging environment (Marcus)
    4. Run smoke tests (Maria)
    5. Update deployment docs (Sarah)
  arguments:
    - branch: [branch name, required]
    - skip-tests: [boolean, default: false]

Example_3_Refactor_Analysis:
  name: refactor-analysis
  description: "Analyze codebase for refactoring opportunities"
  agents: [Marcus-Backend, James-Frontend, Maria-QA]
  workflow: parallel-research
  pattern:
    1. Identify code smells (all agents parallel)
    2. Calculate complexity metrics
    3. Find duplication
    4. Generate refactoring recommendations
  arguments:
    - files: [glob pattern, default: "**/*.{ts,tsx,js,jsx}"]
```

### 2. Select Command Template ⭐ AGENT-DRIVEN (Sarah-PM)

<thinking>
Use Sarah-PM to strategically select optimal template and validate workflow orchestration design based on her project management expertise.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Validate command orchestration design"`
- `prompt: "Select optimal command template and validate orchestration for '${command_purpose}' from Step 1 requirements analysis. Input: Command requirements (purpose, workflow pattern, agents needed, expected inputs/outputs, complexity level). Your strategic PM orchestration: (1) Analyze workflow pattern (is it research-heavy, action-heavy, review-focused, or hybrid?), (2) Select optimal template type (Type 1 Research, Type 2 Action, Type 3 Review, Type 4 Hybrid), (3) Validate agent assignments (are selected agents appropriate for tasks? any gaps? any redundancies?), (4) Design execution waves (which steps run parallel vs sequential? what are dependencies?), (5) Define coordination checkpoints (when do agents hand off? what quality gates between waves?), (6) Assess template quality (does selected template support all requirements? any missing phases?), (7) Identify orchestration risks (coordination complexity, agent overload, missing handoffs). Return: { selected_template: 'type_1'|'type_2'|'type_3'|'type_4', template_name: string, confidence_score: number, justification: string, agent_assignments: [{agent, phase, tasks: []}], execution_waves: [{wave_number, agents: [], parallel: boolean, dependencies: []}], coordination_checkpoints: [{checkpoint_name, blocking: boolean, quality_gates: []}], template_gaps: [], orchestration_risks: [], recommendations: [] }"`

**Expected Sarah-PM Output:**

```typescript
interface CommandOrchestrationResult {
  selected_template: 'type_1' | 'type_2' | 'type_3' | 'type_4';
  template_name: string;              // e.g., "Research Command", "Hybrid Command"
  confidence_score: number;           // 0-100 (confidence in template selection)
  justification: string;              // Why this template is optimal

  agent_assignments: Array<{
    agent: string;                    // e.g., "Marcus-Backend", "Maria-QA"
    phase: string;                    // e.g., "Security Analysis", "Quality Validation"
    tasks: string[];                  // e.g., ["OWASP Top 10 scan", "SQL injection check"]
    estimated_effort: string;         // e.g., "15 minutes", "1 hour"
  }>;

  execution_waves: Array<{
    wave_number: number;              // 1, 2, 3, 4
    wave_name: string;                // e.g., "Parallel Security Scans"
    agents: string[];                 // Agents in this wave
    parallel: boolean;                // true = agents run concurrently
    dependencies: string[];           // Wave dependencies (e.g., ["wave_1", "wave_2"])
    estimated_duration: string;       // e.g., "20 minutes"
  }>;

  coordination_checkpoints: Array<{
    checkpoint_name: string;          // e.g., "Security Scan Complete"
    location: string;                 // e.g., "After Wave 1", "Before Wave 3"
    blocking: boolean;                // true = must complete before proceeding
    quality_gates: string[];          // e.g., ["All vulnerabilities documented", "CVSS scores calculated"]
    handoff_agents: {from: string, to: string, context: string}[];
  }>;

  template_gaps: Array<{
    gap: string;                      // e.g., "Missing accessibility validation phase"
    severity: 'low' | 'medium' | 'high';
    recommendation: string;           // How to address the gap
  }>;

  orchestration_risks: Array<{
    risk: string;                     // e.g., "Marcus-Backend and Maria-QA may have overlapping tasks"
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;               // How to reduce the risk
  }>;

  recommendations: string[];          // Additional strategic recommendations
}
```

**Orchestration Validation Examples:**

```typescript
// Example 1: Security Audit Command
const requirements = {
  purpose: "Comprehensive security audit with OWASP Top 10 validation",
  workflow_pattern: "research + review",
  agents_needed: ["Marcus-Backend", "Maria-QA"],
  complexity: "medium"
};

// Sarah-PM's analysis:
const orchestration = {
  selected_template: "type_3",  // Review Command
  template_name: "Review Command",
  confidence_score: 92,
  justification: "Security audit is review-focused: analyze code → identify issues → create todos. Type 3 Review template provides isolated environment, parallel agent review, and findings synthesis.",

  agent_assignments: [
    {
      agent: "Marcus-Backend",
      phase: "Security Vulnerability Scan",
      tasks: [
        "OWASP Top 10 validation (A01-A10)",
        "SQL injection detection",
        "Authentication bypass checks",
        "API security analysis"
      ],
      estimated_effort: "15 minutes"
    },
    {
      agent: "Maria-QA",
      phase: "Quality & Security Testing",
      tasks: [
        "Test coverage analysis (>=80% for security paths)",
        "Security test validation",
        "SAST tool execution (Semgrep)",
        "Accessibility audit (WCAG 2.1 AA)"
      ],
      estimated_effort: "12 minutes"
    }
  ],

  execution_waves: [
    {
      wave_number: 1,
      wave_name: "Parallel Security Analysis",
      agents: ["Marcus-Backend", "Maria-QA"],
      parallel: true,  // Both agents run concurrently
      dependencies: [],
      estimated_duration: "15 minutes"  // Max of both agents
    },
    {
      wave_number: 2,
      wave_name: "Findings Synthesis",
      agents: ["Victor-Verifier"],
      parallel: false,
      dependencies: ["wave_1"],
      estimated_duration: "3 minutes"
    },
    {
      wave_number: 3,
      wave_name: "Todo Creation",
      agents: [],  // User-driven triage
      parallel: false,
      dependencies: ["wave_2"],
      estimated_duration: "10 minutes"
    }
  ],

  coordination_checkpoints: [
    {
      checkpoint_name: "Security Scan Complete",
      location: "After Wave 1",
      blocking: true,  // MUST complete before synthesis
      quality_gates: [
        "Marcus completed OWASP Top 10 scan",
        "Maria completed test coverage analysis",
        "All findings have CVSS scores",
        "Code examples extracted for each vulnerability"
      ],
      handoff_agents: [
        {
          from: "Marcus-Backend",
          to: "Victor-Verifier",
          context: "Security findings with file:line references and CVSS scores"
        },
        {
          from: "Maria-QA",
          to: "Victor-Verifier",
          context: "Quality findings with coverage gaps and test recommendations"
        }
      ]
    },
    {
      checkpoint_name: "Findings Verified",
      location: "After Wave 2",
      blocking: true,
      quality_gates: [
        "All findings verified for authenticity (no hallucinations)",
        "Evidence score >= 85/100",
        "False positives removed",
        "Severity ratings corrected"
      ],
      handoff_agents: [
        {
          from: "Victor-Verifier",
          to: "User",
          context: "Verified findings ready for triage"
        }
      ]
    }
  ],

  template_gaps: [],  // No gaps - Type 3 fully supports security audit

  orchestration_risks: [
    {
      risk: "Marcus-Backend and Maria-QA may find duplicate issues",
      likelihood: "medium",
      impact: "low",
      mitigation: "Use Victor-Verifier to deduplicate findings in Wave 2"
    }
  ],

  recommendations: [
    "Add Victor-Verifier after parallel scans to prevent hallucinated vulnerabilities",
    "Consider adding Oliver-MCP for environment variable security checks",
    "Set blocking checkpoint after Wave 1 to ensure scan quality before synthesis"
  ]
};
```

```typescript
// Example 2: Feature Implementation Command (Hybrid)
const requirements = {
  purpose: "Implement user authentication with OAuth2 + JWT",
  workflow_pattern: "research → plan → execute → validate",
  agents_needed: ["Alex-BA", "Dana-Database", "Marcus-Backend", "James-Frontend", "Maria-QA"],
  complexity: "high"
};

// Sarah-PM's analysis:
const orchestration = {
  selected_template: "type_4",  // Hybrid Command
  template_name: "Hybrid Command",
  confidence_score: 88,
  justification: "Feature implementation requires research (requirements), planning (architecture), execution (code), and validation (tests). Type 4 Hybrid supports all phases with proper sequencing.",

  agent_assignments: [
    { agent: "Alex-BA", phase: "Requirements Analysis", tasks: ["Define user stories", "Create acceptance criteria", "Identify edge cases"], estimated_effort: "20 minutes" },
    { agent: "Dana-Database", phase: "Database Design", tasks: ["Create users table schema", "Add RLS policies", "Create indexes"], estimated_effort: "15 minutes" },
    { agent: "Marcus-Backend", phase: "API Implementation", tasks: ["OAuth2 endpoints", "JWT token generation", "Session management"], estimated_effort: "45 minutes" },
    { agent: "James-Frontend", phase: "UI Implementation", tasks: ["Login form", "OAuth callback handling", "Session persistence"], estimated_effort: "30 minutes" },
    { agent: "Maria-QA", phase: "Quality Validation", tasks: ["80%+ test coverage", "Security tests", "E2E auth flow"], estimated_effort: "25 minutes" }
  ],

  execution_waves: [
    { wave_number: 1, wave_name: "Requirements Research", agents: ["Alex-BA"], parallel: false, dependencies: [], estimated_duration: "20 minutes" },
    { wave_number: 2, wave_name: "Database + API Planning", agents: ["Dana-Database", "Marcus-Backend"], parallel: true, dependencies: ["wave_1"], estimated_duration: "15 minutes" },
    { wave_number: 3, wave_name: "Backend Implementation", agents: ["Marcus-Backend"], parallel: false, dependencies: ["wave_2"], estimated_duration: "45 minutes" },
    { wave_number: 4, wave_name: "Frontend + Testing", agents: ["James-Frontend", "Maria-QA"], parallel: true, dependencies: ["wave_3"], estimated_duration: "30 minutes" }
  ],

  coordination_checkpoints: [
    {
      checkpoint_name: "Requirements Approved",
      location: "After Wave 1",
      blocking: true,
      quality_gates: ["User stories defined", "Acceptance criteria clear", "Edge cases documented"],
      handoff_agents: [{ from: "Alex-BA", to: "Dana-Database + Marcus-Backend", context: "Approved requirements with API contracts" }]
    },
    {
      checkpoint_name: "Database Schema Ready",
      location: "After Wave 2",
      blocking: true,
      quality_gates: ["Tables created", "RLS policies tested", "Indexes verified"],
      handoff_agents: [{ from: "Dana-Database", to: "Marcus-Backend", context: "Database connection string and schema documentation" }]
    },
    {
      checkpoint_name: "API Endpoints Complete",
      location: "After Wave 3",
      blocking: true,
      quality_gates: ["OAuth2 flow working", "JWT tokens validated", "Session management tested"],
      handoff_agents: [
        { from: "Marcus-Backend", to: "James-Frontend", context: "API endpoint documentation and example requests" },
        { from: "Marcus-Backend", to: "Maria-QA", context: "API test cases and coverage requirements" }
      ]
    }
  ],

  template_gaps: [],

  orchestration_risks: [
    {
      risk: "Wave 4 parallel execution (James + Maria) may conflict if James doesn't finish UI before Maria tests",
      likelihood: "medium",
      impact: "medium",
      mitigation: "Add checkpoint: James completes login form → Maria can start E2E tests"
    }
  ],

  recommendations: [
    "Add sub-checkpoint in Wave 4: James finishes login form → Maria starts E2E tests",
    "Consider adding security review checkpoint after Wave 3 (Marcus-Backend security validation)",
    "Estimate total duration: ~2 hours (sum of wave durations with 10% buffer)"
  ]
};
```

**Template Quality Validation:**

After Sarah-PM selects template, validate it meets all requirements:

```typescript
// Quality gate checks
const templateQuality = {
  completeness_score: 0,  // 0-100
  missing_phases: [],
  redundant_steps: [],
  coordination_issues: []
};

// Check 1: All required agents have phases
requirements.agents_needed.forEach(agent => {
  const hasPhase = orchestration.agent_assignments.some(a => a.agent === agent);
  if (!hasPhase) {
    templateQuality.missing_phases.push(`Agent ${agent} has no assigned phase`);
    templateQuality.completeness_score -= 20;
  }
});

// Check 2: All execution waves have clear dependencies
orchestration.execution_waves.forEach((wave, index) => {
  if (index > 0 && wave.dependencies.length === 0) {
    templateQuality.coordination_issues.push(`Wave ${wave.wave_number} has no dependencies but is not first wave`);
    templateQuality.completeness_score -= 10;
  }
});

// Check 3: All blocking checkpoints have quality gates
orchestration.coordination_checkpoints
  .filter(cp => cp.blocking)
  .forEach(cp => {
    if (cp.quality_gates.length === 0) {
      templateQuality.coordination_issues.push(`Blocking checkpoint "${cp.checkpoint_name}" has no quality gates`);
      templateQuality.completeness_score -= 15;
    }
  });

// Check 4: No agent overload (too many tasks)
orchestration.agent_assignments.forEach(assignment => {
  if (assignment.tasks.length > 8) {
    templateQuality.redundant_steps.push(`Agent ${assignment.agent} overloaded with ${assignment.tasks.length} tasks - consider splitting`);
    templateQuality.completeness_score -= 10;
  }
});

// Final score
templateQuality.completeness_score = Math.max(0, 100 + templateQuality.completeness_score);

if (templateQuality.completeness_score < 70) {
  console.log("⚠️ TEMPLATE QUALITY BELOW THRESHOLD");
  console.log(`Score: ${templateQuality.completeness_score}/100`);
  console.log("Issues:", templateQuality);
  console.log("Recommendation: Select different template or address gaps");
}
```

---

**Template Types:**

```yaml
Type_1_Research_Command:
  pattern: "Gather information, analyze, generate report"
  use_cases: [audits, analysis, diagnostics]
  structure:
    - Introduction & context
    - Parallel research phase (Task agents)
    - Synthesis & findings
    - Report generation
  examples: [plan, framework-debug]

Type_2_Action_Command:
  pattern: "Execute tasks, validate, complete"
  use_cases: [deployments, builds, migrations]
  structure:
    - Prerequisites validation
    - Sequential execution steps
    - Quality gates
    - Completion confirmation
  examples: [work, resolve]

Type_3_Review_Command:
  pattern: "Analyze code, identify issues, create todos"
  use_cases: [code review, security audit, quality check]
  structure:
    - Setup isolated environment
    - Parallel agent review
    - Findings synthesis
    - Todo creation
  examples: [review, triage]

Type_4_Hybrid_Command:
  pattern: "Research → Action → Validation"
  use_cases: [feature implementation, complex workflows]
  structure:
    - Research phase (parallel)
    - Planning phase (synthesis)
    - Execution phase (sequential/parallel)
    - Validation & completion
  examples: [Custom enterprise workflows]
```

### 3. Generate Command File

<thinking>
Create markdown command file in .claude/commands/ with complete VERSATIL structure.
</thinking>

**Generated Command Example (security-audit.md):**

```markdown
# Security Audit with OPERA Agents

## Introduction

Perform comprehensive security audit of your codebase using VERSATIL's OPERA agents (Marcus-Backend + Maria-QA) with OWASP Top 10 validation, automated vulnerability scanning, and actionable remediation todos.

## Audit Target

<audit_target> #$ARGUMENTS </audit_target>

## Main Tasks

### 1. Initialize Security Scan

<thinking>
Identify all code that handles sensitive operations: authentication, authorization, data access, external inputs.
</thinking>

**Scope Definition:**

- [ ] Parse arguments (target directory, depth level)
- [ ] Identify security-critical files:
  - Authentication: `**/auth/**`, `**/login/**`
  - Authorization: `**/middleware/**`, `**/guards/**`
  - Data Access: `**/api/**`, `**/models/**`
  - Input Handling: `**/forms/**`, `**/validation/**`
- [ ] List files to audit
- [ ] Estimate audit duration

### 2. Parallel Security Analysis

<thinking>
Run Marcus-Backend and Maria-QA in parallel for comprehensive security review.
</thinking>

**Parallel Execution:**

- Task marcus-backend(security_scan_backend)
  - OWASP Top 10 validation
  - Input validation review
  - SQL injection detection
  - Authentication/authorization checks
  - Sensitive data exposure review

- Task maria-qa(security_test_suite)
  - Run security tests
  - Penetration testing (automated)
  - Vulnerability scanning (SAST)
  - Dependency vulnerability check (npm audit)
  - Test coverage for security paths

### 3. Findings Analysis

<thinking>
Synthesize findings from both agents, categorize by severity, and create actionable recommendations.
</thinking>

**Categorization:**

```yaml
Critical_Findings: (P0 - Immediate action)
  - SQL injection vulnerabilities
  - Authentication bypass
  - Sensitive data exposure
  - Remote code execution
  - Privilege escalation

High_Priority: (P1 - Fix soon)
  - Missing input validation
  - Insecure session management
  - Missing rate limiting
  - Outdated dependencies with CVEs
  - Insufficient logging

Medium_Priority: (P2 - Should fix)
  - Missing security headers
  - Weak password policies
  - Incomplete error handling
  - Missing CSRF protection

Low_Priority: (P3 - Nice to have)
  - Security best practice improvements
  - Additional security tests
  - Enhanced monitoring
```

### 4. Generate Security Report

**Report Structure:**

```markdown
# Security Audit Report

## Executive Summary
- **Audit Date**: [timestamp]
- **Target**: [directory]
- **Files Scanned**: [count]
- **Vulnerabilities Found**: [count]
- **Risk Level**: [Critical/High/Medium/Low]

## Critical Findings (P0): [count]
[List with file paths, descriptions, CVSS scores]

## High Priority (P1): [count]
[List with remediation steps]

## OWASP Top 10 Compliance
- [A01:2021 - Broken Access Control]: [Pass/Fail + details]
- [A02:2021 - Cryptographic Failures]: [Pass/Fail + details]
[... all 10 ...]

## Recommendations
[Prioritized action items]

## Created Todos
[List of todos/*.md files created for findings]
```

### 5. Create Security Todos

- [ ] For each critical/high finding, create todo file
- [ ] Assign to Marcus-Backend
- [ ] Set priority based on severity
- [ ] Include remediation steps
- [ ] Add acceptance criteria

### 6. Quality Gates Integration

**Automatic Blocking:**
- ❌ Block merges if critical (P0) vulnerabilities found
- ⚠️ Warn on high priority (P1) vulnerabilities
- ℹ️ Inform on medium/low priority findings

## Audit Modes

### 🔍 SHALLOW (Quick Scan)
- Target: Changed files only
- Duration: 5-10 minutes
- Depth: Surface-level checks

### 📋 STANDARD (Full Scan)
- Target: All source files
- Duration: 20-30 minutes
- Depth: Comprehensive OWASP Top 10

### 📚 DEEP (Comprehensive)
- Target: All files + dependencies
- Duration: 1-2 hours
- Depth: Full penetration testing simulation

## Output Format

1. **Security Report** (comprehensive findings)
2. **OWASP Compliance Matrix** (pass/fail per category)
3. **Created Todos** (for remediation)
4. **Risk Assessment** (overall security posture)
5. **Next Steps** (recommended actions)

---

**Framework Integration:**
- **Rule 1**: Parallel agent execution (Marcus + Maria)
- **Rule 2**: Auto-generate security tests
- **Rule 3**: Daily security audits
- **Agents**: Marcus-Backend, Maria-QA
- **Output**: Security report + remediation todos
```

### 4. Update plugin.json

<thinking>
Add new command to plugin.json commands section automatically.
</thinking>

**Plugin Update:**

```json
// Before
{
  "commands": {
    "workflow": [
      ".claude/commands/plan.md",
      ".claude/commands/review.md",
      ".claude/commands/work.md",
      ".claude/commands/resolve.md",
      ".claude/commands/triage.md",
      ".claude/commands/generate.md"
    ]
  }
}

// After
{
  "commands": {
    "workflow": [
      ".claude/commands/plan.md",
      ".claude/commands/review.md",
      ".claude/commands/work.md",
      ".claude/commands/resolve.md",
      ".claude/commands/triage.md",
      ".claude/commands/generate.md"
    ],
    "security": [
      ".claude/commands/security-audit.md"
    ]
  }
}
```

### 5. Generate Command Documentation

<thinking>
Create usage documentation for the new command.
</thinking>

**Documentation Template:**

```markdown
# security-audit Command

## Description
Comprehensive security audit using Marcus-Backend and Maria-QA with OWASP Top 10 validation.

## Usage

### Basic
```bash
/versatil:security-audit
# Audits src/ directory with standard depth
```

### With Arguments
```bash
/versatil:security-audit target:src/api depth:deep
# Deep audit of API directory

/versatil:security-audit target:src/components depth:shallow
# Quick scan of components
```

### Options
- `target`: Directory to audit (default: src/)
- `depth`: Scan depth (shallow|standard|deep, default: standard)

## Output
- Security report in docs/security/audit-[timestamp].md
- OWASP compliance matrix
- Remediation todos in todos/
- Risk assessment summary

## When to Use
- Before releases
- After major feature additions
- Weekly as part of CI/CD
- After dependency updates
- When security concerns arise

## Integration
- **Quality Gates**: Blocks merge on P0 findings
- **CI/CD**: Can run in automated pipeline
- **Agents**: Uses Marcus-Backend (security analysis) + Maria-QA (security testing)
- **Rule 1**: Parallel execution for speed

## Examples

### Pre-Release Audit
```bash
/versatil:security-audit depth:deep
→ Full comprehensive audit
→ Generates complete security report
→ Creates todos for all findings
→ Blocks release if P0 found
```

### Quick Check After PR
```bash
git diff main...HEAD --name-only > changed-files.txt
/versatil:security-audit target:changed-files depth:shallow
→ Fast audit of changed files only
→ Quick feedback (5-10 mins)
→ Good for rapid iteration
```

## Related Commands
- `/versatil:review` - General code review (includes security)
- `/versatil:triage` - Triage security findings into todos
- `/versatil:resolve` - Fix security todos in parallel
```

### 6. Test Command

<thinking>
Validate the generated command works correctly before finalizing.
</thinking>

**Testing Steps:**

```yaml
Test_1_Syntax:
  - Read generated .md file
  - Validate markdown syntax
  - Check for completeness
  - Verify agent references

Test_2_Plugin_Integration:
  - Verify plugin.json updated correctly
  - Check command path is correct
  - Validate JSON syntax

Test_3_Execution:
  - Run /versatil:security-audit (dry run)
  - Verify agents activate correctly
  - Check output format
  - Validate todo creation

Test_4_Documentation:
  - Verify usage examples work
  - Check all arguments accepted
  - Validate error handling
```

### 7. Finalize & Register

<thinking>
Finalize command, update framework documentation, and make available to users.
</thinking>

**Finalization Checklist:**

- [x] Command file created: `.claude/commands/security-audit.md`
- [x] plugin.json updated with command reference
- [x] Documentation generated: `docs/commands/security-audit.md`
- [x] Tests passed (syntax, integration, execution)
- [x] Examples validated
- [x] Agent assignments confirmed
- [x] Error handling included

**Registration:**

```bash
# Reload Claude Code to pick up new command
# OR restart Claude Desktop

# Command now available:
/versatil:security-audit
```

## Command Generation Patterns

### Pattern 1: Single-Agent Command

```yaml
Structure:
  - Simple, focused task
  - One agent performs all work
  - Linear workflow

Example: /versatil:accessibility-audit
  - Agent: James-Frontend
  - Steps: Scan, Report, Create Todos
  - Duration: 15-20 minutes
```

### Pattern 2: Multi-Agent Sequential

```yaml
Structure:
  - Multiple agents, one after another
  - Each builds on previous output
  - Handoff between agents

Example: /versatil:feature-complete
  - Step 1: Alex-BA validates requirements
  - Step 2: Marcus/James implement
  - Step 3: Maria-QA validates quality
  - Step 4: Sarah-PM updates docs
```

### Pattern 3: Multi-Agent Parallel

```yaml
Structure:
  - Multiple agents work simultaneously
  - Independent analysis
  - Synthesize results at end

Example: /versatil:code-quality-check
  - Parallel: Marcus (backend), James (frontend), Maria (tests)
  - Duration: max(agent times) not sum
  - Synthesis: Combined quality report
```

### Pattern 4: Hybrid Workflow

```yaml
Structure:
  - Parallel research phase
  - Sequential execution phase
  - Parallel validation phase

Example: /versatil:optimize-performance
  - Phase 1: Parallel profiling (all agents)
  - Phase 2: Sequential fixes (by priority)
  - Phase 3: Parallel validation (all agents)
```

## Generated Command Categories

### Security Commands
- `/security-audit` - OWASP Top 10 compliance
- `/penetration-test` - Automated security testing
- `/dependency-scan` - CVE vulnerability check

### Performance Commands
- `/performance-audit` - Speed & optimization analysis
- `/bundle-analysis` - Frontend bundle size review
- `/query-optimization` - Database query profiling

### Quality Commands
- `/code-quality-check` - Comprehensive quality review
- `/accessibility-audit` - WCAG 2.1 compliance
- `/test-coverage-report` - Coverage analysis

### Deployment Commands
- `/deploy-staging` - Deploy to staging environment
- `/deploy-production` - Production deployment
- `/rollback` - Rollback to previous version

### Documentation Commands
- `/generate-api-docs` - Auto-generate API documentation
- `/update-changelog` - Create changelog entry
- `/create-migration-guide` - Migration guide for breaking changes

## Template Library

**Available Templates:**

```yaml
Templates:
  research-command:
    file: templates/research-command-template.md
    use: Information gathering, analysis
    agents: Any combination

  action-command:
    file: templates/action-command-template.md
    use: Execute tasks, deployments
    agents: Execution-focused (Marcus, James)

  review-command:
    file: templates/review-command-template.md
    use: Code review, audits
    agents: Quality-focused (Maria, Marcus, James)

  workflow-command:
    file: templates/workflow-command-template.md
    use: Multi-step processes
    agents: All OPERA agents

  custom-command:
    file: templates/custom-command-template.md
    use: Unique workflows
    agents: User-specified
```

## Output Format

1. **Command Specification** (parsed requirements)
2. **Generated Command File** (markdown in .claude/commands/)
3. **Updated plugin.json** (command registered)
4. **Documentation** (usage guide)
5. **Test Results** (validation report)
6. **Registration Confirmation** (ready to use)

**Example Output:**

```markdown
## Command Generated Successfully ✅

**Command Name**: /versatil:security-audit
**File Created**: .claude/commands/security-audit.md
**Plugin Updated**: .claude-plugin/plugin.json
**Documentation**: docs/commands/security-audit.md

### Command Details:
- **Agents**: Marcus-Backend, Maria-QA
- **Workflow**: Parallel research → Synthesis → Todo creation
- **Duration**: 20-30 minutes (standard depth)
- **Arguments**:
  - target: [directory] (default: src/)
  - depth: [shallow|standard|deep] (default: standard)

### Usage:
```bash
# Basic usage
/versatil:security-audit

# With arguments
/versatil:security-audit target:src/api depth:deep
```

### Testing:
- ✅ Syntax validation passed
- ✅ Plugin integration successful
- ✅ Dry run completed
- ✅ Documentation generated

### Next Steps:
1. Restart Claude Code to load new command
2. Run test: /versatil:security-audit target:src depth:shallow
3. Review output and iterate if needed
4. Share command with team

**Command is ready to use!**
```

---

**Framework Integration:**
- **Rule 1**: Generated commands can use parallel execution
- **Rule 2**: Can auto-generate tests during command execution
- **Rule 3**: Daily audits track command usage and effectiveness
- **Rule 4**: Zero-config agent activation in generated commands
- **Rule 5**: Generated commands integrate with release automation
- **Template System**: Reusable patterns for consistent command structure
- **Plugin System**: Automatic registration in Claude Code
