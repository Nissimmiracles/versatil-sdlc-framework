/**
 * VERSATIL MCP Database Tools Module
 * Database operations for Dana-Database agent
 *
 * Tools in this module (12):
 * 1. database_query
 * 2. database_migrate
 * 3. database_schema_generate
 * 4. database_rls_setup
 * 5. database_rls_test
 * 6. database_backup
 * 7. database_restore
 * 8. database_analyze_query
 * 9. database_optimize_indexes
 * 10. database_connection_pool
 * 11. database_transaction_start
 * 12. database_transaction_commit
 */
import { ModuleBase } from './module-base.js';
import { ToolRegistrationOptions } from '../core/module-loader.js';
export declare class DatabaseToolsModule extends ModuleBase {
    private supabaseClient;
    constructor(options: ToolRegistrationOptions);
    /**
     * Lazy initialize Supabase client
     */
    protected initializeTool(toolName: string): Promise<void>;
    /**
     * Register all database tools
     */
    registerTools(): Promise<number>;
    /**
     * Cleanup Supabase client on module unload
     */
    cleanup(): Promise<void>;
}
/**
 * Export function for module loader
 */
export declare function registerTools(options: ToolRegistrationOptions): Promise<number>;
