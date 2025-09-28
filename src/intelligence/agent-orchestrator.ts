/**
 * VERSATIL SDLC Framework - Agent Orchestrator Layer
 *
 * Coordinates the three-tier intelligence system:
 * - Level 1: Pattern Analysis (no AI needed)
 * - Level 2: Prompt Generation (for IDE execution)
 * - Level 3: Optional AI API (when configured)
 */

import { PatternAnalyzer, AnalysisResult } from './pattern-analyzer.js';
import { PromptGenerator, PromptContext, GeneratedPrompt } from './prompt-generator.js';
import { AIIntegration, AnalysisResponse, createFromEnv } from './ai-integration.js';
import { AgentRegistry } from '../agents/agent-registry.js';
import { EnhancedVectorMemoryStore, MemoryDocument, RAGQuery } from '../rag/enhanced-vector-memory-store.js';

export interface FileContext {
  filePath: string;
  content: string;
  language?: string;
  projectName?: string;
  userRequest?: string;
}

export interface RAGContext {
  similarPatterns: MemoryDocument[];
  relevantSolutions: MemoryDocument[];
  projectConventions: MemoryDocument[];
  agentExpertise: MemoryDocument[];
}

export interface OrchestrationResult {
  agent: string;
  filePath: string;
  level1: AnalysisResult;
  level2: GeneratedPrompt;
  level3?: any;
  ragContext?: RAGContext;
  mode: 'patterns-only' | 'prompt-ready' | 'ai-enhanced' | 'rag-enhanced';
  nextSteps: string[];
  executionRecommendation: string;
}

export class AgentOrchestrator {
  private agentRegistry: AgentRegistry;
  private aiIntegration: AIIntegration;
  private vectorMemoryStore?: EnhancedVectorMemoryStore;
  private ragEnabled: boolean;

  constructor(aiIntegration?: AIIntegration, vectorMemoryStore?: EnhancedVectorMemoryStore) {
    this.agentRegistry = new AgentRegistry();
    this.aiIntegration = aiIntegration || createFromEnv();
    this.vectorMemoryStore = vectorMemoryStore;
    this.ragEnabled = !!vectorMemoryStore;
  }

  /**
   * Orchestrate complete analysis for a file with RAG-enhanced intelligence
   */
  async analyzeFile(context: FileContext): Promise<OrchestrationResult> {
    // Step 1: Select appropriate agent
    const agent = this.selectAgent(context);

    // Step 2: Retrieve RAG context if enabled
    let ragContext: RAGContext | undefined;
    if (this.ragEnabled && this.vectorMemoryStore) {
      ragContext = await this.retrieveRAGContext(context, agent);
    }

    // Step 3: Run Level 1 - Pattern Analysis (enhanced with RAG context)
    const level1 = this.runPatternAnalysis(agent, context, ragContext);

    // Step 4: Run Level 2 - Prompt Generation (enhanced with RAG examples)
    const language = context.language || this.detectLanguage(context.filePath);
    const promptContext: PromptContext = {
      filePath: context.filePath,
      content: context.content,
      language,
      projectName: context.projectName || 'Unknown Project',
      userRequest: context.userRequest,
      analysisResult: level1,
      ragContext // Add RAG context to prompt generation
    };

    const level2 = PromptGenerator.generatePrompt(agent, promptContext);

    // Step 5: Optionally run Level 3 - AI API
    const analysis = await this.aiIntegration.executeAnalysis(level1, level2);

    // Step 6: Store successful patterns and solutions back to vector memory
    if (this.ragEnabled && this.vectorMemoryStore && analysis.level1) {
      await this.storeSuccessfulPatterns(context, agent, analysis.level1, ragContext);
    }

    // Step 7: Determine next steps (enhanced with RAG insights)
    const nextSteps = this.determineNextSteps(level1, level2, analysis.mode, ragContext);

    const mode = this.ragEnabled && ragContext ? 'rag-enhanced' : analysis.mode;

    return {
      agent,
      filePath: context.filePath,
      level1: analysis.level1,
      level2: analysis.level2,
      level3: analysis.level3,
      ragContext,
      mode,
      nextSteps,
      executionRecommendation: this.getExecutionRecommendation(mode, level2, ragContext)
    };
  }

