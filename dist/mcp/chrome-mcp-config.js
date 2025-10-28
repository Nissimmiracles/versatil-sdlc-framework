/**
 * Chrome MCP Configuration
 * Production-ready browser automation configuration
 */
export const DEFAULT_CHROME_MCP_CONFIG = {
    browserType: 'chromium',
    headless: process.env.CHROME_MCP_HEADLESS === 'true',
    devtools: process.env.CHROME_MCP_DEVTOOLS === 'true',
    slowMo: parseInt(process.env.CHROME_MCP_SLOW_MO || '0'),
    viewport: { width: 1920, height: 1080 },
    timeout: parseInt(process.env.CHROME_MCP_TIMEOUT || '30000'),
    sessionTimeout: parseInt(process.env.CHROME_MCP_SESSION_TIMEOUT || '300000'),
    baseURL: process.env.CHROME_MCP_BASE_URL || 'http://localhost:3000'
};
//# sourceMappingURL=chrome-mcp-config.js.map