# CHANGELOG Format Guide

**Standard**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## Complete Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- For new features (→ MINOR release)

### Changed
- For changes in existing functionality (→ MINOR or MAJOR)

### Deprecated
- For soon-to-be removed features (→ MINOR)

### Removed
- For removed features (→ MAJOR)

### Fixed
- For bug fixes (→ PATCH)

### Security
- For security vulnerability fixes (→ PATCH, urgent)

## [7.10.0] - 2025-10-29

### Added
- New Victor-Verifier agent for anti-hallucination via Chain-of-Verification (CoVe)
- Claim verification logging to `.versatil/logs/verifier/`
- Proof generation for all factual claims

### Changed
- Updated health-monitoring skill with 11 auto-remediation patterns
- Improved version coherence checking with 92% confidence auto-fixes

### Fixed
- Fixed TypeScript compilation error in user-coherence-monitor.ts (GuardianLogger → VERSATILLogger)
- Fixed type narrowing issue in version compatibility check

### Security
- Updated axios from 0.21.1 to 1.6.0 (fixes CVE-2023-45857)

## [7.9.0] - 2025-10-28

...

[7.10.0]: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/v7.9.0...v7.10.0
[7.9.0]: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/v7.8.0...v7.9.0
```

---

## Section Guidelines

### Added (MINOR bump)

**What to include**:
- New features, capabilities, components
- New APIs, methods, classes
- New configuration options
- New documentation sections

**Format**:
```markdown
### Added
- New {feature} for {purpose}
- Added {API/method} to {location} (enables {use-case})
- New {config-option} setting (default: {value})
```

**Examples**:
```markdown
### Added
- New Victor-Verifier agent for anti-hallucination detection
- Added `performVerification()` method to VerifierService (enables claim validation)
- New `/verify` slash command for on-demand verification
- Private RAG store support (Firestore, Supabase, Local JSON)
- Health monitoring auto-remediation (11 patterns, 90%+ confidence)
```

---

### Changed (MINOR or MAJOR)

**What to include**:
- Modifications to existing features
- Behavior changes (MAJOR if breaking)
- Performance improvements
- Internal refactoring (user-visible changes only)

**Format**:
```markdown
### Changed
- Changed {component} to {new-behavior} (reason: {why})
- Updated {dependency} from {old} to {new}
- Improved {feature} performance by {percentage}
```

**Examples**:
```markdown
### Changed
- Changed RAG router to prioritize private store over public (privacy improvement)
- Updated health check interval from 24h to 12h (more proactive monitoring)
- Improved pattern search performance by 40% (GraphRAG query optimization)
- Migrated hooks from ts-node to tsx (faster execution, <50ms overhead)
```

**Breaking vs Non-Breaking**:
- ✅ Non-breaking: Added new parameter with default value
- ❌ Breaking: Changed existing parameter behavior

---

### Deprecated (MINOR bump)

**What to include**:
- Features marked for future removal
- APIs that will be removed in next MAJOR
- Configuration options being phased out

**Format**:
```markdown
### Deprecated
- Deprecated {feature/API} in favor of {replacement} (will be removed in v{X}.0.0)
```

**Examples**:
```markdown
### Deprecated
- Deprecated `oldHealthCheck()` in favor of `UserCoherenceCheckService` (will be removed in v8.0.0)
- Deprecated `.versatil-config.json` in favor of `CLAUDE.md` (will be removed in v8.0.0)
- Deprecated Vector-only RAG mode (GraphRAG is now default, Vector is fallback)
```

**Deprecation Timeline**:
1. v7.5.0 - Mark as deprecated, add warnings
2. v7.6.0 - v7.12.0 - Continue supporting with warnings
3. v8.0.0 - Remove completely

---

### Removed (MAJOR bump)

**What to include**:
- Deleted features, APIs, components
- Configuration options no longer supported
- Dependencies removed

**Format**:
```markdown
### Removed
- Removed {feature/API} (deprecated in v{X}.{Y}.0)
- Dropped support for {platform/version}
```

**Examples**:
```markdown
### Removed
- Removed `oldHealthCheck()` API (deprecated in v7.5.0)
- Removed legacy agent-v1 system (deprecated in v7.0.0)
- Dropped support for Node.js <18.0.0
- Removed CommonJS support (ESM-only now)
```

**Migration Guide Required**: Always include for MAJOR releases!

---

### Fixed (PATCH bump)

**What to include**:
- Bug fixes
- Crash fixes
- Memory leak fixes
- Correctness fixes

**Format**:
```markdown
### Fixed
- Fixed {issue} in {component} (symptom: {what-happened})
- Fixed crash when {condition}
- Fixed memory leak in {component}
```

**Examples**:
```markdown
### Fixed
- Fixed crash when GraphRAG offline and Vector store unreachable
- Fixed memory leak in health monitoring trend analysis (was caching all history)
- Fixed TypeScript compilation error in user-coherence-monitor.ts
- Fixed incorrect version comparison (was treating 7.10.0 as older than 7.9.0)
- Fixed race condition in RAG router failover (GraphRAG to Vector)
```

**Issue References**:
```markdown
### Fixed
- Fixed crash in pattern search (#234)
- Fixed GraphRAG connection timeout (fixes #245, #247)
```

---

### Security (PATCH bump, URGENT)

**What to include**:
- Security vulnerability fixes
- Dependency security updates
- Authentication/authorization fixes

**Format**:
```markdown
### Security
- Fixed {vulnerability} in {component} (CVE-XXXX-XXXXX)
- Updated {dependency} to fix {CVE}
```

**Examples**:
```markdown
### Security
- Fixed SQL injection vulnerability in RAG query builder (CVE-2024-12345)
- Updated axios from 0.21.1 to 1.6.0 (fixes CVE-2023-45857)
- Fixed authentication bypass in MCP server (internal vulnerability, no CVE)
- Added input validation to prevent XSS in dashboard
```

**Security releases are URGENT** - Release immediately as PATCH!

---

## Version Heading Format

```markdown
## [7.10.0] - 2025-10-29
   ↑       ↑
   │       └─ Release date (YYYY-MM-DD)
   └───────── Version number (link to diff)
```

**Link format** (at bottom of file):
```markdown
[7.10.0]: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/v7.9.0...v7.10.0
```

---

## Unreleased Section

**Always maintain**:
```markdown
## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```

**Purpose**: Track changes since last release

**On release**: Move Unreleased content to new version section

---

## Writing Good Entries

### ✅ Good Entries

```markdown
### Added
- New health monitoring auto-remediation with 90%+ confidence fixes
- Private RAG store support (Firestore, Supabase, Local JSON)
- `/rag` command for RAG configuration and status
```

**Why good**:
- Clear, concise description
- Explains what was added
- Mentions key features/options

---

### ❌ Bad Entries

```markdown
### Added
- Stuff
- Fixed things
- Updated code
```

**Why bad**:
- Too vague
- No context
- Doesn't help users understand changes

---

## User-Focused Language

### ✅ User-Focused

```markdown
### Changed
- Improved pattern search performance by 40% (GraphRAG query optimization)
```

**Focus**: What user experiences (faster searches)

---

### ❌ Developer-Focused

```markdown
### Changed
- Refactored PatternSearchService to use async/await instead of promises
```

**Problem**: Users don't care about internal refactoring (unless it affects them)

---

## Grouping Related Changes

```markdown
### Added

**Health Monitoring Enhancements**:
- Auto-remediation with 11 patterns (90%+ confidence)
- Trend analysis (7-day and 30-day averages)
- Proactive notifications for degradation
- CLI integration (`npx versatil doctor`)

**RAG System Improvements**:
- Private RAG store support
- Intelligent routing (private → public fallback)
- Pattern source labels (🔒 Private, 🌍 Public)
```

**Benefits**:
- Easier to scan
- Groups related features
- Shows scope of work

---

## Breaking Changes Callout

```markdown
## [8.0.0] - 2025-11-15

### ⚠️ BREAKING CHANGES

This is a MAJOR release with breaking changes. See [MIGRATION_V7_TO_V8.md](docs/MIGRATION_V7_TO_V8.md) for upgrade guide.

### Removed
- Removed `oldHealthCheck()` API (use `UserCoherenceCheckService` instead)
- Removed CommonJS support (ESM-only)
- Dropped Node.js <18 support

### Changed
- Changed health check interval default from 24h to 12h
- RAG router now requires explicit configuration (no auto-detection)
```

**Always highlight breaking changes prominently!**

---

## Example: Complete Release Entry

```markdown
## [7.10.0] - 2025-10-29

### Added

**Victor-Verifier Agent** (Anti-Hallucination):
- New agent for claim verification using Chain-of-Verification (CoVe)
- Proof generation for factual claims
- Verification logging to `.versatil/logs/verifier/`
- `/verify` slash command for on-demand verification

**Health Monitoring Enhancements**:
- Auto-remediation system with 11 patterns (90%+ confidence)
- Trend analysis (7-day and 30-day health averages)
- Proactive notifications for health degradation
- CLI integration via `npx versatil doctor`

**Documentation**:
- New troubleshooting guide (docs/TROUBLESHOOTING.md)
- Health monitoring best practices guide

### Changed
- Updated health check interval from 24h to 12h (more proactive)
- Improved pattern search performance by 40% (GraphRAG optimization)
- Enhanced RAG router with intelligent failover (GraphRAG → Vector)

### Fixed
- Fixed TypeScript compilation error in user-coherence-monitor.ts
- Fixed type narrowing issue in version compatibility check
- Fixed race condition in RAG router failover

### Security
- Updated axios from 0.21.1 to 1.6.0 (fixes CVE-2023-45857)
- Added input validation to health check endpoints

### Performance
- Reduced health check latency by 30% (<5s for full check)
- Optimized RAG query caching (40% hit rate improvement)

---

**Full Changelog**: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/v7.9.0...v7.10.0
**Migration Guide**: N/A (backward compatible)
**npm**: https://www.npmjs.com/package/@versatil/sdlc-framework/v/7.10.0
```

---

## Automation Tips

### Generate from Git Commits

```bash
# Get commits since last release
git log v7.9.0..HEAD --oneline

# Categorize by conventional commits
git log v7.9.0..HEAD --pretty=format:"%s" | grep "^feat:" | sed 's/feat: /- /'
git log v7.9.0..HEAD --pretty=format:"%s" | grep "^fix:" | sed 's/fix: /- /'
```

---

### Conventional Commits Mapping

| Commit Prefix | CHANGELOG Section | SemVer Bump |
|--------------|-------------------|-------------|
| `feat:` | Added | MINOR |
| `fix:` | Fixed | PATCH |
| `docs:` | (skip or Added) | NONE |
| `perf:` | Performance | PATCH |
| `refactor:` | Changed | NONE |
| `test:` | (skip) | NONE |
| `chore:` | (skip) | NONE |
| `BREAKING CHANGE:` | Removed/Changed | MAJOR |

---

## Best Practices

1. **Write as you go** - Update Unreleased section with every PR
2. **Be specific** - "Fixed crash in X" not "Fixed bug"
3. **User-focused** - Explain impact, not implementation
4. **Group related** - Batch similar changes together
5. **Highlight breaking** - Make MAJOR changes obvious
6. **Link to issues** - Reference GitHub issues (#123)
7. **Include migration** - Link to migration guide for MAJOR
8. **Date format**: YYYY-MM-DD (ISO 8601)
9. **Link to diffs** - Bottom of file, compare URLs
10. **Keep chronological** - Newest releases at top
