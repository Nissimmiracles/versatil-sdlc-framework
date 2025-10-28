/**
 * VERSATIL SDLC Framework - Guardian Learning Store
 * Stores Guardian learnings in RAG for future pattern reuse
 *
 * Called by session-codify.ts hook at end of session
 * Stores successful remediation patterns, health check insights, and issue resolutions
 */
export interface GuardianSessionPatterns {
    healthChecks: string[];
    autoFixes: string[];
    criticalIssues: string[];
    sessionId: string;
    timestamp: string;
    filesEdited: string[];
    agentsUsed: string[];
}
export interface GuardianLearning {
    id: string;
    category: 'health-check' | 'auto-remediation' | 'issue-resolution' | 'agent-coordination';
    pattern: string;
    context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT' | 'SHARED';
    success_rate: number;
    times_used: number;
    avg_duration_ms: number;
    learned_at: string;
    last_used?: string;
    metadata: {
        sessionId: string;
        filesAffected: string[];
        agentsInvolved: string[];
        tags: string[];
    };
}
/**
 * Store Guardian learnings from session
 */
export declare function storeGuardianLearnings(patterns: GuardianSessionPatterns, workingDirectory: string): Promise<void>;
/**
 * Retrieve Guardian learnings by category
 */
export declare function getGuardianLearnings(category?: 'health-check' | 'auto-remediation' | 'issue-resolution' | 'agent-coordination', limit?: number): Promise<GuardianLearning[]>;
/**
 * Update learning statistics when pattern is reused
 */
export declare function updateLearningStats(learningId: string, success: boolean, duration_ms: number): Promise<void>;
/**
 * Search Guardian learnings by pattern text
 */
export declare function searchGuardianLearnings(query: string, limit?: number): Promise<GuardianLearning[]>;
/**
 * Get Guardian learning statistics
 */
export declare function getGuardianLearningStats(): Promise<{
    total_learnings: number;
    by_category: Record<string, number>;
    avg_success_rate: number;
    most_used: GuardianLearning[];
    recent: GuardianLearning[];
}>;
