// VERSATIL SDLC Framework - Unified BMAD Agent Edge Function
// Production-ready unified entry point for all Enhanced BMAD agents
// Deployed at: https://[project-ref].supabase.co/functions/v1/bmad-agent

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://deno.land/x/openai@v4.24.0/mod.ts'
import { createOptimizedHandler, createMetricsHandler } from '../_shared/production-optimizations.ts'

// Types and Interfaces
interface BMADAgentRequest {
  agent: 'enhanced-maria' | 'enhanced-james' | 'enhanced-marcus' | 'enhanced-sarah' | 'enhanced-alex' | 'enhanced-dr-ai';
  action: 'analyze' | 'generate' | 'review' | 'optimize' | 'learn' | 'collaborate';
  context: {
    filePath: string;
    content: string;
    language?: string;
    framework?: string;
    projectId?: string;
    requestId?: string;
  };
  config?: {
    maxExamples?: number;
    similarityThreshold?: number;
    enableLearning?: boolean;
    enableCollaboration?: boolean;
    cacheResults?: boolean;
  };
}

interface BMADAgentResponse {
  success: boolean;
  data?: {
    analysis?: any;
    patterns?: any[];
    suggestions?: any[];
    prompt?: string;
    ragInsights?: {
      similarPatterns: number;
      projectStandards: number;
      expertise: number;
      avgSimilarity: number;
      processingMode: string;
    };
  };
  error?: string;
  metadata?: {
    agentId: string;
    processingTime: number;
    queryType: string;
    cacheHit?: boolean;
    model?: string;
  };
}

interface AgentConfig {
  specialization: string;
  domain: string;
  maxExamples: number;
  similarityThreshold: number;
  tables: {
    patterns: string;
    expertise: string;
    standards: string;
  };
  rpcFunctions: {
    searchPatterns: string;
  };
}

// Agent Configuration Registry
const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'enhanced-maria': {
    specialization: 'Quality Assurance Lead - Test Coverage, Bug Detection, Quality Gates',
    domain: 'qa',
    maxExamples: 3,
    similarityThreshold: 0.75,
    tables: {
      patterns: 'agent_code_patterns',
      expertise: 'agent_expertise',
      standards: 'project_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_qa_patterns'
    }
  },
  'enhanced-james': {
    specialization: 'Frontend Specialist - React/Vue Expert, UI/UX, Performance',
    domain: 'frontend',
    maxExamples: 3,
    similarityThreshold: 0.8,
    tables: {
      patterns: 'agent_code_patterns',
      expertise: 'agent_expertise',
      standards: 'project_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_frontend_patterns'
    }
  },
  'enhanced-marcus': {
    specialization: 'Backend Expert - API Architecture, Database, Security',
    domain: 'backend',
    maxExamples: 3,
    similarityThreshold: 0.8,
    tables: {
      patterns: 'agent_code_patterns',
      expertise: 'agent_expertise',
      standards: 'project_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_backend_patterns'
    }
  },
  'enhanced-sarah': {
    specialization: 'Project Manager - Coordination, Documentation, Planning',
    domain: 'management',
    maxExamples: 5,
    similarityThreshold: 0.7,
    tables: {
      patterns: 'project_documentation',
      expertise: 'management_expertise',
      standards: 'project_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_management_patterns'
    }
  },
  'enhanced-alex': {
    specialization: 'Business Analyst - Requirements, User Stories, Analysis',
    domain: 'business',
    maxExamples: 4,
    similarityThreshold: 0.75,
    tables: {
      patterns: 'business_patterns',
      expertise: 'business_expertise',
      standards: 'business_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_business_patterns'
    }
  },
  'enhanced-dr-ai': {
    specialization: 'AI/ML Specialist - Machine Learning, Data Science, Optimization',
    domain: 'ml',
    maxExamples: 4,
    similarityThreshold: 0.8,
    tables: {
      patterns: 'ml_patterns',
      expertise: 'ml_expertise',
      standards: 'ml_standards'
    },
    rpcFunctions: {
      searchPatterns: 'search_ml_patterns'
    }
  }
};

