/**
 * VERSATIL SDLC Framework - Update Lock
 * Pin/lock framework to specific versions
 */
import { GitHubReleaseChecker } from './github-release-checker.js';
export interface LockConfig {
    locked: boolean;
    lockedVersion?: string;
    lockedAt?: string;
    reason?: string;
    allowedVersions?: string[];
    minVersion?: string;
    maxVersion?: string;
    allowMajor?: boolean;
    allowMinor?: boolean;
    allowPatch?: boolean;
    allowPrerelease?: boolean;
    expiresAt?: string;
}
export interface LockValidationResult {
    allowed: boolean;
    reason: string;
    lockedVersion?: string;
    requestedVersion: string;
}
export declare class UpdateLockManager {
    private readonly versatilHome;
    private readonly lockFile;
    private releaseChecker;
    constructor(releaseChecker?: GitHubReleaseChecker);
    /**
     * Lock to specific version
     */
    lockToVersion(version: string, reason?: string): Promise<void>;
    /**
     * Lock to version range
     */
    lockToRange(minVersion?: string, maxVersion?: string, reason?: string): Promise<void>;
    /**
     * Lock with update policy
     */
    lockWithPolicy(allowMajor: boolean, allowMinor: boolean, allowPatch: boolean, allowPrerelease?: boolean, reason?: string): Promise<void>;
    /**
     * Temporary lock with expiration
     */
    temporaryLock(version: string, durationDays: number, reason?: string): Promise<void>;
    /**
     * Unlock updates
     */
    unlock(): Promise<void>;
    /**
     * Check if version is allowed
     */
    isVersionAllowed(targetVersion: string, currentVersion: string): Promise<LockValidationResult>;
    /**
     * Get current lock status
     */
    getLockStatus(): Promise<LockConfig>;
    /**
     * Get allowed versions based on lock config
     */
    getAllowedVersions(currentVersion: string): Promise<string[]>;
    /**
     * Add version to allowed list
     */
    addAllowedVersion(version: string): Promise<void>;
    /**
     * Remove version from allowed list
     */
    removeAllowedVersion(version: string): Promise<void>;
    /**
     * Check if version is in range
     */
    private isVersionInRange;
    /**
     * Load lock configuration
     */
    private loadLockConfig;
    /**
     * Save lock configuration
     */
    private saveLockConfig;
    /**
     * Generate lock policy summary
     */
    getLockSummary(): Promise<string>;
}
/**
 * Default update lock manager instance
 */
export declare const defaultUpdateLock: UpdateLockManager;
