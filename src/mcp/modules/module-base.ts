/**
 * VERSATIL MCP Module Base
 * Abstract base class for all tool modules with anti-duplicate safeguards
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { VERSATILLogger } from '../../utils/logger.js';
import { GLOBAL_TOOL_REGISTRY, ToolRegistrationOptions } from '../core/module-loader.js';

export type ToolHandler = (args: any) => Promise<any>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: ToolHandler;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
}

export abstract class ModuleBase {
  protected server: Server | McpServer;
  protected logger: VERSATILLogger;
  protected moduleId: string;
  protected lazyTools: Set<string>;
  protected registeredTools = new Set<string>();
  protected initializedTools = new Set<string>();

  constructor(options: ToolRegistrationOptions) {
    this.server = options.server;
    this.logger = options.logger;
    this.moduleId = options.moduleId;
    this.lazyTools = new Set(options.lazyTools);
  }

  /**
   * Register a tool with anti-duplicate safeguards
   */
  protected registerTool(definition: ToolDefinition): void {
    const { name, description, inputSchema, handler, readOnlyHint, destructiveHint } = definition;

    try {
      // Check for duplicates in global registry
      if (GLOBAL_TOOL_REGISTRY.has(name)) {
        const existingOwner = GLOBAL_TOOL_REGISTRY.get(name);
        this.logger.warn(`Tool '${name}' already registered by module '${existingOwner}', skipping`, {
          moduleId: this.moduleId,
        });
        return;
      }

      // Check if lazy tool
      const isLazy = this.lazyTools.has(name);

      // Wrap handler with lazy initialization
      const wrappedHandler = isLazy
        ? this.createLazyHandler(handler, name)
        : handler;

      // Register with MCP server using modern .tool() API
      const serverAsAny = this.server as any;
      if (typeof serverAsAny.tool === 'function') {
        // Modern McpServer API: .tool(name, description, zodSchema, handler)
        serverAsAny.tool(name, description, inputSchema.shape, wrappedHandler);
      } else {
        // Fallback (shouldn't happen with v7.16.0+)
        this.logger.warn(`Server doesn't support .tool() API, tool '${name}' not registered`);
        return;
      }

      // Add to registries
      this.registeredTools.add(name);
      GLOBAL_TOOL_REGISTRY.set(name, this.moduleId);

      this.logger.info(`Tool '${name}' registered`, {
        moduleId: this.moduleId,
        lazy: isLazy,
      });
    } catch (error) {
      this.logger.error(`Failed to register tool '${name}'`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error; // Re-throw to propagate error
    }
  }

  /**
   * Create lazy handler wrapper
   */
  private createLazyHandler(handler: ToolHandler, toolName: string): ToolHandler {
    return async (args: any) => {
      if (!this.initializedTools.has(toolName)) {
        this.logger.info(`Lazy initializing tool: ${toolName}`);
        await this.initializeTool(toolName);
        this.initializedTools.add(toolName);
      }
      return handler(args);
    };
  }

  /**
   * Convert Zod schema to JSON Schema
   */
  private zodToJsonSchema(schema: z.ZodObject<any>): any {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    Object.entries(shape).forEach(([key, zodType]) => {
      properties[key] = this.zodTypeToJsonSchema(zodType as z.ZodTypeAny);

      // Check if required
      if (!(zodType as any).isOptional()) {
        required.push(key);
      }
    });

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * Convert individual Zod type to JSON Schema
   */
  private zodTypeToJsonSchema(zodType: z.ZodTypeAny): any {
    if (zodType instanceof z.ZodString) {
      return { type: 'string' };
    }
    if (zodType instanceof z.ZodNumber) {
      return { type: 'number' };
    }
    if (zodType instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }
    if (zodType instanceof z.ZodArray) {
      return { type: 'array', items: this.zodTypeToJsonSchema((zodType as any)._def.type) };
    }
    if (zodType instanceof z.ZodEnum) {
      return { type: 'string', enum: (zodType as any)._def.values };
    }
    if (zodType instanceof z.ZodOptional) {
      return this.zodTypeToJsonSchema((zodType as any)._def.innerType);
    }
    return { type: 'string' }; // fallback
  }

  /**
   * Override this to implement lazy tool initialization
   */
  protected async initializeTool(toolName: string): Promise<void> {
    // Default: no-op
    // Subclasses override to implement heavy initialization (API clients, DB connections, etc.)
  }

  /**
   * Override this to implement module cleanup
   */
  async cleanup(): Promise<void> {
    // Default: no-op
    // Subclasses override to implement cleanup logic
  }

  /**
   * Get registered tools
   */
  getRegisteredTools(): string[] {
    return Array.from(this.registeredTools);
  }

  /**
   * Check if tool is registered
   */
  isToolRegistered(toolName: string): boolean {
    return this.registeredTools.has(toolName);
  }
}