// Global cache for embeddings and patterns (in-memory edge cache)
const embeddingCache = new Map<string, number[]>();
const patternCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance monitoring
interface PerformanceMetrics {
  requestCount: number;
  totalProcessingTime: number;
  cacheHits: number;
  errorCount: number;
  lastReset: number;
}

const metrics: PerformanceMetrics = {
  requestCount: 0,
  totalProcessingTime: 0,
  cacheHits: 0,
  errorCount: 0,
  lastReset: Date.now()
};

// Create optimized handler with production features
const optimizedHandler = createOptimizedHandler(
  async (req: Request) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Health check endpoint
    if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/health')) {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          version: '1.2.1',
          metrics: {
            ...metrics,
            uptime: Date.now() - metrics.lastReset,
            avgProcessingTime: metrics.requestCount > 0 ? metrics.totalProcessingTime / metrics.requestCount : 0,
            cacheHitRate: metrics.requestCount > 0 ? metrics.cacheHits / metrics.requestCount : 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Metrics endpoint
    if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/metrics')) {
      const metricsHandler = createMetricsHandler();
      const metricsResponse = await metricsHandler(req);
      const metricsData = await metricsResponse.json();

      return new Response(
        JSON.stringify({
          ...metricsData,
          agentMetrics: {
            ...metrics,
            uptime: Date.now() - metrics.lastReset
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const startTime = Date.now();
      metrics.requestCount++;

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Initialize OpenAI for embeddings
      const openai = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY')!,
      })

      // Parse request
      const { agent, action, context, config = {} }: BMADAgentRequest = await req.json()

      // Validate agent
      if (!agent || !AGENT_CONFIGS[agent]) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown agent: ${agent}. Available agents: ${Object.keys(AGENT_CONFIGS).join(', ')}`
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate required fields
      if (!action || !context) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Agent, action, and context are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get agent configuration
      const agentConfig = AGENT_CONFIGS[agent];

      // Route to specific agent handler
      let response: BMADAgentResponse;

      switch (agent) {
        case 'enhanced-maria':
          response = await handleMariaRequest(action, context, config, agentConfig, supabase, openai);
          break;
        case 'enhanced-james':
          response = await handleJamesRequest(action, context, config, agentConfig, supabase, openai);
          break;
        case 'enhanced-marcus':
          response = await handleMarcusRequest(action, context, config, agentConfig, supabase, openai);
          break;
        case 'enhanced-sarah':
          response = await handleSarahRequest(action, context, config, agentConfig, supabase, openai);
          break;
        case 'enhanced-alex':
          response = await handleAlexRequest(action, context, config, agentConfig, supabase, openai);
          break;
        case 'enhanced-dr-ai':
          response = await handleDrAIRequest(action, context, config, agentConfig, supabase, openai);
          break;
        default:
          throw new Error(`Unhandled agent: ${agent}`)
      }

      const processingTime = Date.now() - startTime;
      metrics.totalProcessingTime += processingTime;

      // Add metadata
      response.metadata = {
        ...response.metadata,
        processingTime,
        agentId: agent
      };

      return new Response(
        JSON.stringify(response),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Processing-Time': processingTime.toString(),
            'X-Agent-ID': agent
          }
        }
      )

    } catch (error) {
      metrics.errorCount++;
      console.error('BMAD Agent function error:', error)

      const errorResponse: BMADAgentResponse = {
        success: false,
        error: error.message || 'Internal server error'
      }

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  },
  {
    // Production optimization configuration
    cache: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 500,
      keyPrefix: 'bmad:',
      skipCache: (key, value) => {
        // Skip caching error responses
        return value && value.success === false;
      }
    },
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 200, // 200 requests per minute per IP
      skipSuccessfulRequests: false
    },
    compression: {
      threshold: 1024, // Compress responses > 1KB
      level: 6
    }
  }
);

// Serve the optimized handler
serve(optimizedHandler);

// Enhanced Maria (QA) Handler
async function handleMariaRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `QA testing patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve similar QA patterns
    const { data: patterns } = await supabase
      .rpc(agentConfig.rpcFunctions.searchPatterns, {
        query_embedding: queryEmbedding,
        match_threshold: config.similarityThreshold || agentConfig.similarityThreshold,
        match_count: config.maxExamples || agentConfig.maxExamples,
        language_filter: context.language || null,
        framework_filter: context.framework || null
      })

    // Get QA expertise
    const { data: expertise } = await supabase
      .from(agentConfig.tables.expertise)
      .select('*')
      .eq('agent_name', 'enhanced-maria')
      .gte('confidence_score', 0.7)
      .limit(config.maxExamples || agentConfig.maxExamples)

    // Generate enhanced prompt with RAG context
    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    // Store successful patterns if learning is enabled
    if (config.enableLearning && context.storePattern) {
      await storePattern(context, agentConfig, supabase, openai);
    }

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateQASuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          expertise: expertise?.length || 0,
          projectStandards: 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-maria-qa'
        }
      },
      metadata: {
        agentId: 'enhanced-maria',
        processingTime: 0,
        queryType: 'qa-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for Maria: ${action}`)
}

// Enhanced James (Frontend) Handler
async function handleJamesRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `Frontend component patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve similar frontend patterns
    const { data: patterns } = await supabase
      .rpc(agentConfig.rpcFunctions.searchPatterns, {
        query_embedding: queryEmbedding,
        match_threshold: config.similarityThreshold || agentConfig.similarityThreshold,
        match_count: config.maxExamples || agentConfig.maxExamples,
        language_filter: context.language || null,
        framework_filter: context.framework || null
      })

    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateFrontendSuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          expertise: 0,
          projectStandards: 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-james-frontend'
        }
      },
      metadata: {
        agentId: 'enhanced-james',
        processingTime: 0,
        queryType: 'frontend-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for James: ${action}`)
}

