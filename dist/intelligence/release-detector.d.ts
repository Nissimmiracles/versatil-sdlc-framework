/**
 * VERSATIL Framework - Release Detector
 *
 * Automatically detects when features are "release-ready" and suggests
 * appropriate version bumps based on semantic versioning rules.
 *
 * Release-Ready Criteria:
 * - All related files committed (no uncommitted changes for feature)
 * - Tests passing (80%+ coverage)
 * - Documentation updated (CLAUDE.md mentions feature)
 * - No open TODO files for feature
 * - No breaking changes (or major version bump required)
 *
 * Version Bump Detection:
 * - MAJOR (x.0.0): Breaking changes, API changes, removed features
 * - MINOR (0.x.0): New features, enhancements, additions
 * - PATCH (0.0.x): Bug fixes, typos, minor improvements
 *
 * @version 7.14.0
 */
export type VersionBumpType = 'major' | 'minor' | 'patch' | 'none';
export interface ReleaseReadinessCheck {
    isReady: boolean;
    confidence: number;
    suggestedVersion: string;
    bumpType: VersionBumpType;
    reasons: string[];
    blockers: string[];
    stats: {
        uncommittedFiles: number;
        newFiles: number;
        modifiedFiles: number;
        deletedFiles: number;
        testCoverage?: number;
        documentationUpdated: boolean;
        openTodos: number;
    };
}
export interface FeatureDetection {
    name: string;
    files: string[];
    type: 'feature' | 'bugfix' | 'enhancement' | 'breaking' | 'docs';
    confidence: number;
}
export declare class ReleaseDetector {
    private logger;
    private cwd;
    constructor(cwd?: string);
    /**
     * Check if project is release-ready
     */
    checkReleaseReadiness(): Promise<ReleaseReadinessCheck>;
    /**
     * Detect features from uncommitted changes
     */
    detectFeatures(): Promise<FeatureDetection[]>;
    /**
     * Detect appropriate version bump type
     */
    private detectVersionBump;
    /**
     * Calculate next version based on bump type
     */
    private calculateNextVersion;
    /**
     * Get current version from package.json
     */
    private getCurrentVersion;
    /**
     * Gather release statistics
     */
    private gatherStats;
    /**
     * Group files by feature (heuristic)
     */
    private groupFilesByFeature;
    /**
     * Detect feature type from files
     */
    private detectFeatureType;
    /**
     * Calculate confidence for feature detection
     */
    private calculateFeatureConfidence;
    /**
     * Calculate overall confidence for release readiness
     */
    private calculateConfidence;
}
