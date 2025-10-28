/**
 * VERSATIL SDLC Framework - GitHub Release Checker
 * Fetch and parse GitHub releases for framework updates
 */
import { parseVersion, compareVersions } from './semantic-version.js';
export class GitHubReleaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GitHubReleaseError';
    }
}
export class GitHubReleaseChecker {
    constructor(repoOwner = 'Nissimmiracles', repoName = 'versatil-sdlc-framework') {
        this.apiBase = 'https://api.github.com';
        this.cache = new Map();
        this.cacheTTL = 60 * 60 * 1000; // 1 hour
        this.repoOwner = repoOwner;
        this.repoName = repoName;
    }
    /**
     * Get latest release from GitHub
     */
    async getLatestRelease(includePrerelease = false) {
        const cacheKey = `latest-${includePrerelease}`;
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'VERSATIL-SDLC-Framework'
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new GitHubReleaseError('No releases found for this repository');
                }
                throw new GitHubReleaseError(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            const release = await response.json();
            // If we don't want prereleases and this is one, get all releases
            if (!includePrerelease && release.prerelease) {
                return this.getLatestStableRelease();
            }
            const releaseInfo = this.parseRelease(release);
            this.setCache(cacheKey, releaseInfo);
            return releaseInfo;
        }
        catch (error) {
            if (error instanceof GitHubReleaseError) {
                throw error;
            }
            throw new GitHubReleaseError(`Failed to fetch releases: ${error.message}`);
        }
    }
    /**
     * Get latest stable (non-prerelease) release
     */
    async getLatestStableRelease() {
        const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'VERSATIL-SDLC-Framework'
            }
        });
        if (!response.ok) {
            throw new GitHubReleaseError(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        const releases = await response.json();
        // Find first non-prerelease
        const stableRelease = releases.find((r) => !r.prerelease && !r.draft);
        if (!stableRelease) {
            throw new GitHubReleaseError('No stable releases found');
        }
        return this.parseRelease(stableRelease);
    }
    /**
     * Parse GitHub release response
     */
    parseRelease(release) {
        return {
            version: release.tag_name.replace(/^v/, ''),
            tagName: release.tag_name,
            publishedAt: release.published_at,
            changelog: release.body || 'No changelog available',
            releaseNotes: release.body || 'No release notes available',
            downloadUrl: release.tarball_url,
            assets: release.assets ? release.assets.map((asset) => ({
                name: asset.name,
                browser_download_url: asset.browser_download_url,
                size: asset.size,
                content_type: asset.content_type
            })) : [],
            prerelease: release.prerelease || false,
            draft: release.draft || false
        };
    }
    /**
     * Check if update is available
     */
    async checkForUpdate(currentVersion, includePrerelease = false) {
        try {
            const latestRelease = await this.getLatestRelease(includePrerelease);
            const latestVersion = latestRelease.version;
            const comparison = compareVersions(latestVersion, currentVersion);
            if (comparison > 0) {
                // Newer version available
                const currentParsed = parseVersion(currentVersion);
                const latestParsed = parseVersion(latestVersion);
                let updateType = 'patch';
                if (latestParsed.major > currentParsed.major) {
                    updateType = 'major';
                }
                else if (latestParsed.minor > currentParsed.minor) {
                    updateType = 'minor';
                }
                return {
                    hasUpdate: true,
                    currentVersion,
                    latestVersion,
                    releaseInfo: latestRelease,
                    updateType
                };
            }
            // Up to date
            return {
                hasUpdate: false,
                currentVersion,
                latestVersion
            };
        }
        catch (error) {
            // If update check fails (offline, rate limit, etc.), return no update
            // Don't throw error to prevent blocking normal operations
            return {
                hasUpdate: false,
                currentVersion,
                latestVersion: currentVersion
            };
        }
    }
    /**
     * Get all releases
     */
    async getAllReleases(limit = 10) {
        try {
            const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases?per_page=${limit}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'VERSATIL-SDLC-Framework'
                }
            });
            if (!response.ok) {
                throw new GitHubReleaseError(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            const releases = await response.json();
            return releases.map((r) => this.parseRelease(r));
        }
        catch (error) {
            if (error instanceof GitHubReleaseError) {
                throw error;
            }
            throw new GitHubReleaseError(`Failed to fetch releases: ${error.message}`);
        }
    }
    /**
     * Get specific release by tag
     */
    async getReleaseByTag(tag) {
        try {
            const url = `${this.apiBase}/repos/${this.repoOwner}/${this.repoName}/releases/tags/${tag}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'VERSATIL-SDLC-Framework'
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new GitHubReleaseError(`Release not found: ${tag}`);
                }
                throw new GitHubReleaseError(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            const release = await response.json();
            return this.parseRelease(release);
        }
        catch (error) {
            if (error instanceof GitHubReleaseError) {
                throw error;
            }
            throw new GitHubReleaseError(`Failed to fetch release: ${error.message}`);
        }
    }
    /**
     * Get release by version
     */
    async getReleaseByVersion(version) {
        try {
            // Try with 'v' prefix
            const tag = version.startsWith('v') ? version : `v${version}`;
            return await this.getReleaseByTag(tag);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get releases between two versions
     */
    async getReleasesBetween(fromVersion, toVersion) {
        const releases = await this.getAllReleases(100);
        const filtered = [];
        for (const release of releases) {
            const comparison = compareVersions(release.version, fromVersion);
            if (comparison > 0 && compareVersions(release.version, toVersion) <= 0) {
                filtered.push(release);
            }
        }
        return filtered.sort((a, b) => compareVersions(b.version, a.version));
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get from cache if not expired
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    /**
     * Set cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}
/**
 * Default instance for convenience
 */
export const defaultReleaseChecker = new GitHubReleaseChecker();
//# sourceMappingURL=github-release-checker.js.map