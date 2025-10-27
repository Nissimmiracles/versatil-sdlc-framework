---
name: config-wizard
description: Interactive configuration wizard with visual settings interface (chat-based GUI)
tags: [configuration, settings, preferences, wizard, gui]
---

# VERSATIL Configuration Wizard

**Customize your VERSATIL Framework settings with an interactive visual interface!**

This wizard lets you:
- 👀 **View current settings** - See all your configurations
- ⚙️ **Modify preferences** - Change update behavior, notifications, agents
- 🤖 **Agent customization** - Adjust priorities, triggers, focus areas
- 🔧 **MCP configuration** - Enable/disable integrations
- 🎯 **Quality gates** - Set coverage thresholds, rules
- 💾 **Import/Export** - Share configs with your team

---

## Current Configuration

### 📊 Overview

| Category | Status | Last Modified |
|----------|--------|---------------|
| **Project Settings** | ✅ Configured | 2025-10-26 10:15 |
| **Agent Customizations** | ✅ 4 agents active | 2025-10-26 10:16 |
| **MCP Integrations** | 🟡 4/12 enabled | 2025-10-26 10:18 |
| **Update Preferences** | ✅ Configured | 2025-10-26 10:15 |
| **Quality Gates** | ✅ Configured | 2025-10-26 10:15 |

**Overall Health**: 🟢 98% (Excellent)

---

## Configuration Sections

**What would you like to configure?**

1. **Project Settings** - Type, team size, tech stack, priorities
2. **OPERA Agents** - Enable/disable, priorities, triggers, focus areas
3. **MCP Integrations** - Tool selection, credentials, health checks
4. **Update Preferences** - Auto-update, channels, notifications
5. **Quality Gates** - Coverage thresholds, security rules, performance targets
6. **Advanced Settings** - Logging, memory, performance tuning
7. **Import/Export** - Share or load team configurations

**Choose section (1-7)**: _[User responds]_

---

## 1. Project Settings

### Current Project Configuration

```json
{
  "projectType": "fullstack",
  "teamSize": "small",
  "experience": "intermediate",
  "technologies": ["TypeScript", "React", "Node.js", "Express"],
  "priorities": ["Quality", "Testing", "Speed"]
}
```

### Modify Settings

#### Project Type

- [ ] Frontend (React, Vue, Angular)
- [x] **Full-stack (Frontend + Backend)** ← Current
- [ ] Backend (Node.js, Python, Java)
- [ ] Mobile (React Native, Flutter)
- [ ] ML/AI (Python, TensorFlow)
- [ ] Enterprise (Microservices)

**Change?** (N/y):

---

#### Team Size

- [ ] Solo developer
- [x] **Small team (2-5 people)** ← Current
- [ ] Medium team (6-15 people)
- [ ] Large team (16+ people)

**Change?** (N/y):

---

#### Experience Level

- [ ] Beginner (New to AI tools)
- [x] **Intermediate (Some AI experience)** ← Current
- [ ] Expert (Multiple AI tools)

**Change?** (N/y):

---

#### Development Priorities (multi-select)

- [ ] Speed/Velocity
- [x] **Code Quality** ← Current
- [x] **Testing/QA** ← Current
- [ ] Security
- [ ] Performance
- [x] **Team Collaboration** ← Current

**Modify?** (N/y):

---

## 2. OPERA Agents

### Current Agent Configuration

| Agent | Status | Priority | Auto-Activate | Triggers | Focus Areas |
|-------|--------|----------|---------------|----------|-------------|
| **Maria-QA** | ✅ Active | 10/10 | ✅ Yes | `*.test.*`, `*.spec.*` | Testing, Coverage, Visual regression |
| **James-Frontend** | ✅ Active | 7/10 | ✅ Yes | `*.tsx`, `*.jsx`, `*.css` | Performance, Design system, Accessibility |
| **Marcus-Backend** | ✅ Active | 7/10 | ✅ Yes | `*.api.*`, `routes/**` | API design, Security, Database optimization |
| **Dana-Database** | ✅ Active | 6/10 | ✅ Yes | `*.sql`, `migrations/**` | Schema design, RLS policies, Query optimization |
| **Alex-BA** | 🔘 Inactive | 5/10 | ❌ No | `requirements/**`, `*.feature` | User stories, API contracts |
| **Sarah-PM** | 🔘 Inactive | 5/10 | ❌ No | `*.md`, `docs/**` | Project coordination, Sprint reports |
| **Dr.AI-ML** | 🔘 Inactive | 5/10 | ❌ No | `*.py`, `*.ipynb`, `models/**` | Model validation, ML deployment |
| **Oliver-MCP** | 🔘 Inactive | 5/10 | ❌ No | `mcp/**`, `*.mcp.*` | MCP routing, Anti-hallucination |

