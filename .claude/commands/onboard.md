---
name: onboard
description: Interactive onboarding wizard for new users (chat-based GUI experience)
tags: [setup, onboarding, configuration, wizard, gui]
---

# VERSATIL Onboarding Wizard

**Welcome to VERSATIL SDLC Framework!** Let's set up your AI-native development environment in just a few minutes.

This interactive wizard will guide you through:
- 🔍 **Project analysis** - Auto-detect your tech stack
- 👥 **Team setup** - Configure for your workflow
- 🤖 **Agent customization** - Choose which OPERA agents to enable
- 🔧 **MCP tools** - Select integrations you need
- 📍 **Roadmap generation** - Get a personalized 4-week plan

---

## Quick Start (Auto Mode)

If you want automatic setup with smart defaults:

```
I'll run auto-detection now and configure everything based on your project.
```

**Detected**:
- **Project Type**: (will analyze package.json, file structure)
- **Tech Stack**: (will detect React, TypeScript, Node.js, etc.)
- **Recommended Agents**: (will suggest based on tech stack)

---

## Custom Setup (Interactive Mode)

Let's personalize your setup step-by-step:

### Step 1: Project Analysis 🔍

**What type of project are you working on?**

| Option | Project Type | Recommended Agents |
|--------|-------------|-------------------|
| 1 | **Frontend** (React, Vue, Angular) | James-Frontend, Maria-QA |
| 2 | **Backend** (Node.js, Python, Java) | Marcus-Backend, Dana-Database, Maria-QA |
| 3 | **Full-stack** (Frontend + Backend) | All agents |
| 4 | **Mobile** (React Native, Flutter) | James-Frontend, Marcus-Backend |
| 5 | **ML/AI** (Python, TensorFlow) | Dr.AI-ML, Marcus-Backend, Maria-QA |
| 6 | **Enterprise** (Microservices, Complex) | All agents + Sarah-PM, Alex-BA |

**Choose (1-6)**: _[User responds with number]_

---

### Step 2: Team & Experience Setup 👥

**What's your team size?**

- [ ] Solo developer
- [ ] Small team (2-5 people)
- [ ] Medium team (6-15 people)
- [ ] Large team (16+ people)

**Your experience with AI-assisted development?**

- [ ] Beginner (New to AI tools)
- [ ] Intermediate (Some experience with GitHub Copilot, etc.)
- [ ] Expert (Experienced with multiple AI development tools)

**Main development priorities?** (select multiple)

- [ ] Speed/Velocity
- [ ] Code Quality
- [ ] Testing/QA
- [ ] Security
- [ ] Performance
- [ ] Team Collaboration

---

### Step 3: OPERA Agent Customization 🤖

Based on your selections, I'll configure these agents:

#### ✅ Maria-QA (Quality Guardian)
- **Auto-activation**: ✅ Enabled
- **Priority**: 10/10 (High)
- **Triggers**: `*.test.*`, `*.spec.*`, `__tests__/**`
- **Focus**: Automated testing, Visual regression, Performance testing, Accessibility audits

**Customize?** (Y/n): _[User can adjust priority, triggers, focus areas]_

#### ✅ James-Frontend (UI/UX Expert)
- **Auto-activation**: ✅ Enabled
- **Priority**: 7/10 (Medium-High)
- **Triggers**: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
- **Focus**: Component optimization, Performance monitoring, Design system

**Customize?** (Y/n):

#### ✅ Marcus-Backend (API Architect)
- **Auto-activation**: ✅ Enabled
- **Priority**: 7/10 (Medium-High)
- **Triggers**: `*.api.*`, `routes/**`, `server/**`
- **Focus**: API design, Database optimization, Security auditing

**Customize?** (Y/n):

_(Continue for all selected agents...)_

---

### Step 4: MCP Tool Configuration 🔧

**Which MCP tools would you like to enable?**

