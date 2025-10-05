/**
 * Automated Version Manager
 * Handles semantic versioning, git tagging, and release automation
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ChangelogGenerator } from './changelog-generator.js';

export type VersionBumpType = 'major' | 'minor' | 'patch' | 'prerelease';

export interface VersionInfo {
  current: string;
  next: string;
  bumpType: VersionBumpType;
  breaking: boolean;
  features: number;
  fixes: number;
}

export interface ReleaseConfig {
  autoTag: boolean;
  autoChangelog: boolean;
  autoCommit: boolean;
  commitMessage: string;
  tagMessage: string;
  createGitHubRelease: boolean;
  dryRun: boolean;
}

export class VersionManager {
  private projectPath: string;
  private changelogGenerator: ChangelogGenerator;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.changelogGenerator = new ChangelogGenerator(projectPath);
  }

  /**
   * Analyze commits and determine version bump type
   */
  async analyzeVersionBump(fromTag?: string): Promise<VersionInfo> {
    console.log('🔍 Analyzing commits for version bump...');

    const commits = await this.getCommitsSince(fromTag);
    const currentVersion = await this.getCurrentVersion();

    let hasBreaking = false;
    let hasFeatures = false;
    let hasFixes = false;

    for (const commit of commits) {
      if (this.isBreakingChange(commit)) {
        hasBreaking = true;
      } else if (this.isFeature(commit)) {
        hasFeatures = true;
      } else if (this.isFix(commit)) {
        hasFixes = true;
      }
    }

    let bumpType: VersionBumpType;
    if (hasBreaking) {
      bumpType = 'major';
    } else if (hasFeatures) {
      bumpType = 'minor';
    } else if (hasFixes) {
      bumpType = 'patch';
    } else {
      bumpType = 'patch'; // Default for any changes
    }

    const nextVersion = this.bumpVersion(currentVersion, bumpType);

    return {
      current: currentVersion,
      next: nextVersion,
      bumpType,
      breaking: hasBreaking,
      features: commits.filter(c => this.isFeature(c)).length,
      fixes: commits.filter(c => this.isFix(c)).length
    };
  }

  /**
   * Automatically bump version based on commit analysis
   */
  async autoVersion(config: Partial<ReleaseConfig> = {}): Promise<VersionInfo> {
    const defaultConfig: ReleaseConfig = {
      autoTag: true,
      autoChangelog: true,
      autoCommit: true,
      commitMessage: 'chore(release): bump version to {version}',
      tagMessage: 'Release {version}',
      createGitHubRelease: false,
      dryRun: false,
      ...config
    };

    console.log('🚀 Starting automatic version bump...');

    const versionInfo = await this.analyzeVersionBump();

    console.log(`📊 Version Analysis:
   Current: ${versionInfo.current}
   Next: ${versionInfo.next}
   Type: ${versionInfo.bumpType}
   Breaking: ${versionInfo.breaking}
   Features: ${versionInfo.features}
   Fixes: ${versionInfo.fixes}`);

    if (defaultConfig.dryRun) {
      console.log('🧪 DRY RUN - No changes will be made');
      return versionInfo;
    }

    // Update package.json
    await this.updatePackageVersion(versionInfo.next);
    console.log(`✅ Updated package.json to ${versionInfo.next}`);

    // Generate changelog
    if (defaultConfig.autoChangelog) {
      await this.changelogGenerator.autoGenerateChangelog();
      console.log('✅ Updated CHANGELOG.md');
    }

    // Commit changes
    if (defaultConfig.autoCommit) {
      const commitMessage = defaultConfig.commitMessage.replace('{version}', versionInfo.next);
      await this.commitVersionChanges(commitMessage);
      console.log(`✅ Committed version changes: ${commitMessage}`);
    }

    // Create git tag
    if (defaultConfig.autoTag) {
      const tagMessage = defaultConfig.tagMessage.replace('{version}', versionInfo.next);
      await this.createGitTag(versionInfo.next, tagMessage);
      console.log(`✅ Created git tag: ${versionInfo.next}`);
    }

    // Create GitHub release
    if (defaultConfig.createGitHubRelease) {
      await this.createGitHubRelease(versionInfo.next);
      console.log('✅ Created GitHub release');
    }

    console.log(`🎉 Version bump complete: ${versionInfo.current} → ${versionInfo.next}`);

    return versionInfo;
  }

  /**
   * Manual version bump
   */
  async bumpVersionManual(bumpType: VersionBumpType, config: Partial<ReleaseConfig> = {}): Promise<VersionInfo> {
    const currentVersion = await this.getCurrentVersion();
    const nextVersion = this.bumpVersion(currentVersion, bumpType);

    const versionInfo: VersionInfo = {
      current: currentVersion,
      next: nextVersion,
      bumpType,
      breaking: bumpType === 'major',
      features: 0,
      fixes: 0
    };

    console.log(`📦 Manual version bump: ${currentVersion} → ${nextVersion} (${bumpType})`);

    await this.autoVersion({ ...config, dryRun: false });

    return versionInfo;
  }

  /**
   * Prerelease version management
   */
  async createPrerelease(identifier: string = 'alpha'): Promise<VersionInfo> {
    const currentVersion = await this.getCurrentVersion();
    const nextVersion = this.createPrereleaseVersion(currentVersion, identifier);

    console.log(`🧪 Creating prerelease: ${currentVersion} → ${nextVersion}`);

    await this.updatePackageVersion(nextVersion);
    await this.createGitTag(nextVersion, `Prerelease ${nextVersion}`);

    return {
      current: currentVersion,
      next: nextVersion,
      bumpType: 'prerelease',
      breaking: false,
      features: 0,
      fixes: 0
    };
  }

  /**
   * Get current version from package.json
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || '0.0.0';
    } catch (error) {
      console.warn('Could not read package.json version, defaulting to 0.0.0');
      return '0.0.0';
    }
  }

  /**
   * Update version in package.json
   */
  private async updatePackageVersion(newVersion: string): Promise<void> {
    const packagePath = path.join(this.projectPath, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    packageJson.version = newVersion;

    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  /**
   * Bump version using semantic versioning
   */
  private bumpVersion(version: string, bumpType: VersionBumpType): string {
    const parts = version.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    switch (bumpType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      case 'prerelease':
        return `${major}.${minor}.${patch + 1}-alpha.1`;
      default:
        return version;
    }
  }

  /**
   * Create prerelease version
   */
  private createPrereleaseVersion(version: string, identifier: string): string {
    const parts = version.split('.');
    const [major, minor, patch] = parts;

    if (version.includes('-')) {
      // Already a prerelease, increment the number
      const [base, prerelease] = version.split('-');
      const [prereleaseId, prereleaseNumber] = prerelease?.split('.') || ['beta', '0'];
      return `${base}-${prereleaseId}.${parseInt(prereleaseNumber || '0') + 1}`;
    } else {
      // Create new prerelease
      return `${major}.${minor}.${parseInt(patch || '0') + 1}-${identifier}.1`;
    }
  }

  /**
   * Get commits since last tag or from beginning
   */
  private async getCommitsSince(fromTag?: string): Promise<string[]> {
    try {
      let command = 'git log --oneline --no-merges';

      if (fromTag) {
        command = `git log ${fromTag}..HEAD --oneline --no-merges`;
      } else {
        const lastTag = await this.getLastTag();
        if (lastTag) {
          command = `git log ${lastTag}..HEAD --oneline --no-merges`;
        }
      }

      const output = execSync(command, {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });

      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.warn('Could not get git commits:', error);
      return [];
    }
  }

  /**
   * Check if commit is a breaking change
   */
  private isBreakingChange(commit: string): boolean {
    return commit.includes('BREAKING CHANGE') ||
           commit.includes('!:') ||
           !!commit.match(/^feat\([^)]*\)!:/);
  }

  /**
   * Check if commit is a feature
   */
  private isFeature(commit: string): boolean {
    return !!commit.match(/^[a-f0-9]+ feat(\([^)]*\))?:/);
  }

  /**
   * Check if commit is a fix
   */
  private isFix(commit: string): boolean {
    return !!commit.match(/^[a-f0-9]+ fix(\([^)]*\))?:/);
  }

  /**
   * Get last git tag
   */
  private async getLastTag(): Promise<string | undefined> {
    try {
      const output = execSync('git describe --tags --abbrev=0', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      return output.trim();
    } catch {
      return undefined;
    }
  }

  /**
   * Commit version changes
   */
  private async commitVersionChanges(message: string): Promise<void> {
    try {
      execSync('git add package.json CHANGELOG.md', {
        cwd: this.projectPath,
        stdio: 'pipe'
      });

      execSync(`git commit -m "${message}

🤖 Generated with VERSATIL SDLC Framework
Co-Authored-By: Claude <noreply@anthropic.com>"`, {
        cwd: this.projectPath,
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('Could not commit version changes:', error);
    }
  }

  /**
   * Create git tag
   */
  private async createGitTag(version: string, message: string): Promise<void> {
    try {
      execSync(`git tag -a v${version} -m "${message}"`, {
        cwd: this.projectPath,
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('Could not create git tag:', error);
    }
  }

  /**
   * Create GitHub release
   */
  private async createGitHubRelease(version: string): Promise<void> {
    try {
      const releaseNotes = await this.changelogGenerator.generateReleaseNotes(version);

      // Use GitHub CLI if available
      execSync(`gh release create v${version} --title "Release ${version}" --notes "${releaseNotes}"`, {
        cwd: this.projectPath,
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('Could not create GitHub release (gh CLI may not be installed):', error);
    }
  }

  /**
   * Check if we're ahead of remote
   */
  async checkRemoteStatus(): Promise<{ ahead: number; behind: number }> {
    try {
      execSync('git fetch', { cwd: this.projectPath, stdio: 'pipe' });

      const status = execSync('git rev-list --count --left-right HEAD...@{upstream}', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });

      const parts = status.trim().split('\t').map(Number);
      const ahead = parts[0] || 0;
      const behind = parts[1] || 0;
      return { ahead, behind };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  /**
   * Get version history
   */
  async getVersionHistory(): Promise<{ version: string; date: Date; tag: string }[]> {
    try {
      const output = execSync('git tag -l --sort=-version:refname --format="%(refname:short) %(creatordate:iso8601)"', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });

      return output.trim().split('\n').map(line => {
        const [tag, dateStr] = line.split(' ');
        if (!tag || !dateStr) {
          return {
            version: tag || 'unknown',
            date: new Date(),
            tag: tag || 'unknown'
          };
        }
        return {
          version: tag.replace(/^v/, ''),
          date: new Date(dateStr),
          tag
        };
      });
    } catch {
      return [];
    }
  }
}

export const versionManager = new VersionManager();