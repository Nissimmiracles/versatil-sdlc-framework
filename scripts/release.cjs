#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Automated Release Script
 *
 * This script automates the release process including:
 * - Version bumping
 * - Changelog generation
 * - Git tagging
 * - NPM publishing
 * - GitHub release creation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

class ReleaseManager {
  constructor() {
    this.packagePath = path.join(__dirname, '../package.json');
    this.changelogPath = path.join(__dirname, '../CHANGELOG.md');
    this.releasePath = path.join(__dirname, '../RELEASE_NOTES.md');

    // Load package.json
    this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.currentVersion = this.package.version;

    console.log(`🚀 VERSATIL Release Manager`);
    console.log(`📦 Current version: ${this.currentVersion}`);
  }

  // Execute shell command with error handling
  exec(command, options = {}) {
    try {
      console.log(`🔧 Executing: ${command}`);
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'inherit',
        ...options
      });
      return result;
    } catch (error) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  // Check if working directory is clean
  checkWorkingDirectory() {
    console.log('\n📋 Checking working directory...');

    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.error('❌ Working directory is not clean. Please commit or stash changes.');
        console.log('Uncommitted changes:');
        console.log(status);
        process.exit(1);
      }
      console.log('✅ Working directory is clean');
    } catch (error) {
      console.error('❌ Failed to check git status');
      process.exit(1);
    }
  }

  // Run comprehensive tests
  runTests() {
    console.log('\n🧪 Running test suite...');

    // Run linting
    console.log('📝 Running ESLint...');
    this.exec('npm run lint');

    // Run TypeScript compilation
    console.log('🔨 Building TypeScript...');
    this.exec('npm run build');

    // Run tests
    console.log('🧪 Running tests...');
    this.exec('npm test');

    // Run security audit
    console.log('🔒 Running security audit...');
    this.exec('npm audit --audit-level=moderate');

    console.log('✅ All tests passed');
  }

  // Determine next version based on changes
  determineNextVersion(releaseType) {
    if (!['patch', 'minor', 'major', 'prerelease'].includes(releaseType)) {
      console.error('❌ Invalid release type. Use: patch, minor, major, or prerelease');
      process.exit(1);
    }

    const nextVersion = semver.inc(this.currentVersion, releaseType);
    console.log(`📈 Version bump: ${this.currentVersion} → ${nextVersion}`);
    return nextVersion;
  }

  // Generate changelog based on git commits
  generateChangelog(version) {
    console.log('\n📝 Generating changelog...');

    try {
      // Get commits since last tag
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%h %s"`, { encoding: 'utf8' });

      if (!commits.trim()) {
        console.log('⚠️  No commits found since last release');
        return;
      }

      const changes = this.categorizeCommits(commits);
      const changelogEntry = this.formatChangelogEntry(version, changes);

      // Prepend to existing changelog
      let existingChangelog = '';
      if (fs.existsSync(this.changelogPath)) {
        existingChangelog = fs.readFileSync(this.changelogPath, 'utf8');
      } else {
        existingChangelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
      }

      // Insert new entry after the header
      const headerEnd = existingChangelog.indexOf('\n\n') + 2;
      const newChangelog = existingChangelog.slice(0, headerEnd) +
                          changelogEntry + '\n' +
                          existingChangelog.slice(headerEnd);

      fs.writeFileSync(this.changelogPath, newChangelog);
      console.log('✅ Changelog updated');

      return changes;
    } catch (error) {
      console.warn('⚠️  Could not generate changelog automatically');
      return null;
    }
  }

  // Categorize commits based on conventional commit format
  categorizeCommits(commits) {
    const changes = {
      added: [],
      changed: [],
      fixed: [],
      deprecated: [],
      removed: [],
      security: []
    };

    commits.split('\n').forEach(commit => {
      const match = commit.match(/^(\w+)\s+(\w+)(\(.+\))?\s*:\s*(.+)$/);
      if (match) {
        const [, hash, type, scope, message] = match;
        const formattedMessage = `${message} (${hash})`;

        switch (type.toLowerCase()) {
          case 'feat':
            changes.added.push(formattedMessage);
            break;
          case 'fix':
            changes.fixed.push(formattedMessage);
            break;
          case 'perf':
          case 'refactor':
          case 'style':
            changes.changed.push(formattedMessage);
            break;
          case 'security':
            changes.security.push(formattedMessage);
            break;
          case 'deprecated':
            changes.deprecated.push(formattedMessage);
            break;
          case 'remove':
            changes.removed.push(formattedMessage);
            break;
          default:
            changes.changed.push(formattedMessage);
        }
      }
    });

    return changes;
  }

  // Format changelog entry
  formatChangelogEntry(version, changes) {
    const date = new Date().toISOString().split('T')[0];
    let entry = `## [${version}] - ${date}\n\n`;

    if (changes.added.length > 0) {
      entry += '### Added\n';
      changes.added.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    if (changes.changed.length > 0) {
      entry += '### Changed\n';
      changes.changed.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    if (changes.fixed.length > 0) {
      entry += '### Fixed\n';
      changes.fixed.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    if (changes.deprecated.length > 0) {
      entry += '### Deprecated\n';
      changes.deprecated.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    if (changes.removed.length > 0) {
      entry += '### Removed\n';
      changes.removed.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    if (changes.security.length > 0) {
      entry += '### Security\n';
      changes.security.forEach(change => entry += `- ${change}\n`);
      entry += '\n';
    }

    return entry;
  }

  // Generate release notes
  generateReleaseNotes(version, changes) {
    console.log('\n📄 Generating release notes...');

    const notes = `# 🚀 VERSATIL v${version}

## Release Highlights

This release includes ${changes ? this.summarizeChanges(changes) : 'various improvements and bug fixes'}.

${changes ? this.formatReleaseChanges(changes) : ''}

## 📦 Installation

\`\`\`bash
npm install -g versatil-sdlc-framework@${version}
\`\`\`

## 🔄 Upgrade Guide

\`\`\`bash
# Update existing installation
npm update versatil-sdlc-framework

# Verify installation
versatil --version
\`\`\`

## 📚 Documentation

- [Framework Guide](https://github.com/MiraclesGIT/versatil-sdlc-framework#readme)
- [OPERA Methodology](https://github.com/MiraclesGIT/versatil-sdlc-framework/blob/main/CLAUDE.md)
- [MCP Integration](https://github.com/MiraclesGIT/versatil-sdlc-framework/blob/main/docs/mcp-integration.md)

## 🤝 Community

- [Discord](https://discord.gg/versatil-sdlc)
- [Discussions](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions)
- [Support](https://github.com/MiraclesGIT/versatil-sdlc-framework/blob/main/.github/SUPPORT.md)

## 📋 Full Changelog

[View complete changelog](CHANGELOG.md#${version.replace(/\./g, '')})

---

🤖 Generated with VERSATIL Release Automation
`;

    fs.writeFileSync(this.releasePath, notes);
    console.log('✅ Release notes generated');
  }

  summarizeChanges(changes) {
    const total = Object.values(changes).reduce((sum, arr) => sum + arr.length, 0);
    return `${total} changes including new features, improvements, and bug fixes`;
  }

  formatReleaseChanges(changes) {
    let formatted = '';

    if (changes.added.length > 0) {
      formatted += '### ✨ New Features\n';
      changes.added.slice(0, 5).forEach(change => {
        formatted += `- ${change.replace(/\s\(\w+\)$/, '')}\n`;
      });
      formatted += '\n';
    }

    if (changes.fixed.length > 0) {
      formatted += '### 🐛 Bug Fixes\n';
      changes.fixed.slice(0, 5).forEach(change => {
        formatted += `- ${change.replace(/\s\(\w+\)$/, '')}\n`;
      });
      formatted += '\n';
    }

    if (changes.security.length > 0) {
      formatted += '### 🔒 Security\n';
      changes.security.forEach(change => {
        formatted += `- ${change.replace(/\s\(\w+\)$/, '')}\n`;
      });
      formatted += '\n';
    }

    return formatted;
  }

  // Update package.json version
  updateVersion(version) {
    console.log('\n📦 Updating package.json...');

    this.package.version = version;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.package, null, 2) + '\n');

    console.log('✅ Package version updated');
  }

  // Commit and tag release
  commitAndTag(version) {
    console.log('\n📝 Committing release...');

    // Stage all changes
    this.exec('git add .');

    // Commit with conventional format
    this.exec(`git commit -m "chore: release v${version}

🚀 Release v${version}

- Updated version in package.json
- Generated CHANGELOG.md
- Created release notes

Generated with VERSATIL Release Automation"`);

    // Create annotated tag
    this.exec(`git tag -a v${version} -m "Release v${version}"`);

    console.log('✅ Release committed and tagged');
  }

  // Push to repository
  pushRelease() {
    console.log('\n🚀 Pushing release...');

    this.exec('git push origin main');
    this.exec('git push origin --tags');

    console.log('✅ Release pushed to repository');
  }

  // Publish to NPM
  publishToNPM() {
    console.log('\n📦 Publishing to NPM...');

    try {
      // Check if user is logged in
      this.exec('npm whoami');

      // Publish package
      this.exec('npm publish');

      console.log('✅ Package published to NPM');
    } catch (error) {
      console.error('❌ NPM publish failed. Please check your authentication.');
      console.error('Run: npm login');
      process.exit(1);
    }
  }

  // Create GitHub release
  createGitHubRelease(version) {
    console.log('\n🏷️  Creating GitHub release...');

    try {
      // Check if gh CLI is available
      this.exec('gh --version', { stdio: 'pipe' });

      // Create release
      this.exec(`gh release create v${version} --title "VERSATIL v${version}" --notes-file ${this.releasePath} --latest`);

      console.log('✅ GitHub release created');
    } catch (error) {
      console.warn('⚠️  Could not create GitHub release. Please install GitHub CLI or create manually.');
      console.log(`Release notes saved to: ${this.releasePath}`);
    }
  }

  // Main release process
  async release(releaseType = 'patch', options = {}) {
    console.log(`\n🎯 Starting ${releaseType} release process...\n`);

    try {
      // Pre-release checks
      if (!options.skipChecks) {
        this.checkWorkingDirectory();
        this.runTests();
      }

      // Determine version
      const nextVersion = this.determineNextVersion(releaseType);

      // Generate changelog and release notes
      const changes = this.generateChangelog(nextVersion);
      this.generateReleaseNotes(nextVersion, changes);

      // Update version
      this.updateVersion(nextVersion);

      // Commit and tag
      this.commitAndTag(nextVersion);

      // Push to repository
      if (!options.dryRun) {
        this.pushRelease();

        // Publish to NPM
        if (!options.skipNPM) {
          this.publishToNPM();
        }

        // Create GitHub release
        if (!options.skipGitHub) {
          this.createGitHubRelease(nextVersion);
        }
      }

      console.log(`\n🎉 Release v${nextVersion} completed successfully!`);
      console.log(`\n📊 Release Summary:`);
      console.log(`   Version: ${this.currentVersion} → ${nextVersion}`);
      console.log(`   Type: ${releaseType}`);
      console.log(`   NPM: ${options.skipNPM ? 'Skipped' : 'Published'}`);
      console.log(`   GitHub: ${options.skipGitHub ? 'Skipped' : 'Created'}`);
      console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);

      if (options.dryRun) {
        console.log('\n⚠️  This was a dry run. No changes were published.');
      }

    } catch (error) {
      console.error('\n❌ Release failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const releaseType = args[0] || 'patch';

  const options = {
    dryRun: args.includes('--dry-run'),
    skipChecks: args.includes('--skip-checks'),
    skipNPM: args.includes('--skip-npm'),
    skipGitHub: args.includes('--skip-github')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 VERSATIL Release Manager

Usage: node scripts/release.js [type] [options]

Release Types:
  patch     Patch release (bug fixes)
  minor     Minor release (new features)
  major     Major release (breaking changes)
  prerelease Prerelease version

Options:
  --dry-run      Run without publishing
  --skip-checks  Skip tests and validation
  --skip-npm     Skip NPM publishing
  --skip-github  Skip GitHub release creation
  --help, -h     Show this help

Examples:
  node scripts/release.js patch
  node scripts/release.js minor --dry-run
  node scripts/release.js major --skip-npm
`);
    process.exit(0);
  }

  const releaseManager = new ReleaseManager();
  releaseManager.release(releaseType, options);
}

module.exports = ReleaseManager;