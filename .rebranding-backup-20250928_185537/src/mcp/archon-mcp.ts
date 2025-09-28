/**
 * VERSATIL SDLC Framework - Archon MCP Integration
 * Provides MCP interface for Archon orchestration with automatic updates
 */

import { MCPServer, MCPTool } from '@modelcontextprotocol/sdk';
import { EnhancedArchonOrchestrator } from '../archon/enhanced-archon-orchestrator';
import { VERSATILLogger } from '../utils/logger';
import { vectorMemoryStore } from '../rag/vector-memory-store';

export interface ArchonMCPConfig {
  name: string;
  version: string;
  autoUpdate: boolean;
  updateInterval: number; // in milliseconds
  updateChannel: 'stable' | 'beta' | 'dev';
}

export class ArchonMCP {
  private server: MCPServer;
  private archon: EnhancedArchonOrchestrator;
  private logger: VERSATILLogger;
  private config: ArchonMCPConfig;
  private updateTimer?: NodeJS.Timeout;
  private currentVersion: string = '1.2.0';
  
  constructor(archon: EnhancedArchonOrchestrator, config?: Partial<ArchonMCPConfig>) {
    this.archon = archon;
    this.logger = new VERSATILLogger();
    this.config = {
      name: 'archon-orchestration-mcp',
      version: '1.2.0',
      autoUpdate: true,
      updateInterval: 3600000, // 1 hour
      updateChannel: 'stable',
      ...config
    };
    
    this.server = new MCPServer({
      name: this.config.name,
      version: this.config.version,
      description: 'VERSATIL Archon Orchestration MCP - AI-driven goal planning and execution'
    });
    
    this.setupTools();
    
    if (this.config.autoUpdate) {
      this.startAutoUpdate();
    }
  }
  
