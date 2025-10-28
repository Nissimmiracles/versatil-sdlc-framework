/**
 * GitHub MCP Configuration
 * Production-ready GitHub API integration configuration
 */
export const DEFAULT_GITHUB_MCP_CONFIG = {
    auth: {
        type: 'token',
        token: process.env.GITHUB_TOKEN
    },
    owner: process.env.GITHUB_OWNER || 'MiraclesGIT',
    repo: process.env.GITHUB_REPO || 'versatil-sdlc-framework',
    baseUrl: process.env.GITHUB_ENTERPRISE_URL || 'https://api.github.com',
    rateLimitStrategy: 'backoff',
    cacheTTL: parseInt(process.env.GITHUB_CACHE_TTL || '3600000'), // 1 hour
    maxRetries: 3
};
//# sourceMappingURL=github-mcp-config.js.map