/**
 * VERSATIL SDLC Framework - Stress Test Configuration
 * Configuration for automatic stress test execution (Rule 2)
 */
/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
    enabled: true,
    blockOnFailure: false,
    timeout: 120000, // 2 minutes
    minTestDuration: 5000, // 5 seconds
    maxTestDuration: 300000, // 5 minutes
    logPath: process.env.HOME + '/.versatil/logs/stress-test-runner.log',
    statusPath: process.env.HOME + '/.versatil/status/stress-test-status.json',
    apiFilePatterns: [
        '*.api.*',
        '*/routes/*',
        '*/controllers/*',
        '*/api/*',
        '*/endpoints/*',
        '*/handlers/*',
    ],
    frameworkDetection: {
        express: {
            patterns: [
                /(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            ],
            enabled: true,
        },
        fastify: {
            patterns: [
                /fastify\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            ],
            enabled: true,
        },
        nestjs: {
            patterns: [
                /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
            ],
            enabled: true,
        },
        nextjs: {
            pathPatterns: ['/api/', '/pages/api/', '/app/api/'],
            enabled: true,
        },
    },
    testSelection: {
        strategy: 'smart',
        smartSelection: {
            affectedOnly: true,
            includeRelated: true,
            maxTests: 5,
        },
    },
    reporting: {
        statusline: true,
        logFile: true,
        console: true,
        metrics: true,
    },
};
/**
 * Load configuration from environment or file
 */
export async function loadConfig() {
    // Try to load from .cursor/hooks.json
    try {
        const fs = await import('fs');
        const path = await import('path');
        const configPath = path.resolve(process.cwd(), '.cursor/hooks.json');
        if (fs.existsSync(configPath)) {
            const configFile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (configFile.settings?.stressTestConfig) {
                return {
                    ...DEFAULT_CONFIG,
                    ...configFile.settings.stressTestConfig,
                };
            }
        }
    }
    catch (error) {
        // Fall back to default config
    }
    return DEFAULT_CONFIG;
}
/**
 * Detect related endpoints for smart test selection
 * Example: If POST /api/users changes, also test GET /api/users, GET /api/users/:id
 */
export function detectRelatedEndpoints(changedEndpoint) {
    const related = {
        endpoint: changedEndpoint.path,
        method: changedEndpoint.method,
        relatedEndpoints: [],
    };
    // CRUD siblings (same resource, different methods)
    const resourcePath = changedEndpoint.path.replace(/\/:[\w]+$/, ''); // Remove :id parameter
    const crudMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of crudMethods) {
        if (method !== changedEndpoint.method) {
            related.relatedEndpoints.push({
                endpoint: resourcePath,
                method,
                relationship: 'crud-sibling',
            });
            // Also include individual resource endpoints (e.g., GET /api/users/:id)
            if (method === 'GET' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
                related.relatedEndpoints.push({
                    endpoint: `${resourcePath}/:id`,
                    method,
                    relationship: 'crud-sibling',
                });
            }
        }
    }
    // Parent-child relationships (e.g., /api/users/:userId/posts)
    const pathParts = changedEndpoint.path.split('/').filter(p => p);
    if (pathParts.length > 2) {
        // This might be a child resource
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        related.relatedEndpoints.push({
            endpoint: parentPath,
            method: 'GET',
            relationship: 'parent-child',
        });
    }
    return related;
}
/**
 * Severity thresholds for test results
 */
export const SEVERITY_THRESHOLDS = {
    errorRate: {
        info: 0,
        warning: 5,
        medium: 10,
        high: 15,
        critical: 20,
    },
    responseTime: {
        info: 0,
        warning: 1000, // 1 second
        medium: 2000, // 2 seconds
        high: 5000, // 5 seconds
        critical: 10000, // 10 seconds
    },
    throughput: {
        info: 100,
        warning: 50,
        medium: 25,
        high: 10,
        critical: 5,
    },
};
//# sourceMappingURL=stress-test-config.js.map