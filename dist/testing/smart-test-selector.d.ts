/**
 * Smart Test Selector
 * Selects only affected tests based on git diff and dependency analysis
 *
 * Version: 1.0.0
 * Purpose: Reduce test execution time by 60-80% through intelligent test selection
 */
import { TestType } from './test-trigger-matrix.js';
export interface TestSelection {
    direct: string[];
    indirect: string[];
    all: string[];
    estimatedDuration: number;
    reasoning: string[];
}
export interface DependencyGraph {
    [filePath: string]: {
        imports: string[];
        importedBy: string[];
        testFiles: string[];
    };
}
export declare class SmartTestSelector {
    private projectRoot;
    private dependencyGraph;
    private testFilePatterns;
    constructor(projectRoot: string);
    /**
     * Select tests to run based on changed files
     */
    selectTests(changedFiles: string[], testTypes: TestType[], options?: {
        includeIndirect?: boolean;
        maxTests?: number;
        fullSuiteThreshold?: number;
    }): Promise<TestSelection>;
    /**
     * Get changed files from git diff
     */
    getChangedFiles(sinceCommit?: string): Promise<string[]>;
    /**
     * Build dependency graph for the project
     */
    private buildDependencyGraph;
    /**
     * Analyze a file and extract imports
     */
    private analyzeFile;
    /**
     * Extract import statements from file content
     */
    private extractImports;
    /**
     * Resolve relative import path to absolute path
     */
    private resolveImportPath;
    /**
     * Build reverse references (importedBy) in dependency graph
     */
    private buildReverseReferences;
    /**
     * Find test file for a source file
     */
    private findTestFile;
    /**
     * Find indirect tests affected by a file change
     */
    private findIndirectTests;
    /**
     * Check if a file is a test file
     */
    private isTestFile;
    /**
     * Get source file being tested by a test file
     */
    private getTestedFile;
    /**
     * Normalize file path (relative to project root)
     */
    private normalizeFilePath;
    /**
     * Clear dependency graph cache (call after major file changes)
     */
    clearCache(): void;
}
export default SmartTestSelector;
