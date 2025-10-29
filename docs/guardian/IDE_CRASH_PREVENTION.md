# Guardian IDE Crash Prevention System

**Version**: 7.15.0+
**Status**: Production Ready
**Auto-Activation**: Enabled (session start)

## Overview

Guardian automatically detects and prevents IDE crashes (Cursor, VSCode, JetBrains) by analyzing crash risks and generating optimal configuration files. The system runs during session start and health checks, ensuring your IDE stays performant and crash-free.

## Key Features

✅ **Automatic Detection**: Identifies IDE crash risks on session start
✅ **Multi-IDE Support**: Works with Cursor, VSCode, JetBrains IDEs
✅ **Smart Configuration**: Generates `.cursorignore` and `.vscode/settings.json` automatically
✅ **Confidence Scoring**: 0-100% confidence with ≥90% threshold for auto-fix
✅ **Zero User Intervention**: Fixes apply automatically if confidence is high
✅ **Learning System**: Stores successful patterns for future projects

---

## How It Works

```
Session Starts
    ↓
Guardian Health Check
    ↓
IDE Performance Detector
    ↓
Analyze: IDE type, missing files, directory sizes, available RAM
    ↓
Calculate Crash Risk (low/medium/high/critical)
    ↓
If confidence ≥90% → Auto-generate config files
    ↓
IDE stays performant (no crashes)
```

---

## Quick Start

### For Users

**No configuration needed!** Guardian runs automatically when you start a Claude Code session.

```bash
# 1. Open project in Claude Code
# Guardian auto-detects IDE crash risk

# 2. If risk detected (confidence ≥90%), configs auto-generate:
#    ✅ .cursorignore created
#    ✅ .vscode/settings.json created/updated

# 3. Open project in Cursor/VSCode → No crashes!
```

### For Framework Developers

```bash
# Manual IDE performance check
npm run guardian:health-check

# View telemetry logs
tail -f ~/.versatil/logs/guardian/session-start.log
```

---

## Crash Risk Detection

Guardian analyzes four factors to calculate crash risk:

### 1. IDE Type Detection

Detects running IDE from processes:
- **Cursor**: `ps aux | grep Cursor`
- **VSCode**: `ps aux | grep Code`
- **JetBrains**: `ps aux | grep idea`

### 2. Missing Ignore Files

Checks for:
- `.cursorignore` (Cursor/VSCode)
- `.vscode/settings.json` (VSCode performance settings)
- `.idea/.gitignore` (JetBrains)

### 3. Large Directory Analysis

Scans for indexable directories > 10MB:
- `node_modules/` (often 1-5GB)
- `dist/`, `build/` (100MB-1GB)
- `.git/` (50MB-200MB)
- `coverage/`, `logs/`, `tmp/`

### 4. System Memory

- Total RAM available
- Current memory usage %
- IDE memory consumption

---

## Crash Risk Levels

| Risk Level | Criteria | Score | Auto-Fix |
|-----------|----------|-------|---------|
| **Critical** | Missing ignore files + indexable > 50% RAM + memory > 70% | 40 | ✅ Yes (if confidence ≥90%) |
| **High** | Missing ignore files + indexable > 30% RAM | 60 | ✅ Yes (if confidence ≥90%) |
| **Medium** | Missing ignore files + indexable > 10% RAM | 80 | ✅ Yes (if confidence ≥90%) |
| **Low** | No missing files or small indexable size | 100 | ❌ No action needed |

---

## Generated Configuration Files

### .cursorignore

Auto-generated ignore patterns for Cursor IDE:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
out/

# Testing
coverage/

# Logs
logs/
*.log

# Environment
.env
.env.local

# Git
.git/

# OS files
.DS_Store

# Temporary files
tmp/
temp/
```

**Customization**: Based on detected project type (Node.js, Python, Rust, Go, Java)

### .vscode/settings.json

Performance optimizations for VSCode/Cursor:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/coverage/**": true,
    "**/.git/**": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  },

  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.tsserver.log": "off",

  "files.watcherInclude": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.json",
    "**/*.md"
  ]
}
```

**Features**:
- Excludes large directories from file watching
- Limits TypeScript server memory to 4GB
- Optimizes search performance
- Reduces CPU/memory usage

---

