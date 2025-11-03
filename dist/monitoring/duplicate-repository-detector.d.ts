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
export interface RepositoryFingerprint {
    path: string;
    canonicalPath: string;
    gitRemote: string | null;
    signature: string;
    lastCommitHash: string | null;
    branchName: string | null;
    repoName: string;
    createdAt: number;
    lastAccessedAt: number;
}
export interface DuplicateReport {
    isDuplicate: boolean;
    duplicates: RepositoryFingerprint[];
    recommendation: string;
    primaryRepo: RepositoryFingerprint | null;
}
export declare class DuplicateRepositoryDetector {
    private logger;
    private knownRepositories;
    private readonly REGISTRY_PATH;
    constructor(registryPath?: string);
    /**
     * Create fingerprint for a repository
     */
    createFingerprint(repoPath: string): Promise<RepositoryFingerprint>;
    /**
     * Check if repository is a duplicate
     */
    checkForDuplicates(repoPath: string): Promise<DuplicateReport>;
    /**
     * Register a repository
     */
    registerRepository(repoPath: string): Promise<void>;
    /**
     * Remove repository from registry
     */
    unregisterRepository(repoPath: string): Promise<void>;
    /**
     * Get all registered repositories
     */
    getRegisteredRepositories(): RepositoryFingerprint[];
    /**
     * Get canonical path (normalized, no spaces vs dashes ambiguity)
     */
    private getCanonicalPath;
    /**
     * Get git remote URL
     */
    private getGitRemote;
    /**
     * Normalize git URL for comparison
     */
    private normalizeGitUrl;
    /**
     * Get last commit hash
     */
    private getLastCommitHash;
    /**
     * Get current branch name
     */
    private getBranchName;
    /**
     * Generate unique signature for repository
     */
    private generateSignature;
    /**
     * Check if two repositories are duplicates
     */
    private areDuplicates;
    /**
     * Check if two repository names are similar (ignoring spaces, dashes, case)
     */
    private similarNames;
    /**
     * Load registry from disk
     */
    private loadRegistry;
    /**
     * Save registry to disk
     */
    private saveRegistry;
    /**
     * Clean up stale entries (repos that no longer exist)
     */
    cleanupStaleEntries(): Promise<number>;
    /**
     * Generate duplicate report for all repositories
     */
    generateDuplicateReport(): Promise<string>;
}
export declare function getDuplicateDetector(): DuplicateRepositoryDetector;
export declare function destroyDuplicateDetector(): void;
