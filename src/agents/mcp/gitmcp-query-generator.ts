/**
 * GitMCP Query Generator
 *
 * Purpose: Generate precise GitMCP queries for fetching latest documentation
 *
 * Features:
 * - Framework mention → GitHub repository mapping
 * - Smart path inference (e.g., "FastAPI OAuth" → tiangolo/fastapi/docs/tutorial/security/oauth2.md)
 * - File type detection (README.md, API docs, tutorials, examples)
 * - Query validation and fallback strategies
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */

import { EventEmitter } from 'events';
import { FRAMEWORK_KNOWLEDGE_BASE, type FrameworkInfo } from './anti-hallucination-detector.js';

export interface GitMCPQuery {
  repository: string; // e.g., "tiangolo/fastapi"
  path?: string; // e.g., "docs/tutorial/security/oauth2.md"
  fileType?: 'readme' | 'docs' | 'examples' | 'api-reference' | 'tutorial';
  confidence: number; // 0-100% confidence in query accuracy
  reasoning: string;
  alternatives?: GitMCPQuery[];
}

export interface QueryContext {
  framework: string;
  topic?: string; // e.g., "OAuth2", "deployment", "testing"
  keywords: string[];
  intent?: 'learn' | 'implement' | 'troubleshoot' | 'reference';
}

/**
 * Documentation Path Patterns
 * Maps common topics to likely documentation paths
 */
const DOC_PATH_PATTERNS: Record<string, Record<string, string[]>> = {
  // Authentication & Security
  'auth': {
    common: ['security', 'authentication', 'auth'],
    fastapi: ['docs/tutorial/security', 'docs/advanced/security'],
    django: ['topics/auth', 'ref/contrib/auth'],
    express: ['guide/using-middleware', 'advanced/best-practice-security'],
    nextjs: ['pages/building-your-application/authentication']
  },
  'oauth': {
    common: ['security/oauth', 'oauth2', 'authentication/oauth'],
    fastapi: ['docs/tutorial/security/oauth2-jwt'],
    django: ['topics/auth/customizing'],
    nextjs: ['pages/building-your-application/authentication']
  },

  // Database
  'database': {
    common: ['database', 'db', 'data'],
    fastapi: ['docs/tutorial/sql-databases'],
    django: ['topics/db', 'ref/databases'],
    rails: ['activerecord'],
    prisma: ['docs/concepts/components/prisma-client']
  },
  'migration': {
    common: ['migrations', 'database/migrations'],
    django: ['topics/migrations'],
    rails: ['activerecord/migrations'],
    prisma: ['docs/guides/migrate']
  },

  // Testing
  'testing': {
    common: ['testing', 'test', 'tests'],
    fastapi: ['docs/tutorial/testing'],
    django: ['topics/testing'],
    react: ['docs/testing'],
    jest: ['docs/getting-started']
  },

  // Deployment
  'deployment': {
    common: ['deployment', 'deploy', 'production'],
    fastapi: ['docs/deployment'],
    nextjs: ['pages/building-your-application/deploying'],
    django: ['howto/deployment']
  },

  // API & REST
  'api': {
    common: ['api', 'api-reference', 'reference'],
    fastapi: ['docs/reference'],
    django: ['ref'],
    express: ['4x/api']
  },

  // Configuration
  'configuration': {
    common: ['configuration', 'config', 'settings'],
    nextjs: ['pages/api-reference/next-config-js'],
    django: ['ref/settings'],
    webpack: ['configuration']
  },

  // Getting Started
  'getting started': {
    common: ['getting-started', 'quickstart', 'intro', 'tutorial'],
    fastapi: ['docs/tutorial/first-steps'],
    react: ['docs/learn'],
    vue: ['guide/quick-start']
  }
};

