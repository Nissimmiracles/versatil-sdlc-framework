/**
 * James-Frontend SDK Agent
 * SDK-native version of Enhanced James that uses Claude Agent SDK for execution
 * while preserving all existing frontend functionality
 */

import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { EnhancedJames } from './enhanced-james.js';
import { UXExcellenceReviewer } from './sub-agents/ux-excellence-reviewer.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';

export class JamesSDKAgent extends SDKAgentAdapter {
  private legacyAgent: EnhancedJames;
  private uxReviewer: UXExcellenceReviewer;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super({
      agentId: 'james-frontend',
      vectorStore,
      model: 'sonnet'
    });

    // Keep legacy agent for specialized methods
    this.legacyAgent = new EnhancedJames(vectorStore);

    // Initialize UX Excellence Reviewer sub-agent
    this.uxReviewer = new UXExcellenceReviewer();
  }

  /**
   * Override activate to add James-specific validations
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // 1. Run SDK activation (core analysis)
    const response = await super.activate(context);

    // 2. Add James-specific validations using legacy methods

    // Navigation integrity validation
    const navValidation = this.legacyAgent.validateNavigationIntegrity(context);
    if (navValidation.issues.length > 0) {
      response.suggestions = response.suggestions || [];
      response.suggestions.push(...navValidation.issues.map(issue => ({
        type: issue.type,
        message: issue.message,
        priority: issue.severity,
        file: issue.file
      })));
    }

    // 3. Add frontend-specific context
    if (response.context) {
      response.context = {
        ...response.context,
        frontendHealth: response.context.analysisScore,
        navigationScore: navValidation.score,
        componentType: this.detectComponentType(context.content || '')
      };
    }

    return response;
  }

  /**
   * Detect component type for better context
   */
  private detectComponentType(content: string): string {
    if (content.includes('useState') || content.includes('useEffect')) return 'functional-react';
    if (content.includes('class') && content.includes('extends')) return 'class-component';
    if (content.includes('defineComponent')) return 'vue-component';
    if (content.includes('<script>') && content.includes('<template>')) return 'vue-sfc';
    if (content.includes('export default')) return 'module';
    return 'component';
  }

  /**
   * Run frontend validation (delegated to legacy agent)
   */
  async runFrontendValidation(context: any): Promise<any> {
    return this.legacyAgent.runFrontendValidation(context);
  }

  /**
   * Validate context flow (delegated to legacy agent)
   */
  validateContextFlow(context: any): { score: number; issues: any[] } {
    return this.legacyAgent.validateContextFlow(context);
  }

  /**
   * Validate navigation integrity (delegated to legacy agent)
   */
  validateNavigationIntegrity(context: any): { score: number; issues: any[]; warnings: any[] } {
    return this.legacyAgent.validateNavigationIntegrity(context);
  }

  /**
   * Check route consistency (delegated to legacy agent)
   */
  checkRouteConsistency(context: any): { score: number; issues: any[] } {
    return this.legacyAgent.checkRouteConsistency(context);
  }

  /**
   * Calculate priority (delegated to legacy agent)
   */
  calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const priority = this.legacyAgent.calculatePriority(issues);
    return priority as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Determine handoffs (delegated to legacy agent)
   */
  determineHandoffs(issues: any[]): string[] {
    return this.legacyAgent.determineHandoffs(issues);
  }

  /**
   * Generate actionable recommendations (delegated to legacy agent)
   */
  generateActionableRecommendations(issues: any[]): Array<{ type: string; message: string; priority: string }> {
    return this.legacyAgent.generateActionableRecommendations(issues);
  }

  /**
   * Generate enhanced report (delegated to legacy agent)
   */
  generateEnhancedReport(issues: any[], metadata: any = {}): string {
    return this.legacyAgent.generateEnhancedReport(issues, metadata);
  }

  /**
   * Get score emoji (delegated to legacy agent)
   */
  getScoreEmoji(score: number): string {
    return this.legacyAgent.getScoreEmoji(score);
  }

  /**
   * Extract agent name (delegated to legacy agent)
   */
  extractAgentName(text: string): string {
    return this.legacyAgent.extractAgentName(text);
  }

  /**
   * Validate component accessibility (delegated to legacy agent)
   */
  validateComponentAccessibility(context: any): any[] {
    return this.legacyAgent.validateComponentAccessibility(context);
  }

  /**
   * Check responsive design (delegated to legacy agent)
   */
  checkResponsiveDesign(context: any): any[] {
    return this.legacyAgent.checkResponsiveDesign(context);
  }

  /**
   * Analyze bundle size (delegated to legacy agent)
   */
  analyzeBundleSize(context: any): any {
    return this.legacyAgent.analyzeBundleSize(context);
  }

  /**
   * Validate CSS consistency (delegated to legacy agent)
   */
  validateCSSConsistency(context: any): any[] {
    return this.legacyAgent.validateCSSConsistency(context);
  }

  /**
   * Check browser compatibility (delegated to legacy agent)
   */
  checkBrowserCompatibility(context: any): any[] {
    return this.legacyAgent.checkBrowserCompatibility(context);
  }

  /**
   * Identify critical issues (delegated to legacy agent)
   */
  identifyCriticalIssues(issues: any[]): any[] {
    return this.legacyAgent.identifyCriticalIssues(issues);
  }

  /**
   * Check configuration inconsistencies (delegated to legacy agent)
   */
  hasConfigurationInconsistencies(context: any): boolean {
    return this.legacyAgent.hasConfigurationInconsistencies(context);
  }

  /**
   * NEW v6.1: Run visual regression tests using Playwright MCP
   */
  async runVisualTest(options: {
    url?: string;
    selector?: string;
    testName: string;
    viewport?: { width: number; height: number };
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    return await router.handleToolCall({
      tool: 'Playwright',
      action: 'screenshot',
      params: {
        url: options.url || 'http://localhost:3000',
        selector: options.selector,
        viewport: options.viewport || { width: 1920, height: 1080 },
        testName: options.testName
      },
      agentId: 'james-frontend'
    });
  }

  /**
   * NEW v6.1: Implement design from Figma/Sketch using Chrome MCP
   */
  async implementFromDesign(options: {
    designUrl: string;
    componentName: string;
    outputPath: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    // Navigate to design and extract styles
    return await router.handleToolCall({
      tool: 'Chrome',
      action: 'navigate',
      params: {
        url: options.designUrl,
        componentName: options.componentName,
        outputPath: options.outputPath
      },
      agentId: 'james-frontend'
    });
  }

  /**
   * NEW v6.1: Run accessibility audit using Playwright MCP
   */
  async runAccessibilityAudit(options: {
    url?: string;
    selector?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
    const router = getMCPToolRouter();

    return await router.handleToolCall({
      tool: 'Playwright',
      action: 'accessibility_check',
      params: {
        url: options.url || 'http://localhost:3000',
        selector: options.selector
      },
      agentId: 'james-frontend'
    });
  }

  /**
   * NEW v6.2: Run comprehensive UX review using UX Excellence Reviewer sub-agent
   *
   * Auto-triggers on:
   * - UI component changes (*.tsx, *.jsx, *.vue, *.css)
   * - Markdown updates (*.md)
   * - Manual review requests
   *
   * @example
   * const review = await jamesAgent.runUXReview({
   *   filePaths: ['src/components/LoginForm.tsx', 'src/pages/Dashboard.tsx'],
   *   fileContents: new Map([
   *     ['src/components/LoginForm.tsx', loginFormCode],
   *     ['src/pages/Dashboard.tsx', dashboardCode]
   *   ]),
   *   framework: 'react'
   * });
   *
   * console.log(review.overallScore); // 85
   * console.log(review.criticalIssues); // [...]
   */
  async runUXReview(context: {
    filePaths: string[];
    fileContents: Map<string, string>;
    userRole?: 'admin' | 'user' | 'super_admin';
    deviceSize?: 'mobile' | 'tablet' | 'desktop';
    framework?: 'react' | 'vue' | 'svelte' | 'angular';
    designSystem?: any;
  }): Promise<any> {
    return await this.uxReviewer.reviewComprehensive(context);
  }

  /**
   * NEW v6.2: Generate formatted UX review report
   *
   * Creates a comprehensive markdown report with:
   * - Executive summary
   * - What's working well
   * - Critical issues
   * - Design recommendations
   * - Implementation roadmap
   *
   * @example
   * const review = await jamesAgent.runUXReview(context);
   * const report = jamesAgent.generateUXReport(review);
   * console.log(report); // Markdown formatted report
   */
  generateUXReport(reviewResult: any): string {
    return this.uxReviewer.generateFormattedReport(reviewResult);
  }

  /**
   * NEW v6.2: Auto-detect if UX review should be triggered
   *
   * Returns true if file changes warrant a UX review:
   * - UI components (*.tsx, *.jsx, *.vue)
   * - Stylesheets (*.css, *.scss, *.less)
   * - Markdown documentation (*.md)
   * - Design files
   *
   * @example
   * if (jamesAgent.shouldTriggerUXReview(['LoginForm.tsx', 'styles.css'])) {
   *   const review = await jamesAgent.runUXReview(context);
   * }
   */
  shouldTriggerUXReview(filePaths: string[]): boolean {
    const uxRelevantExtensions = [
      '.tsx', '.jsx', '.vue', '.svelte',
      '.css', '.scss', '.sass', '.less',
      '.md', '.mdx',
      '.fig', '.sketch', '.xd'
    ];

    return filePaths.some(path =>
      uxRelevantExtensions.some(ext => path.endsWith(ext))
    );
  }
}