// Enhanced Marcus (Backend) Handler
async function handleMarcusRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `Backend API patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve similar backend patterns
    const { data: patterns } = await supabase
      .rpc(agentConfig.rpcFunctions.searchPatterns, {
        query_embedding: queryEmbedding,
        match_threshold: config.similarityThreshold || agentConfig.similarityThreshold,
        match_count: config.maxExamples || agentConfig.maxExamples,
        language_filter: context.language || null,
        framework_filter: context.framework || null
      })

    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateBackendSuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          expertise: 0,
          projectStandards: 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-marcus-backend'
        }
      },
      metadata: {
        agentId: 'enhanced-marcus',
        processingTime: 0,
        queryType: 'backend-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for Marcus: ${action}`)
}

// Enhanced Sarah (Project Manager) Handler
async function handleSarahRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `Project management patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve project management patterns
    const { data: patterns } = await supabase
      .from('project_documentation')
      .select('*')
      .textSearch('content', query)
      .limit(config.maxExamples || agentConfig.maxExamples)

    // Get project standards
    const { data: standards } = await supabase
      .from(agentConfig.tables.standards)
      .select('*')
      .eq('agent_domain', 'management')
      .limit(3)

    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateProjectManagementSuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          projectStandards: standards?.length || 0,
          expertise: 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-sarah-pm'
        }
      },
      metadata: {
        agentId: 'enhanced-sarah',
        processingTime: 0,
        queryType: 'pm-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for Sarah: ${action}`)
}