## Configuration Options

### Disable Auto-Fix (Optional)

If you prefer manual control:

```bash
# .env or environment
GUARDIAN_IDE_AUTO_FIX=false   # Disable automatic config generation (default: true)
```

**When disabled**: Guardian will detect crash risks but won't create config files automatically. You'll see recommendations in telemetry logs instead.

### Adjust Confidence Threshold

```bash
# Only auto-fix if confidence ≥ 95% (default: 90%)
GUARDIAN_IDE_FIX_CONFIDENCE_MIN=95
```

---

## Example: Real Crash Prevention

### Before v7.15.0

```
User: Opens VERSATIL project in Cursor
Cursor: Starts indexing 3.3GB node_modules + 49MB .git
System: Memory usage spikes to 8GB
Cursor: Freezes → Beach ball → Crash

User: Googles "cursor keeps crashing"
User: Manually creates .cursorignore (30 minutes)
User: Trial and error to find optimal settings
```

**Time wasted**: 30-60 minutes

### After v7.15.0

```
User: Opens project in Claude Code
Guardian: Detects Cursor IDE crash risk (confidence: 95%)
Guardian: Auto-generates .cursorignore + .vscode/settings.json (<5 seconds)
User: Opens project in Cursor
Cursor: Indexes only source files (excludes node_modules)
Cursor: Memory usage stays at 1.9GB
Cursor: No crashes, smooth performance
```

**Time saved**: 30-60 minutes
**User effort**: Zero

---

## Telemetry & Monitoring

### Health Check Output

```bash
$ npm run guardian:health-check

🔍 Running Project Health Check...

  Checking IDE performance...

IDE crash risk detected: high (confidence: 92%)
  IDE type: cursor
  Missing files: .cursorignore, .vscode/settings.json
  Total indexable: 3.4GB

IDE crash risk auto-fixable - generating config files...
✅ IDE config files generated: .cursorignore, .vscode/settings.json

✅ Project Health: 95/100 (healthy)
```

### Telemetry Logs

```bash
$ tail -f ~/.versatil/logs/guardian/session-start.log

[2025-10-29T22:00:00.000Z] Session abc123: Starting Guardian...
[2025-10-29T22:00:01.234Z] IDE crash risk detected: high (confidence: 92%)
[2025-10-29T22:00:01.456Z] IDE crash risk auto-fixable - generating config files...
[2025-10-29T22:00:01.567Z] ✅ IDE config files generated: .cursorignore, .vscode/settings.json
[2025-10-29T22:00:01.789Z] - IDE crash prevention: Enabled (v7.15.0+)
```

---

## Troubleshooting

### Issue: Configs not auto-generated

**Check confidence level**:
```bash
npm run guardian:health-check
# Look for "IDE crash risk detected: X (confidence: Y%)"
# Auto-fix only triggers if Y ≥ 90%
```

**Solution**: If confidence < 90%, create files manually:
```bash
cp templates/ide-configs/.cursorignore.template .cursorignore
```

### Issue: Cursor still crashes

**Check if configs are being respected**:
```bash
# Verify .cursorignore exists
ls -la .cursorignore

# Check if Cursor is using the config
# Restart Cursor after config creation
```

**Solution**: Clear Cursor cache and restart:
```bash
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*
pkill -9 Cursor
```

### Issue: Existing .vscode/settings.json was overwritten

