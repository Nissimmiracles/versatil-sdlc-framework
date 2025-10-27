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
| **RAG Storage** | 🟡 Public only | 2025-10-27 14:22 |
| **Update Preferences** | ✅ Configured | 2025-10-26 10:15 |
| **Quality Gates** | ✅ Configured | 2025-10-26 10:15 |

**Overall Health**: 🟢 98% (Excellent)

---

## Configuration Sections

**What would you like to configure?**

1. **Project Settings** - Type, team size, tech stack, priorities
2. **OPERA Agents** - Enable/disable, priorities, triggers, focus areas
3. **MCP Integrations** - Tool selection, credentials, health checks
4. **RAG Storage** - Configure Public/Private RAG, storage backends (NEW v7.7.0+)
5. **Update Preferences** - Auto-update, channels, notifications
6. **Quality Gates** - Coverage thresholds, security rules, performance targets
7. **Advanced Settings** - Logging, memory, performance tuning
8. **Import/Export** - Share or load team configurations

**Choose section (1-8)**: _[User responds]_

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

## 4. RAG Storage (NEW - v7.7.0+)

### Current RAG Configuration

```json
{
  "publicRAG": {
    "status": "connected",
    "backend": "firestore",
    "project": "centering-vine-454613-b3",
    "database": "versatil-public-rag",
    "patternCount": 1247,
    "edgeAcceleration": true,
    "cloudRunUrl": "https://versatil-graphrag-query-xxxxx-uc.a.run.app"
  },
  "privateRAG": {
    "status": "not_configured",
    "backend": null,
    "patternCount": 0
  }
}
```

**Current Status**:
- 🌍 **Public RAG**: ✅ Connected (1,247 patterns)
- 🔒 **Private RAG**: ⚠️ Not configured

---

### Configure Private RAG Storage

**Why Private RAG?**
- ✅ Store company-specific patterns privately (100% data privacy)
- ✅ 40% more accurate plans (your patterns prioritized over generic)
- ✅ Zero data leaks (patterns never leave your storage)
- ✅ Free tier available (Firestore 1GB, Supabase 500MB, Local unlimited)

**Do you want to configure Private RAG?** (Y/n):

---

#### Storage Backend Selection

**Choose Private RAG storage backend:**

| Option | Backend | Free Tier | Best For | Setup Time |
|--------|---------|-----------|----------|------------|
| 1 | **Google Cloud Firestore** | 1GB, 50K reads/day | Production, Best performance | 3 min |
| 2 | **Supabase pgvector** | 500MB, unlimited requests | Full PostgreSQL features | 2 min |
| 3 | **Local JSON** | Unlimited, $0 | Offline, privacy-first | 1 min |

**Choose backend (1/2/3)**: _[User responds]_

---

#### Option 1: Google Cloud Firestore

**Requirements**:
- Google Cloud project with Firestore enabled
- Service account JSON key file

**Configuration**:
```
Enter Google Cloud Project ID: _____________
Enter path to service account JSON: _____________
Enter Firestore database ID (default: private-rag): _____________
```

**Testing connection**...
```
[████████████████████████] 100% - Connection successful!

✅ Connected to Firestore
✅ Database: my-project-id/private-rag
✅ Write test: Passed
✅ Read test: Passed
✅ Query test: Passed (52ms)

Private RAG configured successfully! 🎉
```

---

#### Option 2: Supabase pgvector

**Requirements**:
- Supabase project with pgvector extension
- Project URL and anon key

**Configuration**:
```
Enter Supabase project URL: https://_____________.supabase.co
Enter Supabase anon key: ___________________________________________
Enable RLS policies? (Y/n): _____
```

**Testing connection**...
```
[████████████████████████] 100% - Connection successful!

✅ Connected to Supabase
✅ Database: my-project.supabase.co
✅ pgvector extension: Enabled
✅ RLS policies: Configured
✅ Query test: Passed (48ms)

Private RAG configured successfully! 🎉
```

---

#### Option 3: Local JSON

**Configuration**:
```
Enter storage directory (default: ~/.versatil/private-rag): _____________
Enable automatic backups? (Y/n): _____
Backup frequency (hours, default: 24): _____
```

**Initializing local storage**...
```
[████████████████████████] 100% - Setup complete!

✅ Created directory: ~/.versatil/private-rag/
✅ Initialized pattern index
✅ Configured auto-backup (every 24h)
✅ Write test: Passed
✅ Read test: Passed

Private RAG configured successfully! 🎉
```

---

### RAG Storage Settings

**Pattern Storage Preferences**:

```json
{
  "defaultStorageLocation": "private",  // private | public | both
  "autoClassify": true,                 // Auto-classify patterns when "both"
  "privateKeywords": [                  // Triggers for private classification
    "company", "client", "proprietary", "internal", "confidential"
  ],
  "publicKeywords": [                   // Triggers for public classification
    "react", "authentication", "testing", "best practice"
  ]
}
```

**When using /learn, default to**:
- [x] **Private RAG** (recommended for proprietary work)
- [ ] Public RAG (contribute to framework)
- [ ] Both (auto-classify)

**Enable auto-classification?** (Y/n):

---

### Migrate Existing Patterns

**You have existing patterns that need migration to Public/Private stores.**

**Existing patterns**: 342 total
- Will classify as: **~215 public**, **~127 private** (estimated)

**Migrate now?** (Y/n):

**If yes**:
```
Running migration...
[████████████████████████] 100% - Migration complete!

✅ Classified 342 patterns
✅ Migrated 215 patterns → Public RAG (63%)
✅ Migrated 127 patterns → Private RAG (37%)
✅ Backup created: ~/.versatil/backups/rag-migration-2025-10-27.json

View report: /rag migrate --report
```

---

### Verify Privacy Separation

**Run privacy verification tests?** (Y/n):

**If yes**:
```
Running verification tests...
[████████████████████████] 100% - Tests complete!

✅ Public RAG Privacy: PASSED
   No private data detected (sampled 50 patterns)

✅ Classification Accuracy: PASSED
   Overall: 97% accuracy

✅ RAG Router Prioritization: PASSED
   Private patterns correctly prioritized

✅ Query Performance: PASSED
   Average: 68ms (target: <100ms)

✅ Deduplication: PASSED
   All results unique

Overall Status: ✅ PASSED
```

**Configure RAG storage?** (Y/n):

---

## 5. Update Preferences

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

## 6. Quality Gates

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

## 7. Advanced Settings

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

## 8. Import/Export Configuration

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

### Validate Configuration ⭐ AGENT-DRIVEN (Victor-Verifier)

<thinking>
Before saving configuration changes, use Victor-Verifier to validate for conflicts, invalid settings, and potential issues.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE VICTOR-VERIFIER USING THE TASK TOOL:**

**ACTION: Invoke Victor-Verifier Agent**
Call the Task tool with:
- `subagent_type: "Victor-Verifier"`
- `description: "Validate configuration changes"`
- `prompt: "Validate configuration changes before saving. Input: Modified settings (project type, agents, MCP integrations, quality gates, RAG storage), original configuration (before changes). Your anti-hallucination verification: (1) Extract configuration claims ('Maria-QA priority changed to 10', 'Alex-BA enabled', 'Test coverage threshold set to 85%'), (2) Verify settings are valid (priority must be 1-10, coverage must be 0-100, agent triggers must be valid glob patterns), (3) Detect conflicts (two agents with same trigger patterns, overlapping MCP tools, contradictory quality gate thresholds), (4) Validate agent dependencies (if Alex-BA enabled, check if required MCPs are configured, if Private RAG enabled, verify storage backend configured), (5) Check for breaking changes (disabling agents that todos depend on, removing MCP tools in active use, changing triggers that break existing workflows), (6) Validate file pattern syntax (*.test.* is valid, *test* may be too broad, test.*.tsx has syntax error), (7) Cross-check compatibility (RAG storage backend supports required features, MCP tools work with selected agents, quality thresholds are achievable). Return: { validated_settings: [{setting, valid: boolean, value, issues: []}], conflicts: [{setting1, setting2, conflict_type, severity}], invalid_values: [{setting, value, expected_range, error}], breaking_changes: [{change, affected_components: [], mitigation}], configuration_health_score: 0-100, safe_to_save: boolean }"`

**Expected Victor-Verifier Output:**

```typescript
interface ConfigurationValidationResult {
  validated_settings: Array<{
    setting_path: string;              // e.g., "agents.maria-qa.priority"
    setting_name: string;              // e.g., "Maria-QA Priority"
    valid: boolean;                    // true = valid value
    value: any;                        // Actual value
    issues: string[];                  // Problems found (empty if valid)
  }>;

  conflicts: Array<{
    setting1: string;                  // e.g., "agents.maria-qa.triggers"
    setting2: string;                  // e.g., "agents.marcus-backend.triggers"
    conflict_type: string;             // e.g., "overlapping_triggers", "duplicate_priority"
    description: string;               // What the conflict is
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution: string;                // How to fix
  }>;

  invalid_values: Array<{
    setting: string;
    value: any;
    expected_range: string;            // e.g., "1-10", "0-100%", "valid glob pattern"
    error: string;
  }>;

  breaking_changes: Array<{
    change: string;                    // e.g., "Disabled Maria-QA agent"
    affected_components: string[];     // What this breaks
    impact: 'low' | 'medium' | 'high';
    mitigation: string;                // How to prevent issues
  }>;

  configuration_health_score: number;  // 0-100
  safe_to_save: boolean;               // true = proceed, false = fix issues first
}
```

