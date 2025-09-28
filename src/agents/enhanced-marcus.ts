import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { PromptGenerator } from '../intelligence/prompt-generator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export class EnhancedMarcus extends RAGEnabledAgent {
  name = 'EnhancedMarcus';
  id = 'enhanced-marcus';
  specialization = 'Backend Expert - API Architecture, Database Optimization, Security Specialist';
  systemPrompt = 'Backend architect and security expert specializing in Node.js, microservices, secure API design, and database optimization';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Backend-specific RAG configuration
   */
  protected getDefaultRAGConfig(): RAGConfig {
    return {
      maxExamples: 3,
      similarityThreshold: 0.8,
      agentDomain: 'backend',
      enableLearning: true
    };
  }

  /**
   * Run backend-specific pattern analysis
   */
  protected async runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult> {
    return PatternAnalyzer.analyzeBackend(context.content, context.filePath);
  }

  /**
   * Generate backend-specific base prompt template
   */
  protected getBasePromptTemplate(): string {
    return `---
name: enhanced-marcus-backend-rag
description: RAG-Enhanced Backend Analysis
model: sonnet
agent: Enhanced Marcus
---

You are **Enhanced Marcus**, a backend architect and security expert with 10+ years of experience in Node.js, microservices, secure API design, and database optimization.

## Your Core Mission
Provide comprehensive backend analysis with historical architecture patterns and proven security solutions.

## Backend Focus Areas:
1. **API Architecture**
   - Analyze API design patterns and RESTful principles
   - Evaluate microservices architecture decisions
   - Review API documentation and contract adherence

2. **Security Analysis**
   - Identify OWASP Top 10 vulnerabilities
   - Review authentication and authorization patterns
   - Validate input sanitization and validation

3. **Database Optimization**
   - Analyze query performance and indexing strategies
   - Review data modeling and relationships
   - Suggest optimization based on proven patterns

4. **Performance & Scalability**
   - Identify bottlenecks and optimization opportunities
   - Evaluate caching strategies and implementation
   - Review concurrent processing and async patterns

5. **Infrastructure & DevOps**
   - Analyze deployment patterns and configuration
   - Review monitoring and logging implementation
   - Validate error handling and recovery strategies

6. **Code Quality & Patterns**
   - Apply SOLID principles and design patterns
   - Review dependency injection and modularity
   - Ensure maintainable and testable code structure
`;
  }

  /**
   * Generate backend-specific handoffs based on analysis
   */
  protected generateDomainHandoffs(analysis: AnalysisResult): string[] {
    const handoffs: string[] = [];

    const securityIssues = analysis.patterns.filter(p => p.category === 'security');
    if (securityIssues.length > 0) {
      handoffs.push('security-sam');
    }
    if (analysis.patterns.some(p => p.category === 'performance' || p.type.includes('optimization'))) {
      handoffs.push('devops-dan');
    }
    if (analysis.score < 70) {
      handoffs.push('enhanced-maria');
    }
    if (analysis.patterns.some(p => p.type.includes('frontend') || p.type.includes('api-client'))) {
      handoffs.push('enhanced-james');
    }

    return handoffs;
  }

  /**
   * Enhanced backend analysis with RAG context specialization using Edge Functions
   */
  protected async retrieveRelevantContext(
    context: AgentActivationContext,
    analysis: AnalysisResult
  ): Promise<AgentRAGContext> {
    const ragContext = await super.retrieveRelevantContext(context, analysis);

    // Backend-specific enhancements using production Edge Functions
    if (this.vectorStore) {
      try {
        // Use Marcus RAG Edge Function for production-ready Backend intelligence
        const marcusRAGResult = await this.vectorStore.marcusRAG(
          this.generateRAGQuery(context, analysis),
          {
            filePath: context.filePath,
            content: context.content,
            language: this.detectLanguage(context.filePath),
            framework: this.detectFramework(context.content),
            apiType: this.detectAPIType(context.content),
            dbType: this.detectDatabaseType(context.content)
          },
          this.ragConfig
        );

        if (marcusRAGResult.success && marcusRAGResult.data) {
          // Integrate Edge Function results with existing RAG context
          ragContext.similarCode = [
            ...ragContext.similarCode,
            ...marcusRAGResult.data.apiPatterns.map((pattern: any) => ({
              id: pattern.id,
              content: pattern.code_content,
              contentType: 'code',
              metadata: {
                ...pattern.metadata,
                relevanceScore: pattern.similarity,
                agentId: this.id,
                timestamp: Date.now(),
                pattern_type: pattern.pattern_type,
                language: pattern.language,
                framework: pattern.framework,
                quality_score: pattern.quality_score
              }
            }))
          ];

          ragContext.projectStandards = [
            ...ragContext.projectStandards,
            ...marcusRAGResult.data.securityPatterns.map((pattern: any) => ({
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

          ragContext.agentExpertise = [
            ...ragContext.agentExpertise,
            ...marcusRAGResult.data.performancePatterns.map((pattern: any) => ({
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
            })),
            ...marcusRAGResult.data.databaseOptimizations.map((optimization: any) => ({
              id: optimization.id,
              content: optimization.solution_code,
              contentType: 'code',
              metadata: {
                agentId: this.id,
                timestamp: Date.now(),
                relevanceScore: optimization.similarity,
                solution_explanation: optimization.solution_explanation,
                effectiveness_score: optimization.effectiveness_score
              }
            }))
          ];

          // Store RAG insights for prompt generation
          ragContext.metadata = {
            ...ragContext.metadata,
            marcusRAGInsights: marcusRAGResult.data.ragInsights,
            edgeFunctionUsed: true,
            processingTime: marcusRAGResult.metadata?.processingTime || 0
          };
        }
      } catch (error) {
        console.warn('Marcus RAG Edge Function failed, using fallback:', error.message);
        // Fallback to original local methods
        const apiPatterns = await this.retrieveAPIPatterns(context);
        ragContext.similarCode = [...ragContext.similarCode, ...apiPatterns];

        const securityPatterns = await this.retrieveSecurityPatterns(context, analysis);
        ragContext.projectStandards = [...ragContext.projectStandards, ...securityPatterns];

        const performancePatterns = await this.retrievePerformancePatterns(context);
        ragContext.agentExpertise = [...ragContext.agentExpertise, ...performancePatterns];
      }
    }

    return ragContext;
  }

  /**
   * Generate optimized RAG query for Marcus's Backend domain
   */
  private generateRAGQuery(context: AgentActivationContext, analysis: AnalysisResult): string {
    const framework = this.detectFramework(context.content);
    const apiType = this.detectAPIType(context.content);
    const dbType = this.detectDatabaseType(context.content);
    const language = this.detectLanguage(context.filePath);

    // Generate context-aware query for Backend patterns
    const patterns = analysis.patterns.map(p => p.type).join(' ');
    const hasSecurityIssues = analysis.patterns.some(p => p.category === 'security');
    const hasPerformanceIssues = analysis.patterns.some(p => p.category === 'performance');

    let queryTerms = [framework, apiType, dbType, language];

    if (hasSecurityIssues) {
      queryTerms.push('security authentication authorization validation');
    }
    if (hasPerformanceIssues) {
      queryTerms.push('performance optimization caching database queries');
    }
    if (patterns) {
      queryTerms.push(patterns);
    }

    return queryTerms.join(' ').trim();
  }

  /**
   * Retrieve backend API patterns and architecture examples
   */
  private async retrieveAPIPatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const apiType = this.detectAPIType(context.content);
    const framework = this.detectFramework(context.content);

    const query = {
      query: `${framework} ${apiType} API patterns backend architecture ${this.detectLanguage(context.filePath)}`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['api', 'backend', framework.toLowerCase(), apiType, 'pattern'],
        contentTypes: ['code']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve API patterns:', error.message);
      return [];
    }
  }

  /**
   * Retrieve security patterns and implementations
   */
  private async retrieveSecurityPatterns(context: AgentActivationContext, analysis: AnalysisResult) {
    if (!this.vectorStore) return [];

    // Focus on security issues found in the analysis
    const securityIssues = analysis.patterns.filter(p => p.category === 'security');
    const securityTypes = securityIssues.map(issue => issue.type).join(' ');

    const query = {
      query: `security best practices ${securityTypes} authentication authorization validation`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 3,
      filters: {
        tags: ['security', 'authentication', 'authorization', 'validation', 'best-practice'],
        contentTypes: ['text', 'code']
      }
    };

    try {
      const result = await this.vectorStore.queryMemories(query);
      return result.documents || [];
    } catch (error) {
      console.warn('Failed to retrieve security patterns:', error.message);
      return [];
    }
  }

  /**
   * Retrieve performance optimization patterns
   */
  private async retrievePerformancePatterns(context: AgentActivationContext) {
    if (!this.vectorStore) return [];

    const framework = this.detectFramework(context.content);
    const dbType = this.detectDatabaseType(context.content);

    const query = {
      query: `${framework} ${dbType} performance optimization caching database queries`,
      queryType: 'semantic' as const,
      agentId: this.id,
      topK: 2,
      filters: {
        tags: ['performance', 'optimization', 'caching', 'database'],
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
   * Detect API type for better RAG retrieval
   */
  private detectAPIType(content: string): string {
    if (content.includes('GraphQL') || content.includes('gql`')) return 'graphql';
    if (content.includes('tRPC') || content.includes('trpc')) return 'trpc';
    if (content.includes('app.get') || content.includes('app.post')) return 'rest';
    if (content.includes('router.') || content.includes('route')) return 'rest';
    if (content.includes('websocket') || content.includes('ws')) return 'websocket';
    return 'api';
  }

  /**
   * Detect database type for optimization patterns
   */
  private detectDatabaseType(content: string): string {
    if (content.includes('mongoose') || content.includes('MongoDB')) return 'mongodb';
    if (content.includes('prisma') || content.includes('Prisma')) return 'prisma';
    if (content.includes('sequelize') || content.includes('Sequelize')) return 'sequelize';
    if (content.includes('typeorm') || content.includes('TypeORM')) return 'typeorm';
    if (content.includes('postgresql') || content.includes('pg')) return 'postgresql';
    if (content.includes('mysql') || content.includes('MySQL')) return 'mysql';
    if (content.includes('redis') || content.includes('Redis')) return 'redis';
    return 'database';
  }
}