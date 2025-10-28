/**
 * VERSATIL SDLC Framework - Crash Recovery
 * Detect and resume interrupted updates
 */
export interface UpdateState {
    updateId: string;
    startedAt: string;
    currentStep: string;
    stepIndex: number;
    totalSteps: number;
    fromVersion: string;
    toVersion: string;
    steps: UpdateStep[];
    completedSteps: string[];
    failedStep?: string;
    error?: string;
    canResume: boolean;
}
export interface UpdateStep {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    skippable: boolean;
    retryable: boolean;
    criticalFailure: boolean;
}
export interface RecoveryResult {
    recovered: boolean;
    resumedFrom: string;
    completedSteps: number;
    error?: string;
}
export declare class CrashRecoveryManager {
    private readonly versatilHome;
    private readonly stateFile;
    private readonly lockFile;
    constructor();
    /**
     * Check if there's an interrupted update
     */
    hasInterruptedUpdate(): Promise<boolean>;
    /**
     * Get interrupted update state
     */
    getInterruptedUpdateState(): Promise<UpdateState | null>;
    /**
     * Start tracking new update
     */
    startUpdate(fromVersion: string, toVersion: string, steps: UpdateStep[]): Promise<string>;
    /**
     * Mark step as completed
     */
    completeStep(stepId: string): Promise<void>;
    /**
     * Mark step as failed
     */
    failStep(stepId: string, error: string, criticalFailure?: boolean): Promise<void>;
    /**
     * Complete update successfully
     */
    completeUpdate(): Promise<void>;
    /**
     * Abort update
     */
    abortUpdate(reason: string): Promise<void>;
    /**
     * Resume interrupted update
     */
    resumeUpdate(): Promise<RecoveryResult>;
    /**
     * Clear update state
     */
    clearState(): Promise<void>;
    /**
     * Get remaining steps
     */
    getRemainingSteps(): Promise<UpdateStep[]>;
    /**
     * Check if update is locked
     */
    isUpdateLocked(): Promise<boolean>;
    /**
     * Force remove lock (emergency use only)
     */
    forceRemoveLock(): Promise<void>;
    /**
     * Validate update can proceed
     */
    validateCanProceed(): Promise<{
        canProceed: boolean;
        reason?: string;
    }>;
    /**
     * Get update progress
     */
    getProgress(): Promise<{
        percentage: number;
        currentStep: string;
        completedSteps: number;
    }>;
    /**
     * Generate update summary
     */
    getUpdateSummary(): Promise<string>;
    /**
     * Load update state
     */
    private loadState;
    /**
     * Save update state
     */
    private saveState;
    /**
     * Create lock file
     */
    private createLock;
    /**
     * Remove lock file
     */
    private removeLock;
    /**
     * Generate unique update ID
     */
    private generateUpdateId;
    /**
     * Define standard update steps
     */
    static getStandardUpdateSteps(): UpdateStep[];
}
/**
 * Default crash recovery manager instance
 */
export declare const defaultCrashRecovery: CrashRecoveryManager;
