/**
 * VERSATIL Framework v3.0.0 - Ruby Language Adapter
 *
 * Enables VERSATIL to work with Ruby projects, supporting Bundler, RSpec,
 * RuboCop, and the entire Ruby ecosystem.
 *
 * OPERA agents can now orchestrate Ruby development workflows.
 */
import { BaseLanguageAdapter, ProjectStructure, LanguageCapabilities, TestResult, BuildResult, LintResult } from './base-language-adapter.js';
export declare class RubyAdapter extends BaseLanguageAdapter {
    private rubyVersion?;
    private gemName?;
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
    private findRubyFiles;
    private parseDependencies;
    private parseDependencyNames;
}
