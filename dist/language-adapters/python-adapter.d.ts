/**
 * VERSATIL Framework v3.0.0 - Python Language Adapter
 *
 * Enables VERSATIL to work with Python projects, supporting pytest, poetry, pip,
 * pylint, black, mypy, and other Python ecosystem tools.
 *
 * OPERA agents can now orchestrate Python development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class PythonAdapter extends BaseLanguageAdapter {
    private packageManager;
    private pythonVersion?;
    /**
     * Detect if this is a Python project
     */
    detect(): Promise<boolean>;
    /**
     * Get Python-specific capabilities
     */
    getCapabilities(): LanguageCapabilities;
    /**
     * Analyze Python project structure
     */
    analyzeProject(): Promise<ProjectStructure>;
    /**
     * Run Python tests using pytest
     */
    runTests(options?: {
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestResult>;
    /**
     * Build Python package
     */
    build(options?: {
        mode?: 'development' | 'production';
        target?: string;
        optimization?: boolean;
    }): Promise<BuildResult>;
    /**
     * Lint Python code using pylint/flake8
     */
    lint(options?: {
        fix?: boolean;
        files?: string[];
    }): Promise<LintResult>;
    /**
     * Format Python code using black
     */
    format(options?: {
        files?: string[];
        check?: boolean;
    }): Promise<{
        formatted: number;
        errors: string[];
    }>;
    /**
     * Install Python dependencies
     */
    installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    /**
     * Get recommended OPERA agents for Python projects
     */
    getRecommendedAgents(): string[];
    /**
     * Get Python-specific quality metrics
     */
    getQualityMetrics(): Promise<{
        testCoverage: number;
        lintScore: number;
        complexityScore: number;
        maintainability: number;
    }>;
    /**
     * Execute Python-specific command
     */
    executeCommand(command: string, args?: string[]): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    private detectPackageManager;
    private findPythonFiles;
    private parseDependencies;
    private parseTestOutput;
}
