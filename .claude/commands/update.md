---
name: update
description: Interactive version update wizard with visual changelog (chat-based GUI)
tags: [update, version, upgrade, migration, changelog]
---

# VERSATIL Version Update Wizard

**Keep your VERSATIL Framework up-to-date with the latest features and improvements!**

This interactive wizard will:
- 🔍 **Check for updates** - Compare your version with latest releases
- 📋 **Show changelog** - Visual diff of what's new
- ⚡ **Preview features** - See new automation capabilities
- 🛡️ **Safety check** - Backup before update
- 🚀 **Install** - One-click update with progress tracking

---

## Quick Update Check

Let me check for updates...

### Current Status

| Item | Your Version | Latest Version | Status |
|------|-------------|----------------|--------|
| **VERSATIL Framework** | v7.1.0 | v7.3.0 | 🟡 Update Available |
| **Claude Code SDK** | v0.1.8 | v0.1.10 | 🟡 Update Available |
| **MCP Dependencies** | Mixed | Latest | 🟢 Up to date |

**Recommendation**: ✅ Update recommended (new features + bug fixes)

---

## What's New in v7.3.0

### ✨ Major Features

#### 1. Named Patterns (5 Total) 🎯 **NEW!**
Pre-built implementation patterns for common scenarios:

| Pattern | Use Case | Time Saved | Success Rate |
|---------|----------|------------|--------------|
| **oauth2-flow** | OAuth2 authentication | 8-12h → 2h | 95% |
| **database-migrations** | Schema migrations | 6-8h → 1.5h | 92% |
| **graphql-api** | GraphQL API setup | 10-14h → 3h | 88% |
| **react-dashboard** | Dashboard UI | 12-16h → 4h | 90% |
| **docker-deploy** | Docker deployment | 4-6h → 1h | 93% |

