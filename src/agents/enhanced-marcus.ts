import { BaseAgent, AgentActivationContext, AgentResponse } from '../agent-dispatcher';

/**
 * Enhanced Marcus - Advanced Backend Specialist with API-Frontend Integration Validation
 *
 * Enhanced capabilities based on Enhanced Maria analysis:
 * - API-frontend integration validation
 * - Configuration drift detection
 * - Service consistency checking
 * - Cross-service dependency validation
 * - Backend-frontend contract verification
 */
export class EnhancedMarcus extends BaseAgent {
  constructor() {
    super('enhanced-marcus', 'Advanced Backend Specialist & Integration Validator');
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    console.log('🛠️ Enhanced Marcus activated for advanced backend analysis...');

    // Enhanced validation checks
    const backendValidation = await this.runBackendValidation(context);
    const integrationValidation = await this.validateAPIIntegration(context);
    const configConsistency = await this.checkConfigurationConsistency(context);
    const serviceValidation = await this.validateServiceConsistency(context);

    const issues = [
      ...backendValidation.issues,
      ...integrationValidation.issues,
      ...configConsistency.issues,
      ...serviceValidation.issues
    ];

    return {
      agentId: this.id,
      message: this.generateEnhancedReport(issues, backendValidation),
      suggestions: this.generateActionableRecommendations(issues),
      priority: this.calculatePriority(issues),
      handoffTo: this.determineHandoffs(issues),
      context: {
        backendHealth: backendValidation.score,
        integrationHealth: integrationValidation.score,
        configConsistency: configConsistency.score,
        serviceConsistency: serviceValidation.score
      }
    };
  }

  private async runBackendValidation(context: AgentActivationContext) {
    const issues = [];
    const warnings = [];
    let score = 100;

    if (!context.content) {
      return { issues, warnings, score };
    }

    // Check for hardcoded API endpoints
    if (this.hasHardcodedEndpoints(context.content)) {
      issues.push({
        type: 'hardcoded-endpoints',
        severity: 'high',
        message: 'Hardcoded API endpoints detected - should use environment configuration',
        file: context.filePath || 'unknown',
        fix: 'Move API endpoints to environment variables or configuration files'
      });
      score -= 15;
    }

    // Check for missing error handling
    if (this.hasMissingErrorHandling(context.content)) {
      issues.push({
        type: 'missing-error-handling',
        severity: 'medium',
        message: 'API calls missing proper error handling',
        file: context.filePath || 'unknown',
        fix: 'Add try-catch blocks and proper error response handling'
      });
      score -= 10;
    }

    // Check for insecure API patterns
    if (this.hasInsecureAPIPatterns(context.content)) {
      issues.push({
        type: 'insecure-api-patterns',
        severity: 'critical',
        message: 'Insecure API patterns detected (exposed secrets, unvalidated inputs)',
        file: context.filePath || 'unknown',
        fix: 'Implement proper input validation and secure credential management'
      });
      score -= 25;
    }

    // Check for missing authentication
    if (this.hasMissingAuthentication(context.content)) {
      issues.push({
        type: 'missing-authentication',
        severity: 'high',
        message: 'API endpoints missing authentication checks',
        file: context.filePath || 'unknown',
        fix: 'Add proper authentication middleware to protected endpoints'
      });
      score -= 20;
    }

    return { issues, warnings, score };
  }

  private async validateAPIIntegration(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content) {
      return { issues, score };
    }

    // Check for API contract mismatches
    const contractMismatches = this.detectAPIContractMismatches(context.content);
    issues.push(...contractMismatches);
    score -= contractMismatches.length * 15;

    // Check for missing API documentation
    if (this.hasMissingAPIDocumentation(context.content)) {
      issues.push({
        type: 'missing-api-documentation',
        severity: 'medium',
        message: 'API endpoints missing proper documentation or type definitions',
        file: context.filePath || 'unknown',
        fix: 'Add OpenAPI/Swagger documentation and TypeScript interfaces'
      });
      score -= 10;
    }

    // Check for inconsistent response formats
    if (this.hasInconsistentResponseFormats(context.content)) {
      issues.push({
        type: 'inconsistent-response-formats',
        severity: 'medium',
        message: 'API responses have inconsistent formats across endpoints',
        file: context.filePath || 'unknown',
        fix: 'Standardize API response format with consistent error and success structures'
      });
      score -= 10;
    }

