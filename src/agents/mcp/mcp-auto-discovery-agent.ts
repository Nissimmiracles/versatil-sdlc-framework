import { BaseAgent, AgentResponse, AgentActivationContext } from '../base-agent';
import { VERSATILLogger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface MCPDefinition {
  name: string;
  version: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  status?: 'available' | 'unavailable' | 'error';
  [key: string]: any;
}

export interface MCPDiscoveryResult {
  discovered: MCPDefinition[];
  available: number;
  unavailable: number;
  sources: string[];
  timestamp: number;
}

export class MCPAutoDiscoveryAgent extends BaseAgent {
  systemPrompt = 'MCP Auto Discovery Agent - Discovers and validates available MCP servers';
  name = 'MCP Discovery';
  id = 'mcp-discovery';
  specialization = 'MCP Discovery and Validation';

  private discoveredMCPs: Map<string, MCPDefinition> = new Map();
  private lastScan: number = 0;
  private scanInterval: number = 60 * 60 * 1000;

  constructor(private logger: VERSATILLogger) {
    super();
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
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
    } catch (error) {
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

  private async discoverMCPs(): Promise<MCPDiscoveryResult> {
    const discovered: MCPDefinition[] = [];
    const sources: string[] = [];

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

  private async scanCursorConfig(): Promise<MCPDefinition[]> {
    try {
      const cursorConfigPath = path.join(process.cwd(), '.cursor', 'mcp_config.json');
      const content = await fs.readFile(cursorConfigPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.mcpServers) {
        return [];
      }

      const mcps: MCPDefinition[] = [];

      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        const server = serverConfig as any;
        const mcp: MCPDefinition = {
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
    } catch (error) {
      this.logger.debug('No Cursor MCP config found or error reading', {}, 'MCPDiscovery');
      return [];
    }
  }

  private async scanClaudeConfig(): Promise<MCPDefinition[]> {
    try {
      const claudeConfigPath = path.join(os.homedir(), '.claude', 'mcp_config.json');
      const content = await fs.readFile(claudeConfigPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.mcpServers) {
        return [];
      }

      const mcps: MCPDefinition[] = [];

      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        const server = serverConfig as any;
        const mcp: MCPDefinition = {
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
    } catch (error) {
      this.logger.debug('No Claude MCP config found or error reading', {}, 'MCPDiscovery');
      return [];
    }
  }

  private async scanNpmPackages(): Promise<MCPDefinition[]> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      const mcps: MCPDefinition[] = [];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (name.includes('mcp') || name.includes('model-context-protocol')) {
          const mcp: MCPDefinition = {
            name,
            version: version as string,
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
    } catch (error) {
      this.logger.debug('Error scanning npm packages', {}, 'MCPDiscovery');
      return [];
    }
  }

  private async validateMCP(server: any): Promise<'available' | 'unavailable' | 'error'> {
    try {
      if (server.command === 'node' || server.command === 'npx') {
        return 'available';
      }

      try {
        await fs.access(server.command);
        return 'available';
      } catch {
        return 'unavailable';
      }
    } catch {
      return 'error';
    }
  }

  private generateSuggestions(result: MCPDiscoveryResult): any[] {
    const suggestions: any[] = [];

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

  getDiscoveredMCPs(): MCPDefinition[] {
    return Array.from(this.discoveredMCPs.values());
  }

  getMCPByName(name: string): MCPDefinition | undefined {
    return this.discoveredMCPs.get(name);
  }

  getLastScanTime(): number {
    return this.lastScan;
  }

  shouldRescan(): boolean {
    return Date.now() - this.lastScan > this.scanInterval;
  }
}