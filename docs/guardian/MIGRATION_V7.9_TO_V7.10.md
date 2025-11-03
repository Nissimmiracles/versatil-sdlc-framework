# Migration Guide: v7.9.0 → v7.10.0

**Target Audience**: Existing VERSATIL users upgrading from v7.9.0 (or earlier) to v7.10.0
**Migration Time**: < 5 minutes
**Breaking Changes**: 1 (Guardian TODO creation enabled by default)

---

## 🎯 TL;DR

**ONE BREAKING CHANGE**:
- Guardian (Iris-Guardian) now creates TODO files automatically (was disabled before)
- You'll see `guardian-combined-*.md` files appear in `todos/` after health checks
- To disable: `export GUARDIAN_CREATE_TODOS=false`

---

## What Changed

### Before v7.10.0 (v7.7.0 - v7.9.0)

**Guardian Behavior**:
```
Health Check (every 5 minutes)
  ↓
Detect issues ✅
  ↓
Log to telemetry (~/.versatil/logs/guardian-telemetry.log) ✅
  ↓
Create TODO files? ❌ NO (disabled by default)
```

**Result**: Issues tracked in logs only, no visible TODOs

**Default Setting**:
```bash
GUARDIAN_CREATE_TODOS=false  # Disabled
```

---

### After v7.10.0

**Guardian Behavior**:
```
Health Check (every 5 minutes)
  ↓
Detect issues ✅
  ↓
Verify with Chain-of-Verification (CoVe) ✅
  ↓
Group related issues by agent ✅
  ↓
Create combined TODO files ✅ NEW!
  ↓
Log to telemetry ✅
```

**Result**: Combined TODO files created automatically in `todos/`

**Default Setting**:
```bash
GUARDIAN_CREATE_TODOS=true   # ← Changed from false
GUARDIAN_GROUP_TODOS=true    # New: Group by agent
GUARDIAN_GROUP_BY=agent      # New: Grouping strategy
GUARDIAN_MAX_ISSUES_PER_TODO=10  # New: Max issues per file
```

---

## Migration Scenarios

### Scenario 1: Keep New Behavior (Recommended)

**Goal**: Let Guardian create TODO files automatically

**Action**: ✅ **No action needed!**

Guardian will start creating combined TODOs automatically after upgrade.

**What You'll See**:
```
todos/
├── guardian-combined-maria-qa-critical-*.md (3 issues)
├── guardian-combined-marcus-backend-high-*.md (2 issues)
└── ... (other Guardian TODOs)
```

**Benefit**:
- Visible tracking of errors/gaps
- No need to check telemetry logs manually
- Grouped by agent for easier resolution

---

### Scenario 2: Revert to Old Behavior (Telemetry Only)

**Goal**: Disable Guardian TODO creation (same as v7.9.0)

**Action**: Set environment variable

**Option A: In your project**
```bash
# .env
GUARDIAN_CREATE_TODOS=false
```

**Option B: System-wide**
```bash
# ~/.bashrc or ~/.zshrc
export GUARDIAN_CREATE_TODOS=false
```

**Option C: Per-session**
```bash
export GUARDIAN_CREATE_TODOS=false
```

**Result**: Guardian reverts to v7.9.0 behavior (telemetry logs only)

---

### Scenario 3: Customize Grouping Behavior

**Goal**: Change how Guardian groups issues

**Options**:

**Group by Priority** (all critical issues together):
```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_BY=priority
```

**Group by Layer** (framework/project/context):
```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_BY=layer
```

**Individual TODOs** (no grouping, like v7.9.0 would have done if enabled):
```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_TODOS=false
```

---

## Step-by-Step Migration

### Step 1: Update Framework

```bash
# In your project directory
/update

# Or via npm
pnpm update @versatil/sdlc-framework
```

**Expected Output**:
```
Current Version: v7.9.0
Latest Version: v7.10.0 🟡 Update Available

What's New in v7.10.0:
✨ Guardian Automatic TODO Generation
  - Creates combined TODO files automatically
  - Groups issues by agent (5-10x reduction)
  - Enabled by default

Update now? (Y/n)
```

### Step 2: Decide on TODO Behavior

**Option A: Accept New Behavior** (Recommended)
- Press `Y` to update
- Guardian will start creating TODOs automatically
- No additional configuration needed

