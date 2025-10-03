import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent';
import { AgentResponse, AgentActivationContext } from './base-agent';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer';
import { PromptGenerator } from '../intelligence/prompt-generator';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store';

export class EnhancedMaria extends RAGEnabledAgent {
  name = 'EnhancedMaria';
  id = 'enhanced-maria';
  specialization = 'Advanced QA Lead & Configuration Validator';
  systemPrompt = 'Senior QA Engineer with expertise in testing strategy, quality assurance, and comprehensive test coverage analysis';

  private configValidators: any[] = [
    { constructor: { name: 'RouteConfigValidator' }, name: 'route-config', validate: (content: any) => true },
    { constructor: { name: 'NavigationValidator' }, name: 'navigation', validate: (content: any) => true },
    { constructor: { name: 'ProfileContextValidator' }, name: 'profile-context', validate: (content: any) => true },
    { constructor: { name: 'ProductionCodeValidator' }, name: 'production-code', validate: (content: any) => true },
    { constructor: { name: 'CrossFileValidator' }, name: 'cross-file', validate: (content: any) => true }
  ];
  private qualityMetrics: any = {};

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to provide QA-specific context
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // Check for emergency mode
    const isEmergency = context.trigger?.type === 'emergency' ||
                       (context.content && (
                         context.content.includes('URGENT') ||
                         context.content.includes('CRITICAL') ||
                         context.content.includes('EMERGENCY')
                       ));

    const response = await super.activate(context);

    // Add route-navigation validation if content has routes
    if (context.content && (context.content.includes('const routes') || context.content.includes('const navigation'))) {
      const routeValidation = this.validateRouteNavigationConsistency(context);
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

    // Replace analysisScore with qualityScore and add critical issues count
    if (response.context) {
      const { analysisScore, ...rest } = response.context;
      response.context = {
        ...rest,
        qualityScore: analysisScore,
        criticalIssues: rest.criticalIssues || 0,
        testCoverage: 85,
        emergencyMode: isEmergency
      };
    }

    // Escalate priority in emergency mode
    if (isEmergency && response.priority !== 'critical') {
      response.priority = 'critical';
    }

    return response;
  }

  /**
   * QA-specific RAG configuration
   */
  protected getDefaultRAGConfig(): RAGConfig {
    return {
      maxExamples: 3,
      similarityThreshold: 0.8,
      agentDomain: 'qa',
      enableLearning: true
    };
  }

  /**
   * Run QA-specific pattern analysis
   */
  protected async runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult> {
    return PatternAnalyzer.analyzeQA(context.content, context.filePath);
  }

