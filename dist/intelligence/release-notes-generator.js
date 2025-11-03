/* eslint-disable no-empty */
/**
 * VERSATIL Framework - Release Notes Generator
 *
 * Automatically generates comprehensive release notes from:
 * - Git commits since last release
 * - Session learnings from RAG
 * - Feature descriptions from code changes
 * - Breaking changes detection
 * - Upgrade instructions
 *
 * Output Format:
 * - What's New section
 * - Breaking Changes (if any)
 * - Files Added/Modified/Deleted
 * - Upgrade Instructions
 * - Benefits/Impact
 * - Documentation Links
 *
 * @version 7.14.0
 */
import { execSync } from 'child_process';
import { VERSATILLogger } from '../utils/logger.js';
export class ReleaseNotesGenerator {
    constructor(cwd = process.cwd()) {
        this.logger = new VERSATILLogger('ReleaseNotesGenerator');
        this.cwd = cwd;
    }
    /**
     * Generate complete release notes
     */
    async generateReleaseNotes(version, features) {
        const commits = await this.getCommitsSinceLastRelease();
        const filesChanged = await this.getFilesChanged();
        const title = this.generateTitle(features);
        const summary = this.generateSummary(features);
        const whatsNew = this.generateWhatsNew(features, commits);
        const breakingChanges = this.detectBreakingChanges(features, commits);
        const upgradeInstructions = this.generateUpgradeInstructions(version, breakingChanges);
        const benefits = this.generateBenefits(features);
        const documentation = this.generateDocumentationLinks(features);
        const technicalDetails = this.generateTechnicalDetails(features, filesChanged);
        return {
            version,
            title,
            summary,
            whatsNew,
            breakingChanges,
            filesChanged,
            upgradeInstructions,
            benefits,
            documentation,
            technicalDetails
        };
    }
    /**
     * Format release notes as markdown
     */
    formatAsMarkdown(notes) {
        let markdown = `# ${notes.version} - ${notes.title}\n\n`;
        markdown += `${notes.summary}\n\n`;
        // What's New
        if (notes.whatsNew.length > 0) {
            markdown += `## What's New\n\n`;
            notes.whatsNew.forEach(item => {
                markdown += `- ${item}\n`;
            });
            markdown += `\n`;
        }
        // Breaking Changes
        if (notes.breakingChanges.length > 0) {
            markdown += `## ⚠️ Breaking Changes\n\n`;
            notes.breakingChanges.forEach(change => {
                markdown += `- ${change}\n`;
            });
            markdown += `\n`;
        }
        // Upgrade Instructions
        if (notes.upgradeInstructions.length > 0) {
            markdown += `## Upgrade Instructions\n\n`;
            markdown += `\`\`\`bash\n`;
            notes.upgradeInstructions.forEach(instruction => {
                markdown += `${instruction}\n`;
            });
            markdown += `\`\`\`\n\n`;
        }
        // Benefits
        if (notes.benefits.length > 0) {
            markdown += `## Benefits\n\n`;
            notes.benefits.forEach(benefit => {
                markdown += `- ${benefit}\n`;
            });
            markdown += `\n`;
        }
        // Files Changed
        markdown += `## Files Changed\n\n`;
        if (notes.filesChanged.added.length > 0) {
            markdown += `**Added** (${notes.filesChanged.added.length} files):\n`;
            notes.filesChanged.added.slice(0, 10).forEach(file => {
                markdown += `- \`${file}\`\n`;
            });
            if (notes.filesChanged.added.length > 10) {
                markdown += `- ...and ${notes.filesChanged.added.length - 10} more\n`;
            }
            markdown += `\n`;
        }
        if (notes.filesChanged.modified.length > 0) {
            markdown += `**Modified** (${notes.filesChanged.modified.length} files):\n`;
            notes.filesChanged.modified.slice(0, 10).forEach(file => {
                markdown += `- \`${file}\`\n`;
            });
            if (notes.filesChanged.modified.length > 10) {
                markdown += `- ...and ${notes.filesChanged.modified.length - 10} more\n`;
            }
            markdown += `\n`;
        }
        if (notes.filesChanged.deleted.length > 0) {
            markdown += `**Deleted** (${notes.filesChanged.deleted.length} files):\n`;
            notes.filesChanged.deleted.forEach(file => {
                markdown += `- \`${file}\`\n`;
            });
            markdown += `\n`;
        }
        // Technical Details
        if (notes.technicalDetails.length > 0) {
            markdown += `## Technical Details\n\n`;
            notes.technicalDetails.forEach(detail => {
                markdown += `- ${detail}\n`;
            });
            markdown += `\n`;
        }
        // Documentation
        if (notes.documentation.length > 0) {
            markdown += `## Documentation\n\n`;
            notes.documentation.forEach(doc => {
                markdown += `- ${doc}\n`;
            });
            markdown += `\n`;
        }
        // Footer
        const lastVersion = this.getLastReleaseVersion();
        markdown += `---\n\n`;
        markdown += `**Full Changelog**: https://github.com/Nissimmiracles/versatil-sdlc-framework/compare/${lastVersion}...${notes.version}\n`;
        return markdown;
    }
    /**
     * Generate release title from features
     */
    generateTitle(features) {
        if (features.length === 0)
            return 'Updates';
        if (features.length === 1)
            return features[0].name;
        // Find most significant feature
        const sorted = features.sort((a, b) => b.confidence - a.confidence);
        return sorted[0].name;
    }
    /**
     * Generate release summary
     */
    generateSummary(features) {
        if (features.length === 0) {
            return 'Minor updates and improvements.';
        }
        const featureTypes = features.map(f => f.type);
        const hasBreaking = featureTypes.includes('breaking');
        const hasFeatures = featureTypes.includes('feature');
        const hasBugfixes = featureTypes.includes('bugfix');
        let summary = '';
        if (hasBreaking) {
            summary = 'This release includes breaking changes. Please review upgrade instructions carefully.';
        }
        else if (hasFeatures) {
            const featureNames = features
                .filter(f => f.type === 'feature')
                .map(f => f.name)
                .join(', ');
            summary = `This release introduces: ${featureNames}.`;
        }
        else if (hasBugfixes) {
            summary = 'This release includes bug fixes and improvements.';
        }
        else {
            summary = 'This release includes enhancements and updates.';
        }
        return summary;
    }
    /**
     * Generate What's New items
     */
    generateWhatsNew(features, commits) {
        const items = [];
        for (const feature of features) {
            let description = `**${feature.name}**`;
            if (feature.type === 'feature') {
                description += ` - New feature adding ${feature.files.length} files`;
            }
            else if (feature.type === 'breaking') {
                description += ` - ⚠️ Breaking changes (${feature.files.length} files affected)`;
            }
            else if (feature.type === 'bugfix') {
                description += ` - Bug fix (${feature.files.length} files)`;
            }
            else if (feature.type === 'enhancement') {
                description += ` - Enhancement (${feature.files.length} files improved)`;
            }
            items.push(description);
        }
        // Add notable commits
        commits
            .filter(c => c.includes('feat:') || c.includes('fix:'))
            .slice(0, 5)
            .forEach(commit => {
            const message = commit.split(' ').slice(1).join(' ');
            if (!items.some(item => item.includes(message.substring(0, 20)))) {
                items.push(message);
            }
        });
        return items;
    }
    /**
     * Detect breaking changes
     */
    detectBreakingChanges(features, commits) {
        const breakingChanges = [];
        // Check features
        features
            .filter(f => f.type === 'breaking')
            .forEach(f => {
            breakingChanges.push(`${f.name}: API changes in ${f.files.length} files`);
        });
        // Check commits
        commits
            .filter(c => c.toLowerCase().includes('breaking') || c.includes('BREAKING CHANGE:'))
            .forEach(commit => {
            const message = commit.split(' ').slice(1).join(' ');
            breakingChanges.push(message);
        });
        return breakingChanges;
    }
    /**
     * Generate upgrade instructions
     */
    generateUpgradeInstructions(version, breakingChanges) {
        const instructions = [];
        if (breakingChanges.length > 0) {
            instructions.push('# IMPORTANT: Breaking changes require manual migration');
            instructions.push('# Review breaking changes section before upgrading');
            instructions.push('');
        }
        instructions.push('# Via /update command (recommended)');
        instructions.push('/update');
        instructions.push('');
        instructions.push('# Or via npm');
        instructions.push('npm update @versatil/sdlc-framework');
        instructions.push('');
        instructions.push('# Verify version');
        instructions.push('npm list @versatil/sdlc-framework');
        instructions.push(`# Should show: ${version}`);
        return instructions;
    }
    /**
     * Generate benefits
     */
    generateBenefits(features) {
        const benefits = [];
        for (const feature of features) {
            if (feature.name.toLowerCase().includes('performance')) {
                benefits.push('⚡ Improved performance');
            }
            if (feature.name.toLowerCase().includes('testing') || feature.name.toLowerCase().includes('browser')) {
                benefits.push('🧪 Enhanced testing capabilities');
            }
            if (feature.name.toLowerCase().includes('guardian')) {
                benefits.push('🛡️ Improved monitoring and auto-remediation');
            }
            if (feature.name.toLowerCase().includes('intelligence') || feature.name.toLowerCase().includes('learning')) {
                benefits.push('🧠 Smarter AI assistance');
            }
        }
        if (benefits.length === 0) {
            benefits.push('✨ General improvements and enhancements');
        }
        return Array.from(new Set(benefits)); // Remove duplicates
    }
    /**
     * Generate documentation links
     */
    generateDocumentationLinks(features) {
        const links = [];
        for (const feature of features) {
            const docFiles = feature.files.filter(f => f.endsWith('.md') && f.includes('docs/'));
            docFiles.forEach(file => {
                links.push(`[${feature.name}](${file})`);
            });
        }
        // Always include CLAUDE.md if modified
        if (features.some(f => f.files.some(file => file === 'CLAUDE.md'))) {
            links.push('[Framework Guide](CLAUDE.md)');
        }
        return links;
    }
    /**
     * Generate technical details
     */
    generateTechnicalDetails(features, filesChanged) {
        const details = [];
        const totalFiles = filesChanged.added.length + filesChanged.modified.length + filesChanged.deleted.length;
        details.push(`Total files changed: ${totalFiles}`);
        const hasTests = features.some(f => f.files.some(file => file.includes('test') || file.includes('spec')));
        if (hasTests) {
            details.push('Includes new/updated tests');
        }
        const hasDocs = features.some(f => f.files.some(file => file.endsWith('.md')));
        if (hasDocs) {
            details.push('Documentation updated');
        }
        // Count lines of code (estimate)
        const estimatedLines = (filesChanged.added.length * 100) + (filesChanged.modified.length * 50);
        details.push(`Estimated ~${estimatedLines} lines of code added/modified`);
        return details;
    }
    /**
     * Get commits since last release
     */
    async getCommitsSinceLastRelease() {
        try {
            const lastVersion = this.getLastReleaseVersion();
            const commits = execSync(`git log ${lastVersion}..HEAD --oneline`, {
                cwd: this.cwd,
                encoding: 'utf-8'
            }).trim().split('\n').filter(Boolean);
            return commits;
        }
        catch {
            return [];
        }
    }
    /**
     * Get files changed
     */
    async getFilesChanged() {
        const added = [];
        const modified = [];
        const deleted = [];
        try {
            const statusOutput = execSync('git status --porcelain', {
                cwd: this.cwd,
                encoding: 'utf-8'
            });
            statusOutput.split('\n').filter(Boolean).forEach(line => {
                const status = line.substring(0, 2).trim();
                const file = line.substring(3);
                if (status === 'A' || status === '??') {
                    added.push(file);
                }
                else if (status === 'M') {
                    modified.push(file);
                }
                else if (status === 'D') {
                    deleted.push(file);
                }
            });
        }
        catch { }
        return { added, modified, deleted };
    }
    /**
     * Get last release version
     */
    getLastReleaseVersion() {
        try {
            const lastTag = execSync('git describe --tags --abbrev=0', {
                cwd: this.cwd,
                encoding: 'utf-8'
            }).trim();
            return lastTag;
        }
        catch {
            return 'v7.13.1'; // Fallback to current known version
        }
    }
}
//# sourceMappingURL=release-notes-generator.js.map