#### 2. Automation Enhancements 🚀
- **87.5% automation success rate** (7/8 scenarios verified)
- Template auto-application (no confirmation needed)
- Cross-skill auto-loading (related libraries load together)
- Improved intent detection (hooks detect what you're building)

#### 3. Proactive Onboarding Updates 💡
- Chat-based GUI wizards (`/onboard`, `/update`, `/config-wizard`)
- Visual configuration preview
- Real-time validation feedback

---

### 🐛 Bug Fixes

- ✅ Fixed hook output format (plain text, not JSON)
- ✅ Improved isNewFile() detection (30s window)
- ✅ Removed non-existent RAG patterns (jwt-auth-cookies)
- ✅ Enhanced cross-skill relationship mapping (8 relationships)

---

### 📊 Performance Improvements

| Metric | Before (v7.1.0) | After (v7.3.0) | Improvement |
|--------|-----------------|----------------|-------------|
| **Token savings** | 94.1% | 94.1% | Maintained |
| **Template discovery** | Manual search | Auto-suggested | 10x faster |
| **Pattern usage** | Manual search | Auto-applied | 8x faster |
| **Agent activation** | User interprets JSON | Auto-invoked | 100% usage |

---

### 🔄 Migration Required?

**No migration needed!** ✅

v7.3.0 is **fully backward compatible** with v7.1.0. Your existing:
- ✅ Agent configurations stay intact
- ✅ Project settings unchanged
- ✅ RAG patterns preserved
- ✅ Todo files work as-is

---

## Update Options

### Option 1: Quick Update (Recommended) ⚡

**Automatic update with smart defaults**

```bash
# I'll handle everything:
# 1. Backup current installation
# 2. Pull latest changes
# 3. Install dependencies
# 4. Verify installation
# 5. Show what changed
```

**Estimated time**: 2-3 minutes

**Proceed with quick update?** (Y/n):

---

### Option 2: Custom Update (Advanced) 🛠️

**Step-by-step with full control**

#### Step 1: Backup Current Installation

I'll create a backup before updating:

```
Backup location: ~/.versatil/backups/v7.1.0_2025-10-26_14-30-00/
```

**Create backup?** (Y/n):

---

#### Step 2: Choose Update Channel

| Channel | Description | Stability | Auto-Updates |
|---------|-------------|-----------|--------------|
| **Stable** | Production-ready releases | 🟢 High | Minor + Patch |
| **Beta** | Pre-release features | 🟡 Medium | All updates |
| **Edge** | Latest development | 🔴 Experimental | Daily builds |

**Current channel**: Stable
**Switch channel?** (N/y):

---

#### Step 3: Select Components to Update

- [x] **Core Framework** (required)
- [x] **OPERA Agents** (8 core agents)
- [x] **Skills Library** (30 skills)
- [ ] **MCP Dependencies** (optional - 12 integrations)
- [x] **Documentation** (updated guides)
- [ ] **Development Tools** (optional - testing, linting)

**Customize selection?** (Y/n):

---

#### Step 4: Review Changes

**Files to be updated** (23 total):

```diff
Modified:
+ package.json (v7.1.0 → v7.3.0)
+ CLAUDE.md (added v7.3.0 features section)
+ .claude/skills/ (5 new named patterns)
+ docs/AUTOMATION_TEST_REPORT.md (87.5% success rate)
+ scripts/postinstall-wizard.cjs (added "What's New" section)
+ src/onboarding-wizard.ts (enhanced completion message)

Added:
+ .claude/skills/rag-patterns/oauth2-flow/
+ .claude/skills/rag-patterns/database-migrations/
+ .claude/skills/rag-patterns/graphql-api/
+ .claude/skills/rag-patterns/react-dashboard/
+ .claude/skills/rag-patterns/docker-deploy/
+ .claude/commands/onboard.md (new chat-based wizard)
+ .claude/commands/update.md (this file!)
+ docs/WHATS_NEW_V7.3.0.md (release notes)

No files removed ✅
```

**Proceed with update?** (Y/n):

---

#### Step 5: Install Update

**Progress**:

```
[████████████████████████] 100% - Update complete!

✅ Pulled latest changes from GitHub
✅ Installed 3 new dependencies
✅ Updated 23 files
✅ Verified installation
✅ Rebuilt TypeScript (npm run build)
✅ Ran health check (98% score)
```

**Time elapsed**: 2 minutes 14 seconds

---

## ✨ Update Complete!

### Summary

**Updated from**: v7.1.0 → v7.3.0
**Components updated**: Core, Agents, Skills, Docs
**Backup location**: `~/.versatil/backups/v7.1.0_2025-10-26_14-30-00/`

---

### 🎯 New Features Available Now

1. **Named Patterns** (`/plan` now uses 5 proven patterns)
2. **Chat-based wizards** (`/onboard`, `/update`, `/config-wizard`)
3. **Enhanced automation** (87.5% success rate, templates auto-apply)

---

### 🚀 Try These New Commands

```bash
# Test new named patterns
/plan "add OAuth2 authentication"
# → Will suggest oauth2-flow pattern (95% success, saves 8-12h)

# Test new chat-based onboarding
/onboard
# → Interactive GUI wizard in chat

# Test new configuration wizard
/config-wizard
# → Visual settings interface
```

---

### 📚 Documentation Updates

New/updated docs to check out:

- **docs/WHATS_NEW_V7.3.0.md** - Full release notes
- **docs/AUTOMATION_TEST_REPORT.md** - Updated test results (87.5%)
- **CLAUDE.md** - Enhanced with v7.3.0 features
- **.claude/skills/rag-patterns/** - 5 new named patterns

---

### 🔄 Rollback (If Needed)

If you encounter issues, rollback to v7.1.0:

```bash
versatil-rollback previous
# → Restores backup from: ~/.versatil/backups/v7.1.0_...
```

**Rollback is safe** - your configuration and data are preserved.

---

## Update Configuration

### Auto-Update Settings

**Current settings**:

```json
{
  "updateBehavior": "notify",         # notify | auto | manual
  "updateChannel": "stable",          # stable | beta | edge
  "checkFrequency": 24,               # hours
  "autoInstallSecurity": true,        # auto-install security patches
  "backupBeforeUpdate": true,         # create backup before update
  "notifyOnUpdateAvailable": true     # show notification
}
```

**Change settings?** Use `/config-wizard` to customize.

---

## Advanced Update Options

### Check Specific Version
```bash
/update --version=7.2.0      # Update to specific version
```

### Dry Run (Preview Only)
```bash
/update --dry-run            # Preview changes without installing
```

### Skip Backup
```bash
/update --no-backup          # Skip backup (not recommended)
```

### Force Update
```bash
/update --force              # Force update (ignore warnings)
```

### Update Specific Component
```bash
/update --agents-only        # Update only OPERA agents
/update --skills-only        # Update only Skills library
/update --docs-only          # Update only documentation
```

---

## Update History

| Version | Installed | From | Backup Location |
|---------|-----------|------|----------------|
| v7.3.0 | 2025-10-26 14:32 | v7.1.0 | `~/.versatil/backups/v7.1.0_2025-10-26_14-30-00/` |
| v7.1.0 | 2025-10-26 10:15 | v7.0.0 | `~/.versatil/backups/v7.0.0_2025-10-26_10-12-00/` |
| v7.0.0 | 2025-10-25 09:00 | v6.6.0 | `~/.versatil/backups/v6.6.0_2025-10-25_08-55-00/` |

**View full history**: `/update --history`

---

## Troubleshooting

### Update Failed?

1. **Check internet connection**:
   ```bash
   ping github.com
   ```

2. **Verify git is installed**:
   ```bash
   git --version
   ```

3. **Check for conflicts**:
   ```bash
   git status
   # → Make sure working directory is clean
   ```

4. **Restore backup**:
   ```bash
   versatil-rollback previous
   ```

### Dependency Issues?

```bash
# Clean install dependencies
npm ci

# Rebuild framework
npm run build

# Verify installation
npm run doctor
```

### Still Having Issues?

```bash
# Generate debug report
npm run monitor report

# Check health
npm run monitor

# View logs
tail -f ~/.versatil/logs/framework.log
```

---

**Implementation Note for Claude**:

When user invokes `/update`, you should:

1. **Check current version**:
   ```typescript
   const pkg = await import('./package.json');
   const currentVersion = pkg.version; // e.g., "7.1.0"
   ```

2. **Fetch latest version** (from GitHub or npm):
   ```typescript
   const response = await fetch('https://api.github.com/repos/Nissimmiracles/versatil-sdlc-framework/releases/latest');
   const latestVersion = response.data.tag_name; // e.g., "v7.3.0"
   ```

3. **Show version comparison** (table format):
   - Current vs Latest
   - Highlight if update available
   - Show changelog (from CHANGELOG.md or GitHub releases)

4. **Ask for confirmation**:
   - Quick update (auto) vs Custom (step-by-step)
   - Show backup location
   - Preview files to be changed

5. **Execute update** (use Bash tool):
   ```bash
   # Create backup
   cp -r ~/.versatil ~/.versatil/backups/v${currentVersion}_$(date +%Y-%m-%d_%H-%M-%S)

   # Pull latest changes
   git pull origin main

   # Install dependencies
   npm install

   # Rebuild
   npm run build

   # Verify
   npm run doctor
   ```

6. **Show completion summary**:
   - Updated version number
   - Files changed count
   - Backup location
   - Next steps (try new features)

7. **Offer rollback** if errors occur:
   ```bash
   versatil-rollback previous
   ```

---

**Visual Elements to Use**:
- 📊 Tables for version comparison
- 📋 Code diffs (```diff format)
- 🎯 Progress bars for installation
- ✅ Checkboxes for completed steps
- 🟢🟡🔴 Status indicators (emoji or colored text)
- 📁 File tree views (```tree format)
- 💡 Callout boxes for tips/warnings

This creates a **GUI-like update experience in chat** similar to VSCode's extension update UI!
