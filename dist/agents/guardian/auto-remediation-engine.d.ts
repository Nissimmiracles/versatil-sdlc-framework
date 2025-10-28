/**
 * VERSATIL SDLC Framework - Auto-Remediation Engine
 * Centralized engine for automatic issue detection and fixing
 *
 * 20+ Fix Scenarios:
 *
 * FRAMEWORK CONTEXT (10 scenarios):
 * 1. Build failure → npm run build
 * 2. TypeScript errors → Fix type issues
 * 3. Test failures → Run tests and fix
 * 4. Missing dependencies → npm install
 * 5. Outdated dependencies → npm update
 * 6. Security vulnerabilities → npm audit fix
 * 7. Missing hooks → Rebuild hooks
 * 8. Supabase connection lost → Reconnect
 * 9. GraphRAG query failure → Fallback to vector store
 * 10. Missing documentation → Generate from templates
 *
 * PROJECT CONTEXT (10 scenarios):
 * 11. Missing .versatil-project.json → versatil init
 * 12. Outdated framework version → npm update versatil-sdlc-framework
 * 13. Agent not activating → Validate agent definition
 * 14. Agent definition invalid → Fix YAML frontmatter
 * 15. Build failure (user project) → Suggest fixes
 * 16. Test failures (user project) → Suggest Maria-QA
 * 17. No agents configured → Suggest agents
 * 18. RAG not initialized → versatil rag init
 * 19. Low pattern count → Suggest /learn usage
 * 20. Hook not loading → Rebuild hooks
 *
 * SHARED (5+ scenarios):
 * 21. Vector store connection lost → Reconnect
 * 22. Embedding API down → Fallback to cache
 * 23. Agent timeout → Increase timeout
 * 24. Agent activation hook failure → Reload hooks
 * 25. Missing agent dependencies → Install dependencies
 */
export type RemediationContext = 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT' | 'SHARED';
export interface RemediationIssue {
    id: string;
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    context: RemediationContext;
    error_message?: string;
    affected_files?: string[];
}
export interface RemediationResult {
    success: boolean;
    issue_id: string;
    action_taken: string;
    confidence: number;
    duration_ms: number;
    before_state: string;
    after_state: string;
    learned: string;
    next_steps?: string[];
    logs?: string[];
}
export interface RemediationScenario {
    id: string;
    name: string;
    matcher: (issue: RemediationIssue) => boolean;
    confidence: number;
    auto_fixable: boolean;
    context: RemediationContext;
    execute: (issue: RemediationIssue, projectRoot: string) => Promise<RemediationResult>;
}
/**
 * Auto-Remediation Engine
 */
export declare class AutoRemediationEngine {
    private static instance;
    private logger;
    private scenarios;
    private constructor();
    static getInstance(): AutoRemediationEngine;
    /**
     * Register all remediation scenarios
     */
    private registerScenarios;
    /**
     * Register a remediation scenario
     */
    private registerScenario;
    /**
     * Attempt to remediate an issue
     */
    remediate(issue: RemediationIssue, projectRoot: string): Promise<RemediationResult>;
    /**
     * Get all registered scenarios
     */
    getScenarios(): RemediationScenario[];
    /**
     * Get scenarios by context
     */
    getScenariosByContext(context: RemediationContext): RemediationScenario[];
}
/**
 * Singleton instance
 */
export declare const autoRemediationEngine: AutoRemediationEngine;
