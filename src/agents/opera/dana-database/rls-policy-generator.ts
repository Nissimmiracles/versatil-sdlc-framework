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
  compliance: number; // 0-100
  suggestedPolicies: string;
  recommendations: string[];
}

export interface RLSGenerateOptions {
  tableName: string;
  tenantColumn?: string; // Default: user_id
  userIdColumn?: string; // Default: auth.uid()
  policies?: Array<'select' | 'insert' | 'update' | 'delete'>;
  rolePattern?: 'user-owned' | 'org-owned' | 'public-read' | 'admin-only';
}

/**
 * RLS Policy Generator
 *
 * Generates Supabase-compliant RLS policies for multi-tenant applications
 */
export class RLSPolicyGenerator {
  /**
   * Analyze SQL for RLS policy compliance
   */
  async analyze(options: RLSAnalysisOptions): Promise<RLSAnalysisResult> {
    const { sql, tableNames } = options;
    const recommendations: string[] = [];

    // Check if RLS is enabled on tables
    const hasRLSEnabled = sql.includes('ENABLE ROW LEVEL SECURITY');
    const hasPolicies = sql.includes('CREATE POLICY');

    let suggestedPolicies = '';
    let compliance = 0;

    if (!hasRLSEnabled) {
      recommendations.push('Enable RLS on all multi-tenant tables');

      // Generate suggested policies for all tables
      const policySuggestions: string[] = [];
      for (const tableName of tableNames) {
        const tenantColumn = this.detectTenantColumn(sql, tableName);
        if (tenantColumn) {
          const policy = await this.generate({
            tableName,
            tenantColumn,
            policies: ['select', 'insert', 'update', 'delete']
          });
          policySuggestions.push(policy);
        }
      }
      suggestedPolicies = policySuggestions.join('\n\n');
    } else if (!hasPolicies) {
      recommendations.push('Add RLS policies to enabled tables');
      compliance = 30; // RLS enabled but no policies
    } else {
      // RLS enabled with policies
      compliance = this.calculateCompliance(sql, tableNames);

      if (compliance < 100) {
        recommendations.push('Review RLS policies for complete coverage');
      }
    }

    return {
      hasPolicies,
      compliance,
      suggestedPolicies,
      recommendations
    };
  }

  /**
   * Generate RLS policies for a table
   */
  async generate(options: RLSGenerateOptions): Promise<string> {
    const {
      tableName,
      tenantColumn = 'user_id',
      userIdColumn = 'auth.uid()',
      policies = ['select', 'insert', 'update', 'delete'],
      rolePattern = 'user-owned'
    } = options;

    const policySQL: string[] = [];

    // Enable RLS on table
    policySQL.push(`-- Enable RLS on ${tableName}`);
    policySQL.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
    policySQL.push('');

    // Generate policies based on role pattern
    switch (rolePattern) {
      case 'user-owned':
        policySQL.push(...this.generateUserOwnedPolicies(tableName, tenantColumn, userIdColumn, policies));
        break;
      case 'org-owned':
        policySQL.push(...this.generateOrgOwnedPolicies(tableName, policies));
        break;
      case 'public-read':
        policySQL.push(...this.generatePublicReadPolicies(tableName, tenantColumn, userIdColumn, policies));
        break;
      case 'admin-only':
        policySQL.push(...this.generateAdminOnlyPolicies(tableName, policies));
        break;
    }

    return policySQL.join('\n');
  }

