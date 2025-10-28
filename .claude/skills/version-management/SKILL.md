# Version Management Skill

**Category**: Guardian Core Skills
**Priority**: HIGH
**Auto-Load**: When version, release, semver, changelog mentioned
**Context Size**: ~250 tokens (SKILL.md) + ~450 tokens (references) = ~700 tokens total

---

## 📋 Metadata (Level 1 - Always in Context)

**Purpose**: Semantic versioning, release automation, and version coherence

**When to Use**:
- Guardian recommends version bumps
- Creating new releases (git tag, GitHub Release, npm publish)
- Checking version coherence (local vs public)
- Generating CHANGELOG entries

**What It Provides**:
- Semantic versioning rules (major.minor.patch)
- Release process automation (3-platform sync)
- CHANGELOG generation templates
- Version bump recommendations

**Related Skills**:
- `health-monitoring` - Version alignment is part of health checks
- `native-sdk-integration` - SDK version compatibility validation

**Token Savings**: ~1,800 tokens (progressive disclosure vs always-loaded)

---

## 📖 Description (Level 2 - Load When Skill Triggered)

### What This Skill Does

The **version-management** skill provides comprehensive version management following Semantic Versioning (SemVer) and coordinating releases across three platforms:

1. **Git Tags** - Local and remote version markers
2. **GitHub Releases** - Public release pages with notes and assets
3. **npm Registry** - Package distribution

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH

Examples:
- 7.9.0 → 7.9.1   (patch: bug fix, backward compatible)
- 7.9.1 → 7.10.0  (minor: new features, backward compatible)
- 7.10.0 → 8.0.0  (major: breaking changes, NOT backward compatible)
```

**Version Bump Rules**:
- **PATCH**: Bug fixes only, no new features, no breaking changes
- **MINOR**: New features, may deprecate APIs (with warnings), no breaking changes
- **MAJOR**: Breaking changes, API removals, architectural changes

### Three-Platform Release Process

```
1. Update package.json version
   ↓
2. Generate CHANGELOG entry
   ↓
3. Create git tag (vX.Y.Z)
   ↓
4. Push tag to GitHub
   ↓
5. Create GitHub Release with notes
   ↓
6. Build and publish to npm
   ↓
7. Verify all platforms in sync
```

**Total Duration**: 3-5 minutes (mostly automated)

---

## 🔧 Usage (Level 2 - Load When Skill Triggered)

### For Guardian (Version Recommendations)

```typescript
import { VersionManager } from './version-manager.js';

const vm = new VersionManager();

// Analyze recent commits to recommend version bump
const recommendation = await vm.recommendVersionBump({
  since: 'v7.9.0',
  commits: await getCommitsSince('v7.9.0')
});

console.log(`Recommend: ${recommendation.bump_type}`); // 'major' | 'minor' | 'patch'
console.log(`Reason: ${recommendation.reason}`);
console.log(`Breaking changes: ${recommendation.breaking_changes.length}`);
console.log(`New features: ${recommendation.new_features.length}`);
console.log(`Bug fixes: ${recommendation.bug_fixes.length}`);

// Suggest next version
console.log(`Next version: ${recommendation.next_version}`); // e.g., "7.10.0"
```

**Decision Logic**:
```typescript
if (breaking_changes.length > 0) return 'major';
if (new_features.length > 0) return 'minor';
if (bug_fixes.length > 0) return 'patch';
return null;  // No changes warrant release
```

---

### For Users (Release Creation)

```bash
# Check current version and coherence
npx versatil doctor

# Create new release (automated)
npm run release -- --type minor  # or major, patch

# Manual release process
npm version minor                # Updates package.json, creates git tag
npm run changelog                # Generates CHANGELOG entry
git push --tags                  # Pushes tag to GitHub
gh release create v7.10.0 --generate-notes  # Creates GitHub Release
npm publish                      # Publishes to npm registry

