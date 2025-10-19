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

### 2. Select Command Template

<thinking>
Based on workflow pattern, select appropriate template structure using proven command patterns.
</thinking>

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
