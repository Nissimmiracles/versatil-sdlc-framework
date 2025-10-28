/**
 * VERSATIL SDLC Framework - Semantic Version Utilities
 * Semantic version comparison and validation
 */
export class SemanticVersionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SemanticVersionError';
    }
}
/**
 * Parse semantic version string (e.g., "3.0.0", "v3.1.0-beta.1")
 */
export function parseVersion(versionString) {
    // Remove leading 'v' if present
    const cleanVersion = versionString.replace(/^v/, '');
    // Regex for semantic versioning: major.minor.patch[-prerelease][+build]
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/;
    const match = cleanVersion.match(regex);
    if (!match) {
        throw new SemanticVersionError(`Invalid semantic version: ${versionString}`);
    }
    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4],
        build: match[5]
    };
}
/**
 * Compare two semantic versions
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1, v2) {
    const version1 = typeof v1 === 'string' ? parseVersion(v1) : v1;
    const version2 = typeof v2 === 'string' ? parseVersion(v2) : v2;
    // Compare major version
    if (version1.major !== version2.major) {
        return version1.major > version2.major ? 1 : -1;
    }
    // Compare minor version
    if (version1.minor !== version2.minor) {
        return version1.minor > version2.minor ? 1 : -1;
    }
    // Compare patch version
    if (version1.patch !== version2.patch) {
        return version1.patch > version2.patch ? 1 : -1;
    }
    // Handle prerelease versions
    // No prerelease > has prerelease
    if (!version1.prerelease && version2.prerelease)
        return 1;
    if (version1.prerelease && !version2.prerelease)
        return -1;
    // Both have prerelease - compare lexically
    if (version1.prerelease && version2.prerelease) {
        if (version1.prerelease > version2.prerelease)
            return 1;
        if (version1.prerelease < version2.prerelease)
            return -1;
    }
    // Versions are equal
    return 0;
}
/**
 * Check if version1 is newer than version2
 */
export function isNewer(version1, version2) {
    return compareVersions(version1, version2) > 0;
}
/**
 * Check if version1 is older than version2
 */
export function isOlder(version1, version2) {
    return compareVersions(version1, version2) < 0;
}
/**
 * Check if versions are equal
 */
export function isEqual(version1, version2) {
    return compareVersions(version1, version2) === 0;
}
/**
 * Validate semantic version string
 */
export function isValidVersion(versionString) {
    try {
        parseVersion(versionString);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Format version object to string
 */
export function formatVersion(version, includeV = true) {
    let formatted = `${version.major}.${version.minor}.${version.patch}`;
    if (version.prerelease) {
        formatted += `-${version.prerelease}`;
    }
    if (version.build) {
        formatted += `+${version.build}`;
    }
    return includeV ? `v${formatted}` : formatted;
}
/**
 * Get version increment type
 */
export function getVersionIncrement(oldVersion, newVersion) {
    const v1 = parseVersion(oldVersion);
    const v2 = parseVersion(newVersion);
    if (v2.major > v1.major)
        return 'major';
    if (v2.minor > v1.minor)
        return 'minor';
    if (v2.patch > v1.patch)
        return 'patch';
    return 'none';
}
//# sourceMappingURL=semantic-version.js.map