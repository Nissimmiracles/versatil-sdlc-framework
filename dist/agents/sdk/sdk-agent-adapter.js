/**
 * SDK Agent Adapter
 * Wraps existing class-based agents to use Claude SDK execution
 * while preserving all existing functionality (RAG, validation, analysis)
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { OPERA_AGENTS } from './agent-definitions.js';
import { getMCPToolRouter } from '../../mcp/mcp-tool-router.js';
export class SDKAgentAdapter {
    constructor(config) {
        this.agentId = config.agentId;
        this.agentDefinition = OPERA_AGENTS[config.agentId];
        this.vectorStore = config.vectorStore;
        this.model = config.model || 'sonnet';
        this.enableMCPRouting = config.enableMCPRouting !== false; // Default: true
        if (!this.agentDefinition) {
            throw new Error(`Agent definition not found for: ${config.agentId}`);
        }
    }
    /**
     * Activate agent using Claude SDK with RAG context
     */
    async activate(context) {
        const startTime = Date.now();
        try {
            // 1. Fetch RAG context from vector store
            const ragContext = await this.getRAGContext(context);
            // 2. Build prompt with context
            const enhancedPrompt = this.buildEnhancedPrompt(context, ragContext);
            // 3. Get MCP tools for this context
            const mcpTools = this.getMCPToolsForContext(context);
            // 4. Execute via Claude SDK
            // Note: MCP tool routing happens via agent tool definitions
            const sdkResult = await query({
                prompt: enhancedPrompt,
                options: {
                    agents: {
                        [this.agentId]: this.agentDefinition
                    },
                    model: this.model,
                    allowedTools: mcpTools,
                    systemPrompt: {
                        type: 'preset',
                        preset: 'claude_code'
                    }
                }
            });
            // 5. Convert SDK result to AgentResponse format
            const response = this.convertToAgentResponse(sdkResult, context);
            // 6. Store interaction in RAG for learning
            if (this.vectorStore && ragContext.enableLearning) {
                await this.storeInteraction(context, response);
            }
            // Add execution metadata to context
            response.context = {
                ...response.context,
                executionTime: Date.now() - startTime,
                executionMethod: 'Claude SDK',
                ragEnhanced: ragContext.totalDocuments > 0,
                model: this.model
            };
            return response;
        }
        catch (error) {
            console.error(`SDK Agent activation failed for ${this.agentId}:`, error);
            return {
                agentId: this.agentId,
                message: `${this.agentId} activation failed: ${error.message}`,
                priority: 'high',
                handoffTo: [],
                suggestions: [],
                context: {
                    error: error.message,
                    executionTime: Date.now() - startTime
                }
            };
        }
    }
    /**
     * Get RAG context from vector store
     */
    async getRAGContext(context) {
        if (!this.vectorStore) {
            return {
                similarCode: [],
                previousSolutions: {},
                projectStandards: [],
                agentExpertise: [],
                totalDocuments: 0,
                enableLearning: false
            };
        }
        try {
            // Generate semantic search query
            const searchQuery = this.generateSearchQuery(context);
            // Search vector store for relevant memories
            const memories = await this.vectorStore.searchMemories(searchQuery, {
                topK: 5,
                similarityThreshold: 0.75,
                filters: {
                    agentId: this.agentId,
                    contentTypes: ['code', 'text']
                }
            });
            // Categorize memories
            const ragContext = {
                similarCode: memories.filter(m => m.metadata?.contentType === 'code'),
                previousSolutions: this.extractSolutions(memories),
                projectStandards: memories.filter(m => m.metadata?.tags?.includes('standard')),
                agentExpertise: memories.filter(m => m.metadata?.agentId === this.agentId),
                totalDocuments: memories.length,
                enableLearning: true
            };
            return ragContext;
        }
        catch (error) {
            console.warn(`RAG context retrieval failed for ${this.agentId}:`, error);
            return {
                similarCode: [],
                previousSolutions: {},
                projectStandards: [],
                agentExpertise: [],
                totalDocuments: 0,
                enableLearning: false
            };
        }
    }
    /**
     * Build enhanced prompt with RAG context
     */
    buildEnhancedPrompt(context, ragContext) {
        let prompt = `# ${this.agentId} Analysis Request\n\n`;
        // Add file context
        if (context.filePath) {
            prompt += `## File: ${context.filePath}\n\n`;
        }
        // Add code content
        if (context.content) {
            prompt += `## Code Content:\n\`\`\`\n${context.content}\n\`\`\`\n\n`;
        }
        // Add RAG context if available
        if (ragContext.totalDocuments > 0) {
            prompt += `## RAG Context (Zero Context Loss)\n\n`;
            if (ragContext.similarCode.length > 0) {
                prompt += `### Similar Code Patterns (${ragContext.similarCode.length}):\n`;
                ragContext.similarCode.forEach((code, idx) => {
                    prompt += `${idx + 1}. Similarity: ${(code.similarity * 100).toFixed(1)}%\n`;
                    prompt += `\`\`\`\n${code.content}\n\`\`\`\n\n`;
                });
            }
            if (Object.keys(ragContext.previousSolutions).length > 0) {
                prompt += `### Previous Solutions:\n`;
                Object.entries(ragContext.previousSolutions).forEach(([issueType, solution]) => {
                    prompt += `- **${issueType}**: ${solution}\n`;
                });
                prompt += `\n`;
            }
            if (ragContext.projectStandards.length > 0) {
                prompt += `### Project Standards:\n`;
                ragContext.projectStandards.forEach((standard) => {
                    prompt += `- ${standard.content}\n`;
                });
                prompt += `\n`;
            }
        }
        // Add trigger context
        if (context.trigger) {
            prompt += `## Trigger: ${context.trigger.type}\n\n`;
        }
        // Add emergency mode flag
        if (context.content && (context.content.includes('URGENT') ||
            context.content.includes('CRITICAL') ||
            context.content.includes('EMERGENCY'))) {
            prompt += `⚠️ **EMERGENCY MODE ACTIVATED** - Priority escalated to critical\n\n`;
        }
        prompt += `## Task:\nAnalyze the code above and provide:\n`;
        prompt += `1. Quality assessment\n`;
        prompt += `2. Issues and recommendations\n`;
        prompt += `3. Agent handoffs if needed\n`;
        prompt += `4. Actionable suggestions\n`;
        return prompt;
    }
    /**
     * Get MCP tools based on context
     */
    getMCPToolsForContext(context) {
        const tools = new Set();
        // Base tools (always available)
        tools.add('Read');
        tools.add('Write');
        tools.add('Edit');
        tools.add('Bash');
        tools.add('Glob');
        tools.add('Grep');
        // Agent-specific tools from definition
        if (this.agentDefinition.tools) {
            this.agentDefinition.tools.forEach(tool => tools.add(tool));
        }
        // Context-based tool additions
        if (context.filePath) {
            if (context.filePath.includes('test') || context.filePath.includes('spec')) {
                tools.add('Chrome');
                tools.add('Playwright');
            }
            if (context.filePath.includes('.tsx') || context.filePath.includes('.jsx')) {
                tools.add('Chrome');
            }
            if (context.filePath.endsWith('.md')) {
                tools.add('WebFetch');
            }
        }
        return Array.from(tools);
    }
    /**
     * Convert SDK result to AgentResponse format
     */
    convertToAgentResponse(sdkResult, context) {
        // Parse SDK output for structured data
        const output = typeof sdkResult === 'string' ? sdkResult : sdkResult.toString();
        // Extract issues from output (simple pattern matching)
        const issues = this.extractIssuesFromOutput(output);
        const handoffs = this.extractHandoffsFromOutput(output);
        const score = this.extractScoreFromOutput(output);
        return {
            agentId: this.agentId,
            message: output,
            priority: this.calculatePriority(issues),
            handoffTo: handoffs,
            suggestions: issues.map(issue => ({
                type: issue.type,
                message: issue.message,
                priority: issue.severity,
                file: context.filePath || 'unknown'
            })),
            context: {
                analysisScore: score,
                totalIssues: issues.length,
                criticalIssues: issues.filter(i => i.severity === 'critical').length,
                filePath: context.filePath
            }
        };
    }
    /**
     * Extract issues from SDK output
     */
    extractIssuesFromOutput(output) {
        const issues = [];
        // Look for common issue patterns in output
        const lines = output.split('\n');
        lines.forEach(line => {
            // Pattern: "- [SEVERITY] type: message"
            const match = line.match(/^[\s-]*\[(critical|high|medium|low)\]\s*(\w+):\s*(.+)$/i);
            if (match) {
                issues.push({
                    severity: match[1].toLowerCase(),
                    type: match[2],
                    message: match[3]
                });
            }
        });
        return issues;
    }
    /**
     * Extract handoffs from SDK output
     */
    extractHandoffsFromOutput(output) {
        const handoffs = [];
        // Look for handoff patterns
        const handoffMatch = output.match(/handoff.*?:(.*?)(?:\n|$)/i);
        if (handoffMatch) {
            const agents = handoffMatch[1].match(/[\w-]+/g) || [];
            handoffs.push(...agents);
        }
        return handoffs;
    }
    /**
     * Extract score from SDK output
     */
    extractScoreFromOutput(output) {
        const scoreMatch = output.match(/score[:\s]+(\d+)/i);
        return scoreMatch ? parseInt(scoreMatch[1], 10) : 75;
    }
    /**
     * Calculate priority from issues
     */
    calculatePriority(issues) {
        if (issues.some(i => i.severity === 'critical'))
            return 'critical';
        if (issues.some(i => i.severity === 'high'))
            return 'high';
        if (issues.some(i => i.severity === 'medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Generate search query for RAG
     */
    generateSearchQuery(context) {
        const parts = [];
        if (context.filePath) {
            const ext = context.filePath.split('.').pop();
            parts.push(ext || '');
        }
        if (context.content) {
            // Extract key terms from content
            const keywords = this.extractKeywords(context.content);
            parts.push(...keywords);
        }
        parts.push(this.agentId);
        return parts.filter(Boolean).join(' ');
    }
    /**
     * Extract keywords from content
     */
    extractKeywords(content) {
        const keywords = [];
        // Common patterns
        if (content.includes('test') || content.includes('describe'))
            keywords.push('testing');
        if (content.includes('component'))
            keywords.push('component');
        if (content.includes('api') || content.includes('route'))
            keywords.push('api');
        if (content.includes('security') || content.includes('auth'))
            keywords.push('security');
        if (content.includes('performance') || content.includes('optimize'))
            keywords.push('performance');
        return keywords;
    }
    /**
     * Extract solutions from memories
     */
    extractSolutions(memories) {
        const solutions = {};
        memories.forEach(memory => {
            if (memory.metadata?.issueType && memory.metadata?.solution) {
                solutions[memory.metadata.issueType] = memory.metadata.solution;
            }
        });
        return solutions;
    }
    /**
     * Store interaction in RAG for learning
     */
    async storeInteraction(context, response) {
        if (!this.vectorStore)
            return;
        try {
            const memoryContent = {
                query: this.generateSearchQuery(context),
                response: response.message,
                issues: response.suggestions,
                score: response.context?.analysisScore,
                timestamp: Date.now()
            };
            await this.vectorStore.storeMemory({
                content: JSON.stringify(memoryContent),
                contentType: 'interaction',
                metadata: {
                    agentId: this.agentId,
                    filePath: context.filePath,
                    tags: ['interaction', 'learning'],
                    timestamp: Date.now()
                }
            });
        }
        catch (error) {
            console.warn(`Failed to store interaction for learning: ${error.message}`);
        }
    }
    /**
     * NEW v6.1: Handle tool calls from Claude SDK and route to MCP executors
     */
    async handleToolCall(toolCall) {
        if (!this.enableMCPRouting) {
            return undefined; // Let Claude SDK handle normally
        }
        try {
            // Parse tool call (format: "ToolName.action" or just "ToolName")
            const toolRequest = this.parseToolCall(toolCall);
            if (!toolRequest) {
                return undefined; // Not an MCP tool, let SDK handle
            }
            // Route to MCP via MCPToolRouter
            const router = getMCPToolRouter();
            const result = await router.handleToolCall(toolRequest);
            console.log(`[${this.agentId}] MCP tool call: ${toolRequest.tool}.${toolRequest.action} -> ${result.success ? 'SUCCESS' : 'FAILED'}`);
            // Return result in format Claude SDK expects
            return {
                success: result.success,
                output: result.data,
                error: result.error
            };
        }
        catch (error) {
            console.error(`[${this.agentId}] MCP tool call failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * NEW v6.1: Parse tool call into ToolCallRequest format
     */
    parseToolCall(toolCall) {
        // Handle different tool call formats from Claude SDK
        const toolName = toolCall.name || toolCall.tool || '';
        const params = toolCall.parameters || toolCall.params || toolCall.input || {};
        // Check if this is an MCP tool we should route
        const mcpTools = ['Playwright', 'Chrome', 'GitHub', 'Exa', 'Shadcn', 'VERSATIL'];
        const isMCPTool = mcpTools.some(mcp => toolName.toLowerCase().includes(mcp.toLowerCase()));
        if (!isMCPTool) {
            return null; // Not an MCP tool
        }
        // Extract action (e.g., "Playwright.screenshot" -> "screenshot")
        let tool = toolName;
        let action = params.action || 'execute';
        if (toolName.includes('.')) {
            const parts = toolName.split('.');
            tool = parts[0];
            action = parts[1] || action;
        }
        return {
            tool,
            action,
            params,
            agentId: this.agentId,
            taskId: params.taskId
        };
    }
    /**
     * NEW v6.1: Check if agent should use MCP tool for this context
     */
    shouldUseMCPTool(context, tool) {
        // James-Frontend and Maria-QA should use Playwright/Chrome for UI work
        if ((this.agentId === 'james-frontend' || this.agentId === 'maria-qa') &&
            (tool === 'Playwright' || tool === 'Chrome')) {
            return context.filePath?.includes('.tsx') ||
                context.filePath?.includes('.jsx') ||
                context.filePath?.includes('.test') ||
                context.filePath?.includes('spec') ||
                false;
        }
        // All agents can use GitHub MCP
        if (tool === 'GitHub') {
            return true;
        }
        // All agents can use Exa for research
        if (tool === 'Exa') {
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=sdk-agent-adapter.js.map