  /**
   * Retrieve RAG context for enhanced analysis
   */
  private async retrieveRAGContext(context: FileContext, agent: string): Promise<RAGContext> {
    if (!this.vectorMemoryStore) {
      return {
        similarPatterns: [],
        relevantSolutions: [],
        projectConventions: [],
        agentExpertise: []
      };
    }

    const language = this.detectLanguage(context.filePath);
    const fileType = context.filePath.split('.').pop() || '';

    // Create a semantic query from the file content
    const queryText = this.createSemanticQuery(context.content, context.filePath);

    try {
      // Retrieve similar patterns for this agent domain
      const similarPatternsQuery: RAGQuery = {
        query: queryText,
        queryType: 'semantic',
        agentId: agent,
        topK: 5,
        filters: {
          tags: [language, fileType, 'pattern'],
          contentTypes: ['code']
        }
      };

      // Retrieve relevant solutions from previous fixes
      const solutionsQuery: RAGQuery = {
        query: queryText,
        queryType: 'semantic',
        agentId: agent,
        topK: 3,
        filters: {
          tags: [language, fileType, 'solution'],
          contentTypes: ['code']
        }
      };

      // Retrieve project conventions and standards
      const conventionsQuery: RAGQuery = {
        query: `${language} conventions standards`,
        queryType: 'semantic',
        topK: 3,
        filters: {
          tags: [language, 'convention', 'standard'],
          contentTypes: ['text', 'code']
        }
      };

      // Retrieve agent-specific expertise
      const expertiseQuery: RAGQuery = {
        query: queryText,
        queryType: 'semantic',
        agentId: agent,
        topK: 5,
        filters: {
          tags: [agent, 'expertise', language],
          contentTypes: ['code', 'text']
        }
      };

      // Execute all queries in parallel
      const [similarPatterns, relevantSolutions, projectConventions, agentExpertise] = await Promise.all([
        this.vectorMemoryStore.queryMemories(similarPatternsQuery),
        this.vectorMemoryStore.queryMemories(solutionsQuery),
        this.vectorMemoryStore.queryMemories(conventionsQuery),
        this.vectorMemoryStore.queryMemories(expertiseQuery)
      ]);

      return {
        similarPatterns: similarPatterns.documents || [],
        relevantSolutions: relevantSolutions.documents || [],
        projectConventions: projectConventions.documents || [],
        agentExpertise: agentExpertise.documents || []
      };
    } catch (error) {
      console.warn('Failed to retrieve RAG context:', error);
      return {
        similarPatterns: [],
        relevantSolutions: [],
        projectConventions: [],
        agentExpertise: []
      };
    }
  }

