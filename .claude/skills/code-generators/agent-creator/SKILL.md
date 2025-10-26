---
name: agent-creator
description: Generate new OPERA agent definitions from templates with YAML frontmatter, sub-agent routing, and handoff contracts. Use when creating new agents, implementing specializations, or adding sub-agents. Provides agent-template.md with placeholders for 5-10x faster agent creation vs from-scratch.
tags: [code-generation, agents, templates, opera, handoffs]
---

# agent-creator - OPERA Agent Generator

**Purpose**: Generate new OPERA agent definitions using proven templates

## When to Use

- Creating new OPERA agents (core or sub-agents)
- Implementing agent specializations (frontend frameworks, backend languages)
- Adding sub-agent routing logic with confidence levels
- Defining handoff contracts between agents
- Setting up auto-activation triggers (file patterns, keywords)

## What This Skill Provides

- **agent-template.md**: Complete agent definition template with {{placeholders}}
- **5-10x faster**: Template-based vs from-scratch agent creation
- **Consistent structure**: YAML frontmatter + systemPrompt + examples + handoffs
- **Sub-agent routing**: Built-in confidence level patterns
- **Proven patterns**: Based on 8 production OPERA agents

## Quick Start

### 1. Copy Template
```bash
cp .claude/skills/code-generators/agent-creator/assets/agent-template.md \
   .claude/agents/your-agent.md
```

### 2. Replace Placeholders

**Required placeholders:**
- `{{AGENT_NAME}}` - Agent name (e.g., "Sarah-PM", "Marcus-Backend")
- `{{AGENT_ROLE}}` - Role description (e.g., "Project Manager", "Backend Engineer")
- `{{TRIGGER_CONDITIONS}}` - When to use (e.g., "coordinating multi-agent workflows")
- `{{SPECIALIZATIONS}}` - Core expertise (e.g., "OPERA orchestration, planning")
- `{{PRIORITY}}` - Priority level (high, medium, low)

**Example:**
```yaml
name: "Sarah-PM"
role: "Project Manager & Orchestrator"
description: "Use PROACTIVELY when coordinating multi-agent workflows, making strategic decisions, or planning sprints."
```

### 3. Customize Sections

**Tools & Directories:**
```yaml
tools:
  - "Read"
  - "Write"
  - "Bash(git:*)"  # Replace {{ALLOWED_BASH}}
allowedDirectories:
  - ".claude/"      # Replace {{ALLOWED_DIR_1}}
  - "docs/"         # Replace {{ALLOWED_DIR_2}}
```

**Expertise & Standards:**
```markdown
Your expertise:
- Multi-agent coordination and workflow orchestration
- OPERA phase management (OBSERVE → PLAN → EXECUTE → REFINE → CODIFY → ARCHIVE)
- Dependency resolution and parallel task execution
- Human-in-the-loop checkpoints and approval gates
- Strategic decision making and conflict resolution
```

**Sub-Agents (if applicable):**
```yaml
sub_agents:
  - "sarah-epic-orchestrator"
  - "sarah-sprint-planner"
```

### 4. Add Examples

```markdown
## Examples

### User Request
"Plan a three-tier authentication feature"

### Context
User wants JWT authentication with React frontend and Node.js backend

### Response
"I'll create a multi-agent plan coordinating Dana-Database, Marcus-Backend, and James-Frontend..."

[Detailed plan with phases, dependencies, checkpoints]

### Commentary
This demonstrates Sarah-PM's orchestration capabilities - breaking down complex features into coordinated agent tasks with clear dependencies and handoff points.
```

## Template Placeholders Reference

### Agent Metadata (YAML)
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{AGENT_NAME}}` | Agent identifier | "Maria-QA" |
| `{{AGENT_ROLE}}` | Role title | "Quality Assurance Engineer" |
| `{{TRIGGER_CONDITIONS}}` | Auto-activation triggers | "writing tests, reviewing code quality" |
| `{{SPECIALIZATIONS}}` | Core expertise | "80%+ coverage, quality gates" |
| `{{PRIORITY}}` | Priority level | "high", "medium", "low" |
| `{{ALLOWED_BASH}}` | Allowed bash prefixes | "npm", "jest", "git" |

### System Prompt
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{EXPERTISE_1-5}}` | 5 key expertise areas | "Jest unit testing", "Integration tests" |
| `{{QUALITY_STANDARD_1-3}}` | 3 quality standards | "80%+ test coverage", "BMAD enforced" |
| `{{NUM_SUB_AGENTS}}` | Number of sub-agents | "2", "5", "none" |

