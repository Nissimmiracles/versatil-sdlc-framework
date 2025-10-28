/**
 * VERSATIL SDLC Framework - MCP Auto-Update System
 * Continuously discovers, evaluates, and integrates new MCPs
 */
import { EventEmitter } from 'events';
import { MCPAutoDiscoveryAgent, MCPDefinition } from '../agents/mcp/mcp-auto-discovery-agent.js';
export interface AutoUpdateConfig {
    enabled: boolean;
    checkInterval: number;
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
export declare class MCPAutoUpdateSystem extends EventEmitter {
    private logger;
    private discoveryAgent;
    private config;
    private updateTimer?;
    private updateHistory;
    private pendingUpdates;
    private installedVersions;
    private knownMCPSources;
    constructor(discoveryAgent: MCPAutoDiscoveryAgent, config?: Partial<AutoUpdateConfig>);
    /**
     * Start the auto-update system
     */
    start(): void;
    /**
     * Stop the auto-update system
     */
    stop(): void;
    /**
     * Main update check routine
     */
    private checkForUpdates;
    /**
     * Search for new MCPs using web research
     */
    private searchForNewMCPs;
    /**
     * Check for updates to existing MCPs
     */
    private checkExistingMCPUpdates;
    /**
     * Check for security updates
     */
    private checkSecurityUpdates;
    /**
     * Check for deprecated MCPs
     */
    private checkDeprecations;
    /**
     * Evaluate and prioritize updates
     */
    private evaluateUpdates;
    /**
     * Apply updates based on configuration
     */
    private applyUpdates;
    /**
     * Update RAG with new MCP knowledge
     */
    private updateRAGKnowledge;
    private generateSearchQueries;
    private realWebSearch;
    /**
     * Extract MCP ID from URL or title
     */
    private extractMCPId;
    /**
     * Parse MCP definition from search result
     */
    private parseMCPFromSearchResult;
    /**
     * Infer MCP category from context
     */
    private inferCategory;
    /**
     * Extract capabilities from text
     */
    private extractCapabilities;
    private identifyMissingCapabilities;
    private isKnownMCP;
    private validateMCPDefinition;
    private storeDiscovery;
    private getKnownMCPs;
    private checkNPMVersion;
    private isNewerVersion;
    private hasBreakingChanges;
    private fetchChangelog;
    private checkNewCapabilities;
    private fetchSecurityAdvisories;
    private getMCPById;
    private checkDeprecationStatus;
    private searchMCPRegistry;
    private installNewMCP;
    private updateMCP;
    private applySecurityUpdate;
    private handleDeprecation;
    private recordUpdate;
    /**
     * Get pending updates for review
     */
    getPendingUpdates(): MCPUpdate[];
    /**
     * Approve a pending update
     */
    approvePendingUpdate(updateId: string): Promise<boolean>;
    /**
     * Reject a pending update
     */
    rejectPendingUpdate(updateId: string): boolean;
}
