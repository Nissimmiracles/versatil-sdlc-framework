# Release Process Guide

**Complete checklist for creating framework releases**

---

## Pre-Release Checklist

### 1. Health Check (CRITICAL)

```bash
# All checks must pass before release
npx versatil doctor

# Expected output:
# Overall Health: 90-100/100 (excellent or good)
# ✅ No critical issues
# ✅ All tests passing
# ✅ Build successful
```

**If health <90%**: Fix issues before releasing!

---

### 2. Code Quality Gates

```bash
# Run all tests
npm test

# Check test coverage (must be ≥80%)
npm run test:coverage

# TypeScript compilation (must pass)
npm run build

# Linting (must pass)
npm run lint
```

**All must pass** - No exceptions!

---

### 3. Documentation Review

- [ ] README.md updated with new features
- [ ] CHANGELOG.md has Unreleased section with changes
- [ ] All new features documented in docs/
- [ ] Migration guide created (if MAJOR release)
- [ ] API documentation up-to-date

---

### 4. Dependency Audit

```bash
# Check for security vulnerabilities
npm audit

# Expected: 0 critical, 0 high vulnerabilities
# If issues found:
npm audit fix
```

---

### 5. Commit History Review

```bash
# Review commits since last release
git log v7.9.0..HEAD --oneline

# Categorize changes:
# - Breaking changes? → MAJOR
# - New features? → MINOR
# - Bug fixes only? → PATCH
```

**Determine version bump type** based on changes.

---

## Release Process (Step-by-Step)

### Step 1: Determine Next Version

```bash
# Current version
CURRENT=$(jq -r .version package.json)
echo "Current: v$CURRENT"

# Decide bump type (major, minor, or patch)
TYPE="minor"  # or major, patch

# Calculate next version
NEXT=$(npx semver $CURRENT -i $TYPE)
echo "Next: v$NEXT"
```

---

### Step 2: Update package.json

```bash
# Bump version (doesn't create git tag yet)
npm version $TYPE --no-git-tag-version

# Verify
cat package.json | grep version
# "version": "7.10.0"
```

---

### Step 3: Generate CHANGELOG Entry

```bash
# Move Unreleased section to new version
cat >> CHANGELOG.md << EOF

## [7.10.0] - $(date +%Y-%m-%d)

### Added
- New Victor-Verifier agent for anti-hallucination
- Chain-of-Verification (CoVe) implementation

### Changed
- Updated health-monitoring skill

### Fixed
- Fixed TypeScript compilation error

### Security
- Updated axios to fix CVE-2024-XXXXX

---
EOF

# Format: Keep a Changelog standard
# Sections: Added, Changed, Deprecated, Removed, Fixed, Security
```

**Manual review required** - Ensure all changes documented!

---

### Step 4: Commit Version Bump

```bash
# Stage changes
git add package.json CHANGELOG.md

# Commit with standard message
git commit -m "Release v7.10.0

- Updated package.json to v7.10.0
- Generated CHANGELOG entry for v7.10.0

🤖 Generated with VERSATIL Release Automation

Co-Authored-By: Guardian <noreply@versatil.dev>"

# DO NOT push yet - tag first
```

---

### Step 5: Create Git Tag

```bash
# Annotated tag with release notes
git tag -a v7.10.0 -m "Release v7.10.0

## Highlights

- New Victor-Verifier agent
- Enhanced health monitoring
- Security fixes

See CHANGELOG.md for complete details."

# Verify tag
git tag --list v7.10.0
git show v7.10.0
```

**Annotated tags only** - Lightweight tags don't support notes!

---

### Step 6: Push to GitHub

```bash
# Push commit
git push origin main

# Push tag
git push origin v7.10.0

# Or push both together
git push origin main --tags
```

---

### Step 7: Create GitHub Release

```bash
# Using gh CLI (recommended)
gh release create v7.10.0 \
  --title "v7.10.0 - Anti-Hallucination Update" \
  --notes-file .release-notes-7.10.0.md \
  --generate-notes

# Or manual via GitHub UI:
# 1. Go to https://github.com/Nissimmiracles/versatil-sdlc-framework/releases/new
# 2. Choose tag: v7.10.0
# 3. Title: v7.10.0 - Anti-Hallucination Update
# 4. Copy notes from CHANGELOG.md
# 5. Click "Publish release"
```

**Verify**: https://github.com/Nissimmiracles/versatil-sdlc-framework/releases/latest

---

### Step 8: Build for npm

```bash
# Clean previous build
rm -rf dist/

# Build TypeScript → JavaScript
npm run build

# Verify build output
ls -la dist/
# Should see: index.js, index.d.ts, agents/, rag/, etc.

# Check package size (should be <10MB)
du -sh dist/
```

**Build must succeed** - No TypeScript errors!

---

### Step 9: Publish to npm

```bash
# Ensure authenticated
npm whoami
# Should show your npm username

# If not authenticated
npm login

# Publish (public package)
npm publish --access public

# Verify
npm view @versatil/sdlc-framework version
# Should show: 7.10.0
```

**Verification URL**: https://www.npmjs.com/package/@versatil/sdlc-framework

---

### Step 10: Verify Coherence

```bash
# Check 3-platform sync
npx versatil doctor

# Expected output:
# Version Alignment:
#   Local: v7.10.0 ✅
#   GitHub: v7.10.0 ✅
#   npm: 7.10.0 ✅
#   Status: In sync ✅
```

**All three must match** - If not, debug and fix!

---

## Post-Release Tasks

### 1. Update Roadmap (if applicable)

```bash
# Mark completed milestones in docs/VERSATIL_ROADMAP.md
# Add new features to upcoming milestones
```

---

### 2. Announce Release