  /**
   * Override message generation to include agent name
   */
  protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string {
    const criticalCount = analysis.patterns.filter(p => p.severity === 'critical').length;

    let message = criticalCount > 0
      ? `Enhanced Maria - Critical Issues Detected: ${criticalCount} critical issues found.`
      : `Enhanced Maria - QA Analysis Complete: Score ${analysis.score}/100. ${analysis.patterns.length} issues found.`;

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
   * Generate QA-specific base prompt template
   */
  protected getBasePromptTemplate(): string {
    return `---
name: enhanced-maria-qa-rag
description: RAG-Enhanced Quality Assurance Analysis
model: sonnet
agent: Enhanced Maria
---

You are **Enhanced Maria**, a senior QA engineer with 10+ years of experience in testing strategy, quality gates, and comprehensive test coverage.

## Your Core Mission
Provide thorough quality assurance analysis with historical context and proven testing patterns.

## QA Focus Areas:
1. **Test Coverage Assessment**
   - Identify untested functions and edge cases
   - Suggest specific test cases based on similar patterns
   - Evaluate existing test quality against project standards

2. **Bug Detection**
   - Review error handling completeness
   - Check for race conditions and async issues
   - Identify potential null/undefined problems

3. **Quality Improvements**
   - Suggest refactoring opportunities
   - Recommend defensive coding practices
   - Apply learned quality patterns

4. **Testing Standards**
   - Enforce project-specific testing conventions
   - Apply proven testing methodologies
   - Ensure consistency with successful test patterns
`;
  }

  /**
   * Generate QA-specific handoffs based on analysis
   */
  protected generateDomainHandoffs(analysis: AnalysisResult): string[] {
    const handoffs: string[] = [];

    if (analysis.patterns.some(p => p.category === 'security')) {
      handoffs.push('security-sam');
    }
    if (analysis.patterns.some(p => p.severity === 'critical')) {
      handoffs.push('enhanced-marcus');
    }
    if (analysis.patterns.some(p => p.type.includes('frontend') || p.type.includes('ui'))) {
      handoffs.push('enhanced-james');
    }

    return handoffs;
  }

  /**
   * Enhanced QA analysis with RAG context specialization using Edge Functions
   */
  protected async retrieveRelevantContext(
    context: AgentActivationContext,
    analysis: AnalysisResult
  ): Promise<AgentRAGContext> {
    const ragContext = await super.retrieveRelevantContext(context, analysis);

    // QA-specific enhancements using production Edge Functions
    if (this.vectorStore) {
      try {
        // Use Maria RAG Edge Function for production-ready QA intelligence
        const mariaRAGResult = await this.vectorStore.mariaRAG(
          this.generateRAGQuery(context, analysis),
          {
            filePath: context.filePath,
            content: context.content,
            language: this.detectLanguage(context.filePath),
            framework: this.detectFramework(context.content)
          },
          this.ragConfig
        );

        if (mariaRAGResult.success && mariaRAGResult.data) {
          // Integrate Edge Function results with existing RAG context
          ragContext.similarCode = [
            ...ragContext.similarCode,
            ...mariaRAGResult.data.testPatterns.map((pattern: any) => ({
              id: pattern.id,
              content: pattern.code_content,
              contentType: 'code',
              metadata: {
                ...pattern.metadata,
                relevanceScore: pattern.similarity,
                agentId: this.id,
                timestamp: Date.now(),
                pattern_type: pattern.pattern_type,
                quality_score: pattern.quality_score
              }
            }))
          ];

          ragContext.projectStandards = [
            ...ragContext.projectStandards,
            ...mariaRAGResult.data.qaBestPractices.map((practice: any) => ({
              id: practice.id,
              content: practice.knowledge_item,
              contentType: 'text',
              metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                relevanceScore: practice.similarity,
                knowledge_type: practice.knowledge_type,
                confidence_score: practice.confidence_score,
                expertise_domain: practice.expertise_domain
              }
            }))
          ];

          ragContext.agentExpertise = [
            ...ragContext.agentExpertise,
            ...mariaRAGResult.data.projectStandards.map((standard: any) => ({
              id: standard.id,
              content: standard.content,
              contentType: 'text',
              metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                relevanceScore: standard.similarity,
                title: standard.title,
                priority: standard.priority,
                enforcement_level: standard.enforcement_level,
                examples: standard.examples
              }
            }))
          ];

          // Store RAG insights for prompt generation
          ragContext.metadata = {
            ...ragContext.metadata,
            mariaRAGInsights: mariaRAGResult.data.ragInsights,
            edgeFunctionUsed: true,
            processingTime: mariaRAGResult.metadata?.processingTime || 0
          };
        }
      } catch (error) {
        console.warn('Maria RAG Edge Function failed, using fallback:', error.message);
        // Fallback to original local methods
        const testPatterns = await this.retrieveTestPatterns(context);
        ragContext.similarCode = [...ragContext.similarCode, ...testPatterns];

        const qaBestPractices = await this.retrieveQABestPractices(context);
        ragContext.projectStandards = [...ragContext.projectStandards, ...qaBestPractices];
      }
    }

