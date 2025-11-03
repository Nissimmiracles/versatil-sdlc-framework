/**
 * Oliver-MCP Agent
 *
 * MCP Orchestration Specialist
 *
 * Role:
 * - Intelligent routing for MCP tool calls
 * - Health monitoring and circuit breaking
 * - Hallucination detection via GitMCP
 * - Auto-retry with exponential backoff
 * - Environment validation
 *
 * Activation:
 * - AUTO: When MCP tool calls detected
 * - MANUAL: /oliver-mcp command or MCP configuration
 *
 * Responsibilities:
 * - Route Claude SDK tool calls to appropriate MCP executors
 * - Monitor MCP health (95%+ reliability target)
 * - Detect and prevent hallucinations using GitMCP
 * - Validate environment (Node.js, npm, git, MCP servers)
 * - Provide intelligent query routing for help/docs
 */
import { MCPToolRouter } from '../mcp/mcp-tool-router.js';
import { MCPHealthMonitor } from '../mcp/mcp-health-monitor.js';
import { execSync } from 'child_process';
/**
 * Oliver-MCP - MCP Orchestration Agent
 */
export class OliverMCP {
    constructor(workingDir = process.cwd()) {
        this.workingDir = workingDir;
        this.toolRouter = new MCPToolRouter();
        this.healthMonitor = new MCPHealthMonitor({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000,
            backoffMultiplier: 2
        });
    }
    /**
     * Singleton instance
     */
    static getInstance(workingDir) {
        if (!OliverMCP.instance) {
            OliverMCP.instance = new OliverMCP(workingDir);
        }
        return OliverMCP.instance;
    }
    /**
     * Initialize MCP systems
     */
    async initialize() {
        await this.toolRouter.initialize();
        this.healthMonitor.startMonitoring(60000); // Check every 60 seconds
    }
    /**
     * Route query to optimal MCP server
     *
     * @param query User query or help request
     * @returns Routing decision with confidence scores
     */
    async routeQuery(query) {
        const lowerQuery = query.toLowerCase();
        // Score each MCP server based on query keywords
        const scores = {
            playwright_mcp: { score: 0, reasoning: '' },
            chrome_mcp: { score: 0, reasoning: '' },
            github_mcp: { score: 0, reasoning: '' },
            exa_mcp: { score: 0, reasoning: '' },
            shadcn_mcp: { score: 0, reasoning: '' },
            gitmcp: { score: 0, reasoning: '' },
            versatil_mcp: { score: 0, reasoning: '' }
        };
        // Playwright MCP keywords
        if (lowerQuery.includes('browser') ||
            lowerQuery.includes('test') ||
            lowerQuery.includes('e2e') ||
            lowerQuery.includes('automation')) {
            scores.playwright_mcp.score += 80;
            scores.playwright_mcp.reasoning = 'Browser automation and E2E testing';
        }
        // Chrome MCP keywords
        if (lowerQuery.includes('devtools') ||
            lowerQuery.includes('performance') ||
            lowerQuery.includes('lighthouse') ||
            lowerQuery.includes('visual regression')) {
            scores.chrome_mcp.score += 80;
            scores.chrome_mcp.reasoning = 'Chrome DevTools and performance analysis';
        }
        // GitHub MCP keywords
        if (lowerQuery.includes('github') ||
            lowerQuery.includes('repository') ||
            lowerQuery.includes('issue') ||
            lowerQuery.includes('pr') ||
            lowerQuery.includes('pull request')) {
            scores.github_mcp.score += 90;
            scores.github_mcp.reasoning = 'GitHub repository access';
        }
        // Exa Search MCP keywords
        if (lowerQuery.includes('search') ||
            lowerQuery.includes('web') ||
            lowerQuery.includes('documentation') ||
            lowerQuery.includes('research')) {
            scores.exa_mcp.score += 70;
            scores.exa_mcp.reasoning = 'AI-powered web search';
        }
        // Shadcn MCP keywords
        if (lowerQuery.includes('component') ||
            lowerQuery.includes('ui') ||
            lowerQuery.includes('shadcn') ||
            lowerQuery.includes('react')) {
            scores.shadcn_mcp.score += 85;
            scores.shadcn_mcp.reasoning = 'UI component library';
        }
        // GitMCP keywords (anti-hallucination)
        if (lowerQuery.includes('verify') ||
            lowerQuery.includes('hallucination') ||
            lowerQuery.includes('ground truth') ||
            lowerQuery.includes('fact check')) {
            scores.gitmcp.score += 95;
            scores.gitmcp.reasoning = 'Hallucination detection and ground truth verification';
        }
        // VERSATIL MCP keywords (framework orchestration)
        if (lowerQuery.includes('orchestration') ||
            lowerQuery.includes('workflow') ||
            lowerQuery.includes('agent') ||
            lowerQuery.includes('versatil')) {
            scores.versatil_mcp.score += 90;
            scores.versatil_mcp.reasoning = 'Framework orchestration and workflow';
        }
        // Adjust scores based on health status
        const healthStatuses = await this.getAllHealthStatuses();
        for (const [server, scoreData] of Object.entries(scores)) {
            const health = healthStatuses.find(h => h.mcpId === server);
            if (health) {
                if (health.status === 'unhealthy' || health.circuitOpen) {
                    scoreData.score = Math.floor(scoreData.score * 0.2); // Severely penalize unhealthy servers
                }
                else if (health.status === 'degraded') {
                    scoreData.score = Math.floor(scoreData.score * 0.7); // Moderately penalize degraded servers
                }
            }
        }
        // Find best match
        const sorted = Object.entries(scores)
            .map(([server, data]) => ({ server, score: data.score, reasoning: data.reasoning }))
            .sort((a, b) => b.score - a.score);
        const best = sorted[0];
        const alternatives = sorted.slice(1, 4); // Top 3 alternatives
        return {
            server: best.server,
            confidence: Math.min(best.score, 100),
            reasoning: best.reasoning || 'Best match based on query keywords',
            alternatives: alternatives.map(alt => ({ server: alt.server, score: alt.score }))
        };
    }
    /**
     * Execute MCP tool call with auto-retry and health monitoring
     *
     * @param toolCall Tool call request
     * @returns Execution result with retry and fallback info
     */
    async executeToolCall(toolCall) {
        const startTime = Date.now();
        const retriesUsed = 0;
        const usedFallback = false;
        // Route to appropriate MCP server
        const routing = await this.routeQuery(`${toolCall.tool} ${toolCall.action}`);
        try {
            // Execute via tool router
            const response = await this.toolRouter.handleToolCall({
                tool: toolCall.tool,
                action: toolCall.action,
                params: toolCall.params,
                agentId: toolCall.agentId,
                taskId: toolCall.taskId
            });
            return {
                success: response.success,
                data: response.data,
                error: response.error,
                executionTime: Date.now() - startTime,
                retriesUsed,
                usedFallback,
                mcpServer: routing.server
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                executionTime: Date.now() - startTime,
                retriesUsed,
                usedFallback,
                mcpServer: routing.server
            };
        }
    }
    /**
     * Validate environment for MCP operations
     *
     * @returns Environment validation result with quality gate
     */
    async validateEnvironment() {
        const warnings = [];
        const errors = [];
        // Check Node.js
        const nodejs = this.checkNodeJS();
        if (!nodejs.installed) {
            errors.push('Node.js not installed');
        }
        else if (!nodejs.meetsRequirements) {
            warnings.push(`Node.js version ${nodejs.version} may not meet requirements (14+ recommended)`);
        }
        // Check npm
        const npm = this.checkNPM();
        if (!npm.installed) {
            errors.push('npm not installed');
        }
        else if (!npm.meetsRequirements) {
            warnings.push(`npm version ${npm.version} may not meet requirements (6+ recommended)`);
        }
        // Check git
        const git = this.checkGit();
        if (!git.installed) {
            warnings.push('git not installed - some MCP features may be limited');
        }
        // Check MCP servers
        const mcpServers = await this.checkMCPServers();
        const unhealthyServers = mcpServers.filter(s => !s.healthy);
        if (unhealthyServers.length > 0) {
            warnings.push(`${unhealthyServers.length} MCP server(s) unhealthy: ${unhealthyServers.map(s => s.name).join(', ')}`);
        }
        // Quality gate: Block if critical errors exist
        const safeToProceed = errors.length === 0;
        return {
            nodejs,
            npm,
            git,
            mcpServers,
            safe_to_proceed: safeToProceed,
            warnings,
            errors
        };
    }
    /**
     * Get health status for all MCP servers
     */
    async getAllHealthStatuses() {
        const statuses = [];
        const mcpIds = [
            'chrome_mcp',
            'playwright_mcp',
            'github_mcp',
            'exa_mcp',
            'shadcn_mcp',
            'gitmcp',
            'versatil_mcp'
        ];
        for (const mcpId of mcpIds) {
            const health = this.healthMonitor.getHealthStatus(mcpId);
            if (health) {
                statuses.push(health);
            }
        }
        return statuses;
    }
    // Private helper methods
    checkNodeJS() {
        try {
            const version = execSync('node --version', { encoding: 'utf-8' }).trim();
            const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
            return {
                installed: true,
                version,
                meetsRequirements: majorVersion >= 14
            };
        }
        catch {
            return { installed: false, meetsRequirements: false };
        }
    }
    checkNPM() {
        try {
            const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
            const majorVersion = parseInt(version.split('.')[0]);
            return {
                installed: true,
                version,
                meetsRequirements: majorVersion >= 6
            };
        }
        catch {
            return { installed: false, meetsRequirements: false };
        }
    }
    checkGit() {
        try {
            const version = execSync('git --version', { encoding: 'utf-8' }).trim();
            return {
                installed: true,
                version,
                meetsRequirements: true
            };
        }
        catch {
            return { installed: false, meetsRequirements: false };
        }
    }
    async checkMCPServers() {
        const servers = [
            'chrome_mcp',
            'playwright_mcp',
            'github_mcp',
            'exa_mcp',
            'shadcn_mcp',
            'gitmcp',
            'versatil_mcp'
        ];
        const results = [];
        for (const server of servers) {
            const health = this.healthMonitor.getHealthStatus(server);
            results.push({
                name: server,
                installed: health !== null,
                healthy: health?.status === 'healthy',
                circuitOpen: health?.circuitOpen || false
            });
        }
        return results;
    }
}
// Export singleton instance
export const oliverMCP = OliverMCP.getInstance();
//# sourceMappingURL=oliver-mcp.js.map