| MCP Tool | Purpose | Agents Using It | Auto-Enable? |
|----------|---------|----------------|--------------|
| **Playwright/Chrome** | Browser automation, E2E testing | Maria-QA, James | ✅ Recommended |
| **GitHub** | Repository operations, PR reviews | Marcus, Sarah, Alex | ✅ Recommended |
| **Exa Search** | AI-powered research | Alex-BA, Dr.AI-ML | Optional |
| **Vertex AI** | Google Cloud AI, ML deployment | Dr.AI-ML | Optional (ML projects) |
| **Supabase** | Vector database, RAG memory | All agents | ✅ Recommended |
| **n8n** | Workflow automation | Sarah-PM | Optional |
| **Semgrep** | Security scanning | Marcus, Maria | ✅ Recommended |
| **Sentry** | Error monitoring | Maria, Sarah | Optional |

**Select tools** (comma-separated, e.g., "1,2,5,7" or "all" for recommended):

---

### Step 4.5: Service Credentials Setup 🔐

**🔒 Security: Project-Level Encryption**

Credentials will be encrypted with AES-256-GCM and stored at:
`<project>/.versatil/credentials.json`

Each project has its own isolated credentials - no cross-project access!

**Which services need credentials?**

Based on your MCP selections, these services require setup:

| Service | Required By | Priority | Status |
|---------|-------------|----------|--------|
| **GitHub** | Marcus, Sarah, Alex | ✅ High | Auto-detect `GITHUB_TOKEN` |
| **Supabase** | RAG memory, All agents | ✅ High | Check existing config |
| **Vertex AI** | Dr.AI-ML | Medium | GCP service account |
| **Semgrep** | Marcus, Maria | Medium | Auto-detect `SEMGREP_TOKEN` |

**Configure now or later?**
- **[Y] Configure now** (recommended) - 2-3 minutes, guided setup
- **[n] Skip for now** (can run `versatil-credentials setup` later)

**What happens:**
1. Interactive prompts for each credential (with validation)
2. Encrypted storage with AES-256-GCM (project-specific key)
3. Audit logging for all credential access
4. Team export option (password-protected)

---

### Step 5: Configuration Preview ⚙️

Here's your personalized configuration:

```json
{
  "projectType": "fullstack",
  "teamSize": "small",
  "experience": "intermediate",
  "technologies": ["TypeScript", "React", "Node.js", "Express"],
  "priorities": ["Quality", "Testing", "Speed"],
  "agentCustomizations": {
    "Maria-QA": { "priority": 10, "autoActivate": true },
    "James-Frontend": { "priority": 7, "autoActivate": true },
    "Marcus-Backend": { "priority": 7, "autoActivate": true },
    "Dana-Database": { "priority": 6, "autoActivate": true }
  },
  "mcpPreferences": ["playwright_mcp", "github_mcp", "supabase_mcp", "semgrep"]
}
```

**Confirm and proceed?** (Y/n):

---

### Step 6: Installation & Setup 🎉

I'm now:
1. ✅ Creating `.versatil/config.json` with your preferences
2. ✅ Generating agent configurations (`.versatil/agents/`)
3. ✅ Creating `.cursorrules` for IDE integration
4. ✅ Generating `CLAUDE.md` with your customized team
5. ✅ Creating personalized roadmap at `docs/VERSATIL_ROADMAP.md`
6. ✅ Installing selected MCP dependencies

**Progress**:
```
[████████████████████------] 80% - Installing MCPs...
```

---

## ✨ Setup Complete!

Your VERSATIL Framework is configured and ready!

### 📁 Files Created

```
✅ .versatil/config.json          # Main configuration
✅ .versatil/agents/*.json         # Agent definitions (4 agents)
✅ .cursorrules                    # IDE integration
✅ CLAUDE.md                       # OPERA methodology guide
✅ docs/VERSATIL_ROADMAP.md        # 📍 Your 4-week development roadmap
✅ versatil.log                    # Framework activity log
```

### 🚀 Next Steps

1. **Start the proactive daemon** (enables auto-activation):
   ```bash
   versatil-daemon start
   ```

