#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework v1.2.0
 * Automatic Environment Detection & Integration
 */
export declare class VERSATILEnvironmentDetector {
    private detectedEnvironment;
    detectAndIntegrate(): Promise<{
        cursor: boolean;
        supabase: boolean;
        claude: boolean;
        agents: {
            format: "opera" | "agents.md" | "agents-folder" | null;
            location: string | null;
            existing: string[];
        };
        existingSDLC: any;
        existingCursorRules: string | null;
        supabaseConfig: any;
        rag: {
            hasVectorStore: boolean;
            hasEmbeddings: boolean;
        };
    }>;
    /**
     * Detect Cursor AI environment
     */
    private detectCursorEnvironment;
    /**
     * Detect Supabase configuration
     */
    private detectSupabase;
    /**
     * Check if Supabase has vector capabilities
     */
    private checkSupabaseVectorCapability;
    /**
     * Detect Claude integration
     */
    private detectClaudeIntegration;
    /**
     * Detect existing agents configuration
     */
    private detectExistingAgents;
    /**
     * Detect existing SDLC structure
     */
    private detectSDLCStructure;
    /**
     * Create integration plan based on detection
     */
    private createIntegrationPlan;
    /**
     * Execute the integration plan
     */
    private executeIntegration;
    /**
     * Enhance existing cursor rules
     */
    private enhanceCursorRules;
    /**
     * Generate migration scripts
     */
    private generateMigrationScripts;
    /**
     * Generate integration report
     */
    private generateIntegrationReport;
}
export default VERSATILEnvironmentDetector;
