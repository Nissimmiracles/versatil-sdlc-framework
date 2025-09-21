import { BaseAgent, AgentActivationContext, AgentResponse, ValidationResults } from './base-agent';
import { agentIntelligence } from '../intelligence/agent-intelligence';

/**
 * Enhanced James - Advanced Frontend Specialist with Route-Navigation Validation
 *
 * Enhanced capabilities based on Enhanced Maria analysis:
 * - Route-navigation consistency validation
 * - Cross-component dependency checking
 * - Context flow validation
 * - Profile context navigation integrity
 * - Component-route mapping verification
 */
export class EnhancedJames extends BaseAgent {
  constructor() {
    super('enhanced-james', 'Advanced Frontend Specialist & Navigation Validator');
  }

  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    return this.runFrontendValidation(context);
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    console.log('🎨 Enhanced James activated for advanced frontend analysis...');

    // Enhanced validation checks
    const validationResults = await this.runFrontendValidation(context);
    const navigationIntegrity = await this.validateNavigationIntegrity(context);
    const routeConsistency = await this.checkRouteConsistency(context);
    const contextFlow = await this.validateContextFlow(context);

    const issues = [
      ...validationResults.issues,
      ...navigationIntegrity.issues,
      ...routeConsistency.issues,
      ...contextFlow.issues
    ];

