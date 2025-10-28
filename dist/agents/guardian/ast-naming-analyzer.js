/**
 * VERSATIL SDLC Framework - AST Naming Convention Analyzer
 *
 * Analyzes TypeScript/JavaScript code for naming convention violations using AST parsing.
 * Detects: camelCase, PascalCase, snake_case, UPPER_SNAKE_CASE
 *
 * Part of Guardian's Context Layer Verification (v7.9.0)
 */
import * as parser from '@typescript-eslint/parser';
import { readFileSync, existsSync } from 'fs';
/**
 * Main entry point: Analyze naming conventions in a TypeScript/JavaScript file
 */
export async function analyzeNamingConventions(filePath, userPreferences) {
    // Validate file exists
    if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    // Read file content
    const sourceCode = readFileSync(filePath, 'utf-8');
    // Parse AST
    let ast;
    try {
        ast = parser.parse(sourceCode, {
            loc: true,
            range: true,
            tokens: false,
            comment: false,
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
                globalReturn: false
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to parse ${filePath}: ${error.message}`);
    }
    // Extract identifiers
    const identifiers = extractIdentifiers(ast);
    // Detect violations
    const violations = detectViolations(identifiers, userPreferences);
    // Calculate distribution
    const distribution = calculateDistribution(identifiers);
    // Calculate conformance rate
    const totalIdentifiers = identifiers.length;
    const conformanceRate = totalIdentifiers > 0
        ? Math.round(((totalIdentifiers - violations.length) / totalIdentifiers) * 100)
        : 100;
    // Generate summary
    const summary = generateSummary(totalIdentifiers, violations.length, conformanceRate);
    return {
        filePath,
        totalIdentifiers,
        violations,
        conformanceRate,
        distribution,
        summary
    };
}
/**
 * Extract all relevant identifiers from AST
 */
function extractIdentifiers(ast) {
    const identifiers = [];
    // Traverse AST using visitor pattern
    traverse(ast, {
        // Variables and constants
        VariableDeclarator(node) {
            if (node.id.type === 'Identifier') {
                const isConstant = node.parent?.type === 'VariableDeclaration' && node.parent.kind === 'const';
                identifiers.push({
                    name: node.id.name,
                    type: isConstant ? 'constant' : 'variable',
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0
                });
            }
        },
        // Functions
        FunctionDeclaration(node) {
            if (node.id) {
                identifiers.push({
                    name: node.id.name,
                    type: 'function',
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0
                });
            }
        },
        // Classes
        ClassDeclaration(node) {
            if (node.id) {
                identifiers.push({
                    name: node.id.name,
                    type: 'class',
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0
                });
            }
        },
        // Interfaces
        TSInterfaceDeclaration(node) {
            identifiers.push({
                name: node.id.name,
                type: 'interface',
                line: node.loc?.start.line || 0,
                column: node.loc?.start.column || 0
            });
        },
        // Methods
        MethodDefinition(node) {
            if (node.key.type === 'Identifier') {
                identifiers.push({
                    name: node.key.name,
                    type: 'method',
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0
                });
            }
        },
        // Properties (class properties and object properties)
        PropertyDefinition(node) {
            if (node.key.type === 'Identifier') {
                identifiers.push({
                    name: node.key.name,
                    type: 'property',
                    line: node.loc?.start.line || 0,
                    column: node.loc?.start.column || 0
                });
            }
        }
    });
    return identifiers;
}
/**
 * Simple AST traversal helper
 */
function traverse(node, visitors) {
    if (!node || typeof node !== 'object')
        return;
    // Call visitor for this node type
    const visitor = visitors[node.type];
    if (visitor) {
        visitor(node);
    }
    // Recursively traverse children
    for (const key of Object.keys(node)) {
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                traverse(item, visitors);
            }
        }
        else if (typeof child === 'object' && child !== null) {
            traverse(child, visitors);
        }
    }
}
/**
 * Detect naming convention violations
 */
function detectViolations(identifiers, userPreferences) {
    const violations = [];
    for (const identifier of identifiers) {
        const detectedConvention = detectConvention(identifier.name);
        const expectedConvention = userPreferences[identifier.type === 'method' ? 'methods' : identifier.type === 'property' ? 'properties' : identifier.type + 's'];
        if (detectedConvention !== expectedConvention) {
            violations.push({
                identifier: identifier.name,
                line: identifier.line,
                column: identifier.column,
                type: identifier.type,
                expected: expectedConvention,
                actual: detectedConvention,
                suggestion: convertNamingConvention(identifier.name, expectedConvention)
            });
        }
    }
    return violations;
}
/**
 * Detect which naming convention an identifier follows
 */
function detectConvention(identifier) {
    // UPPER_SNAKE_CASE: ALL_CAPS with underscores
    if (/^[A-Z][A-Z0-9_]*$/.test(identifier)) {
        return 'UPPER_SNAKE_CASE';
    }
    // PascalCase: Starts with uppercase, no underscores
    if (/^[A-Z][a-zA-Z0-9]*$/.test(identifier)) {
        return 'PascalCase';
    }
    // snake_case: All lowercase with underscores
    if (/^[a-z][a-z0-9_]*$/.test(identifier) && identifier.includes('_')) {
        return 'snake_case';
    }
    // camelCase: Starts with lowercase, no underscores
    if (/^[a-z][a-zA-Z0-9]*$/.test(identifier)) {
        return 'camelCase';
    }
    return 'other';
}
/**
 * Convert identifier to target naming convention
 */
function convertNamingConvention(identifier, targetConvention) {
    // Split identifier into words
    const words = identifier
        .replace(/([A-Z])/g, ' $1') // Split on uppercase
        .replace(/_/g, ' ') // Split on underscores
        .trim()
        .split(/\s+/)
        .map(w => w.toLowerCase());
    switch (targetConvention) {
        case 'camelCase':
            return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
        case 'PascalCase':
            return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        case 'snake_case':
            return words.join('_');
        case 'UPPER_SNAKE_CASE':
            return words.join('_').toUpperCase();
        default:
            return identifier;
    }
}
/**
 * Calculate distribution of naming conventions per identifier type
 */
function calculateDistribution(identifiers) {
    const distribution = {
        variables: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, other: 0 },
        functions: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, other: 0 },
        classes: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, other: 0 },
        methods: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, other: 0 },
        properties: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, other: 0 }
    };
    for (const identifier of identifiers) {
        const convention = detectConvention(identifier.name);
        const category = identifier.type === 'variable' || identifier.type === 'constant' ? 'variables' : identifier.type + 's';
        if (category in distribution) {
            const dist = distribution[category];
            if (convention in dist) {
                dist[convention]++;
            }
        }
    }
    return distribution;
}
/**
 * Generate human-readable summary
 */
function generateSummary(total, violations, conformanceRate) {
    if (violations === 0) {
        return `All ${total} identifiers follow user-preferred naming conventions. ✅`;
    }
    const plural = violations === 1 ? 'violation' : 'violations';
    return `Found ${violations} naming ${plural} in ${total} identifiers. Conformance rate: ${conformanceRate}%.`;
}
//# sourceMappingURL=ast-naming-analyzer.js.map