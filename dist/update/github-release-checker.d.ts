/**
 * VERSATIL SDLC Framework - GitHub Release Checker
 * Fetch and parse GitHub releases for framework updates
 */
export interface ReleaseAsset {
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
}
export interface ReleaseInfo {
    version: string;
    tagName?: string;
    publishedAt: string;
    changelog: string;
    releaseNotes: string;
    downloadUrl: string;
    assets?: ReleaseAsset[];
    prerelease: boolean;
    draft?: boolean;
}
export interface UpdateCheckResult {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseInfo?: ReleaseInfo;
    updateType?: 'major' | 'minor' | 'patch';
}
export declare class GitHubReleaseError extends Error {
    constructor(message: string);
}
export declare class GitHubReleaseChecker {
    private readonly repoOwner;
    private readonly repoName;
    private readonly apiBase;
    private cache;
    private readonly cacheTTL;
    constructor(repoOwner?: string, repoName?: string);
    /**
     * Get latest release from GitHub
     */
    getLatestRelease(includePrerelease?: boolean): Promise<ReleaseInfo>;
    /**
     * Get latest stable (non-prerelease) release
     */
    private getLatestStableRelease;
    /**
     * Parse GitHub release response
     */
    private parseRelease;
    /**
     * Check if update is available
     */
    checkForUpdate(currentVersion: string, includePrerelease?: boolean): Promise<UpdateCheckResult>;
    /**
     * Get all releases
     */
    getAllReleases(limit?: number): Promise<ReleaseInfo[]>;
    /**
     * Get specific release by tag
     */
    getReleaseByTag(tag: string): Promise<ReleaseInfo>;
    /**
     * Get release by version
     */
    getReleaseByVersion(version: string): Promise<ReleaseInfo | null>;
    /**
     * Get releases between two versions
     */
    getReleasesBetween(fromVersion: string, toVersion: string): Promise<ReleaseInfo[]>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get from cache if not expired
     */
    private getFromCache;
    /**
     * Set cache
     */
    private setCache;
}
/**
 * Default instance for convenience
 */
export declare const defaultReleaseChecker: GitHubReleaseChecker;
