/**
 * VERSATIL Contextual Engineering API
 *
 * Multi-platform API for IDE integration (VS Code, Windsurf, Replit, etc.)
 * Provides contextual engineering patterns and agent orchestration.
 *
 * Deploy: gcloud run deploy versatil-api --source . --region us-central1
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

const ContextualAssistRequestSchema = z.object({
  query: z.string().min(1),
  context: z.object({
    language: z.string().optional(),
    framework: z.string().optional(),
    currentFile: z.string().optional(),
    selectedCode: z.string().optional(),
    projectStructure: z.array(z.string()).optional(),
    errorMessage: z.string().optional(),
  }).optional(),
  session: z.object({
    messageHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional(),
    sessionDuration: z.number().optional(),
    errorCount: z.number().optional(),
    timezone: z.string().optional(),
  }).optional(),
  platform: z.enum(['cursor', 'claude', 'vscode', 'windsurf', 'replit', 'neovim', 'jetbrains', 'other']).optional(),
  preferences: z.object({
    verbosity: z.enum(['concise', 'detailed']).optional(),
    includeTests: z.boolean().optional(),
    preferredPatterns: z.array(z.string()).optional(),
  }).optional(),
});

type ContextualAssistRequest = z.infer<typeof ContextualAssistRequestSchema>;

interface EmotionalContext {
  frustrationLevel: number;
  confusionLevel: number;
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  responseStyle: {
    verbosity: 'concise' | 'detailed' | 'step-by-step';
    tone: 'professional' | 'encouraging' | 'empathetic';
    suggestBreak: boolean;
  };
}

interface AgentMatch {
  agent: string;
  confidence: number;
  keywords: string[];
}

// ============================================================================
// Agent Detection
// ============================================================================

const AGENT_TRIGGERS: Record<string, { keywords: string[]; priority: number }> = {
  'maria-qa': {
    keywords: ['test', 'spec', 'coverage', 'qa', 'validation', 'e2e', 'unit test', 'jest', 'vitest', 'playwright', 'quality'],
    priority: 100
  },
  'james-frontend': {
    keywords: ['component', 'ui', 'css', 'frontend', 'react', 'vue', 'angular', 'svelte', 'responsive', 'accessibility', 'a11y', 'tailwind'],
    priority: 90
  },
  'marcus-backend': {
    keywords: ['api', 'endpoint', 'backend', 'server', 'security', 'owasp', 'rest', 'graphql', 'middleware', 'authentication', 'jwt'],
    priority: 90
  },
  'dana-database': {
    keywords: ['database', 'schema', 'migration', 'query', 'sql', 'postgres', 'prisma', 'supabase', 'rls', 'policy', 'index'],
    priority: 90
  },
  'dr-ai-ml': {
    keywords: ['ml', 'machine learning', 'model', 'training', 'embedding', 'rag', 'vector', 'tensorflow', 'pytorch', 'vertex'],
    priority: 80
  },
  'alex-ba': {
    keywords: ['requirement', 'user story', 'acceptance criteria', 'specification', 'stakeholder', 'business logic'],
    priority: 70
  },
  'sarah-pm': {
    keywords: ['project', 'plan', 'sprint', 'milestone', 'coordinate', 'delegate', 'roadmap'],
    priority: 60
  },
  'oliver-mcp': {
    keywords: ['mcp', 'integration', 'playwright', 'github', 'anti-hallucination'],
    priority: 50
  },
  'victor-verifier': {
    keywords: ['verify', 'hallucination', 'fact-check', 'proof', 'confidence'],
    priority: 50
  }
};

function detectAgent(query: string, context?: ContextualAssistRequest['context']): AgentMatch {
  const queryLower = query.toLowerCase();
  let bestMatch: AgentMatch = { agent: 'general', confidence: 0, keywords: [] };

  for (const [agent, config] of Object.entries(AGENT_TRIGGERS)) {
    const matchedKeywords = config.keywords.filter(kw => queryLower.includes(kw));
    const confidence = (matchedKeywords.length / config.keywords.length) * config.priority;

    if (confidence > bestMatch.confidence) {
      bestMatch = { agent, confidence, keywords: matchedKeywords };
    }
  }

  // Boost confidence based on file context
  if (context?.currentFile) {
    const file = context.currentFile.toLowerCase();
    if (file.includes('.test.') || file.includes('.spec.')) {
      if (bestMatch.agent !== 'maria-qa') {
        bestMatch = { agent: 'maria-qa', confidence: 80, keywords: ['test file detected'] };
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.vue')) {
      if (bestMatch.confidence < 50) {
        bestMatch = { agent: 'james-frontend', confidence: 60, keywords: ['frontend file detected'] };
      }
    } else if (file.includes('/api/') || file.includes('/routes/')) {
      if (bestMatch.confidence < 50) {
        bestMatch = { agent: 'marcus-backend', confidence: 60, keywords: ['backend file detected'] };
      }
    } else if (file.endsWith('.sql') || file.includes('/migrations/')) {
      if (bestMatch.confidence < 50) {
        bestMatch = { agent: 'dana-database', confidence: 60, keywords: ['database file detected'] };
      }
    }
  }

  return bestMatch;
}

// ============================================================================
// Emotional Intelligence
// ============================================================================

function analyzeEmotionalContext(
  query: string,
  session?: ContextualAssistRequest['session']
): EmotionalContext {
  const queryLower = query.toLowerCase();

  // Frustration indicators
  let frustrationLevel = 0;
  if (queryLower.includes('!!!') || queryLower.includes('???')) frustrationLevel += 2;
  if (queryLower.includes("doesn't work") || queryLower.includes("not working")) frustrationLevel += 1;
  if (queryLower.includes("tried everything") || queryLower.includes("nothing works")) frustrationLevel += 2;
  if (queryLower.includes("why")) frustrationLevel += 1;
  if (session?.errorCount && session.errorCount > 3) frustrationLevel += 2;
  frustrationLevel = Math.min(frustrationLevel, 5);

  // Confusion indicators
  let confusionLevel = 0;
  if (queryLower.includes("i don't understand") || queryLower.includes("confused")) confusionLevel += 2;
  if (queryLower.includes("how do i") || queryLower.includes("what is")) confusionLevel += 1;
  if (query.length > 500) confusionLevel += 1; // Long messages often indicate confusion
  confusionLevel = Math.min(confusionLevel, 5);

  // Expertise level detection
  let expertiseLevel: EmotionalContext['expertiseLevel'] = 'intermediate';
  const technicalTerms = ['async', 'middleware', 'hooks', 'mutation', 'resolver', 'migration', 'index'];
  const advancedTerms = ['concurrency', 'memoization', 'closure', 'polymorphism', 'dependency injection'];

  const technicalCount = technicalTerms.filter(t => queryLower.includes(t)).length;
  const advancedCount = advancedTerms.filter(t => queryLower.includes(t)).length;

  if (advancedCount >= 2) expertiseLevel = 'expert';
  else if (technicalCount >= 2 || advancedCount >= 1) expertiseLevel = 'advanced';
  else if (technicalCount >= 1) expertiseLevel = 'intermediate';
  else expertiseLevel = 'beginner';

  // Urgency detection
  let urgency: EmotionalContext['urgency'] = 'medium';
  if (queryLower.includes('urgent') || queryLower.includes('asap') || queryLower.includes('deadline')) {
    urgency = 'critical';
  } else if (queryLower.includes('quickly') || queryLower.includes('fast')) {
    urgency = 'high';
  } else if (frustrationLevel >= 4) {
    urgency = 'high';
  }

  // Determine response style
  const responseStyle: EmotionalContext['responseStyle'] = {
    verbosity: frustrationLevel >= 3 ? 'step-by-step' :
               expertiseLevel === 'expert' ? 'concise' : 'detailed',
    tone: frustrationLevel >= 4 ? 'empathetic' :
          confusionLevel >= 3 ? 'encouraging' : 'professional',
    suggestBreak: frustrationLevel >= 5
  };

  return {
    frustrationLevel,
    confusionLevel,
    expertiseLevel,
    urgency,
    responseStyle
  };
}

// ============================================================================
// Claude Integration
// ============================================================================

async function processWithClaude(
  request: ContextualAssistRequest,
  agentMatch: AgentMatch,
  emotionalContext: EmotionalContext
): Promise<{ answer: string; code?: string }> {
  const anthropic = new Anthropic();

  // Build system prompt based on agent and emotional context
  let systemPrompt = `You are a helpful coding assistant powered by the VERSATIL SDLC Framework.

Current Agent: ${agentMatch.agent.toUpperCase()}
Confidence: ${agentMatch.confidence.toFixed(0)}%
Detected Keywords: ${agentMatch.keywords.join(', ')}

User Emotional State:
- Frustration Level: ${emotionalContext.frustrationLevel}/5
- Confusion Level: ${emotionalContext.confusionLevel}/5
- Expertise: ${emotionalContext.expertiseLevel}
- Urgency: ${emotionalContext.urgency}

Response Guidelines:
- Verbosity: ${emotionalContext.responseStyle.verbosity}
- Tone: ${emotionalContext.responseStyle.tone}
${emotionalContext.responseStyle.suggestBreak ? '- Consider suggesting a break if user seems very frustrated' : ''}

`;

  // Add agent-specific instructions
  const agentInstructions: Record<string, string> = {
    'maria-qa': 'Focus on testing best practices, coverage improvement, and quality gates. Suggest Vitest/Playwright patterns.',
    'james-frontend': 'Focus on React/Vue patterns, accessibility (WCAG 2.1), and performance (LCP < 2.5s). Use shadcn/ui patterns.',
    'marcus-backend': 'Focus on API design, security (OWASP Top 10), and performance (<200ms response). Validate authentication patterns.',
    'dana-database': 'Focus on schema design, query optimization (<50ms), and RLS policies for multi-tenant. Use Prisma/SQL best practices.',
    'dr-ai-ml': 'Focus on ML pipelines, embeddings, RAG systems, and Vertex AI deployment. Provide Python examples.',
    'alex-ba': 'Focus on requirements clarity, user stories, and acceptance criteria. Use Gherkin syntax when appropriate.',
    'sarah-pm': 'Focus on planning, task breakdown, and multi-agent coordination. Suggest OPERA methodology phases.',
    'oliver-mcp': 'Focus on MCP server configuration, tool integration, and anti-hallucination strategies.',
    'victor-verifier': 'Focus on fact verification, source citation, and confidence scoring.',
    'general': 'Provide helpful, accurate coding assistance. Suggest the appropriate VERSATIL agent if specialized help is needed.'
  };

  systemPrompt += `\nAgent Instructions: ${agentInstructions[agentMatch.agent] || agentInstructions['general']}`;

  // Add context
  if (request.context) {
    systemPrompt += `\n\nCode Context:`;
    if (request.context.language) systemPrompt += `\n- Language: ${request.context.language}`;
    if (request.context.framework) systemPrompt += `\n- Framework: ${request.context.framework}`;
    if (request.context.currentFile) systemPrompt += `\n- File: ${request.context.currentFile}`;
    if (request.context.errorMessage) systemPrompt += `\n- Error: ${request.context.errorMessage}`;
  }

  // Build messages
  const messages: Anthropic.MessageParam[] = [];

  // Add history if available
  if (request.session?.messageHistory) {
    for (const msg of request.session.messageHistory.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  // Add current query
  let userContent = request.query;
  if (request.context?.selectedCode) {
    userContent += `\n\nSelected Code:\n\`\`\`\n${request.context.selectedCode}\n\`\`\``;
  }

  messages.push({ role: 'user', content: userContent });

  // Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages
  });

  const textContent = response.content.find(c => c.type === 'text');
  const answer = textContent?.text || 'No response generated';

  // Extract code blocks if present
  const codeMatch = answer.match(/```[\w]*\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1] : undefined;

  return { answer, code };
}

// ============================================================================
// Express App
// ============================================================================

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', version: '1.0.0', framework: 'VERSATIL' });
});

// Main contextual assist endpoint
app.post('/v1/contextual-assist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request
    const parseResult = ContextualAssistRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parseResult.error.errors
      });
      return;
    }

    const request = parseResult.data;

    // Detect agent
    const agentMatch = detectAgent(request.query, request.context);

    // Analyze emotional context
    const emotionalContext = analyzeEmotionalContext(request.query, request.session);

    // Process with Claude
    const result = await processWithClaude(request, agentMatch, emotionalContext);

    // Build response
    res.json({
      answer: result.answer,
      code: result.code,
      agent_used: agentMatch.agent,
      agent_confidence: agentMatch.confidence,
      pattern: {
        name: `${agentMatch.agent}-pattern`,
        keywords: agentMatch.keywords,
        confidence: agentMatch.confidence
      },
      emotional_context: {
        detected_state: emotionalContext.frustrationLevel >= 3 ? 'frustrated' :
                        emotionalContext.confusionLevel >= 3 ? 'confused' : 'normal',
        adaptations: [
          `verbosity: ${emotionalContext.responseStyle.verbosity}`,
          `tone: ${emotionalContext.responseStyle.tone}`,
          `expertise: ${emotionalContext.expertiseLevel}`
        ]
      },
      suggestions: agentMatch.confidence < 50 ? [
        'Consider using /plan for complex features',
        'Use /maria-qa for quality validation',
        `Detected expertise: ${emotionalContext.expertiseLevel}`
      ] : [],
      usage: {
        platform: request.platform || 'unknown',
        agent: agentMatch.agent
      }
    });
  } catch (error) {
    next(error);
  }
});

// List available agents
app.get('/v1/agents', (_req: Request, res: Response) => {
  res.json({
    agents: Object.entries(AGENT_TRIGGERS).map(([name, config]) => ({
      name,
      keywords: config.keywords,
      priority: config.priority
    }))
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`VERSATIL API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Agents: http://localhost:${PORT}/v1/agents`);
  console.log(`Assist: POST http://localhost:${PORT}/v1/contextual-assist`);
});

export { app };