- [ ] Post to GitHub Discussions
- [ ] Update project website (if applicable)
- [ ] Notify users via newsletter (if applicable)
- [ ] Share on social media (if applicable)

---

### 3. Monitor for Issues

```bash
# Check npm downloads
npm view @versatil/sdlc-framework

# Monitor GitHub issues
gh issue list --label "bug" --state open

# Check health reports from users
# (Guardian monitors framework health across installations)
```

---

### 4. Create Unreleased Section in CHANGELOG

```bash
# Prepare for next release
cat >> CHANGELOG.md << EOF
## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
EOF
```

---

## Rollback Procedure (If Release Fails)

### Rollback npm Publish

```bash
# Deprecate broken version (can't delete)
npm deprecate @versatil/sdlc-framework@7.10.0 "Broken release, use 7.9.0"

# Publish fixed version
npm version patch  # 7.10.0 → 7.10.1
npm publish
```

**Note**: npm doesn't allow deleting published versions!

---

### Rollback Git Tag/Release

```bash
# Delete local tag
git tag -d v7.10.0

# Delete remote tag
git push origin :refs/tags/v7.10.0

# Delete GitHub Release via gh CLI
gh release delete v7.10.0 --yes

# Or via GitHub UI:
# https://github.com/.../releases → Edit → Delete
```

---

### Rollback Commit

```bash
# Revert version bump commit
git revert HEAD

# Or reset (if not pushed to public branch)
git reset --hard HEAD~1
```

---

## Troubleshooting

### Issue: npm Publish Permission Denied

**Cause**: Not authenticated or insufficient permissions

**Fix**:
```bash
# Login to npm
npm login

# Verify authentication
npm whoami

# Check package permissions
npm access list packages

# Add yourself as maintainer (if needed)
npm owner add your-username @versatil/sdlc-framework
```

---

### Issue: GitHub Release Creation Fails

**Cause**: gh CLI not authenticated or tag doesn't exist

**Fix**:
```bash
# Authenticate gh CLI
gh auth login

# Verify tag exists
git tag --list v7.10.0

# If tag missing, create it first
git tag -a v7.10.0 -m "Release v7.10.0"
git push origin v7.10.0

# Retry release creation
gh release create v7.10.0 --generate-notes
```

---

### Issue: Build Fails During Release

**Cause**: TypeScript compilation errors

**Fix**:
```bash
# Check errors
npm run build 2>&1 | tee build.log

# Fix TypeScript errors in source
# Common issues:
# - Missing type definitions
# - Import path errors
# - Type mismatches

# Rebuild
npm run build

# If still failing, abort release and fix issues
```

---

### Issue: Version Already Exists on npm

**Cause**: Version number already published

**Fix**:
```bash
# Bump to next patch version
npm version patch  # 7.10.0 → 7.10.1

# Update CHANGELOG.md with new version

# Commit
git add package.json CHANGELOG.md
git commit -m "Bump to v7.10.1 (v7.10.0 already published)"

# Tag
git tag -a v7.10.1 -m "Release v7.10.1"

# Push
git push origin main v7.10.1

# Publish
npm publish
```

---

## Automated Release Script

```bash
#!/bin/bash
# scripts/release.sh - Complete automated release

set -e  # Exit on error

TYPE=${1:-minor}

echo "🚀 Starting $TYPE release..."

# Pre-release checks
echo "📊 Running health check..."
npx versatil doctor || {
  echo "❌ Health check failed! Fix issues before releasing."
  exit 1
}

echo "🧪 Running tests..."
npm test || {
  echo "❌ Tests failed!"
  exit 1
}

echo "🔨 Building..."
npm run build || {
  echo "❌ Build failed!"
  exit 1
}

# Version bump
echo "📝 Bumping version..."
npm version $TYPE --no-git-tag-version
NEW_VERSION=$(jq -r .version package.json)

# CHANGELOG (manual step)
echo "📋 Update CHANGELOG.md for v$NEW_VERSION"
echo "Press Enter when done..."
read

# Commit
echo "💾 Committing..."
git add package.json CHANGELOG.md
git commit -m "Release v$NEW_VERSION

🤖 Generated with VERSATIL Release Automation"

# Tag
echo "🏷️  Creating tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push
echo "⬆️  Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

# GitHub Release
echo "📦 Creating GitHub Release..."
gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION - $(date +%Y-%m-%d)" \
  --generate-notes

# npm publish
echo "📤 Publishing to npm..."
npm publish

# Verify
echo "✅ Verifying coherence..."
npx versatil doctor

echo "🎉 Release v$NEW_VERSION complete!"
echo ""
echo "Next steps:"
echo "  1. Announce release"
echo "  2. Monitor for issues"
echo "  3. Update roadmap"
```

**Usage**:
```bash
chmod +x scripts/release.sh
./scripts/release.sh minor
```

---

## Release Schedule Recommendations

### Patch Releases (Bug Fixes)

**Frequency**: As needed (usually 1-2 weeks)
**Urgency**: Critical bugs = immediate, minor bugs = batched

---

### Minor Releases (New Features)

**Frequency**: Every 2-4 weeks
**Planning**: Feature batching, user feedback cycles

---

### Major Releases (Breaking Changes)

**Frequency**: Every 6-12 months
**Planning**: Deprecation timeline, migration guides, community notice

---

## Best Practices

1. **Never skip pre-release checks** - Health, tests, build must pass
2. **Always annotate tags** - Lightweight tags don't support notes
3. **Use release script** - Reduces manual errors
4. **Verify coherence after** - Ensure 3 platforms in sync
5. **Document breaking changes** - Migration guide for MAJOR releases
6. **Test releases in staging** - Use pre-release versions (beta, rc)
7. **Communicate clearly** - Announce breaking changes early
8. **Monitor post-release** - Watch for issues in first 24-48 hours