    return {
      agentId: 'enhanced-james',
      message: this.generateEnhancedReport(issues, validationResults),
      suggestions: this.generateActionableRecommendations(issues),
      priority: this.calculatePriority(issues),
      handoffTo: this.determineHandoffs(issues),
      context: {
        frontendHealth: validationResults.score,
        navigationIntegrity: navigationIntegrity.score,
        routeConsistency: routeConsistency.score,
        contextFlowHealth: contextFlow.score
      }
    };
  }

  private async runFrontendValidation(context: AgentActivationContext) {
    const issues = [];
    const warnings = [];
    let score = 100;

    if (!context.content) {
      return { issues, warnings, score };
    }

    // Check for debugging code in components
    if (this.hasDebuggingCode(context.content)) {
      issues.push({
        type: 'debugging-code-frontend',
        severity: 'critical',
        message: 'Debugging code detected in production frontend components',
        file: context.filePath || 'unknown',
        fix: 'Remove debugging styles, console.logs, and test markers'
      });
      score -= 25;
    }

    // Check for hardcoded styles that indicate debugging
    if (this.hasHardcodedDebugStyles(context.content)) {
      issues.push({
        type: 'hardcoded-debug-styles',
        severity: 'high',
        message: 'Hardcoded debug styles detected (purple colors, test markers)',
        file: context.filePath || 'unknown',
        fix: 'Replace hardcoded styles with proper CSS classes or theme variables'
      });
      score -= 15;
    }

    // Check for missing accessibility attributes
    if (this.hasMissingAccessibility(context.content)) {
      issues.push({
        type: 'accessibility-missing',
        severity: 'medium',
        message: 'Missing accessibility attributes in components',
        file: context.filePath || 'unknown',
        fix: 'Add proper aria-labels, alt texts, and keyboard navigation'
      });
      score -= 10;
    }

    return { issues, warnings, score };
  }

  private async validateNavigationIntegrity(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content) {
      return { issues, score };
    }

    // Check for navigation-route mismatches
    const navMismatches = this.detectNavigationMismatches(context.content);
    issues.push(...navMismatches);
    score -= navMismatches.length * 15;

    // Check for missing navigation guards
    if (this.hasMissingNavigationGuards(context.content)) {
      issues.push({
        type: 'navigation-guards-missing',
        severity: 'medium',
        message: 'Missing navigation guards for protected routes',
        file: context.filePath || 'unknown',
        fix: 'Implement proper route protection and user authentication checks'
      });
      score -= 10;
    }

    return { issues, score };
  }

  private async checkRouteConsistency(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content || !context.filePath) {
      return { issues, score };
    }

    // Check for route definition inconsistencies
    if (this.hasRouteInconsistencies(context.content)) {
      issues.push({
        type: 'route-definition-inconsistency',
        severity: 'high',
        message: 'Route definitions do not match navigation configuration',
        file: context.filePath,
        fix: 'Synchronize route paths with navigation menu items'
      });
      score -= 20;
    }

    // Check for missing route components
    const missingComponents = this.detectMissingRouteComponents(context.content);
    issues.push(...missingComponents);
    score -= missingComponents.length * 10;

    return { issues, score };
  }

  private async validateContextFlow(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content) {
      return { issues, score };
    }

    // Check for profile context consistency
    if (this.hasProfileContextIssues(context.content)) {
      issues.push({
        type: 'profile-context-inconsistency',
        severity: 'high',
        message: 'Profile context state inconsistent with navigation flow',
        file: context.filePath || 'unknown',
        fix: 'Ensure profile context properly validates navigation permissions'
      });
      score -= 15;
    }

    // Check for state management issues
    if (this.hasStateManagementIssues(context.content)) {
      issues.push({
        type: 'state-management-issues',
        severity: 'medium',
        message: 'State management inconsistencies detected',
        file: context.filePath || 'unknown',
        fix: 'Implement consistent state management patterns across components'
      });
      score -= 10;
    }

    return { issues, score };
  }

  // Detection methods
  private hasDebuggingCode(content: string): boolean {
    const debugPatterns = [
      /console\.log/,
      /debugger;/,
      /\bTODO\b.*test/i,
      /style.*color.*purple.*Route Test/,
      /🧠.*Route Test/,
      /\btest\b.*\bmenu\b/i
    ];

    return debugPatterns.some(pattern => pattern.test(content));
  }

  private hasHardcodedDebugStyles(content: string): boolean {
    const debugStylePatterns = [
      /style.*\{\{.*color.*['"`]purple['"`]/,
      /backgroundColor.*['"`]#.*debug/i,
      /border.*['"`].*debug/i,
      /style.*\{\{.*border.*['"`]red['"`]/
    ];

    return debugStylePatterns.some(pattern => pattern.test(content));
  }

  private hasMissingAccessibility(content: string): boolean {
    // Check for interactive elements without accessibility
    const hasButtons = /<button/i.test(content);
    const hasInputs = /<input/i.test(content);
    const hasLinks = /<a\s+/i.test(content);

    const hasAriaLabels = /aria-label/i.test(content);
    const hasAltText = /alt=/i.test(content);

    return (hasButtons || hasInputs || hasLinks) && !hasAriaLabels && !hasAltText;
  }

  private detectNavigationMismatches(content: string) {
    const issues = [];

    // Look for route paths that don't match expected patterns
    const routeMatches = content.match(/<Route\s+path=["']([^"']+)["']/g);
    if (routeMatches) {
      routeMatches.forEach(match => {
        const pathMatch = match.match(/path=["']([^"']+)["']/);
        if (pathMatch) {
          const path = pathMatch[1];

          // Check for inconsistent naming patterns
          if (path.includes('brain') && !this.hasMatchingNavItem(content, path)) {
            issues.push({
              type: 'navigation-route-mismatch',
              severity: 'high',
              message: `Route ${path} may not have corresponding navigation item`,
              file: 'Route configuration',
              fix: `Ensure navigation menu includes item for ${path}`
            });
          }
        }
      });
    }

    return issues;
  }

  private hasMatchingNavItem(content: string, routePath: string): boolean {
    // This would check against actual navigation configuration
    // For now, simple pattern matching
    const navPatterns = [
      new RegExp(routePath.replace('/', ''), 'i'),
      new RegExp(routePath.replace('-', ''), 'i')
    ];

    return navPatterns.some(pattern => pattern.test(content));
  }

  private hasMissingNavigationGuards(content: string): boolean {
    const hasProtectedRoutes = /private|protected|auth/i.test(content);
    const hasGuards = /canActivate|guard|protect/i.test(content);

    return hasProtectedRoutes && !hasGuards;
  }

  private hasRouteInconsistencies(content: string): boolean {
    // Check for route definitions that seem inconsistent
    const routePaths = content.match(/path=["']([^"']+)["']/g);
    if (!routePaths || routePaths.length === 0) return false;

    // Look for inconsistent naming patterns
    const paths = routePaths.map(match => {
      const pathMatch = match.match(/path=["']([^"']+)["']/);
      return pathMatch ? pathMatch[1] : '';
    }).filter(path => path.length > 0);

    // Check for mixed naming conventions
    const hasKebabCase = paths.some(path => path.includes('-'));
    const hasCamelCase = paths.some(path => /[A-Z]/.test(path));

    return hasKebabCase && hasCamelCase;
  }

  private detectMissingRouteComponents(content: string) {
    const issues = [];

    // Look for routes without proper component references
    const routeMatches = content.match(/<Route[^>]+>/g);
    if (routeMatches) {
      routeMatches.forEach(route => {
        if (!route.includes('element=') && !route.includes('component=')) {
          issues.push({
            type: 'missing-route-component',
            severity: 'critical',
            message: 'Route defined without component or element',
            file: 'Route configuration',
            fix: 'Add proper component or element to route definition'
          });
        }
      });
    }

    return issues;
  }

  private hasProfileContextIssues(content: string): boolean {
    const hasProfileLogic = /profile|user.*context|auth.*context/i.test(content);
    const hasNavigation = /navigate|router|redirect/i.test(content);
    const hasContextValidation = /context.*valid|validate.*context/i.test(content);

    return hasProfileLogic && hasNavigation && !hasContextValidation;
  }

  private hasStateManagementIssues(content: string): boolean {
    const hasMultipleStateApproaches = [
      /useState/,
      /useReducer/,
      /redux/i,
      /zustand/i,
      /recoil/i
    ].filter(pattern => pattern.test(content)).length > 1;

    return hasMultipleStateApproaches;
  }

  private generateEnhancedReport(issues: any[], validationResults: any): string {
    let report = `🎨 **Enhanced James - Advanced Frontend Analysis Report**\n\n`;

    report += `📊 **Frontend Health Dashboard**\n`;
    report += `Overall Score: ${validationResults.score}% ${this.getScoreEmoji(validationResults.score)}\n`;
    report += `Critical Issues: ${issues.filter(i => i.severity === 'critical').length} 🚨\n`;
    report += `High Priority: ${issues.filter(i => i.severity === 'high').length} ⚠️\n`;
    report += `Medium Priority: ${issues.filter(i => i.severity === 'medium').length} ⚡\n\n`;

    if (issues.length > 0) {
      report += `🔍 **Issues Detected**\n`;
      issues.forEach((issue, index) => {
        report += `${index + 1}. **${issue.type}** (${issue.severity})\n`;
        report += `   ❌ ${issue.message}\n`;
        report += `   💡 Fix: ${issue.fix}\n\n`;
      });
    }

    return report;
  }

  private generateActionableRecommendations(issues: any[]): any[] {
    const recommendations = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'critical-frontend-fix',
        priority: 'critical',
        message: `Fix ${criticalIssues.length} critical frontend issues immediately`,
        actions: criticalIssues.map(issue => issue.fix)
      });
    }

    const routeIssues = issues.filter(i => i.type.includes('route') || i.type.includes('navigation'));
    if (routeIssues.length > 0) {
      recommendations.push({
        type: 'navigation-consistency',
        priority: 'high',
        message: 'Improve route-navigation consistency',
        actions: [
          'Implement automated route-navigation validation',
          'Create navigation integrity tests',
          'Add route configuration schema validation'
        ]
      });
    }

    return recommendations;
  }


  private calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.filter(i => i.severity === 'high').length > 1) return 'high';
    if (issues.length > 0) return 'medium';
    return 'low';
  }

  private determineHandoffs(issues: any[]): string[] {
    const handoffs = [];

    if (issues.some(i => i.type.includes('route') || i.type.includes('backend'))) {
      handoffs.push('enhanced-marcus');
    }
    if (issues.some(i => i.type.includes('test') || i.severity === 'critical')) {
      handoffs.push('enhanced-maria');
    }
    if (issues.some(i => i.type.includes('security') || i.type.includes('auth'))) {
      handoffs.push('security-sam');
    }

    return handoffs;
  }
}

// Export singleton instance with intelligence wrapper
export const enhancedJames = agentIntelligence.wrapAgent(new EnhancedJames());
export default enhancedJames;