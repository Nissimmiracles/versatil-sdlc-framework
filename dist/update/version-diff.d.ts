/**
 * VERSATIL SDLC Framework - Version Diff
 * Compare versions and generate changelog diffs
 */
import { GitHubReleaseChecker } from './github-release-checker.js';
export interface VersionDiff {
    fromVersion: string;
    toVersion: string;
    updateType: 'major' | 'minor' | 'patch' | 'prerelease';
    breakingChanges: string[];
    newFeatures: string[];
    bugFixes: string[];
    deprecations: string[];
    securityFixes: string[];
    performanceImprovements: string[];
    documentation: string[];
    other: string[];
    fullChangelog: string;
    releaseNotes: string;
}
export interface CommitInfo {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    breaking: boolean;
    hash: string;
}
export declare class VersionDiffGenerator {
    private releaseChecker;
    constructor(releaseChecker?: GitHubReleaseChecker);
    /**
     * Generate diff between two versions
     */
    generateDiff(fromVersion: string, toVersion: string): Promise<VersionDiff>;
    /**
     * Generate diff for all versions between current and target
     */
    generateCumulativeDiff(currentVersion: string, targetVersion: string): Promise<VersionDiff>;
    /**
     * Generate user-friendly summary of changes
     */
    generateSummary(diff: VersionDiff): string;
    /**
     * Parse changelog into categorized changes
     */
    private parseChangelog;
    /**
     * Determine update type from version comparison
     */
    private determineUpdateType;
    /**
     * Generate cumulative release notes from multiple releases
     */
    private generateCumulativeReleaseNotes;
    /**
     * Check if update requires user action
     */
    requiresUserAction(diff: VersionDiff): boolean;
    /**
     * Check if update contains security fixes
     */
    hasSecurityFixes(diff: VersionDiff): boolean;
    /**
     * Get recommended action for update
     */
    getRecommendedAction(diff: VersionDiff): 'required' | 'recommended' | 'optional';
}
/**
 * Default version diff generator instance
 */
export declare const defaultVersionDiff: VersionDiffGenerator;