**Total Active**: 4/8 agents

---

### Modify Agent: Maria-QA

**Current Configuration**:
```json
{
  "agentName": "Maria-QA",
  "priority": 10,
  "autoActivate": true,
  "customTriggers": ["*.test.*", "*.spec.*", "__tests__/**"],
  "specialFocus": [
    "Automated testing",
    "Visual regression",
    "Performance testing",
    "Accessibility audits"
  ]
}
```

#### Settings

**Priority** (1-10, higher = more important):
- Current: `10` (Highest)
- Change to: _[User input or press Enter to keep]_

**Auto-Activation**:
- Current: `✅ Enabled`
- Disable? (N/y):

**Additional Triggers** (comma-separated file patterns):
- Current: `*.test.*, *.spec.*, __tests__/**`
- Add more: _[User input or press Enter to skip]_

**Focus Areas** (select multiple):
- [x] Automated testing
- [x] Visual regression
- [x] Performance testing
- [x] Accessibility audits
- [ ] Security testing
- [ ] API testing
- [ ] Load testing

**Modify focus?** (N/y):

---

### Enable Additional Agents

**Alex-BA** (Requirements Analyst) - Currently inactive

Benefits:
- ✅ User story creation
- ✅ API contract validation
- ✅ Business logic review
- ✅ Analytics integration

Recommended for:
- Enterprise projects
- Large teams
- Complex requirements

**Enable Alex-BA?** (Y/n):

---

**Sarah-PM** (Project Coordinator) - Currently inactive

Benefits:
- ✅ Sprint reporting
- ✅ Milestone tracking
- ✅ Agent coordination
- ✅ Documentation management

Recommended for:
- Team projects
- Long-term projects
- Multiple stakeholders

**Enable Sarah-PM?** (Y/n):

---

## 3. MCP Integrations

### Current MCP Configuration

| MCP Tool | Status | Health | Last Check | Agents Using |
|----------|--------|--------|------------|--------------|
| **Playwright/Chrome** | ✅ Active | 🟢 Good | 2 min ago | Maria-QA, James |
| **GitHub** | ✅ Active | 🟢 Good | 5 min ago | Marcus, Sarah, Alex |
| **Supabase** | ✅ Active | 🟢 Good | 1 min ago | All agents |
| **Semgrep** | ✅ Active | 🟢 Good | 10 min ago | Marcus, Maria |
| **Exa Search** | 🔘 Inactive | - | - | Alex-BA, Dr.AI-ML |
| **Vertex AI** | 🔘 Inactive | - | - | Dr.AI-ML |
| **n8n** | 🔘 Inactive | - | - | Sarah-PM |
| **Sentry** | 🔘 Inactive | - | - | Maria, Sarah |
| **Shadcn** | 🔘 Inactive | - | - | James-Frontend |
| **Ant Design** | 🔘 Inactive | - | - | James-Frontend |
| **GitMCP** | 🔘 Inactive | - | - | All agents |
| **Playwright Stealth** | 🔘 Inactive | - | - | Maria-QA, James |

**Active**: 4/12 MCPs

---

### Enable MCP: Exa Search

**Exa** - AI-Powered Search Engine

**Use Cases**:
- Research documentation
- Find code examples
- Competitive analysis
- Pattern discovery

**Required Credentials**:
```bash
EXA_API_KEY=your-api-key-here
```

**Get API key**: https://exa.ai/api-keys

**Enable Exa?** (Y/n):

---

### Enable MCP: Vertex AI

**Vertex AI** - Google Cloud AI Platform

**Use Cases**:
- Gemini model access
- ML model deployment
- AI predictions
- Vector embeddings

**Required Credentials**:
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Setup guide**: https://cloud.google.com/vertex-ai/docs/setup

**Enable Vertex AI?** (Y/n):

---

### MCP Health Check

Running health check for all active MCPs...

```
[████████████████████████] 100% - Health check complete

✅ Playwright/Chrome - Response time: 234ms
✅ GitHub - Response time: 156ms
✅ Supabase - Response time: 89ms
✅ Semgrep - Response time: 412ms

All MCPs healthy! 🟢
```

**Configure MCP settings?** (N/y):

---

## 4. Update Preferences

### Current Update Settings

