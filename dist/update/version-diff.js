/**
 * VERSATIL SDLC Framework - Version Diff
 * Compare versions and generate changelog diffs
 */
import { GitHubReleaseChecker } from './github-release-checker.js';
import { parseVersion } from './semantic-version.js';
export class VersionDiffGenerator {
    constructor(releaseChecker) {
        this.releaseChecker = releaseChecker || new GitHubReleaseChecker();
    }
    /**
     * Generate diff between two versions
     */
    async generateDiff(fromVersion, toVersion) {
        const fromRelease = await this.releaseChecker.getReleaseByVersion(fromVersion);
        const toRelease = await this.releaseChecker.getReleaseByVersion(toVersion);
        if (!fromRelease || !toRelease) {
            throw new Error(`Could not find release information for ${!fromRelease ? fromVersion : toVersion}`);
        }
        // Determine update type
        const updateType = this.determineUpdateType(fromVersion, toVersion);
        // Parse changelog
        const changes = this.parseChangelog(toRelease.changelog);
        return {
            fromVersion,
            toVersion,
            updateType,
            breakingChanges: changes.breakingChanges,
            newFeatures: changes.newFeatures,
            bugFixes: changes.bugFixes,
            deprecations: changes.deprecations,
            securityFixes: changes.securityFixes,
            performanceImprovements: changes.performanceImprovements,
            documentation: changes.documentation,
            other: changes.other,
            fullChangelog: toRelease.changelog,
            releaseNotes: toRelease.releaseNotes
        };
    }
    /**
     * Generate diff for all versions between current and target
     */
    async generateCumulativeDiff(currentVersion, targetVersion) {
        const releases = await this.releaseChecker.getReleasesBetween(currentVersion, targetVersion);
        if (releases.length === 0) {
            throw new Error(`No releases found between ${currentVersion} and ${targetVersion}`);
        }
        // Aggregate changes from all releases
        const aggregated = {
            breakingChanges: [],
            newFeatures: [],
            bugFixes: [],
            deprecations: [],
            securityFixes: [],
            performanceImprovements: [],
            documentation: [],
            other: []
        };
        let fullChangelog = '';
        for (const release of releases) {
            const changes = this.parseChangelog(release.changelog);
            aggregated.breakingChanges.push(...changes.breakingChanges);
            aggregated.newFeatures.push(...changes.newFeatures);
            aggregated.bugFixes.push(...changes.bugFixes);
            aggregated.deprecations.push(...changes.deprecations);
            aggregated.securityFixes.push(...changes.securityFixes);
            aggregated.performanceImprovements.push(...changes.performanceImprovements);
            aggregated.documentation.push(...changes.documentation);
            aggregated.other.push(...changes.other);
            fullChangelog += `\n## ${release.version} (${new Date(release.publishedAt).toLocaleDateString()})\n\n${release.changelog}\n`;
        }
        const updateType = this.determineUpdateType(currentVersion, targetVersion);
        return {
            fromVersion: currentVersion,
            toVersion: targetVersion,
            updateType,
            ...aggregated,
            fullChangelog: fullChangelog.trim(),
            releaseNotes: this.generateCumulativeReleaseNotes(releases)
        };
    }
    /**
     * Generate user-friendly summary of changes
     */
    generateSummary(diff) {
        const lines = [];
        lines.push(`📦 Update: ${diff.fromVersion} → ${diff.toVersion} (${diff.updateType})`);
        lines.push('');
        if (diff.breakingChanges.length > 0) {
            lines.push('🚨 Breaking Changes:');
            diff.breakingChanges.forEach(change => lines.push(`   • ${change}`));
            lines.push('');
        }
        if (diff.securityFixes.length > 0) {
            lines.push('🔒 Security Fixes:');
            diff.securityFixes.forEach(fix => lines.push(`   • ${fix}`));
            lines.push('');
        }
        if (diff.newFeatures.length > 0) {
            lines.push('✨ New Features:');
            diff.newFeatures.slice(0, 5).forEach(feature => lines.push(`   • ${feature}`));
            if (diff.newFeatures.length > 5) {
                lines.push(`   ... and ${diff.newFeatures.length - 5} more`);
            }
            lines.push('');
        }
        if (diff.bugFixes.length > 0) {
            lines.push('🐛 Bug Fixes:');
            diff.bugFixes.slice(0, 5).forEach(fix => lines.push(`   • ${fix}`));
            if (diff.bugFixes.length > 5) {
                lines.push(`   ... and ${diff.bugFixes.length - 5} more`);
            }
            lines.push('');
        }
        if (diff.performanceImprovements.length > 0) {
            lines.push('⚡ Performance Improvements:');
            diff.performanceImprovements.forEach(improvement => lines.push(`   • ${improvement}`));
            lines.push('');
        }
        if (diff.deprecations.length > 0) {
            lines.push('⚠️  Deprecations:');
            diff.deprecations.forEach(deprecation => lines.push(`   • ${deprecation}`));
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Parse changelog into categorized changes
     */
    parseChangelog(changelog) {
        const result = {
            breakingChanges: [],
            newFeatures: [],
            bugFixes: [],
            deprecations: [],
            securityFixes: [],
            performanceImprovements: [],
            documentation: [],
            other: []
        };
        const lines = changelog.split('\n');
        let currentCategory = 'other';
        for (const line of lines) {
            const trimmed = line.trim();
            // Detect category headers
            if (trimmed.match(/^##?\s*(breaking\s*changes?|breaking)/i)) {
                currentCategory = 'breakingChanges';
                continue;
            }
            if (trimmed.match(/^##?\s*(features?|new\s*features?)/i)) {
                currentCategory = 'newFeatures';
                continue;
            }
            if (trimmed.match(/^##?\s*(bug\s*fixes?|fixes?)/i)) {
                currentCategory = 'bugFixes';
                continue;
            }
            if (trimmed.match(/^##?\s*(deprecations?|deprecated)/i)) {
                currentCategory = 'deprecations';
                continue;
            }
            if (trimmed.match(/^##?\s*(security|security\s*fixes?)/i)) {
                currentCategory = 'securityFixes';
                continue;
            }
            if (trimmed.match(/^##?\s*(performance|optimizations?)/i)) {
                currentCategory = 'performanceImprovements';
                continue;
            }
            if (trimmed.match(/^##?\s*(documentation|docs)/i)) {
                currentCategory = 'documentation';
                continue;
            }
            // Extract bullet points
            if (trimmed.match(/^[-*•]\s+/)) {
                const content = trimmed.replace(/^[-*•]\s+/, '').trim();
                if (content) {
                    // Check for conventional commit format
                    const commitMatch = content.match(/^(feat|fix|perf|docs|BREAKING|security)(\(.+?\))?\s*:\s*(.+)/i);
                    if (commitMatch) {
                        const [, type, , subject] = commitMatch;
                        if (type.toLowerCase() === 'breaking') {
                            result.breakingChanges.push(subject);
                        }
                        else if (type.toLowerCase() === 'feat') {
                            result.newFeatures.push(subject);
                        }
                        else if (type.toLowerCase() === 'fix') {
                            result.bugFixes.push(subject);
                        }
                        else if (type.toLowerCase() === 'perf') {
                            result.performanceImprovements.push(subject);
                        }
                        else if (type.toLowerCase() === 'docs') {
                            result.documentation.push(subject);
                        }
                        else if (type.toLowerCase() === 'security') {
                            result.securityFixes.push(subject);
                        }
                    }
                    else {
                        result[currentCategory].push(content);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Determine update type from version comparison
     */
    determineUpdateType(fromVersion, toVersion) {
        const from = parseVersion(fromVersion);
        const to = parseVersion(toVersion);
        if (to.major > from.major) {
            return 'major';
        }
        if (to.minor > from.minor) {
            return 'minor';
        }
        if (to.patch > from.patch) {
            return 'patch';
        }
        if (to.prerelease && !from.prerelease) {
            return 'prerelease';
        }
        if (to.prerelease && from.prerelease) {
            return 'prerelease';
        }
        return 'patch';
    }
    /**
     * Generate cumulative release notes from multiple releases
     */
    generateCumulativeReleaseNotes(releases) {
        const lines = [];
        lines.push(`# Cumulative Release Notes`);
        lines.push('');
        lines.push(`Updating from ${releases[releases.length - 1].version} to ${releases[0].version}`);
        lines.push('');
        for (const release of releases) {
            lines.push(`## ${release.version} (${new Date(release.publishedAt).toLocaleDateString()})`);
            lines.push('');
            lines.push(release.releaseNotes);
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Check if update requires user action
     */
    requiresUserAction(diff) {
        return diff.breakingChanges.length > 0 || diff.deprecations.length > 0;
    }
    /**
     * Check if update contains security fixes
     */
    hasSecurityFixes(diff) {
        return diff.securityFixes.length > 0;
    }
    /**
     * Get recommended action for update
     */
    getRecommendedAction(diff) {
        if (diff.securityFixes.length > 0) {
            return 'required';
        }
        if (diff.breakingChanges.length > 0 || diff.updateType === 'major') {
            return 'recommended';
        }
        return 'optional';
    }
}
/**
 * Default version diff generator instance
 */
export const defaultVersionDiff = new VersionDiffGenerator();
//# sourceMappingURL=version-diff.js.map