# Verify coherence after release
npx versatil doctor
```

---

### For Guardian (Coherence Checks)

```typescript
import { VersionCoherence } from './version-coherence.js';

const coherence = new VersionCoherence();

// Check 3-platform sync
const status = await coherence.checkCoherence();

console.log('Local git tag:', status.git.latest);           // v7.9.0
console.log('GitHub Release:', status.github.latest);        // v7.9.0
console.log('npm Registry:', status.npm.latest);             // 7.9.0
console.log('In sync?', status.in_sync);                     // true/false

// Find gaps
const gaps = coherence.findGaps(status);
// Example output:
// [
//   { type: 'missing_github_release', version: 'v7.8.0' },
//   { type: 'npm_behind', current: '7.7.0', latest: '7.9.0' }
// ]

// Auto-fix gaps
if (gaps.length > 0) {
  await coherence.closeGaps(gaps);
}
```

---

## 📊 Version Bump Decision Matrix

| Change Type | Examples | Bump Type | Breaking? |
|-------------|----------|-----------|-----------|
| Bug fix | Fix crash, memory leak | PATCH | ❌ No |
| New feature | Add new agent, skill | MINOR | ❌ No |
| Deprecation | Mark API as deprecated (with warning) | MINOR | ❌ No |
| API removal | Remove deprecated API | MAJOR | ✅ Yes |
| Behavior change | Change default config | MAJOR | ✅ Yes |
| Architecture | Rewrite core system | MAJOR | ✅ Yes |
| Documentation | Update docs only | NONE | ❌ No |
| Tests | Add/fix tests only | NONE | ❌ No |

---

## 📝 CHANGELOG Format (Keep a Changelog)

VERSATIL follows [Keep a Changelog](https://keepachangelog.com/) format:

### Template Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features (MINOR bump)

### Changed
- Changes in existing functionality (could be MAJOR or MINOR)

### Deprecated
- Soon-to-be removed features (MINOR bump)

### Removed
- Removed features (MAJOR bump)

### Fixed
- Bug fixes (PATCH bump)

### Security
- Security fixes (PATCH bump, urgent)

## [7.10.0] - 2025-10-29

### Added
- New Victor-Verifier agent for anti-hallucination
- Chain-of-Verification (CoVe) implementation
- Claim verification logging

### Changed
- Updated health-monitoring skill with auto-remediation
- Improved version coherence checking

### Fixed
- Fixed TypeScript compilation error in user-coherence-monitor.ts

## [7.9.0] - 2025-10-28

...
```

### Section Usage

- **Added**: New features, capabilities, files (→ MINOR)
- **Changed**: Modifications to existing features (→ MINOR or MAJOR)
- **Deprecated**: Features marked for future removal (→ MINOR)
- **Removed**: Deleted features, APIs (→ MAJOR)
- **Fixed**: Bug fixes (→ PATCH)
- **Security**: Security vulnerability fixes (→ PATCH, high priority)

---

## 🚀 Release Automation

### Full Release Script

```bash
#!/bin/bash
# scripts/release.sh

set -e  # Exit on error

# Parse arguments
TYPE=${1:-minor}  # major, minor, or patch

echo "🚀 Starting $TYPE release..."

# 1. Version bump
echo "📝 Bumping version..."
npm version $TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

# 2. Generate CHANGELOG
echo "📋 Updating CHANGELOG..."
npm run changelog:generate -- --version $NEW_VERSION

# 3. Commit changes
echo "💾 Committing changes..."
git add package.json CHANGELOG.md
git commit -m "Release v$NEW_VERSION

- Updated package.json to v$NEW_VERSION
- Generated CHANGELOG entry

🤖 Generated with VERSATIL Release Automation"

# 4. Create git tag
echo "🏷️  Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# 5. Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

# 6. Create GitHub Release
echo "📦 Creating GitHub Release..."
gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION - $(date +%Y-%m-%d)" \
  --notes-file ".release-notes-$NEW_VERSION.md" \
  --generate-notes

# 7. Build for npm
echo "🔨 Building..."
npm run build

# 8. Publish to npm
echo "📤 Publishing to npm..."
npm publish

# 9. Verify coherence
echo "✅ Verifying coherence..."
npx versatil doctor

echo "🎉 Release v$NEW_VERSION complete!"
```