  /**
   * Create a semantic query from file content
   */
  private createSemanticQuery(content: string, filePath: string): string {
    // Extract key concepts, function names, and patterns
    const lines = content.split('\n');
    const keywords: string[] = [];

    // Extract function/class/component names
    const functionMatches = content.match(/(?:function|class|const|let|var)\s+(\w+)/g);
    if (functionMatches) {
      keywords.push(...functionMatches.map(match => match.split(/\s+/)[1]));
    }

    // Extract import/require statements
    const importMatches = content.match(/(?:import|require|from)\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      keywords.push(...importMatches.map(match => match.match(/['"`]([^'"`]+)['"`]/)?.[1] || ''));
    }

    // Add file path context
    const pathParts = filePath.split('/').filter(part => part && !part.includes('.'));
    keywords.push(...pathParts);

    // Create a concise semantic query
    const uniqueKeywords = [...new Set(keywords)].filter(k => k && k.length > 2).slice(0, 10);
    return uniqueKeywords.join(' ') || content.slice(0, 200);
  }

  /**
   * Store successful patterns and solutions back to vector memory
   */
  private async storeSuccessfulPatterns(
    context: FileContext,
    agent: string,
    analysisResult: AnalysisResult,
    ragContext?: RAGContext
  ): Promise<void> {
    if (!this.vectorMemoryStore) return;

    try {
      const language = this.detectLanguage(context.filePath);
      const fileType = context.filePath.split('.').pop() || '';

      // Store high-quality code patterns (score >= 80)
      if (analysisResult.score >= 80) {
        const patternDoc: MemoryDocument = {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: context.content,
          contentType: 'code',
          metadata: {
            agentId: agent,
            timestamp: Date.now(),
            fileType,
            projectContext: context.projectName || 'Unknown',
            tags: [language, fileType, 'pattern', 'high-quality', agent],
            relevanceScore: analysisResult.score / 100,
            language,
            framework: this.detectFramework(context.content)
          }
        };

        await this.vectorMemoryStore.storeMemory(patternDoc);
      }

      // Store detected patterns for learning
      if (analysisResult.patterns && analysisResult.patterns.length > 0) {
        for (const pattern of analysisResult.patterns) {
          const patternDoc: MemoryDocument = {
            id: `detected_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: pattern.suggestion || pattern.message,
            contentType: 'text',
            metadata: {
              agentId: agent,
              timestamp: Date.now(),
              fileType,
              projectContext: context.projectName || 'Unknown',
              tags: [language, fileType, pattern.type, pattern.category, agent],
              relevanceScore: pattern.severity === 'critical' ? 1.0 :
                             pattern.severity === 'high' ? 0.8 :
                             pattern.severity === 'medium' ? 0.6 : 0.4,
              language
            }
          };

          await this.vectorMemoryStore.storeMemory(patternDoc);
        }
      }
    } catch (error) {
      console.warn('Failed to store patterns to vector memory:', error);
    }
  }

  /**
   * Detect framework from code content
   */
  private detectFramework(content: string): string {
    if (content.includes('react') || content.includes('useState') || content.includes('useEffect')) {
      return 'React';
    }
    if (content.includes('vue') || content.includes('Vue')) {
      return 'Vue';
    }
    if (content.includes('angular') || content.includes('Angular')) {
      return 'Angular';
    }
    if (content.includes('express') || content.includes('app.get') || content.includes('app.post')) {
      return 'Express';
    }
    if (content.includes('fastify')) {
      return 'Fastify';
    }
    if (content.includes('jest') || content.includes('describe') || content.includes('it(')) {
      return 'Jest';
    }
    return '';
  }

  /**
   * Select appropriate agent based on file context
   */
  private selectAgent(context: FileContext): string {
    const { filePath, content, userRequest } = context;

    // Priority 1: User explicitly requests an agent
    if (userRequest) {
      if (userRequest.toLowerCase().includes('test') || userRequest.toLowerCase().includes('qa')) {
        return 'enhanced-maria';
      }
      if (userRequest.toLowerCase().includes('frontend') || userRequest.toLowerCase().includes('ui')) {
        return 'enhanced-james';
      }
      if (userRequest.toLowerCase().includes('backend') || userRequest.toLowerCase().includes('api')) {
        return 'enhanced-marcus';
      }
      if (userRequest.toLowerCase().includes('project') || userRequest.toLowerCase().includes('plan')) {
        return 'sarah-pm';
      }
    }

    // Priority 2: File path patterns
    if (filePath.includes('test') || filePath.includes('spec') || filePath.includes('__tests__')) {
      return 'enhanced-maria';
    }

    if (filePath.match(/\.(jsx|tsx|vue|svelte)$/)) {
      return 'enhanced-james';
    }

    if (filePath.includes('component') || filePath.includes('ui/') || filePath.includes('pages/')) {
      return 'enhanced-james';
    }

    if (filePath.includes('api') || filePath.includes('server') || filePath.includes('backend')) {
      return 'enhanced-marcus';
    }

    if (filePath.match(/\.(md|txt)$/) || filePath.includes('README')) {
      return 'sarah-pm';
    }

    // Priority 3: Content analysis
    if (content.includes('describe(') || content.includes('it(') || content.includes('test(')) {
      return 'enhanced-maria';
    }

    if (content.includes('useState') || content.includes('useEffect') || content.includes('<')) {
      return 'enhanced-james';
    }

    if (content.includes('app.get') || content.includes('app.post') || content.includes('router.')) {
      return 'enhanced-marcus';
    }

    // Default: Use Maria for QA analysis
    return 'enhanced-maria';
  }

  /**
   * Run pattern analysis based on agent (enhanced with RAG context)
   */
  private runPatternAnalysis(agent: string, context: FileContext, ragContext?: RAGContext): AnalysisResult {
    switch (agent) {
      case 'enhanced-maria':
      case 'maria-qa':
        return PatternAnalyzer.analyzeQA(context.content, context.filePath, ragContext);

      case 'enhanced-james':
      case 'james-frontend':
        return PatternAnalyzer.analyzeFrontend(context.content, context.filePath, ragContext);

      case 'enhanced-marcus':
      case 'marcus-backend':
        return PatternAnalyzer.analyzeBackend(context.content, context.filePath, ragContext);

      default:
        // Generic analysis for other agents
        return PatternAnalyzer.analyzeQA(context.content, context.filePath, ragContext);
    }
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascriptreact',
      'ts': 'typescript',
      'tsx': 'typescriptreact',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'vue': 'vue',
      'svelte': 'svelte',
      'md': 'markdown'
    };

    return langMap[ext] || 'plaintext';
  }

