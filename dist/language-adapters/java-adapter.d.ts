/**
 * VERSATIL Framework v3.0.0 - Java Language Adapter
 *
 * Enables VERSATIL to work with Java projects, supporting Maven, Gradle, JUnit,
 * Checkstyle, SpotBugs, and the entire Java ecosystem.
 *
 * OPERA agents can now orchestrate Java development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class JavaAdapter extends BaseLanguageAdapter {
    private buildTool;
    private javaVersion?;
    /**
     * Detect if this is a Java project
     */
    detect(): Promise<boolean>;
    /**
     * Get Java-specific capabilities
     */
    getCapabilities(): LanguageCapabilities;
    /**
     * Analyze Java project structure
     */
    analyzeProject(): Promise<ProjectStructure>;
    /**
     * Run Java tests using JUnit
     */
    runTests(options?: {
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestResult>;
    /**
     * Build Java project using Maven or Gradle
     */
    build(options?: {
        mode?: 'development' | 'production';
        target?: string;
        optimization?: boolean;
    }): Promise<BuildResult>;
    /**
     * Lint Java code using Checkstyle and SpotBugs
     */
    lint(options?: {
        fix?: boolean;
        files?: string[];
    }): Promise<LintResult>;
    /**
     * Format Java code using google-java-format
     */
    format(options?: {
        files?: string[];
        check?: boolean;
    }): Promise<{
        formatted: number;
        errors: string[];
    }>;
    /**
     * Install Java dependencies
     */
    installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    /**
     * Get recommended OPERA agents for Java projects
     */
    getRecommendedAgents(): string[];
    /**
     * Get Java-specific quality metrics
     */
    getQualityMetrics(): Promise<{
        testCoverage: number;
        lintScore: number;
        complexityScore: number;
        maintainability: number;
    }>;
    /**
     * Execute Java-specific command
     */
    executeCommand(command: string, args?: string[]): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    private detectBuildTool;
    private findJavaFiles;
    private parseDependencies;
    private parseDependencyNames;
}
