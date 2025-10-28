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
export class SchemaValidator {
    /**
     * Validate SQL schema design
     */
    async validate(options) {
        const issues = [];
        const recommendations = [];
        const tables = [];
        // 1. Parse SQL to extract table definitions
        const parsedTables = this.parseSQLTables(options.sql);
        tables.push(...parsedTables);
        // 2. Validate normalization (1NF, 2NF, 3NF)
        const normalizationResult = this.validateNormalization(parsedTables);
        issues.push(...normalizationResult.issues);
        recommendations.push(...normalizationResult.recommendations);
        // 3. Validate constraints (foreign keys, unique, not null)
        const constraintResult = this.validateConstraints(parsedTables);
        issues.push(...constraintResult.issues);
        recommendations.push(...constraintResult.recommendations);
        // 4. Check for missing indexes on foreign keys
        const indexResult = this.checkMissingIndexes(parsedTables);
        issues.push(...indexResult.issues);
        recommendations.push(...indexResult.recommendations);
        // 5. Detect schema anti-patterns
        const antiPatternResult = this.detectAntiPatterns(parsedTables, options.sql);
        issues.push(...antiPatternResult.issues);
        recommendations.push(...antiPatternResult.recommendations);
        // 6. Calculate overall score
        const score = this.calculateSchemaScore(issues);
        return {
            valid: issues.filter(i => i.severity === 'critical').length === 0,
            score,
            normalizationLevel: normalizationResult.level,
            issues,
            recommendations: Array.from(new Set(recommendations)), // Remove duplicates
            tables
        };
    }
    /**
     * Parse SQL to extract table definitions
     */
    parseSQLTables(sql) {
        const tables = [];
        const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:"?(\w+)"?)\s*\(([\s\S]+?)\);/gi;
        let match;
        while ((match = createTableRegex.exec(sql)) !== null) {
            const tableName = match[1];
            const columnsDef = match[2];
            const table = {
                name: tableName,
                columns: this.parseColumns(columnsDef),
                constraints: this.parseConstraints(columnsDef),
                indexes: this.parseIndexes(sql, tableName)
            };
            tables.push(table);
        }
        return tables;
    }
    /**
     * Parse column definitions
     */
    parseColumns(columnsDef) {
        const columns = [];
        const lines = columnsDef.split(',').map(l => l.trim());
        for (const line of lines) {
            // Skip constraint lines
            if (line.match(/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)/i)) {
                continue;
            }
            const columnMatch = line.match(/^(?:"?(\w+)"?)\s+(\w+(?:\(\d+\))?)\s*(.*)/i);
            if (columnMatch) {
                const name = columnMatch[1];
                const type = columnMatch[2];
                const modifiers = columnMatch[3] || '';
                columns.push({
                    name,
                    type,
                    nullable: !modifiers.includes('NOT NULL'),
                    primaryKey: modifiers.includes('PRIMARY KEY'),
                    unique: modifiers.includes('UNIQUE'),
                    hasIndex: false // Will be set later when checking indexes
                });
            }
        }
        return columns;
    }
    /**
     * Parse table constraints
     */
    parseConstraints(columnsDef) {
        const constraints = [];
        const lines = columnsDef.split(',').map(l => l.trim());
        for (const line of lines) {
            // Primary key
            const pkMatch = line.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
                constraints.push({
                    type: 'primary_key',
                    columns: pkMatch[1].split(',').map(c => c.trim().replace(/"/g, ''))
                });
            }
            // Foreign key
            const fkMatch = line.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
            if (fkMatch) {
                constraints.push({
                    type: 'foreign_key',
                    columns: fkMatch[1].split(',').map(c => c.trim().replace(/"/g, '')),
                    references: {
                        table: fkMatch[2],
                        columns: fkMatch[3].split(',').map(c => c.trim().replace(/"/g, ''))
                    }
                });
            }
            // Unique
            const uniqueMatch = line.match(/UNIQUE\s*\(([^)]+)\)/i);
            if (uniqueMatch) {
                constraints.push({
                    type: 'unique',
                    columns: uniqueMatch[1].split(',').map(c => c.trim().replace(/"/g, ''))
                });
            }
        }
        return constraints;
    }
    /**
     * Parse indexes from SQL
     */
    parseIndexes(sql, tableName) {
        const indexes = [];
        const indexRegex = new RegExp(`CREATE\\s+(UNIQUE\\s+)?INDEX\\s+(?:IF NOT EXISTS\\s+)?(?:"?(\\w+)"?)\\s+ON\\s+${tableName}\\s*\\(([^)]+)\\)`, 'gi');
        let match;
        while ((match = indexRegex.exec(sql)) !== null) {
            indexes.push({
                name: match[2],
                columns: match[3].split(',').map(c => c.trim().replace(/"/g, '')),
                unique: !!match[1]
            });
        }
        return indexes;
    }
    /**
     * Validate normalization (1NF, 2NF, 3NF)
     */
    validateNormalization(tables) {
        const issues = [];
        const recommendations = [];
        let level = '3NF';
        for (const table of tables) {
            // Check 1NF: No repeating groups (columns like field1, field2, field3)
            const repeatingGroups = this.detectRepeatingGroups(table);
            if (repeatingGroups.length > 0) {
                level = 'NONE';
                issues.push({
                    type: 'normalization',
                    severity: 'high',
                    message: `Table "${table.name}" violates 1NF: Repeating groups detected (${repeatingGroups.join(', ')})`,
                    suggestion: `Create a separate table for ${repeatingGroups[0]}_* columns with a foreign key to ${table.name}`
                });
                recommendations.push(`Refactor ${table.name} to eliminate repeating groups`);
            }
            // Check 2NF: No partial dependencies (all non-key columns depend on entire primary key)
            const partialDependencies = this.detectPartialDependencies(table);
            if (partialDependencies.length > 0 && level !== 'NONE') {
                level = '1NF';
                issues.push({
                    type: 'normalization',
                    severity: 'medium',
                    message: `Table "${table.name}" violates 2NF: Partial dependencies detected`,
                    suggestion: `Extract partially dependent columns into separate tables`
                });
                recommendations.push(`Ensure all non-key columns depend on the entire primary key in ${table.name}`);
            }
            // Check 3NF: No transitive dependencies (non-key columns don't depend on other non-key columns)
            const transitiveDependencies = this.detectTransitiveDependencies(table);
            if (transitiveDependencies.length > 0 && level === '3NF') {
                level = '2NF';
                issues.push({
                    type: 'normalization',
                    severity: 'low',
                    message: `Table "${table.name}" may violate 3NF: Potential transitive dependencies detected`,
                    suggestion: `Review non-key columns for transitive dependencies`
                });
                recommendations.push(`Consider extracting transitive dependencies in ${table.name}`);
            }
        }
        return { level, issues, recommendations };
    }
    /**
     * Detect repeating groups (field1, field2, field3)
     */
    detectRepeatingGroups(table) {
        const groups = new Set();
        const columnNames = table.columns.map(c => c.name);
        // Look for patterns like: phone1, phone2, phone3 or address_1, address_2
        for (const col of columnNames) {
            const baseMatch = col.match(/^(.+?)[\d_]+$/);
            if (baseMatch) {
                const base = baseMatch[1].replace(/_$/, '');
                const similarCols = columnNames.filter(c => c.startsWith(base) && c !== col);
                if (similarCols.length > 0) {
                    groups.add(base);
                }
            }
        }
        return Array.from(groups);
    }
    /**
     * Detect partial dependencies (2NF violation)
     */
    detectPartialDependencies(table) {
        // Simplified check: If composite primary key exists, flag for manual review
        const pkConstraint = table.constraints.find(c => c.type === 'primary_key');
        if (pkConstraint && pkConstraint.columns.length > 1) {
            return ['Composite primary key detected - manual review needed'];
        }
        return [];
    }
    /**
     * Detect transitive dependencies (3NF violation)
     */
    detectTransitiveDependencies(table) {
        // Simplified check: Look for columns that reference other non-PK columns
        // Example: customer_name in orders table (should reference customers.name via foreign key)
        const transitives = [];
        for (const col of table.columns) {
            if (!col.primaryKey && !col.foreignKey) {
                // Check if column name suggests it belongs to another entity
                if (col.name.includes('_name') || col.name.includes('_address')) {
                    transitives.push(col.name);
                }
            }
        }
        return transitives;
    }
    /**
     * Validate constraints (foreign keys, unique, not null)
     */
    validateConstraints(tables) {
        const issues = [];
        const recommendations = [];
        for (const table of tables) {
            // Check for missing primary key
            const hasPK = table.columns.some(c => c.primaryKey) ||
                table.constraints.some(c => c.type === 'primary_key');
            if (!hasPK) {
                issues.push({
                    type: 'constraint',
                    severity: 'critical',
                    message: `Table "${table.name}" missing primary key`,
                    suggestion: `Add a primary key constraint: ALTER TABLE ${table.name} ADD PRIMARY KEY (id);`
                });
                recommendations.push(`Add primary key to ${table.name}`);
            }
            // Check for missing NOT NULL on required columns
            for (const col of table.columns) {
                if (col.primaryKey && col.nullable) {
                    issues.push({
                        type: 'constraint',
                        severity: 'high',
                        message: `Primary key column "${col.name}" in table "${table.name}" is nullable`,
                        suggestion: `Add NOT NULL constraint to ${col.name}`
                    });
                }
            }
            // Check for orphaned foreign keys (referencing non-existent tables)
            for (const constraint of table.constraints) {
                if (constraint.type === 'foreign_key' && constraint.references) {
                    const referencedTable = tables.find(t => t.name === constraint.references.table);
                    if (!referencedTable) {
                        issues.push({
                            type: 'constraint',
                            severity: 'high',
                            message: `Foreign key in "${table.name}" references non-existent table "${constraint.references.table}"`,
                            suggestion: `Create table ${constraint.references.table} or remove foreign key constraint`
                        });
                    }
                }
            }
        }
        return { issues, recommendations };
    }
    /**
     * Check for missing indexes on foreign keys
     */
    checkMissingIndexes(tables) {
        const issues = [];
        const recommendations = [];
        for (const table of tables) {
            // Foreign keys should have indexes for performance
            const fkConstraints = table.constraints.filter(c => c.type === 'foreign_key');
            for (const fk of fkConstraints) {
                const fkColumn = fk.columns[0];
                const hasIndex = table.indexes.some(idx => idx.columns.includes(fkColumn));
                if (!hasIndex) {
                    issues.push({
                        type: 'index',
                        severity: 'medium',
                        message: `Missing index on foreign key column "${fkColumn}" in table "${table.name}"`,
                        suggestion: `CREATE INDEX idx_${table.name}_${fkColumn} ON ${table.name}(${fkColumn});`
                    });
                    recommendations.push(`Add index to ${table.name}.${fkColumn} for better join performance`);
                }
            }
        }
        return { issues, recommendations };
    }
    /**
     * Detect schema anti-patterns
     */
    detectAntiPatterns(tables, sql) {
        const issues = [];
        const recommendations = [];
        for (const table of tables) {
            // 1. God table (too many columns)
            if (table.columns.length > 20) {
                issues.push({
                    type: 'anti-pattern',
                    severity: 'medium',
                    message: `Table "${table.name}" has ${table.columns.length} columns (god table anti-pattern)`,
                    suggestion: `Consider splitting ${table.name} into smaller, focused tables`
                });
                recommendations.push(`Refactor ${table.name} into smaller tables`);
            }
            // 2. EAV (Entity-Attribute-Value) anti-pattern
            const hasEAV = table.columns.some(c => c.name === 'attribute') &&
                table.columns.some(c => c.name === 'value');
            if (hasEAV) {
                issues.push({
                    type: 'anti-pattern',
                    severity: 'high',
                    message: `Table "${table.name}" appears to use EAV pattern (poor query performance)`,
                    suggestion: `Use JSONB column or proper normalized tables instead of EAV`
                });
                recommendations.push(`Replace EAV pattern in ${table.name} with structured columns or JSONB`);
            }
            // 3. ENUM abuse (using VARCHAR for fixed values)
            const enumColumns = table.columns.filter(c => c.name.includes('status') || c.name.includes('type') || c.name.includes('state'));
            if (enumColumns.length > 0 && !sql.includes('CREATE TYPE')) {
                recommendations.push(`Consider using PostgreSQL ENUM type for ${enumColumns.map(c => c.name).join(', ')}`);
            }
        }
        return { issues, recommendations };
    }
    /**
     * Calculate overall schema score
     */
    calculateSchemaScore(issues) {
        let score = 100;
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical':
                    score -= 20;
                    break;
                case 'high':
                    score -= 10;
                    break;
                case 'medium':
                    score -= 5;
                    break;
                case 'low':
                    score -= 2;
                    break;
            }
        }
        return Math.max(0, score);
    }
}
//# sourceMappingURL=schema-validator.js.map