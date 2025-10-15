# Cursor Commands for VERSATIL OPERA

This directory contains **Cursor-native commands** (introduced in Cursor v1.2+) for VERSATIL OPERA agents.

## What are Cursor Commands?

Cursor Commands are reusable prompts stored in `.cursor/commands/[command].md` that can be:
- Run by typing `/` in the Agent input
- Selected from dropdown menu
- Shared with your team via version control
- Used for common workflows (linters, compile errors, PR descriptions)

## VERSATIL OPERA Commands

### 7 OPERA Agents

| Command | Description | Agent |
|---------|-------------|-------|
| `/maria-qa` | Quality assurance and testing | Maria-QA |
| `/james-frontend` | UI/UX development and accessibility | James-Frontend |
| `/marcus-backend` | API and backend architecture | Marcus-Backend |
| `/dana-database` | Database schema and migrations | Dana-Database |
| `/sarah-pm` | Project coordination and planning | Sarah-PM |
| `/alex-ba` | Business analysis and requirements | Alex-BA |
| `/dr-ai-ml` | Machine learning and AI development | Dr.AI-ML |

### Workflow Commands

| Command | Description | Purpose |
|---------|-------------|---------|
| `/plan` | Plan feature implementation with structured todos | Complex task planning |
| `/monitor` | Framework health check and monitoring | System diagnostics |
| `/framework-debug` | Comprehensive debug information | Troubleshooting |

## Usage

```bash
# In Cursor Agent input, type:
/maria-qa "Review test coverage for authentication module"
/james-frontend "Create accessible login form component"
/marcus-backend "Implement OAuth API endpoints with security"
/dana-database "Design users table schema with RLS policies"
/plan "Add user authentication system"
/monitor "Check framework health"
```

## Command Discovery

Cursor automatically indexes commands in this directory. Press `/` in Agent input to see all available commands.

## Command Format

Each command is a markdown file with frontmatter:

```yaml
---
description: "Brief description of what the command does"
argument-hint: "[what user should provide]"
model: "claude-sonnet-4-5"  # Recommended model
allowed-tools:  # Tools this command can use
  - "Read"
  - "Write"
  - "Bash"
---

# Command prompt starts here
Your detailed instructions to the agent...
```

## Relationship to .claude/commands/

- **`.claude/commands/`**: Legacy Claude Desktop commands (maintained for compatibility)
- **`.cursor/commands/`**: Cursor-native commands (preferred for Cursor IDE)

Both directories contain the same commands with identical functionality. The Cursor-native format provides:
- ✅ Better IDE integration
- ✅ Autocomplete in Agent input
- ✅ Team sharing via git
- ✅ Per-command model selection

## Creating Custom Commands

To add a custom command:

1. Create `my-command.md` in this directory
2. Add frontmatter with description and tools
3. Write your agent prompt
4. Restart Cursor or reload window
5. Use via `/my-command` in Agent input

Example:

```yaml
---
description: "Run linter and fix all issues"
argument-hint: ""
model: "claude-sonnet-4-5"
allowed-tools: ["Bash", "Read", "Edit"]
---

# Run Linter and Auto-Fix

Please run the project linter and fix all issues:

1. Run `npm run lint` to check for issues
2. Run `npm run lint:fix` to auto-fix
3. Report any remaining issues that need manual fixes
```

## Disabling Commands

To disable a command, rename it with `.disabled` extension:

```bash
mv maria-qa.md maria-qa.md.disabled
```

## Migration Notes

VERSATIL v6.4.0+ includes both `.claude/commands/` and `.cursor/commands/` for maximum compatibility:

- **Cursor users**: Use `.cursor/commands/` (native integration)
- **Claude Desktop users**: Use `.claude/commands/` (MCP integration)
- **Both environments**: Commands work identically

## Documentation

- **Cursor Commands Docs**: https://docs.cursor.com/composer#commands
- **VERSATIL Agents**: `.claude/AGENTS.md`
- **OPERA Methodology**: `CLAUDE.md`

---

**Version**: 6.4.0
**Last Updated**: 2025-10-15
**Maintained By**: VERSATIL OPERA Team
