/**
 * Shadcn MCP Configuration
 * Production-ready component analysis configuration
 */
export const DEFAULT_SHADCN_MCP_CONFIG = {
    projectPath: process.cwd(),
    componentsPath: process.env.SHADCN_COMPONENTS_PATH || 'src/components/ui',
    filePatterns: ['**/*.{ts,tsx,js,jsx}'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    analysisTimeout: parseInt(process.env.SHADCN_ANALYSIS_TIMEOUT || '5000')
};
//# sourceMappingURL=shadcn-mcp-config.js.map