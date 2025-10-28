/**
 * VERSATIL SDLC Framework - OPERA MCP Integration
 * Connects Quality Dashboard with Model Context Protocol for real-time agent orchestration
 */
export interface MCPDashboardTools {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export declare class OPERAMCPIntegration {
    private dashboard;
    private logger;
    private isActive;
    constructor();
    /**
     * Start MCP integration with dashboard
     */
    start(): Promise<void>;
    /**
     * Stop MCP integration
     */
    stop(): Promise<void>;
    /**
     * Get available MCP tools for dashboard interaction
     */
    getAvailableTools(): MCPDashboardTools[];
    /**
     * Handle MCP tool calls
     */
    handleToolCall(toolName: string, parameters: any): Promise<any>;
    /**
     * Private tool handlers
     */
    private handleTriggerUITest;
    private handleGetQualityMetrics;
    private handleGetAgentStatus;
    private handleGenerateQualityReport;
    private handleExecuteQualityCheck;
    /**
     * Helper methods
     */
    private setupEventListeners;
    private calculateOverallHealth;
    private generateRecommendations;
    private calculateTrends;
}
export default OPERAMCPIntegration;
