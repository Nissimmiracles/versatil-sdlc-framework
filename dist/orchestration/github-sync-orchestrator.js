/**
 * VERSATIL SDLC Framework - GitHub Sync Orchestrator
 * Handles full GitHub integration with context-aware PRs and synchronization
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import * as path from 'path';
export class GitHubSyncOrchestrator extends EventEmitter {
    constructor(paths) {
        super();
        // Track synchronization state
        this.syncState = {
            lastSync: null,
            pendingChanges: [],
            activePRs: new Map(),
            activeIssues: new Map()
        };
        this.logger = new VERSATILLogger('GitHubSync');
        this.paths = paths;
        // Default configuration
        this.config = {
            owner: '',
            repo: '',
            defaultBranch: 'main',
            autoSync: false
        };
    }
    async initialize() {
        // Load GitHub configuration
        await this.loadGitHubConfig();
        // Initialize git repository state
        await this.initializeRepoState();
        // Set up auto-sync if enabled
        if (this.config.autoSync) {
            this.startAutoSync();
        }
        this.logger.info('GitHub sync orchestrator initialized', {
            owner: this.config.owner,
            repo: this.config.repo,
            autoSync: this.config.autoSync
        });
    }
    /**
     * Load GitHub configuration from project
     */
    async loadGitHubConfig() {
        const { exec } = require('child_process').promises;
        try {
            // Get remote origin URL
            const remoteUrl = await exec('git remote get-url origin', {
                cwd: this.paths.project.root
            });
            // Parse GitHub owner and repo from URL
            const match = remoteUrl.stdout.trim().match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
            if (match) {
                this.config.owner = match[1];
                this.config.repo = match[2];
            }
            // Get default branch
            const defaultBranch = await exec('git symbolic-ref refs/remotes/origin/HEAD', {
                cwd: this.paths.project.root
            }).catch(() => ({ stdout: 'refs/remotes/origin/main' }));
            this.config.defaultBranch = defaultBranch.stdout.trim().split('/').pop() || 'main';
            // Load token from environment
            this.config.token = process.env.GITHUB_TOKEN;
        }
        catch (error) {
            this.logger.warn('Failed to load GitHub configuration', { error });
        }
    }
    /**
     * Initialize repository state
     */
    async initializeRepoState() {
        const { exec } = require('child_process').promises;
        try {
            // Ensure we're on a branch
            await exec('git rev-parse --abbrev-ref HEAD', {
                cwd: this.paths.project.root
            });
            // Fetch latest from origin
            await exec('git fetch origin', {
                cwd: this.paths.project.root
            });
            // Get current status
            const status = await exec('git status --porcelain', {
                cwd: this.paths.project.root
            });
            this.syncState.pendingChanges = status.stdout
                .trim()
                .split('\n')
                .filter(Boolean)
                .map((line) => line.substring(3));
        }
        catch (error) {
            this.logger.warn('Failed to initialize repo state', { error });
        }
    }
    /**
     * Create a context-aware pull request
     */
    async createContextualPR(options) {
        const { exec } = require('child_process').promises;
        // Create branch if not specified
        const branchName = options.branch || this.generateBranchName(options.title);
        try {
            // Create and checkout new branch
            await exec(`git checkout -b ${branchName}`, {
                cwd: this.paths.project.root
            });
            // Stage specified files or all changes
            if (options.files && options.files.length > 0) {
                for (const file of options.files) {
                    await exec(`git add ${file}`, {
                        cwd: this.paths.project.root
                    });
                }
            }
            else {
                await exec('git add -A', {
                    cwd: this.paths.project.root
                });
            }
            // Create context-aware commit message
            const commitMessage = this.generateCommitMessage(options);
            await exec(`git commit -m "${commitMessage}"`, {
                cwd: this.paths.project.root
            });
            // Push branch
            await exec(`git push -u origin ${branchName}`, {
                cwd: this.paths.project.root
            });
            // Create PR body with full context
            const prBody = this.generatePRBody(options);
            // Create PR via GitHub API (would use Octokit in production)
            const pr = {
                id: Date.now(), // Temporary ID
                title: options.title,
                body: prBody,
                branch: branchName,
                baseBranch: this.config.defaultBranch,
                labels: options.labels || this.inferLabels(options),
                reviewers: options.reviewers || this.selectReviewers(options),
                files: options.files || this.syncState.pendingChanges,
                context: options.context
            };
            // Store PR reference
            this.syncState.activePRs.set(branchName, pr);
            // Emit PR created event
            this.emit('pr:created', pr);
            this.logger.info('Created context-aware PR', {
                branch: branchName,
                title: options.title
            });
            return pr;
        }
        catch (error) {
            // Rollback on error
            await exec(`git checkout ${this.config.defaultBranch}`, {
                cwd: this.paths.project.root
            }).catch(() => { });
            throw error;
        }
    }
    /**
     * Generate branch name from title
     */
    generateBranchName(title) {
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 50);
        const timestamp = Date.now().toString(36).substring(-4);
        return `versatil/${base}-${timestamp}`;
    }
    /**
     * Generate context-aware commit message
     */
    generateCommitMessage(options) {
        const type = this.inferCommitType(options);
        const scope = this.inferScope(options);
        let message = `${type}`;
        if (scope)
            message += `(${scope})`;
        message += `: ${options.title}`;
        // Add context information
        if (options.context?.plan) {
            message += `\n\nPlan ID: ${options.context.plan.id}`;
        }
        if (options.context?.agents) {
            message += `\n\nAgents involved: ${options.context.agents.join(', ')}`;
        }
        return message;
    }
    /**
     * Generate comprehensive PR body
     */
    generatePRBody(options) {
        let body = `## ${options.description}\n\n`;
        // Add context section
        body += `### Context\n\n`;
        if (options.context?.goal) {
            body += `**Goal:** ${options.context.goal}\n\n`;
        }
        if (options.context?.plan) {
            body += `**Plan:** ${options.context.plan.metadata?.id || 'N/A'}\n`;
            body += `**Estimated Time:** ${options.context.plan.metadata?.estimatedTime || 'N/A'}ms\n`;
            body += `**Risk Level:** ${options.context.plan.metadata?.risk || 'N/A'}\n\n`;
        }
        // Add changes section
        body += `### Changes\n\n`;
        if (options.files && options.files.length > 0) {
            body += `Modified files:\n`;
            options.files.forEach((file) => {
                body += `- ${file}\n`;
            });
            body += '\n';
        }
        // Add testing section
        body += `### Testing\n\n`;
        if (options.context?.tests) {
            body += `- [ ] Unit tests added/updated\n`;
            body += `- [ ] E2E tests added/updated\n`;
            body += `- [ ] Visual regression tests passed\n`;
        }
        else {
            body += `- [ ] Tests to be added\n`;
        }
        // Add checklist
        body += `\n### Checklist\n\n`;
        body += `- [ ] Code follows project conventions\n`;
        body += `- [ ] Self-review completed\n`;
        body += `- [ ] Documentation updated\n`;
        body += `- [ ] No breaking changes\n`;
        // Add VERSATIL metadata
        body += `\n### VERSATIL Metadata\n\n`;
        body += `\`\`\`json\n${JSON.stringify({
            framework: 'VERSATIL',
            version: '1.3.0',
            agents: options.context?.agents || [],
            timestamp: Date.now()
        }, null, 2)}\n\`\`\`\n`;
        // Add PR template if configured
        if (this.config.prTemplate) {
            body += `\n${this.config.prTemplate}\n`;
        }
        return body;
    }
    /**
     * Infer commit type from context
     */
    inferCommitType(options) {
        const title = options.title.toLowerCase();
        if (title.includes('fix'))
            return 'fix';
        if (title.includes('feat') || title.includes('add'))
            return 'feat';
        if (title.includes('docs'))
            return 'docs';
        if (title.includes('style'))
            return 'style';
        if (title.includes('refactor'))
            return 'refactor';
        if (title.includes('test'))
            return 'test';
        if (title.includes('chore'))
            return 'chore';
        return 'feat';
    }
    /**
     * Infer scope from files
     */
    inferScope(options) {
        if (!options.files || options.files.length === 0)
            return '';
        // Find common directory
        const dirs = options.files.map((f) => path.dirname(f));
        const commonDir = this.findCommonDirectory(dirs);
        if (commonDir && commonDir !== '.') {
            return commonDir.split('/').pop() || '';
        }
        return '';
    }
    /**
     * Infer labels from context
     */
    inferLabels(options) {
        const labels = [];
        // Add type labels
        const type = this.inferCommitType(options);
        labels.push(type);
        // Add risk labels
        if (options.context?.plan?.metadata?.risk) {
            labels.push(`risk:${options.context.plan.metadata.risk}`);
        }
        // Add stack labels
        if (options.context?.stack) {
            Object.keys(options.context.stack).forEach((tech) => {
                labels.push(`stack:${tech}`);
            });
        }
        // Add agent labels
        if (options.context?.agents) {
            labels.push('versatil:automated');
        }
        return labels;
    }
    /**
     * Select reviewers based on context
     */
    selectReviewers(options) {
        // In production, would use CODEOWNERS or team assignments
        const reviewers = [];
        // Add reviewers based on files
        if (options.files) {
            // Would check CODEOWNERS file
        }
        return reviewers;
    }
    /**
     * Find common directory from paths
     */
    findCommonDirectory(paths) {
        if (paths.length === 0)
            return '';
        if (paths.length === 1)
            return path.dirname(paths[0]);
        const parts = paths[0].split('/');
        let common = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (paths.every(p => p.split('/')[i] === part)) {
                common = common ? `${common}/${part}` : part;
            }
            else {
                break;
            }
        }
        return common;
    }
    /**
     * Sync local changes with GitHub
     */
    async syncWithGitHub() {
        const { exec } = require('child_process').promises;
        try {
            // Fetch latest
            await exec('git fetch origin', {
                cwd: this.paths.project.root
            });
            // Get current branch
            const branch = await exec('git rev-parse --abbrev-ref HEAD', {
                cwd: this.paths.project.root
            });
            const currentBranch = branch.stdout.trim();
            // Pull latest changes
            await exec(`git pull origin ${currentBranch}`, {
                cwd: this.paths.project.root
            });
            // Update sync state
            this.syncState.lastSync = new Date();
            this.logger.info('Synced with GitHub', { branch: currentBranch });
        }
        catch (error) {
            this.logger.error('Failed to sync with GitHub', { error });
            throw error;
        }
    }
    /**
     * Start automatic synchronization
     */
    startAutoSync() {
        // Sync every 5 minutes
        this.syncInterval = setInterval(() => {
            this.syncWithGitHub().catch(error => {
                this.logger.error('Auto-sync failed', { error });
            });
        }, 5 * 60 * 1000);
        this.logger.info('Started auto-sync with GitHub');
    }
    /**
     * Get repository status
     */
    async getRepoStatus() {
        const { exec } = require('child_process').promises;
        try {
            const [branch, status, ahead] = await Promise.all([
                exec('git rev-parse --abbrev-ref HEAD', { cwd: this.paths.project.root }),
                exec('git status --porcelain', { cwd: this.paths.project.root }),
                exec('git rev-list --count HEAD..origin/HEAD', { cwd: this.paths.project.root })
                    .catch(() => ({ stdout: '0' }))
            ]);
            return {
                currentBranch: branch.stdout.trim(),
                hasUncommittedChanges: status.stdout.trim().length > 0,
                unpushedCommits: parseInt(ahead.stdout.trim()),
                activePRs: this.syncState.activePRs.size,
                activeIssues: this.syncState.activeIssues.size,
                lastSync: this.syncState.lastSync
            };
        }
        catch (error) {
            this.logger.error('Failed to get repo status', { error });
            return null;
        }
    }
    /**
     * Create GitHub issue with context
     */
    async createIssue(options) {
        const issue = {
            id: Date.now(),
            title: options.title,
            body: this.enhanceIssueBody(options.body),
            labels: options.labels || [],
            assignees: options.assignees || [],
            milestone: options.milestone
        };
        // Store issue reference
        this.syncState.activeIssues.set(issue.id, issue);
        // Emit issue created event
        this.emit('issue:created', issue);
        return issue;
    }
    /**
     * Enhance issue body with VERSATIL context
     */
    enhanceIssueBody(body) {
        return `${body}\n\n---\n_Created by VERSATIL SDLC Framework v1.3.0_`;
    }
    /**
     * Link PR to issue
     */
    async linkPRToIssue(prId, issueId) {
        const pr = Array.from(this.syncState.activePRs.values())
            .find(p => p.branch === prId || p.id.toString() === prId);
        const issue = this.syncState.activeIssues.get(issueId);
        if (pr && issue) {
            issue.linkedPR = pr.id;
            // Update PR body to reference issue
            pr.body += `\n\nCloses #${issueId}`;
            this.emit('pr:linked', { pr, issue });
        }
    }
    /**
     * Get active PRs
     */
    getActivePRs() {
        return Array.from(this.syncState.activePRs.values());
    }
    /**
     * Get active issues
     */
    getActiveIssues() {
        return Array.from(this.syncState.activeIssues.values());
    }
    /**
     * Cleanup
     */
    async shutdown() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        // Final sync
        if (this.config.autoSync) {
            await this.syncWithGitHub().catch(() => { });
        }
    }
}
//# sourceMappingURL=github-sync-orchestrator.js.map