/**
 * VERSATIL SDLC Framework - Automated Bug Collection and Release System
 * Rule 5: Intelligent bug tracking, collection, and automated version releases
 */
import { EventEmitter } from 'events';
export interface BugReport {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'security' | 'performance' | 'functionality' | 'ui' | 'compatibility';
    environment: {
        os: string;
        nodeVersion: string;
        frameworkVersion: string;
        dependencies: Record<string, string>;
    };
    stackTrace?: string;
    reproductionSteps: string[];
    expectedBehavior: string;
    actualBehavior: string;
    reportedAt: Date;
    reportedBy: string;
    status: 'open' | 'investigating' | 'fixed' | 'closed' | 'wont_fix';
    assignee?: string;
    fixCommit?: string;
    releaseVersion?: string;
}
export interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    assignee?: string;
    milestone?: string;
}
export interface ReleaseCandidate {
    version: string;
    type: 'patch' | 'minor' | 'major';
    bugFixes: BugReport[];
    features: string[];
    breakingChanges: string[];
    testsPassing: boolean;
    securityAuditPassed: boolean;
    performanceImproved: boolean;
    recommendedReleaseDate: Date;
}
export interface CodeRabbitIntegration {
    enabled: boolean;
    apiKey?: string;
    repoConfig: {
        owner: string;
        repo: string;
        branch: string;
    };
    reviewSettings: {
        autoReview: boolean;
        minApprovals: number;
        enforceConventions: boolean;
        qualityGate: number;
    };
}
export declare class BugCollectionReleaseSystem extends EventEmitter {
    private logger;
    private ragOrchestrator?;
    private auditSystem?;
    private projectRoot;
    private bugDatabase;
    private gitHubIssues;
    private currentVersion;
    private pendingBugFixes;
    private releaseHistory;
    private codeRabbitConfig;
    private githubToken?;
    private githubRepo;
    constructor(projectRoot: string, githubRepo?: string);
    /**
     * Initialize the bug collection and release system
     */
    private initializeSystem;
    /**
     * Setup CodeRabbit integration for enhanced code review
     */
    private setupCodeRabbitIntegration;
    /**
     * Create default CodeRabbit configuration
     */
    private createCodeRabbitConfig;
    /**
     * Setup CodeRabbit webhooks for automated reviews
     */
    private setupCodeRabbitWebhooks;
    /**
     * Automatically collect bugs from various sources
     */
    collectBugsAutomatically(): Promise<BugReport[]>;
    /**
     * Collect bugs from GitHub issues
     */
    private collectFromGitHubIssues;
    /**
     * Collect bugs from error logs
     */
    private collectFromErrorLogs;
    /**
     * Collect bugs from failed tests
     */
    private collectFromFailedTests;
    /**
     * Analyze bug patterns and prioritize fixes
     */
    analyzeBugPatterns(): Promise<{
        criticalIssues: BugReport[];
        patterns: {
            pattern: string;
            count: number;
            examples: BugReport[];
        }[];
        recommendations: string[];
    }>;
    /**
     * Generate release candidate based on collected bugs and fixes
     */
    generateReleaseCandidate(): Promise<ReleaseCandidate>;
    /**
     * Automatically create and publish release
     */
    createAutomaticRelease(candidate: ReleaseCandidate): Promise<{
        success: boolean;
        releaseUrl?: string;
        errors?: string[];
    }>;
    /**
     * Setup automated monitoring for continuous bug detection
     */
    private startAutomatedMonitoring;
    /**
     * Integrate with CodeRabbit for enhanced code quality
     */
    integrateWithCodeRabbit(): Promise<{
        success: boolean;
        features: string[];
        recommendations: string[];
    }>;
    private loadBugDatabase;
    private loadCurrentVersion;
    private setupGitHubIntegration;
    private fetchGitHubIssues;
    private isBugIssue;
    private convertGitHubIssueToBugReport;
    private determineSeverityFromLabels;
    private determineCategoryFromLabels;
    private getEnvironmentInfo;
    private extractReproductionSteps;
    private extractExpectedBehavior;
    private extractActualBehavior;
    private collectFromUserFeedback;
    private collectFromSecurityScans;
    private processBugReports;
    private findLogFiles;
    private parseErrorsFromLog;
    private convertErrorToBugReport;
    private parseTestFailures;
    private convertTestFailureToBugReport;
    private identifyBugPatterns;
    private generateBugFixRecommendations;
    private determineVersionIncrement;
    private getNewFeatures;
    private detectBreakingChanges;
    private runAllTests;
    private runSecurityAudit;
    private checkPerformanceImprovement;
    private incrementVersion;
    private validateReleaseCandidate;
    private generateChangelog;
    private updatePackageVersion;
    private createGitTag;
    private buildRelease;
    private createGitHubRelease;
    private publishToNpm;
    private yamlStringify;
    /**
     * Get system status and metrics
     */
    getSystemStatus(): {
        bugCount: number;
        criticalBugs: number;
        lastRelease: string;
        pendingFixes: number;
        codeRabbitEnabled: boolean;
    };
}
