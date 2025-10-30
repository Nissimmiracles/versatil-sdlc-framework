/**
 * VERSATIL MCP Module Base
 * Abstract base class for all tool modules with anti-duplicate safeguards
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { VERSATILLogger } from '../../utils/logger.js';
import { ToolRegistrationOptions } from '../core/module-loader.js';
export type ToolHandler = (args: any) => Promise<any>;
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>;
    handler: ToolHandler;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
}
export declare abstract class ModuleBase {
    protected server: Server | McpServer;
    protected logger: VERSATILLogger;
    protected moduleId: string;
    protected lazyTools: Set<string>;
    protected registeredTools: Set<string>;
    protected initializedTools: Set<string>;
    constructor(options: ToolRegistrationOptions);
    /**
     * Register a tool with anti-duplicate safeguards
     */
    protected registerTool(definition: ToolDefinition): void;
    /**
     * Create lazy handler wrapper
     */
    private createLazyHandler;
    /**
     * Convert Zod schema to JSON Schema
     */
    private zodToJsonSchema;
    /**
     * Convert individual Zod type to JSON Schema
     */
    private zodTypeToJsonSchema;
    /**
     * Override this to implement lazy tool initialization
     */
    protected initializeTool(toolName: string): Promise<void>;
    /**
     * Override this to implement module cleanup
     */
    cleanup(): Promise<void>;
    /**
     * Get registered tools
     */
    getRegisteredTools(): string[];
    /**
     * Check if tool is registered
     */
    isToolRegistered(toolName: string): boolean;
}
