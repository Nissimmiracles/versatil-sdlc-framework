/**
 * VERSATIL Framework - Duplicate Repository Detector
 *
 * Prevents confusion from multiple clones of same repository.
 * Detects duplicates by:
 * - Git remote URL fingerprinting
 * - File signature comparison
 * - Canonical path normalization
 *
 * @module DuplicateRepositoryDetector
 * @version 1.0.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { VERSATILLogger } from '../utils/logger.js';
export class DuplicateRepositoryDetector {
    constructor(registryPath = path.join(process.env.HOME || '~', '.versatil', 'repository-registry.json')) {
        this.logger = new VERSATILLogger('DuplicateDetector');
        this.REGISTRY_PATH = registryPath;
        this.knownRepositories = new Map();
        this.loadRegistry();
    }
    /**
     * Create fingerprint for a repository
     */
    async createFingerprint(repoPath) {
        const canonicalPath = this.getCanonicalPath(repoPath);
        const gitRemote = this.getGitRemote(repoPath);
        const lastCommitHash = this.getLastCommitHash(repoPath);
        const branchName = this.getBranchName(repoPath);
        const signature = this.generateSignature(repoPath, gitRemote, lastCommitHash);
        const repoName = path.basename(repoPath);
        const stats = fs.statSync(repoPath);
        return {
            path: repoPath,
            canonicalPath,
            gitRemote,
            signature,
            lastCommitHash,
            branchName,
            repoName,
            createdAt: stats.birthtimeMs,
            lastAccessedAt: Date.now()
        };
    }
    /**
     * Check if repository is a duplicate
     */
    async checkForDuplicates(repoPath) {
        const fingerprint = await this.createFingerprint(repoPath);
        const duplicates = [];
        let primaryRepo = null;
        // Check against known repositories
        for (const [key, knownRepo] of this.knownRepositories.entries()) {
            if (this.areDuplicates(fingerprint, knownRepo)) {
                duplicates.push(knownRepo);
                // Primary repo is the oldest one
                if (!primaryRepo || knownRepo.createdAt < primaryRepo.createdAt) {
                    primaryRepo = knownRepo;
                }
            }
        }
        const isDuplicate = duplicates.length > 0;
        let recommendation = '';
        if (isDuplicate && primaryRepo) {
            recommendation = `This repository is a duplicate of "${primaryRepo.path}". ` +
                `Consider consolidating work to the primary repository to avoid confusion. ` +
                `Primary: ${primaryRepo.path} (created ${new Date(primaryRepo.createdAt).toLocaleString()})`;
        }
        else {
            recommendation = 'No duplicates detected. This repository is unique.';
        }
        return {
            isDuplicate,
            duplicates,
            recommendation,
            primaryRepo
        };
    }
    /**
     * Register a repository
     */
    async registerRepository(repoPath) {
        const fingerprint = await this.createFingerprint(repoPath);
        // Check for duplicates before registering
        const report = await this.checkForDuplicates(repoPath);
        if (report.isDuplicate) {
            this.logger.warn('Registering duplicate repository', {
                path: repoPath,
                primary: report.primaryRepo?.path,
                duplicateCount: report.duplicates.length
            });
        }
        // Update registry
        this.knownRepositories.set(fingerprint.signature, fingerprint);
        await this.saveRegistry();
        this.logger.info('Repository registered', {
            path: repoPath,
            signature: fingerprint.signature,
            isDuplicate: report.isDuplicate
        });
    }
    /**
     * Remove repository from registry
     */
    async unregisterRepository(repoPath) {
        const fingerprint = await this.createFingerprint(repoPath);
        this.knownRepositories.delete(fingerprint.signature);
        await this.saveRegistry();
        this.logger.info('Repository unregistered', { path: repoPath });
    }
    /**
     * Get all registered repositories
     */
    getRegisteredRepositories() {
        return Array.from(this.knownRepositories.values());
    }
    /**
     * Get canonical path (normalized, no spaces vs dashes ambiguity)
     */
    getCanonicalPath(repoPath) {
        try {
            const resolved = path.resolve(repoPath);
            // Normalize by replacing spaces with dashes for comparison
            const normalized = resolved.replace(/\s+/g, '-').toLowerCase();
            return normalized;
        }
        catch (error) {
            this.logger.error('Failed to get canonical path', { repoPath, error });
            return repoPath;
        }
    }
    /**
     * Get git remote URL
     */
    getGitRemote(repoPath) {
        try {
            const remote = execSync('git remote get-url origin', {
                cwd: repoPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            // Normalize GitHub URLs (https vs ssh)
            return this.normalizeGitUrl(remote);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Normalize git URL for comparison
     */
    normalizeGitUrl(url) {
        // Convert SSH to HTTPS format
        let normalized = url
            .replace('git@github.com:', 'https://github.com/')
            .replace(/\.git$/, '')
            .toLowerCase();
        return normalized;
    }
    /**
     * Get last commit hash
     */
    getLastCommitHash(repoPath) {
        try {
            return execSync('git rev-parse HEAD', {
                cwd: repoPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get current branch name
     */
    getBranchName(repoPath) {
        try {
            return execSync('git branch --show-current', {
                cwd: repoPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate unique signature for repository
     */
    generateSignature(repoPath, gitRemote, commitHash) {
        const data = [
            this.getCanonicalPath(repoPath),
            gitRemote || 'no-remote',
            commitHash || 'no-commits'
        ].join('|');
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
    }
    /**
     * Check if two repositories are duplicates
     */
    areDuplicates(repo1, repo2) {
        // Don't compare repo with itself
        if (repo1.path === repo2.path) {
            return false;
        }
        // Same git remote = duplicate
        if (repo1.gitRemote && repo2.gitRemote && repo1.gitRemote === repo2.gitRemote) {
            this.logger.debug('Duplicate detected by git remote', {
                repo1: repo1.path,
                repo2: repo2.path,
                remote: repo1.gitRemote
            });
            return true;
        }
        // Same canonical path (ignoring spaces/dashes) = duplicate
        if (repo1.canonicalPath === repo2.canonicalPath) {
            this.logger.debug('Duplicate detected by canonical path', {
                repo1: repo1.path,
                repo2: repo2.path,
                canonical: repo1.canonicalPath
            });
            return true;
        }
        // Same last commit hash + similar name = likely duplicate
        if (repo1.lastCommitHash && repo2.lastCommitHash &&
            repo1.lastCommitHash === repo2.lastCommitHash &&
            this.similarNames(repo1.repoName, repo2.repoName)) {
            this.logger.debug('Duplicate detected by commit hash + name', {
                repo1: repo1.path,
                repo2: repo2.path,
                commitHash: repo1.lastCommitHash
            });
            return true;
        }
        return false;
    }
    /**
     * Check if two repository names are similar (ignoring spaces, dashes, case)
     */
    similarNames(name1, name2) {
        const normalize = (name) => name.toLowerCase().replace(/[\s-_]/g, '');
        return normalize(name1) === normalize(name2);
    }
    /**
     * Load registry from disk
     */
    loadRegistry() {
        try {
            if (fs.existsSync(this.REGISTRY_PATH)) {
                const data = fs.readFileSync(this.REGISTRY_PATH, 'utf-8');
                const parsed = JSON.parse(data);
                this.knownRepositories = new Map(Object.entries(parsed).map(([key, value]) => [key, value]));
                this.logger.info('Repository registry loaded', {
                    count: this.knownRepositories.size,
                    path: this.REGISTRY_PATH
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to load repository registry', { error });
        }
    }
    /**
     * Save registry to disk
     */
    async saveRegistry() {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.REGISTRY_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = Object.fromEntries(this.knownRepositories);
            fs.writeFileSync(this.REGISTRY_PATH, JSON.stringify(data, null, 2));
            this.logger.debug('Repository registry saved', {
                count: this.knownRepositories.size,
                path: this.REGISTRY_PATH
            });
        }
        catch (error) {
            this.logger.error('Failed to save repository registry', { error });
        }
    }
    /**
     * Clean up stale entries (repos that no longer exist)
     */
    async cleanupStaleEntries() {
        let removed = 0;
        for (const [signature, repo] of this.knownRepositories.entries()) {
            if (!fs.existsSync(repo.path)) {
                this.knownRepositories.delete(signature);
                removed++;
                this.logger.debug('Removed stale repository entry', { path: repo.path });
            }
        }
        if (removed > 0) {
            await this.saveRegistry();
            this.logger.info('Cleaned up stale repository entries', { removed });
        }
        return removed;
    }
    /**
     * Generate duplicate report for all repositories
     */
    async generateDuplicateReport() {
        const report = [];
        report.push('='.repeat(70));
        report.push('🔍 VERSATIL Duplicate Repository Report');
        report.push('='.repeat(70));
        report.push('');
        const repos = this.getRegisteredRepositories();
        report.push(`Total Registered Repositories: ${repos.length}`);
        report.push('');
        // Group duplicates
        const duplicateGroups = new Map();
        for (const repo of repos) {
            const check = await this.checkForDuplicates(repo.path);
            if (check.isDuplicate && check.primaryRepo) {
                const key = check.primaryRepo.gitRemote || check.primaryRepo.canonicalPath;
                if (!duplicateGroups.has(key)) {
                    duplicateGroups.set(key, [check.primaryRepo]);
                }
                if (!duplicateGroups.get(key).find(r => r.path === repo.path)) {
                    duplicateGroups.get(key).push(repo);
                }
            }
        }
        if (duplicateGroups.size === 0) {
            report.push('✅ No duplicate repositories detected');
        }
        else {
            report.push(`⚠️  ${duplicateGroups.size} Duplicate Group(s) Found:`);
            report.push('');
            let groupNum = 1;
            for (const [key, group] of duplicateGroups.entries()) {
                report.push(`Group ${groupNum}:`);
                report.push(`  Primary: ${group[0].path}`);
                report.push(`  Remote: ${group[0].gitRemote || 'N/A'}`);
                report.push(`  Duplicates:`);
                for (let i = 1; i < group.length; i++) {
                    report.push(`    - ${group[i].path}`);
                    report.push(`      Created: ${new Date(group[i].createdAt).toLocaleString()}`);
                }
                report.push('');
                groupNum++;
            }
        }
        report.push('='.repeat(70));
        return report.join('\n');
    }
}
// Singleton instance
let detectorInstance = null;
export function getDuplicateDetector() {
    if (!detectorInstance) {
        detectorInstance = new DuplicateRepositoryDetector();
    }
    return detectorInstance;
}
export function destroyDuplicateDetector() {
    detectorInstance = null;
}
//# sourceMappingURL=duplicate-repository-detector.js.map