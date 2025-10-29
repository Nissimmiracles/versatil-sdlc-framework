# v7.14.0 - Semi-Automated Release System

**Major Feature Release**: Introduces semi-automated release workflow that detects "release-ready" features and automates the release process with user approval gates.

## What's New

### 🚀 Semi-Automated Release System (Main Feature)
- **Release Detector** - Automatically detects when features are release-ready
- **Release Notes Generator** - Auto-generates comprehensive release notes from git commits + code changes
- **Release CLI** - Three-command workflow: check → prepare → execute
- **Smart Version Bumping** - Automatic semantic versioning (major/minor/patch)
- **Quality Gates** - Checks test coverage, documentation, open TODOs before release

**Solves**: Features sitting unreleased for days/weeks (66 uncommitted files before this release)

### 🧪 Browser Testing System
- Real-time browser error detection during development
- Automatic test validation after file edits
- Playwright integration for context-validation tests
- Dev browser monitoring script

### 🛡️ Guardian Enhancements
- Root cause learning from health check issues
- Enhancement approval system (v7.12.0 features)
- Auto-start on session (v7.13.1)
- User interaction learning (v7.13.0)

### 🧠 Intelligence System Improvements
- Release detection intelligence
- Automatic release notes generation
- Pattern analysis for version bumping
- Feature classification from code changes

## Upgrade Instructions

```bash
# Via /update command (recommended)
/update

# Or via npm
npm update @versatil/sdlc-framework

# Verify version
npm list @versatil/sdlc-framework
# Should show: 7.14.0
```

**No configuration needed** - all features work out of the box!

## How to Use Semi-Automated Releases

```bash
# 1. Check if your changes are release-ready
npm run release:check

# 2. Generate release notes (auto-generated from commits)
npm run release:prepare

# 3. Review RELEASE_NOTES_PREVIEW.md and edit if needed

# 4. Execute release (requires confirmation)
npm run release:execute

# Done! Users can access via /update
```

## Benefits

- 🚀 **Never forget to release** - Automated detection when features are ready
- ✅ **Consistent quality** - Checks tests, docs, TODOs before releasing
- 📝 **Better release notes** - Generated from actual work, not manual writing
- ⚡ **Faster releases** - 5 manual steps → 3 simple commands
- 🛡️ **User approval** - Still manual final decision (no auto-spam)
- 🧪 **Enhanced testing** - Real-time browser error detection
- 🧠 **Smarter Guardian** - Learns from patterns and auto-starts on session

## Breaking Changes

None. Fully backward compatible.

## Files Changed

**Added** (52 files):
- `src/intelligence/release-detector.ts` - Detects release readiness
- `src/intelligence/release-notes-generator.ts` - Auto-generates release notes
- `src/cli/release-cli.ts` - Release workflow CLI
- `.claude/hooks/post-file-edit-browser-check.ts` - Browser testing hook
- `src/dashboard/browser-error-detector.ts` - Real-time error detection
- `src/dashboard/dev-browser-monitor.ts` - Development browser monitoring
- `src/agents/guardian/enhancement-approval-service.ts` - Enhancement approvals
- `src/agents/guardian/root-cause-learner.ts` - Root cause analysis
- ...and 44 more

**Modified** (5 files):
- `CLAUDE.md` - Documented semi-automated release system
- `package.json` - Added `release:*` commands
- `config/playwright.config.ts` - Updated test configuration
- `.claude/agents/maria-qa.md` - Enhanced agent definition
- `scripts/enhance-remaining-subagents.sh` - Subagent improvements

**Deleted** (16 files):
- Cleaned up 16 completed TODO files
- Removed `package-lock.json` (using npm workspaces)

## Technical Details

- **Total files changed**: 73
- **Lines added/modified**: ~5,450
- **New npm commands**: 3 (`release:check`, `release:prepare`, `release:execute`)
- **Test coverage**: Includes new/updated tests for all features
- **Documentation**: Comprehensive guides in CLAUDE.md

## Performance

- Release detection: <2 seconds
- Release notes generation: <3 seconds
- Version bump calculation: <1 second
- **Total overhead**: <10 seconds for complete release workflow

## Documentation

- **Release System**: [CLAUDE.md (lines 46-234)](CLAUDE.md#L46-L234)
- **Browser Testing**: [docs/testing/BROWSER_TESTING_GUIDE.md](docs/testing/BROWSER_TESTING_GUIDE.md)
- **Guardian Learning**: [docs/guardian/ROOT_CAUSE_LEARNING.md](docs/guardian/ROOT_CAUSE_LEARNING.md)
- **Release Detector API**: [src/intelligence/release-detector.ts](src/intelligence/release-detector.ts)
- **Release Notes Generator API**: [src/intelligence/release-notes-generator.ts](src/intelligence/release-notes-generator.ts)

## What's Next

- **v7.15.0**: Guardian integration for release notifications
- **v7.16.0**: Automated changelog generation
- **v7.17.0**: Release scheduling and batch releases

---

**Full Changelog**: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/v7.13.1...v7.14.0

**Previous Releases**:
- [v7.13.1 - Guardian Auto-Start](https://github.com/Nissimmiracles/versatil-sdlc-framework/releases/tag/v7.13.1)
- [v7.13.0 - Guardian User Interaction Learning](https://github.com/Nissimmiracles/versatil-sdlc-framework/releases/tag/v7.13.0)
