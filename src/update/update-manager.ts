/**
 * VERSATIL SDLC Framework - Update Manager
 * Manages framework updates with backup and rollback capabilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GitHubReleaseChecker, ReleaseInfo, UpdateCheckResult } from './github-release-checker.js';
import { compareVersions } from './semantic-version.js';

const execAsync = promisify(exec);

export interface UpdateConfig {
  autoCheck: boolean;
  checkInterval: number; // milliseconds
  includePrerelease: boolean;
  backupBeforeUpdate: boolean;
  autoUpdate: boolean;
}

export interface UpdateHistory {
  timestamp: string;
  fromVersion: string;
  toVersion: string;
  success: boolean;
  error?: string;
}

export class UpdateManager {
  private releaseChecker: GitHubReleaseChecker;
  private config: UpdateConfig;
  private versatilHome: string;
  private updateHistoryFile: string;

  constructor(config?: Partial<UpdateConfig>) {
    this.releaseChecker = new GitHubReleaseChecker();
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.updateHistoryFile = path.join(this.versatilHome, 'update-history.json');

    this.config = {
      autoCheck: true,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      includePrerelease: false,
      backupBeforeUpdate: true,
      autoUpdate: false,
      ...config
    };
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(currentVersion: string): Promise<UpdateCheckResult> {
    return this.releaseChecker.checkForUpdate(currentVersion, this.config.includePrerelease);
  }

  /**
   * Perform framework update
   */
  async update(currentVersion: string, targetVersion?: string): Promise<boolean> {
    try {
      // Get update information
      const updateCheck = await this.checkForUpdates(currentVersion);

      if (!updateCheck.hasUpdate && !targetVersion) {
        console.log('✅ Already on latest version');
        return true;
      }

      const versionToInstall = targetVersion || updateCheck.latestVersion;

      // Backup if configured
      if (this.config.backupBeforeUpdate) {
        await this.createBackup(currentVersion);
      }

      // Perform update
      console.log(`\n📥 Updating VERSATIL from v${currentVersion} to v${versionToInstall}...\n`);

      const success = await this.performUpdate(versionToInstall);

      // Record update history
      await this.recordUpdate(currentVersion, versionToInstall, success);

      if (success) {
        console.log(`\n✅ Successfully updated to v${versionToInstall}!\n`);
        console.log('Run: versatil doctor --verify\n');
      }

      return success;

    } catch (error) {
      console.error(`\n❌ Update failed: ${(error as Error).message}\n`);
      await this.recordUpdate(currentVersion, targetVersion || 'unknown', false, (error as Error).message);
      return false;
    }
  }

  /**
   * Create backup before update
   */
  private async createBackup(version: string): Promise<string> {
    console.log('📦 Creating backup...');

    const backupDir = path.join(this.versatilHome, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupName = `versatil-v${version}-${timestamp}`;
    const backupPath = path.join(backupDir, `${backupName}.tar.gz`);

    try {
      // Backup ~/.versatil/ directory
      await execAsync(`tar -czf "${backupPath}" -C "${os.homedir()}" .versatil`);

      console.log(`✅ Backup created: ${backupPath}\n`);
      return backupPath;

    } catch (error) {
      console.warn(`⚠️  Backup failed: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * Perform npm update
   */
  private async performUpdate(version: string): Promise<boolean> {
    try {
      // Update via npm
      const updateCommand = `npm update -g versatil-sdlc-framework@${version}`;

      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        console.error('Update warnings:', stderr);
      }

      // Verify new version installed
      const { stdout: versionCheck } = await execAsync('versatil --version');
      const installedVersion = versionCheck.trim().replace(/^v/, '');

      if (installedVersion === version || compareVersions(installedVersion, version) === 0) {
        return true;
      }

      throw new Error(`Version mismatch after update: expected ${version}, got ${installedVersion}`);

    } catch (error) {
      throw new Error(`npm update failed: ${(error as Error).message}`);
    }
  }

  /**
   * Rollback to previous version (from backup)
   */
  async rollback(backupFile?: string): Promise<boolean> {
    try {
      console.log('\n🔄 Rolling back to previous version...\n');

      let backupToRestore = backupFile;

      if (!backupToRestore) {
        // Find most recent backup
        const backupDir = path.join(this.versatilHome, 'backups');
        const backups = await fs.readdir(backupDir);

        if (backups.length === 0) {
          throw new Error('No backups found');
        }

        // Sort by name (includes timestamp)
        backups.sort().reverse();
        backupToRestore = path.join(backupDir, backups[0]);
      }

      console.log(`Restoring from: ${backupToRestore}`);

      // Extract backup
      await execAsync(`tar -xzf "${backupToRestore}" -C "${os.homedir()}"`);

      console.log('✅ Rollback complete\n');
      return true;

    } catch (error) {
      console.error(`❌ Rollback failed: ${(error as Error).message}\n`);
      return false;
    }
  }

  /**
   * Record update in history
   */
  private async recordUpdate(fromVersion: string, toVersion: string, success: boolean, error?: string): Promise<void> {
    try {
      await fs.mkdir(this.versatilHome, { recursive: true });

      let history: UpdateHistory[] = [];

      try {
        const existing = await fs.readFile(this.updateHistoryFile, 'utf-8');
        history = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      history.push({
        timestamp: new Date().toISOString(),
        fromVersion,
        toVersion,
        success,
        error
      });

      // Keep last 50 updates
      if (history.length > 50) {
        history = history.slice(-50);
      }

      await fs.writeFile(this.updateHistoryFile, JSON.stringify(history, null, 2));

    } catch (error) {
      // Don't fail update if history recording fails
      console.warn('Failed to record update history:', error);
    }
  }

  /**
   * Get update history
   */
  async getUpdateHistory(): Promise<UpdateHistory[]> {
    try {
      const data = await fs.readFile(this.updateHistoryFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Get latest changelog
   */
  async getChangelog(version?: string): Promise<string> {
    try {
      if (version) {
        const release = await this.releaseChecker.getReleaseByTag(`v${version}`);
        return release.changelog;
      }

      const latest = await this.releaseChecker.getLatestRelease(this.config.includePrerelease);
      return latest.changelog;

    } catch (error) {
      return 'Changelog not available';
    }
  }

  /**
   * Perform post-update review (v7.7.0+)
   * Runs comprehensive health check, agent reviews, and todo analysis
   */
  async performPostUpdateReview(
    fromVersion: string,
    toVersion: string,
    options: {
      skipReview?: boolean;
      fullReview?: boolean;
      agents?: string[];
    } = {}
  ): Promise<any> {
    try {
      // Dynamic import to avoid circular dependencies
      const { PostUpdateReviewer } = await import('./post-update-reviewer.js');
      const reviewer = new PostUpdateReviewer();

      console.log('\n🔄 Running Post-Update Review...\n');

      const report = await reviewer.performReview(fromVersion, toVersion, options);

      // Display formatted report
      console.log(reviewer.formatReport(report));

      return report;

    } catch (error) {
      console.error('⚠️  Post-update review failed:', (error as Error).message);
      console.log('You can run the review manually later with: /update --review-only\n');
      return null;
    }
  }

  /**
   * Assess project status (readiness check)
   */
  async assessProjectStatus(): Promise<any> {
    try {
      const { PostUpdateReviewer } = await import('./post-update-reviewer.js');
      const reviewer = new PostUpdateReviewer();

      // Run assessment components
      const assessment = await (reviewer as any).runProjectAssessment();

      return assessment;

    } catch (error) {
      console.error('Assessment failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * Scan open todos
   */
  async scanOpenTodos(): Promise<any> {
    try {
      const { TodoScanner } = await import('./todo-scanner.js');
      const scanner = new TodoScanner();

      const summary = await scanner.scanTodos(false); // Exclude resolved

      console.log(scanner.formatSummary(summary));

      const recommendations = scanner.formatRecommendations(summary);
      if (recommendations.length > 0) {
        console.log('\n## 🎯 Recommendations\n');
        recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
        console.log('');
      }

      return summary;

    } catch (error) {
      console.error('Todo scan failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      const backupDir = path.join(this.versatilHome, 'backups');
      const backups = await fs.readdir(backupDir);
      return backups.filter(f => f.endsWith('.tar.gz')).sort().reverse();
    } catch {
      return [];
    }
  }
}

/**
 * Default update manager instance
 */
export const defaultUpdateManager = new UpdateManager();
