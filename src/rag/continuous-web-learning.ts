/**
 * Continuous Web Learning System
 * Automatically learns latest SDLC patterns from web research
 *
 * This keeps YOUR framework up-to-date with:
 * - Latest industry best practices
 * - Emerging patterns and techniques
 * - New tools and frameworks
 * - Security vulnerabilities and fixes
 * - Performance optimization strategies
 */

import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store';

export interface WebLearnedPattern {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  category: 'best-practice' | 'tool' | 'security' | 'performance' | 'architecture' | 'testing';
  relevanceScore: number;
  publishDate: Date;
  learnedDate: Date;
  applicableToProject: boolean;
  tags: string[];
}

export interface LearningSource {
  name: string;
  url: string;
  type: 'blog' | 'documentation' | 'github' | 'stackoverflow' | 'research-paper';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastChecked: Date;
}

/**
 * Continuous Web Learning - Keeps framework knowledge fresh
 */
export class ContinuousWebLearning {
  private vectorStore: EnhancedVectorMemoryStore;
  private learningSources: LearningSource[] = [];
  private learningSchedule: NodeJS.Timeout | null = null;

  constructor(vectorStore: EnhancedVectorMemoryStore) {
    this.vectorStore = vectorStore;
    this.initializeLearningSources();
  }

  /**
   * Initialize default learning sources
   */
  private initializeLearningSources(): void {
    this.learningSources = [
      // Best practices
      {
        name: 'Martin Fowler Blog',
        url: 'https://martinfowler.com',
        type: 'blog',
        frequency: 'weekly',
        lastChecked: new Date()
      },
      {
        name: 'ThoughtWorks Tech Radar',
        url: 'https://www.thoughtworks.com/radar',
        type: 'blog',
        frequency: 'monthly',
        lastChecked: new Date()
      },

      // Framework documentation
      {
        name: 'React Documentation',
        url: 'https://react.dev/learn',
        type: 'documentation',
        frequency: 'weekly',
        lastChecked: new Date()
      },
      {
        name: 'Node.js Best Practices',
        url: 'https://github.com/goldbergyoni/nodebestpractices',
        type: 'github',
        frequency: 'weekly',
        lastChecked: new Date()
      },

      // Security
      {
        name: 'OWASP Top 10',
        url: 'https://owasp.org/www-project-top-ten',
        type: 'documentation',
        frequency: 'monthly',
        lastChecked: new Date()
      },
      {
        name: 'npm Security Advisories',
        url: 'https://github.com/advisories',
        type: 'github',
        frequency: 'daily',
        lastChecked: new Date()
      },

      // Performance
      {
        name: 'web.dev',
        url: 'https://web.dev/explore',
        type: 'documentation',
        frequency: 'weekly',
        lastChecked: new Date()
      },

      // Architecture
      {
        name: 'Microservices.io',
        url: 'https://microservices.io/patterns',
        type: 'documentation',
        frequency: 'monthly',
        lastChecked: new Date()
      },

      // Testing
      {
        name: 'Kent C. Dodds Blog',
        url: 'https://kentcdodds.com/blog',
        type: 'blog',
        frequency: 'weekly',
        lastChecked: new Date()
      },

      // Community Q&A
      {
        name: 'Stack Overflow Trends',
        url: 'https://stackoverflow.com/questions/tagged/',
        type: 'stackoverflow',
        frequency: 'daily',
        lastChecked: new Date()
      }
    ];
  }