**Option B: Revert to Old Behavior**
```bash
# Before updating, create .env file
echo "GUARDIAN_CREATE_TODOS=false" >> .env

# Then update
/update
```

### Step 3: Verify Update

```bash
# Check version
npm list @versatil/sdlc-framework

# Expected output:
@versatil/sdlc-framework@7.10.0

# Check Guardian status
/guardian status
```

### Step 4: Wait for First Health Check

Guardian runs every 5 minutes. After the first check:

**If TODO creation enabled**:
```bash
# Check for Guardian TODOs
ls todos/guardian-combined-*

# Should see files like:
guardian-combined-maria-qa-critical-1730123456789-ab3f.md
```

**If TODO creation disabled**:
```bash
# Check telemetry logs instead
tail -f ~/.versatil/logs/guardian-telemetry.log
```

---

## Common Questions

### Q: Will I see hundreds of TODO files after upgrading?

**A**: No! Guardian uses smart grouping:
- **Before grouping**: 10 issues = 10 potential files
- **After grouping**: 10 issues = 2-3 combined files (grouped by agent)

### Q: What happens to existing todos/*.md files?

**A**: Nothing! Guardian TODOs use namespaced format (`guardian-combined-*.md`) and won't conflict with your existing TODOs from `/plan` command (001-pending-*.md).

### Q: Can I delete Guardian TODOs after fixing issues?

**A**: Yes! Guardian TODOs are just markdown files. Delete them after resolving issues. Guardian won't recreate duplicates (has anti-duplication system).

### Q: How do I know which TODOs are from Guardian vs /plan?

**A**: By filename pattern:
- **Guardian**: `guardian-combined-[agent]-[priority]-[timestamp].md`
- **/plan**: `001-pending-p1-[feature-name].md`

### Q: Does Guardian respect .gitignore?

**A**: Guardian creates TODOs in `todos/` directory. If you have `todos/` in `.gitignore`, Guardian TODOs won't be committed to git (unless you explicitly add them).

### Q: Can Guardian create TODOs for user projects AND framework development?

**A**: Yes! Guardian operates in dual-context mode:
- **User projects** (PROJECT_CONTEXT): Creates TODOs for your application issues
- **Framework development** (FRAMEWORK_CONTEXT): Creates TODOs for VERSATIL framework issues

### Q: What if I want Guardian to create TODOs but NOT group them?

**A**: Disable grouping:
```bash
GUARDIAN_CREATE_TODOS=true
GUARDIAN_GROUP_TODOS=false
```

Result: One TODO file per issue (like traditional behavior).

---

## Rollback Plan

If you encounter issues with v7.10.0, you can rollback:

### Option 1: Disable TODO Creation Only

```bash
export GUARDIAN_CREATE_TODOS=false
```

Keeps v7.10.0 but reverts Guardian behavior to v7.9.0 style.

### Option 2: Full Rollback to v7.9.0

```bash
# Via npm
npm install @versatil/sdlc-framework@7.9.0

# Or via git (if installed from source)
cd ~/.versatil
git checkout v7.9.0
pnpm run build
```

---

## New Features in v7.10.0 (Beyond Guardian TODOs)

While this migration guide focuses on Guardian TODO changes, v7.10.0 also includes:

1. **Architecture Documentation** (non-breaking):
   - ARCHITECTURE_QUICK_REFERENCE.md (decision tree)
   - PARALLELIZATION_VS_SPECIALIZATION.md
   - SKILLS_VS_SUBAGENTS_COMPARISON.md
   - VERSATIL_VS_CLAUDE_SDK_CURSOR.md

2. **New Skills** (non-breaking):
   - `health-monitoring` skill
   - `version-management` skill

3. **Guardian Improvements** (non-breaking):
   - Three-layer anti-duplication
   - Chain-of-Verification (CoVe) for accuracy
   - Auto-apply detection (≥90% confidence)

---

## Support

**Issues or Questions?**
- GitHub: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Documentation: [docs/guardian/GUARDIAN_TODO_SYSTEM.md](./GUARDIAN_TODO_SYSTEM.md)
- Changelog: [CHANGELOG.md](../../CHANGELOG.md)

---

**Last Updated**: 2025-10-28 (v7.10.0 release)
