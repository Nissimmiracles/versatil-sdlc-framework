/**
 * RAG Health Monitor - Guardian's RAG Ownership System
 *
 * Monitors and maintains health of:
 * - GraphRAG (Neo4j) - Primary pattern storage
 * - Vector Store (Supabase pgvector) - Fallback storage
 * - RAG Router - Public/Private routing
 * - Pattern Search Service - Historical pattern retrieval
 *
 * Auto-remediation scenarios:
 * - GraphRAG timeout → Restart Neo4j container
 * - GraphRAG memory exhaustion → Clear cache + restart
 * - Vector store connection lost → Reconnect Supabase
 * - Embedding API down → Use cached embeddings
 * - Query latency spike → Rebuild indexes
 *
 * Integration with Guardian:
 * - Called every 5 minutes by Guardian.performHealthCheck()
 * - Logs to ~/.versatil/logs/guardian/rag/rag-operations-*.log
 * - Auto-remediates if confidence ≥90%
 * - Stores successful fixes in RAG for future use
 *
 * @version 7.8.0
 */
/**
 * RAG component health status
 */
export interface RAGComponentHealth {
    component: 'graphrag' | 'vector' | 'router' | 'pattern_search';
    healthy: boolean;
    latency_ms: number;
    status: 'operational' | 'degraded' | 'down' | 'unknown';
    details: {
        connection_status?: string;
        memory_usage?: string;
        query_success_rate?: number;
        last_query_time?: string;
        error?: string;
    };
}
/**
 * Overall RAG health
 */
export interface RAGHealthReport {
    overall_health: number;
    status: 'healthy' | 'degraded' | 'critical';
    components: {
        graphrag: RAGComponentHealth;
        vector: RAGComponentHealth;
        router: RAGComponentHealth;
        pattern_search: RAGComponentHealth;
    };
    issues: RAGIssue[];
    recommendations: string[];
    timestamp: string;
}
/**
 * RAG-specific issue
 */
export interface RAGIssue {
    component: 'graphrag' | 'vector' | 'router' | 'pattern_search';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    root_cause?: string;
    confidence: number;
    auto_fix_available: boolean;
    fix_action?: string;
}
/**
 * RAG remediation result
 */
export interface RAGRemediationResult {
    success: boolean;
    action_taken: string;
    component: string;
    before_state: string;
    after_state: string;
    confidence: number;
    duration_ms: number;
    learned: boolean;
}
/**
 * RAG Health Monitor
 */
export declare class RAGHealthMonitor {
    private static instance;
    private logger;
    private vectorStore;
    private ragRouter;
    private lastHealthCheck;
    private constructor();
    static getInstance(): RAGHealthMonitor;
    /**
     * Perform comprehensive RAG health check
     */
    performHealthCheck(): Promise<RAGHealthReport>;
    /**
     * Check GraphRAG (Neo4j) health
     */
    private checkGraphRAGHealth;
    /**
     * Check Vector Store (Supabase) health
     */
    private checkVectorStoreHealth;
    /**
     * Check RAG Router health
     */
    private checkRAGRouterHealth;
    /**
     * Check Pattern Search Service health
     */
    private checkPatternSearchHealth;
    /**
     * Auto-remediate RAG issue
     */
    remediateIssue(issue: RAGIssue): Promise<RAGRemediationResult>;
    /**
     * Create issue from component health
     */
    private createIssueFromComponent;
    /**
     * Generate recommendations based on issues
     */
    private generateRecommendations;
    /**
     * Create unknown component (for error scenarios)
     */
    private createUnknownComponent;
    /**
     * Get last health check result
     */
    getLastHealthCheck(): RAGHealthReport | null;
}
/**
 * Get RAG Health Monitor instance
 */
export declare function getRAGHealthMonitor(): RAGHealthMonitor;
