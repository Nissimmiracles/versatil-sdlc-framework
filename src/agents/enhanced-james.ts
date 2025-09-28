import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { PromptGenerator } from '../intelligence/prompt-generator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export class EnhancedJames extends RAGEnabledAgent {
  name = 'EnhancedJames';
  id = 'enhanced-james';
  specialization = 'Frontend Specialist - React/Vue Expert, UI/UX, Performance Optimization';
  systemPrompt = 'Frontend architect specializing in modern component architecture, responsive design, accessibility, and web performance';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
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
}