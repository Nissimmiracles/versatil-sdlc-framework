# Semantic Versioning (SemVer) Complete Guide

**Specification**: https://semver.org/spec/v2.0.0.html

---

## Basic Format

```
MAJOR.MINOR.PATCH

Example: 7.9.2
         │ │ └─ PATCH version (bug fixes)
         │ └─── MINOR version (new features, backward compatible)
         └───── MAJOR version (breaking changes)
```

---

## Version Bump Rules

### PATCH (x.y.Z) - Bug Fixes Only

**When to use**:
- ✅ Fix crashes or bugs
- ✅ Fix memory leaks
- ✅ Fix security vulnerabilities (backward compatible)
- ✅ Performance improvements (no API changes)
- ✅ Documentation fixes (typos, clarity)
- ✅ Internal refactoring (no external API changes)

**Examples**:
- `7.9.0 → 7.9.1` - Fixed crash when RAG offline
- `7.9.1 → 7.9.2` - Fixed memory leak in health monitoring
- `7.9.2 → 7.9.3` - Security fix for dependency vulnerability

**NOT for PATCH**:
- ❌ New features (use MINOR)
- ❌ API additions (use MINOR)
- ❌ Breaking changes (use MAJOR)

---

### MINOR (x.Y.0) - New Features (Backward Compatible)

**When to use**:
- ✅ Add new features
- ✅ Add new APIs, methods, classes
- ✅ Deprecate functionality (with warnings, don't remove yet)
- ✅ Enhance existing features (backward compatible)
- ✅ Add optional parameters
- ✅ New configuration options (with defaults)

**Examples**:
- `7.9.0 → 7.10.0` - Added Victor-Verifier agent
- `7.10.0 → 7.11.0` - Added /rag command for RAG management
- `7.11.0 → 7.12.0` - Added private RAG store support

**NOT for MINOR**:
- ❌ Remove APIs (use MAJOR)
- ❌ Change default behavior (use MAJOR)
- ❌ Require new dependencies (use MAJOR if breaking)
- ❌ Change return types (use MAJOR)

---

### MAJOR (X.0.0) - Breaking Changes

**When to use**:
- ✅ Remove deprecated APIs
- ✅ Change API signatures (parameters, return types)
- ✅ Change default behavior
- ✅ Require new dependencies (that break compatibility)
- ✅ Rename functions, classes, modules
- ✅ Change configuration format
- ✅ Architectural rewrites

**Examples**:
- `7.12.0 → 8.0.0` - Removed deprecated agents-v1 system
- `8.0.0 → 9.0.0` - Changed RAG API to async-only
- `9.0.0 → 10.0.0` - Migrated to ESM modules (from CommonJS)

**MAJOR = Breaking Changes** - Users must update their code!

---

## Pre-Release Versions

### Alpha (x.y.z-alpha.N)

**When to use**: Very early development, unstable

```
7.10.0-alpha.1 → 7.10.0-alpha.2 → 7.10.0-beta.1
```

**Stability**: ⚠️ Unstable - May have bugs, incomplete features

---

### Beta (x.y.z-beta.N)

**When to use**: Feature-complete, needs testing

```
7.10.0-beta.1 → 7.10.0-beta.2 → 7.10.0-rc.1
```

**Stability**: ⚡ More stable - Features complete, testing in progress

---

### Release Candidate (x.y.z-rc.N)

**When to use**: Final testing before release

```
7.10.0-rc.1 → 7.10.0-rc.2 → 7.10.0
```

**Stability**: ✅ Stable - No known blockers, final validation

---

## Version Precedence

```
1.0.0-alpha.1 < 1.0.0-alpha.2 < 1.0.0-beta.1 < 1.0.0-beta.2 < 1.0.0-rc.1 < 1.0.0
```

**Rule**: Pre-release versions are LOWER than release versions

---

## Build Metadata (Optional)

```
7.10.0+build.20251028
7.10.0+git.abc123f
7.10.0-beta.1+exp.sha.5114f85
```

**Format**: `version+metadata`

**Purpose**: Additional build information, ignored in version comparison

**Examples**:
- Build date: `+build.20251028`
- Git commit: `+git.abc123f`
- CI build number: `+ci.12345`

---

## Version Comparison

```typescript
function compare(v1: string, v2: string): -1 | 0 | 1 {
  // Compare MAJOR, then MINOR, then PATCH
  // Pre-release versions are lower than release

  // Examples:
  // 1.0.0 < 2.0.0          (MAJOR differs)
  // 1.2.0 < 1.3.0          (MINOR differs)
  // 1.2.3 < 1.2.4          (PATCH differs)
  // 1.0.0-alpha < 1.0.0    (pre-release < release)
  // 1.0.0 == 1.0.0+build   (metadata ignored)
}
```

---

## Version Ranges (package.json)

### Exact Version

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": "7.9.0"
  }
}
```

**Matches**: Only 7.9.0

---

### Caret (^) - Minor/Patch Updates

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": "^7.9.0"
  }
}
```

**Matches**: ≥7.9.0 and <8.0.0 (same MAJOR)

**Examples**: 7.9.0, 7.9.1, 7.10.0, 7.99.0 ✅
**Not**: 8.0.0 ❌

---

### Tilde (~) - Patch Updates Only

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": "~7.9.0"
  }
}
```

**Matches**: ≥7.9.0 and <7.10.0 (same MAJOR.MINOR)

**Examples**: 7.9.0, 7.9.1, 7.9.999 ✅
**Not**: 7.10.0, 8.0.0 ❌

---

### Greater Than (>)

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": ">7.9.0"
  }
}
```

