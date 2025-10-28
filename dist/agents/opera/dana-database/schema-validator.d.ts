/**
 * Schema Validator
 *
 * Purpose: Validates PostgreSQL/Supabase schema design for:
 * - Normalization (1NF, 2NF, 3NF compliance)
 * - Constraint validation (foreign keys, unique, not null)
 * - Index recommendations (missing indexes on foreign keys)
 * - Schema anti-patterns (god tables, EAV, over-normalization)
 *
 * Auto-triggers: CREATE TABLE, ALTER TABLE, schema modification statements
 *
 * @example
 * const validator = new SchemaValidator();
 * const result = await validator.validate({
 *   sql: 'CREATE TABLE users (id UUID PRIMARY KEY, email TEXT);',
 *   schemaType: 'postgresql'
 * });
 * console.log(result.issues); // Schema issues with severity
 * console.log(result.recommendations); // Actionable improvements
 */
export interface SchemaValidationOptions {
    sql: string;
    schemaType: 'postgresql' | 'mysql' | 'sqlite' | 'supabase';
    strictMode?: boolean;
}
export interface SchemaValidationResult {
    valid: boolean;
    score: number;
    normalizationLevel: '1NF' | '2NF' | '3NF' | 'BCNF' | 'NONE';
    issues: Array<{
        type: 'schema' | 'normalization' | 'constraint' | 'index' | 'anti-pattern';
        severity: 'critical' | 'high' | 'medium' | 'low';
        message: string;
        file?: string;
        suggestion?: string;
        line?: number;
    }>;
    recommendations: string[];
    tables: Array<{
        name: string;
        columns: Array<{
            name: string;
            type: string;
            nullable: boolean;
            primaryKey: boolean;
            foreignKey?: {
                table: string;
                column: string;
            };
            unique: boolean;
            hasIndex: boolean;
        }>;
        constraints: Array<{
            type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
            columns: string[];
            references?: {
                table: string;
                columns: string[];
            };
        }>;
        indexes: Array<{
            name: string;
            columns: string[];
            unique: boolean;
        }>;
    }>;
}
export declare class SchemaValidator {
    /**
     * Validate SQL schema design
     */
    validate(options: SchemaValidationOptions): Promise<SchemaValidationResult>;
    /**
     * Parse SQL to extract table definitions
     */
    private parseSQLTables;
    /**
     * Parse column definitions
     */
    private parseColumns;
    /**
     * Parse table constraints
     */
    private parseConstraints;
    /**
     * Parse indexes from SQL
     */
    private parseIndexes;
    /**
     * Validate normalization (1NF, 2NF, 3NF)
     */
    private validateNormalization;
    /**
     * Detect repeating groups (field1, field2, field3)
     */
    private detectRepeatingGroups;
    /**
     * Detect partial dependencies (2NF violation)
     */
    private detectPartialDependencies;
    /**
     * Detect transitive dependencies (3NF violation)
     */
    private detectTransitiveDependencies;
    /**
     * Validate constraints (foreign keys, unique, not null)
     */
    private validateConstraints;
    /**
     * Check for missing indexes on foreign keys
     */
    private checkMissingIndexes;
    /**
     * Detect schema anti-patterns
     */
    private detectAntiPatterns;
    /**
     * Calculate overall schema score
     */
    private calculateSchemaScore;
}