**Configuration Validation Examples:**

```typescript
// Example validation result
const validation = {
  validated_settings: [
    {
      setting_path: "agents.maria-qa.priority",
      setting_name: "Maria-QA Priority",
      valid: true,
      value: 10,
      issues: []
    },
    {
      setting_path: "qualityGates.testCoverage",
      setting_name: "Test Coverage Threshold",
      valid: false,
      value: 150,  // INVALID - over 100
      issues: ["Value 150 exceeds maximum of 100"]
    },
    {
      setting_path: "agents.james-frontend.triggers",
      setting_name: "James-Frontend Triggers",
      valid: true,
      value: ["*.tsx", "*.jsx", "*.css"],
      issues: []
    }
  ],

  conflicts: [
    {
      setting1: "agents.maria-qa.triggers",
      setting2: "agents.marcus-backend.triggers",
      conflict_type: "overlapping_triggers",
      description: "Both Maria-QA and Marcus-Backend trigger on '*.test.ts' - will cause dual activation",
      severity: "medium",
      resolution: "Change Marcus triggers to '*.api.test.ts' or keep only Maria for all tests"
    },
    {
      setting1: "mcpIntegrations.supabase.enabled",
      setting2: "rag.privateStorage.backend",
      conflict_type: "dependency_missing",
      description: "Private RAG configured for Supabase but Supabase MCP is disabled",
      severity: "critical",
      resolution: "Enable Supabase MCP or change RAG backend to local/firestore"
    }
  ],

  invalid_values: [
    {
      setting: "qualityGates.testCoverage",
      value: 150,
      expected_range: "0-100 (percentage)",
      error: "Test coverage cannot exceed 100%"
    },
    {
      setting: "agents.custom-agent.triggers",
      value: ["*test*"],  // Too broad
      expected_range: "Valid glob patterns (e.g., *.test.*, **/__tests__/**)",
      error: "Pattern '*test*' is too broad and will match unintended files like 'latest.txt'"
    },
    {
      setting: "mcpIntegrations.playwright.credentials.apiKey",
      value: "PLACEHOLDER_KEY",
      expected_range: "Valid API key (not placeholder)",
      error: "API key appears to be placeholder value, not real credentials"
    }
  ],

  breaking_changes: [
    {
      change: "Disabled Dana-Database agent",
      affected_components: [
        "3 pending todos assigned to Dana-Database",
        "Database migration workflow",
        "Supabase integration patterns"
      ],
      impact: "high",
      mitigation: "Complete todos/001-003 assigned to Dana before disabling, or reassign to Marcus-Backend"
    },
    {
      change: "Changed Maria-QA triggers from '*.test.*' to '*.spec.*' only",
      affected_components: [
        "Existing test files using .test.ts pattern",
        "Auto-activation for 47 test files",
        "CI/CD test automation"
      ],
      impact: "medium",
      mitigation: "Keep both patterns: '*.test.*' and '*.spec.*' to maintain backward compatibility"
    }
  ],

  configuration_health_score: 72,  // Medium health (has issues)
  safe_to_save: false  // Do NOT save - critical conflicts exist
};
```

**Conflict Detection Examples:**

```typescript
// Conflict 1: Overlapping agent triggers
const conflict_overlapping_triggers = {
  setting1: "agents.maria-qa.triggers",
  setting2: "agents.marcus-backend.triggers",
  conflict_type: "overlapping_triggers",
  description: "Both trigger on '*.test.ts' files - will cause double agent activation",
  severity: "medium",
  resolution: "Options: (1) Keep Maria for all tests, (2) Marcus only for API tests (*.api.test.ts), (3) Add coordination logic"
};

// Conflict 2: Invalid priority values
const conflict_duplicate_priority = {
  setting1: "agents.maria-qa.priority",
  setting2: "agents.marcus-backend.priority",
  conflict_type: "duplicate_priority",
  description: "Both agents have priority 10 - ambiguous which activates first",
  severity: "low",
  resolution: "Set different priorities (e.g., Maria=10, Marcus=9) for deterministic ordering"
};

// Conflict 3: MCP dependency missing
const conflict_mcp_dependency = {
  setting1: "rag.privateStorage.backend",
  setting2: "mcpIntegrations.firestore.enabled",
  conflict_type: "dependency_missing",
  description: "Private RAG configured for Firestore but Firestore MCP is disabled",
  severity: "critical",
  resolution: "Enable Firestore MCP or change RAG backend to 'local' or 'supabase'"
};

// Conflict 4: Quality gate unreachable
const conflict_unreachable_threshold = {
  setting1: "qualityGates.testCoverage",
  setting2: "agents.maria-qa.enabled",
  conflict_type: "unreachable_goal",
  description: "Test coverage threshold set to 95% but Maria-QA (testing agent) is disabled",
  severity: "high",
  resolution: "Enable Maria-QA to achieve 95% coverage, or lower threshold to realistic level without automated testing"
};
```