**Matches**: Any version greater than 7.9.0

---

### Less Than (<)

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": "<8.0.0"
  }
}
```

**Matches**: Any version less than 8.0.0

---

### Range (x.x.x - x.x.x)

```json
{
  "dependencies": {
    "@versatil/sdlc-framework": ">=7.9.0 <8.0.0"
  }
}
```

**Matches**: 7.9.0 through 7.99.99 (inclusive lower, exclusive upper)

---

## Breaking Changes Checklist

**Before bumping to MAJOR, ask:**

1. ❓ Does this require users to change their code?
2. ❓ Does this change public API signatures?
3. ❓ Does this change default behavior?
4. ❓ Does this remove deprecated features?
5. ❓ Does this change configuration format?
6. ❓ Does this require new system dependencies?

**If ANY answer is YES** → MAJOR bump required!

---

## Backward Compatibility Guidelines

### ✅ Backward Compatible (MINOR or PATCH)

- Adding new optional parameters (with defaults)
- Adding new methods/classes
- Improving performance (no API changes)
- Fixing bugs that don't change behavior
- Adding new configuration options (with defaults)
- Deprecating (not removing) APIs

---

### ❌ NOT Backward Compatible (MAJOR)

- Removing parameters
- Changing parameter order
- Changing return types
- Changing default values
- Removing methods/classes
- Renaming APIs
- Changing exception types

---

## Version Bump Decision Tree

```
START
  ↓
Breaking changes?
  YES → MAJOR (X.0.0)
  NO → ↓
New features?
  YES → MINOR (x.Y.0)
  NO → ↓
Bug fixes?
  YES → PATCH (x.y.Z)
  NO → ↓
No changes? → Don't release
```

---

## Example Scenarios

### Scenario 1: Add New Agent

**Change**: Created new Victor-Verifier agent

**Decision**:
- Breaking? ❌ No (users can ignore new agent)
- New feature? ✅ Yes (new capability added)
- Bug fix? ❌ No

**Bump**: MINOR (7.9.0 → 7.10.0)

---

### Scenario 2: Remove Deprecated API

**Change**: Removed `oldFunction()` that was deprecated in v7.5.0

**Decision**:
- Breaking? ✅ Yes (users calling `oldFunction()` will get errors)
- New feature? ❌ No
- Bug fix? ❌ No

**Bump**: MAJOR (7.12.0 → 8.0.0)

---

### Scenario 3: Fix Crash Bug

**Change**: Fixed null pointer crash in RAG service

**Decision**:
- Breaking? ❌ No (just fixes existing behavior)
- New feature? ❌ No
- Bug fix? ✅ Yes

**Bump**: PATCH (7.9.0 → 7.9.1)

---

### Scenario 4: Change Default Config

**Change**: Changed default `check_interval_hours` from 24 to 12

**Decision**:
- Breaking? ✅ Yes (changes behavior for users relying on default)
- New feature? ❌ No
- Bug fix? ❌ No

**Bump**: MAJOR (7.9.0 → 8.0.0)

---

### Scenario 5: Add Optional Parameter

**Change**: Added optional `timeout` parameter to `performCheck(timeout?)`

**Decision**:
- Breaking? ❌ No (existing code still works, parameter is optional)
- New feature? ✅ Yes (new capability)
- Bug fix? ❌ No

**Bump**: MINOR (7.9.0 → 7.10.0)

---

## Migration Guide Template (for MAJOR releases)

```markdown
# Migration Guide: v7.x → v8.0

## Breaking Changes

### 1. Removed `oldFunction()`

**Before (v7.x)**:
\`\`\`typescript
oldFunction('param');
\`\`\`

**After (v8.0)**:
\`\`\`typescript
newFunction({ param: 'param' });
\`\`\`

**Why**: Improved API consistency

---

### 2. Changed Default Config

**Before**: `check_interval_hours: 24`
**After**: `check_interval_hours: 12`

**Migration**: Explicitly set in config if you need 24-hour interval

---

### 3. Async API

**Before (v7.x)**:
\`\`\`typescript
const result = coherence.check();  // synchronous
\`\`\`

**After (v8.0)**:
\`\`\`typescript
const result = await coherence.check();  // async
\`\`\`

**Why**: Enables non-blocking health checks

---

## Deprecation Timeline

- v7.5.0 - `oldFunction()` deprecated (warnings added)
- v7.12.0 - Final release with `oldFunction()`
- v8.0.0 - `oldFunction()` removed

---

## Installation

\`\`\`bash
npm install @versatil/sdlc-framework@8.0.0
\`\`\`

---

## Rollback

If you encounter issues:

\`\`\`bash
npm install @versatil/sdlc-framework@7.12.0
\`\`\`
```

---

## Best Practices

1. **MAJOR sparingly** - Breaking changes should be infrequent
2. **Deprecate before remove** - Give users time to migrate (at least 2 minor versions)
3. **Document breaking changes** - Always provide migration guide for MAJOR
4. **Test compatibility** - Ensure MINOR/PATCH don't accidentally break
5. **Use pre-release for testing** - Beta/RC for risky changes
6. **Keep CHANGELOG** - Every release gets entry
7. **Version lock for stability** - Use exact versions in production
8. **Automate bumps** - Use scripts to avoid manual errors
