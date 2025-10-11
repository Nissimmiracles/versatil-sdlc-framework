/**
 * Maria-QA SDK Agent
 * SDK-native version of Enhanced Maria that uses Claude Agent SDK for execution
 * while preserving all existing QA functionality
 */

import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { EnhancedMaria } from './enhanced-maria.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';

export class MariaSDKAgent extends SDKAgentAdapter {
  private legacyAgent: EnhancedMaria;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super({
      agentId: 'maria-qa',
      vectorStore,
      model: 'sonnet'
    });

    // Keep legacy agent for specialized methods
    this.legacyAgent = new EnhancedMaria(vectorStore);
  }

  /**
   * Override activate to add Maria-specific validations
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // 1. Run SDK activation (core analysis)
    const response = await super.activate(context);

    // 2. Add Maria-specific validations using legacy methods
    if (context.content) {
      // Configuration inconsistency check
      if (this.legacyAgent.hasConfigurationInconsistencies(context)) {
        response.suggestions = response.suggestions || [];
        response.suggestions.push({
          type: 'configuration-inconsistency',
          message: 'Mixed environment variables and hardcoded values detected',
          priority: 'high',
          file: context.filePath || 'unknown'
        });
      }

      // Route-navigation validation
      if (context.content.includes('const routes') || context.content.includes('const navigation')) {
        const routeValidation = this.legacyAgent.validateRouteNavigationConsistency(context);
        if (routeValidation.issues.length > 0) {
          response.suggestions = response.suggestions || [];
          response.suggestions.push(...routeValidation.issues.map(issue => ({
            type: issue.type,
            message: issue.message,
            priority: issue.severity,
            file: issue.file
          })));
        }
      }
    }

    // 3. Add quality-specific context
    if (response.context) {
      response.context = {
        ...response.context,
        qualityScore: response.context.analysisScore,
        testCoverage: 85, // TODO: Calculate from actual coverage
        emergencyMode: this.isEmergencyMode(context)
      };
    }

    // 4. Escalate priority in emergency mode
    if (this.isEmergencyMode(context) && response.priority !== 'critical') {
      response.priority = 'critical';
    }

    return response;
  }

  /**
   * Check if emergency mode should be activated
   */
  private isEmergencyMode(context: AgentActivationContext): boolean {
    return context.trigger?.type === 'emergency' ||
      (context.content && (
        context.content.includes('URGENT') ||
        context.content.includes('CRITICAL') ||
        context.content.includes('EMERGENCY')
      ));
  }

  /**
   * Generate quality dashboard (delegated to legacy agent)
   */
  generateQualityDashboard(results: any): any {
    return this.legacyAgent.generateQualityDashboard(results);
  }

  /**
   * Identify critical issues (delegated to legacy agent)
   */
  identifyCriticalIssues(results: any): any[] {
    return this.legacyAgent.identifyCriticalIssues(results);
  }

  /**
   * Generate enhanced report (delegated to legacy agent)
   */
  generateEnhancedReport(results: any, dashboard?: any, criticalIssues?: any[]): string {
    return this.legacyAgent.generateEnhancedReport(results, dashboard, criticalIssues);
  }

  /**
   * Generate actionable recommendations (delegated to legacy agent)
   */
  generateActionableRecommendations(results: any): Array<{ type: string; message: string; priority: string }> {
    return this.legacyAgent.generateActionableRecommendations(results);
  }

  /**
   * Determine handoffs (delegated to legacy agent)
   */
  determineHandoffs(results: any): string[] {
    return this.legacyAgent.determineHandoffs(results);
  }

  /**
   * Calculate priority (delegated to legacy agent)
   */
  calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const priority = this.legacyAgent.calculatePriority(issues);
    return priority as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Generate fix suggestion (delegated to legacy agent)
   */
  generateFix(issue: any): string {
    return this.legacyAgent.generateFix(issue);
  }

  /**
   * Generate prevention strategy (delegated to legacy agent)
   */
  generatePreventionStrategy(issue: any): string {
    return this.legacyAgent.generatePreventionStrategy(issue);
  }

  /**
   * Get score emoji (delegated to legacy agent)
   */
  getScoreEmoji(score: number): string {
    return this.legacyAgent.getScoreEmoji(score);
  }

  /**
   * Validate route-navigation consistency (delegated to legacy agent)
   */
  validateRouteNavigationConsistency(context: any): { score: number; issues: any[]; warnings: any[] } {
    return this.legacyAgent.validateRouteNavigationConsistency(context);
  }

  /**
   * Check configuration inconsistencies (delegated to legacy agent)
   */
  hasConfigurationInconsistencies(context: any): boolean {
    return this.legacyAgent.hasConfigurationInconsistencies(context);
  }

  /**
   * Extract agent name (delegated to legacy agent)
   */
  extractAgentName(text: string): string {
    return this.legacyAgent.extractAgentName(text);
  }

  /**
   * NEW v6.1: Run E2E tests using Playwright MCP
   */
  async runE2ETests(options: {
    testFile?: string;
    testPattern?: string;
    headless?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    return await router.handleToolCall({
      tool: 'Playwright',
      action: 'run_tests',
      params: {
        testFile: options.testFile,
        testPattern: options.testPattern,
        headless: options.headless !== false
      },
      agentId: 'maria-qa'
    });
  }

  /**
   * NEW v6.1: Run visual regression tests using Playwright MCP
   */
  async runVisualRegressionTests(options: {
    baselineDir: string;
    testDir: string;
    threshold?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    return await router.handleToolCall({
      tool: 'Playwright',
      action: 'visual_regression',
      params: {
        baselineDir: options.baselineDir,
        testDir: options.testDir,
        threshold: options.threshold || 0.1
      },
      agentId: 'maria-qa'
    });
  }

  /**
   * NEW v6.1: Run performance tests using Chrome MCP
   */
  async runPerformanceTests(options: {
    url: string;
    metrics: string[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    return await router.handleToolCall({
      tool: 'Chrome',
      action: 'performance_test',
      params: {
        url: options.url,
        metrics: options.metrics
      },
      agentId: 'maria-qa'
    });
  }
}
