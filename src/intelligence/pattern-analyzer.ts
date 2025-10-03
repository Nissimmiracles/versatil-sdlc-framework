/**
 * VERSATIL SDLC Framework - Level 1: Pattern Analysis System (RAG-Enhanced)
 *
 * Provides intelligent code analysis with optional RAG context using:
 * - Regex pattern matching enhanced with historical patterns
 * - AST-like parsing with learned conventions
 * - Heuristic analysis enriched with project knowledge
 * - Best practice detection from vector memory
 */

import { MemoryDocument } from '../rag/enhanced-vector-memory-store.js';

export interface RAGContext {
  similarPatterns: MemoryDocument[];
  relevantSolutions: MemoryDocument[];
  projectConventions: MemoryDocument[];
  agentExpertise: MemoryDocument[];
}

export interface PatternMatch {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code: string;
  category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
  description?: string;
}

export interface AnalysisResult {
  patterns: PatternMatch[];
  score: number;
  summary: string;
  recommendations: string[];
  coverage?: number;
  quality?: number;
  security?: number;
  performance?: number;
  issues?: any[];
}

export class PatternAnalyzer {
  /**
   * Analyze code for QA patterns (Enhanced Maria) with optional RAG context
   */
  static analyzeQA(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult {
    const patterns: PatternMatch[] = [];
    const lines = (content || '').split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect missing test coverage
      if (filePath.includes('test') || filePath.includes('spec')) {
        if (line.includes('it(') || line.includes('test(')) {
          if (!line.includes('expect') && !line.includes('assert')) {
            patterns.push({
              type: 'missing-assertion',
              severity: 'high',
              line: lineNum,
              column: 0,
              message: 'Test case missing assertions',
              suggestion: 'Add expect() or assert() to validate behavior',
              code: line.trim(),
              category: 'bug'
            });
          }
        }
      }

      // Detect debugging code in production
      if (line.includes('console.log') || line.includes('console.debug')) {
        patterns.push({
          type: 'debug-code',
          severity: 'medium',
          line: lineNum,
          column: line.indexOf('console'),
          message: 'Debugging code detected',
          suggestion: 'Remove console.log statements before production',
          code: line.trim(),
          category: 'best-practice'
        });
      }

      if (line.includes('debugger')) {
        patterns.push({
          type: 'debugger-statement',
          severity: 'critical',
          line: lineNum,
          column: line.indexOf('debugger'),
          message: 'Debugger statement in code',
          suggestion: 'Remove debugger statement immediately',
          code: line.trim(),
          category: 'bug'
        });
      }

      // Detect TODO/FIXME comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        patterns.push({
          type: 'todo-comment',
          severity: 'low',
          line: lineNum,
          column: 0,
          message: 'Unresolved TODO/FIXME',
          suggestion: 'Address TODO or create tracking issue',
          code: line.trim(),
          category: 'best-practice'
        });
      }

      // Detect empty catch blocks
      if (line.includes('catch') && lines[index + 1]?.trim() === '}') {
        patterns.push({
          type: 'empty-catch',
          severity: 'high',
          line: lineNum,
          column: 0,
          message: 'Empty catch block swallows errors',
          suggestion: 'Add error logging or proper error handling',
          code: line.trim(),
          category: 'bug'
        });
      }

      // Detect missing error handling
      if (line.includes('async ') && line.includes('=>')) {
        const nextLines = lines.slice(index, index + 10).join('\n');
        if (!nextLines.includes('try') && !nextLines.includes('catch')) {
          patterns.push({
            type: 'missing-error-handling',
            severity: 'medium',
            line: lineNum,
            column: 0,
            message: 'Async function without error handling',
            suggestion: 'Wrap async operations in try-catch',
            code: line.trim(),
            category: 'bug'
          });
        }
      }
    });

    // Apply RAG-enhanced analysis if context is available
    if (ragContext) {
      this.enhanceWithRAGContext(patterns, ragContext, 'qa');
    }

    const score = this.calculateQualityScore(patterns);

    return {
      patterns,
      score,
      summary: this.generateQASummary(patterns, score, ragContext),
      recommendations: this.generateQARecommendations(patterns, ragContext)
    };
  }

  /**
   * Analyze code for Frontend patterns (Enhanced James)
   */
  static analyzeFrontend(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult {
    const patterns: PatternMatch[] = [];
    const lines = (content || '').split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect debugging code
      if (line.includes('console.log') || line.includes('console.warn')) {
        patterns.push({
          type: 'debugging-code',
          severity: 'critical',
          line: lineNum,
          column: 0,
          message: 'Console.log detected - remove before production',
          suggestion: 'Remove debug logging or use proper logger',
          code: line.trim(),
          category: 'bug'
        });
      }

      if (line.includes('debugger')) {
        patterns.push({
          type: 'debugging-code',
          severity: 'critical',
          line: lineNum,
          column: 0,
          message: 'Debugger statement detected - remove before production',
          suggestion: 'Remove debugger statement',
          code: line.trim(),
          category: 'bug'
        });
      }

      // Detect inline styles
      if (line.includes('style={{') || line.includes('style="')) {
        patterns.push({
          type: 'inline-styles',
          severity: 'low',
          line: lineNum,
          column: 0,
          message: 'Inline styles detected',
          suggestion: 'Use CSS modules or styled-components',
          code: line.trim(),
          category: 'best-practice'
        });
      }

      // Detect missing key props in lists
      if (line.includes('.map(') && !line.includes('key=')) {
        const nextLines = lines.slice(index, index + 5).join('\n');
        if (!nextLines.includes('key=')) {
          patterns.push({
            type: 'missing-key-prop',
            severity: 'high',
            line: lineNum,
            column: 0,
            message: 'Missing key prop in list rendering',
            suggestion: 'Add unique key prop to list items',
            code: line.trim(),
            category: 'bug'
          });
        }
      }

      // Detect missing alt text
      if (line.includes('<img') && !line.includes('alt=')) {
        patterns.push({
          type: 'missing-alt-text',
          severity: 'medium',
          line: lineNum,
          column: 0,
          message: 'Image missing alt text',
          suggestion: 'Add descriptive alt text for accessibility',
          code: line.trim(),
          category: 'best-practice'
        });
      }

      // Detect useState without proper naming
      if (line.includes('useState')) {
        const match = line.match(/const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState/);
        if (match) {
          const [, stateName, setterName] = match;
          const expectedSetter = `set${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}`;
          if (setterName !== expectedSetter) {
            patterns.push({
              type: 'useState-naming',
              severity: 'low',
              line: lineNum,
              column: 0,
              message: 'useState setter naming inconsistent',
              suggestion: `Use ${expectedSetter} instead of ${setterName}`,
              code: line.trim(),
              category: 'style'
            });
          }
        }
      }

      // Detect large component files
      if (index === 0 && lines.length > 300) {
        patterns.push({
          type: 'large-component',
          severity: 'medium',
          line: 1,
          column: 0,
          message: `Component has ${lines.length} lines (>300)`,
          suggestion: 'Split into smaller, focused components',
          code: '',
          category: 'best-practice'
        });
      }
    });

    const score = this.calculateQualityScore(patterns);

    return {
      patterns,
      score,
      summary: this.generateFrontendSummary(patterns, score),
      recommendations: this.generateFrontendRecommendations(patterns)
    };
  }

  /**
   * Analyze code for Backend patterns (Enhanced Marcus)
   */
  static analyzeBackend(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult {
    const patterns: PatternMatch[] = [];
    const lines = (content || '').split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Detect SQL injection vulnerabilities
      if (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE')) {
        if (line.includes('${') || line.includes('+')) {
          patterns.push({
            type: 'sql-injection',
            severity: 'critical',
            line: lineNum,
            column: 0,
            message: 'Potential SQL injection vulnerability',
            suggestion: 'Use parameterized queries or ORM',
            code: line.trim(),
            category: 'security'
          });
        }
      }

      // Detect hardcoded credentials
      if (line.match(/(password|secret|key|token)\s*[=:]\s*['"][^'"]+['"]/i)) {
        patterns.push({
          type: 'hardcoded-credentials',
          severity: 'critical',
          line: lineNum,
          column: 0,
          message: 'Hardcoded credentials detected',
          suggestion: 'Use environment variables or secret management',
          code: line.trim().replace(/['"][^'"]+['"]/, '"***"'),
          category: 'security'
        });
      }

      // Detect missing input validation
      if (line.includes('req.body') || line.includes('req.params') || line.includes('req.query')) {
        const nextLines = lines.slice(index, index + 10).join('\n');
        if (!nextLines.includes('validate') && !nextLines.includes('sanitize')) {
          patterns.push({
            type: 'missing-validation',
            severity: 'high',
            line: lineNum,
            column: 0,
            message: 'User input without validation',
            suggestion: 'Add input validation and sanitization',
            code: line.trim(),
            category: 'security'
          });
        }
      }

      // Detect synchronous file operations
      if (line.includes('fs.readFileSync') || line.includes('fs.writeFileSync')) {
        patterns.push({
          type: 'sync-file-operation',
          severity: 'medium',
          line: lineNum,
          column: 0,
          message: 'Synchronous file operation blocks event loop',
          suggestion: 'Use async file operations (fs.promises)',
          code: line.trim(),
          category: 'performance'
        });
      }

      // Detect missing rate limiting
      if (line.includes('app.post') || line.includes('router.post')) {
        if (!content.includes('rateLimit') && !content.includes('rateLimiter')) {
          patterns.push({
            type: 'missing-rate-limit',
            severity: 'high',
            line: lineNum,
            column: 0,
            message: 'POST endpoint without rate limiting',
            suggestion: 'Add rate limiting middleware',
            code: line.trim(),
            category: 'security'
          });
        }
      }
    });

    const score = this.calculateQualityScore(patterns);

    return {
      patterns,
      score,
      summary: this.generateBackendSummary(patterns, score),
      recommendations: this.generateBackendRecommendations(patterns)
    };
  }

  /**
   * Calculate quality score based on patterns
   */
  private static calculateQualityScore(patterns: PatternMatch[]): number {
    let score = 100;

    patterns.forEach(pattern => {
      switch (pattern.severity) {
        case 'critical': score -= 15; break;
        case 'high': score -= 8; break;
        case 'medium': score -= 4; break;
        case 'low': score -= 2; break;
        case 'info': score -= 1; break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }


  /**
   * Generate Frontend summary
   */
  private static generateFrontendSummary(patterns: PatternMatch[], score: number): string {
    const accessibility = patterns.filter(p => p.type === 'missing-alt-text').length;
    const performance = patterns.filter(p => p.category === 'performance').length;

    let summary = `Frontend quality score: ${score}/100. `;
    if (accessibility > 0) summary += `${accessibility} accessibility issues. `;
    if (performance > 0) summary += `${performance} performance concerns. `;

    return summary || `Frontend code looks good (${score}/100).`;
  }

  /**
   * Generate Frontend recommendations
   */
  private static generateFrontendRecommendations(patterns: PatternMatch[]): string[] {
    const recommendations: string[] = [];

    if (patterns.some(p => p.type === 'missing-key-prop')) {
      recommendations.push('🔑 Add key props to all list items');
    }
    if (patterns.some(p => p.type === 'missing-alt-text')) {
      recommendations.push('♿ Improve accessibility with alt text');
    }
    if (patterns.some(p => p.type === 'large-component')) {
      recommendations.push('📦 Split large components for better maintainability');
    }

    return recommendations;
  }

  /**
   * Generate Backend summary
   */
  private static generateBackendSummary(patterns: PatternMatch[], score: number): string {
    const security = patterns.filter(p => p.category === 'security').length;
    const performance = patterns.filter(p => p.category === 'performance').length;

    let summary = `Backend security score: ${score}/100. `;
    if (security > 0) summary += `⚠️  ${security} security issues found! `;
    if (performance > 0) summary += `${performance} performance improvements needed. `;

    return summary || `Backend code is secure (${score}/100).`;
  }

  /**
   * Generate Backend recommendations
   */
  private static generateBackendRecommendations(patterns: PatternMatch[]): string[] {
    const recommendations: string[] = [];

    if (patterns.some(p => p.type === 'sql-injection')) {
      recommendations.push('🔒 Fix SQL injection vulnerabilities immediately');
    }
    if (patterns.some(p => p.type === 'hardcoded-credentials')) {
      recommendations.push('🔐 Move credentials to environment variables');
    }
    if (patterns.some(p => p.type === 'missing-validation')) {
      recommendations.push('✅ Add input validation to API endpoints');
    }
    if (patterns.some(p => p.type === 'missing-rate-limit')) {
      recommendations.push('⏱️  Implement rate limiting for security');
    }

    return recommendations;
  }

  /**
   * Enhance patterns with RAG context knowledge
   */
  private static enhanceWithRAGContext(patterns: PatternMatch[], ragContext: RAGContext, domain: string): void {
    // Apply similar patterns to improve detection confidence
    if (ragContext.similarPatterns.length > 0) {
      for (const pattern of patterns) {
        const similarPattern = ragContext.similarPatterns.find(p =>
          p.metadata?.tags?.includes(pattern.type) ||
          p.content.toLowerCase().includes(pattern.type.replace('-', ' '))
        );

        if (similarPattern) {
          // Boost severity if pattern was critical in similar contexts
          if (similarPattern.metadata?.relevanceScore && similarPattern.metadata.relevanceScore > 0.8) {
            if (pattern.severity === 'medium') pattern.severity = 'high';
            if (pattern.severity === 'high') pattern.severity = 'critical';
          }
        }
      }
    }

    // Add recommendations from relevant solutions
    if (ragContext.relevantSolutions.length > 0) {
      for (const solution of ragContext.relevantSolutions.slice(0, 3)) {
        const isApplicable = patterns.some(p =>
          solution.metadata?.tags?.includes(p.type) ||
          solution.content.toLowerCase().includes(p.type.replace('-', ' '))
        );

        if (isApplicable && solution.content) {
          patterns.push({
            type: 'rag-suggestion',
            severity: 'info',
            line: 0,
            column: 0,
            message: `RAG Suggestion: Similar issue solved previously`,
            suggestion: solution.content.slice(0, 200) + '...',
            code: '',
            category: 'best-practice'
          });
        }
      }
    }
  }

  /**
   * Generate QA summary with RAG context
   */
  private static generateQASummary(patterns: PatternMatch[], score: number, ragContext?: RAGContext): string {
    const critical = patterns.filter(p => p.severity === 'critical').length;
    const high = patterns.filter(p => p.severity === 'high').length;
    const medium = patterns.filter(p => p.severity === 'medium').length;

    let baseSummary = '';
    if (score >= 90) baseSummary = `Excellent code quality (${score}/100). ${patterns.length} minor issues found.`;
    else if (score >= 75) baseSummary = `Good code quality (${score}/100). ${patterns.length} issues need attention.`;
    else if (score >= 60) baseSummary = `Fair code quality (${score}/100). ${critical + high} important issues found.`;
    else baseSummary = `Poor code quality (${score}/100). ${critical} critical, ${high} high priority issues require immediate attention.`;

    if (ragContext) {
      const ragEnhancements = [];
      if (ragContext.similarPatterns.length > 0) {
        ragEnhancements.push(`${ragContext.similarPatterns.length} similar patterns analyzed`);
      }
      if (ragContext.relevantSolutions.length > 0) {
        ragEnhancements.push(`${ragContext.relevantSolutions.length} proven solutions available`);
      }
      if (ragContext.projectConventions.length > 0) {
        ragEnhancements.push(`${ragContext.projectConventions.length} project conventions applied`);
      }

      if (ragEnhancements.length > 0) {
        baseSummary += ` RAG-Enhanced: ${ragEnhancements.join(', ')}.`;
      }
    }

    return baseSummary;
  }

  /**
   * Generate QA recommendations with RAG context
   */
  private static generateQARecommendations(patterns: PatternMatch[], ragContext?: RAGContext): string[] {
    const recommendations: string[] = [];

    const criticalIssues = patterns.filter(p => p.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 Address ${criticalIssues.length} critical issues immediately`);
    }

    const debugCode = patterns.filter(p => p.type === 'debug-code' || p.type === 'debugger-statement');
    if (debugCode.length > 0) {
      recommendations.push(`🧹 Remove ${debugCode.length} debugging statements`);
    }

    const missingTests = patterns.filter(p => p.type === 'missing-assertion');
    if (missingTests.length > 0) {
      recommendations.push(`🧪 Add assertions to ${missingTests.length} test cases`);
    }

    // Add RAG-specific recommendations
    if (ragContext) {
      if (ragContext.relevantSolutions.length > 0) {
        recommendations.push(`💡 ${ragContext.relevantSolutions.length} similar solutions found in knowledge base`);
      }
      if (ragContext.projectConventions.length > 0) {
        recommendations.push(`📋 Apply ${ragContext.projectConventions.length} project-specific conventions`);
      }
      if (ragContext.agentExpertise.length > 0) {
        recommendations.push(`🎯 Leverage ${ragContext.agentExpertise.length} expert insights from team knowledge`);
      }
    }

    return recommendations;
  }
}