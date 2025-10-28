/**
 * VERSATIL Framework v3.0.0 - Rust Language Adapter
 *
 * Enables VERSATIL to work with Rust projects, supporting cargo test, cargo build,
 * clippy, rustfmt, and the entire Rust toolchain.
 *
 * OPERA agents can now orchestrate Rust development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class RustAdapter extends BaseLanguageAdapter {
    private rustVersion?;
    private packageName?;
    /**
     * Detect if this is a Rust project
     */
    detect(): Promise<boolean>;
    /**
     * Get Rust-specific capabilities
     */
    getCapabilities(): LanguageCapabilities;
    /**
     * Analyze Rust project structure
     */
    analyzeProject(): Promise<ProjectStructure>;
    /**
     * Run Rust tests using cargo test
     */
    runTests(options?: {
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestResult>;
    /**
     * Build Rust project using cargo build
     */
    build(options?: {
        mode?: 'development' | 'production';
        target?: string;
        optimization?: boolean;
    }): Promise<BuildResult>;
    /**
     * Lint Rust code using clippy
     */
    lint(options?: {
        fix?: boolean;
        files?: string[];
    }): Promise<LintResult>;
    /**
     * Format Rust code using rustfmt
     */
    format(options?: {
        files?: string[];
        check?: boolean;
    }): Promise<{
        formatted: number;
        errors: string[];
    }>;
    /**
     * Install Rust dependencies using cargo
     */
    installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    /**
     * Get recommended OPERA agents for Rust projects
     */
    getRecommendedAgents(): string[];
    /**
     * Get Rust-specific quality metrics
     */
    getQualityMetrics(): Promise<{
        testCoverage: number;
        lintScore: number;
        complexityScore: number;
        maintainability: number;
    }>;
    /**
     * Execute Rust-specific command
     */
    executeCommand(command: string, args?: string[]): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    private findRustFiles;
    private parseDependencies;
    private parseDependencyNames;
}
