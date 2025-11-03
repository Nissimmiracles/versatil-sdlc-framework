#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Version Consistency Checker
 *
 * This script ensures version consistency across all package files
 * and validates semantic versioning rules.
 */

const fs = require('fs');
const path = require('path');
const semver = require('semver');

class VersionChecker {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
  }

  // Read JSON file safely
  readJSON(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      this.errors.push(`Failed to read ${filePath}: ${error.message}`);
      return null;
    }
  }

  // Check main package.json
  checkMainPackage() {
    console.log('📦 Checking main package.json...');

    const packagePath = path.join(this.rootDir, 'package.json');
    const pkg = this.readJSON(packagePath);

    if (!pkg) return;

    // Validate version format
    if (!semver.valid(pkg.version)) {
      this.errors.push(`Invalid version format in package.json: ${pkg.version}`);
      return;
    }

    this.mainVersion = pkg.version;
    console.log(`   Version: ${this.mainVersion}`);

    // Check if version follows semantic versioning
    const parsed = semver.parse(pkg.version);
    if (parsed.prerelease.length > 0) {
      this.warnings.push(`Using prerelease version: ${pkg.version}`);
    }

    return pkg;
  }

  // Check CLI package if exists
  checkCLIPackage() {
    const cliPackagePath = path.join(this.rootDir, 'cli', 'package.json');

    if (!fs.existsSync(cliPackagePath)) {
      return; // CLI package doesn't exist, skip
    }

    console.log('🔧 Checking CLI package.json...');

    const cliPkg = this.readJSON(cliPackagePath);
    if (!cliPkg) return;

    if (cliPkg.version !== this.mainVersion) {
      this.errors.push(`Version mismatch: main=${this.mainVersion}, cli=${cliPkg.version}`);
    } else {
      console.log(`   Version: ${cliPkg.version} ✅`);
    }
  }

  // Check version in source files
  checkSourceFiles() {
    console.log('📂 Checking source files...');

    // Check for version constants in TypeScript files
    const srcDir = path.join(this.rootDir, 'src');
    if (!fs.existsSync(srcDir)) return;

    this.checkDirectory(srcDir);
  }

  checkDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.checkDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        this.checkVersionInFile(filePath);
      }
    });
  }

  checkVersionInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Look for version constants
      const versionPatterns = [
        /VERSION\s*=\s*['"`]([^'"`]+)['"`]/g,
        /version:\s*['"`]([^'"`]+)['"`]/g,
        /@version\s+([^\s]+)/g
      ];

      versionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const foundVersion = match[1];
          if (foundVersion !== this.mainVersion) {
            this.warnings.push(`Version mismatch in ${filePath}: ${foundVersion} (expected ${this.mainVersion})`);
          }
        }
      });

    } catch (error) {
      this.warnings.push(`Could not read ${filePath}: ${error.message}`);
    }
  }

  // Check README and documentation
  checkDocumentation() {
    console.log('📖 Checking documentation...');

    const readmePath = path.join(this.rootDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf8');

      // Look for installation commands with versions
      const installPatterns = [
        /pnpm install.*versatil-sdlc-framework@(\d+\.\d+\.\d+[^\s]*)/g,
        /npm.*-g.*versatil-sdlc-framework@(\d+\.\d+\.\d+[^\s]*)/g
      ];

      installPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const docVersion = match[1];
          if (docVersion !== this.mainVersion) {
            this.warnings.push(`Documentation version mismatch in README.md: ${docVersion} (expected ${this.mainVersion})`);
          }
        }
      });
    }

    // Check CHANGELOG.md
    const changelogPath = path.join(this.rootDir, 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      const content = fs.readFileSync(changelogPath, 'utf8');

      // Check if current version exists in changelog
      const versionPattern = new RegExp(`##\\s*\\[${this.mainVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`);
      if (!versionPattern.test(content)) {
        this.warnings.push(`Current version ${this.mainVersion} not found in CHANGELOG.md`);
      }
    }
  }

  // Check git tags
  checkGitTags() {
    console.log('🏷️  Checking git tags...');

    try {
      const { execSync } = require('child_process');

      // Check if current version tag exists
      try {
        execSync(`git rev-parse v${this.mainVersion}`, { stdio: 'pipe' });
        this.warnings.push(`Git tag v${this.mainVersion} already exists`);
      } catch (error) {
        // Tag doesn't exist, which is good for unreleased versions
      }

      // Get latest tag
      try {
        const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        const latestVersion = latestTag.replace(/^v/, '');

        if (semver.valid(latestVersion)) {
          if (semver.lte(this.mainVersion, latestVersion)) {
            this.errors.push(`Current version ${this.mainVersion} is not greater than latest tag ${latestVersion}`);
          }
        }
      } catch (error) {
        // No tags exist, which is fine
      }

    } catch (error) {
      this.warnings.push('Could not check git tags (git not available)');
    }
  }

  // Check dependency versions
  checkDependencies() {
    console.log('🔗 Checking dependencies...');

    const packagePath = path.join(this.rootDir, 'package.json');
    const pkg = this.readJSON(packagePath);

    if (!pkg) return;

    // Check for known security vulnerabilities
    const vulnerablePackages = {
      'lodash': '<4.17.21',
      'axios': '<0.21.2',
      'express': '<4.17.3',
      'ws': '<7.4.6'
    };

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies
    };

    Object.entries(vulnerablePackages).forEach(([pkgName, vulnerableRange]) => {
      if (allDeps[pkgName]) {
        const version = allDeps[pkgName].replace(/^[^0-9]*/, ''); // Remove ^ ~ etc
        if (semver.satisfies(version, vulnerableRange)) {
          this.warnings.push(`Potentially vulnerable dependency: ${pkgName}@${version}`);
        }
      }
    });
  }

  // Generate version report
  generateReport() {
    console.log('\n📊 Version Check Report');
    console.log('='.repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All version checks passed!');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    console.log('\n📋 Summary:');
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    return this.errors.length === 0;
  }

  // Main check function
  check() {
    console.log('🔍 VERSATIL Version Consistency Checker\n');

    this.checkMainPackage();

    if (this.mainVersion) {
      this.checkCLIPackage();
      this.checkSourceFiles();
      this.checkDocumentation();
      this.checkGitTags();
      this.checkDependencies();
    }

    const success = this.generateReport();

    if (!success) {
      console.log('\n💡 Fix the errors above before releasing.');
      process.exit(1);
    }

    console.log('\n🚀 Ready for release!');
    return true;
  }

  // Fix common issues automatically
  fix() {
    console.log('🔧 VERSATIL Version Auto-Fix\n');

    if (!this.mainVersion) {
      console.error('❌ Cannot auto-fix without valid main version');
      return false;
    }

    let fixed = 0;

    // Fix CLI package version
    const cliPackagePath = path.join(this.rootDir, 'cli', 'package.json');
    if (fs.existsSync(cliPackagePath)) {
      const cliPkg = this.readJSON(cliPackagePath);
      if (cliPkg && cliPkg.version !== this.mainVersion) {
        cliPkg.version = this.mainVersion;
        fs.writeFileSync(cliPackagePath, JSON.stringify(cliPkg, null, 2) + '\n');
        console.log('✅ Fixed CLI package version');
        fixed++;
      }
    }

    // TODO: Add more auto-fix capabilities

    console.log(`\n🎯 Auto-fixed ${fixed} issues`);
    return fixed > 0;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 VERSATIL Version Consistency Checker

Usage: node scripts/version-check.js [options]

Options:
  --fix        Automatically fix common issues
  --json       Output results as JSON
  --help, -h   Show this help

Examples:
  node scripts/version-check.js
  node scripts/version-check.js --fix
  node scripts/version-check.js --json
`);
    process.exit(0);
  }

  const checker = new VersionChecker();

  if (args.includes('--json')) {
    // Run checks silently
    checker.checkMainPackage();
    if (checker.mainVersion) {
      checker.checkCLIPackage();
      checker.checkSourceFiles();
      checker.checkDocumentation();
      checker.checkGitTags();
      checker.checkDependencies();
    }

    // Output JSON
    const result = {
      success: checker.errors.length === 0,
      version: checker.mainVersion,
      errors: checker.errors,
      warnings: checker.warnings,
      errorCount: checker.errors.length,
      warningCount: checker.warnings.length
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(checker.errors.length === 0 ? 0 : 1);
  } else if (args.includes('--fix')) {
    checker.checkMainPackage();
    checker.fix();
  } else {
    checker.check();
  }
}

module.exports = VersionChecker;