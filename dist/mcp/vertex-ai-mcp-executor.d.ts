/**
 * Vertex AI MCP Executor
 * ✅ PRODUCTION IMPLEMENTATION - Google Cloud Vertex AI + Gemini Integration
 *
 * Primary Agents: Dr.AI-ML (ML training, deployment), Marcus-Backend (AI API integration)
 *
 * Features:
 * - Gemini model inference (text, code, multimodal)
 * - Model deployment and management
 * - AI model monitoring and optimization
 * - Vertex AI Platform integration
 * - Custom model training support
 *
 * Official Packages:
 * - @google-cloud/vertexai (official Google Cloud SDK)
 * - @google-cloud/aiplatform (platform management)
 * - vertex-ai-mcp-server (MCP server implementation)
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        model?: string;
        timestamp?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
        [key: string]: any;
    };
}
export declare class VertexAIMCPExecutor {
    private vertexAI;
    private projectId;
    private location;
    private endpoint;
    constructor();
    /**
     * Initialize Vertex AI client
     */
    private initializeVertexAI;
    /**
     * Execute Vertex AI MCP action
     * Routes to appropriate Vertex AI operation based on action type
     */
    executeVertexAIMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Generate text using Gemini model
     */
    private generateText;
    /**
     * Generate code using Gemini Code model
     */
    private generateCode;
    /**
     * Analyze code for issues, improvements, security vulnerabilities
     */
    private analyzeCode;
    /**
     * Multi-turn chat conversation
     */
    private chat;
    /**
     * Generate text embeddings for semantic search
     */
    private generateEmbeddings;
    /**
     * Deploy ML model to Vertex AI Platform
     */
    private deployModel;
    /**
     * Make prediction using deployed model
     */
    private predict;
    /**
     * Generate simple deterministic embedding from text (fallback)
     */
    private generateSimpleEmbedding;
    /**
     * Get available Gemini models
     */
    listModels(): Promise<string[]>;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
    /**
     * Helper: Convert object to Proto Struct format for Vertex AI
     */
    private toProtoStruct;
}
export declare const vertexAIMCPExecutor: VertexAIMCPExecutor;
