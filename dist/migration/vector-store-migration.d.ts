/**
 * VERSATIL SDLC Framework - Vector Store Migration System
 *
 * Migrates existing Enhanced Vector Memory Store data to Supabase Vector Store
 * while preserving all agent knowledge, maintaining backward compatibility,
 * and providing zero-downtime migration.
 */
export interface MigrationProgress {
    phase: string;
    step: number;
    totalSteps: number;
    processed: number;
    totalItems: number;
    success: number;
    errors: number;
    warnings: number;
    estimated: number;
}
export interface MigrationReport {
    success: boolean;
    duration: number;
    phases: {
        [phaseName: string]: {
            completed: boolean;
            items: number;
            success: number;
            errors: number;
            warnings: string[];
        };
    };
    finalStats: {
        totalMemories: number;
        migratedPatterns: number;
        migratedSolutions: number;
        migratedInteractions: number;
        preservedEmbeddings: number;
        duplicatesSkipped: number;
    };
    recommendations: string[];
}
export interface MigrationOptions {
    dryRun?: boolean;
    preserveLocal?: boolean;
    batchSize?: number;
    skipDuplicates?: boolean;
    preserveEmbeddings?: boolean;
    agentFilter?: string[];
    timeRange?: {
        start: number;
        end: number;
    };
    validateIntegrity?: boolean;
    createBackup?: boolean;
}
export declare class VectorStoreMigration {
    private logger;
    private sourceStore;
    private targetStore;
    private progress;
    private report;
    private startTime;
    constructor();
    /**
     * Execute complete migration with progress tracking
     */
    migrate(options?: MigrationOptions): Promise<MigrationReport>;
    /**
     * Phase 1: Pre-migration validation
     */
    private phase1PreValidation;
    /**
     * Phase 2: Create backup
     */
    private phase2CreateBackup;
    /**
     * Phase 3: Initialize target store
     */
    private phase3InitializeTarget;
    /**
     * Phase 4: Migrate memories and patterns
     */
    private phase4MigrateMemories;
    /**
     * Phase 5: Migrate agent solutions and interactions
     */
    private phase5MigrateSolutions;
    /**
     * Phase 6: Post-migration validation
     */
    private phase6PostValidation;
    /**
     * Convert memory document to code pattern
     */
    private convertMemoryToPattern;
    /**
     * Convert memory to agent solution
     */
    private convertMemoryToSolution;
    /**
     * Convert memory to agent interaction
     */
    private convertMemoryToInteraction;
    /**
     * Get current migration progress
     */
    getProgress(): MigrationProgress;
    /**
     * Subscribe to migration progress updates
     */
    onProgress(callback: (progress: MigrationProgress) => void): () => void;
    private updateProgress;
    private initPhase;
    private getAgentBreakdown;
    private getContentTypeBreakdown;
    private inferPatternType;
    private inferLanguage;
    private calculateQualityScore;
    private calculateEffectivenessScore;
    private extractProblemFromContent;
    private isDuplicatePattern;
    private generateRecommendations;
    /**
     * Rollback migration (if preserveLocal was true)
     */
    rollback(): Promise<void>;
}
export declare function createMigration(): VectorStoreMigration;
export declare function runMigration(options?: MigrationOptions): Promise<MigrationReport>;
