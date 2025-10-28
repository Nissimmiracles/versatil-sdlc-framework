/**
 * VERSATIL SDLC Framework - Semantic Version Utilities
 * Semantic version comparison and validation
 */
export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
}
export declare class SemanticVersionError extends Error {
    constructor(message: string);
}
/**
 * Parse semantic version string (e.g., "3.0.0", "v3.1.0-beta.1")
 */
export declare function parseVersion(versionString: string): SemanticVersion;
/**
 * Compare two semantic versions
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export declare function compareVersions(v1: string | SemanticVersion, v2: string | SemanticVersion): number;
/**
 * Check if version1 is newer than version2
 */
export declare function isNewer(version1: string, version2: string): boolean;
/**
 * Check if version1 is older than version2
 */
export declare function isOlder(version1: string, version2: string): boolean;
/**
 * Check if versions are equal
 */
export declare function isEqual(version1: string, version2: string): boolean;
/**
 * Validate semantic version string
 */
export declare function isValidVersion(versionString: string): boolean;
/**
 * Format version object to string
 */
export declare function formatVersion(version: SemanticVersion, includeV?: boolean): string;
/**
 * Get version increment type
 */
export declare function getVersionIncrement(oldVersion: string, newVersion: string): 'major' | 'minor' | 'patch' | 'none';
