/**
 * VERSATIL SDLC Framework - GitHub Sync Orchestrator
 * Handles full GitHub integration with context-aware PRs and synchronization
 */
import { EventEmitter } from 'events';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
export interface GitHubConfig {
    owner: string;
    repo: string;
    token?: string;
    defaultBranch: string;
    autoSync: boolean;
    prTemplate?: string;
}
export interface PullRequest {
    id: number;
    title: string;
    body: string;
    branch: string;
    baseBranch: string;
    labels: string[];
    reviewers: string[];
    files: string[];
    context: any;
}
export interface GitHubIssue {
    id: number;
    title: string;
    body: string;
    labels: string[];
    assignees: string[];
    milestone?: string;
    linkedPR?: number;
}
export declare class GitHubSyncOrchestrator extends EventEmitter {
    private logger;
    private paths;
    private config;
    private syncInterval?;
    private syncState;
    constructor(paths: IsolatedPaths);
    initialize(): Promise<void>;
    /**
     * Load GitHub configuration from project
     */
    private loadGitHubConfig;
    /**
     * Initialize repository state
     */
    private initializeRepoState;
    /**
     * Create a context-aware pull request
     */
    createContextualPR(options: {
        title: string;
        description: string;
        branch?: string;
        context: any;
        files?: string[];
        labels?: string[];
        reviewers?: string[];
    }): Promise<PullRequest>;
    /**
     * Generate branch name from title
     */
    private generateBranchName;
    /**
     * Generate context-aware commit message
     */
    private generateCommitMessage;
    /**
     * Generate comprehensive PR body
     */
    private generatePRBody;
    /**
     * Infer commit type from context
     */
    private inferCommitType;
    /**
     * Infer scope from files
     */
    private inferScope;
    /**
     * Infer labels from context
     */
    private inferLabels;
    /**
     * Select reviewers based on context
     */
    private selectReviewers;
    /**
     * Find common directory from paths
     */
    private findCommonDirectory;
    /**
     * Sync local changes with GitHub
     */
    syncWithGitHub(): Promise<void>;
    /**
     * Start automatic synchronization
     */
    private startAutoSync;
    /**
     * Get repository status
     */
    getRepoStatus(): Promise<any>;
    /**
     * Create GitHub issue with context
     */
    createIssue(options: {
        title: string;
        body: string;
        labels?: string[];
        assignees?: string[];
        milestone?: string;
    }): Promise<GitHubIssue>;
    /**
     * Enhance issue body with VERSATIL context
     */
    private enhanceIssueBody;
    /**
     * Link PR to issue
     */
    linkPRToIssue(prId: string, issueId: number): Promise<void>;
    /**
     * Get active PRs
     */
    getActivePRs(): PullRequest[];
    /**
     * Get active issues
     */
    getActiveIssues(): GitHubIssue[];
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
