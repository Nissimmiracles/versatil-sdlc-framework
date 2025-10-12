# 🎯 Claude Opera Onboarding in Cursor IDE

**Claude Opera by VERSATIL v6.4.0**

This guide shows you how to complete the onboarding process **inside Cursor IDE** using the AI chat interface.

**NEW in v6.4.0**:
- 📍 **Automatic Roadmap Generation** - Get a personalized 4-week development plan
- 🤖 **17 OPERA Agents** - 7 core + 10 language-specific sub-agents (React, Vue, Node.js, Python, etc.)
- 🎯 **Smart Agent Matching** - Automatically recommends agents based on your tech stack

---

## 🚀 Quick Start (2 Minutes)

### Step 1: Open Cursor AI Chat

Press `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux) to open the AI chat panel.

### Step 2: Request Onboarding

In the chat, type:

```
Can you run the versatil_welcome_setup tool to show me the onboarding and setup instructions?
```

### Step 3: Follow the Instructions

Claude will:
- ✅ Check your current setup status
- ✅ Analyze your project (detect React, Vue, Python, Node.js, etc.)
- ✅ Generate personalized roadmap (`docs/VERSATIL_ROADMAP.md`)
- ✅ Recommend specific agents from 17 available (e.g., James-React for React projects)
- ✅ Show missing components
- ✅ Provide step-by-step setup instructions
- ✅ Guide you through credential configuration
- ✅ Help configure agents for your project

### Step 4: Review Your Roadmap 📍

After onboarding completes, open your personalized roadmap:

```
cat docs/VERSATIL_ROADMAP.md
```

This roadmap includes:
- 4-week development plan
- Weekly milestones and tasks
- Recommended agents for each phase
- Quality gates and success metrics
- Technology-specific best practices

---

## 📋 What the Onboarding Covers

### 1. Framework Status Check
- Framework home directory (`~/.versatil/`)
- Preferences file configuration
- Environment variables setup
- Project configuration

### 2. Agent Configuration (17 Agents Total)

**Core Agents** (7):
- **Maria-QA** - Quality assurance and testing
- **James-Frontend** - UI/UX development
- **Marcus-Backend** - API and backend work
- **Sarah-PM** - Project coordination
- **Alex-BA** - Requirements analysis
- **Dr.AI-ML** - Machine learning and AI
- **Oliver-DevOps** - Infrastructure and CI/CD

**Frontend Sub-Agents** (5):
- **James-React** - React hooks, performance, component patterns
- **James-Vue** - Vue Composition API, reactivity
- **James-NextJS** - Next.js App Router, SSR/SSG
- **James-Angular** - Angular dependency injection, RxJS
- **James-Svelte** - Svelte reactivity, stores

**Backend Sub-Agents** (5):
- **Marcus-Node** - Node.js async patterns, Express/Fastify
- **Marcus-Python** - Python async/await, Django/Flask
- **Marcus-Rails** - Rails conventions, ActiveRecord
- **Marcus-Go** - Go concurrency, goroutines
- **Marcus-Java** - Java Spring Boot, JPA

**Smart Matching**: The framework automatically recommends which agents to enable based on your detected technologies.

### 3. MCP Server Setup
Status of 11 MCP servers:
- Chrome/Playwright MCP (browser automation)
- GitHub MCP (repository operations)
- Exa Search MCP (AI-powered search)
- Vertex AI MCP (Google Cloud AI)
- Supabase MCP (database operations)
- n8n MCP (workflow automation)
- Semgrep MCP (security scanning)
- Sentry MCP (error monitoring)
- And 3 more...

### 4. Credential Configuration
Optional API keys for enhanced features:
- GitHub API (for PR integration)
- OpenAI API (for agent LLMs)
- Anthropic API (for Claude integration)
- Supabase credentials (for RAG memory)
- Google Cloud credentials (for Vertex AI)

---

## 🔧 Available MCP Tools for Setup

You can also use these tools directly in Cursor chat:

### 1. `versatil_welcome_setup`
**Purpose**: Full onboarding walkthrough
**Usage**:
```
Run versatil_welcome_setup with showDetails=true
```

### 2. `versatil_get_agent_suggestions`
**Purpose**: Get personalized agent recommendations
**Usage**:
```
Use versatil_get_agent_suggestions to analyze my project and recommend which agents I should enable
```

### 3. `versatil_configure_agent`
**Purpose**: Configure specific agent settings
**Usage**:
```
Configure maria-qa agent with test coverage threshold 85% and quality score 90
```

### 4. `versatil_health_check`
**Purpose**: Verify framework health
**Usage**:
```
Run versatil_health_check to verify everything is working correctly
```

---

## 🎓 Interactive Tutorial

After onboarding, try these examples with Claude in Cursor:

### Example 1: File Change Detection
```
Edit a test file (*.test.tsx) and ask:
"Which agent should handle this file change?"

