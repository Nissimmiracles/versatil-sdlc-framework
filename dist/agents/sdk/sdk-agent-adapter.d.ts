/**
 * SDK Agent Adapter
 * Wraps existing class-based agents to use Claude SDK execution
 * while preserving all existing functionality (RAG, validation, analysis)
 */
import { OPERA_AGENTS } from './agent-definitions.js';
import type { AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
import type { ToolCallRequest } from '../../mcp/mcp-tool-router.js';
export interface SDKAgentConfig {
    agentId: keyof typeof OPERA_AGENTS;
    vectorStore?: EnhancedVectorMemoryStore;
    mcpTools?: string[];
    model?: 'sonnet' | 'opus' | 'haiku';
    enableMCPRouting?: boolean;
}
export declare class SDKAgentAdapter {
    private agentDefinition;
    protected vectorStore?: EnhancedVectorMemoryStore;
    protected agentId: string;
    protected model: 'sonnet' | 'opus' | 'haiku';
    protected enableMCPRouting: boolean;
    constructor(config: SDKAgentConfig);
    /**
     * Activate agent using Claude SDK with RAG context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Get RAG context from vector store
     */
    protected getRAGContext(context: AgentActivationContext): Promise<any>;
    /**
     * Build enhanced prompt with RAG context
     */
    protected buildEnhancedPrompt(context: AgentActivationContext, ragContext: any): string;
    /**
     * Get MCP tools based on context
     */
    protected getMCPToolsForContext(context: AgentActivationContext): string[];
    /**
     * Convert SDK result to AgentResponse format
     */
    protected convertToAgentResponse(sdkResult: any, context: AgentActivationContext): AgentResponse;
    /**
     * Extract issues from SDK output
     */
    protected extractIssuesFromOutput(output: string): any[];
    /**
     * Extract handoffs from SDK output
     */
    protected extractHandoffsFromOutput(output: string): string[];
    /**
     * Extract score from SDK output
     */
    protected extractScoreFromOutput(output: string): number;
    /**
     * Calculate priority from issues
     */
    protected calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Generate search query for RAG
     */
    protected generateSearchQuery(context: AgentActivationContext): string;
    /**
     * Extract keywords from content
     */
    protected extractKeywords(content: string): string[];
    /**
     * Extract solutions from memories
     */
    protected extractSolutions(memories: any[]): Record<string, string>;
    /**
     * Store interaction in RAG for learning
     */
    protected storeInteraction(context: AgentActivationContext, response: AgentResponse): Promise<void>;
    /**
     * NEW v6.1: Handle tool calls from Claude SDK and route to MCP executors
     */
    protected handleToolCall(toolCall: any): Promise<any>;
    /**
     * NEW v6.1: Parse tool call into ToolCallRequest format
     */
    protected parseToolCall(toolCall: any): ToolCallRequest | null;
    /**
     * NEW v6.1: Check if agent should use MCP tool for this context
     */
    protected shouldUseMCPTool(context: AgentActivationContext, tool: string): boolean;
}