    return { issues, score };
  }

  private async checkConfigurationConsistency(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content || !context.filePath) {
      return { issues, score };
    }

    // Check for configuration drift
    if (this.hasConfigurationDrift(context.content)) {
      issues.push({
        type: 'configuration-drift',
        severity: 'high',
        message: 'Configuration values inconsistent across environments or files',
        file: context.filePath,
        fix: 'Synchronize configuration values and implement configuration validation'
      });
      score -= 15;
    }

    // Check for missing environment variables
    const missingEnvVars = this.detectMissingEnvironmentVariables(context.content);
    if (missingEnvVars.length > 0) {
      issues.push({
        type: 'missing-environment-variables',
        severity: 'medium',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        file: context.filePath,
        fix: 'Define missing environment variables and add validation'
      });
      score -= missingEnvVars.length * 5;
    }

    // Check for configuration security issues
    if (this.hasConfigurationSecurityIssues(context.content)) {
      issues.push({
        type: 'configuration-security-issues',
        severity: 'critical',
        message: 'Sensitive configuration exposed or improperly secured',
        file: context.filePath,
        fix: 'Move sensitive configuration to secure environment variables'
      });
      score -= 25;
    }

    return { issues, score };
  }

  private async validateServiceConsistency(context: AgentActivationContext) {
    const issues = [];
    let score = 100;

    if (!context.content) {
      return { issues, score };
    }

    // Check for service interface consistency
    if (this.hasServiceInterfaceInconsistencies(context.content)) {
      issues.push({
        type: 'service-interface-inconsistency',
        severity: 'medium',
        message: 'Service interfaces inconsistent across different modules',
        file: context.filePath || 'unknown',
        fix: 'Standardize service interfaces and implement consistent patterns'
      });
      score -= 10;
    }

    // Check for missing service validation
    if (this.hasMissingServiceValidation(context.content)) {
      issues.push({
        type: 'missing-service-validation',
        severity: 'medium',
        message: 'Service methods missing input validation',
        file: context.filePath || 'unknown',
        fix: 'Add input validation to all service methods'
      });
      score -= 10;
    }

    return { issues, score };
  }

  // Detection methods
  private hasHardcodedEndpoints(content: string): boolean {
    const hardcodedPatterns = [
      /['"`]https?:\/\/[^'"`]+['"`]/,
      /['"`]\/api\/[^'"`]+['"`].*\+/,
      /baseURL\s*:\s*['"`]http/i
    ];

    return hardcodedPatterns.some(pattern => pattern.test(content));
  }

  private hasMissingErrorHandling(content: string): boolean {
    const hasAPICall = /fetch\(|axios\.|\.get\(|\.post\(|\.put\(|\.delete\(/i.test(content);
    const hasTryCatch = /try\s*\{|catch\s*\(/i.test(content);
    const hasErrorHandling = /\.catch\(|error\s*=>/i.test(content);

    return hasAPICall && !hasTryCatch && !hasErrorHandling;
  }

  private hasInsecureAPIPatterns(content: string): boolean {
    const insecurePatterns = [
      /password\s*:\s*['"`][^'"`]+['"`]/i,
      /api_key\s*:\s*['"`][^'"`]+['"`]/i,
      /secret\s*:\s*['"`][^'"`]+['"`]/i,
      /token\s*:\s*['"`][^'"`]+['"`]/i,
      /eval\s*\(/i,
      /innerHTML\s*=/i
    ];

    return insecurePatterns.some(pattern => pattern.test(content));
  }

  private hasMissingAuthentication(content: string): boolean {
    const hasAPIRoute = /\/api\/|router\.|app\.(get|post|put|delete)/i.test(content);
    const hasAuth = /auth|token|jwt|session/i.test(content);
    const hasMiddleware = /middleware|authenticate|authorize/i.test(content);

    return hasAPIRoute && !hasAuth && !hasMiddleware;
  }

  private detectAPIContractMismatches(content: string) {
    const issues = [];

    // Look for inconsistent API parameter naming
    const parameterPatterns = content.match(/\{\s*(\w+)\s*\}/g);
    if (parameterPatterns) {
      const params = parameterPatterns.map(p => p.replace(/[{}]/g, '').trim());
      const hasInconsistentNaming = params.some(param =>
        param.includes('_') && params.some(p => p.includes('-'))
      );

      if (hasInconsistentNaming) {
        issues.push({
          type: 'api-parameter-naming-inconsistency',
          severity: 'medium',
          message: 'API parameters use inconsistent naming conventions',
          file: 'API definition',
          fix: 'Standardize parameter naming (either snake_case or kebab-case)'
        });
      }
    }

    // Check for missing type definitions
    const hasAPIDefinition = /interface\s+\w+API|type\s+\w+Response/i.test(content);
    const hasAPICall = /fetch\(|axios\./i.test(content);

    if (hasAPICall && !hasAPIDefinition) {
      issues.push({
        type: 'missing-api-types',
        severity: 'medium',
        message: 'API calls missing TypeScript type definitions',
        file: 'API client',
        fix: 'Define TypeScript interfaces for API requests and responses'
      });
    }

    return issues;
  }

  private hasMissingAPIDocumentation(content: string): boolean {
    const hasAPIDefinition = /\/api\/|router\.|app\.(get|post)/i.test(content);
    const hasDocumentation = /\/\*\*|@swagger|@openapi|@param|@returns/i.test(content);

    return hasAPIDefinition && !hasDocumentation;
  }

  private hasInconsistentResponseFormats(content: string): boolean {
    const responsePatterns = content.match(/return\s*\{[^}]+\}/g);
    if (!responsePatterns || responsePatterns.length < 2) return false;

    // Check if responses have different structure patterns
    const hasSuccessField = responsePatterns.some(p => /success\s*:/i.test(p));
    const hasDataField = responsePatterns.some(p => /data\s*:/i.test(p));
    const hasErrorField = responsePatterns.some(p => /error\s*:/i.test(p));

    const missingPatterns = responsePatterns.filter(p =>
      !(hasSuccessField && /success\s*:/i.test(p)) ||
      !(hasDataField && /data\s*:/i.test(p))
    );

    return missingPatterns.length > 0;
  }

  private hasConfigurationDrift(content: string): boolean {
    const configPatterns = [
      /process\.env\.\w+/g,
      /config\.\w+/g,
      /settings\.\w+/g
    ];

    // This would implement actual cross-file configuration comparison
    // For now, check for obvious inconsistencies
    return /development|staging|production/i.test(content) &&
           !/NODE_ENV/i.test(content);
  }

  private detectMissingEnvironmentVariables(content: string): string[] {
    const envVarMatches = content.match(/process\.env\.(\w+)/g);
    const missing = [];

    if (envVarMatches) {
      const envVars = envVarMatches.map(match => match.replace('process.env.', ''));
      const commonRequired = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'];

      commonRequired.forEach(required => {
        if (!envVars.includes(required) && content.includes(required.toLowerCase())) {
          missing.push(required);
        }
      });
    }

    return missing;
  }

  private hasConfigurationSecurityIssues(content: string): boolean {
    const securityIssues = [
      /password\s*=\s*['"`][^'"`]+['"`]/i,
      /secret\s*=\s*['"`][^'"`]+['"`]/i,
      /key\s*=\s*['"`][^'"`]+['"`]/i,
      /token\s*=\s*['"`][^'"`]+['"`]/i
    ];

    return securityIssues.some(pattern => pattern.test(content));
  }

  private hasServiceInterfaceInconsistencies(content: string): boolean {
    const serviceMethodMatches = content.match(/\w+Service\.\w+\(/g);
    if (!serviceMethodMatches || serviceMethodMatches.length < 2) return false;

    // Check for inconsistent method naming patterns
    const methods = serviceMethodMatches.map(match =>
      match.replace(/Service\./g, '').replace(/\(/, '')
    );

    const hasCamelCase = methods.some(method => /[A-Z]/.test(method));
    const hasSnakeCase = methods.some(method => method.includes('_'));

    return hasCamelCase && hasSnakeCase;
  }

  private hasMissingServiceValidation(content: string): boolean {
    const hasServiceMethod = /\w+Service\.\w+\(|function\s+\w+\(/i.test(content);
    const hasValidation = /validate|check|verify|assert/i.test(content);

    return hasServiceMethod && !hasValidation;
  }

  private generateEnhancedReport(issues: any[], backendValidation: any): string {
    let report = `🛠️ **Enhanced Marcus - Advanced Backend Analysis Report**\n\n`;

    report += `📊 **Backend Health Dashboard**\n`;
    report += `Overall Score: ${backendValidation.score}% ${this.getScoreEmoji(backendValidation.score)}\n`;
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

    const securityIssues = issues.filter(i =>
      i.type.includes('insecure') || i.type.includes('security') || i.severity === 'critical'
    );
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security-hardening',
        priority: 'critical',
        message: `Address ${securityIssues.length} security issues immediately`,
        actions: securityIssues.map(issue => issue.fix)
      });
    }

    const integrationIssues = issues.filter(i => i.type.includes('api') || i.type.includes('integration'));
    if (integrationIssues.length > 0) {
      recommendations.push({
        type: 'api-integration-improvement',
        priority: 'high',
        message: 'Improve API integration consistency',
        actions: [
          'Implement API contract testing',
          'Add comprehensive API documentation',
          'Standardize response formats across endpoints'
        ]
      });
    }

    const configIssues = issues.filter(i => i.type.includes('config'));
    if (configIssues.length > 0) {
      recommendations.push({
        type: 'configuration-management',
        priority: 'medium',
        message: 'Improve configuration management',
        actions: [
          'Implement configuration validation',
          'Create environment-specific config files',
          'Add configuration drift detection'
        ]
      });
    }

    return recommendations;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 95) return '🟢';
    if (score >= 85) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }

  private calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.filter(i => i.severity === 'high').length > 1) return 'high';
    if (issues.length > 0) return 'medium';
    return 'low';
  }

  private determineHandoffs(issues: any[]): string[] {
    const handoffs = [];

    if (issues.some(i => i.type.includes('security') || i.type.includes('insecure'))) {
      handoffs.push('security-sam');
    }
    if (issues.some(i => i.type.includes('frontend') || i.type.includes('api-contract'))) {
      handoffs.push('enhanced-james');
    }
    if (issues.some(i => i.type.includes('config') || i.type.includes('deployment'))) {
      handoffs.push('devops-dan');
    }
    if (issues.some(i => i.severity === 'critical' || i.type.includes('test'))) {
      handoffs.push('enhanced-maria');
    }

    return handoffs;
  }
}

export default EnhancedMarcus;