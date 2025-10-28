/**
 * VERSATIL Framework v3.0.0 - PHP Language Adapter
 *
 * Enables VERSATIL to work with PHP projects, supporting Composer, PHPUnit,
 * PHP_CodeSniffer, PHPStan, and the entire PHP ecosystem.
 *
 * OPERA agents can now orchestrate PHP development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class PHPAdapter extends BaseLanguageAdapter {
    private phpVersion?;
    private packageName?;
    detect(): Promise<boolean>;
    getCapabilities(): LanguageCapabilities;
    analyzeProject(): Promise<ProjectStructure>;
    runTests(options?: any): Promise<TestResult>;
    build(options?: any): Promise<BuildResult>;
    lint(options?: any): Promise<LintResult>;
    format(options?: any): Promise<{
        formatted: number;
        errors: string[];
    }>;
    installDependencies(): Promise<{
        success: boolean;
        installed: string[];
        errors: string[];
    }>;
    getRecommendedAgents(): string[];
    getQualityMetrics(): Promise<any>;
    executeCommand(command: string, args?: string[]): Promise<any>;
    private findPHPFiles;
    private parseDependencies;
    private parseDependencyNames;
}