```json
{
  "updateBehavior": "notify",          // notify | auto | manual
  "updateChannel": "stable",           // stable | beta | edge
  "safetyLevel": "balanced",           // conservative | balanced | aggressive
  "checkFrequency": 24,                // hours
  "autoInstallSecurity": true,         // auto-install security patches
  "rollbackBehavior": "prompt",        // auto | prompt | manual
  "maxRollbackPoints": 5,              // number of backups to keep
  "backupBeforeUpdate": true,          // create backup before update
  "notifyOnUpdateAvailable": true,     // show notification
  "notifyOnUpdateInstalled": true,     // show notification after install
  "notifyOnSecurityUpdate": true,      // show security update alerts
  "notifyOnBreakingChange": true       // show breaking change warnings
}
```

---

### Update Behavior

**How should updates be handled?**

- [ ] **Automatic** - Install updates automatically (stable channel only)
- [x] **Notify** - Show notification, user confirms ← Current
- [ ] **Manual** - Never check for updates

**Change?** (N/y):

---

### Update Channel

**Which release channel to follow?**

| Channel | Description | Update Frequency | Stability |
|---------|-------------|------------------|-----------|
| **Stable** | Production releases | Monthly | 🟢 High |
| **Beta** | Pre-release features | Weekly | 🟡 Medium |
| **Edge** | Latest development | Daily | 🔴 Experimental |

- [x] **Stable** ← Current
- [ ] Beta
- [ ] Edge

**Change channel?** (N/y):

---

### Auto-Install Security Updates

**Automatically install security patches?**

- [x] **Yes** - Auto-install critical security updates ← Current
- [ ] No - Wait for user confirmation

Security updates are:
- ✅ Always backward compatible
- ✅ Only fix vulnerabilities (no features)
- ✅ Installed silently (no disruption)
- ✅ Rollback available if needed

**Change?** (N/y):

---

### Backup Configuration

**Create backup before updates?**

- [x] **Yes** - Always backup before update ← Current
- [ ] No - Skip backup (faster but risky)

**Number of backups to keep**: 5 ← Current
**Change?** (enter number or press Enter to keep):

**Backup location**: `~/.versatil/backups/`

---

## 5. Quality Gates

### Current Quality Gate Configuration

```json
{
  "coverage": {
    "minimum": 80,               // 80%+ required
    "enforceOnCommit": true,     // Block commits if below
    "excludePaths": ["*.test.*"] // Paths to exclude
  },
  "security": {
    "owasp": true,               // OWASP Top 10 checks
    "semgrep": true,             // Static analysis
    "dependencyAudit": true      // npm audit
  },
  "performance": {
    "responseTime": 200,         // Max API response (ms)
    "lighthouse": 90,            // Min Lighthouse score
    "bundleSize": 500            // Max bundle size (KB)
  },
  "accessibility": {
    "wcag": "AA",                // WCAG 2.1 AA compliance
    "axeCore": true,             // axe-core audits
    "colorContrast": 4.5         // Minimum contrast ratio
  }
}
```

---

### Test Coverage

**Minimum coverage required**:

- Current: `80%` ← Recommended
- Change to: _[User input or press Enter to keep]_

**Enforce on git commit?**

- [x] **Yes** - Block commits if coverage < 80% ← Current
- [ ] No - Allow commits (warn only)

**Change?** (N/y):

---

### Security Scanning

**Enabled security checks**:

- [x] OWASP Top 10 validation
- [x] Semgrep static analysis
- [x] npm audit (dependency vulnerabilities)
- [ ] Snyk integration
- [ ] CodeQL analysis

**Modify?** (N/y):

---

### Performance Thresholds

**Maximum API response time**:
- Current: `200ms`
- Change to: _[User input or press Enter to keep]_

**Minimum Lighthouse score**:
- Current: `90/100`
- Change to: _[User input or press Enter to keep]_

**Maximum bundle size**:
- Current: `500 KB`
- Change to: _[User input or press Enter to keep]_

---

### Accessibility Standards

**WCAG compliance level**:

- [ ] A (Minimum)
- [x] **AA (Recommended)** ← Current
- [ ] AAA (Highest)

**Minimum color contrast ratio**:
- Current: `4.5:1` (WCAG AA standard)
- Change to: _[User input or press Enter to keep]_

**Enable axe-core audits?**

- [x] **Yes** ← Current
- [ ] No

---

## 6. Advanced Settings

### Performance Tuning

```json
{
  "memory": {
    "maxMemoryUsage": 2048,      // MB
    "cacheSize": 512,            // MB
    "gcInterval": 3600           // seconds
  },
  "parallelism": {
    "maxConcurrentTasks": 4,
    "maxConcurrentAgents": 3
  },
  "logging": {
    "level": "info",             // debug | info | warn | error
    "maxFileSize": 10,           // MB
    "retention": 30              // days
  }
}
```

**Modify advanced settings?** (N/y):

---

### Logging Configuration

**Log level**:

- [ ] Debug (Verbose - all events)
- [x] **Info (Normal - important events)** ← Current
- [ ] Warn (Minimal - warnings only)
- [ ] Error (Critical only)