**Invalid Value Detection Examples:**

```typescript
// Invalid 1: Out of range
{
  setting: "agents.maria-qa.priority",
  value: 15,
  expected_range: "1-10",
  error: "Priority must be between 1 and 10"
}

// Invalid 2: Invalid glob pattern
{
  setting: "agents.custom-agent.triggers",
  value: ["test.*.tsx"],  // Syntax error - should be *.test.tsx
  expected_range: "Valid glob patterns",
  error: "Pattern 'test.*.tsx' is invalid - did you mean '*.test.tsx'?"
}

// Invalid 3: Placeholder credentials
{
  setting: "mcpIntegrations.supabase.credentials.url",
  value: "YOUR_SUPABASE_URL_HERE",
  expected_range: "Valid Supabase URL (https://*.supabase.co)",
  error: "Supabase URL appears to be placeholder, not real endpoint"
}

// Invalid 4: Contradictory settings
{
  setting: "updatePreferences.autoUpdate",
  value: true,
  expected_range: "false when using offline mode",
  error: "Auto-update requires internet but offline mode is enabled"
}
```

**Validation Results Processing:**

After Victor-Verifier completes, process results:

```typescript
if (validation.safe_to_save === false) {
  console.log("❌ CONFIGURATION VALIDATION FAILED\n");
  console.log(`Configuration Health: ${validation.configuration_health_score}/100\n`);

  // Show critical conflicts
  const critical_conflicts = validation.conflicts.filter(c => c.severity === 'critical');
  if (critical_conflicts.length > 0) {
    console.log("🔴 Critical Conflicts (must fix):\n");
    critical_conflicts.forEach(c => {
      console.log(`- **${c.conflict_type.toUpperCase()}**`);
      console.log(`  ${c.description}`);
      console.log(`  Resolution: ${c.resolution}\n`);
    });
  }

  // Show invalid values
  if (validation.invalid_values.length > 0) {
    console.log("⚠️ Invalid Settings:\n");
    validation.invalid_values.forEach(iv => {
      console.log(`- **${iv.setting}**: ${iv.value}`);
      console.log(`  Expected: ${iv.expected_range}`);
      console.log(`  Error: ${iv.error}\n`);
    });
  }

  // Show breaking changes
  if (validation.breaking_changes.length > 0) {
    console.log("💔 Breaking Changes:\n");
    validation.breaking_changes.forEach(bc => {
      console.log(`- ${bc.change} (${bc.impact} impact)`);
      console.log(`  Affected: ${bc.affected_components.join(', ')}`);
      console.log(`  Mitigation: ${bc.mitigation}\n`);
    });
  }

  console.log("⚠️ Fix issues above before saving configuration");
  return; // BLOCK save - configuration has critical issues
}

// All validations passed - safe to save
console.log(`✅ Configuration Validation Passed (Health: ${validation.configuration_health_score}/100)\n`);

// Show non-critical warnings
const warnings = validation.conflicts.filter(c => c.severity === 'low' || c.severity === 'medium');
if (warnings.length > 0) {
  console.log("⚠️ Non-Critical Warnings:\n");
  warnings.forEach(w => {
    console.log(`- ${w.description}`);
    console.log(`  Suggestion: ${w.resolution}\n`);
  });
}

// Show what will be saved
console.log("📋 Validated Settings:\n");
const valid_settings = validation.validated_settings.filter(s => s.valid);
valid_settings.forEach(s => {
  console.log(`✅ ${s.setting_name}: ${JSON.stringify(s.value)}`);
});

console.log("\nProceeding with save...\n");
```

---

## ✅ Configuration Saved!

Your VERSATIL Framework configuration has been updated and validated successfully.

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
