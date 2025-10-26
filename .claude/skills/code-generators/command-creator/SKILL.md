---
name: command-creator
description: Generate new slash commands with YAML frontmatter, agent invocations, and usage examples. Use when creating commands, implementing workflows, or defining command flags. Provides command-template.md for 5-10x faster command creation with built-in agent orchestration patterns.
tags: [code-generation, commands, templates, workflows]
---

# command-creator - Slash Command Generator

**Purpose**: Generate slash commands using proven template structure

## When to Use

- Creating new slash commands (e.g., /plan, /work, /delegate)
- Implementing multi-agent workflows
- Defining command flags and arguments
- Setting up agent orchestration patterns

## Quick Start

1. **Copy template**: `cp .claude/skills/code-generators/command-creator/assets/command-template.md .claude/commands/your-command.md`
2. **Replace placeholders**: `{{COMMAND_NAME}}`, `{{COMMAND_DESCRIPTION}}`, `{{AGENT_1}}`, etc.
3. **Test command**: Use in Claude Code with `/your-command`

## Key Placeholders

| Placeholder | Example |
|-------------|---------|
| `{{COMMAND_NAME}}` | "plan", "work", "delegate" |
| `{{COMMAND_DESCRIPTION}}` | "Plan feature with OPERA agents" |
| `{{ARGUMENT_HINT}}` | "feature description", "todo IDs" |
| `{{FLAG_1}}` | "validate", "dry-run", "parallel" |
| `{{AGENT_1}}` | "sarah-pm", "maria-qa" |
| `{{STEP_1_TITLE}}` | "Analyze Requirements" |

## Template Location

[assets/command-template.md](assets/command-template.md)

## Real Examples

- [.claude/commands/plan.md](../../.claude/commands/plan.md)
- [.claude/commands/work.md](../../.claude/commands/work.md)
- [.claude/commands/delegate.md](../../.claude/commands/delegate.md)