**Max log file size**: 10 MB ← Current
**Log retention**: 30 days ← Current

**Change logging settings?** (N/y):

---

## 7. Import/Export Configuration

### Export Configuration

**Export current configuration to share with team**:

```bash
Exporting configuration...
✅ Exported to: .versatil/config-export-2025-10-26.json

Share this file with your team:
- Email, Slack, or commit to git
- Others can import via: /config-wizard --import
```

**Export now?** (Y/n):

---

### Import Configuration

**Import configuration from file**:

```bash
Available configs:
1. team-config.json (from Alex, 2025-10-25)
2. production-config.json (stable, 2025-10-20)
3. config-backup-v7.1.0.json (backup, 2025-10-26)

Select file (1-3) or enter path:
```

**Import configuration?** (Y/n):

---

### Configuration Preview

**Preview before importing**:

```diff
Changes from import:

Modified:
+ Project type: fullstack → enterprise
+ Team size: small → large
+ Enabled agents: 4 → 8 (added Alex-BA, Sarah-PM, Dr.AI-ML, Oliver-MCP)
+ MCP integrations: 4 → 8 (added Exa, Vertex AI, n8n, Sentry)
+ Quality gates: coverage 80% → 85%

No settings removed ✅
```

**Apply imported configuration?** (Y/n):

---

## Configuration Summary

### Current Configuration (After Changes)

**Project Settings**:
- Type: Full-stack
- Team: Small (2-5 people)
- Experience: Intermediate
- Priorities: Quality, Testing, Speed

**Agents** (4 active):
- ✅ Maria-QA (priority: 10, auto-activate)
- ✅ James-Frontend (priority: 7, auto-activate)
- ✅ Marcus-Backend (priority: 7, auto-activate)
- ✅ Dana-Database (priority: 6, auto-activate)

**MCP Integrations** (4 active):
- ✅ Playwright/Chrome
- ✅ GitHub
- ✅ Supabase
- ✅ Semgrep

**Quality Gates**:
- Coverage: ≥80%
- Security: OWASP + Semgrep
- Performance: <200ms API, >90 Lighthouse
- Accessibility: WCAG 2.1 AA

**Update Preferences**:
- Behavior: Notify
- Channel: Stable
- Auto-security: Enabled
- Backup: Enabled (keep 5)

---

### Save Configuration?

**Save changes to**:
- `.versatil/config.json`
- `.versatil/agents/*.json`
- `.cursorrules`

**Confirm save?** (Y/n):

---

## ✅ Configuration Saved!

Your VERSATIL Framework configuration has been updated successfully.

### Changes Applied

- ✅ Updated project settings
- ✅ Modified agent configurations (4 agents)
- ✅ Configured MCP integrations (4 MCPs)
- ✅ Set quality gate thresholds
- ✅ Updated update preferences

### Next Steps

1. **Verify configuration**:
   ```bash
   npm run monitor      # Check framework health
   ```

2. **Test agent activation**:
   - Edit a test file → Maria-QA should activate
   - Check agent priorities are working

3. **Run health check**:
   ```bash
   npm run doctor       # Auto-fix any issues
   ```

---

**Configuration saved!** Your framework is ready with your customized settings. 🎉

---

**Implementation Note for Claude**:

When user invokes `/config-wizard`, you should:

1. **Load current configuration**:
   ```typescript
   const config = JSON.parse(await readFile('.versatil/config.json'));
   ```

2. **Show current settings** (use tables, checkboxes):
   - Project settings
   - Agent configurations
   - MCP integrations
   - Quality gates
   - Update preferences

3. **Ask user which section to modify**:
   - Progressive disclosure (one section at a time)
   - Show current value, ask for new value
   - Validate input (e.g., coverage must be 0-100)

4. **Preview changes** (diff format):
   ```diff
   + Added: Alex-BA agent
   - Removed: None
   Modified: Maria-QA priority 8 → 10
   ```

5. **Confirm and save**:
   ```typescript
   await writeFile('.versatil/config.json', JSON.stringify(updatedConfig, null, 2));
   await writeFile('.versatil/agents/maria-qa.json', JSON.stringify(agentConfig, null, 2));
   ```

6. **Verify configuration**:
   ```bash
   npm run doctor --fix
   ```

---

**Visual Elements to Use**:
- 📊 Tables for settings comparison
- ✅❌🟢🟡🔴 Status indicators
- 📁 Code blocks for JSON previews
- 🎯 Progress indicators
- 💡 Callout boxes for recommendations
- ```diff Diff format for changes

This creates a **GUI-like settings interface in chat** similar to VSCode's settings UI!
