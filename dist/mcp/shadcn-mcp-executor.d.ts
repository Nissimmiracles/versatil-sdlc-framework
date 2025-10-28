/**
 * Shadcn MCP Executor - Production Implementation
 * Real component analysis using ts-morph AST parsing
 */
import type { ShadcnMCPConfig } from './shadcn-mcp-config.js';
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export declare class ShadcnMCPExecutor {
    private config;
    private project;
    constructor(config?: Partial<ShadcnMCPConfig>);
    /**
     * Execute Shadcn MCP action
     */
    executeShadcnMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Scan project for Shadcn components
     */
    private scanProject;
    /**
     * Analyze specific component usage
     */
    private analyzeComponentUsage;
    /**
     * Find unused components
     */
    private findUnusedComponents;
    /**
     * Validate accessibility (simplified check)
     */
    private validateAccessibility;
    /**
     * Helper: Find installed Shadcn components
     */
    private findInstalledComponents;
    /**
     * Helper: Analyze component usage across project
     */
    private analyzeUsage;
    /**
     * Helper: Generate component recommendations
     */
    private generateComponentRecommendations;
    /**
     * Helper: Convert to PascalCase
     */
    private pascalCase;
}
export declare const shadcnMCPExecutor: ShadcnMCPExecutor;
