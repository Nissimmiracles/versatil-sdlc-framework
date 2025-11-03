/**
 * VERSATIL SDLC Framework - Architectural Validator
 *
 * Implements cross-file architectural validation to prevent:
 * - Orphaned page components (pages without routes)
 * - Broken navigation (menu items without routes)
 * - Incomplete deliverables (partial multi-file implementations)
 * - Duplicate implementations (multiple versions of same feature)
 *
 * This addresses the critical gap identified in the production audit:
 * "Framework has excellent detection but ZERO enforcement mechanisms"
 *
 * @see docs/audit/production-audit-report.md - Critical Failures #1-4
 */
export interface ArchitecturalViolation {
    severity: 'blocker' | 'critical' | 'major' | 'minor';
    rule: string;
    message: string;
    file: string;
    line?: number;
    relatedFiles?: string[];
    fixSuggestion?: string;
    autoFixAvailable: boolean;
}
export interface ValidationResult {
    passed: boolean;
    violations: ArchitecturalViolation[];
    warnings: ArchitecturalViolation[];
    blockers: ArchitecturalViolation[];
    stats: ValidationStats;
}
export interface ValidationStats {
    filesAnalyzed: number;
    rulesExecuted: number;
    violationsFound: number;
    blockersFound: number;
    executionTimeMs: number;
}
export interface DependencyNode {
    filePath: string;
    type: 'component' | 'route' | 'menu' | 'test' | 'config' | 'other';
    imports: string[];
    exports: string[];
    metadata: Record<string, any>;
}
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    edges: Map<string, Set<string>>;
    findNodes(filter: NodeFilter): DependencyNode[];
    hasEdge(from: string, to: string): boolean;
    getImporters(filePath: string): DependencyNode[];
}
export interface NodeFilter {
    path?: RegExp;
    type?: DependencyNode['type'];
    metadata?: Record<string, any>;
}
export interface ArchitecturalRule {
    name: string;
    description: string;
    severity: 'blocker' | 'critical' | 'major' | 'minor';
    enabled: boolean;
    check(graph: DependencyGraph, changedFiles: string[]): Promise<ArchitecturalViolation[]>;
}
/**
 * Rule: Pages Must Have Routes
 *
 * Detects orphaned page components that have no corresponding route definition.
 * This would have prevented Failure #1 from the audit (8 orphaned Simplified pages).
 */
export declare class PagesMustHaveRoutesRule implements ArchitecturalRule {
    name: string;
    description: string;
    severity: "blocker";
    enabled: boolean;
    check(graph: DependencyGraph): Promise<ArchitecturalViolation[]>;
    private generateRouteSuggestion;
    private inferRoutePath;
}
/**
 * Rule: Menus Must Have Routes
 *
 * Validates that all navigation menu items have valid route definitions.
 * This would have prevented Failure #2 from the audit (broken Analytics navigation).
 */
export declare class MenusMustHaveRoutesRule implements ArchitecturalRule {
    name: string;
    description: string;
    severity: "critical";
    enabled: boolean;
    check(graph: DependencyGraph): Promise<ArchitecturalViolation[]>;
    private extractMenuItems;
    private checkRouteExists;
}
/**
 * Rule: Routes Must Have Components
 *
 * Validates that all route definitions point to existing components.
 * Detects broken route definitions.
 */
export declare class RoutesMustHaveComponentsRule implements ArchitecturalRule {
    name: string;
    description: string;
    severity: "blocker";
    enabled: boolean;
    check(graph: DependencyGraph): Promise<ArchitecturalViolation[]>;
    private extractRoutes;
}
/**
 * Rule: Deliverable Completeness
 *
 * Tracks multi-file deliverables to ensure complete implementation.
 * This would have prevented Failure #3 from the audit (incomplete Phase 3).
 */
export declare class DeliverableCompletenessRule implements ArchitecturalRule {
    name: string;
    description: string;
    severity: "major";
    enabled: boolean;
    check(graph: DependencyGraph, changedFiles: string[]): Promise<ArchitecturalViolation[]>;
    private getExpectedDeliverableFiles;
}
export declare class ArchitecturalValidator {
    private rules;
    private projectRoot;
    constructor(projectRoot?: string);
    private initializeRules;
    /**
     * Validate project architecture
     *
     * @param changedFiles - Files changed in current commit (optional)
     * @returns ValidationResult with all violations found
     */
    validate(changedFiles?: string[]): Promise<ValidationResult>;
    /**
     * Build dependency graph from project files
     */
    private buildDependencyGraph;
    /**
     * Parse a file and extract dependencies
     */
    private parseFile;
    private extractImports;
    private extractExports;
    private determineFileType;
    private extractMetadata;
    /**
     * Format validation results for display
     */
    formatResults(result: ValidationResult): string;
}
