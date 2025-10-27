# VERSATIL Slash Commands

This directory contains all available slash commands for the VERSATIL SDLC Framework.

## 🆕 New in v7.3.0 (Chat-Based GUI Wizards)

- **`/onboard`** - Interactive onboarding wizard with visual tables, auto-detection
- **`/update`** - Version update wizard with changelog, diff views, rollback
- **`/config-wizard`** - Visual configuration interface for all settings

---

## ⚡ First Time Using Slash Commands?

**You must reload Cursor window to activate new commands:**

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: "Developer: Reload Window"
3. Press Enter
4. Try: `/onboard` in chat

**Why?** Claude Code SDK scans this directory on startup. New commands need a reload.

---

## 📋 All Available Commands (26 Total)

### Setup & Configuration (3 commands) 🆕
- **`/onboard`** - Interactive onboarding wizard (NEW in v7.3.0)
- **`/update`** - Version update wizard (NEW in v7.3.0)
- **`/config-wizard`** - Visual configuration interface (NEW in v7.3.0)

### EVERY Workflow (5 commands)
- **`/plan`** - Phase 1: Research & design with templates
- **`/assess`** - Phase 2: Validate readiness before work
- **`/delegate`** - Phase 3: Distribute work to agents
- **`/work`** - Phase 4: Execute with tracking
- **`/learn`** - Phase 5: Codify learnings to RAG

### OPERA Agents (8 commands)
- **`/maria-qa`** - Quality Guardian (testing, coverage)
- **`/james-frontend`** - UI/UX Expert (accessibility, performance)
- **`/marcus-backend`** - API Architect (security, scalability)
- **`/dana-database`** - Database Architect (schema, migrations)
- **`/alex-ba`** - Requirements Analyst (user stories, contracts)
- **`/sarah-pm`** - Project Coordinator (planning, reporting)
- **`/dr-ai-ml`** - AI/ML Specialist (models, optimization)
- **`/oliver-mcp`** - MCP Orchestrator (intelligent routing)

### Utilities (10 commands)
- **`/architecture`** - Complete VERSATIL architecture (commands, SDK, agents, skills, hooks, MCP) 🆕
- **`/help`** - Get help with framework features
- **`/monitor`** - Framework health checks
- **`/framework-debug`** - Debug framework issues
- **`/generate`** - Code generation (tests, docs, types)
- **`/triage`** - Issue triage and prioritization
- **`/resolve`** - Issue resolution
- **`/review`** - Multi-agent code review
- **`/context`** - Context management
- **`/validate-workflow`** - Workflow validation
- **`/roadmap-test`** - Roadmap testing

---

## 📖 How to Use Slash Commands

### In Chat (Recommended)
```
User: /onboard
Claude: [Runs interactive onboarding wizard]

User: /update
Claude: [Shows version comparison, changelog]

User: /maria-qa review test coverage
Claude: [Maria-QA agent analyzes test coverage]
```

### With Arguments
```
/plan "Add user authentication"
/assess "authentication feature"
/maria-qa check coverage for src/auth.test.ts
```

### Get Help
```
/help                    # Show all topics
/help agents             # Learn about agents
/help workflows          # Learn about EVERY workflow
```

---

## 🎯 Quick Reference

### For New Users
1. `/onboard` - Set up framework
2. `/help quick-start` - 5-minute getting started
3. `/monitor` - Check health

### For Development
1. `/plan "feature description"` - Plan feature
2. `/work "feature name"` - Execute feature
3. `/maria-qa` - Run quality checks

### For Updates
1. `/update` - Check for new versions
2. `/config-wizard` - Modify settings

---

## 🔧 Creating Custom Slash Commands

1. **Create file**: `.claude/commands/my-command.md`
2. **Add frontmatter**:
   ```yaml
   ---
   name: my-command
   description: What this command does
   tags: [category1, category2]
   ---
   ```
3. **Write instructions**: Markdown content for Claude
4. **Reload Cursor**: `Cmd+Shift+P` → "Developer: Reload Window"
5. **Test**: `/my-command` in chat

**Template**: See [command-creator skill](.claude/skills/code-generators/command-creator/assets/command-template.md)

---

## 🐛 Troubleshooting

### "Unknown slash command: onboard"

**Solution**: Reload Cursor window
1. `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: "Developer: Reload Window"
3. Press Enter

**See**: [docs/SLASH_COMMANDS_ACTIVATION.md](../../docs/SLASH_COMMANDS_ACTIVATION.md)

### Command works in terminal but not in chat

This is expected! Different systems:
- **Chat commands**: `/onboard` (this directory)
- **Terminal commands**: `npm run onboard` (package.json scripts)

Both work, just different interfaces.

### Command doesn't do what I expect

1. Read the command file: `cat .claude/commands/{command-name}.md`
2. Check the `description` in frontmatter
3. Try `/help` for documentation

---

## 📚 Documentation

- **Complete Guide**: [docs/CURSOR_GUI_WIZARDS.md](../../docs/CURSOR_GUI_WIZARDS.md)
- **Activation Guide**: [docs/SLASH_COMMANDS_ACTIVATION.md](../../docs/SLASH_COMMANDS_ACTIVATION.md)
- **Framework Help**: [CLAUDE.md](../../CLAUDE.md)

---

## 🎉 Summary

- ✅ **26 slash commands** available (4 new in v7.3.0+)
- ✅ **Chat-based GUI** wizards for onboarding, updates, config
- ✅ **Architecture guide** explaining entire framework (`/architecture`)
- ✅ **One-time reload** required for new commands
- ✅ **Terminal commands** still work as fallback
- ✅ **Custom commands** easy to create

**Get Started**: Reload Cursor (`Cmd+Shift+P` → "Developer: Reload Window"), then try `/onboard` or `/architecture`!