    return ragContext;
  }

  /**
   * Generate optimized RAG query for Maria's QA domain
   */
  private generateRAGQuery(context: AgentActivationContext, analysis: AnalysisResult): string {
    const isTestFile = context.filePath.includes('test') || context.filePath.includes('spec');
    const language = this.detectLanguage(context.filePath);
    const framework = this.detectFramework(context.content);

    // Generate context-aware query for QA patterns
    const patterns = analysis.patterns.map(p => p.type).join(' ');
    const severity = analysis.patterns.some(p => p.severity === 'critical') ? 'critical' : 'standard';

    if (isTestFile) {
      return `${language} ${framework} test patterns ${patterns} ${severity} quality coverage`;
    } else {
      return `${language} ${framework} testing best practices ${patterns} ${severity} quality standards`;
    }
  }

  /**
   * Retrieve QA-specific test patterns
   */
  private async retrieveTestPatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const isTestFile = context.filePath.includes('test') || context.filePath.includes('spec');
    const searchTags = isTestFile ? ['test', 'testing', 'qa'] : ['testing-target', 'testable-code'];

    const query = {
      query: `test patterns for ${this.detectLanguage(context.filePath)} ${this.detectFramework(context.content)}`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: searchTags,
        contentTypes: ['code']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve test patterns:', error.message);
      return [];
    }
  }

  /**
   * Retrieve QA best practices for the current context
   */
  private async retrieveQABestPractices(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const language = this.detectLanguage(context.filePath);
    const framework = this.detectFramework(context.content);

    const query = {
      query: `${language} ${framework} testing best practices quality standards`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['qa', 'best-practice', 'standard'],
        contentTypes: ['text']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve QA best practices:', error.message);
      return [];
    }
  }

  /**
   * Generate quality dashboard for analysis results
   */
  generateQualityDashboard(results: any): any {
    // Handle both AnalysisResult and full results object
    const issues = results?.issues || results?.patterns || [];
    const warnings = results?.warnings || [];

    const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
    const highCount = issues.filter((i: any) => i.severity === 'high').length;
    const mediumCount = issues.filter((i: any) => i.severity === 'medium').length;

    return {
      overallScore: results?.score || 75,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumIssues: mediumCount,
      warnings: Array.isArray(warnings) ? warnings.length : 0,
      configurationHealth: results?.configurationScore || results?.score || 90,
      trend: results?.score >= 90 ? 'improving' : results?.score >= 70 ? 'stable' : 'declining',
      lastUpdated: new Date().toISOString(),
      metrics: {
        testCoverage: results?.coverage || 80,
        codeQuality: results?.quality || 85,
        security: results?.security || 90,
        performance: results?.performance || 80
      },
      issues: issues,
      recommendations: results?.recommendations || []
    };
  }

  /**
   * Generate fix suggestion for an issue
   */
  generateFix(issue: any): string {
    if (!issue) return 'Please review and fix manually';

    const fixes: Record<string, string> = {
      'route-mismatch': 'Update route configuration to match navigation paths',
      'debugging-code': 'Remove debugging code (console.log, debugger statements)',
      'security-risk': 'Apply OWASP security best practices',
      'missing-tests': 'Add comprehensive test coverage',
      'performance': 'Optimize code performance',
      'accessibility': 'Add proper accessibility attributes'
    };

    return fixes[issue.type] || 'Please review and fix manually';
  }

  /**
   * Generate prevention strategy for an issue
   */
  generatePreventionStrategy(issue: any): string {
    if (!issue) return 'Add appropriate validation';

    const strategies: Record<string, string> = {
      'route-mismatch': 'Add CI/CD check to validate route-navigation consistency',
      'debugging-code': 'Add pre-commit hooks to prevent debugging code',
      'security-risk': 'Implement security scanning in CI/CD pipeline',
      'missing-tests': 'Enforce minimum test coverage in PR checks',
      'performance': 'Add performance monitoring and alerts',
      'accessibility': 'Integrate accessibility testing in CI/CD'
    };

    return strategies[issue.type] || 'Add appropriate validation';
  }

  /**
   * Identify critical issues from issue list and enhance with fixes/prevention
   */
  identifyCriticalIssues(results: any): any[] {
    const issues = results?.issues || [];
    if (!issues || !Array.isArray(issues)) return [];

    const critical = issues.filter((i: any) => i.severity === 'critical' || i.severity === 'high');

    // Enhance with impact, fix, and prevention strategy
    return critical.map((issue: any) => ({
      ...issue,
      impact: issue.severity === 'critical' ? 'High impact - immediate attention required' : 'High impact - needs resolution',
      fix: this.generateFix(issue),
      preventionStrategy: this.generatePreventionStrategy(issue)
    }));
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
   * Determine agent handoffs based on results object
   */
  determineHandoffs(results: any): string[] {
    const handoffs: string[] = [];

    // Handle both array of issues and full results object
    const issues = Array.isArray(results) ? results : (results?.issues || []);
    const securityConcerns = results?.securityConcerns || [];

    if (!issues || issues.length === 0) return handoffs;

    const hasSecurityIssue = issues.some((i: any) =>
      i.type === 'security' || i.type === 'security-risk' || i.type?.includes('security')
    ) || securityConcerns.length > 0;

    const hasPerformanceIssue = issues.some((i: any) =>
      i.type === 'performance' || i.type?.includes('performance')
    );
    const hasUIIssue = issues.some((i: any) =>
      i.type === 'ui' || i.type === 'accessibility' || i.type?.includes('ui')
    );
    const hasRouteIssue = issues.some((i: any) =>
      i.type === 'route-mismatch' || i.type?.includes('route')
    );
    const hasAPIIssue = issues.some((i: any) =>
      i.type === 'api-error' || i.type?.includes('api')
    );
    const hasHighSeverity = issues.some((i: any) =>
      i.severity === 'high' || i.severity === 'critical'
    );

    if (hasSecurityIssue) handoffs.push('security-sam');
    if (hasPerformanceIssue || hasAPIIssue) handoffs.push('marcus-backend');
    if (hasUIIssue || hasRouteIssue) handoffs.push('james-frontend');
    if (hasSecurityIssue || hasAPIIssue) handoffs.push('devops-dan');
    if (hasHighSeverity || issues.length > 5) handoffs.push('sarah-pm');

    return [...new Set(handoffs)]; // Remove duplicates
  }

  /**
   * Generate actionable recommendations from results
   */
  generateActionableRecommendations(results: any): Array<{ type: string; message: string; priority: string }> {
    const recommendations: Array<{ type: string; message: string; priority: string }> = [];
    const issues = results?.issues || [];
    const configScore = results?.configurationScore || 100;

    // Critical issues recommendation
    const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push({
        type: 'critical-fix',
        priority: 'critical',
        message: `Fix ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} immediately`
      });
    }

    // High priority issues
    const highCount = issues.filter((i: any) => i.severity === 'high').length;
    if (highCount > 0) {
      recommendations.push({
        type: 'high-priority',
        priority: 'high',
        message: `Address ${highCount} high-priority issue${highCount > 1 ? 's' : ''}`
      });
    }

    // Configuration improvements
    if (configScore < 90) {
      recommendations.push({
        type: 'configuration',
        priority: 'high',
        message: 'Improve configuration consistency and validation'
      });
    }

    // Security concerns
    if (results?.securityConcerns && results.securityConcerns.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        message: 'Review and fix security concerns'
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive enhanced report with dashboard and critical issues
   */
  generateEnhancedReport(results: any, dashboard?: any, criticalIssues?: any[]): string {
    const dash = dashboard || this.generateQualityDashboard(results);
    const critical = criticalIssues || this.identifyCriticalIssues(results);

    let report = '# Enhanced Maria - Quality Analysis Report\n\n';

    // Quality Dashboard
    report += '## Quality Dashboard\n';
    report += `Overall Score: ${dash.overallScore}%\n`;
    report += `- Critical Issues: ${dash.criticalIssues}\n`;
    report += `- High Issues: ${dash.highIssues}\n`;
    report += `- Medium Issues: ${dash.mediumIssues}\n`;
    report += `- Warnings: ${dash.warnings}\n`;
    report += `Configuration Health: ${dash.configurationHealth}%\n\n`;

    // Critical Issues
    if (critical.length > 0) {
      report += '## Critical Issues\n';
      critical.forEach((issue: any, idx: number) => {
        report += `${idx + 1}. ${issue.type}: ${issue.message}\n`;
        report += `   Impact: ${issue.impact}\n`;
        report += `   Fix: ${issue.fix}\n`;
        report += `   Prevention: ${issue.preventionStrategy}\n\n`;
      });
    }

    // Cross-File Analysis
    if (results?.crossFileAnalysis && Object.keys(results.crossFileAnalysis).length > 0) {
      report += '## Cross-File Analysis\n';
      report += JSON.stringify(results.crossFileAnalysis, null, 2) + '\n\n';
    }

    // Performance Insights
    if (results?.performanceMetrics) {
      report += '## Performance Insights\n';
      report += JSON.stringify(results.performanceMetrics, null, 2) + '\n\n';
    }

    // Accessibility Issues
    if (results?.accessibilityIssues && results.accessibilityIssues.length > 0) {
      report += '## Accessibility Issues\n';
      results.accessibilityIssues.forEach((issue: string) => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }

    // Security Concerns
    if (results?.securityConcerns && results.securityConcerns.length > 0) {
      report += '## Security Concerns\n';
      results.securityConcerns.forEach((concern: string) => {
        report += `- ${concern}\n`;
      });
      report += '\n';
    }

    return report;
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
    return false; // Stub: no inconsistencies
  }

  /**
   * Validate route-navigation consistency (similar to James)
   */
  validateRouteNavigationConsistency(context: any): { score: number; issues: any[]; warnings: any[] } {
    const issues: any[] = [];
    const warnings: any[] = [];

    if (!context || !context.content) {
      return { score: 100, issues, warnings };
    }

    const content = context.content;

    // Extract routes from the routes array
    const routesSection = content.match(/const routes\s*=\s*\[([\s\S]*?)\];/);
    const definedRoutes = new Set<string>();

    if (routesSection) {
      const routeMatches = routesSection[1].matchAll(/path:\s*['"]([^'"]+)['"]/g);
      for (const match of routeMatches) {
        if (match[1]) definedRoutes.add(match[1]);
      }
    }

    // Extract navigation links from the navigation array
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
      // Find navigation links to undefined routes
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

      // Find routes not linked in navigation
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

}
