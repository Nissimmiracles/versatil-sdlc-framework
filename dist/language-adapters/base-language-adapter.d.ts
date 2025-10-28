/**
 * VERSATIL Framework v3.0.0 - Base Language Adapter
 *
 * Foundation for multi-language support enabling VERSATIL to work with
 * Python, Go, Rust, Java, and other languages beyond TypeScript.
 *
 * Each language adapter implements this interface to provide language-specific
 * functionality while maintaining OPERA methodology across all languages.
 */
export interface ProjectStructure {
    rootPath: string;
    language: string;
    packageManager?: string;
    mainFiles: string[];
    testFiles: string[];
    configFiles: string[];
    buildOutput?: string;
    dependencies: Record<string, string>;
}
export interface LanguageCapabilities {
    testing: boolean;
    linting: boolean;
    formatting: boolean;
    typeChecking: boolean;
    packageManagement: boolean;
    buildSystem: boolean;
}
export interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
    duration: number;
    details: Array<{
        name: string;
        status: 'passed' | 'failed' | 'skipped';
        duration: number;
        error?: string;
    }>;
}
export interface BuildResult {
    success: boolean;
    output: string;
    errors: string[];
    warnings: string[];
    artifacts: string[];
    duration: number;
}
export interface LintResult {
    errors: number;
    warnings: number;
    issues: Array<{
        file: string;
        line: number;
        column: number;
        severity: 'error' | 'warning' | 'info';
        message: string;
        rule?: string;
    }>;
}
/**
 * Base Language Adapter Interface
 *
 * All language-specific adapters must implement this interface
 */
export declare abstract class BaseLanguageAdapter {
    protected rootPath: string;
    protected projectStructure?: ProjectStructure;
    constructor(rootPath: string);
    /**
     * Detect if this adapter can handle the project
     */
    abstract detect(): Promise<boolean>;
    /**
     * Get language-specific capabilities
     */
    abstract getCapabilities(): LanguageCapabilities;
    /**
     * Analyze project structure
     */
    abstract analyzeProject(): Promise<ProjectStructure>;
    /**
     * Run tests
     */
    abstract runTests(options?: {
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestResult>;
    /**
     * Build project
     */
    abstract build(options?: {
        mode?: 'development' | 'production';
        target?: string;
        optimization?: boolean;
    }): Promise<BuildResult>;
    /**
     * Lint code
     */
    abstract lint(options?: {
        fix?: boolean;
        files?: string[];
    }): Promise<LintResult>;
    /**
     * Format code
     */
    abstract format(options?: {
        files?: string[];
        check?: boolean;
    }): Promise<{
        formatted: number;
        errors: string[];
    }>;
    /**
     * Install dependencies
     */
    abstract installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    /**
     * Get recommended OPERA agents for this language
     */
    abstract getRecommendedAgents(): string[];
    /**
     * Get language-specific quality metrics
     */
    abstract getQualityMetrics(): Promise<{
        testCoverage: number;
        lintScore: number;
        complexityScore: number;
        maintainability: number;
    }>;
    /**
     * Execute language-specific command
     */
    abstract executeCommand(command: string, args?: string[]): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
}
/**
 * Type for concrete language adapter classes (not abstract)
 */
export type ConcreteLanguageAdapter = new (rootPath: string) => BaseLanguageAdapter;
/**
 * Language Adapter Registry
 *
 * Manages all registered language adapters
 */
export declare class LanguageAdapterRegistry {
    private static adapters;
    private static instances;
    /**
     * Register a language adapter
     */
    static register(language: string, adapter: ConcreteLanguageAdapter): void;
    /**
     * Get adapter for a language
     */
    static get(language: string): ConcreteLanguageAdapter | undefined;
    /**
     * Get or create adapter instance for a project
     */
    static getInstance(language: string, rootPath: string): Promise<BaseLanguageAdapter | null>;
    /**
     * Detect language(s) for a project
     */
    static detectLanguages(rootPath: string): Promise<string[]>;
    /**
     * Get all registered languages
     */
    static getRegisteredLanguages(): string[];
}
/**
 * Universal Project Detector
 *
 * Automatically detects project type and selects appropriate adapters
 */
export declare class UniversalProjectDetector {
    private rootPath;
    constructor(rootPath: string);
    /**
     * Detect all languages used in project
     */
    detectAllLanguages(): Promise<string[]>;
    /**
     * Detect primary language (most prevalent)
     */
    detectPrimaryLanguage(): Promise<string | null>;
    /**
     * Get adapters for all detected languages
     */
    getAdapters(): Promise<BaseLanguageAdapter[]>;
    /**
     * Get comprehensive project analysis across all languages
     */
    analyzeProject(): Promise<{
        languages: string[];
        primaryLanguage: string | null;
        structures: ProjectStructure[];
        recommendedAgents: string[];
        capabilities: Record<string, LanguageCapabilities>;
    }>;
}
