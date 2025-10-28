/**
 * UX Report Generator
 *
 * Generates comprehensive UX reports with priority roadmaps, actionable
 * recommendations, and executive summaries. Supports multiple export formats.
 *
 * @module UXReportGenerator
 */
export interface UXReportData {
    timestamp: Date;
    overallScore: number;
    visualConsistency?: any;
    uxEvaluation?: any;
    markdownAnalysis?: any;
    criticalIssues: UXIssue[];
    recommendations: UXRecommendation[];
    whatWorksWell: string[];
    metadata?: ReportMetadata;
}
export interface ReportMetadata {
    projectName?: string;
    version?: string;
    reviewedBy?: string;
    reviewDuration?: string;
    filesReviewed?: number;
    componentsReviewed?: number;
}
export interface UXIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'visual-consistency' | 'user-experience' | 'accessibility' | 'performance' | 'markdown';
    title: string;
    description: string;
    impact: string;
    affectedUserRoles?: string[];
    currentState: string;
    recommendedSolution: string;
    file?: string;
    line?: number;
    estimatedFixTime?: string;
}
export interface UXRecommendation {
    id: string;
    type: 'immediate' | 'systematic' | 'enhancement';
    category: string;
    title: string;
    description: string;
    implementation: ImplementationDetails;
    estimatedEffort: 'quick-win' | 'small' | 'medium' | 'large';
    expectedImpact: 'high' | 'medium' | 'low';
    priority?: number;
}
export interface ImplementationDetails {
    steps: string[];
    codeExamples?: CodeExample[];
    cssChanges?: string;
    componentRefactoring?: string;
    dependencies?: string[];
}
export interface CodeExample {
    language: string;
    before?: string;
    after: string;
    description: string;
    file?: string;
}
export interface PriorityRoadmap {
    priority1Critical: RoadmapPhase;
    priority2High: RoadmapPhase;
    priority3Medium: RoadmapPhase;
    priority4Low: RoadmapPhase;
}
export interface RoadmapPhase {
    title: string;
    description: string;
    items: RoadmapItem[];
    estimatedTotalTime: string;
    expectedImpact: string;
}
export interface RoadmapItem {
    title: string;
    description: string;
    estimatedTime: string;
    dependencies: string[];
    category: string;
    relatedIssues: string[];
}
export interface ExportOptions {
    format: 'markdown' | 'json' | 'html' | 'pdf';
    includeCodeExamples: boolean;
    includeScreenshots: boolean;
    includeMetrics: boolean;
    groupByCategory: boolean;
}
export declare class UXReportGenerator {
    /**
     * Generate comprehensive UX report
     */
    generateReport(data: UXReportData, options?: Partial<ExportOptions>): string;
    /**
     * Generate priority roadmap from issues and recommendations
     */
    generatePriorityRoadmap(issues: UXIssue[], recommendations: UXRecommendation[]): PriorityRoadmap;
    /**
     * Calculate UX score from component scores
     */
    calculateOverallScore(componentScores: Record<string, number>): number;
    private generateMarkdownReport;
    private generateMarkdownHeader;
    private generateExecutiveSummary;
    private generateKeyFindings;
    private generateStrengthsSection;
    private generateCriticalIssuesSection;
    private generateRecommendationsSection;
    private formatRecommendations;
    private generateRoadmapSection;
    private generateDetailedAnalysis;
    private generateMarkdownFooter;
    private generateJSONReport;
    private generateHTMLReport;
    private createRoadmapItems;
    private calculateTotalTime;
    private parseTimeEstimate;
    private estimateTimeFromEffort;
    private estimateTimeFromSeverity;
    private getScoreEmoji;
    private getScoreRating;
    private getScoreDescription;
    private getSeverityIcon;
    private formatCategoryName;
    private formatEffort;
    private groupBy;
    private countBySeverity;
    private countByType;
    private generateReportId;
    private markdownToHTML;
}
