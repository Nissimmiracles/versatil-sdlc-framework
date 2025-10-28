/**
 * Automated Changelog Generator
 * Generates beautiful changelogs from git commits using conventional commit format
 */
export interface CommitInfo {
    hash: string;
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    breaking?: boolean;
    author: string;
    date: Date;
    pr?: string;
}
export interface ChangelogEntry {
    version: string;
    date: Date;
    features: CommitInfo[];
    fixes: CommitInfo[];
    breaking: CommitInfo[];
    chores: CommitInfo[];
    docs: CommitInfo[];
    refactor: CommitInfo[];
    performance: CommitInfo[];
    tests: CommitInfo[];
}
export declare class ChangelogGenerator {
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Generate changelog from git history
     */
    generateChangelog(fromTag?: string, toTag?: string): Promise<string>;
    /**
     * Update CHANGELOG.md file
     */
    updateChangelogFile(newEntry: string): Promise<void>;
    /**
     * Get commits since last tag or from beginning
     */
    private getCommitsSince;
    /**
     * Parse conventional commit format
     */
    private parseCommit;
    private createFallbackCommit;
    /**
     * Get commit author
     */
    private getCommitAuthor;
    /**
     * Get commit date
     */
    private getCommitDate;
    /**
     * Extract PR number from commit message
     */
    private extractPRNumber;
    /**
     * Get current version from package.json
     */
    private getCurrentVersion;
    /**
     * Format changelog entry
     */
    private formatChangelog;
    /**
     * Get changelog header
     */
    private getChangelogHeader;
    /**
     * Generate release notes for GitHub
     */
    generateReleaseNotes(version: string): Promise<string>;
    /**
     * Auto-generate changelog for current changes
     */
    autoGenerateChangelog(): Promise<void>;
    /**
     * Get last git tag
     */
    private getLastTag;
}
export declare const changelogGenerator: ChangelogGenerator;
