/**
 * VERSATIL Framework - VELOCITY Phase Auto-Detection
 *
 * Automatically detects which VELOCITY workflow phase should be active
 * based on current context (file edits, commands, hooks, etc.)
 *
 * Detection Logic:
 * - Cursor Plan Mode → PLAN phase
 * - /plan command → PLAN phase
 * - File edit + active workflow → WORK phase
 * - Build/test command → ASSESS phase
 * - Session end → CODIFY phase
 * - /delegate command → DELEGATE phase
 *
 * @module workflows/phase-detector
 */
import { WorkflowPhase } from './velocity-workflow-state-machine.js';
export interface PhaseDetectionContext {
    /** Event that triggered detection */
    trigger: 'fileEdit' | 'build' | 'test' | 'command' | 'sessionEnd' | 'manual';
    /** File path (for fileEdit trigger) */
    filePath?: string;
    /** Command name (for command trigger) */
    commandName?: string;
    /** Additional context */
    metadata?: Record<string, any>;
}
export interface PhaseDetectionResult {
    /** Detected phase */
    phase: WorkflowPhase | null;
    /** Confidence level (0-1) */
    confidence: number;
    /** Reason for detection */
    reason: string;
    /** Is workflow currently active? */
    workflowActive: boolean;
    /** Suggested action */
    suggestedAction?: string;
}
export declare class VelocityPhaseDetector {
    private stateDir;
    private currentWorkflowFile;
    constructor();
    /**
     * Main detection method - automatically determine current phase
     */
    detect(context: PhaseDetectionContext): PhaseDetectionResult;
    /**
     * Detect phase from command execution
     */
    private detectFromCommand;
    /**
     * Detect phase from file edit
     */
    private detectFromFileEdit;
    /**
     * Detect phase from build/test commands
     */
    private detectFromBuildTest;
    /**
     * Detect phase from session end
     */
    private detectFromSessionEnd;
    /**
     * Manual detection (used when phase is explicitly specified)
     */
    private detectManual;
    /**
     * Check if workflow is currently active
     */
    private isWorkflowActive;
    /**
     * Check if file is a planning/requirements file
     */
    private isPlanningFile;
    /**
     * Check if file is a code file
     */
    private isCodeFile;
    /**
     * Get recommended next phase based on current phase
     */
    getNextPhase(currentPhase: WorkflowPhase): WorkflowPhase | null;
    /**
     * Check if transition to target phase is valid
     */
    canTransitionTo(currentPhase: WorkflowPhase | null, targetPhase: WorkflowPhase): boolean;
}
/**
 * Quick phase detection from file edit
 */
export declare function detectPhaseFromFileEdit(filePath: string): PhaseDetectionResult;
/**
 * Quick phase detection from command
 */
export declare function detectPhaseFromCommand(commandName: string): PhaseDetectionResult;
/**
 * Quick phase detection from build/test
 */
export declare function detectPhaseFromBuild(): PhaseDetectionResult;
/**
 * Quick phase detection from session end
 */
export declare function detectPhaseFromSessionEnd(): PhaseDetectionResult;