**Usage**:
```bash
./scripts/release.sh minor   # Minor release
./scripts/release.sh major   # Major release
./scripts/release.sh patch   # Patch release
```

---

## 🔍 Coherence Validation

### What Gets Checked

```typescript
interface CoherenceStatus {
  git: {
    latest: string;           // v7.9.0
    all_tags: string[];       // [v7.0.0, v7.1.0, ...]
  };
  github: {
    latest: string;           // v7.9.0
    all_releases: Release[];  // [{ tag: v7.9.0, ... }, ...]
    missing: string[];        // Tags without GitHub Releases
  };
  npm: {
    latest: string;           // 7.9.0 (no 'v' prefix)
    versions: string[];       // [7.0.0, 7.1.0, ...]
  };
  in_sync: boolean;           // All three match?
  gaps: Gap[];                // Missing releases, version mismatches
}
```

### Gap Types

1. **missing_github_release** - Git tag exists but no GitHub Release
   - **Auto-fix**: Create GitHub Release from CHANGELOG
   - **Confidence**: 92%

2. **npm_behind** - npm version older than git/GitHub
   - **Auto-fix**: Build and publish to npm
   - **Confidence**: 88% (requires successful build)

3. **version_mismatch** - Different latest versions across platforms
   - **Manual fix**: Determine which is correct, sync others
   - **Confidence**: <70% (requires human decision)

4. **missing_changelog** - Version released but no CHANGELOG entry
   - **Auto-fix**: Extract from git log, add to CHANGELOG
   - **Confidence**: 75%

---

## 📈 Version History Analysis

Guardian can analyze version history to detect patterns:

```typescript
const analysis = await vm.analyzeVersionHistory({
  since: '2025-01-01',
  include_prerelease: false
});

console.log('Release frequency:', analysis.avg_days_between_releases); // 14.5 days
console.log('Patch releases:', analysis.patch_count);                   // 12
console.log('Minor releases:', analysis.minor_count);                   // 5
console.log('Major releases:', analysis.major_count);                   // 1
console.log('Breaking change rate:', analysis.breaking_change_rate);    // 5.6% of releases
```

**Use Cases**:
- Recommend release schedule (e.g., "Due for minor release")
- Detect version bump pattern drift
- Identify stability periods (many patches = instability)

---

## 🎯 When Guardian Uses This Skill

### Daily: Version Alignment Check

**Trigger**: Part of daily health check
**Duration**: <2 seconds
**Checks**: `package.json` version vs npm registry latest

```typescript
const installed = packageJson.version;
const latest = await npm.view('@versatil/sdlc-framework', 'version');

if (installed !== latest) {
  notify(`Update available: ${installed} → ${latest}`);
}
```

---

### Weekly: Full Coherence Check

**Trigger**: Part of weekly deep health check
**Duration**: 5-10 seconds
**Checks**: Git tags, GitHub Releases, npm versions all in sync

```typescript
const coherence = await vm.checkCoherence();

if (!coherence.in_sync) {
  const gaps = coherence.gaps;
  notify(`Version coherence issues: ${gaps.length} gaps found`);

  // Auto-fix if high confidence
  const autoFixable = gaps.filter(g => g.confidence >= 90);
  if (autoFixable.length > 0) {
    await vm.closeGaps(autoFixable);
  }
}
```

---

### On-Demand: Release Recommendation

**Trigger**: User asks "should we release?" or Guardian detects significant unreleased work
**Duration**: 10-15 seconds
**Checks**: Commits since last release, type of changes