  /**
   * Setup MCP tools for Archon operations
   */
  private setupTools(): void {
    // Goal Creation Tool
    this.server.addTool({
      name: 'archon_create_goal',
      description: 'Create a new goal for Archon to orchestrate',
      parameters: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['feature', 'bug', 'refactor', 'optimize', 'analyze'] 
          },
          description: { type: 'string' },
          priority: { 
            type: 'string', 
            enum: ['urgent', 'high', 'medium', 'low'] 
          },
          constraints: { 
            type: 'array', 
            items: { type: 'string' } 
          }
        },
        required: ['type', 'description']
      }
    } as MCPTool, async (params) => {
      const goal = await this.archon.createGoal({
        type: params.type,
        description: params.description,
        priority: params.priority || 'medium',
        constraints: params.constraints || []
      });
      
      return {
        goalId: goal.id,
        status: goal.status,
        message: `Goal created: ${goal.type} - ${goal.description}`
      };
    });
    
    // Goal Status Tool
    this.server.addTool({
      name: 'archon_goal_status',
      description: 'Get status of a specific goal or all active goals',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' }
        }
      }
    } as MCPTool, async (params) => {
      if (params.goalId) {
        const goal = await this.archon.getGoalStatus(params.goalId);
        return goal;
      }
      
      return await this.archon.getAllGoalsStatus();
    });
    
    // Decision History Tool
    this.server.addTool({
      name: 'archon_decision_history',
      description: 'Get Archon decision history with reasoning',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          goalId: { type: 'string' }
        }
      }
    } as MCPTool, async (params) => {
      return await this.archon.getDecisionHistory();
    });
    
    // Learning Insights Tool
    this.server.addTool({
      name: 'archon_learning_insights',
      description: 'Get Archon learning insights and patterns',
      parameters: {
        type: 'object',
        properties: {
          category: { 
            type: 'string',
            enum: ['success_patterns', 'failure_patterns', 'optimization_opportunities']
          }
        }
      }
    } as MCPTool, async (params) => {
      return await this.archon.getLearningInsights();
    });
    
    // Override Goal Tool
    this.server.addTool({
      name: 'archon_override_goal',
      description: 'Manually override Archon decisions for a goal',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          action: { 
            type: 'string',
            enum: ['pause', 'resume', 'cancel', 'retry', 'modify']
          },
          modifications: { type: 'object' }
        },
        required: ['goalId', 'action']
      }
    } as MCPTool, async (params) => {
      return await this.archon.overrideGoal({
        goalId: params.goalId,
        action: params.action,
        modifications: params.modifications
      });
    });
    
    // Environment Context Tool
    this.server.addTool({
      name: 'archon_get_context',
      description: 'Get current environment context Archon is using',
      parameters: {
        type: 'object',
        properties: {
          detailed: { type: 'boolean', default: false }
        }
      }
    } as MCPTool, async (params) => {
      return await this.archon.getCurrentContext();
    });
    
    // Performance Metrics Tool
    this.server.addTool({
      name: 'archon_performance_metrics',
      description: 'Get Archon performance metrics',
      parameters: {
        type: 'object',
        properties: {
          timeRange: { 
            type: 'string',
            enum: ['hour', 'day', 'week', 'month']
          }
        }
      }
    } as MCPTool, async (params) => {
      return await this.archon.getPerformanceMetrics();
    });
  }
  
  /**
   * Start automatic update checking
   */
  private startAutoUpdate(): void {
    this.logger.info('Starting Archon MCP auto-update monitoring', {
      interval: this.config.updateInterval,
      channel: this.config.updateChannel
    }, 'archon-mcp');
    
    // Initial update check
    this.checkForUpdates();
    
    // Schedule periodic checks
    this.updateTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateInterval);
  }
  
  /**
   * Check for updates and apply if available
   */
  private async checkForUpdates(): Promise<void> {
    try {
      this.logger.info('Checking for Archon MCP updates', {}, 'archon-mcp');
      
      // Check for framework updates
      const frameworkUpdates = await this.checkFrameworkUpdates();
      
      // Check for MCP registry updates
      const mcpUpdates = await this.checkMCPRegistryUpdates();
      
      // Check for capability updates
      const capabilityUpdates = await this.checkCapabilityUpdates();
      
      // Apply updates if any
      if (frameworkUpdates || mcpUpdates || capabilityUpdates) {
        await this.applyUpdates({
          framework: frameworkUpdates,
          mcp: mcpUpdates,
          capabilities: capabilityUpdates
        });
      }
      
      // Update RAG with new information
      await this.updateRAGWithLatest();
      
    } catch (error) {
      this.logger.error('Error checking for updates', { error }, 'archon-mcp');
    }
  }
  
  /**
   * Check for framework updates
   */
  private async checkFrameworkUpdates(): Promise<any> {
    // In production, this would check a version registry
    // For now, simulate by checking against known versions
    const latestVersions = {
      stable: '1.2.1',
      beta: '1.3.0-beta.2',
      dev: '1.3.0-dev.5'
    };
    
    const latestVersion = latestVersions[this.config.updateChannel];
    
    if (this.compareVersions(latestVersion, this.currentVersion) > 0) {
      return {
        currentVersion: this.currentVersion,
        latestVersion,
        changelog: await this.fetchChangelog(latestVersion),
        breaking: this.hasBreakingChanges(this.currentVersion, latestVersion)
      };
    }
    
    return null;
  }
  
  /**
   * Check for MCP registry updates
   */
  private async checkMCPRegistryUpdates(): Promise<any> {
    // Query for new MCPs in the ecosystem
    const newMCPs = await this.queryNewMCPs();
    
    // Check for updates to existing MCPs
    const updatedMCPs = await this.queryMCPUpdates();
    
    if (newMCPs.length > 0 || updatedMCPs.length > 0) {
      return {
        new: newMCPs,
        updated: updatedMCPs
      };
    }
    
    return null;
  }
  
  /**
   * Check for capability updates
   */
  private async checkCapabilityUpdates(): Promise<any> {
    // Check for new patterns learned
    const newPatterns = await vectorMemoryStore.queryMemories({
      query: 'archon learned patterns successful',
      topK: 10,
      filters: {
        timestamp: { $gte: Date.now() - this.config.updateInterval }
      }
    });
    
    // Check for deprecated patterns
    const deprecatedPatterns = await vectorMemoryStore.queryMemories({
      query: 'archon patterns deprecated failed',
      topK: 5,
      filters: {
        timestamp: { $gte: Date.now() - this.config.updateInterval }
      }
    });
    
    if (newPatterns.documents.length > 0 || deprecatedPatterns.documents.length > 0) {
      return {
        newPatterns: newPatterns.documents,
        deprecatedPatterns: deprecatedPatterns.documents
      };
    }
    
    return null;
  }
  
  /**
   * Apply discovered updates
   */
  private async applyUpdates(updates: any): Promise<void> {
    this.logger.info('Applying Archon MCP updates', { updates }, 'archon-mcp');
    
    // Framework updates
    if (updates.framework) {
      if (!updates.framework.breaking || this.config.updateChannel === 'dev') {
        await this.updateFramework(updates.framework);
      } else {
        this.logger.warn('Breaking changes detected, manual update required', {
          version: updates.framework.latestVersion
        }, 'archon-mcp');
      }
    }
    
    // MCP updates
    if (updates.mcp) {
      for (const newMCP of updates.mcp.new) {
        await this.integrateNewMCP(newMCP);
      }
      
      for (const updatedMCP of updates.mcp.updated) {
        await this.updateExistingMCP(updatedMCP);
      }
    }
    
    // Capability updates
    if (updates.capabilities) {
      await this.updateArchonCapabilities(updates.capabilities);
    }
    
    // Notify about updates
    await this.notifyUpdatesApplied(updates);
  }
  
  /**
   * Update framework version
   */
  private async updateFramework(update: any): Promise<void> {
    // In production, this would download and apply updates
    // For now, update version and reload capabilities
    this.currentVersion = update.latestVersion;
    this.config.version = update.latestVersion;
    
    // Reload Archon with new capabilities
    await this.archon.reloadWithVersion(update.latestVersion);
    
    // Store update in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'framework_update',
        from: update.currentVersion,
        to: update.latestVersion,
        changelog: update.changelog,
        timestamp: Date.now()
      }),
      metadata: {
        agentId: 'archon-mcp',
        timestamp: Date.now(),
        tags: ['update', 'framework', update.latestVersion]
      }
    });
  }
  
  /**
   * Integrate new MCP
   */
  private async integrateNewMCP(mcp: any): Promise<void> {
    // Add to Archon's available tools
    await this.archon.registerMCP(mcp);
    
    // Update RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'mcp_integration',
        mcp,
        timestamp: Date.now()
      }),
      metadata: {
        agentId: 'archon-mcp',
        timestamp: Date.now(),
        tags: ['mcp', 'integration', mcp.id]
      }
    });
  }
  
  /**
   * Update Archon capabilities based on learned patterns
   */
  private async updateArchonCapabilities(capabilities: any): Promise<void> {
    // Apply new successful patterns
    for (const pattern of capabilities.newPatterns) {
      await this.archon.addLearnedPattern(pattern);
    }
    
    // Remove deprecated patterns
    for (const pattern of capabilities.deprecatedPatterns) {
      await this.archon.removePattern(pattern);
    }
    
    // Store capability update
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'capability_update',
        newPatterns: capabilities.newPatterns.length,
        deprecatedPatterns: capabilities.deprecatedPatterns.length,
        timestamp: Date.now()
      }),
      metadata: {
        agentId: 'archon-mcp',
        timestamp: Date.now(),
        tags: ['capability', 'update', 'learning']
      }
    });
  }
  
  /**
   * Update RAG with latest information
   */
  private async updateRAGWithLatest(): Promise<void> {
    // Store current Archon state
    const archonState = await this.archon.getState();
    
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        type: 'archon_state_snapshot',
        state: archonState,
        version: this.currentVersion,
        timestamp: Date.now()
      }),
      metadata: {
        agentId: 'archon-mcp',
        timestamp: Date.now(),
        tags: ['archon', 'state', 'snapshot', this.currentVersion]
      }
    });
  }
  
  // Utility methods
  
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }
  
  private hasBreakingChanges(currentVersion: string, newVersion: string): boolean {
    const [currentMajor] = currentVersion.split('.');
    const [newMajor] = newVersion.split('.');
    return parseInt(newMajor) > parseInt(currentMajor);
  }
  
  private async fetchChangelog(version: string): Promise<string> {
    // In production, fetch from version registry
    return `Changes in ${version}:\n- Improved goal planning efficiency\n- Enhanced MCP discovery\n- Better error handling`;
  }
  
  private async queryNewMCPs(): Promise<any[]> {
    // In production, query MCP registry
    // For now, return empty array
    return [];
  }
  
  private async queryMCPUpdates(): Promise<any[]> {
    // In production, check for updates to installed MCPs
    return [];
  }
  
  private async updateExistingMCP(mcp: any): Promise<void> {
    // Update existing MCP integration
    await this.archon.updateMCP(mcp);
  }
  
  private async notifyUpdatesApplied(updates: any): Promise<void> {
    this.logger.info('Archon MCP updates applied successfully', {
      framework: updates.framework?.latestVersion,
      newMCPs: updates.mcp?.new.length || 0,
      updatedMCPs: updates.mcp?.updated.length || 0,
      newPatterns: updates.capabilities?.newPatterns.length || 0
    }, 'archon-mcp');
  }
  
  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    await this.server.start();
    this.logger.info('Archon MCP server started', {
      version: this.config.version,
      autoUpdate: this.config.autoUpdate
    }, 'archon-mcp');
  }
  
  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    await this.server.stop();
    this.logger.info('Archon MCP server stopped', {}, 'archon-mcp');
  }
}

// Export factory function
export function createArchonMCP(
  archon: EnhancedArchonOrchestrator,
  config?: Partial<ArchonMCPConfig>
): ArchonMCP {
  return new ArchonMCP(archon, config);
}
