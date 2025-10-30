/**
 * VERSATIL MCP Module Base
 * Abstract base class for all tool modules with anti-duplicate safeguards
 */
import { z } from 'zod';
import { GLOBAL_TOOL_REGISTRY } from '../core/module-loader.js';
export class ModuleBase {
    constructor(options) {
        this.registeredTools = new Set();
        this.initializedTools = new Set();
        this.server = options.server;
        this.logger = options.logger;
        this.moduleId = options.moduleId;
        this.lazyTools = new Set(options.lazyTools);
    }
    /**
     * Register a tool with anti-duplicate safeguards
     */
    registerTool(definition) {
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
            const serverAsAny = this.server;
            if (typeof serverAsAny.tool === 'function') {
                // Modern McpServer API: .tool(name, description, zodSchema, handler)
                serverAsAny.tool(name, description, inputSchema.shape, wrappedHandler);
            }
            else {
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
        }
        catch (error) {
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
    createLazyHandler(handler, toolName) {
        return async (args) => {
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
    zodToJsonSchema(schema) {
        const shape = schema.shape;
        const properties = {};
        const required = [];
        Object.entries(shape).forEach(([key, zodType]) => {
            properties[key] = this.zodTypeToJsonSchema(zodType);
            // Check if required
            if (!zodType.isOptional()) {
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
    zodTypeToJsonSchema(zodType) {
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
            return { type: 'array', items: this.zodTypeToJsonSchema(zodType._def.type) };
        }
        if (zodType instanceof z.ZodEnum) {
            return { type: 'string', enum: zodType._def.values };
        }
        if (zodType instanceof z.ZodOptional) {
            return this.zodTypeToJsonSchema(zodType._def.innerType);
        }
        return { type: 'string' }; // fallback
    }
    /**
     * Override this to implement lazy tool initialization
     */
    async initializeTool(toolName) {
        // Default: no-op
        // Subclasses override to implement heavy initialization (API clients, DB connections, etc.)
    }
    /**
     * Override this to implement module cleanup
     */
    async cleanup() {
        // Default: no-op
        // Subclasses override to implement cleanup logic
    }
    /**
     * Get registered tools
     */
    getRegisteredTools() {
        return Array.from(this.registeredTools);
    }
    /**
     * Check if tool is registered
     */
    isToolRegistered(toolName) {
        return this.registeredTools.has(toolName);
    }
}
//# sourceMappingURL=module-base.js.map