export class GitMCPQueryGenerator extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Generate GitMCP query from context
   */
  async generateQuery(context: QueryContext): Promise<GitMCPQuery> {
    console.log(`🔨 Generating GitMCP query for framework: ${context.framework}`);

    // Step 1: Get framework info
    const frameworkInfo = this.getFrameworkInfo(context.framework);
    if (!frameworkInfo) {
      return this.generateFallbackQuery(context);
    }

    // Step 2: Infer documentation path
    const path = this.inferDocumentationPath(context, frameworkInfo);

    // Step 3: Generate query
    const query: GitMCPQuery = {
      repository: frameworkInfo.repository,
      path,
      fileType: this.inferFileType(context),
      confidence: this.calculateConfidence(context, frameworkInfo, path),
      reasoning: this.generateReasoning(context, frameworkInfo, path),
      alternatives: this.generateAlternatives(context, frameworkInfo, path)
    };

    this.emit('query-generated', {
      framework: context.framework,
      repository: query.repository,
      path: query.path,
      confidence: query.confidence
    });

    console.log(`   ✅ Generated query: ${query.repository}${path ? '/' + path : ''}`);
    console.log(`   💯 Confidence: ${query.confidence}%`);

    return query;
  }

  /**
   * Get framework info from knowledge base
   */
  private getFrameworkInfo(frameworkName: string): FrameworkInfo | undefined {
    const lowerName = frameworkName.toLowerCase();

    // Direct lookup
    if (FRAMEWORK_KNOWLEDGE_BASE[lowerName]) {
      return FRAMEWORK_KNOWLEDGE_BASE[lowerName];
    }

    // Search by framework name
    for (const [key, info] of Object.entries(FRAMEWORK_KNOWLEDGE_BASE)) {
      if (info.name.toLowerCase() === lowerName) {
        return info;
      }
    }

    return undefined;
  }

  /**
   * Infer documentation path from context
   */
  private inferDocumentationPath(context: QueryContext, framework: FrameworkInfo): string | undefined {
    const { topic, keywords, intent } = context;

    // Priority 1: Specific topic match
    if (topic) {
      const topicLower = topic.toLowerCase();
      const pattern = DOC_PATH_PATTERNS[topicLower];

      if (pattern) {
        // Check framework-specific path
        const frameworkKey = this.getFrameworkKey(framework);
        if (pattern[frameworkKey]) {
          return pattern[frameworkKey][0]; // Most common path
        }

        // Fall back to common path
        if (pattern.common) {
          const commonPath = pattern.common[0];
          return framework.docsPath ? `${framework.docsPath}/${commonPath}` : commonPath;
        }
      }
    }

    // Priority 2: Keyword-based inference
    const inferredPath = this.inferPathFromKeywords(keywords, framework);
    if (inferredPath) {
      return inferredPath;
    }

    // Priority 3: Intent-based inference
    if (intent) {
      return this.inferPathFromIntent(intent, framework);
    }

    // Priority 4: Default to base docs path
    return framework.docsPath;
  }

  /**
   * Infer path from keywords
   */
  private inferPathFromKeywords(keywords: string[], framework: FrameworkInfo): string | undefined {
    // Check each keyword against doc patterns
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      for (const [topic, pattern] of Object.entries(DOC_PATH_PATTERNS)) {
        // Check if keyword matches topic
        if (keywordLower.includes(topic) || topic.includes(keywordLower)) {
          const frameworkKey = this.getFrameworkKey(framework);

          // Framework-specific path
          if (pattern[frameworkKey]) {
            return pattern[frameworkKey][0];
          }

          // Common path
          if (pattern.common) {
            const commonPath = pattern.common[0];
            return framework.docsPath ? `${framework.docsPath}/${commonPath}` : commonPath;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Infer path from intent
   */
  private inferPathFromIntent(intent: QueryContext['intent'], framework: FrameworkInfo): string | undefined {
    const intentPaths: Record<string, string> = {
      'learn': 'getting-started',
      'implement': 'tutorial',
      'troubleshoot': 'faq',
      'reference': 'api-reference'
    };

    const basePath = intentPaths[intent!];
    if (!basePath) return framework.docsPath;

    return framework.docsPath ? `${framework.docsPath}/${basePath}` : basePath;
  }

  /**
   * Infer file type from context
   */
  private inferFileType(context: QueryContext): GitMCPQuery['fileType'] {
    const { topic, intent, keywords } = context;

    // Check for specific file type mentions
    const keywordsLower = keywords.map(k => k.toLowerCase()).join(' ');

    if (keywordsLower.includes('readme') || keywordsLower.includes('overview')) {
      return 'readme';
    }

    if (keywordsLower.includes('example') || keywordsLower.includes('sample')) {
      return 'examples';
    }

    if (keywordsLower.includes('api') || keywordsLower.includes('reference')) {
      return 'api-reference';
    }

    if (keywordsLower.includes('tutorial') || keywordsLower.includes('guide')) {
      return 'tutorial';
    }

    // Infer from intent
    if (intent === 'learn' || intent === 'implement') {
      return 'tutorial';
    }

    if (intent === 'reference') {
      return 'api-reference';
    }

    // Default to docs
    return 'docs';
  }

  /**
   * Calculate confidence in query accuracy
   */
  private calculateConfidence(
    context: QueryContext,
    framework: FrameworkInfo,
    path: string | undefined
  ): number {
    let confidence = 50; // Base confidence

    // Bonus for framework in knowledge base
    confidence += 20;

    // Bonus for specific path inferred
    if (path && path !== framework.docsPath) {
      confidence += 15;
    }

    // Bonus for topic match
    if (context.topic) {
      const topicLower = context.topic.toLowerCase();
      if (DOC_PATH_PATTERNS[topicLower]) {
        confidence += 10;
      }
    }

    // Bonus for multiple keywords
    if (context.keywords.length >= 3) {
      confidence += 5;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Generate reasoning for query
   */
  private generateReasoning(
    context: QueryContext,
    framework: FrameworkInfo,
    path: string | undefined
  ): string {
    const parts: string[] = [];

    parts.push(`Framework ${framework.name} identified from query`);

    if (context.topic) {
      parts.push(`topic "${context.topic}" mapped to docs path`);
    }

    if (path && path !== framework.docsPath) {
      parts.push(`specific path "${path}" inferred from context`);
    } else if (framework.docsPath) {
      parts.push(`using default docs path "${framework.docsPath}"`);
    }

    if (context.intent) {
      parts.push(`intent "${context.intent}" considered`);
    }

    return parts.join(', ');
  }

  /**
   * Generate alternative queries
   */
  private generateAlternatives(
    context: QueryContext,
    framework: FrameworkInfo,
    primaryPath: string | undefined
  ): GitMCPQuery[] {
    const alternatives: GitMCPQuery[] = [];

    // Alternative 1: README.md (always useful)
    if (primaryPath !== 'README.md') {
      alternatives.push({
        repository: framework.repository,
        path: 'README.md',
        fileType: 'readme',
        confidence: 80,
        reasoning: 'README often contains quick-start and overview'
      });
    }

    // Alternative 2: Examples directory
    if (!primaryPath?.includes('example')) {
      alternatives.push({
        repository: framework.repository,
        path: 'examples',
        fileType: 'examples',
        confidence: 70,
        reasoning: 'Examples directory contains practical code samples'
      });
    }

    // Alternative 3: Base docs path (if we inferred a specific path)
    if (primaryPath && primaryPath !== framework.docsPath && framework.docsPath) {
      alternatives.push({
        repository: framework.repository,
        path: framework.docsPath,
        fileType: 'docs',
        confidence: 60,
        reasoning: 'Base documentation path as fallback'
      });
    }

    return alternatives;
  }

  /**
   * Generate fallback query for unknown frameworks
   */
  private generateFallbackQuery(context: QueryContext): GitMCPQuery {
    console.log(`   ⚠️  Framework "${context.framework}" not in knowledge base, generating fallback`);

    // Try to construct a reasonable repository name
    const repository = this.guessRepository(context.framework);

    return {
      repository,
      path: 'README.md',
      fileType: 'readme',
      confidence: 30,
      reasoning: `Framework not in knowledge base. Guessed repository "${repository}". Consider adding to FRAMEWORK_KNOWLEDGE_BASE for better results.`,
      alternatives: [
        {
          repository,
          path: 'docs',
          fileType: 'docs',
          confidence: 20,
          reasoning: 'Try docs directory if it exists'
        }
      ]
    };
  }

  /**
   * Guess repository name from framework name
   */
  private guessRepository(frameworkName: string): string {
    const nameLower = frameworkName.toLowerCase().replace(/\s+/g, '-');

    // Common patterns
    const patterns = [
      `${nameLower}/${nameLower}`, // e.g., "fastapi/fastapi"
      `${nameLower}-dev/${nameLower}`, // e.g., "nextjs-dev/nextjs"
      `awesome-${nameLower}/${nameLower}` // e.g., "awesome-vue/vue"
    ];

    return patterns[0]; // Use most common pattern
  }

  /**
   * Get framework key for pattern lookup
   */
  private getFrameworkKey(framework: FrameworkInfo): string {
    // Extract key from repository (e.g., "tiangolo/fastapi" → "fastapi")
    return framework.repository.split('/')[1] || framework.name.toLowerCase();
  }

  /**
   * Format query as GitMCP URL
   */
  formatAsURL(query: GitMCPQuery): string {
    const base = `gitmcp://${query.repository}`;
    return query.path ? `${base}/${query.path}` : base;
  }

  /**
   * Parse GitMCP URL into query
   */
  parseURL(url: string): GitMCPQuery | null {
    const match = url.match(/^gitmcp:\/\/([^\/]+\/[^\/]+)(?:\/(.+))?$/);
    if (!match) return null;

    const [, repository, path] = match;

    return {
      repository,
      path,
      confidence: 50,
      reasoning: 'Parsed from GitMCP URL'
    };
  }
}

// Export singleton instance
export const gitMCPQueryGenerator = new GitMCPQueryGenerator();
