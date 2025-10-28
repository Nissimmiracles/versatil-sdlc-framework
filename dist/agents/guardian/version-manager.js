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
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GuardianLogger } from './guardian-logger.js';
const execAsync = promisify(exec);
/**
 * Version Manager - Manages framework versions and releases
 */
export class VersionManager {
    constructor(frameworkRoot) {
        this.logger = GuardianLogger.getInstance();
        this.frameworkRoot = frameworkRoot;
    }
    static getInstance(frameworkRoot) {
        if (!VersionManager.instance) {
            VersionManager.instance = new VersionManager(frameworkRoot);
        }
        return VersionManager.instance;
    }
    /**
     * Get current version information
     */
    async getVersionInfo() {
        const packageJsonPath = path.join(this.frameworkRoot, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const current = packageJson.version;
        // Calculate next versions
        const [major, minor, patch] = current.split('.').map(Number);
        const next_major = `${major + 1}.0.0`;
        const next_minor = `${major}.${minor + 1}.0`;
        const next_patch = `${major}.${minor}.${patch + 1}`;
        // Get git info
        const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.frameworkRoot });
        const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.frameworkRoot });
        const is_clean = status.trim().length === 0;
        // Get last release date
        let last_release_date = 'Unknown';
        let commits_since_release = 0;
        try {
            const { stdout: tagDate } = await execAsync(`git log -1 --format=%ai v${current}`, { cwd: this.frameworkRoot });
            last_release_date = tagDate.trim();
            const { stdout: commitCount } = await execAsync(`git rev-list v${current}..HEAD --count`, { cwd: this.frameworkRoot });
            commits_since_release = parseInt(commitCount.trim());
        }
        catch (error) {
            // Tag might not exist yet
        }
        // Determine next version based on roadmap
        const roadmap = await this.getRoadmapProgress();
        const next = roadmap.next_version || next_patch;
        return {
            current,
            next,
            next_major,
            next_minor,
            next_patch,
            last_release_date,
            commits_since_release,
            branch: branch.trim(),
            is_clean
        };
    }
    /**
     * Bump version (major, minor, or patch)
     */
    async bumpVersion(type, skipGit = false) {
        console.log(`📦 Bumping ${type} version...`);
        try {
            // Run npm version
            const { stdout } = await execAsync(`npm version ${type} ${skipGit ? '--no-git-tag-version' : ''}`, {
                cwd: this.frameworkRoot
            });
            const newVersion = stdout.trim().replace('v', '');
            console.log(`✅ Version bumped to ${newVersion}`);
            // Log version bump
            this.logger.logVersionManagement({
                action: 'version_bump',
                old_version: (await this.getCurrentVersion()),
                new_version: newVersion,
                bump_type: type,
                success: true
            });
            return newVersion;
        }
        catch (error) {
            console.error(`❌ Version bump failed: ${error.message}`);
            this.logger.logVersionManagement({
                action: 'version_bump',
                old_version: (await this.getCurrentVersion()),
                new_version: 'failed',
                bump_type: type,
                success: false
            });
            throw error;
        }
    }
    /**
     * Create release
     */
    async createRelease(version) {
        console.log('🚀 Creating release...');
        const versionInfo = await this.getVersionInfo();
        const releaseVersion = version || versionInfo.next;
        // Validate git status
        if (!versionInfo.is_clean) {
            throw new Error('Working directory is not clean. Commit or stash changes first.');
        }
        // Get release information
        const releaseInfo = await this.getReleaseInfo(releaseVersion);
        // Update CHANGELOG
        await this.updateChangelog(releaseInfo);
        // Commit changes
        await execAsync(`git add CHANGELOG.md package.json`, { cwd: this.frameworkRoot });
        await execAsync(`git commit -m "Release v${releaseVersion}"`, { cwd: this.frameworkRoot });
        // Create git tag
        await execAsync(`git tag -a v${releaseVersion} -m "Release v${releaseVersion}"`, {
            cwd: this.frameworkRoot
        });
        console.log(`✅ Release v${releaseVersion} created`);
        // Log release
        this.logger.logVersionManagement({
            action: 'create_release',
            old_version: versionInfo.current,
            new_version: releaseVersion,
            features_count: releaseInfo.features.length,
            fixes_count: releaseInfo.fixes.length,
            breaking_changes_count: releaseInfo.breaking_changes.length,
            success: true
        });
        return releaseInfo;
    }
    /**
     * Get release information for a version
     */
    async getReleaseInfo(version) {
        const currentVersion = await this.getCurrentVersion();
        // Get commits since last release
        let commits = [];
        try {
            const { stdout } = await execAsync(`git log v${currentVersion}..HEAD --oneline`, {
                cwd: this.frameworkRoot
            });
            commits = stdout.trim().split('\n').filter(c => c);
        }
        catch (error) {
            // No previous tag, get all commits
            const { stdout } = await execAsync('git log --oneline', { cwd: this.frameworkRoot });
            commits = stdout.trim().split('\n').filter(c => c);
        }
        // Parse commits into categories
        const features = [];
        const fixes = [];
        const breaking_changes = [];
        const deprecations = [];
        commits.forEach(commit => {
            if (commit.includes('feat:') || commit.includes('feature:')) {
                features.push(commit.replace(/^[a-f0-9]+ /, ''));
            }
            else if (commit.includes('fix:')) {
                fixes.push(commit.replace(/^[a-f0-9]+ /, ''));
            }
            else if (commit.includes('BREAKING CHANGE')) {
                breaking_changes.push(commit.replace(/^[a-f0-9]+ /, ''));
            }
            else if (commit.includes('deprecate:')) {
                deprecations.push(commit.replace(/^[a-f0-9]+ /, ''));
            }
        });
        // Get contributors
        const { stdout: contributorList } = await execAsync(`git log v${currentVersion}..HEAD --format='%an' | sort -u`, { cwd: this.frameworkRoot });
        const contributors = contributorList.trim().split('\n').filter(c => c);
        return {
            version,
            date: new Date().toISOString().split('T')[0],
            features,
            fixes,
            breaking_changes,
            deprecations,
            commits: commits.length,
            contributors
        };
    }
    /**
     * Get roadmap progress
     */
    async getRoadmapProgress() {
        const roadmapPath = path.join(this.frameworkRoot, 'docs', 'VERSATIL_ROADMAP.md');
        if (!fs.existsSync(roadmapPath)) {
            return {
                total_milestones: 0,
                completed_milestones: 0,
                in_progress_milestones: 0,
                progress_percentage: 0,
                upcoming_features: [],
                completed_features: [],
                next_version: '0.0.0'
            };
        }
        const content = fs.readFileSync(roadmapPath, 'utf-8');
        // Count milestones
        const total_milestones = (content.match(/- \[[ x]\]/g) || []).length;
        const completed_milestones = (content.match(/- \[x\]/g) || []).length;
        const in_progress_milestones = total_milestones - completed_milestones;
        const progress_percentage = total_milestones > 0 ? Math.round((completed_milestones / total_milestones) * 100) : 0;
        // Extract features
        const upcoming_features = [];
        const completed_features = [];
        const upcomingMatches = content.matchAll(/- \[ \] (.+)/g);
        for (const match of upcomingMatches) {
            upcoming_features.push(match[1]);
        }
        const completedMatches = content.matchAll(/- \[x\] (.+)/g);
        for (const match of completedMatches) {
            completed_features.push(match[1]);
        }
        // Extract next version
        const versionMatch = content.match(/## v([\d.]+)/);
        const next_version = versionMatch ? versionMatch[1] : '0.0.0';
        return {
            total_milestones,
            completed_milestones,
            in_progress_milestones,
            progress_percentage,
            upcoming_features: upcoming_features.slice(0, 10), // Top 10
            completed_features: completed_features.slice(0, 10), // Last 10
            next_version
        };
    }
    /**
     * Update CHANGELOG.md with release info
     */
    async updateChangelog(release) {
        const changelogPath = path.join(this.frameworkRoot, 'CHANGELOG.md');
        let changelog = '';
        if (fs.existsSync(changelogPath)) {
            changelog = fs.readFileSync(changelogPath, 'utf-8');
        }
        else {
            changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
        }
        // Build release entry
        let releaseEntry = `## [${release.version}] - ${release.date}\n\n`;
        if (release.breaking_changes.length > 0) {
            releaseEntry += `### ⚠️ BREAKING CHANGES\n\n`;
            release.breaking_changes.forEach(change => {
                releaseEntry += `- ${change}\n`;
            });
            releaseEntry += '\n';
        }
        if (release.features.length > 0) {
            releaseEntry += `### ✨ Features\n\n`;
            release.features.forEach(feature => {
                releaseEntry += `- ${feature}\n`;
            });
            releaseEntry += '\n';
        }
        if (release.fixes.length > 0) {
            releaseEntry += `### 🐛 Bug Fixes\n\n`;
            release.fixes.forEach(fix => {
                releaseEntry += `- ${fix}\n`;
            });
            releaseEntry += '\n';
        }
        if (release.deprecations.length > 0) {
            releaseEntry += `### 🗑️ Deprecations\n\n`;
            release.deprecations.forEach(dep => {
                releaseEntry += `- ${dep}\n`;
            });
            releaseEntry += '\n';
        }
        releaseEntry += `**Contributors**: ${release.contributors.join(', ')}\n\n`;
        // Insert at top (after header)
        const headerEnd = changelog.indexOf('\n\n') + 2;
        const updatedChangelog = changelog.slice(0, headerEnd) + releaseEntry + changelog.slice(headerEnd);
        fs.writeFileSync(changelogPath, updatedChangelog);
        console.log('✅ Updated CHANGELOG.md');
    }
    /**
     * Validate semantic versioning
     */
    validateVersion(version) {
        const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        return semverRegex.test(version);
    }
    /**
     * Compare two versions
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 < p2)
                return -1;
            if (p1 > p2)
                return 1;
        }
        return 0;
    }
    /**
     * Get current version from package.json
     */
    async getCurrentVersion() {
        const packageJsonPath = path.join(this.frameworkRoot, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version;
    }
    /**
     * Check if version is outdated
     */
    async isOutdated(installedVersion) {
        try {
            const { stdout } = await execAsync('npm view versatil-sdlc-framework version');
            const latestVersion = stdout.trim();
            return this.compareVersions(installedVersion, latestVersion) < 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get breaking changes since version
     */
    async getBreakingChangesSince(version) {
        const changelogPath = path.join(this.frameworkRoot, 'CHANGELOG.md');
        if (!fs.existsSync(changelogPath))
            return [];
        const content = fs.readFileSync(changelogPath, 'utf-8');
        const breaking_changes = [];
        // Extract all breaking changes
        const matches = content.matchAll(/### ⚠️ BREAKING CHANGES\n\n([\s\S]*?)(?=\n###|\n##|$)/g);
        for (const match of matches) {
            const changes = match[1].split('\n').filter(line => line.startsWith('- ')).map(line => line.substring(2));
            breaking_changes.push(...changes);
        }
        return breaking_changes;
    }
    /**
     * Generate release notes
     */
    async generateReleaseNotes(version) {
        const release = await this.getReleaseInfo(version);
        const roadmap = await this.getRoadmapProgress();
        let notes = `# Release v${version}\n\n`;
        notes += `**Release Date**: ${release.date}\n`;
        notes += `**Commits**: ${release.commits}\n`;
        notes += `**Contributors**: ${release.contributors.join(', ')}\n\n`;
        notes += `## 📊 Roadmap Progress\n\n`;
        notes += `- Progress: ${roadmap.progress_percentage}% (${roadmap.completed_milestones}/${roadmap.total_milestones} milestones)\n`;
        notes += `- Next Version: v${roadmap.next_version}\n\n`;
        if (release.breaking_changes.length > 0) {
            notes += `## ⚠️ BREAKING CHANGES\n\n`;
            release.breaking_changes.forEach(change => {
                notes += `- ${change}\n`;
            });
            notes += '\n';
        }
        if (release.features.length > 0) {
            notes += `## ✨ Features\n\n`;
            release.features.forEach(feature => {
                notes += `- ${feature}\n`;
            });
            notes += '\n';
        }
        if (release.fixes.length > 0) {
            notes += `## 🐛 Bug Fixes\n\n`;
            release.fixes.forEach(fix => {
                notes += `- ${fix}\n`;
            });
            notes += '\n';
        }
        if (release.deprecations.length > 0) {
            notes += `## 🗑️ Deprecations\n\n`;
            release.deprecations.forEach(dep => {
                notes += `- ${dep}\n`;
            });
            notes += '\n';
        }
        notes += `## 🚀 What's Next\n\n`;
        roadmap.upcoming_features.slice(0, 5).forEach(feature => {
            notes += `- ${feature}\n`;
        });
        return notes;
    }
}
VersionManager.instance = null;
//# sourceMappingURL=version-manager.js.map