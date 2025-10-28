/**
 * RLS Policy Generator
 *
 * Purpose: Auto-generate Row Level Security (RLS) policies for Supabase/PostgreSQL
 * - Detects multi-tenant patterns in tables
 * - Generates RLS policies for user isolation
 * - Provides policy templates for common patterns
 * - Ensures Supabase-specific policy syntax
 *
 * Auto-triggers: CREATE TABLE with tenant_id, user_id, organization_id columns
 *
 * @example
 * const generator = new RLSPolicyGenerator();
 * const policies = await generator.generate({
 *   tableName: 'documents',
 *   tenantColumn: 'user_id',
 *   policies: ['select', 'insert', 'update', 'delete']
 * });
 * console.log(policies); // SQL for RLS policies
 */
export interface RLSAnalysisOptions {
    sql: string;
    tableNames: string[];
}
export interface RLSAnalysisResult {
    hasPolicies: boolean;
    compliance: number;
    suggestedPolicies: string;
    recommendations: string[];
}
export interface RLSGenerateOptions {
    tableName: string;
    tenantColumn?: string;
    userIdColumn?: string;
    policies?: Array<'select' | 'insert' | 'update' | 'delete'>;
    rolePattern?: 'user-owned' | 'org-owned' | 'public-read' | 'admin-only';
}
/**
 * RLS Policy Generator
 *
 * Generates Supabase-compliant RLS policies for multi-tenant applications
 */
export declare class RLSPolicyGenerator {
    /**
     * Analyze SQL for RLS policy compliance
     */
    analyze(options: RLSAnalysisOptions): Promise<RLSAnalysisResult>;
    /**
     * Generate RLS policies for a table
     */
    generate(options: RLSGenerateOptions): Promise<string>;
    /**
     * Generate user-owned policies (users can only access their own data)
     */
    private generateUserOwnedPolicies;
    /**
     * Generate org-owned policies (users can access data from their organization)
     */
    private generateOrgOwnedPolicies;
    /**
     * Generate public-read policies (anyone can read, only owners can modify)
     */
    private generatePublicReadPolicies;
    /**
     * Generate admin-only policies (only admins can access)
     */
    private generateAdminOnlyPolicies;
    /**
     * Detect tenant column from SQL
     */
    private detectTenantColumn;
    /**
     * Calculate RLS compliance score
     */
    private calculateCompliance;
    /**
     * Generate RLS policies for common multi-tenant patterns
     */
    generateForPattern(pattern: 'saas' | 'marketplace' | 'social'): Promise<string>;
}
