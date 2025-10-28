/**
 * VERSATIL v6.4.1 - Oliver-MCP: MCP Intelligence & Orchestration Agent
 *
 * Purpose: Intelligent MCP selection, type classification, and anti-hallucination logic
 *
 * Responsibilities:
 * 1. Classify MCPs as Integration, Documentation, or Hybrid
 * 2. Select optimal MCP for each task using advanced selection engine
 * 3. Detect when GitMCP should be used for zero hallucinations (Claude cutoff: Jan 2025)
 * 4. Generate precise GitMCP queries (framework + topic → repo + path)
 * 5. Maintain MCP capability registry
 * 6. Optimize MCP routing for all 8 OPERA agents
 *
 * Architecture:
 * - MCP Selection Engine: Task type → optimal MCP with confidence scoring
 * - Anti-Hallucination Detector: Knowledge freshness checking (Jan 2025 cutoff)
 * - GitMCP Query Generator: Framework + topic → GitHub repo + docs path
 * - Main Orchestrator: Integrates all components, routes tasks to MCPs
 *
 * Usage:
 * ```typescript
 * const oliver = new OliverMCPAgent(logger);
 * await oliver.activate(context);
 *
 * // Intelligent MCP selection (uses advanced selection engine)
 * const recommendation = await oliver.routeTask({
 *   name: 'research-fastapi-oauth',
 *   description: 'Find FastAPI OAuth2 patterns',
 *   agentId: 'marcus-backend',
 *   type: 'research'
 * });
 * // → {
 * //     recommendedMCP: 'gitmcp',
 * //     confidence: 95,
 * //     reasoning: 'High hallucination risk (Jan 2025 cutoff). GitMCP provides real-time FastAPI docs.',
 * //     execution: { repository: 'tiangolo/fastapi', path: 'docs/tutorial/security/oauth2-jwt' }
 * //   }
 *
 * // Anti-hallucination detection (with 30+ framework knowledge base)
 * const antiHallucination = await oliver.detectHallucinationRisk(
 *   'How do I implement OAuth2 in FastAPI?'
 * );
 * // → {
 * //     level: 'high',
 * //     score: 85,
 * //     reasoning: 'Framework: FastAPI (high release frequency, Jan 2025 cutoff)',
 * //     recommendation: { action: 'use-gitmcp', repository: 'tiangolo/fastapi', ... }
 * //   }
 * ```
 */