  /**
   * Start continuous learning process
   */
  startContinuousLearning(): void {
    console.log('[ContinuousWebLearning] Starting continuous learning from web sources');

    // Run immediately
    this.performLearningCycle();

    // Schedule daily learning cycles
    this.learningSchedule = setInterval(() => {
      this.performLearningCycle();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  /**
   * Stop continuous learning
   */
  stopContinuousLearning(): void {
    if (this.learningSchedule) {
      clearInterval(this.learningSchedule);
      this.learningSchedule = null;
      console.log('[ContinuousWebLearning] Stopped continuous learning');
    }
  }

  /**
   * Perform one learning cycle
   */
  private async performLearningCycle(): Promise<void> {
    console.log('[ContinuousWebLearning] Starting learning cycle');

    for (const source of this.learningSources) {
      if (this.shouldCheck(source)) {
        await this.learnFromSource(source);
        source.lastChecked = new Date();
      }
    }

    console.log('[ContinuousWebLearning] Learning cycle completed');
  }

  /**
   * Check if source should be checked now
   */
  private shouldCheck(source: LearningSource): boolean {
    const hoursSinceLastCheck =
      (Date.now() - source.lastChecked.getTime()) / (1000 * 60 * 60);

    switch (source.frequency) {
      case 'daily':
        return hoursSinceLastCheck >= 24;
      case 'weekly':
        return hoursSinceLastCheck >= 24 * 7;
      case 'monthly':
        return hoursSinceLastCheck >= 24 * 30;
      default:
        return false;
    }
  }

  /**
   * Learn from specific source
   */
  private async learnFromSource(source: LearningSource): Promise<void> {
    console.log(`[ContinuousWebLearning] Learning from ${source.name}`);

    try {
      // Fetch content from source (in production, use WebFetch or similar)
      const content = await this.fetchSourceContent(source);

      // Extract patterns
      const patterns = this.extractPatterns(content, source);

      // Filter for relevance
      const relevantPatterns = patterns.filter(p => p.relevanceScore > 0.7);

      // Store in RAG
      for (const pattern of relevantPatterns) {
        await this.storeWebLearnedPattern(pattern);
      }

      console.log(`[ContinuousWebLearning] Learned ${relevantPatterns.length} patterns from ${source.name}`);
    } catch (error) {
      console.error(`[ContinuousWebLearning] Error learning from ${source.name}:`, error);
    }
  }

  /**
   * Fetch content from source
   * In production, this would use WebFetch MCP or similar
   */
  private async fetchSourceContent(source: LearningSource): Promise<string> {
    // Simulated fetch - in production use actual WebFetch
    // Example prompts for WebFetch MCP:
    const searchQueries: { [key: string]: string } = {
      'Martin Fowler Blog': 'latest software development best practices 2025',
      'React Documentation': 'latest React patterns and best practices',
      'Node.js Best Practices': 'Node.js security and performance best practices',
      'OWASP Top 10': 'latest web security vulnerabilities',
      'npm Security Advisories': 'recent npm package vulnerabilities',
      'web.dev': 'latest web performance optimization techniques',
      'Microservices.io': 'microservices architecture patterns',
      'Kent C. Dodds Blog': 'modern testing strategies and best practices',
      'Stack Overflow Trends': 'trending development questions and solutions'
    };

    const query = searchQueries[source.name] || `latest ${source.name} SDLC patterns`;

    // In production, would call:
    // const result = await webFetch(source.url, query);
    // return result.content;

    // For now, return placeholder
    return `Sample content from ${source.name}`;
  }

  /**
   * Extract patterns from fetched content
   */
  private extractPatterns(content: string, source: LearningSource): WebLearnedPattern[] {
    const patterns: WebLearnedPattern[] = [];

    // Pattern extraction logic (in production, would use NLP/AI)
    // For now, create example patterns

    // Example: Security pattern
    if (source.name.includes('Security') || source.name.includes('OWASP')) {
      patterns.push({
        id: `web-pattern-${Date.now()}`,
        title: 'Latest security best practice',
        content: content.substring(0, 500),
        source: source.name,
        url: source.url,
        category: 'security',
        relevanceScore: 0.9,
        publishDate: new Date(),
        learnedDate: new Date(),
        applicableToProject: true,
        tags: ['security', 'best-practice', 'web-learned']
      });
    }

    // Example: Performance pattern
    if (source.name.includes('Performance') || source.name.includes('web.dev')) {
      patterns.push({
        id: `web-pattern-${Date.now() + 1}`,
        title: 'Latest performance optimization',
        content: content.substring(0, 500),
        source: source.name,
        url: source.url,
        category: 'performance',
        relevanceScore: 0.85,
        publishDate: new Date(),
        learnedDate: new Date(),
        applicableToProject: true,
        tags: ['performance', 'optimization', 'web-learned']
      });
    }

    return patterns;
  }

  /**
   * Store web-learned pattern in RAG
   */
  private async storeWebLearnedPattern(pattern: WebLearnedPattern): Promise<void> {
    await this.vectorStore.storeMemory({
      content: `${pattern.title}\n\n${pattern.content}`,
      contentType: 'web-learned-pattern',
      metadata: {
        agentId: 'continuous-web-learning',
        timestamp: Date.now(),
        pattern_id: pattern.id,
        title: pattern.title,
        source: pattern.source,
        source_url: pattern.url,
        category: pattern.category,
        relevance_score: pattern.relevanceScore,
        publish_date: pattern.publishDate.toISOString(),
        learned_date: pattern.learnedDate.toISOString(),
        applicable: pattern.applicableToProject,
        tags: ['web-learned', pattern.category, ...pattern.tags]
      }
    });
  }

  /**
   * Query web-learned patterns for context
   */
  async getWebLearnedPatternsFor(
    query: string,
    category?: WebLearnedPattern['category'],
    limit: number = 5
  ): Promise<WebLearnedPattern[]> {
    const filters: any = {
      tags: ['web-learned'],
      contentTypes: ['web-learned-pattern']
    };

    if (category) {
      filters.tags.push(category);
    }

    const result = await this.vectorStore.queryMemories({
      query,
      queryType: 'hybrid',
      agentId: 'continuous-web-learning',
      topK: limit,
      filters
    });

    return (result.documents || []).map(doc => ({
      id: doc.id,
      title: doc.metadata?.title || 'Untitled',
      content: doc.content,
      source: doc.metadata?.source || 'Unknown',
      url: doc.metadata?.source_url || '',
      category: doc.metadata?.category || 'best-practice',
      relevanceScore: doc.metadata?.relevance_score || 0.5,
      publishDate: new Date(doc.metadata?.publish_date || Date.now()),
      learnedDate: new Date(doc.metadata?.learned_date || Date.now()),
      applicableToProject: doc.metadata?.applicable !== false,
      tags: doc.metadata?.tags || []
    }));
  }

  /**
   * Get latest patterns by category
   */
  async getLatestPatterns(
    category: WebLearnedPattern['category'],
    limit: number = 10
  ): Promise<WebLearnedPattern[]> {
    return this.getWebLearnedPatternsFor('', category, limit);
  }

  /**
   * Add custom learning source
   */
  addLearningSource(source: LearningSource): void {
    this.learningSources.push(source);
    console.log(`[ContinuousWebLearning] Added new learning source: ${source.name}`);
  }

  /**
   * Get all learning sources
   */
  getLearningSources(): LearningSource[] {
    return [...this.learningSources];
  }

  /**
   * Manually trigger learning from specific source
   */
  async learnNow(sourceName: string): Promise<void> {
    const source = this.learningSources.find(s => s.name === sourceName);
    if (source) {
      await this.learnFromSource(source);
    } else {
      throw new Error(`Learning source not found: ${sourceName}`);
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    const result = await this.vectorStore.queryMemories({
      query: 'all web learned patterns',
      queryType: 'hybrid',
      agentId: 'continuous-web-learning',
      topK: 1000,
      filters: {
        tags: ['web-learned'],
        contentTypes: ['web-learned-pattern']
      }
    });

    const patterns = result.documents || [];

    return {
      totalPatternsLearned: patterns.length,
      learningSources: this.learningSources.length,
      byCategory: {
        'best-practice': patterns.filter(p => p.metadata?.category === 'best-practice').length,
        tool: patterns.filter(p => p.metadata?.category === 'tool').length,
        security: patterns.filter(p => p.metadata?.category === 'security').length,
        performance: patterns.filter(p => p.metadata?.category === 'performance').length,
        architecture: patterns.filter(p => p.metadata?.category === 'architecture').length,
        testing: patterns.filter(p => p.metadata?.category === 'testing').length
      },
      lastUpdate: Math.max(...this.learningSources.map(s => s.lastChecked.getTime()))
    };
  }
}

/**
 * Example usage:
 *
 * const webLearning = new ContinuousWebLearning(vectorStore);
 *
 * // Start continuous learning
 * webLearning.startContinuousLearning();
 *
 * // Query for security best practices
 * const securityPatterns = await webLearning.getLatestPatterns('security');
 *
 * // Add custom source
 * webLearning.addLearningSource({
 *   name: 'Your Company Blog',
 *   url: 'https://your-company.com/blog',
 *   type: 'blog',
 *   frequency: 'weekly',
 *   lastChecked: new Date()
 * });
 *
 * // Manually trigger learning
 * await webLearning.learnNow('Martin Fowler Blog');
 */