/* eslint-disable no-useless-escape */
/**
 * VERSATIL SDLC Framework - MCP Auto-Update System
 * Continuously discovers, evaluates, and integrates new MCPs
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { vectorMemoryStore } from '../rag/vector-memory-store.js';
import { MCPAutoDiscoveryAgent, MCPDefinition } from '../agents/mcp/mcp-auto-discovery-agent.js';
import { environmentScanner } from '../environment/environment-scanner.js';
import { exaMCPExecutor } from './exa-mcp-executor.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AutoUpdateConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  autoInstall: boolean;
  requireApproval: boolean;
  updateChannels: string[];
  excludePatterns: string[];
  maxAutoInstalls: number;
}

export interface MCPUpdate {
  id: string;
  type: 'new' | 'update' | 'security' | 'deprecation';
  mcp: MCPDefinition;
  changes?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  autoInstallable: boolean;
}

export class MCPAutoUpdateSystem extends EventEmitter {
  private logger: VERSATILLogger;
  private discoveryAgent: MCPAutoDiscoveryAgent;
  private config: AutoUpdateConfig;
  private updateTimer?: NodeJS.Timeout;
  private updateHistory: Map<string, MCPUpdate[]> = new Map();
  private pendingUpdates: MCPUpdate[] = [];
  private installedVersions: Map<string, string> = new Map();
  
  // Web search simulation (in production would use actual web_search tool)
  private knownMCPSources = [
    'https://github.com/modelcontextprotocol',
    'https://mcp-registry.dev',
    'https://npmjs.com/search?q=mcp',
    'https://github.com/topics/mcp-integration'
  ];
  
  constructor(discoveryAgent: MCPAutoDiscoveryAgent, config?: Partial<AutoUpdateConfig>) {
    super();
    this.logger = new VERSATILLogger();
    this.discoveryAgent = discoveryAgent;
    this.config = {
      enabled: true,
      checkInterval: 3600000, // 1 hour
      autoInstall: true,
      requireApproval: false,
      updateChannels: ['stable', 'community'],
      excludePatterns: [],
      maxAutoInstalls: 5,
      ...config
    };
    
    if (this.config.enabled) {
      this.start();
    }
  }
  
  /**
   * Start the auto-update system
   */
  public start(): void {
    this.logger.info('Starting MCP Auto-Update System', {
      interval: this.config.checkInterval,
      channels: this.config.updateChannels
    }, 'mcp-update');
    
    // Initial check
    this.checkForUpdates();
    
    // Schedule periodic checks
    this.updateTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);
  }
  
  /**
   * Stop the auto-update system
   */
  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
    this.logger.info('Stopped MCP Auto-Update System', {}, 'mcp-update');
  }
  
  /**
   * Main update check routine
   */
  private async checkForUpdates(): Promise<void> {
    try {
      this.logger.info('Checking for MCP updates', {}, 'mcp-update');
      
      // 1. Search for new MCPs
      const newMCPs = await this.searchForNewMCPs();
      
      // 2. Check existing MCPs for updates
      const updates = await this.checkExistingMCPUpdates();
      
      // 3. Check for security updates
      const securityUpdates = await this.checkSecurityUpdates();
      
      // 4. Check for deprecations
      const deprecations = await this.checkDeprecations();
      
      // 5. Compile all updates
      const allUpdates = [
        ...newMCPs.map(mcp => ({ type: 'new', mcp, autoInstallable: true } as MCPUpdate)),
        ...updates,
        ...securityUpdates,
        ...deprecations
      ];
      
      // 6. Evaluate and prioritize updates
      const prioritizedUpdates = await this.evaluateUpdates(allUpdates);
      
      // 7. Apply updates based on configuration
      await this.applyUpdates(prioritizedUpdates);
      
      // 8. Update RAG with new information
      await this.updateRAGKnowledge();
      
      // 9. Notify about updates
      this.emit('updates-checked', {
        total: allUpdates.length,
        applied: prioritizedUpdates.filter(u => u.autoInstallable).length,
        pending: this.pendingUpdates.length
      });
      
    } catch (error) {
      this.logger.error('Error checking for updates', { error }, 'mcp-update');
      this.emit('update-error', error);
    }
  }
  
  /**
   * Search for new MCPs using web research
   */
  private async searchForNewMCPs(): Promise<MCPDefinition[]> {
    const newMCPs: MCPDefinition[] = [];
    const projectContext = await environmentScanner.scanEnvironment();
    
    // Generate search queries based on project needs
    const searchQueries = this.generateSearchQueries(projectContext);
    
    for (const query of searchQueries) {
      // Real web search using Exa MCP
      const results = await this.realWebSearch(query);
      
      for (const result of results) {
        // Check if MCP is already known
        if (!this.isKnownMCP(result.id)) {
          // Validate MCP definition
          if (this.validateMCPDefinition(result)) {
            newMCPs.push(result);
            
            // Store discovery
            await this.storeDiscovery(result, 'web_search', query);
          }
        }
      }
    }
    
    // Search MCP registries
    for (const source of this.knownMCPSources) {
      const registryMCPs = await this.searchMCPRegistry(source);
      
      for (const mcp of registryMCPs) {
        if (!this.isKnownMCP(mcp.id) && this.validateMCPDefinition(mcp)) {
          newMCPs.push(mcp);
          await this.storeDiscovery(mcp, 'registry', source);
        }
      }
    }
    
    this.logger.info(`Found ${newMCPs.length} new MCPs`, {
      mcps: newMCPs.map(m => m.id)
    }, 'mcp-update');
    
    return newMCPs;
  }
  
  /**
   * Check for updates to existing MCPs
   */
  private async checkExistingMCPUpdates(): Promise<MCPUpdate[]> {
    const updates: MCPUpdate[] = [];
    const knownMCPs = await this.getKnownMCPs();
    
    for (const mcp of knownMCPs) {
      // Check npm for version updates
      const latestVersion = await this.checkNPMVersion(mcp.installCommand);
      const currentVersion = this.installedVersions.get(mcp.id) || '0.0.0';
      
      if (this.isNewerVersion(latestVersion, currentVersion)) {
        // Fetch changelog
        const changes = await this.fetchChangelog(mcp, currentVersion, latestVersion);
        
        updates.push({
          id: `${mcp.id}-${latestVersion}`,
          type: 'update',
          mcp: {
            ...mcp,
            version: latestVersion
          },
          changes,
          autoInstallable: !this.hasBreakingChanges(changes)
        });
      }
      
      // Check for new capabilities
      const newCapabilities = await this.checkNewCapabilities(mcp);
      if (newCapabilities.length > 0) {
        updates.push({
          id: `${mcp.id}-capabilities`,
          type: 'update',
          mcp: {
            ...mcp,
            capabilities: [...mcp.capabilities, ...newCapabilities]
          },
          changes: newCapabilities.map(c => `New capability: ${c}`),
          autoInstallable: true
        });
      }
    }
    
    return updates;
  }
  
  /**
   * Check for security updates
   */
  private async checkSecurityUpdates(): Promise<MCPUpdate[]> {
    const securityUpdates: MCPUpdate[] = [];

    // Check security advisories via npm audit
    const advisories = await this.fetchSecurityAdvisories();
    
    for (const advisory of advisories) {
      if (this.isKnownMCP(advisory.mcpId)) {
        securityUpdates.push({
          id: `${advisory.mcpId}-security-${advisory.id}`,
          type: 'security',
          mcp: await this.getMCPById(advisory.mcpId),
          severity: advisory.severity,
          changes: [advisory.description],
          autoInstallable: advisory.severity === 'critical' || advisory.severity === 'high'
        });
      }
    }
    
    return securityUpdates;
  }
  
  /**
   * Check for deprecated MCPs
   */
  private async checkDeprecations(): Promise<MCPUpdate[]> {
    const deprecations: MCPUpdate[] = [];
    const knownMCPs = await this.getKnownMCPs();
    
    for (const mcp of knownMCPs) {
      // Check if MCP is deprecated
      const deprecationInfo = await this.checkDeprecationStatus(mcp);
      
      if (deprecationInfo) {
        deprecations.push({
          id: `${mcp.id}-deprecation`,
          type: 'deprecation',
          mcp,
          changes: [
            `Deprecated: ${deprecationInfo.reason}`,
            deprecationInfo.alternative ? `Alternative: ${deprecationInfo.alternative}` : ''
          ].filter(Boolean),
          autoInstallable: false
        });
      }
    }
    
    return deprecations;
  }
  
  /**
   * Evaluate and prioritize updates
   */
  private async evaluateUpdates(updates: MCPUpdate[]): Promise<MCPUpdate[]> {
    const prioritized = [...updates];
    
    // Sort by priority
    prioritized.sort((a, b) => {
      // Security updates first
      if (a.type === 'security' && b.type !== 'security') return -1;
      if (a.type !== 'security' && b.type === 'security') return 1;
      
      // Then severity
      if (a.severity && b.severity) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      
      // New MCPs that match project needs
      if (a.type === 'new' && b.type !== 'new') return -1;
      if (a.type !== 'new' && b.type === 'new') return 1;
      
      // Regular updates
      if (a.type === 'update' && b.type === 'deprecation') return -1;
      if (a.type === 'deprecation' && b.type === 'update') return 1;
      
      return 0;
    });
    
    // Apply filters
    const filtered = prioritized.filter(update => {
      // Check exclude patterns
      for (const pattern of this.config.excludePatterns) {
        if (update.mcp.id.includes(pattern)) {
          return false;
        }
      }
      
      // Check update channels
      if (update.mcp.channel && !this.config.updateChannels.includes(update.mcp.channel)) {
        return false;
      }
      
      return true;
    });
    
    return filtered;
  }
  
  /**
   * Apply updates based on configuration
   */
  private async applyUpdates(updates: MCPUpdate[]): Promise<void> {
    let autoInstalled = 0;
    
    for (const update of updates) {
      try {
        // Check if requires approval
        if (this.config.requireApproval && (update.type as any) !== 'security') {
          this.pendingUpdates.push(update);
          continue;
        }
        
        // Check auto-install limit
        if (autoInstalled >= this.config.maxAutoInstalls) {
          this.pendingUpdates.push(update);
          continue;
        }
        
        // Apply update based on type
        if (update.autoInstallable && this.config.autoInstall) {
          switch (update.type) {
            case 'new':
              await this.installNewMCP(update.mcp);
              break;
              
            case 'update':
              await this.updateMCP(update.mcp);
              break;
              
            case 'security':
              await this.applySecurityUpdate(update);
              break;
              
            case 'deprecation':
              await this.handleDeprecation(update);
              break;
          }
          
          autoInstalled++;
          
          // Record update
          this.recordUpdate(update);
          
          // Notify
          this.emit('update-applied', update);
        } else {
          this.pendingUpdates.push(update);
        }
      } catch (error) {
        this.logger.error(`Failed to apply update ${update.id}`, { error }, 'mcp-update');
        this.emit('update-failed', { update, error });
      }
    }
    
    this.logger.info(`Applied ${autoInstalled} updates, ${this.pendingUpdates.length} pending`, {}, 'mcp-update');
  }
  
  /**
   * Update RAG with new MCP knowledge
   */
  private async updateRAGKnowledge(): Promise<void> {
    // Store auto-update summary
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'mcp_auto_update_summary',
        timestamp: Date.now(),
        updates: this.updateHistory.size,
        pendingUpdates: this.pendingUpdates.length,
        knownMCPs: (await this.getKnownMCPs()).length
      }),
      metadata: {
        agentId: 'mcp-auto-update',
        timestamp: Date.now(),
        tags: ['mcp', 'update', 'summary']
      }
    });
    
    // Store individual updates
    for (const update of this.pendingUpdates) {
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify({
          type: 'mcp_pending_update',
          update,
          evaluatedAt: Date.now()
        }),
        metadata: {
          agentId: 'mcp-auto-update',
          timestamp: Date.now(),
          tags: ['mcp', 'update', 'pending', update.mcp.id]
        }
      });
    }
  }
  
  // Helper methods
  
  private generateSearchQueries(context: any): string[] {
    const queries: string[] = [];
    
    // Technology-specific queries
    if (context.technology?.framework) {
      queries.push(`${context.technology.framework} MCP integration`);
      queries.push(`Model Context Protocol ${context.technology.framework}`);
    }
    
    // Missing capability queries
    const capabilities = this.identifyMissingCapabilities(context);
    for (const capability of capabilities) {
      queries.push(`MCP ${capability} tool`);
    }
    
    // Pattern-based queries
    if (context.patterns?.architecture) {
      queries.push(`MCP ${context.patterns.architecture[0]} architecture`);
    }
    
    return queries;
  }
  
  private async realWebSearch(query: string): Promise<MCPDefinition[]> {
    const results: MCPDefinition[] = [];

    try {
      // Use real Exa MCP for web search
      const searchResult = await exaMCPExecutor.executeExaMCP('web_search', {
        query: `${query} Model Context Protocol MCP`,
        numResults: 5,
        type: 'auto',
        includeDomains: ['github.com', 'npmjs.com', 'mcp-registry.dev']
      });

      if (searchResult.success && searchResult.data?.results) {
        for (const item of searchResult.data.results) {
          // Extract MCP information from search results
          const mcpId = this.extractMCPId(item.url, item.title);

          if (mcpId && !this.isKnownMCP(mcpId)) {
            // Parse MCP definition from search result
            const mcpDef = await this.parseMCPFromSearchResult(item, query);

            if (mcpDef) {
              results.push(mcpDef);
            }
          }
        }
      }

      this.logger.info(`Web search found ${results.length} new MCPs`, {
        query,
        total_results: searchResult.data?.results?.length || 0
      }, 'mcp-update');

    } catch (error) {
      this.logger.error('Web search failed', { query, error }, 'mcp-update');
    }

    return results;
  }

  /**
   * Extract MCP ID from URL or title
   */
  private extractMCPId(url: string, title: string): string | null {
    // Extract from npm package URL
    const npmMatch = url.match(/npmjs\.com\/package\/([^\/\?]+)/);
    if (npmMatch) return npmMatch[1];

    // Extract from GitHub repo URL
    const githubMatch = url.match(/github\.com\/[^\/]+\/([^\/\?]+)/);
    if (githubMatch) return githubMatch[1].replace(/-mcp$/, '');

    // Extract from title
    const titleMatch = title.match(/([a-z0-9\-]+)-mcp/i);
    if (titleMatch) return titleMatch[1];

    return null;
  }

  /**
   * Parse MCP definition from search result
   */
  private async parseMCPFromSearchResult(searchResult: any, originalQuery: string): Promise<MCPDefinition | null> {
    try {
      const { url, title, snippet } = searchResult;
      const mcpId = this.extractMCPId(url, title);

      if (!mcpId) return null;

      // Determine category from query and snippet
      const category = this.inferCategory(originalQuery, snippet);

      // Extract capabilities from snippet
      const capabilities = this.extractCapabilities(snippet, title);

      // Build install command
      const installCommand = url.includes('npmjs.com')
        ? `npm install ${mcpId}`
        : `npm install ${mcpId}-mcp`;

      return {
        id: mcpId,
        name: title.replace(/\s*-\s*npm.*$/i, '').trim(),
        command: 'npx',
        args: [mcpId],
        description: snippet,
        category,
        capabilities,
        requiredFor: [originalQuery],
        installCommand,
        configTemplate: {},
        documentation: url,
        autoDetectTriggers: [mcpId, ...capabilities],
        channel: 'community',
        version: '1.0.0'
      };

    } catch (error) {
      this.logger.error('Failed to parse MCP from search result', { error }, 'mcp-update');
      return null;
    }
  }

  /**
   * Infer MCP category from context
   */
  private inferCategory(query: string, snippet: string): string {
    const text = `${query} ${snippet}`.toLowerCase();

    if (text.includes('test') || text.includes('qa')) return 'testing';
    if (text.includes('database') || text.includes('sql')) return 'database';
    if (text.includes('api') || text.includes('rest')) return 'api';
    if (text.includes('ui') || text.includes('frontend')) return 'ui';
    if (text.includes('deploy') || text.includes('ci/cd')) return 'deployment';
    if (text.includes('monitor') || text.includes('observability')) return 'monitoring';
    if (text.includes('search') || text.includes('data')) return 'data';
    if (text.includes('ai') || text.includes('ml')) return 'ai-ml';

    return 'utility';
  }

  /**
   * Extract capabilities from text
   */
  private extractCapabilities(snippet: string, title: string): string[] {
    const capabilities = new Set<string>();
    const text = `${snippet} ${title}`.toLowerCase();

    // Common capability patterns
    const patterns = [
      /\b(test|testing|qa|quality)\b/,
      /\b(deploy|deployment|ci\/cd)\b/,
      /\b(monitor|monitoring|observability)\b/,
      /\b(search|query|lookup)\b/,
      /\b(database|db|sql|postgres|mysql)\b/,
      /\b(api|rest|graphql)\b/,
      /\b(ui|frontend|react|vue)\b/,
      /\b(ai|ml|machine learning)\b/,
      /\b(security|auth|authentication)\b/,
      /\b(performance|optimization)\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        capabilities.add(match[1]);
      }
    }

    return Array.from(capabilities);
  }
  
  private identifyMissingCapabilities(context: any): string[] {
    const currentCapabilities = new Set<string>();
    const neededCapabilities = new Set<string>();
    
    // Identify what we have
    // ... implementation
    
    // Identify what we need
    if (context.technology?.framework === 'react') {
      neededCapabilities.add('react-optimization');
      neededCapabilities.add('component-testing');
    }
    
    // Return missing
    return Array.from(neededCapabilities).filter(c => !currentCapabilities.has(c));
  }
  
  private isKnownMCP(id: string): boolean {
    // Check if MCP is already in our registry
    return this.discoveryAgent['mcpRegistry'].has(id);
  }
  
  private validateMCPDefinition(mcp: MCPDefinition): boolean {
    // Validate MCP has all required fields
    return !!(
      mcp.id &&
      mcp.name &&
      mcp.description &&
      mcp.category &&
      mcp.capabilities?.length &&
      mcp.installCommand
    );
  }
  
  private async storeDiscovery(mcp: MCPDefinition, source: string, query: string): Promise<void> {
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'mcp_discovery',
        mcp,
        source,
        query,
        discoveredAt: Date.now()
      }),
      metadata: {
        agentId: 'mcp-auto-update',
        timestamp: Date.now(),
        tags: ['mcp', 'discovery', mcp.id, source]
      }
    });
  }
  
  private async getKnownMCPs(): Promise<MCPDefinition[]> {
    return Array.from(this.discoveryAgent['mcpRegistry'].values());
  }
  
  private async checkNPMVersion(installCommand: string): Promise<string> {
    try {
      // Extract package name from install command
      const packageName = installCommand.match(/@?[\w\-\/]+$/)?.[0];

      if (!packageName) {
        return '0.0.0';
      }

      // Query npm registry for latest version
      const { stdout } = await execAsync(`npm view ${packageName} version`, {
        timeout: 5000
      });

      const version = stdout.trim();

      this.logger.debug(`NPM version check: ${packageName} -> ${version}`, {}, 'mcp-update');

      return version || '0.0.0';

    } catch (error) {
      this.logger.error('Failed to check npm version', { installCommand, error }, 'mcp-update');
      return '0.0.0';
    }
  }
  
  private isNewerVersion(v1: string, v2: string): boolean {
    const parse = (v: string) => v.split('.').map(Number);
    const [major1, minor1, patch1] = parse(v1);
    const [major2, minor2, patch2] = parse(v2);
    
    if (major1 > major2) return true;
    if (major1 === major2 && minor1 > minor2) return true;
    if (major1 === major2 && minor1 === minor2 && patch1 > patch2) return true;
    
    return false;
  }
  
  private hasBreakingChanges(changes: string[]): boolean {
    return changes.some(change => 
      change.toLowerCase().includes('breaking') ||
      change.toLowerCase().includes('incompatible')
    );
  }
  
  private async fetchChangelog(mcp: MCPDefinition, fromVersion: string, toVersion: string): Promise<string[]> {
    // In production, fetch from repository
    return [`Updated from ${fromVersion} to ${toVersion}`];
  }
  
  private async checkNewCapabilities(mcp: MCPDefinition): Promise<string[]> {
    // In production, check documentation for new features
    return [];
  }
  
  private async fetchSecurityAdvisories(): Promise<any[]> {
    const advisories: any[] = [];

    try {
      // Run npm audit to check for security vulnerabilities
      const { stdout } = await execAsync('npm audit --json', {
        cwd: process.cwd(),
        timeout: 10000
      }).catch(() => ({ stdout: '{}' })); // npm audit returns non-zero on vulnerabilities

      const auditResult = JSON.parse(stdout);

      if (auditResult.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditResult.vulnerabilities)) {
          const vuln = vulnData as any;

          // Check if this is an MCP package
          if (packageName.includes('mcp') || packageName.includes('model-context')) {
            advisories.push({
              id: `npm-${vuln.via?.[0]?.source || Date.now()}`,
              mcpId: packageName,
              severity: vuln.severity as 'low' | 'medium' | 'high' | 'critical',
              description: vuln.via?.[0]?.title || 'Security vulnerability detected',
              range: vuln.range,
              fixAvailable: !!vuln.fixAvailable
            });
          }
        }
      }

      this.logger.info(`Found ${advisories.length} security advisories for MCPs`, {}, 'mcp-update');

    } catch (error) {
      this.logger.error('Failed to fetch security advisories', { error }, 'mcp-update');
    }

    return advisories;
  }
  
  private async getMCPById(id: string): Promise<MCPDefinition> {
    return this.discoveryAgent['mcpRegistry'].get(id)!;
  }
  
  private async checkDeprecationStatus(mcp: MCPDefinition): Promise<any> {
    // In production, check package registry
    return null;
  }
  
  private async searchMCPRegistry(source: string): Promise<MCPDefinition[]> {
    const mcps: MCPDefinition[] = [];

    try {
      // Use Exa MCP to crawl registry pages
      const crawlResult = await exaMCPExecutor.executeExaMCP('crawl', { url: source });

      if (crawlResult.success && crawlResult.data?.content) {
        const content = crawlResult.data.content;

        // Extract MCP package references from content
        const packageMatches = content.matchAll(/(@[\w\-]+\/)?[\w\-]+-mcp/g);

        for (const match of packageMatches) {
          const packageName = match[0];

          // Check if already known
          if (!this.isKnownMCP(packageName)) {
            // Get package info from npm
            try {
              const { stdout } = await execAsync(`npm view ${packageName} --json`, {
                timeout: 5000
              });

              const pkgInfo = JSON.parse(stdout);

              // Build MCP definition from npm info
              mcps.push({
                id: packageName,
                name: pkgInfo.name,
                command: 'npx',
                args: [packageName],
                description: pkgInfo.description || 'No description available',
                category: this.inferCategory('', pkgInfo.description || ''),
                capabilities: pkgInfo.keywords?.filter((k: string) => k !== 'mcp') || [],
                requiredFor: [],
                installCommand: `npm install ${packageName}`,
                configTemplate: {},
                documentation: pkgInfo.homepage || pkgInfo.repository?.url || source,
                autoDetectTriggers: [packageName],
                channel: 'community',
                version: pkgInfo.version
              });

            } catch (error) {
              // Skip if package not found in npm
              continue;
            }
          }
        }

        this.logger.info(`Found ${mcps.length} MCPs from registry ${source}`, {}, 'mcp-update');
      }

    } catch (error) {
      this.logger.error(`Failed to search MCP registry: ${source}`, { error }, 'mcp-update');
    }

    return mcps;
  }
  
  private async installNewMCP(mcp: MCPDefinition): Promise<void> {
    // Delegate to discovery agent
    await this.discoveryAgent.activate({
      trigger: 'install-mcp',
      query: mcp.id,
      context: { mcp }
    });
    
    this.installedVersions.set(mcp.id, mcp.version || '1.0.0');
  }
  
  private async updateMCP(mcp: MCPDefinition): Promise<void> {
    // Update existing MCP
    this.logger.info(`Updating MCP ${mcp.id}`, {}, 'mcp-update');
    
    // Update in registry
    this.discoveryAgent['mcpRegistry'].set(mcp.id, mcp);
    
    // Update version
    this.installedVersions.set(mcp.id, mcp.version || '1.0.0');
  }
  
  private async applySecurityUpdate(update: MCPUpdate): Promise<void> {
    // Apply security patches
    await this.updateMCP(update.mcp);
    
    // Notify about security update
    this.emit('security-update-applied', update);
  }
  
  private async handleDeprecation(update: MCPUpdate): Promise<void> {
    // Mark as deprecated in registry
    const mcp = update.mcp;
    mcp.deprecated = true;
    this.discoveryAgent['mcpRegistry'].set(mcp.id, mcp);
    
    // Notify about deprecation
    this.emit('mcp-deprecated', update);
  }
  
  private recordUpdate(update: MCPUpdate): void {
    const history = this.updateHistory.get(update.mcp.id) || [];
    history.push(update);
    this.updateHistory.set(update.mcp.id, history);
  }
  
  /**
   * Get pending updates for review
   */
  public getPendingUpdates(): MCPUpdate[] {
    return [...this.pendingUpdates];
  }
  
  /**
   * Approve a pending update
   */
  public async approvePendingUpdate(updateId: string): Promise<boolean> {
    const updateIndex = this.pendingUpdates.findIndex(u => u.id === updateId);
    
    if (updateIndex >= 0) {
      const update = this.pendingUpdates.splice(updateIndex, 1)[0];
      await this.applyUpdates([update]);
      return true;
    }
    
    return false;
  }
  
  /**
   * Reject a pending update
   */
  public rejectPendingUpdate(updateId: string): boolean {
    const updateIndex = this.pendingUpdates.findIndex(u => u.id === updateId);
    
    if (updateIndex >= 0) {
      const update = this.pendingUpdates.splice(updateIndex, 1)[0];
      this.emit('update-rejected', update);
      return true;
    }
    
    return false;
  }
}
