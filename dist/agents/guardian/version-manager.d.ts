/**
 * VERSATIL SDLC Framework - Version Manager
 * Manages framework version tracking, releases, and evolution
 *
 * FRAMEWORK_CONTEXT ONLY - This component only operates in framework development
 *
 * Responsibilities:
 * - Track current and next framework version
 * - Manage version releases (bump, tag, publish)
 * - Monitor roadmap progress
 * - Track breaking changes and deprecations
 * - Generate release notes
 * - Validate semantic versioning
 */
export type VersionBumpType = 'major' | 'minor' | 'patch';
export interface VersionInfo {
    current: string;
    next: string;
    next_major: string;
    next_minor: string;
    next_patch: string;
    last_release_date: string;
    commits_since_release: number;
    branch: string;
    is_clean: boolean;
}
export interface ReleaseInfo {
    version: string;
    date: string;
    features: string[];
    fixes: string[];
    breaking_changes: string[];
    deprecations: string[];
    commits: number;
    contributors: string[];
}
export interface RoadmapProgress {
    total_milestones: number;
    completed_milestones: number;
    in_progress_milestones: number;
    progress_percentage: number;
    upcoming_features: string[];
    completed_features: string[];
    next_version: string;
    estimated_release_date?: string;
}
/**
 * Version Manager - Manages framework versions and releases
 */
export declare class VersionManager {
    private static instance;
    private logger;
    private frameworkRoot;
    private constructor();
    static getInstance(frameworkRoot: string): VersionManager;
    /**
     * Get current version information
     */
    getVersionInfo(): Promise<VersionInfo>;
    /**
     * Bump version (major, minor, or patch)
     */
    bumpVersion(type: VersionBumpType, skipGit?: boolean): Promise<string>;
    /**
     * Create release
     */
    createRelease(version?: string): Promise<ReleaseInfo>;
    /**
     * Get release information for a version
     */
    getReleaseInfo(version: string): Promise<ReleaseInfo>;
    /**
     * Get roadmap progress
     */
    getRoadmapProgress(): Promise<RoadmapProgress>;
    /**
     * Update CHANGELOG.md with release info
     */
    private updateChangelog;
    /**
     * Validate semantic versioning
     */
    validateVersion(version: string): boolean;
    /**
     * Compare two versions
     */
    compareVersions(v1: string, v2: string): number;
    /**
     * Get current version from package.json
     */
    private getCurrentVersion;
    /**
     * Check if version is outdated
     */
    isOutdated(installedVersion: string): Promise<boolean>;
    /**
     * Get breaking changes since version
     */
    getBreakingChangesSince(version: string): Promise<string[]>;
    /**
     * Generate release notes
     */
    generateReleaseNotes(version: string): Promise<string>;
    /**
     * Validate version bump is appropriate
     */
    validateVersionBump(currentVersion: string, newVersion: string, bumpType: VersionBumpType): boolean;
    /**
     * Generate release information
     */
    generateReleaseInfo(version: string): Promise<ReleaseInfo>;
    /**
     * Check if version is valid semantic version
     */
    isValidSemanticVersion(version: string): boolean;
}
