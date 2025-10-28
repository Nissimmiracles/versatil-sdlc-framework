/**
 * MCP Selection Engine
 *
 * Purpose: Intelligent selection of optimal MCP server for a given task
 *
 * Features:
 * - Task type analysis (browser automation, API research, search, etc.)
 * - MCP capability matching
 * - Confidence scoring (0-100%)
 * - Reasoning generation for recommendations
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */
import { EventEmitter } from 'events';
export interface MCPCapability {
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
    useCases: string[];
}
export interface Task {
    id: string;
    name: string;
    description: string;
    type?: string;
    files?: string[];
    keywords?: string[];
    context?: any;
}
export interface MCPRecommendation {
    mcpName: string;
    confidence: number;
    reasoning: string;
    capabilities: string[];
    alternatives?: Array<{
        mcpName: string;
        confidence: number;
        reasoning: string;
    }>;
}
export interface MCPSelectionResult {
    primary: MCPRecommendation;
    alternatives: MCPRecommendation[];
    taskAnalysis: {
        taskType: string;
        requiredCapabilities: string[];
        keywords: string[];
        complexity: 'simple' | 'medium' | 'complex';
    };
}
/**
 * MCP Capabilities Matrix
 * Defines what each MCP server is good at
 */
export declare const MCP_CAPABILITIES: Record<string, MCPCapability>;
/**
 * Task Type Detection Patterns
 * Maps task characteristics to task types
 */
export declare const TASK_TYPE_PATTERNS: {
    'browser-automation': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'repo-documentation': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'github-operations': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    research: {
        keywords: string[];
        filePatterns: any[];
        primaryMCP: string;
        confidence: number;
    };
    'ml-operations': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'database-operations': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'workflow-automation': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'security-scan': {
        keywords: string[];
        filePatterns: string[];
        primaryMCP: string;
        confidence: number;
    };
    'error-monitoring': {
        keywords: string[];
        filePatterns: any[];
        primaryMCP: string;
        confidence: number;
    };
};
export declare class MCPSelectionEngine extends EventEmitter {
    constructor();
    /**
     * Select optimal MCP for a given task
     */
    selectMCP(task: Task): Promise<MCPSelectionResult>;
    /**
     * Analyze task to determine type and requirements
     */
    private analyzeTask;
    /**
     * Extract keywords from task description and name
     */
    private extractKeywords;
    /**
     * Detect task type based on keywords and file patterns
     */
    private detectTaskType;
    /**
     * Infer required capabilities from task
     */
    private inferRequiredCapabilities;
    /**
     * Assess task complexity
     */
    private assessComplexity;
    /**
     * Generate MCP recommendations based on task analysis
     */
    private generateRecommendations;
    /**
     * Calculate how well MCP capabilities match requirements
     */
    private calculateCapabilityMatch;
    /**
     * Check if file matches glob pattern
     */
    private matchesPattern;
    /**
     * Get all available MCPs
     */
    getAvailableMCPs(): string[];
    /**
     * Get MCP capabilities
     */
    getMCPCapabilities(mcpName: string): MCPCapability | undefined;
}
export declare const mcpSelectionEngine: MCPSelectionEngine;