Expected: Maria-QA will auto-activate
```

### Example 2: Agent Coordination
```
Ask Claude:
"I want to add user authentication. Which agents should work together on this?"

Expected: Alex-BA (requirements) → Marcus (backend) → James (frontend) → Maria (testing)
```

### Example 3: Quality Gates
```
Ask Claude:
"Run quality gate checks on my current changes"

Expected: Maria-QA runs coverage analysis, security scan, accessibility check
```

---

## 🔍 Verify Your Setup

After onboarding, run this in Cursor chat:

```
Use versatil_health_check to verify my Claude Opera setup is complete
```

Expected output:
```json
{
  "status": "healthy",
  "frameworkVersion": "1.0.0",
  "agents": {
    "maria-qa": "active",
    "james-frontend": "active",
    "marcus-backend": "active",
    "sarah-pm": "active",
    "alex-ba": "active",
    "dr-ai-ml": "active"
  },
  "mcpServers": {
    "claude-opera": "connected",
    "playwright": "available",
    "github": "configured",
    ...
  },
  "issues": []
}
```

---

## 🆘 Troubleshooting

### Issue: "MCP tool not found"

**Solution**: Restart Cursor to reload MCP servers
1. Close Cursor completely
2. Reopen your project
3. Try the onboarding command again

### Issue: "Framework not configured"

**Solution**: Run initial setup
```bash
# In terminal (outside Cursor):
cd "/Users/nissimmenashe/VERSATIL SDLC FW"
npm install
```

Then retry onboarding in Cursor chat.

### Issue: "Agent not responding"

**Solution**: Check daemon status
```
Ask Claude: "What's the status of the versatil daemon?"
```

If stopped, start it:
```bash
# In terminal:
node bin/versatil-daemon.js start
```

---

## 📚 Next Steps After Onboarding

1. **Enable Proactive Agents**
   ```
   Ask Claude: "Start the proactive daemon to enable automatic agent activation"
   ```

2. **Configure Credentials** (optional)
   ```
   Ask Claude: "Help me configure credentials for GitHub and Supabase MCP servers"
   ```

3. **Run Health Audit**
   ```
   Ask Claude: "Run a daily audit to establish baseline metrics"
   ```

4. **Try a Feature**
   ```
   Ask Claude: "I want to add a login form. Help me coordinate the OPERA agents for this task."
   ```

---

## 🎯 Key Benefits of Cursor Onboarding

✅ **No Terminal Required** - Everything in AI chat
✅ **Interactive Guidance** - Claude asks clarifying questions
✅ **Context-Aware** - Analyzes your project automatically
✅ **Real-Time Validation** - Checks configuration as you go
✅ **Personalized Setup** - Recommends agents based on your stack
✅ **Credential Management** - Secure API key configuration
✅ **MCP Integration** - All 11 MCP servers pre-configured

---

## 📖 Related Documentation

- **Framework Overview**: [README.md](../README.md)
- **OPERA Methodology**: [CLAUDE.md](../CLAUDE.md)
- **Agent Details**: [.claude/AGENTS.md](../.claude/AGENTS.md)
- **MCP Integration**: [MCP_INTEGRATION_GUIDE.md](MCP_INTEGRATION_GUIDE.md)
- **5 Automation Rules**: [.claude/rules/README.md](../.claude/rules/README.md)

---

## 💬 Get Help in Cursor

Stuck? Just ask Claude:

```
I'm having trouble with Claude Opera onboarding. Can you help diagnose the issue?
```

Claude has access to:
- Framework configuration
- Agent status
- MCP server health
- Error logs
- Setup history

---

**Version**: 1.0.0
**Last Updated**: 2025-10-12
**Maintained By**: Claude Opera by VERSATIL Team
