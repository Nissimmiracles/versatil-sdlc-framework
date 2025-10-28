/**
 * n8n MCP Executor
 * ✅ PRODUCTION IMPLEMENTATION - n8n Workflow Automation Integration
 *
 * Primary Agent: Sarah-PM (Project Management automation)
 * Secondary Agents: Marcus-Backend (CI/CD), Maria-QA (test automation)
 *
 * Features:
 * - Workflow creation and management
 * - Execution triggers and monitoring
 * - Integration with 525+ n8n nodes
 * - Task scheduling and orchestration
 * - Sprint automation and reporting
 *
 * Official Package:
 * - n8n-nodes-mcp (community npm package)
 * - n8n API integration
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        operation?: string;
        timestamp?: string;
        workflowId?: string;
        executionId?: string;
        [key: string]: any;
    };
}
export declare class N8nMCPExecutor {
    private n8nBaseUrl;
    private n8nApiKey;
    constructor();
    /**
     * Execute n8n MCP action
     * Routes to appropriate n8n operation based on action type
     */
    executeN8nMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Create new workflow
     */
    private createWorkflow;
    /**
     * Execute workflow by ID or name
     */
    private executeWorkflow;
    /**
     * List all workflows
     */
    private listWorkflows;
    /**
     * Get workflow execution status
     */
    private getWorkflowStatus;
    /**
     * Schedule recurring task/workflow
     */
    private scheduleTask;
    /**
     * Get workflow executions history
     */
    private getExecutions;
    /**
     * Trigger workflow via webhook
     */
    private triggerWebhook;
    /**
     * Helper: Calculate next cron execution time using cron-parser
     */
    private getNextCronExecution;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const n8nMCPExecutor: N8nMCPExecutor;
