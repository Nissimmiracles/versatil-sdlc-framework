/**
 * VERSATIL OPERA v6.1.0 - Project Scanner
 *
 * Deep project structure analysis for Oliver-Onboarding
 *
 * Scans:
 * - Tech stack detection (50+ technologies)
 * - Dependency analysis (outdated, vulnerable, unused)
 * - Test coverage analysis
 * - Documentation completeness
 * - Code quality metrics
 * - Project structure quality
 * - Performance indicators
 * - Accessibility compliance
 * - Security vulnerabilities
 *
 * @module ProjectScanner
 * @version 6.1.0
 */
export interface ScanResult {
    projectType: string;
    techStack: TechStackAnalysis;
    dependencies: DependencyAnalysis;
    testing: TestingAnalysis;
    documentation: DocumentationAnalysis;
    security: SecurityAnalysis;
    structure: StructureAnalysis;
    performance: PerformanceAnalysis;
    accessibility?: AccessibilityAnalysis;
    complexity: ComplexityAnalysis;
    timestamp: number;
}
export interface TechStackAnalysis {
    detected: string[];
    languages: string[];
    frameworks: string[];
    buildTools: string[];
    databases: string[];
    cloudProviders: string[];
    testing: string[];
}
export interface DependencyAnalysis {
    total: number;
    outdated: number;
    vulnerable: number;
    unused: number;
    outdatedPackages: Array<{
        name: string;
        current: string;
        latest: string;
    }>;
    vulnerabilities: Array<{
        package: string;
        severity: string;
        description: string;
    }>;
}
export interface TestingAnalysis {
    frameworks: string[];
    coverage: number;
    testFileCount: number;
    untestedFiles: string[];
    testQuality: number;
}
export interface DocumentationAnalysis {
    completeness: number;
    hasReadme: boolean;
    hasApiDocs: boolean;
    hasExamples: boolean;
    hasContributing: boolean;
    missingDocs: string[];
}
export interface SecurityAnalysis {
    vulnerabilities: Array<{
        package: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
        fix: string;
    }>;
    exposedSecrets: string[];
    insecurePatterns: string[];
}
export interface StructureAnalysis {
    quality: number;
    hasSourceDir: boolean;
    hasTestDir: boolean;
    hasDocsDir: boolean;
    hasBuildConfig: boolean;
    issues: string[];
}
export interface PerformanceAnalysis {
    score: number;
    slowFiles: string[];
    bundleSize: number;
    optimizationOpportunities: string[];
}
export interface AccessibilityAnalysis {
    score: number;
    violations: Array<{
        type: string;
        severity: 'critical' | 'serious' | 'moderate' | 'minor';
        file: string;
        description: string;
    }>;
}
export interface ComplexityAnalysis {
    score: number;
    totalFiles: number;
    totalLines: number;
    avgLinesPerFile: number;
    cyclomaticComplexity: number;
    duplicateCode: number;
}
export declare class ProjectScanner {
    private logger;
    private projectRoot;
    private skipPatterns;
    constructor(projectRoot: string, skipPatterns?: string[]);
    /**
     * Main scan method
     */
    scan(): Promise<ScanResult>;
    /**
     * Analyze tech stack (50+ technologies)
     */
    private analyzeTechStack;
    /**
     * Analyze dependencies
     */
    private analyzeDependencies;
    /**
     * Analyze testing
     */
    private analyzeTesting;
    /**
     * Analyze documentation
     */
    private analyzeDocumentation;
    /**
     * Analyze security
     */
    private analyzeSecurity;
    /**
     * Analyze structure
     */
    private analyzeStructure;
    /**
     * Analyze performance
     */
    private analyzePerformance;
    /**
     * Analyze accessibility
     */
    private analyzeAccessibility;
    /**
     * Analyze complexity
     */
    private analyzeComplexity;
    /**
     * Determine project type
     */
    private determineProjectType;
    /**
     * Check if file exists
     */
    private fileExists;
}