### Sub-Agent Routing
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{FRAMEWORK_1}}` | Framework name | "React", "Jest", "PostgreSQL" |
| `{{FRAMEWORK_1_PATTERNS}}` | Detection patterns | "import from 'react', useState, .tsx" |
| `{{SUB_AGENT_1_DESC}}` | Sub-agent description | "React 18+ with hooks, Server Components" |

### Examples Section
| Placeholder | Description |
|-------------|-------------|
| `{{EXAMPLE_USER_REQUEST}}` | Realistic user request |
| `{{EXAMPLE_CONTEXT}}` | Situation context |
| `{{EXAMPLE_RESPONSE}}` | Agent's response |
| `{{EXAMPLE_COMMENTARY}}` | Explanation of behavior |

### Patterns Section
| Placeholder | Description |
|-------------|-------------|
| `{{PATTERN_1_NAME}}` | Pattern title |
| `{{PATTERN_1_DESC}}` | What problem it solves |
| `{{PATTERN_1_CODE}}` | Code example |
| `{{PATTERN_1_LANG}}` | Language (typescript, python, etc) |

### Auto-Activation
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{FILE_PATTERN_1}}` | File glob pattern | "**/*.test.ts", "src/api/**/*.ts" |
| `{{CODE_PATTERN_1}}` | Code regex pattern | "describe\\(", "it\\(" |
| `{{KEYWORD_1}}` | Trigger keyword | "test", "quality", "coverage" |

## Asset-Based Workflow

**Advantage**: Copy → Customize vs Regenerate from Scratch

### Before (Regeneration - Slow)
```
1. Describe agent requirements to LLM
2. LLM generates agent from scratch
3. Review and iterate (3-5 rounds)
4. Total time: 30-60 minutes
```

### After (Template - Fast)
```
1. Copy agent-template.md
2. Replace {{placeholders}} (5-10 minutes)
3. Customize examples and patterns
4. Total time: 10-15 minutes (5-6x faster)
```

## Validation Checklist

Before committing new agent:

- [ ] All required placeholders replaced (no `{{}}` remaining)
- [ ] YAML frontmatter valid (test with `npx js-yaml agent.md`)
- [ ] systemPrompt defines clear expertise (5+ bullets)
- [ ] Quality standards specified (3+ standards)
- [ ] At least 1 example with user/response/commentary
- [ ] Auto-activation triggers defined (file patterns + keywords)
- [ ] Handoff contract template included (if agent hands off work)
- [ ] Sub-agent routing logic (if applicable)

## Testing New Agent

```bash
# 1. Validate YAML
npx js-yaml .claude/agents/your-agent.md

# 2. Test auto-activation (edit matching file)
touch src/test-file.ext

# 3. Verify in Claude Code
# Open project, trigger agent with keyword
```

## Related Skills

- **command-creator** - Generate /command implementations
- **skill-creator** - Generate new skills like this one
- **hook-creator** - Generate lifecycle hooks

## Real Examples

See production agents for reference:
- [.claude/agents/maria-qa.md](../../.claude/agents/maria-qa.md) - Testing specialist
- [.claude/agents/james-frontend.md](../../.claude/agents/james-frontend.md) - Frontend + 5 sub-agents
- [.claude/agents/marcus-backend.md](../../.claude/agents/marcus-backend.md) - Backend + 5 sub-agents
- [.claude/agents/sarah-pm.md](../../.claude/agents/sarah-pm.md) - Orchestration specialist

---

**Created**: Phase 4 of Skills-First Architecture (v7.0.0)
**Template Location**: [assets/agent-template.md](assets/agent-template.md)
