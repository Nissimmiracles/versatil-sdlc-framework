/**
 * Session Pattern Extractor
 *
 * Extracts reusable patterns from completed development sessions.
 * Part of Stop Hook Learning Codification system.
 *
 * Pattern Types Extracted:
 * - Code patterns (repeated structures, common solutions)
 * - Debugging strategies (error → fix mappings)
 * - Performance optimizations
 * - Test patterns
 * - API design patterns
 * - Database schema patterns
 */
export interface SessionMetrics {
    sessionId: string;
    agent: string;
    duration: number;
    timestamp: string;
    actions: string[];
    filesChanged: string[];
    linesAdded: number;
    linesRemoved: number;
}
export interface ExtractedPattern {
    id: string;
    type: PatternType;
    category: PatternCategory;
    title: string;
    description: string;
    code?: string;
    context: PatternContext;
    metadata: PatternMetadata;
    examples: CodeExample[];
    tags: string[];
}
export declare enum PatternType {
    CODE = "code",
    DEBUGGING = "debugging",
    PERFORMANCE = "performance",
    TESTING = "testing",
    API_DESIGN = "api_design",
    DATABASE = "database",
    ARCHITECTURE = "architecture",
    REFACTORING = "refactoring"
}
export declare enum PatternCategory {
    SOLUTION = "solution",
    OPTIMIZATION = "optimization",
    BUG_FIX = "bug_fix",
    FEATURE = "feature",
    TEST = "test",
    DOCUMENTATION = "documentation"
}
export interface PatternContext {
    agent: string;
    sessionId: string;
    timestamp: string;
    fileTypes: string[];
    frameworks: string[];
    languages: string[];
    complexity: 'simple' | 'medium' | 'complex';
}
export interface PatternMetadata {
    confidence: number;
    reusability: number;
    effectiveness: number;
    frequency: number;
    projectType?: string;
    relatedFiles: string[];
}
export interface CodeExample {
    before?: string;
    after: string;
    explanation: string;
    filePath: string;
    lineRange?: {
        start: number;
        end: number;
    };
}
export interface FileChange {
    path: string;
    type: 'added' | 'modified' | 'deleted';
    language: string;
    additions: number;
    deletions: number;
    diff: string;
}
export interface SessionAnalysis {
    sessionMetrics: SessionMetrics;
    fileChanges: FileChange[];
    patterns: ExtractedPattern[];
    insights: string[];
    recommendations: string[];
}
export declare class SessionPatternExtractor {
    private logger;
    private workingDir;
    constructor(workingDir?: string);
    /**
     * Extract patterns from a completed session
     */
    extractFromSession(sessionId: string): Promise<SessionAnalysis>;
    /**
     * Load session metrics from log file
     */
    private loadSessionMetrics;
    /**
     * Analyze git changes since session start
     */
    private analyzeGitChanges;
    /**
     * Extract patterns from file changes
     */
    private extractPatterns;
    /**
     * Extract code patterns (repeated structures, common solutions)
     */
    private extractCodePatterns;
    /**
     * Extract test patterns
     */
    private extractTestPatterns;
    /**
     * Extract API design patterns
     */
    private extractAPIPatterns;
    /**
     * Extract database patterns
     */
    private extractDatabasePatterns;
    /**
     * Extract performance optimization patterns
     */
    private extractPerformancePatterns;
    /**
     * Extract debugging patterns (error → fix mappings)
     */
    private extractDebuggingPatterns;
    /**
     * Generate insights from analysis
     */
    private generateInsights;
    /**
     * Generate recommendations for future sessions
     */
    private generateRecommendations;
    private generatePatternId;
    private hashString;
    private buildContext;
    private shouldIgnoreFile;
    private detectLanguage;
    private detectFrameworks;
    private getFileDiff;
    private countDiffLines;
    private extractAddedLines;
    private extractRemovedLines;
    private isReactComponent;
    private isAPIEndpoint;
    private hasErrorHandling;
    private hasValidation;
    private isTestFile;
    private isDatabaseFile;
    private looksLikeBugFix;
    private similarity;
    private levenshteinDistance;
    private extractErrorHandlingCode;
    private extractValidationCode;
    private extractMemoizationCode;
    private estimateComplexity;
}
export default SessionPatternExtractor;