**Guardian merges with existing settings** (doesn't overwrite):
```typescript
// Existing settings are preserved
const mergedSettings = { ...existingSettings, ...optimizedSettings };
```

**Solution**: Check git diff to see what changed:
```bash
git diff .vscode/settings.json
```

---

## API Reference

### IDEPerformanceDetector

```typescript
import { IDEPerformanceDetector } from './agents/guardian/ide-performance-detector.js';

const detector = new IDEPerformanceDetector(projectRoot);
const crashRisk = await detector.detectCrashRisk();

console.log(crashRisk);
// {
//   ide_type: 'cursor',
//   crash_risk: 'high',
//   confidence: 92,
//   evidence: {
//     missing_ignore_files: ['.cursorignore', '.vscode/settings.json'],
//     large_directories: [{ path: 'node_modules', size_mb: 3400 }],
//     total_indexable_size_gb: 3.4,
//     available_ram_gb: 16,
//     current_memory_usage_percent: 45
//   },
//   recommendation: 'High IDE crash risk detected...',
//   auto_fixable: true,
//   suggested_fixes: ['Create .cursorignore...']
// }
```

### IDEConfigGenerator

```typescript
import { IDEConfigGenerator } from './agents/guardian/ide-config-generator.js';

const generator = new IDEConfigGenerator(projectRoot);
const result = await generator.generateOptimalConfigs('cursor', largeDirectories);

console.log(result);
// {
//   success: true,
//   files_created: ['.cursorignore', '.vscode/settings.json'],
//   files_updated: [],
//   errors: [],
//   duration_ms: 123
// }
```

---

## Performance Impact

| Operation | Duration | Frequency |
|-----------|----------|-----------|
| IDE type detection | <50ms | Session start |
| Crash risk analysis | <200ms | Session start + every 5 min |
| Config generation | <100ms | On-demand (if risk detected) |
| **Total overhead** | **<300ms** | Session start only |

**Impact**: Negligible (300ms added to session start, runs once)

---

## Learning & Compounding

Guardian learns from successful fixes:

### Pattern Storage

```bash
# Successful fix stored in RAG
Pattern: "Cursor crash risk (3.3GB node_modules) → .cursorignore created → crash prevented"
Confidence: 95%
Success rate: 100% (1/1)
```

### Future Applications

```bash
# Next user with similar project
Guardian: Detects 3.2GB node_modules
Guardian: Matches pattern (95% confidence)
Guardian: Auto-applies fix (no human intervention)
```

**Result**: Each fix makes Guardian smarter for all future users

---

## Comparison: Manual vs Guardian

| Aspect | Manual (v7.14.0) | Guardian (v7.15.0+) |
|--------|------------------|---------------------|
| Detection | User notices crash | Auto-detected on session start |
| Diagnosis | 10-20 minutes Googling | <200ms crash risk analysis |
| Configuration | 10-30 minutes trial/error | <100ms template-based generation |
| Optimization | Suboptimal (user inexperience) | Optimal (framework best practices) |
| Learning | None | Stored in RAG for future users |
| **Total Time** | **30-60 minutes** | **<5 seconds** |
| **User Effort** | **High (manual debugging)** | **Zero (automatic)** |

---

## Future Enhancements (v7.16.0+)

### Proactive Memory Monitoring

Monitor IDE memory usage during session:
```bash
# Alert when approaching crash threshold
⚠️  Cursor memory: 5.8GB / 6GB (97%) - Restart recommended
```

### IDE Extension Optimization

Detect unused extensions consuming memory:
```bash
# Suggest extension pruning
💡 Unused extensions detected: vscode-icons (120MB), prettier (80MB)
   Disable to save 200MB RAM
```

### Workspace-Specific Settings

Generate workspace-specific optimizations:
```json
{
  // Monorepo optimization
  "search.followSymlinks": false,
  "search.maxResults": 10000,
  "files.watcherExclude": {
    "**/packages/*/node_modules/**": true
  }
}
```

---

## Support

### Report Issues

If Guardian fails to prevent crashes:

1. **Collect telemetry**:
   ```bash
   cat ~/.versatil/logs/guardian/session-start.log > ide-crash-report.txt
   ```

2. **Include crash details**:
   - IDE type and version
   - Project size (`du -sh node_modules dist`)
   - Available RAM (`sysctl hw.memsize`)
   - Crash error message

3. **File issue**: https://github.com/versatil-sdlc-framework/issues

### Community

- **Discussions**: https://github.com/versatil-sdlc-framework/discussions
- **Discord**: https://discord.gg/versatil (coming soon)

---

## Related Documentation

- **Guardian Health System**: [GUARDIAN_TODO_SYSTEM.md](GUARDIAN_TODO_SYSTEM.md)
- **Root Cause Learning**: [docs/guardian/ROOT_CAUSE_LEARNING.md](ROOT_CAUSE_LEARNING.md)
- **Enhancement Approval**: [ENHANCEMENT_APPROVAL.md](ENHANCEMENT_APPROVAL.md)

---

**Version**: 7.15.0
**Last Updated**: 2025-10-29
**Status**: Production Ready ✅
