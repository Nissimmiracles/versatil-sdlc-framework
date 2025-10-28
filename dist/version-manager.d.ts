/**
 * Automated Version Manager
 * Handles semantic versioning, git tagging, and release automation
 */
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
export declare class VersionManager {
    private projectPath;
    private changelogGenerator;
    constructor(projectPath?: string);
    /**
     * Analyze commits and determine version bump type
     */
    analyzeVersionBump(fromTag?: string): Promise<VersionInfo>;
    /**
     * Automatically bump version based on commit analysis
     */
    autoVersion(config?: Partial<ReleaseConfig>): Promise<VersionInfo>;
    /**
     * Manual version bump
     */
    bumpVersionManual(bumpType: VersionBumpType, config?: Partial<ReleaseConfig>): Promise<VersionInfo>;
    /**
     * Prerelease version management
     */
    createPrerelease(identifier?: string): Promise<VersionInfo>;
    /**
     * Get current version from package.json
     */
    private getCurrentVersion;
    /**
     * Update version in package.json
     */
    private updatePackageVersion;
    /**
     * Bump version using semantic versioning
     */
    private bumpVersion;
    /**
     * Create prerelease version
     */
    private createPrereleaseVersion;
    /**
     * Get commits since last tag or from beginning
     */
    private getCommitsSince;
    /**
     * Check if commit is a breaking change
     */
    private isBreakingChange;
    /**
     * Check if commit is a feature
     */
    private isFeature;
    /**
     * Check if commit is a fix
     */
    private isFix;
    /**
     * Get last git tag
     */
    private getLastTag;
    /**
     * Commit version changes
     */
    private commitVersionChanges;
    /**
     * Create git tag
     */
    private createGitTag;
    /**
     * Create GitHub release
     */
    private createGitHubRelease;
    /**
     * Check if we're ahead of remote
     */
    checkRemoteStatus(): Promise<{
        ahead: number;
        behind: number;
    }>;
    /**
     * Get version history
     */
    getVersionHistory(): Promise<{
        version: string;
        date: Date;
        tag: string;
    }[]>;
}
export declare const versionManager: VersionManager;
