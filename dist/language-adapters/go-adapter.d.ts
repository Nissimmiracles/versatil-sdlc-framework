/**
 * VERSATIL Framework v3.0.0 - Go Language Adapter
 *
 * Enables VERSATIL to work with Go projects, supporting go test, go build,
 * golint, gofmt, and the entire Go toolchain.
 *
 * OPERA agents can now orchestrate Go development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class GoAdapter extends BaseLanguageAdapter {
    private goVersion?;
    private modulePath?;
    /**
     * Detect if this is a Go project
     */
    detect(): Promise<boolean>;
    /**
     * Get Go-specific capabilities
     */
    getCapabilities(): LanguageCapabilities;
    /**
     * Analyze Go project structure
     */
    analyzeProject(): Promise<ProjectStructure>;
    /**
     * Run Go tests
     */
    runTests(options?: {
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestResult>;
    /**
     * Build Go project
     */
    build(options?: {
        mode?: 'development' | 'production';
        target?: string;
        optimization?: boolean;
    }): Promise<BuildResult>;
    /**
     * Lint Go code using golangci-lint
     */
    lint(options?: {
        fix?: boolean;
        files?: string[];
    }): Promise<LintResult>;
    /**
     * Format Go code using gofmt
     */
    format(options?: {
        files?: string[];
        check?: boolean;
    }): Promise<{
        formatted: number;
        errors: string[];
    }>;
    /**
     * Install Go dependencies
     */
    installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    /**
     * Get recommended OPERA agents for Go projects
     */
    getRecommendedAgents(): string[];
    /**
     * Get Go-specific quality metrics
     */
    getQualityMetrics(): Promise<{
        testCoverage: number;
        lintScore: number;
        complexityScore: number;
        maintainability: number;
    }>;
    /**
     * Execute Go-specific command
     */
    executeCommand(command: string, args?: string[]): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    private findGoFiles;
    private parseDependencies;
}
