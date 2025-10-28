/**
 * VERSATIL SDLC Framework - Update Lock
 * Pin/lock framework to specific versions
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { parseVersion, compareVersions } from './semantic-version.js';
import { GitHubReleaseChecker } from './github-release-checker.js';
export class UpdateLockManager {
    constructor(releaseChecker) {
        this.versatilHome = path.join(os.homedir(), '.versatil');
        this.lockFile = path.join(this.versatilHome, 'update-lock.json');
        this.releaseChecker = releaseChecker || new GitHubReleaseChecker();
    }
    /**
     * Lock to specific version
     */
    async lockToVersion(version, reason) {
        const config = {
            locked: true,
            lockedVersion: version,
            lockedAt: new Date().toISOString(),
            reason: reason || 'Version pinned by user',
            allowMajor: false,
            allowMinor: false,
            allowPatch: false,
            allowPrerelease: false
        };
        await this.saveLockConfig(config);
        console.log(`✅ Locked to version ${version}`);
    }
    /**
     * Lock to version range
     */
    async lockToRange(minVersion, maxVersion, reason) {
        const config = {
            locked: true,
            minVersion,
            maxVersion,
            lockedAt: new Date().toISOString(),
            reason: reason || 'Version range restriction',
            allowMajor: false,
            allowMinor: true,
            allowPatch: true,
            allowPrerelease: false
        };
        await this.saveLockConfig(config);
        console.log(`✅ Locked to range: ${minVersion || '*'} - ${maxVersion || '*'}`);
    }
    /**
     * Lock with update policy
     */
    async lockWithPolicy(allowMajor, allowMinor, allowPatch, allowPrerelease = false, reason) {
        const config = {
            locked: true,
            lockedAt: new Date().toISOString(),
            reason: reason || 'Update policy restriction',
            allowMajor,
            allowMinor,
            allowPatch,
            allowPrerelease
        };
        await this.saveLockConfig(config);
        const policy = [];
        if (allowMajor)
            policy.push('major');
        if (allowMinor)
            policy.push('minor');
        if (allowPatch)
            policy.push('patch');
        if (allowPrerelease)
            policy.push('prerelease');
        console.log(`✅ Update policy set: Allow ${policy.join(', ')} updates`);
    }
    /**
     * Temporary lock with expiration
     */
    async temporaryLock(version, durationDays, reason) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        const config = {
            locked: true,
            lockedVersion: version,
            lockedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            reason: reason || `Temporary lock for ${durationDays} days`,
            allowMajor: false,
            allowMinor: false,
            allowPatch: false,
            allowPrerelease: false
        };
        await this.saveLockConfig(config);
        console.log(`✅ Temporarily locked to ${version} until ${expiresAt.toLocaleDateString()}`);
    }
    /**
     * Unlock updates
     */
    async unlock() {
        const config = {
            locked: false,
            allowMajor: true,
            allowMinor: true,
            allowPatch: true,
            allowPrerelease: false
        };
        await this.saveLockConfig(config);
        console.log('✅ Updates unlocked');
    }
    /**
     * Check if version is allowed
     */
    async isVersionAllowed(targetVersion, currentVersion) {
        const config = await this.loadLockConfig();
        // Check if updates are unlocked
        if (!config.locked) {
            return {
                allowed: true,
                reason: 'Updates are not locked',
                requestedVersion: targetVersion
            };
        }
        // Check expiration
        if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
            // Lock expired - auto-unlock
            await this.unlock();
            return {
                allowed: true,
                reason: 'Lock expired',
                requestedVersion: targetVersion
            };
        }
        // Check exact version lock
        if (config.lockedVersion) {
            if (targetVersion === config.lockedVersion) {
                return {
                    allowed: true,
                    reason: 'Exact version match',
                    lockedVersion: config.lockedVersion,
                    requestedVersion: targetVersion
                };
            }
            else {
                return {
                    allowed: false,
                    reason: `Locked to version ${config.lockedVersion}`,
                    lockedVersion: config.lockedVersion,
                    requestedVersion: targetVersion
                };
            }
        }
        // Check allowed versions list
        if (config.allowedVersions && config.allowedVersions.length > 0) {
            if (config.allowedVersions.includes(targetVersion)) {
                return {
                    allowed: true,
                    reason: 'Version in allowed list',
                    requestedVersion: targetVersion
                };
            }
            else {
                return {
                    allowed: false,
                    reason: `Version not in allowed list: ${config.allowedVersions.join(', ')}`,
                    requestedVersion: targetVersion
                };
            }
        }
        // Check version range
        if (config.minVersion || config.maxVersion) {
            const isInRange = this.isVersionInRange(targetVersion, config.minVersion, config.maxVersion);
            if (!isInRange) {
                return {
                    allowed: false,
                    reason: `Version outside allowed range: ${config.minVersion || '*'} - ${config.maxVersion || '*'}`,
                    requestedVersion: targetVersion
                };
            }
        }
        // Check update policy
        const current = parseVersion(currentVersion);
        const target = parseVersion(targetVersion);
        // Major version check
        if (target.major > current.major && !config.allowMajor) {
            return {
                allowed: false,
                reason: 'Major version updates not allowed',
                requestedVersion: targetVersion
            };
        }
        // Minor version check
        if (target.major === current.major && target.minor > current.minor && !config.allowMinor) {
            return {
                allowed: false,
                reason: 'Minor version updates not allowed',
                requestedVersion: targetVersion
            };
        }
        // Patch version check
        if (target.major === current.major &&
            target.minor === current.minor &&
            target.patch > current.patch &&
            !config.allowPatch) {
            return {
                allowed: false,
                reason: 'Patch version updates not allowed',
                requestedVersion: targetVersion
            };
        }
        // Prerelease check
        if (target.prerelease && !config.allowPrerelease) {
            return {
                allowed: false,
                reason: 'Prerelease versions not allowed',
                requestedVersion: targetVersion
            };
        }
        return {
            allowed: true,
            reason: 'Version meets update policy',
            requestedVersion: targetVersion
        };
    }
    /**
     * Get current lock status
     */
    async getLockStatus() {
        return await this.loadLockConfig();
    }
    /**
     * Get allowed versions based on lock config
     */
    async getAllowedVersions(currentVersion) {
        const config = await this.loadLockConfig();
        if (!config.locked) {
            // Return all versions
            const releases = await this.releaseChecker.getAllReleases(50);
            return releases.map(r => r.version);
        }
        if (config.lockedVersion) {
            return [config.lockedVersion];
        }
        if (config.allowedVersions) {
            return config.allowedVersions;
        }
        // Filter based on policy
        const releases = await this.releaseChecker.getAllReleases(50);
        const current = parseVersion(currentVersion);
        return releases
            .filter(release => {
            const target = parseVersion(release.version);
            // Check range
            if (config.minVersion || config.maxVersion) {
                if (!this.isVersionInRange(release.version, config.minVersion, config.maxVersion)) {
                    return false;
                }
            }
            // Check policy
            if (target.major > current.major && !config.allowMajor)
                return false;
            if (target.major === current.major && target.minor > current.minor && !config.allowMinor)
                return false;
            if (target.major === current.major &&
                target.minor === current.minor &&
                target.patch > current.patch &&
                !config.allowPatch)
                return false;
            if (target.prerelease && !config.allowPrerelease)
                return false;
            return true;
        })
            .map(r => r.version);
    }
    /**
     * Add version to allowed list
     */
    async addAllowedVersion(version) {
        const config = await this.loadLockConfig();
        if (!config.allowedVersions) {
            config.allowedVersions = [];
        }
        if (!config.allowedVersions.includes(version)) {
            config.allowedVersions.push(version);
            await this.saveLockConfig(config);
            console.log(`✅ Added ${version} to allowed versions`);
        }
    }
    /**
     * Remove version from allowed list
     */
    async removeAllowedVersion(version) {
        const config = await this.loadLockConfig();
        if (config.allowedVersions) {
            config.allowedVersions = config.allowedVersions.filter(v => v !== version);
            await this.saveLockConfig(config);
            console.log(`✅ Removed ${version} from allowed versions`);
        }
    }
    /**
     * Check if version is in range
     */
    isVersionInRange(version, minVersion, maxVersion) {
        if (minVersion) {
            if (compareVersions(version, minVersion) < 0) {
                return false;
            }
        }
        if (maxVersion) {
            if (compareVersions(version, maxVersion) > 0) {
                return false;
            }
        }
        return true;
    }
    /**
     * Load lock configuration
     */
    async loadLockConfig() {
        try {
            const data = await fs.readFile(this.lockFile, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            // Default: unlocked
            return {
                locked: false,
                allowMajor: true,
                allowMinor: true,
                allowPatch: true,
                allowPrerelease: false
            };
        }
    }
    /**
     * Save lock configuration
     */
    async saveLockConfig(config) {
        await fs.mkdir(this.versatilHome, { recursive: true });
        await fs.writeFile(this.lockFile, JSON.stringify(config, null, 2));
    }
    /**
     * Generate lock policy summary
     */
    async getLockSummary() {
        const config = await this.loadLockConfig();
        if (!config.locked) {
            return '🔓 Updates: Unlocked (all updates allowed)';
        }
        const lines = [];
        lines.push('🔒 Updates: Locked');
        if (config.lockedVersion) {
            lines.push(`   Version: ${config.lockedVersion}`);
        }
        if (config.minVersion || config.maxVersion) {
            lines.push(`   Range: ${config.minVersion || '*'} - ${config.maxVersion || '*'}`);
        }
        if (config.allowedVersions && config.allowedVersions.length > 0) {
            lines.push(`   Allowed: ${config.allowedVersions.join(', ')}`);
        }
        const policy = [];
        if (config.allowMajor)
            policy.push('major');
        if (config.allowMinor)
            policy.push('minor');
        if (config.allowPatch)
            policy.push('patch');
        if (config.allowPrerelease)
            policy.push('prerelease');
        if (policy.length > 0) {
            lines.push(`   Policy: Allow ${policy.join(', ')}`);
        }
        if (config.expiresAt) {
            lines.push(`   Expires: ${new Date(config.expiresAt).toLocaleDateString()}`);
        }
        if (config.reason) {
            lines.push(`   Reason: ${config.reason}`);
        }
        return lines.join('\n');
    }
}
/**
 * Default update lock manager instance
 */
export const defaultUpdateLock = new UpdateLockManager();
//# sourceMappingURL=update-lock.js.map