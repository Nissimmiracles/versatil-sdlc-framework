/**
 * Repository Analyzer for Sarah-PM
 * Automatically analyzes project structure and identifies organizational issues
 */
import { EventEmitter } from 'events';
export interface RepositoryIssue {
    severity: 'P0' | 'P1' | 'P2' | 'P3';
    category: 'structure' | 'organization' | 'cleanup' | 'missing' | 'security';
    title: string;
    description: string;
    files?: string[];
    recommendation: string;
    autoFixable: boolean;
}
export interface RepositoryHealth {
    score: number;
    totalIssues: number;
    issuesBySeverity: {
        P0: number;
        P1: number;
        P2: number;
        P3: number;
    };
    categories: {
        structure: number;
        organization: number;
        cleanup: number;
        missing: number;
        security: number;
    };
}
export interface AnalysisResult {
    projectPath: string;
    analyzedAt: Date;
    health: RepositoryHealth;
    issues: RepositoryIssue[];
    statistics: RepositoryStatistics;
    recommendations: string[];
}
export interface RepositoryStatistics {
    totalFiles: number;
    totalDirectories: number;
    filesByExtension: Record<string, number>;
    largestFiles: Array<{
        path: string;
        size: number;
    }>;
    documentationCoverage: number;
    testCoverage: {
        hasTests: boolean;
        testFiles: number;
        sourceFiles: number;
    };
}
export interface AnalyzerConfig {
    ignorePaths: string[];
    standardDirectories: string[];
    maxFileSize: number;
    checkGitignore: boolean;
}
export declare class RepositoryAnalyzer extends EventEmitter {
    private config;
    private readonly STANDARD_DIRS;
    private readonly ROOT_FILES;
    private readonly DOC_PATTERNS;
    private readonly IGNORE_PATTERNS;
    constructor(config?: Partial<AnalyzerConfig>);
    /**
     * Analyze repository structure and identify issues
     */
    analyze(projectPath: string): Promise<AnalysisResult>;
    /**
     * Recursively scan directory
     */
    private scanDirectory;
    /**
     * Check for standard project directories
     */
    private checkStandardDirectories;
    /**
     * Check for orphaned documentation files
     */
    private checkOrphanedDocs;
    /**
     * Check .gitignore for common issues
     */
    private checkGitignore;
    /**
     * Check for cleanup opportunities
     */
    private checkCleanupNeeded;
    /**
     * Calculate repository health score
     */
    private calculateHealth;
    /**
     * Calculate documentation coverage
     */
    private calculateDocCoverage;
    /**
     * Generate recommendations based on issues
     */
    private generateRecommendations;
    /**
     * Helper: Should path be ignored?
     */
    private shouldIgnore;
    /**
     * Helper: Is this a documentation file?
     */
    private isDocumentationFile;
    /**
     * Helper: Is this a test file?
     */
    private isTestFile;
    /**
     * Helper: Is this a source file?
     */
    private isSourceFile;
}