  /**
   * Determine next steps based on analysis (enhanced with RAG insights)
   */
  private determineNextSteps(
    level1: AnalysisResult,
    level2: GeneratedPrompt,
    mode: string,
    ragContext?: RAGContext
  ): string[] {
    const steps: string[] = [];

    // Critical issues require immediate action
    const critical = level1.patterns.filter(p => p.severity === 'critical');
    if (critical.length > 0) {
      steps.push(`🚨 Address ${critical.length} critical issues immediately`);
    }

    // Mode-specific recommendations
    if (mode === 'patterns-only') {
      steps.push('📋 Review pattern analysis results');
      steps.push('🔧 Configure ANTHROPIC_API_KEY for AI-enhanced analysis');
    }

    if (mode === 'prompt-ready') {
      steps.push('💡 Copy generated prompt to Claude Code/Cursor');
      steps.push('🎯 Execute prompt in IDE for intelligent analysis');
    }

    if (mode === 'ai-enhanced') {
      steps.push('✅ Review AI-generated recommendations');
      steps.push('🔄 Implement suggested improvements');
    }

    if (mode === 'rag-enhanced') {
      steps.push('🧠 Review RAG-enhanced analysis');
      steps.push('🎯 Apply best practices from similar patterns');
      if (ragContext?.relevantSolutions.length) {
        steps.push(`💡 Consider ${ragContext.relevantSolutions.length} similar solutions`);
      }
    }

    // Agent handoffs
    if (level2.handoffSuggestions.length > 0) {
      steps.push(`🤝 Coordinate with: ${level2.handoffSuggestions.join(', ')}`);
    }

    return steps;
  }

  /**
   * Get execution recommendation for user (enhanced with RAG context)
   */
  private getExecutionRecommendation(mode: string, prompt: GeneratedPrompt, ragContext?: RAGContext): string {
    if (mode === 'ai-enhanced') {
      return '✅ AI analysis complete. Review recommendations above and implement suggested changes.';
    }

    if (mode === 'rag-enhanced') {
      const ragInsights = ragContext ? [
        `🧠 Found ${ragContext.similarPatterns.length} similar patterns`,
        `💡 ${ragContext.relevantSolutions.length} proven solutions available`,
        `📋 ${ragContext.projectConventions.length} project conventions applied`,
        `🎯 ${ragContext.agentExpertise.length} expert insights integrated`
      ].join('\n') : '';

      return `🚀 **RAG-Enhanced Analysis Complete**\n\n${ragInsights}\n\nThe analysis has been enriched with project-specific knowledge and proven patterns. Review the enhanced recommendations above.`;
    }

    if (mode === 'prompt-ready') {
      return `🎯 **For Claude Code/Cursor Users**:\n\n1. Copy the prompt below\n2. Open Claude Code/Cursor chat\n3. Paste and execute\n4. Get intelligent analysis\n\n---\n\n${prompt.prompt}\n\n---`;
    }

    return '📊 Pattern analysis complete. Configure ANTHROPIC_API_KEY for enhanced features.';
  }

  /**
   * Get AI integration status
   */
  getAIStatus() {
    return this.aiIntegration.getStatus();
  }

  /**
   * Batch analyze multiple files
   */
  async analyzeFiles(contexts: FileContext[]): Promise<OrchestrationResult[]> {
    return Promise.all(contexts.map(ctx => this.analyzeFile(ctx)));
  }

  /**
   * Get agent information
   */
  getAgentInfo(agentId: string) {
    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return {
      id: agentId,
      name: agent.name,
      specialization: agent.specialization
    };
  }

  /**
   * List all available agents
   */
  listAgents() {
    return this.agentRegistry.getStatus();
  }
}

/**
 * Create orchestrator with environment configuration and optional RAG support
 */
export function createOrchestrator(vectorMemoryStore?: EnhancedVectorMemoryStore): AgentOrchestrator {
  return new AgentOrchestrator(createFromEnv(), vectorMemoryStore);
}

/**
 * Create RAG-enhanced orchestrator with vector memory
 */
export function createRAGOrchestrator(vectorMemoryStore: EnhancedVectorMemoryStore): AgentOrchestrator {
  return new AgentOrchestrator(createFromEnv(), vectorMemoryStore);
}