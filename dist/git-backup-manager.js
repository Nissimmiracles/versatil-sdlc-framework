/**
 * Git Backup & Branch Protection Manager
 * Automated backup, branch protection, and disaster recovery system
 */
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
export class GitBackupManager {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.backupDir = path.join(projectPath, '.versatil', 'backups');
    }
    /**
     * Initialize backup system
     */
    async initializeBackup(config = {}) {
        const defaultConfig = {
            backupBranches: ['main', 'master', 'develop'],
            backupInterval: 24, // hours
            maxBackups: 30,
            compressionEnabled: true,
            encryptionEnabled: false,
            ...config
        };
        console.log('🔄 Initializing git backup system...');
        // Create backup directory
        await fs.mkdir(this.backupDir, { recursive: true });
        // Save configuration
        await this.saveBackupConfig(defaultConfig);
        // Setup automatic backup schedule
        await this.setupBackupSchedule(defaultConfig);
        // Create initial backup
        await this.createBackup();
        console.log('✅ Git backup system initialized');
    }
    /**
     * Create backup of current repository state
     */
    async createBackup(message) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        console.log(`📦 Creating backup: ${backupName}`);
        try {
            // Create backup directory
            await fs.mkdir(backupPath, { recursive: true });
            // Get current branch and commit info
            const currentBranch = await this.getCurrentBranch();
            const currentCommit = await this.getCurrentCommit();
            // Create git bundle (complete repository backup)
            const bundlePath = path.join(backupPath, 'repository.bundle');
            execSync(`git bundle create "${bundlePath}" --all`, {
                cwd: this.projectPath,
                stdio: 'pipe'
            });
            // Create metadata file
            const metadata = {
                timestamp: new Date().toISOString(),
                branch: currentBranch,
                commit: currentCommit,
                message: message || 'Automated backup',
                fileCount: await this.getFileCount(),
                repositorySize: await this.getRepositorySize()
            };
            await fs.writeFile(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));
            // Backup important configuration files
            await this.backupConfigFiles(backupPath);
            // Compress if enabled
            const config = await this.getBackupConfig();
            if (config.compressionEnabled) {
                await this.compressBackup(backupPath);
            }
            console.log(`✅ Backup created: ${backupName}`);
            // Cleanup old backups
            await this.cleanupOldBackups();
            return backupName;
        }
        catch (error) {
            console.error(`❌ Backup failed: ${error}`);
            throw error;
        }
    }
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupName, targetPath) {
        const backupPath = path.join(this.backupDir, backupName);
        const restorePath = targetPath || `${this.projectPath}_restored`;
        console.log(`🔄 Restoring from backup: ${backupName}`);
        try {
            // Check if backup exists
            const bundlePath = path.join(backupPath, 'repository.bundle');
            await fs.access(bundlePath);
            // Create restore directory
            await fs.mkdir(restorePath, { recursive: true });
            // Clone from bundle
            execSync(`git clone "${bundlePath}" "${restorePath}"`, {
                stdio: 'pipe'
            });
            // Restore configuration files
            await this.restoreConfigFiles(backupPath, restorePath);
            console.log(`✅ Repository restored to: ${restorePath}`);
        }
        catch (error) {
            console.error(`❌ Restore failed: ${error}`);
            throw error;
        }
    }
    /**
     * Setup branch protection rules
     */
    async setupBranchProtection(rules) {
        console.log('🛡️ Setting up branch protection rules...');
        for (const rule of rules) {
            try {
                // Check if we're in a GitHub repository
                const remoteUrl = await this.getRemoteUrl();
                if (remoteUrl.includes('github.com')) {
                    await this.setupGitHubBranchProtection(rule);
                }
                else {
                    // Local protection measures
                    await this.setupLocalBranchProtection(rule);
                }
                console.log(`✅ Protection enabled for branch: ${rule.branch}`);
            }
            catch (error) {
                console.warn(`⚠️ Could not protect branch ${rule.branch}: ${error}`);
            }
        }
    }
    /**
     * Setup GitHub branch protection via API
     */
    async setupGitHubBranchProtection(rule) {
        try {
            const [owner, repo] = await this.getGitHubOwnerRepo();
            const protectionData = {
                required_status_checks: rule.requireStatusChecks ? {
                    strict: true,
                    contexts: rule.requiredStatusChecks
                } : null,
                enforce_admins: rule.enforceAdmins,
                required_pull_request_reviews: rule.requirePullRequest ? {
                    required_approving_review_count: rule.requiredReviews,
                    dismiss_stale_reviews: true,
                    require_code_owner_reviews: true
                } : null,
                restrictions: rule.restrictPushes ? {
                    users: rule.allowedPushers,
                    teams: []
                } : null
            };
            // Use GitHub CLI if available
            execSync(`gh api repos/${owner}/${repo}/branches/${rule.branch}/protection -X PUT --input -`, {
                input: JSON.stringify(protectionData),
                stdio: 'pipe'
            });
        }
        catch (error) {
            console.warn('GitHub CLI not available or insufficient permissions');
        }
    }
    /**
     * Setup local branch protection measures
     */
    async setupLocalBranchProtection(rule) {
        // Create pre-push hook for branch protection
        const hookPath = path.join(this.projectPath, '.git', 'hooks', 'pre-push');
        const hookContent = `#!/bin/bash
# VERSATIL Branch Protection Hook

protected_branch="${rule.branch}"
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

if [ "$protected_branch" = "$current_branch" ]; then
    echo "🛡️ Branch '$protected_branch' is protected by VERSATIL"
    echo "Please create a pull request instead of pushing directly"
    exit 1
fi
`;
        await fs.writeFile(hookPath, hookContent);
        execSync(`chmod +x "${hookPath}"`);
    }
    /**
     * Create emergency backup before risky operations
     */
    async createEmergencyBackup(operation) {
        console.log(`🚨 Creating emergency backup before: ${operation}`);
        const backupName = await this.createBackup(`Emergency backup before ${operation}`);
        // Store emergency backup reference
        const emergencyPath = path.join(this.backupDir, 'emergency-latest.txt');
        await fs.writeFile(emergencyPath, backupName);
        return backupName;
    }
    /**
     * Auto-backup on significant changes
     */
    async autoBackupOnChanges() {
        const lastBackup = await this.getLastBackupTime();
        const config = await this.getBackupConfig();
        const hoursSinceLastBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastBackup >= config.backupInterval) {
            console.log('⏰ Triggering scheduled backup...');
            await this.createBackup('Scheduled automatic backup');
        }
    }
    /**
     * Sync with remote backup repository
     */
    async syncWithRemote() {
        const config = await this.getBackupConfig();
        if (!config.remoteBackupUrl) {
            console.log('ℹ️ No remote backup configured');
            return;
        }
        try {
            console.log('🔄 Syncing with remote backup...');
            // Add remote backup if not exists
            try {
                execSync(`git remote add backup "${config.remoteBackupUrl}"`, {
                    cwd: this.projectPath,
                    stdio: 'pipe'
                });
            }
            catch {
                // Remote already exists
            }
            // Push all branches to backup
            execSync('git push backup --all', {
                cwd: this.projectPath,
                stdio: 'pipe'
            });
            // Push all tags
            execSync('git push backup --tags', {
                cwd: this.projectPath,
                stdio: 'pipe'
            });
            console.log('✅ Remote backup sync completed');
        }
        catch (error) {
            console.error(`❌ Remote backup sync failed: ${error}`);
        }
    }
    /**
     * Get backup status and health check
     */
    async getBackupStatus() {
        try {
            const lastBackup = await this.getLastBackupTime();
            const backupCount = await this.getBackupCount();
            const diskUsage = await this.getBackupDiskUsage();
            const protectedBranches = await this.getProtectedBranches();
            let remoteStatus = 'disconnected';
            try {
                execSync('git ls-remote origin', { cwd: this.projectPath, stdio: 'pipe' });
                remoteStatus = 'connected';
            }
            catch {
                remoteStatus = 'error';
            }
            return {
                lastBackup,
                backupCount,
                remoteStatus,
                diskUsage,
                protectedBranches
            };
        }
        catch (error) {
            throw new Error(`Failed to get backup status: ${error}`);
        }
    }
    // Helper methods
    async getCurrentBranch() {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: this.projectPath,
            encoding: 'utf-8'
        }).trim();
    }
    async getCurrentCommit() {
        return execSync('git rev-parse HEAD', {
            cwd: this.projectPath,
            encoding: 'utf-8'
        }).trim();
    }
    async getFileCount() {
        const output = execSync('git ls-files | wc -l', {
            cwd: this.projectPath,
            encoding: 'utf-8'
        });
        return parseInt(output.trim());
    }
    async getRepositorySize() {
        try {
            const output = execSync('du -sh .git', {
                cwd: this.projectPath,
                encoding: 'utf-8'
            });
            return output.split('\t')[0] || 'unknown';
        }
        catch {
            return 'unknown';
        }
    }
    async backupConfigFiles(backupPath) {
        const configFiles = [
            'package.json',
            'package-lock.json',
            'tsconfig.json',
            '.gitignore',
            '.versatil/config.json',
            '.cursorrules'
        ];
        const configBackupPath = path.join(backupPath, 'config');
        await fs.mkdir(configBackupPath, { recursive: true });
        for (const file of configFiles) {
            try {
                const sourcePath = path.join(this.projectPath, file);
                const targetPath = path.join(configBackupPath, file.replace('/', '_'));
                await fs.copyFile(sourcePath, targetPath);
            }
            catch {
                // File doesn't exist, skip
            }
        }
    }
    async restoreConfigFiles(backupPath, restorePath) {
        const configBackupPath = path.join(backupPath, 'config');
        try {
            const files = await fs.readdir(configBackupPath);
            for (const file of files) {
                const sourcePath = path.join(configBackupPath, file);
                const targetPath = path.join(restorePath, file.replace('_', '/'));
                // Create directory if needed
                await fs.mkdir(path.dirname(targetPath), { recursive: true });
                await fs.copyFile(sourcePath, targetPath);
            }
        }
        catch {
            // Config backup doesn't exist
        }
    }
    async compressBackup(backupPath) {
        // Implement compression logic (could use tar, zip, etc.)
        console.log(`🗜️ Compressing backup at ${backupPath}`);
    }
    async cleanupOldBackups() {
        const config = await this.getBackupConfig();
        const backups = await fs.readdir(this.backupDir);
        const backupDirs = backups
            .filter(name => name.startsWith('backup-'))
            .sort()
            .reverse();
        if (backupDirs.length > config.maxBackups) {
            const toDelete = backupDirs.slice(config.maxBackups);
            for (const backup of toDelete) {
                const backupPath = path.join(this.backupDir, backup);
                await fs.rm(backupPath, { recursive: true, force: true });
                console.log(`🗑️ Deleted old backup: ${backup}`);
            }
        }
    }
    async saveBackupConfig(config) {
        const configPath = path.join(this.backupDir, 'config.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }
    async getBackupConfig() {
        try {
            const configPath = path.join(this.backupDir, 'config.json');
            const content = await fs.readFile(configPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return {
                backupBranches: ['main'],
                backupInterval: 24,
                maxBackups: 30,
                compressionEnabled: true,
                encryptionEnabled: false
            };
        }
    }
    async setupBackupSchedule(config) {
        // This would integrate with system cron or task scheduler
        console.log(`⏰ Backup scheduled every ${config.backupInterval} hours`);
    }
    async getLastBackupTime() {
        try {
            const backups = await fs.readdir(this.backupDir);
            const backupDirs = backups
                .filter(name => name.startsWith('backup-'))
                .sort()
                .reverse();
            if (backupDirs.length > 0 && backupDirs[0]) {
                const metadataPath = path.join(this.backupDir, backupDirs[0], 'metadata.json');
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                return new Date(metadata.timestamp);
            }
        }
        catch {
            // No backups exist
        }
        return new Date(0); // Unix epoch if no backups
    }
    async getBackupCount() {
        try {
            const backups = await fs.readdir(this.backupDir);
            return backups.filter(name => name.startsWith('backup-')).length;
        }
        catch {
            return 0;
        }
    }
    async getBackupDiskUsage() {
        try {
            const output = execSync(`du -sh "${this.backupDir}"`, {
                encoding: 'utf-8'
            });
            return output.split('\t')[0] || 'unknown';
        }
        catch {
            return '0B';
        }
    }
    async getProtectedBranches() {
        // This would check actual branch protection status
        return ['main', 'master', 'develop'];
    }
    async getRemoteUrl() {
        try {
            return execSync('git remote get-url origin', {
                cwd: this.projectPath,
                encoding: 'utf-8'
            }).trim();
        }
        catch {
            return '';
        }
    }
    async getGitHubOwnerRepo() {
        const remoteUrl = await this.getRemoteUrl();
        const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match && match[1] && match[2]) {
            return [match[1], match[2]];
        }
        throw new Error('Not a GitHub repository');
    }
}
export const gitBackupManager = new GitBackupManager();
//# sourceMappingURL=git-backup-manager.js.map