```typescript
const commits = await git.log({ from: lastRelease, to: 'HEAD' });
const recommendation = await vm.recommendVersionBump({ commits });

if (recommendation.should_release) {
  suggest(`Recommend ${recommendation.bump_type} release: v${recommendation.next_version}
    - ${recommendation.breaking_changes.length} breaking changes
    - ${recommendation.new_features.length} new features
    - ${recommendation.bug_fixes.length} bug fixes

    Run: ./scripts/release.sh ${recommendation.bump_type}`);
}
```

---

## 📁 Reference Files (Level 3 - Load as Needed)

### `references/semver-guide.md` (~150 tokens)
Complete semantic versioning rules with edge cases, pre-release versions, metadata

**Load when**: Deciding version bump type, handling complex version scenarios

### `references/release-process.md` (~200 tokens)
Step-by-step release checklist, troubleshooting, rollback procedures

**Load when**: Creating releases, fixing failed releases

### `references/changelog-format.md` (~100 tokens)
CHANGELOG templates, section guidelines, example entries

**Load when**: Generating CHANGELOG entries, maintaining CHANGELOG

---

## 🔗 Integration Points

### With Health Monitoring

```typescript
// Version alignment is component #1 in health checks
const versionHealth = await vm.checkVersionHealth();
// Returns health score 0-100 based on version gap
```

### With Release Automation

```bash
# Guardian can trigger releases
if (should_release) {
  exec('./scripts/release.sh minor');
}
```

### With CHANGELOG Management

```typescript
// Auto-generate CHANGELOG entries from commits
const entry = await vm.generateChangelogEntry({
  version: '7.10.0',
  commits: commits_since_last_release
});
// Writes to CHANGELOG.md in correct format
```

---

## 📈 Performance Characteristics

- **Version check (local)**: <100ms (read package.json)
- **Version check (npm)**: 500-1000ms (API call)
- **Coherence check (full)**: 5-10s (3 platforms + git history)
- **Release creation**: 3-5 minutes (build, publish, verify)
- **Memory overhead**: <10MB (version history cache)

---

## 🎓 Best Practices

### For Guardian

1. **Check version daily** - Include in lightweight health check
2. **Recommend releases proactively** - When significant work unreleased
3. **Auto-fix coherence gaps** - High-confidence fixes (≥90%)
4. **Track release frequency** - Detect patterns, recommend schedule
5. **Validate before release** - All health checks pass before publishing

### For Users

1. **Follow SemVer strictly** - Breaking changes = MAJOR bump
2. **Update CHANGELOG always** - Every release gets entry
3. **Use release script** - Automates 3-platform sync
4. **Verify coherence after** - Run `npx versatil doctor` post-release
5. **Tag meaningfully** - Annotated tags with release notes

---

## 🚨 Common Issues

### Issue: npm Publish Fails

**Cause**: Usually authentication or version already exists

**Fix**:
```bash
# Check authentication
npm whoami

# Re-login if needed
npm login

# If version exists, bump version and retry
npm version patch
npm publish
```

---

### Issue: GitHub Release Creation Fails

**Cause**: Usually gh CLI not authenticated

**Fix**:
```bash
# Authenticate gh CLI
gh auth login

# Retry release creation
gh release create v7.10.0 --generate-notes
```

---

### Issue: Version Mismatch After Release

**Cause**: One platform failed during release process

**Fix**:
```bash
# Check coherence
npx versatil doctor

# Identify which platform is behind
# Manually sync the lagging platform
```

---

## 📚 Additional Resources

- **Semantic Versioning Spec**: https://semver.org/
- **Keep a Changelog**: https://keepachangelog.com/
- **GitHub Release Guide**: https://docs.github.com/en/repositories/releasing-projects-on-github
- **npm Publishing Guide**: https://docs.npmjs.com/cli/v8/commands/npm-publish
- **VERSATIL Release Process**: [docs/RELEASE_PROCESS.md](../../../docs/RELEASE_PROCESS.md)
