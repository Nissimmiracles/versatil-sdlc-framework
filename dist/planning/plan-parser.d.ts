/**
 * @fileoverview Plan Parser - Parse plan text into structured data
 *
 * Parses plan outputs from PlanFirstOpera into structured format for TodoWrite conversion.
 * Handles phase extraction, duration parsing, dependency detection, and parallel task identification.
 *
 * @module planning/plan-parser
 * @version 1.0.0
 */
/**
 * Parsed plan phase from plan text
 */
export interface ParsedPlanPhase {
    /** Phase number (1-6) */
    phaseNumber: number;
    /** Phase name (e.g., "Requirements Analysis") */
    phaseName: string;
    /** Full phase description */
    description: string;
    /** Agent responsible for this phase */
    agent: string;
    /** Estimated duration in minutes */
    estimatedDuration: number;
    /** Whether this phase can run in parallel with others */
    isParallel: boolean;
    /** Phase dependencies (phase numbers this depends on) */
    dependencies: number[];
    /** Original plan text for this phase */
    rawText: string;
}
/**
 * Complete parsed plan with all phases
 */
export interface ParsedPlan {
    /** Plan title/goal */
    title: string;
    /** All parsed phases */
    phases: ParsedPlanPhase[];
    /** Total estimated time (sum of sequential, max of parallel) */
    totalEstimatedMinutes: number;
    /** Parallel groups (phases that can run together) */
    parallelGroups: number[][];
    /** Metadata from plan header */
    metadata: {
        goal?: string;
        estimatedTime?: number;
        risk?: 'low' | 'medium' | 'high';
    };
}
/**
 * Parser configuration
 */
export interface PlanParserConfig {
    /** Enable strict validation (throw on parse errors) */
    strictMode: boolean;
    /** Default duration if none specified (minutes) */
    defaultDuration: number;
    /** Pattern to detect parallel markers */
    parallelMarker: string;
}
export declare class PlanParser {
    private logger;
    private config;
    private static readonly PHASE_PATTERN;
    private static readonly PARALLEL_MARKER_PATTERN;
    private static readonly DURATION_PATTERN;
    private static readonly DEPENDENCY_PATTERN;
    constructor(config?: Partial<PlanParserConfig>);
    /**
     * Parse plan text into structured format
     */
    parse(planText: string): Promise<ParsedPlan>;
    /**
     * Extract plan title from first meaningful line
     */
    private extractTitle;
    /**
     * Extract metadata from plan header
     */
    private extractMetadata;
    /**
     * Extract all phases from plan text
     */
    private extractPhases;
    /**
     * Finalize a partially parsed phase
     */
    private finalizeParsedPhase;
    /**
     * Calculate total time accounting for parallel execution
     */
    private calculateTotalTime;
    /**
     * Group phases by execution level (for parallel time calculation)
     */
    private groupPhasesByLevel;
    /**
     * Identify groups of phases that can run in parallel
     */
    private identifyParallelGroups;
    /**
     * Check if two phases can run in parallel
     */
    private canRunInParallel;
    /**
     * Parse duration string (e.g., "30 min", "2 hours", "45m")
     */
    static parseDuration(durationStr: string): number;
}
export default PlanParser;
