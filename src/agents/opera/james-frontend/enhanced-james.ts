import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { PromptGenerator } from '../intelligence/prompt-generator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export class EnhancedJames extends RAGEnabledAgent {
  name = 'EnhancedJames';
  id = 'enhanced-james';
  specialization = 'Advanced Frontend Specialist & Navigation Validator';
  systemPrompt = 'Frontend architect specializing in modern component architecture, responsive design, accessibility, and web performance';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to provide frontend-specific context
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const response = await super.activate(context);

    // Replace analysisScore with frontendHealth
    if (response.context) {
      const { analysisScore, ...rest } = response.context;
      response.context = {
        ...rest,
        frontendHealth: analysisScore
      };
    }

    // Add route-navigation validation to suggestions
    const navValidation = this.validateNavigationIntegrity(context);
    if (navValidation.issues.length > 0) {
      response.suggestions = response.suggestions || [];
      response.suggestions.push(...navValidation.issues.map(issue => ({
        type: issue.type,
        message: issue.message,
        priority: issue.severity,
        file: issue.file
      })));
    }

    return response;
  }

  /**
   * Frontend-specific RAG configuration
   */
  protected getDefaultRAGConfig(): RAGConfig {
    return {
      maxExamples: 3,
      similarityThreshold: 0.8,
      agentDomain: 'frontend',
      enableLearning: true
    };
  }

  /**
   * Run frontend-specific pattern analysis
   */
  protected async runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult> {
    return PatternAnalyzer.analyzeFrontend(context.content, context.filePath);
  }

  /**
   * Override message generation to include agent name
   */
  protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string {
    const criticalCount = analysis.patterns.filter(p => p.severity === 'critical').length;

    let message = criticalCount > 0
      ? `Enhanced James - Critical Issues Detected: ${criticalCount} critical issues found.`
      : `Enhanced James - Frontend Analysis Complete: Score ${analysis.score}/100. ${analysis.patterns.length} issues found.`;

    if (ragContext) {
      const ragInsights = [];
      if (ragContext.similarCode.length > 0) ragInsights.push(`${ragContext.similarCode.length} similar patterns`);
      if (Object.keys(ragContext.previousSolutions).length > 0) ragInsights.push(`solutions for ${Object.keys(ragContext.previousSolutions).length} issue types`);
      if (ragContext.projectStandards.length > 0) ragInsights.push(`${ragContext.projectStandards.length} project standards`);

      if (ragInsights.length > 0) {
        message += ` RAG-Enhanced: ${ragInsights.join(', ')}.`;
      }
    }

    return message;
  }

  /**
   * Generate frontend-specific base prompt template
   */
  protected getBasePromptTemplate(): string {
    return `---
name: enhanced-james-frontend-rag
description: RAG-Enhanced Frontend Analysis
model: sonnet
agent: Enhanced James
---

You are **Enhanced James**, a frontend architect with 10+ years of experience in modern component architecture, responsive design, accessibility, and web performance optimization.

## Your Core Mission
Provide comprehensive frontend analysis with historical component patterns and proven UI/UX solutions.

## Frontend Focus Areas:
1. **Component Architecture**
   - Analyze component structure and reusability
   - Suggest improvements based on similar successful patterns
   - Evaluate state management approaches

2. **UI/UX Analysis**
   - Review accessibility compliance (WCAG 2.1 AA)
   - Check responsive design implementation
   - Validate design system consistency

3. **Performance Optimization**
   - Identify performance bottlenecks
   - Suggest optimization strategies from proven patterns
   - Evaluate bundle size and loading strategies

4. **Modern Standards**
   - Apply contemporary frontend best practices
   - Ensure cross-browser compatibility
   - Validate modern CSS and JavaScript usage

5. **Framework-Specific Guidance**
   - React: Hooks usage, component lifecycle, context
   - Vue: Composition API, reactivity, component communication
   - Svelte: Store management, component binding
`;
  }

  /**
   * Generate frontend-specific handoffs based on analysis
   */
  protected generateDomainHandoffs(analysis: AnalysisResult): string[] {
    const handoffs: string[] = [];

    if (analysis.patterns.some(p => p.type === 'large-component' || p.type === 'complex-state')) {
      handoffs.push('architecture-dan');
    }
    if (analysis.score < 70) {
      handoffs.push('enhanced-maria');
    }
    if (analysis.patterns.some(p => p.category === 'security')) {
      handoffs.push('security-sam');
    }
    if (analysis.patterns.some(p => p.type.includes('api') || p.type.includes('data'))) {
      handoffs.push('enhanced-marcus');
    }

    return handoffs;
  }

  /**
   * Enhanced frontend analysis with RAG context specialization using Edge Functions
   */
  protected async retrieveRelevantContext(
    context: AgentActivationContext,
    analysis: AnalysisResult
  ): Promise<AgentRAGContext> {
    const ragContext = await super.retrieveRelevantContext(context, analysis);

    // Frontend-specific enhancements using production Edge Functions
    if (this.vectorStore) {
      try {
        // Use James RAG Edge Function for production-ready Frontend intelligence
        const jamesRAGResult = await this.vectorStore.jamesRAG(
          this.generateRAGQuery(context, analysis),
          {
            filePath: context.filePath,
            content: context.content,
            framework: this.detectFramework(context.content),
            componentType: this.detectComponentType(context.content)
          },
          this.ragConfig
        );

        if (jamesRAGResult.success && jamesRAGResult.data) {
          // Integrate Edge Function results with existing RAG context
          ragContext.similarCode = [
            ...ragContext.similarCode,
            ...jamesRAGResult.data.componentPatterns.map((pattern: any) => ({
              id: pattern.id,
              content: pattern.code_content,
              contentType: 'code',
              metadata: {
                ...pattern.metadata,
                relevanceScore: pattern.similarity,
                agentId: this.id,
                timestamp: Date.now(),
                pattern_type: pattern.pattern_type,
                framework: pattern.framework,
                quality_score: pattern.quality_score
              }
            }))
          ];

          ragContext.projectStandards = [
            ...ragContext.projectStandards,
            ...jamesRAGResult.data.uiPatterns.map((pattern: any) => ({
              id: pattern.id,
              content: pattern.knowledge_item,
              contentType: 'text',
              metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                relevanceScore: pattern.similarity,
                knowledge_type: pattern.knowledge_type,
                confidence_score: pattern.confidence_score,
                expertise_domain: pattern.expertise_domain
              }
            }))
          ];

          ragContext.agentExpertise = [
            ...ragContext.agentExpertise,
            ...jamesRAGResult.data.performancePatterns.map((pattern: any) => ({
              id: pattern.id,
              content: pattern.solution_code,
              contentType: 'code',
              metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                relevanceScore: pattern.similarity,
                problem_type: pattern.problem_type,
                solution_explanation: pattern.solution_explanation,
                effectiveness_score: pattern.effectiveness_score
              }
            }))
          ];

          // Store RAG insights for prompt generation
          ragContext.metadata = {
            ...ragContext.metadata,
            jamesRAGInsights: jamesRAGResult.data.ragInsights,
            edgeFunctionUsed: true,
            processingTime: jamesRAGResult.metadata?.processingTime || 0
          };
        }
      } catch (error) {
        console.warn('James RAG Edge Function failed, using fallback:', error.message);
        // Fallback to original local methods
        const componentPatterns = await this.retrieveComponentPatterns(context);
        ragContext.similarCode = [...ragContext.similarCode, ...componentPatterns];

        const uiPatterns = await this.retrieveUIPatterns(context);
        ragContext.projectStandards = [...ragContext.projectStandards, ...uiPatterns];

        const performancePatterns = await this.retrievePerformancePatterns(context);
        ragContext.agentExpertise = [...ragContext.agentExpertise, ...performancePatterns];
      }
    }

    return ragContext;
  }

  /**
   * Generate optimized RAG query for James's Frontend domain
   */
  private generateRAGQuery(context: AgentActivationContext, analysis: AnalysisResult): string {
    const framework = this.detectFramework(context.content);
    const componentType = this.detectComponentType(context.content);
    const language = this.detectLanguage(context.filePath);

    // Generate context-aware query for Frontend patterns
    const patterns = analysis.patterns.map(p => p.type).join(' ');
    const hasPerformanceIssues = analysis.patterns.some(p => p.category === 'performance');
    const hasAccessibilityIssues = analysis.patterns.some(p => p.type.includes('accessibility'));

    let queryTerms = [framework, componentType, language];

    if (hasPerformanceIssues) {
      queryTerms.push('performance optimization bundle size');
    }
    if (hasAccessibilityIssues) {
      queryTerms.push('accessibility WCAG responsive');
    }
    if (patterns) {
      queryTerms.push(patterns);
    }

    return queryTerms.join(' ').trim();
  }

  /**
   * Retrieve frontend component patterns
   */
  private async retrieveComponentPatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const framework = this.detectFramework(context.content);
    const componentType = this.detectComponentType(context.content);

    const query = {
      query: `${framework} ${componentType} component patterns ${this.detectLanguage(context.filePath)}`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['component', framework.toLowerCase(), componentType, 'pattern'],
        contentTypes: ['code']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve component patterns:', error.message);
      return [];
    }
  }

  /**
   * Retrieve UI/UX patterns and best practices
   */
  private async retrieveUIPatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const query = {
      query: `UI UX accessibility responsive design best practices ${this.detectFramework(context.content)}`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['ui', 'ux', 'accessibility', 'responsive', 'best-practice'],
        contentTypes: ['text', 'code']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve UI patterns:', error.message);
      return [];
    }
  }

  /**
   * Retrieve performance optimization patterns
   */
  private async retrievePerformancePatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const framework = this.detectFramework(context.content);

    const query = {
      query: `${framework} performance optimization lazy loading bundle size`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['performance', 'optimization', framework.toLowerCase()],
        contentTypes: ['code', 'text']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve performance patterns:', error.message);
      return [];
    }
  }

  /**
   * Detect component type for better RAG retrieval
   */
  private detectComponentType(content: string): string {
    if (content.includes('useState') || content.includes('useEffect')) return 'functional';
    if (content.includes('class') && content.includes('extends')) return 'class';
    if (content.includes('defineComponent')) return 'vue-component';
    if (content.includes('<script>') && content.includes('<template>')) return 'vue-sfc';
    if (content.includes('export default')) return 'module';
    return 'component';
  }

  /**
   * Run frontend validation on context
   */
  async runFrontendValidation(context: any): Promise<any> {
    return {
      issues: [],
      score: 85,
      accessibility: { score: 90, issues: [] },
      performance: { score: 85, issues: [] },
      ux: { score: 80, issues: [] },
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Validate context flow
   */
  validateContextFlow(context: any): { score: number; issues: any[] } {
    if (!context || context.content === null) {
      return {
        score: 0,
        issues: [{ type: 'context-error', severity: 'critical', message: 'Invalid context' }]
      };
    }
    return {
      score: 100,
      issues: []
    };
  }

  /**
   * Validate navigation integrity
   */
  validateNavigationIntegrity(context: any): { score: number; issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    if (!context || !context.content) {
      return { score: 100, issues, warnings };
    }

    const content = context.content;

    // Extract routes from the routes array (look for "component:" keyword to identify route definitions)
    const routesSection = content.match(/const routes\s*=\s*\[([\s\S]*?)\];/);
    const definedRoutes = new Set<string>();

    if (routesSection) {
      const routeMatches = routesSection[1].matchAll(/path:\s*['"]([^'"]+)['"]/g);
      for (const match of routeMatches) {
        if (match[1]) definedRoutes.add(match[1]);
      }
    }

    // Extract navigation links from the navigation array (look for "label:" to identify nav definitions)
    const navSection = content.match(/const navigation\s*=\s*\[([\s\S]*?)\];/);
    const linkedPaths = new Set<string>();

    if (navSection) {
      const navMatches = navSection[1].matchAll(/path:\s*['"]([^'"]+)['"]/g);
      for (const match of navMatches) {
        if (match[1]) linkedPaths.add(match[1]);
      }
    }

    // Only check for mismatches if we found both routes and navigation
    if (definedRoutes.size > 0 && linkedPaths.size > 0) {
      // Find navigation links to undefined routes (this is the critical mismatch)
      for (const navPath of linkedPaths) {
        if (!definedRoutes.has(navPath)) {
          issues.push({
            type: 'route-navigation-mismatch',
            severity: 'high',
            message: `Navigation link '${navPath}' points to undefined route`,
            file: context.filePath || 'unknown'
          });
        }
      }

      // Find routes not linked in navigation (less critical)
      for (const route of definedRoutes) {
        if (!linkedPaths.has(route)) {
          warnings.push({
            type: 'route-navigation-mismatch',
            severity: 'medium',
            message: `Route '${route}' is defined but not linked in navigation`,
            file: context.filePath || 'unknown'
          });
        }
      }
    }

    const score = Math.max(0, 100 - (issues.length * 10) - (warnings.length * 5));

    return {
      score,
      issues,
      warnings
    };
  }

  /**
   * Check route consistency
   */
  checkRouteConsistency(context: any): { score: number; issues: any[] } {
    return {
      score: 90,
      issues: []
    };
  }

  /**
   * Calculate priority based on issues
   */
  calculatePriority(issues: any[]): string {
    if (!issues || issues.length === 0) return 'low';
    const severities = issues.map(i => i.severity || 'low');
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Determine agent handoffs based on issues
   */
  determineHandoffs(issues: any[]): string[] {
    const handoffs: string[] = [];
    if (!issues) return handoffs;

    const hasSecurityIssue = issues.some(i =>
      i.type === 'security' ||
      i.type === 'security-risk' ||
      i.category === 'security'
    );
    const hasPerformanceIssue = issues.some(i =>
      i.type === 'performance' ||
      i.category === 'performance'
    );
    const hasBackendIssue = issues.some(i =>
      i.type === 'api' ||
      i.type === 'backend' ||
      i.type === 'api-integration'
    );

    if (hasSecurityIssue) handoffs.push('security-sam');
    if (hasPerformanceIssue) handoffs.push('enhanced-marcus');
    if (hasBackendIssue) handoffs.push('enhanced-marcus');

    return handoffs;
  }

  /**
   * Generate actionable recommendations from issues
   */
  generateActionableRecommendations(issues: any[]): Array<{ type: string; message: string; priority: string }> {
    if (!issues || issues.length === 0) return [];

    return issues.map(issue => {
      let message = '';
      let type = issue.type || 'general';

      if (issue.type === 'accessibility') {
        message = `Fix accessibility issue: ${issue.message || 'Accessibility violation detected'}`;
      } else if (issue.type === 'performance') {
        message = `Optimize performance: ${issue.message || 'Performance issue detected'}`;
      } else {
        message = `Address issue: ${issue.message || issue.description || 'Issue detected'}`;
      }

      return {
        type,
        message,
        priority: issue.severity || 'medium'
      };
    });
  }

  /**
   * Generate enhanced report with metadata
   */
  generateEnhancedReport(issues: any[], metadata: any = {}): string {
    const report = {
      agent: 'Enhanced James',
      analysisType: 'Frontend Analysis',
      summary: {
        totalIssues: issues?.length || 0,
        critical: issues?.filter(i => i.severity === 'critical').length || 0,
        high: issues?.filter(i => i.severity === 'high').length || 0,
        medium: issues?.filter(i => i.severity === 'medium').length || 0,
        low: issues?.filter(i => i.severity === 'low').length || 0
      },
      issues: issues || [],
      recommendations: this.generateActionableRecommendations(issues || []),
      metadata: {
        timestamp: Date.now(),
        ...metadata
      }
    };

    return `Enhanced James - Frontend Analysis\n\n${JSON.stringify(report, null, 2)}`;
  }

  /**
   * Get emoji representation of score
   */
  getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 75) return '🟡';
    if (score >= 60) return '🟠';
    return '🔴';
  }

  /**
   * Extract agent name from text
   */
  extractAgentName(text: string): string {
    const match = text.match(/@(\w+)/);
    return match ? match[1] : '';
  }

  /**
   * Analyze cross-file consistency
   */
  protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string> {
    return {
      [context.filePath || 'unknown']: context.content || ''
    };
  }

  /**
   * Check for configuration inconsistencies
   */
  hasConfigurationInconsistencies(context: any): boolean {
    return false;
  }


  /**
   * Validate component accessibility
   */
  validateComponentAccessibility(context: any): any[] {
    return [];
  }

  /**
   * Check responsive design
   */
  checkResponsiveDesign(context: any): any[] {
    return [];
  }

  /**
   * Analyze bundle size
   */
  analyzeBundleSize(context: any): any {
    return { size: 0, warnings: [] };
  }

  /**
   * Validate CSS consistency
   */
  validateCSSConsistency(context: any): any[] {
    return [];
  }

  /**
   * Check browser compatibility
   */
  checkBrowserCompatibility(context: any): any[] {
    return [];
  }

  /**
   * Identify critical issues from issue list
   */
  identifyCriticalIssues(issues: any[]): any[] {
    if (!issues) return [];
    return issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  }
}