  /**
   * Generate user-owned policies (users can only access their own data)
   */
  private generateUserOwnedPolicies(
    tableName: string,
    tenantColumn: string,
    userIdColumn: string,
    policies: Array<'select' | 'insert' | 'update' | 'delete'>
  ): string[] {
    const sql: string[] = [];

    if (policies.includes('select')) {
      sql.push(`-- Policy: Users can read own data`);
      sql.push(`CREATE POLICY "${tableName}_select_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR SELECT`);
      sql.push(`  USING (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    if (policies.includes('insert')) {
      sql.push(`-- Policy: Users can insert own data`);
      sql.push(`CREATE POLICY "${tableName}_insert_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR INSERT`);
      sql.push(`  WITH CHECK (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    if (policies.includes('update')) {
      sql.push(`-- Policy: Users can update own data`);
      sql.push(`CREATE POLICY "${tableName}_update_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR UPDATE`);
      sql.push(`  USING (${tenantColumn} = ${userIdColumn})`);
      sql.push(`  WITH CHECK (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    if (policies.includes('delete')) {
      sql.push(`-- Policy: Users can delete own data`);
      sql.push(`CREATE POLICY "${tableName}_delete_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR DELETE`);
      sql.push(`  USING (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    return sql;
  }

  /**
   * Generate org-owned policies (users can access data from their organization)
   */
  private generateOrgOwnedPolicies(
    tableName: string,
    policies: Array<'select' | 'insert' | 'update' | 'delete'>
  ): string[] {
    const sql: string[] = [];

    if (policies.includes('select')) {
      sql.push(`-- Policy: Users can read org data`);
      sql.push(`CREATE POLICY "${tableName}_select_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR SELECT`);
      sql.push(`  USING (`);
      sql.push(`    organization_id IN (`);
      sql.push(`      SELECT organization_id FROM user_organizations`);
      sql.push(`      WHERE user_id = auth.uid()`);
      sql.push(`    )`);
      sql.push(`  );`);
      sql.push('');
    }

    if (policies.includes('insert')) {
      sql.push(`-- Policy: Users can insert org data`);
      sql.push(`CREATE POLICY "${tableName}_insert_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR INSERT`);
      sql.push(`  WITH CHECK (`);
      sql.push(`    organization_id IN (`);
      sql.push(`      SELECT organization_id FROM user_organizations`);
      sql.push(`      WHERE user_id = auth.uid()`);
      sql.push(`    )`);
      sql.push(`  );`);
      sql.push('');
    }

    return sql;
  }

  /**
   * Generate public-read policies (anyone can read, only owners can modify)
   */
  private generatePublicReadPolicies(
    tableName: string,
    tenantColumn: string,
    userIdColumn: string,
    policies: Array<'select' | 'insert' | 'update' | 'delete'>
  ): string[] {
    const sql: string[] = [];

    if (policies.includes('select')) {
      sql.push(`-- Policy: Public read access`);
      sql.push(`CREATE POLICY "${tableName}_select_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR SELECT`);
      sql.push(`  USING (true); -- Public read`);
      sql.push('');
    }

    if (policies.includes('insert')) {
      sql.push(`-- Policy: Authenticated users can insert`);
      sql.push(`CREATE POLICY "${tableName}_insert_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR INSERT`);
      sql.push(`  WITH CHECK (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    if (policies.includes('update')) {
      sql.push(`-- Policy: Only owner can update`);
      sql.push(`CREATE POLICY "${tableName}_update_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR UPDATE`);
      sql.push(`  USING (${tenantColumn} = ${userIdColumn})`);
      sql.push(`  WITH CHECK (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    if (policies.includes('delete')) {
      sql.push(`-- Policy: Only owner can delete`);
      sql.push(`CREATE POLICY "${tableName}_delete_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR DELETE`);
      sql.push(`  USING (${tenantColumn} = ${userIdColumn});`);
      sql.push('');
    }

    return sql;
  }

  /**
   * Generate admin-only policies (only admins can access)
   */
  private generateAdminOnlyPolicies(
    tableName: string,
    policies: Array<'select' | 'insert' | 'update' | 'delete'>
  ): string[] {
    const sql: string[] = [];

    const adminCheck = `(auth.jwt() ->> 'role' = 'admin')`;

    if (policies.includes('select')) {
      sql.push(`-- Policy: Admin-only read access`);
      sql.push(`CREATE POLICY "${tableName}_select_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR SELECT`);
      sql.push(`  USING (${adminCheck});`);
      sql.push('');
    }

    if (policies.includes('insert')) {
      sql.push(`-- Policy: Admin-only insert`);
      sql.push(`CREATE POLICY "${tableName}_insert_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR INSERT`);
      sql.push(`  WITH CHECK (${adminCheck});`);
      sql.push('');
    }

    if (policies.includes('update')) {
      sql.push(`-- Policy: Admin-only update`);
      sql.push(`CREATE POLICY "${tableName}_update_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR UPDATE`);
      sql.push(`  USING (${adminCheck})`);
      sql.push(`  WITH CHECK (${adminCheck});`);
      sql.push('');
    }

    if (policies.includes('delete')) {
      sql.push(`-- Policy: Admin-only delete`);
      sql.push(`CREATE POLICY "${tableName}_delete_policy"`);
      sql.push(`  ON ${tableName}`);
      sql.push(`  FOR DELETE`);
      sql.push(`  USING (${adminCheck});`);
      sql.push('');
    }

    return sql;
  }

  /**
   * Detect tenant column from SQL
   */
  private detectTenantColumn(sql: string, tableName: string): string | null {
    const tenantPatterns = [
      'user_id',
      'tenant_id',
      'organization_id',
      'org_id',
      'owner_id',
      'created_by'
    ];

    for (const pattern of tenantPatterns) {
      if (sql.includes(pattern)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Calculate RLS compliance score
   */
  private calculateCompliance(sql: string, tableNames: string[]): number {
    let score = 0;
    const maxScore = tableNames.length * 4; // 4 policies per table

    // Count existing policies
    const policyMatches = sql.matchAll(/CREATE POLICY\s+"([^"]+)"/gi);
    const policyCount = Array.from(policyMatches).length;

    // Calculate percentage
    if (maxScore > 0) {
      score = Math.min(100, Math.round((policyCount / maxScore) * 100));
    }

    return score;
  }

  /**
   * Generate RLS policies for common multi-tenant patterns
   */
  async generateForPattern(pattern: 'saas' | 'marketplace' | 'social'): Promise<string> {
    const policies: string[] = [];

    switch (pattern) {
      case 'saas':
        // SaaS: Users belong to organizations
        policies.push(await this.generate({
          tableName: 'organizations',
          rolePattern: 'user-owned'
        }));
        policies.push(await this.generate({
          tableName: 'projects',
          tenantColumn: 'organization_id',
          rolePattern: 'org-owned'
        }));
        policies.push(await this.generate({
          tableName: 'documents',
          tenantColumn: 'organization_id',
          rolePattern: 'org-owned'
        }));
        break;

      case 'marketplace':
        // Marketplace: Public listings, private seller data
        policies.push(await this.generate({
          tableName: 'listings',
          rolePattern: 'public-read'
        }));
        policies.push(await this.generate({
          tableName: 'orders',
          rolePattern: 'user-owned'
        }));
        policies.push(await this.generate({
          tableName: 'seller_profiles',
          rolePattern: 'user-owned'
        }));
        break;

      case 'social':
        // Social: Public posts, private messages
        policies.push(await this.generate({
          tableName: 'posts',
          rolePattern: 'public-read'
        }));
        policies.push(await this.generate({
          tableName: 'messages',
          rolePattern: 'user-owned'
        }));
        policies.push(await this.generate({
          tableName: 'profiles',
          rolePattern: 'public-read'
        }));
        break;
    }

    return policies.join('\n\n');
  }
}
