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
import type { FeatureDetection } from './release-detector.js';
export interface ReleaseNotes {
    version: string;
    title: string;
    summary: string;
    whatsNew: string[];
    breakingChanges: string[];
    filesChanged: {
        added: string[];
        modified: string[];
        deleted: string[];
    };
    upgradeInstructions: string[];
    benefits: string[];
    documentation: string[];
    technicalDetails: string[];
}
export declare class ReleaseNotesGenerator {
    private logger;
    private cwd;
    constructor(cwd?: string);
    /**
     * Generate complete release notes
     */
    generateReleaseNotes(version: string, features: FeatureDetection[]): Promise<ReleaseNotes>;
    /**
     * Format release notes as markdown
     */
    formatAsMarkdown(notes: ReleaseNotes): string;
    /**
     * Generate release title from features
     */
    private generateTitle;
    /**
     * Generate release summary
     */
    private generateSummary;
    /**
     * Generate What's New items
     */
    private generateWhatsNew;
    /**
     * Detect breaking changes
     */
    private detectBreakingChanges;
    /**
     * Generate upgrade instructions
     */
    private generateUpgradeInstructions;
    /**
     * Generate benefits
     */
    private generateBenefits;
    /**
     * Generate documentation links
     */
    private generateDocumentationLinks;
    /**
     * Generate technical details
     */
    private generateTechnicalDetails;
    /**
     * Get commits since last release
     */
    private getCommitsSinceLastRelease;
    /**
     * Get files changed
     */
    private getFilesChanged;
    /**
     * Get last release version
     */
    private getLastReleaseVersion;
}