import { BaseAgent, AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';
import { MCPSelectionResult } from './mcp-selection-engine.js';
import { HallucinationRisk } from './anti-hallucination-detector.js';
import { GitMCPQuery, QueryContext } from './gitmcp-query-generator.js';
export type MCPType = 'integration' | 'documentation' | 'hybrid';
export type TaskType = 'research' | 'integration' | 'documentation' | 'action' | 'testing';
export interface MCPDefinition {
    name: string;
    type: MCPType;
    capabilities: string[];
    writeOperations: boolean;
    readOperations: boolean;
    antiHallucination?: boolean;
    recommendedFor: string[];
    examples?: string[];
}
export interface TaskContext {
    type: TaskType;
    description: string;
    agentId: string;
    framework?: string;
    topic?: string;
    requiresWrite?: boolean;
}
export interface MCPRecommendation {
    mcpName: string;
    mcpType: MCPType;
    confidence: number;
    reasoning: string;
    alternatives?: string[];
    parameters?: Record<string, any>;
}
export interface GitMCPRecommendation {
    shouldUse: boolean;
    repository: {
        owner: string;
        repo: string;
        path?: string;
    };
    reasoning: string;
    confidence: number;
    hallucination_risk: 'low' | 'medium' | 'high';
}
/**
 * Main routing request interface (uses advanced selection engine)
 */
export interface MCPRoutingRequest {
    name: string;
    description: string;
    agentId?: string;
    type?: string;
    filePatterns?: string[];
    keywords?: string[];
}
/**
 * Complete routing result with execution plan
 */
export interface MCPRoutingResult {
    recommendedMCP: string;
    confidence: number;
    reasoning: string;
    alternatives: string[];
    hallucinationRisk?: HallucinationRisk;
    gitMCPQuery?: GitMCPQuery;
    execution: {
        mcpName: string;
        parameters: Record<string, any>;
        expectedDuration?: string;
    };
    metadata: {
        selectionEngine: MCPSelectionResult;
        timestamp: string;
        agentId?: string;
    };
}
export declare class OliverMCPAgent extends BaseAgent {
    private logger;
    systemPrompt: string;
    name: string;
    id: string;
    specialization: string;
    private mcpRegistry;
    private usageStats;
    private selectionEngine;
    private hallucinationDetector;
    private queryGenerator;
    constructor(logger: VERSATILLogger);
    /**
     * Initialize MCP registry from schema
     */
    private initializeRegistry;
    /**
     * Main activation method
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * MAIN ROUTING METHOD: Route task to optimal MCP with anti-hallucination logic
     *
     * This is the primary entry point that integrates:
     * 1. MCP Selection Engine (task → optimal MCP)
     * 2. Anti-Hallucination Detector (knowledge freshness check)
     * 3. GitMCP Query Generator (framework + topic → repo + path)
     *
     * @param request - Task routing request
     * @returns Complete routing result with execution plan
     */
    routeTask(request: MCPRoutingRequest): Promise<MCPRoutingResult>;
    /**
     * Build execution plan for selected MCP
     */
    private buildExecutionPlan;
    /**
     * Estimate execution duration for MCP
     */
    private estimateDuration;
    /**
     * Wrapper for anti-hallucination detection (public API)
     */
    detectHallucinationRisk(query: string): Promise<HallucinationRisk>;
    /**
     * Wrapper for GitMCP query generation (public API)
     */
    generateGitMCPQuery(context: QueryContext): Promise<GitMCPQuery>;
    /**
     * @deprecated Use routeTask() instead for advanced routing with anti-hallucination
     * Select optimal MCP for a given task (legacy method)
     */
    selectMCPForTask(task: TaskContext): Promise<MCPRecommendation>;
    /**
     * Anti-hallucination detection: Should GitMCP be used?
     */
    shouldUseGitMCP(context: {
        framework: string;
        topic: string;
        agentKnowledge: Date;
    }): Promise<GitMCPRecommendation>;
    /**
     * Classify MCP type
     */
    classifyMCP(mcpName: string): MCPType;
    /**
     * Get MCP definition
     */
    getMCPDefinition(mcpName: string): MCPDefinition | undefined;
    /**
     * Get all MCPs of a specific type
     */
    getMCPsByType(type: MCPType): MCPDefinition[];
    /**
     * Get recommended MCPs for an agent
     */
    getMCPsForAgent(agentId: string): MCPDefinition[];
    /**
     * Track MCP usage
     */
    trackMCPUsage(mcpName: string): void;
    /**
     * Get usage statistics
     */
    getUsageStats(): Record<string, number>;
    private determineRequiredMCPType;
    private selectBestCandidate;
    private scoreMCPForTask;
    private generateMCPSuggestions;
}
/**
 * Singleton instance of Oliver-MCP for framework-wide use
 *
 * Usage in other agents:
 * ```typescript
 * import { oliverMCP } from './agents/mcp/oliver-mcp-orchestrator.js';
 *
 * // Route task with anti-hallucination
 * const routing = await oliverMCP.routeTask({
 *   name: 'research-fastapi-oauth',
 *   description: 'Find FastAPI OAuth2 implementation patterns',
 *   agentId: 'marcus-backend',
 *   keywords: ['fastapi', 'oauth2', 'authentication']
 * });
 *
 * // Use recommended MCP
 * if (routing.recommendedMCP === 'gitmcp' && routing.gitMCPQuery) {
 *   const query = routing.gitMCPQuery;
 *   // Execute: gitmcp query tiangolo/fastapi docs/tutorial/security/oauth2-jwt
 * }
 * ```
 */
export declare const oliverMCP: OliverMCPAgent;
/**
 * Example 1: Research Task with Anti-Hallucination
 *
 * ```typescript
 * const result = await oliverMCP.routeTask({
 *   name: 'research-react-server-components',
 *   description: 'How do React Server Components work?',
 *   agentId: 'james-frontend',
 *   keywords: ['react', 'server components', 'rsc']
 * });
 *
 * // Expected Result:
 * // {
 * //   recommendedMCP: 'gitmcp',
 * //   confidence: 90,
 * //   reasoning: 'High hallucination risk (Jan 2025 cutoff). GitMCP provides real-time React docs.',
 * //   gitMCPQuery: {
 * //     repository: 'facebook/react',
 * //     path: 'docs/server-components.md',
 * //     confidence: 90
 * //   },
 * //   execution: {
 * //     mcpName: 'gitmcp',
 * //     parameters: {
 * //       repository: 'facebook/react',
 * //       path: 'docs/server-components.md',
 * //       query: 'gitmcp://facebook/react/docs/server-components.md'
 * //     }
 * //   }
 * // }
 * ```
 */
/**
 * Example 2: Testing Task
 *
 * ```typescript
 * const result = await oliverMCP.routeTask({
 *   name: 'e2e-test-checkout-flow',
 *   description: 'Test checkout flow with real browser',
 *   agentId: 'maria-qa',
 *   filePatterns: ['checkout.spec.ts'],
 *   keywords: ['test', 'e2e', 'checkout']
 * });
 *
 * // Expected Result:
 * // {
 * //   recommendedMCP: 'playwright',
 * //   confidence: 95,
 * //   reasoning: 'Testing tasks with browser automation → Playwright',
 * //   execution: {
 * //     mcpName: 'playwright',
 * //     parameters: {
 * //       browserType: 'chromium',
 * //       headless: true
 * //     },
 * //     expectedDuration: '30-60 seconds'
 * //   }
 * // }
 * ```
 */
/**
 * Example 3: Integration Task
 *
 * ```typescript
 * const result = await oliverMCP.routeTask({
 *   name: 'create-github-issue',
 *   description: 'Create GitHub issue for bug report in tiangolo/fastapi',
 *   agentId: 'sarah-pm',
 *   keywords: ['github', 'issue', 'bug']
 * });
 *
 * // Expected Result:
 * // {
 * //   recommendedMCP: 'github',
 * //   confidence: 95,
 * //   reasoning: 'GitHub operations require GitHub MCP integration',
 * //   execution: {
 * //     mcpName: 'github',
 * //     parameters: {
 * //       repository: 'tiangolo/fastapi'
 * //     },
 * //     expectedDuration: '5-10 seconds'
 * //   }
 * // }
 * ```
 */
/**
 * Example 4: Direct Anti-Hallucination Check
 *
 * ```typescript
 * const risk = await oliverMCP.detectHallucinationRisk(
 *   'How do I implement OAuth2 in FastAPI with SQLAlchemy?'
 * );
 *
 * // Expected Result:
 * // {
 * //   level: 'high',
 * //   score: 85,
 * //   reasoning: 'Detected frameworks: FastAPI (high release frequency, Jan 2025 cutoff)',
 * //   recommendation: {
 * //     action: 'use-gitmcp',
 * //     framework: 'FastAPI',
 * //     topic: 'OAuth2',
 * //     confidence: 90,
 * //     repository: 'tiangolo/fastapi',
 * //     path: 'docs/tutorial/security/oauth2-jwt'
 * //   }
 * // }
 * ```
 */
/**
 * Example 5: Direct GitMCP Query Generation
 *
 * ```typescript
 * const query = await oliverMCP.generateGitMCPQuery({
 *   framework: 'NextJS',
 *   topic: 'server components',
 *   keywords: ['nextjs', 'server', 'components'],
 *   intent: 'learn'
 * });
 *
 * // Expected Result:
 * // {
 * //   repository: 'vercel/next.js',
 * //   path: 'docs/server-components',
 * //   fileType: 'docs',
 * //   confidence: 85,
 * //   reasoning: 'Framework NextJS identified, topic "server components" mapped to docs path',
 * //   alternatives: [
 * //     { repository: 'vercel/next.js', path: 'README.md', ... },
 * //     { repository: 'vercel/next.js', path: 'examples', ... }
 * //   ]
 * // }
 * ```
 */
