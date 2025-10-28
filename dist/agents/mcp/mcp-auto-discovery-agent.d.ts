import { BaseAgent, AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';
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
export declare class MCPAutoDiscoveryAgent extends BaseAgent {
    private logger;
    systemPrompt: string;
    name: string;
    id: string;
    specialization: string;
    private discoveredMCPs;
    private lastScan;
    private scanInterval;
    constructor(logger: VERSATILLogger);
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    private discoverMCPs;
    private scanCursorConfig;
    private scanClaudeConfig;
    private scanNpmPackages;
    private validateMCP;
    private generateSuggestions;
    getDiscoveredMCPs(): MCPDefinition[];
    getMCPByName(name: string): MCPDefinition | undefined;
    getLastScanTime(): number;
    shouldRescan(): boolean;
}
