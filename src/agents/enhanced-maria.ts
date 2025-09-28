import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { PromptGenerator } from '../intelligence/prompt-generator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export class EnhancedMaria extends RAGEnabledAgent {
  name = 'EnhancedMaria';
  id = 'enhanced-maria';
  specialization = 'Quality Assurance Lead - Test Coverage, Bug Detection, Quality Gates';
  systemPrompt = 'Senior QA Engineer with expertise in testing strategy, quality assurance, and comprehensive test coverage analysis';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
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
}