2. **Review your personalized roadmap**:
   - Open `docs/VERSATIL_ROADMAP.md`
   - See your 4-week plan with milestones, agent recommendations, quality gates

3. **Test agent auto-activation**:
   - Edit a `*.test.ts` file → Maria-QA activates
   - Edit a `*.tsx` file → James-Frontend activates
   - Or use slash commands: `/maria-qa`, `/james-frontend`

4. **Check framework health**:
   ```bash
   npm run monitor      # Quick health check
   npm run dashboard    # Interactive TUI dashboard
   ```

### ✨ What's New in v7.1.0+ (You Get This Automatically!)

🚀 **PROACTIVE AUTOMATION**
- Templates auto-apply when you create files (5-10x faster)
- Agents auto-activate based on file edits (no manual commands)
- Patterns auto-suggest from historical learnings (85-95% token savings)

🧠 **94.1% TOKEN SAVINGS**
- Progressive disclosure via Skills-first architecture
- Library guides load only when mentioned
- Code generators use copy-paste templates

📍 **COMPOUNDING ENGINEERING**
- Each feature 40% faster than the last
- Pattern search finds similar work
- Template matching suggests proven approaches

---

### 💡 Daemon Commands

```bash
versatil-daemon status    # Check if running
versatil-daemon stop      # Stop daemon
versatil-daemon logs      # View daemon logs
```

### 🎯 Your OPERA Agents

- ✅ **Maria-QA** - Quality Guardian (priority: 10/10)
- ✅ **James-Frontend** - UI/UX Expert (priority: 7/10)
- ✅ **Marcus-Backend** - API Architect (priority: 7/10)
- ✅ **Dana-Database** - Database Architect (priority: 6/10)

### 📚 Documentation

- **CLAUDE.md** - Your customized OPERA guide
- **docs/VERSATIL_ROADMAP.md** - Your 4-week development plan
- **docs/AUTOMATION_TEST_REPORT.md** - 87.5% automation success rate!
- **docs/INSTALLATION.md** - Complete installation guide

---

**Welcome to VERSATIL!** 🚀

Your agents are ready to assist you proactively as you code. Happy building!

---

## Advanced Options

### Re-run Onboarding
```bash
/onboard --reset          # Start fresh (clears existing config)
```

### Export Configuration
```bash
/onboard --export         # Export config to share with team
```

### Import Configuration
```bash
/onboard --import team-config.json    # Use team config
```

### Validate Setup
```bash
/onboard --validate       # Check if setup is complete
```

---

**Implementation Note for Claude**:

When user invokes `/onboard`, you should:

1. **Auto-detect project** (if possible):
   ```typescript
   // Read package.json, analyze dependencies
   // Detect React, TypeScript, Node.js, etc.
   ```

2. **Ask questions progressively** (one section at a time):
   - Don't overwhelm with all questions at once
   - Show current selection after each step
   - Allow back/edit previous answers

3. **Generate configuration**:
   ```typescript
   // Call onboarding-wizard.ts with chat mode:
   const wizard = new OnboardingWizard({ mode: 'chat' });
   await wizard.startOnboarding();
   ```

4. **Create files** (use Write tool):
   - `.versatil/config.json`
   - `.versatil/agents/*.json`
   - `.cursorrules`
   - `CLAUDE.md` (from template)
   - `docs/VERSATIL_ROADMAP.md` (call RoadmapGenerator)

5. **Confirm completion** with visual summary (markdown tables, checkboxes)

6. **Ask about daemon start** (offer to run `versatil-daemon start`)

---

**Visual Elements to Use**:
- ✅ Checkboxes for completed steps
- 📊 Tables for options/comparisons
- 📁 Code blocks for file previews
- 🎯 Progress bars (`[████----] 60%`)
- 💡 Callout boxes for tips
- 🔗 Clickable links to docs

This creates a **GUI-like experience in chat** without needing a VSCode extension!
