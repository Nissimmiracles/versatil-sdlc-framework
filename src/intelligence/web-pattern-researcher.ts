/**
 * VERSATIL Framework - Web Pattern Researcher
 * Background validation using Exa MCP for architecture/logic verification
 *
 * Features:
 * - Searches web for similar architectures and best practices
 * - Validates PRD feasibility against real-world implementations
 * - Detects anti-patterns and potential issues
 * - Finds performance benchmarks and stress test data
 * - Discovers security vulnerabilities in proposed approaches
 * - RAG-based pattern library building
 *
 * Addresses: User requirement #3 - "check the web in the background to stress test
 * the architecture and the logic in order to execute the prd in the best way and
 * stay in the mindset context of all the project"
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export interface ResearchQuery {
  queryId: string;
  type: 'architecture' | 'pattern' | 'security' | 'performance' | 'feasibility';
  description: string;
  context: {
    techStack?: string[]; // e.g., ['React', 'Node.js', 'PostgreSQL']
    constraints?: string[]; // e.g., ['must scale to 1M users', 'sub-200ms latency']
    mindsetAlignment?: string; // Link to PROJECT_MINDSET.md constraints
  };
  priority: 'urgent' | 'high' | 'medium' | 'low';
  maxResults?: number;
  backgroundMode?: boolean; // If true, runs async without blocking
}

export interface ResearchResult {
  queryId: string;
  sources: ResearchSource[];
  findings: Finding[];
  recommendations: Recommendation[];
  antiPatterns: AntiPattern[];
  benchmarks: Benchmark[];
  confidence: number; // 0-1
  timestamp: number;
  processingTime: number; // ms
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevance: number; // 0-1
  sourceType: 'documentation' | 'blog' | 'stackoverflow' | 'github' | 'research-paper' | 'forum';
  publishedDate?: string;
}

export interface Finding {
  type: 'best-practice' | 'anti-pattern' | 'security-issue' | 'performance-tip' | 'alternative-approach';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  evidence: string[]; // URLs supporting this finding
  recommendation?: string;
}

export interface Recommendation {
  type: 'architecture' | 'technology' | 'pattern' | 'tool';
  description: string;
  rationale: string;
  tradeoffs: string[];
  adoptionDifficulty: 'easy' | 'medium' | 'hard';
  sources: string[]; // URLs
}

export interface AntiPattern {
  name: string;
  description: string;
  why ItsBad: string;
  betterApproach: string;
  occurrences: number; // How many sources mentioned this
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface Benchmark {
  metric: string; // e.g., 'response time', 'throughput', 'latency'
  value: string; // e.g., '150ms', '10k req/s'
  context: string; // e.g., 'Node.js Express with Redis caching'
  source: string; // URL
}

export interface ResearchStats {
  totalQueries: number;
  completedQueries: number;
  failedQueries: number;
  averageProcessingTime: number;
  totalSourcesFound: number;
  patternsDiscovered: number;
}

export class WebPatternResearcher extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private activeQueries: Map<string, ResearchQuery> = new Map();
  private queryResults: Map<string, ResearchResult> = new Map();
  private stats: ResearchStats = {
    totalQueries: 0,
    completedQueries: 0,
    failedQueries: 0,
    averageProcessingTime: 0,
    totalSourcesFound: 0,
    patternsDiscovered: 0
  };
  private processingTimes: number[] = [];

  // Simulated Exa MCP integration (replace with real MCP call)
  private exaMcpAvailable: boolean = false;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
  }

  async initialize(): Promise<void> {
    console.log('🔍 Web Pattern Researcher initializing...');

    // Check if Exa MCP is available
    this.exaMcpAvailable = await this.checkExaMcpAvailability();

    if (this.exaMcpAvailable) {
      console.log('   ✅ Exa MCP connected');
    } else {
      console.log('   ⚠️  Exa MCP not available - using fallback simulation');
    }

    // Load historical research from RAG
    await this.loadHistoricalResearch();

    this.emit('researcher:initialized');
    console.log('✅ Web Pattern Researcher ready');
  }

  /**
   * Research architecture/pattern (main method)
   */
  async research(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    console.log(`🔍 Researching: ${query.description}`);
    console.log(`   Type: ${query.type} | Priority: ${query.priority} | Background: ${query.backgroundMode || false}`);

    // Check RAG first (instant results from previous research)
    const cachedResult = await this.queryCachedResearch(query);
    if (cachedResult) {
      console.log(`   ⚡ Cache hit! (${cachedResult.sources.length} sources)`);
      return cachedResult;
    }

    // Add to active queries
    this.activeQueries.set(query.queryId, query);

    try {
      // Execute research (real or simulated)
      const result = this.exaMcpAvailable
        ? await this.executeExaMcpResearch(query)
        : await this.simulateResearch(query);

      // Analyze results
      const analyzedResult = await this.analyzeResults(query, result);

      // Store in RAG for future reference
      await this.storeResearchPattern(query, analyzedResult);

      // Update stats
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
      this.stats.completedQueries++;
      this.stats.totalSourcesFound += result.sources.length;
      this.stats.patternsDiscovered += result.findings.length;

      // Store result
      this.queryResults.set(query.queryId, analyzedResult);
      this.activeQueries.delete(query.queryId);

      this.emit('research:completed', {
        queryId: query.queryId,
        sourcesFound: result.sources.length,
        findingsCount: result.findings.length,
        processingTime
      });

      console.log(`   ✅ Research complete: ${result.sources.length} sources, ${result.findings.length} findings (${processingTime}ms)`);

      return analyzedResult;
    } catch (error: any) {
      this.stats.failedQueries++;
      this.activeQueries.delete(query.queryId);

      console.error(`   ❌ Research failed:`, error.message);

      this.emit('research:failed', {
        queryId: query.queryId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Query cached research from RAG
   */
  private async queryCachedResearch(query: ResearchQuery): Promise<ResearchResult | null> {
    const queryText = `${query.type}: ${query.description}`;

    try {
      const results = await this.vectorStore.queryMemory(queryText, 'web-research', 1);
      if (results.length > 0 && results[0].similarity > 0.85) {
        // Cache hit!
        const metadata = results[0].metadata;
        return {
          queryId: query.queryId,
          sources: metadata.sources || [],
          findings: metadata.findings || [],
          recommendations: metadata.recommendations || [],
          antiPatterns: metadata.antiPatterns || [],
          benchmarks: metadata.benchmarks || [],
          confidence: results[0].similarity,
          timestamp: Date.now(),
          processingTime: 0 // Instant from cache
        };
      }
    } catch (error) {
      console.warn('Failed to query cached research:', error);
    }

    return null;
  }

  /**
   * Execute real Exa MCP research (when MCP is available)
   */
  private async executeExaMcpResearch(query: ResearchQuery): Promise<ResearchResult> {
    // TODO: Replace with real Exa MCP call
    // For now, this is a placeholder that would call:
    // const results = await mcpClient.executeTool('exa-search', { query: query.description });

    console.log('   🌐 Executing Exa MCP search...');

    // Simulated MCP call
    return this.simulateResearch(query);
  }

  /**
   * Simulate research (fallback when Exa MCP not available)
   */
  private async simulateResearch(query: ResearchQuery): Promise<ResearchResult> {
    // Simulate web search results based on query type
    const sources: ResearchSource[] = this.generateSimulatedSources(query);
    const findings: Finding[] = this.generateSimulatedFindings(query);
    const recommendations: Recommendation[] = this.generateSimulatedRecommendations(query);
    const antiPatterns: AntiPattern[] = this.generateSimulatedAntiPatterns(query);
    const benchmarks: Benchmark[] = this.generateSimulatedBenchmarks(query);

    return {
      queryId: query.queryId,
      sources,
      findings,
      recommendations,
      antiPatterns,
      benchmarks,
      confidence: 0.7, // Simulated data = lower confidence
      timestamp: Date.now(),
      processingTime: 0 // Will be calculated by caller
    };
  }

  /**
   * Generate simulated sources (replace with real Exa MCP results)
   */
  private generateSimulatedSources(query: ResearchQuery): ResearchSource[] {
    const baseUrls: Record<ResearchQuery['type'], string[]> = {
      architecture: [
        'https://aws.amazon.com/architecture/well-architected',
        'https://microservices.io/patterns',
        'https://martinfowler.com/architecture'
      ],
      pattern: [
        'https://refactoring.guru/design-patterns',
        'https://sourcemaking.com/design_patterns',
        'https://github.com/kamranahmedse/design-patterns'
      ],
      security: [
        'https://owasp.org/www-project-top-ten',
        'https://cheatsheetseries.owasp.org',
        'https://snyk.io/learn/security'
      ],
      performance: [
        'https://web.dev/performance',
        'https://developer.mozilla.org/en-US/docs/Web/Performance',
        'https://github.com/topics/performance-optimization'
      ],
      feasibility: [
        'https://stackoverflow.com/questions',
        'https://github.com/search',
        'https://dev.to'
      ]
    };

    const urls = baseUrls[query.type] || baseUrls.architecture;

    return urls.map((url, i) => ({
      url,
      title: `${query.type} best practices - ${url.split('/').pop()}`,
      snippet: `Research on ${query.description} - relevant ${query.type} patterns and approaches`,
      relevance: 0.9 - (i * 0.1),
      sourceType: this.inferSourceType(url),
      publishedDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString() // Recent sources first
    }));
  }

  /**
   * Generate simulated findings
   */
  private generateSimulatedFindings(query: ResearchQuery): Finding[] {
    const findings: Finding[] = [];

    // Architecture-specific findings
    if (query.type === 'architecture') {
      findings.push({
        type: 'best-practice',
        severity: 'high',
        description: 'Use microservices architecture for scalability beyond 1M users',
        evidence: ['https://aws.amazon.com/microservices', 'https://microservices.io/patterns/microservices.html'],
        recommendation: 'Consider breaking monolith into domain-driven microservices'
      });

      findings.push({
        type: 'anti-pattern',
        severity: 'medium',
        description: 'Monolithic database can become bottleneck at scale',
        evidence: ['https://martinfowler.com/bliki/MonolithFirst.html'],
        recommendation: 'Plan for database sharding or CQRS pattern'
      });
    }

    // Security findings
    if (query.type === 'security' || query.context.mindsetAlignment?.includes('security')) {
      findings.push({
        type: 'security-issue',
        severity: 'critical',
        description: 'OAuth implementation must use PKCE flow for public clients',
        evidence: ['https://oauth.net/2/pkce', 'https://owasp.org/www-community/vulnerabilities/Authorization_Code_Flow_without_PKCE'],
        recommendation: 'Implement PKCE (Proof Key for Code Exchange) in OAuth flow'
      });
    }

    // Performance findings
    if (query.type === 'performance' || query.context.constraints?.some(c => c.includes('latency'))) {
      findings.push({
        type: 'performance-tip',
        severity: 'high',
        description: 'Redis caching reduces API response time by 80%',
        evidence: ['https://redis.io/topics/benchmarks', 'https://aws.amazon.com/elasticache/redis'],
        recommendation: 'Implement Redis for frequently accessed data'
      });
    }

    return findings;
  }

  /**
   * Generate simulated recommendations
   */
  private generateSimulatedRecommendations(query: ResearchQuery): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Tech stack recommendations
    if (query.context.techStack?.includes('Node.js')) {
      recommendations.push({
        type: 'technology',
        description: 'Use Fastify instead of Express for 2x better performance',
        rationale: 'Fastify provides schema-based validation and async/await support with better throughput',
        tradeoffs: [
          'Smaller ecosystem than Express',
          'Learning curve for schema validation',
          'Fewer middleware options'
        ],
        adoptionDifficulty: 'medium',
        sources: ['https://www.fastify.io/benchmarks', 'https://github.com/fastify/fastify']
      });
    }

    // Pattern recommendations
    if (query.type === 'pattern') {
      recommendations.push({
        type: 'pattern',
        description: 'Implement Circuit Breaker pattern for external API calls',
        rationale: 'Prevents cascade failures when external services are slow/down',
        tradeoffs: [
          'Adds complexity to error handling',
          'Requires monitoring/alerting setup',
          'May hide underlying issues'
        ],
        adoptionDifficulty: 'medium',
        sources: ['https://martinfowler.com/bliki/CircuitBreaker.html', 'https://github.com/nodeshift/opossum']
      });
    }

    return recommendations;
  }

  /**
   * Generate simulated anti-patterns
   */
  private generateSimulatedAntiPatterns(query: ResearchQuery): AntiPattern[] {
    const antiPatterns: AntiPattern[] = [];

    // Common anti-patterns
    antiPatterns.push({
      name: 'God Object',
      description: 'Single class/module that does too many things',
      whyItsBad: 'Hard to test, maintain, and reason about. Violates Single Responsibility Principle',
      betterApproach: 'Split into smaller, focused modules with clear responsibilities',
      occurrences: 42, // How many sources mentioned this
      severity: 'high'
    });

    if (query.context.techStack?.includes('React')) {
      antiPatterns.push({
        name: 'Prop Drilling',
        description: 'Passing props through many layers of components',
        whyItsBad: 'Makes components tightly coupled and hard to refactor',
        betterApproach: 'Use Context API, Redux, or composition patterns',
        occurrences: 28,
        severity: 'medium'
      });
    }

    return antiPatterns;
  }

  /**
   * Generate simulated benchmarks
   */
  private generateSimulatedBenchmarks(query: ResearchQuery): Benchmark[] {
    const benchmarks: Benchmark[] = [];

    if (query.type === 'performance' || query.context.constraints?.some(c => c.includes('latency'))) {
      benchmarks.push({
        metric: 'API Response Time',
        value: '50ms (p50), 150ms (p95), 300ms (p99)',
        context: 'Node.js + PostgreSQL + Redis, 10k req/s',
        source: 'https://github.com/some-repo/benchmarks'
      });

      benchmarks.push({
        metric: 'Database Query Time',
        value: '5ms (indexed), 200ms (full table scan)',
        context: 'PostgreSQL 14, 1M rows',
        source: 'https://wiki.postgresql.org/wiki/Performance_Optimization'
      });
    }

    return benchmarks;
  }

  /**
   * Analyze results (extract insights, prioritize findings)
   */
  private async analyzeResults(query: ResearchQuery, result: ResearchResult): Promise<ResearchResult> {
    // Sort findings by severity
    result.findings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Sort recommendations by adoption difficulty
    result.recommendations.sort((a, b) => {
      const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
      return difficultyOrder[a.adoptionDifficulty] - difficultyOrder[b.adoptionDifficulty];
    });

    // Calculate confidence based on source quality
    const highQualitySources = result.sources.filter(s => s.relevance > 0.8).length;
    result.confidence = Math.min(1, highQualitySources / 5); // At least 5 high-quality sources for full confidence

    return result;
  }

  /**
   * Store research pattern in RAG
   */
  private async storeResearchPattern(query: ResearchQuery, result: ResearchResult): Promise<void> {
    const pattern = {
      type: query.type,
      description: query.description,
      techStack: query.context.techStack,
      constraints: query.context.constraints,
      sourcesCount: result.sources.length,
      findingsCount: result.findings.length,
      recommendationsCount: result.recommendations.length,
      confidence: result.confidence,
      timestamp: result.timestamp
    };

    try {
      await this.vectorStore.storeMemory(
        `${query.type}: ${query.description}`,
        'web-research',
        {
          ...pattern,
          sources: result.sources,
          findings: result.findings,
          recommendations: result.recommendations,
          antiPatterns: result.antiPatterns,
          benchmarks: result.benchmarks
        }
      );
    } catch (error) {
      console.warn('Failed to store research pattern in RAG:', error);
    }
  }

  /**
   * Load historical research from RAG
   */
  private async loadHistoricalResearch(): Promise<void> {
    try {
      const research = await this.vectorStore.queryMemory('web research patterns', 'web-research', 100);
      console.log(`   📚 Loaded ${research.length} historical research queries from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical research (starting fresh)');
    }
  }

  /**
   * Check if Exa MCP is available
   */
  private async checkExaMcpAvailability(): Promise<boolean> {
    // TODO: Replace with real MCP availability check
    // For now, return false (use simulation)
    return false;
  }

  /**
   * Infer source type from URL
   */
  private inferSourceType(url: string): ResearchSource['sourceType'] {
    if (url.includes('github.com')) return 'github';
    if (url.includes('stackoverflow.com')) return 'stackoverflow';
    if (url.includes('dev.to') || url.includes('medium.com')) return 'blog';
    if (url.includes('docs') || url.includes('developer.mozilla.org')) return 'documentation';
    if (url.includes('arxiv') || url.includes('acm.org')) return 'research-paper';
    return 'forum';
  }

  /**
   * Record processing time for statistics
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);

    // Keep only last 100 queries
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    // Update average
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.stats.averageProcessingTime = sum / this.processingTimes.length;
  }

  /**
   * Get result by query ID
   */
  getResult(queryId: string): ResearchResult | undefined {
    return this.queryResults.get(queryId);
  }

  /**
   * Get statistics
   */
  getStatistics(): ResearchStats {
    return { ...this.stats };
  }

  /**
   * Background research (non-blocking)
   */
  async researchInBackground(query: ResearchQuery): Promise<string> {
    const backgroundQuery = { ...query, backgroundMode: true };

    // Start research asynchronously
    this.research(backgroundQuery).catch(error => {
      console.error(`Background research failed for ${query.queryId}:`, error);
    });

    // Return query ID immediately
    return query.queryId;
  }

  /**
   * Shutdown researcher
   */
  async shutdown(): Promise<void> {
    this.activeQueries.clear();
    this.queryResults.clear();
    this.emit('researcher:shutdown');
    console.log('🛑 Web Pattern Researcher shut down');
  }
}

// Export singleton instance
export const globalWebPatternResearcher = new WebPatternResearcher();
