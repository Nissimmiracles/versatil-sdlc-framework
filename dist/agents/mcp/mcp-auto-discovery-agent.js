import { BaseAgent } from '../core/base-agent.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
export class MCPAutoDiscoveryAgent extends BaseAgent {
    constructor(logger) {
        super();
        this.logger = logger;
        this.systemPrompt = 'MCP Auto Discovery Agent - Discovers and validates available MCP servers';
        this.name = 'MCP Discovery';
        this.id = 'mcp-discovery';
        this.specialization = 'MCP Discovery and Validation';
        this.discoveredMCPs = new Map();
        this.lastScan = 0;
        this.scanInterval = 60 * 60 * 1000;
    }
    async activate(context) {
        try {
            this.logger.info('Starting MCP auto-discovery', {}, 'MCPDiscovery');
            const result = await this.discoverMCPs();
            const suggestions = this.generateSuggestions(result);
            this.lastScan = Date.now();
            return {
                agentId: this.id,
                message: `Discovered ${result.discovered.length} MCP servers (${result.available} available)`,
                suggestions,
                priority: 'low',
                handoffTo: [],
                context: {
                    discoveredMCPs: result.discovered,
                    available: result.available,
                    unavailable: result.unavailable,
                    sources: result.sources,
                    timestamp: result.timestamp,
                },
            };
        }
        catch (error) {
            this.logger.error('MCP discovery failed', {
                error: error instanceof Error ? error.message : String(error),
            }, 'MCPDiscovery');
            return {
                agentId: this.id,
                message: 'MCP discovery failed',
                suggestions: [
                    {
                        type: 'error',
                        message: `Discovery error: ${error instanceof Error ? error.message : String(error)}`,
                        priority: 'medium',
                    },
                ],
                priority: 'medium',
                handoffTo: [],
                context: {},
            };
        }
    }
    async discoverMCPs() {
        const discovered = [];
        const sources = [];
        const cursorConfig = await this.scanCursorConfig();
        if (cursorConfig.length > 0) {
            discovered.push(...cursorConfig);
            sources.push('.cursor/mcp_config.json');
        }
        const claudeConfig = await this.scanClaudeConfig();
        if (claudeConfig.length > 0) {
            discovered.push(...claudeConfig);
            sources.push('~/.claude/mcp_config.json');
        }
        const npmMCPs = await this.scanNpmPackages();
        if (npmMCPs.length > 0) {
            discovered.push(...npmMCPs);
            sources.push('node_modules');
        }
        const available = discovered.filter((m) => m.status === 'available').length;
        const unavailable = discovered.filter((m) => m.status === 'unavailable').length;
        for (const mcp of discovered) {
            this.discoveredMCPs.set(mcp.name, mcp);
        }
        return {
            discovered,
            available,
            unavailable,
            sources,
            timestamp: Date.now(),
        };
    }
    async scanCursorConfig() {
        try {
            const cursorConfigPath = path.join(process.cwd(), '.cursor', 'mcp_config.json');
            const content = await fs.readFile(cursorConfigPath, 'utf-8');
            const config = JSON.parse(content);
            if (!config.mcpServers) {
                return [];
            }
            const mcps = [];
            for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                const server = serverConfig;
                const mcp = {
                    name,
                    version: server.version || 'unknown',
                    command: server.command,
                    args: server.args || [],
                    env: server.env || {},
                    source: 'cursor',
                    status: await this.validateMCP(server),
                };
                mcps.push(mcp);
                this.logger.info(`Found MCP in Cursor config: ${name}`, {
                    status: mcp.status,
                }, 'MCPDiscovery');
            }
            return mcps;
        }
        catch (error) {
            this.logger.debug('No Cursor MCP config found or error reading', {}, 'MCPDiscovery');
            return [];
        }
    }
    async scanClaudeConfig() {
        try {
            const claudeConfigPath = path.join(os.homedir(), '.claude', 'mcp_config.json');
            const content = await fs.readFile(claudeConfigPath, 'utf-8');
            const config = JSON.parse(content);
            if (!config.mcpServers) {
                return [];
            }
            const mcps = [];
            for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                const server = serverConfig;
                const mcp = {
                    name,
                    version: server.version || 'unknown',
                    command: server.command,
                    args: server.args || [],
                    env: server.env || {},
                    source: 'claude',
                    status: await this.validateMCP(server),
                };
                mcps.push(mcp);
                this.logger.info(`Found MCP in Claude config: ${name}`, {
                    status: mcp.status,
                }, 'MCPDiscovery');
            }
            return mcps;
        }
        catch (error) {
            this.logger.debug('No Claude MCP config found or error reading', {}, 'MCPDiscovery');
            return [];
        }
    }
    async scanNpmPackages() {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);
            const mcps = [];
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            for (const [name, version] of Object.entries(allDeps)) {
                if (name.includes('mcp') || name.includes('model-context-protocol')) {
                    const mcp = {
                        name,
                        version: version,
                        command: 'npm',
                        args: ['exec', name],
                        source: 'npm',
                        status: 'available',
                    };
                    mcps.push(mcp);
                    this.logger.info(`Found MCP npm package: ${name}`, {
                        version,
                    }, 'MCPDiscovery');
                }
            }
            return mcps;
        }
        catch (error) {
            this.logger.debug('Error scanning npm packages', {}, 'MCPDiscovery');
            return [];
        }
    }
    async validateMCP(server) {
        try {
            if (server.command === 'node' || server.command === 'npx') {
                return 'available';
            }
            try {
                await fs.access(server.command);
                return 'available';
            }
            catch {
                return 'unavailable';
            }
        }
        catch {
            return 'error';
        }
    }
    generateSuggestions(result) {
        const suggestions = [];
        if (result.unavailable > 0) {
            suggestions.push({
                type: 'warning',
                message: `${result.unavailable} MCP server(s) unavailable - check configuration`,
                priority: 'medium',
                file: '.cursor/mcp_config.json',
            });
        }
        if (result.discovered.length === 0) {
            suggestions.push({
                type: 'info',
                message: 'No MCP servers discovered - consider installing MCP tools',
                priority: 'low',
                recommendation: 'Install @modelcontextprotocol/sdk or configure .cursor/mcp_config.json',
            });
        }
        const knownMCPs = [
            '@modelcontextprotocol/sdk',
            '@steipete/claude-code-mcp',
            'versatil-sdlc-framework',
        ];
        for (const known of knownMCPs) {
            const found = result.discovered.find((m) => m.name === known);
            if (!found) {
                suggestions.push({
                    type: 'info',
                    message: `Consider installing ${known} for enhanced capabilities`,
                    priority: 'low',
                    recommendation: `npm install ${known}`,
                });
            }
        }
        if (result.available > 0) {
            suggestions.push({
                type: 'success',
                message: `${result.available} MCP server(s) available and ready to use`,
                priority: 'low',
            });
        }
        return suggestions;
    }
    getDiscoveredMCPs() {
        return Array.from(this.discoveredMCPs.values());
    }
    getMCPByName(name) {
        return this.discoveredMCPs.get(name);
    }
    getLastScanTime() {
        return this.lastScan;
    }
    shouldRescan() {
        return Date.now() - this.lastScan > this.scanInterval;
    }
}
//# sourceMappingURL=mcp-auto-discovery-agent.js.map