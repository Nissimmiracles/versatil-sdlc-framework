# 🚀 Getting Started with VERSATIL

**Get from zero to first result in 5 minutes** with 18 AI agents working for you.

---

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Cursor IDE** or **Claude Desktop** (recommended)

---

## Step 1: Install VERSATIL (2 minutes)

### Global Installation

```bash
# Install VERSATIL globally
npm install -g @versatil/sdlc-framework

# Verify installation
versatil --version
# Expected output: 6.5.0
```

### Or use via npx (no installation)

```bash
npx @versatil/sdlc-framework init
```

---

## Step 2: Initialize Your Project (1 minute)

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize VERSATIL (auto-detects your tech stack)
npx versatil init
```

**What `versatil init` does:**
1. ✅ Detects your tech stack (React, Vue, Python, Node.js, etc.)
2. ✅ Recommends relevant agents from 18 available
3. ✅ Generates personalized 4-week roadmap (`docs/VERSATIL_ROADMAP.md`)
4. ✅ Creates `.versatil-project.json` configuration
5. ✅ Sets up quality gates (80%+ test coverage, WCAG 2.1 AA)

---

## Step 3: Configure IDE Integration (1 minute)

### For Cursor IDE

```bash
# Auto-configure MCP for Cursor
versatil-mcp-setup --cursor
```

This creates `.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "versatil": {
      "command": "node",
      "args": ["~/.npm-global/bin/versatil-mcp", "/your/project"]
    }
  }
}
```

### For Claude Desktop

```bash
# Auto-configure MCP for Claude Desktop
versatil-mcp-setup --claude-desktop
```

This updates `~/Library/Application Support/Claude/claude_desktop_config.json`.

---

## Step 4: Start the Proactive Daemon (30 seconds)

```bash
# Start daemon (agents auto-activate on file saves)
versatil-daemon start

# Check daemon status
versatil-daemon status
# Expected output: ✅ Daemon running (PID: 12345)
```

**What the daemon does:**
- 👀 Watches your project files
- 🤖 Auto-activates relevant agents when you save files
- ⚡ Runs quality gates before commits
- 📊 Provides real-time feedback in statusline

---

## Step 5: See It In Action (30 seconds)

### Test 1: Edit a React Component

```bash
# Create or edit a component
# File: src/components/Button.tsx
```

**What happens:**
1. Save the file → **James-Frontend** auto-activates
2. Validates: Accessibility (WCAG 2.1 AA), responsive design, performance
3. Provides inline suggestions if issues found
4. Updates statusline: `🤖 James-Frontend: Component validation (92% accessible)`

### Test 2: Edit an API Route

```bash
# Create or edit an API file
# File: src/api/users.ts
```

**What happens:**
1. Save the file → **Marcus-Backend** auto-activates
2. Scans: SQL injection, XSS, CSRF, rate limiting, input sanitization
3. Generates stress tests automatically (Rule 2)
4. Updates statusline: `🤖 Marcus-Backend: Security scan (0 vulnerabilities)`

### Test 3: Edit a Test File

```bash
# Create or edit a test
# File: src/components/Button.test.tsx
```

**What happens:**
1. Save the file → **Maria-QA** auto-activates
2. Analyzes test coverage (requires 80%+)
3. Suggests missing test cases
4. Updates statusline: `🤖 Maria-QA: Coverage check (85% ✅)`

---

## Step 6: Check Framework Health

```bash
# Quick health check
versatil doctor

# Expected output:
# ✅ Framework Health: 95%
# ✅ All 8 core agents operational
# ✅ 12 MCP integrations configured
# ✅ Daemon running
# ✅ Quality gates enabled
```

---

## Next Steps

### View Your Personalized Roadmap

```bash
# Open the auto-generated roadmap
cat docs/VERSATIL_ROADMAP.md
```

Your roadmap includes:
- 📅 4-week development plan
- 🎯 Weekly milestones and tasks
- 🤖 Agent recommendations for each phase
- ✅ Quality gates and success metrics
- 💡 Technology-specific best practices

### Explore Agents

```bash
# List all available agents
versatil show-agents

# Expected output:
# 8 Core OPERA Agents:
#   • Alex-BA: Business Analyst
#   • Dana-Database: Database Architect
#   • Marcus-Backend: API Architect
#   • James-Frontend: UI/UX Expert
#   • Maria-QA: Quality Guardian
#   • Sarah-PM: Project Coordinator
#   • Dr.AI-ML: AI/ML Specialist
#   • Oliver-MCP: MCP Orchestrator
#
# 10 Language Sub-Agents:
#   • James-React, James-Vue, James-Next, James-Angular, James-Svelte
#   • Marcus-Node, Marcus-Python, Marcus-Rails, Marcus-Go, Marcus-Java
```

### Manual Agent Invocation

While agents auto-activate, you can also invoke them manually:

```bash
# Quality assurance
/maria-qa review test coverage

# Frontend optimization
/james-frontend optimize page load time

# Backend security
/marcus-backend review API security

# Database optimization
/dana-database optimize user queries

# Requirements analysis
/alex-ba extract requirements from conversation

# Project coordination
/sarah-pm generate sprint report

# AI/ML tasks
/dr-ai-ml optimize model performance

# MCP orchestration
/oliver-mcp test browser automation
```

---

## Common Issues

### Daemon won't start

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Stop any existing daemon
versatil-daemon stop

# Restart
versatil-daemon start
```

### Agents not activating

```bash
# Check daemon status
versatil-daemon status

# View daemon logs
versatil-daemon logs

# Restart daemon
versatil-daemon restart
```

### MCP integration issues

```bash
# Validate MCP configuration
versatil-mcp-setup --validate

# Re-run setup
versatil-mcp-setup --cursor --force
```

---

## Getting Help

- **📖 Documentation**: [docs/README.md](docs/README.md)
- **💬 GitHub Discussions**: [Ask questions](https://github.com/Nissimmiracles/versatil-sdlc-framework/discussions)
- **🐛 Report Issues**: [GitHub Issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
- **📧 Email**: nissim@versatil.vc

---

## What's Next?

1. **Read the Agent Reference**: [docs/agents/README.md](docs/agents/README.md)
2. **Explore MCP Integrations**: [docs/features/mcp-ecosystem.md](docs/features/mcp-ecosystem.md)
3. **See Real-World Examples**: [docs/MCP_EXAMPLES.md](docs/MCP_EXAMPLES.md)
4. **Compare with Other Tools**: [docs/COMPARISON.md](docs/COMPARISON.md)

---

**🎉 Congratulations!** You're now running VERSATIL with 18 AI agents working proactively on your project.

[← Back to README](README.md) | [View All Documentation](docs/README.md)