// Enhanced Alex (Business Analyst) Handler
async function handleAlexRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `Business analysis patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve business patterns
    const { data: patterns } = await supabase
      .from('business_patterns')
      .select('*')
      .textSearch('content', query)
      .limit(config.maxExamples || agentConfig.maxExamples)

    // Get business expertise
    const { data: expertise } = await supabase
      .from('business_expertise')
      .select('*')
      .eq('agent_name', 'enhanced-alex')
      .gte('confidence_score', 0.7)
      .limit(3)

    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateBusinessAnalysisSuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          projectStandards: 0,
          expertise: expertise?.length || 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-alex-ba'
        }
      },
      metadata: {
        agentId: 'enhanced-alex',
        processingTime: 0,
        queryType: 'ba-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for Alex: ${action}`)
}

// Enhanced Dr.AI (ML Specialist) Handler
async function handleDrAIRequest(
  action: string,
  context: any,
  config: any,
  agentConfig: AgentConfig,
  supabase: any,
  openai: any
): Promise<BMADAgentResponse> {

  if (action === 'analyze') {
    const query = `Machine learning patterns ${context.content?.substring(0, 200) || ''}`;
    const queryEmbedding = await generateEmbeddingCached(query, openai);

    // Retrieve ML patterns
    const { data: patterns } = await supabase
      .from('ml_patterns')
      .select('*')
      .textSearch('content', query)
      .limit(config.maxExamples || agentConfig.maxExamples)

    // Get ML expertise
    const { data: expertise } = await supabase
      .from('ml_expertise')
      .select('*')
      .eq('agent_name', 'enhanced-dr-ai')
      .gte('confidence_score', 0.8)
      .limit(3)

    const prompt = generateEnhancedPrompt(context, patterns || [], agentConfig);

    return {
      success: true,
      data: {
        patterns: patterns || [],
        prompt,
        suggestions: generateMLSuggestions(patterns || []),
        ragInsights: {
          similarPatterns: patterns?.length || 0,
          projectStandards: 0,
          expertise: expertise?.length || 0,
          avgSimilarity: calculateAvgSimilarity(patterns || []),
          processingMode: 'enhanced-dr-ai-ml'
        }
      },
      metadata: {
        agentId: 'enhanced-dr-ai',
        processingTime: 0,
        queryType: 'ml-analyze'
      }
    }
  }

  throw new Error(`Unsupported action for Dr.AI: ${action}`)
}

// Utility Functions

async function generateEmbeddingCached(text: string, openai: any): Promise<number[]> {
  const cacheKey = `embedding:${text.substring(0, 100)}`;

  if (embeddingCache.has(cacheKey)) {
    metrics.cacheHits++;
    return embeddingCache.get(cacheKey)!;
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })

    const embedding = response.data[0].embedding;
    embeddingCache.set(cacheKey, embedding);

    // Clean cache if it gets too large
    if (embeddingCache.size > 1000) {
      const firstKey = embeddingCache.keys().next().value;
      embeddingCache.delete(firstKey);
    }

    return embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    // Return a fallback embedding
    return Array(1536).fill(0).map(() => Math.random());
  }
}

function generateEnhancedPrompt(context: any, patterns: any[], agentConfig: AgentConfig): string {
  const similarPatterns = patterns.slice(0, 3);

  let promptContext = '';
  if (similarPatterns.length > 0) {
    promptContext = `
## Similar Patterns Found:
${similarPatterns.map((p, i) => `
### Pattern ${i + 1} (${(p.similarity * 100).toFixed(1)}% match)
\`\`\`${p.language || 'text'}
${p.code_content || p.content}
\`\`\`
Quality Score: ${p.quality_score || 'N/A'}
Framework: ${p.framework || 'N/A'}
`).join('\n')}`;
  }

  return `---
name: ${agentConfig.domain}-enhanced-analysis
description: ${agentConfig.specialization}
model: sonnet
agent: ${agentConfig.domain}
---

You are an expert ${agentConfig.specialization}.

## Current Task
Analyze the following ${context.language || 'code'} and provide ${agentConfig.domain}-specific insights:

\`\`\`${context.language || 'text'}
${context.content}
\`\`\`

File: ${context.filePath}
Language: ${context.language || 'auto-detected'}
Framework: ${context.framework || 'auto-detected'}

${promptContext}

## Your Response Should Include:
1. Detailed analysis specific to ${agentConfig.domain}
2. Recommendations based on similar patterns
3. Best practices for this context
4. Potential improvements or issues
5. Next steps or follow-up actions

Focus on providing actionable, expert-level insights.`;
}

function generateQASuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'test-coverage',
      message: 'Consider adding unit tests for edge cases',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'test').slice(0, 2)
    },
    {
      type: 'quality-gates',
      message: 'Implement quality gates for continuous integration',
      priority: 'medium',
      examples: []
    }
  ];
}

function generateFrontendSuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'component-optimization',
      message: 'Consider component composition patterns',
      priority: 'medium',
      examples: patterns.filter(p => p.pattern_type === 'component').slice(0, 2)
    },
    {
      type: 'performance',
      message: 'Review performance optimization opportunities',
      priority: 'high',
      examples: []
    }
  ];
}

function generateBackendSuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'api-security',
      message: 'Review API security best practices',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'security').slice(0, 2)
    },
    {
      type: 'database-optimization',
      message: 'Consider database query optimization',
      priority: 'medium',
      examples: []
    }
  ];
}

function generateProjectManagementSuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'project-planning',
      message: 'Consider implementing milestone tracking',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'planning').slice(0, 2)
    },
    {
      type: 'team-coordination',
      message: 'Improve team communication workflows',
      priority: 'medium',
      examples: []
    },
    {
      type: 'documentation',
      message: 'Enhance project documentation standards',
      priority: 'medium',
      examples: patterns.filter(p => p.pattern_type === 'documentation').slice(0, 1)
    }
  ];
}

function generateBusinessAnalysisSuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'requirements',
      message: 'Define clear acceptance criteria for user stories',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'requirements').slice(0, 2)
    },
    {
      type: 'stakeholder-analysis',
      message: 'Conduct stakeholder impact assessment',
      priority: 'medium',
      examples: []
    },
    {
      type: 'business-logic',
      message: 'Validate business rules and constraints',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'business-rules').slice(0, 1)
    }
  ];
}

function generateMLSuggestions(patterns: any[]): any[] {
  return [
    {
      type: 'model-optimization',
      message: 'Consider model performance optimization techniques',
      priority: 'high',
      examples: patterns.filter(p => p.pattern_type === 'optimization').slice(0, 2)
    },
    {
      type: 'data-preprocessing',
      message: 'Implement robust data preprocessing pipeline',
      priority: 'medium',
      examples: patterns.filter(p => p.pattern_type === 'preprocessing').slice(0, 1)
    },
    {
      type: 'model-validation',
      message: 'Enhance model validation and testing strategies',
      priority: 'high',
      examples: []
    },
    {
      type: 'deployment',
      message: 'Consider MLOps best practices for production deployment',
      priority: 'medium',
      examples: patterns.filter(p => p.pattern_type === 'deployment').slice(0, 1)
    }
  ];
}

function calculateAvgSimilarity(patterns: any[]): number {
  if (patterns.length === 0) return 0;
  const total = patterns.reduce((sum, p) => sum + (p.similarity || 0), 0);
  return total / patterns.length;
}

async function storePattern(context: any, agentConfig: AgentConfig, supabase: any, openai: any): Promise<void> {
  try {
    const embedding = await generateEmbeddingCached(context.content, openai);

    await supabase
      .from(agentConfig.tables.patterns)
      .insert({
        agent_name: context.agentId || 'unknown',
        pattern_type: context.patternType || 'unknown',
        code_content: context.content,
        file_path: context.filePath,
        language: context.language,
        framework: context.framework,
        quality_score: context.qualityScore || 80,
        embedding: embedding,
        metadata: {
          timestamp: Date.now(),
          source: 'edge-function',
          requestId: context.requestId
        }
      });
  } catch (error) {
    console.error('Failed to store pattern:', error);
  }
}