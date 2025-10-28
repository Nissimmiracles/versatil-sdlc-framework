/**
 * VERSATIL SDLC Framework - AST Naming Convention Analyzer
 *
 * Analyzes TypeScript/JavaScript code for naming convention violations using AST parsing.
 * Detects: camelCase, PascalCase, snake_case, UPPER_SNAKE_CASE
 *
 * Part of Guardian's Context Layer Verification (v7.9.0)
 */
export interface NamingConventionPreferences {
    variables: 'camelCase' | 'snake_case' | 'PascalCase';
    functions: 'camelCase' | 'snake_case' | 'PascalCase';
    classes: 'PascalCase' | 'camelCase';
    interfaces: 'PascalCase' | 'camelCase';
    constants: 'UPPER_SNAKE_CASE' | 'camelCase' | 'PascalCase';
    methods: 'camelCase' | 'snake_case';
    properties: 'camelCase' | 'snake_case';
}
export interface NamingViolation {
    identifier: string;
    line: number;
    column: number;
    type: 'variable' | 'function' | 'class' | 'interface' | 'constant' | 'method' | 'property';
    expected: string;
    actual: string;
    suggestion?: string;
}
export interface ConventionDistribution {
    camelCase: number;
    PascalCase: number;
    snake_case: number;
    UPPER_SNAKE_CASE: number;
    other: number;
}
export interface NamingAnalysisResult {
    filePath: string;
    totalIdentifiers: number;
    violations: NamingViolation[];
    conformanceRate: number;
    distribution: {
        variables: ConventionDistribution;
        functions: ConventionDistribution;
        classes: ConventionDistribution;
        methods: ConventionDistribution;
        properties: ConventionDistribution;
    };
    summary: string;
}
/**
 * Main entry point: Analyze naming conventions in a TypeScript/JavaScript file
 */
export declare function analyzeNamingConventions(filePath: string, userPreferences: NamingConventionPreferences): Promise<NamingAnalysisResult>;
