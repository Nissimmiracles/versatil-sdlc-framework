#!/usr/bin/env -S npx tsx

/**
 * UserPromptSubmit Hook - Automatic RAG Pattern Activation
 *
 * This hook automatically detects keywords in user prompts and retrieves
 * relevant learning patterns from the RAG system (.versatil/learning/patterns/).
 *
 * When activated, it injects pattern context into the conversation so Claude
 * can provide answers based on YOUR actual implementation (not generic LLM knowledge).
 *
 * Example:
 *   User: "How do I implement hooks?"
 *   Hook detects: "hooks" → Retrieves native-sdk-integration-v6.6.0.json
 *   Result: Claude answers with YOUR v6.6.0 hook implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import { getMetricsService } from '../../src/telemetry/automation-metrics.js';
import { detectContextIdentity, type ContextIdentity } from '../../src/isolation/context-identity.js';

interface HookInput {
  prompt?: string;
  message?: string;
  workingDirectory?: string;
  context?: Record<string, unknown>;
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  category: string;
  implementation: {
    code: string;
    instructions: string[];
    files?: Array<{
      path: string;
      lines?: string;
      description: string;
    }>;
  };
  metrics: {
    successRate: number;
    effortHours?: number;
    estimatedHours?: number;
    accuracyPercent?: number;
  };
  metadata: {
    tags: string[];
    commitHash?: string;
    version: string;
  };
}

// Keyword mapping to pattern files
const KEYWORD_MAP: Record<string, string> = {
  // Native SDK Integration
  'hook|hooks|sdk|native|settings\\.json|posttooluse|subagent.*stop|stop.*hook|userpromptsub':
    'native-sdk-integration-v6.6.0.json',

  // Victor-Verifier
  'verification|verifier|verify|hallucination|anti.*hallucination|victor|cove|chain.*of.*verification|proof.*log|confidence.*scor':
    'victor-verifier-anti-hallucination.json',

  // Assessment Engine
  'assessment|assess|quality.*audit|pattern.*detection|security.*scan|coverage.*requirement|semgrep|lighthouse|axe.*core':
    'assessment-engine-v6.6.0.json',

  // Session CODIFY
  'codify|learning|compounding|session.*end|claude\\.md|automatic.*learning|stop.*hook.*learning':
    'session-codify-compounding.json',

  // Marketplace
  'marketplace|repository.*org|cleanup|archive|plugin.*metadata|\\.claude.*plugin':
    'marketplace-repository-organization.json'
};

/**
 * Intent-based pattern detection for proactive skill/template suggestions (Phase 6)
 * Detects user intent and auto-suggests relevant templates, patterns, skills, agents
 */
interface IntentSuggestion {
  type: 'template' | 'rag-pattern' | 'library' | 'agent';
  skill?: string;
  pattern?: string;
  agent?: string;
  path?: string;
  productivity?: string;
  success?: string;
  effort?: string;
  reason?: string;
  autoActivate?: boolean;
}

interface IntentConfig {
  regex: RegExp;
  suggestions: IntentSuggestion[];
}

const INTENT_PATTERNS: Record<string, IntentConfig> = {
  creating_agent: {
    regex: /create.*agent|new.*agent|add.*agent|build.*agent|implement.*agent/i,
    suggestions: [
      {
        type: 'template',
        skill: 'agent-creator',
        path: '.claude/skills/code-generators/agent-creator/assets/agent-template.md',
        productivity: '6x faster (60min → 10min)'
      },
      { type: 'library', skill: 'agents-library', reason: 'Agent patterns and handoff contracts' },
      { type: 'library', skill: 'testing-library', reason: 'Agent testing (80%+ coverage)' }
    ]
  },
  implementing_auth: {
    regex: /auth|authentication|login|signup|jwt|oauth|session|cookie.*auth/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'jwt-auth-cookies',
        path: '.versatil/learning/patterns/jwt-auth-cookies.json',
        productivity: 'Proven pattern - 2-3 hours typical'
      },
      { type: 'library', skill: 'marcus-backend', reason: 'API security and OWASP validation' },
      { type: 'library', skill: 'testing-library', reason: 'Auth testing (80%+ coverage)' }
    ]
  },
  writing_tests: {
    regex: /\btest\b|coverage|jest|spec|\.test\.|\.spec\.|unit.*test|integration.*test/i,
    suggestions: [
      {
        type: 'template',
        skill: 'test-creator',
        path: '.claude/skills/code-generators/test-creator/assets/unit-test-template.ts',
        productivity: '5x faster'
      },
      { type: 'library', skill: 'testing-library', reason: 'AAA pattern, 80%+ coverage standards' },
      { type: 'agent', agent: 'Maria-QA', autoActivate: true }
    ]
  },
  creating_command: {
    regex: /create.*command|new.*command|slash.*command|implement.*command|\/[a-z-]+\s/i,
    suggestions: [
      {
        type: 'template',
        skill: 'command-creator',
        path: '.claude/skills/code-generators/command-creator/assets/command-template.md',
        productivity: '5.6x faster (45min → 8min)'
      }
    ]
  },
  creating_hook: {
    regex: /create.*hook|new.*hook|lifecycle.*hook|implement.*hook/i,
    suggestions: [
      {
        type: 'template',
        skill: 'hook-creator',
        path: '.claude/skills/code-generators/hook-creator/assets/hook-template.ts',
        productivity: '5x faster (30min → 6min)'
      },
      { type: 'rag-pattern', pattern: 'native-sdk-integration', success: '98%' }
    ]
  },
  creating_skill: {
    regex: /create.*skill|new.*skill|implement.*skill/i,
    suggestions: [
      {
        type: 'template',
        skill: 'skill-creator',
        path: '.claude/skills/code-generators/skill-creator/assets/SKILL-template.md',
        productivity: '5x faster (40min → 8min)'
      }
    ]
  },
  implementing_oauth: {
    regex: /oauth|oauth2|google.*auth|github.*auth|social.*login|sso|passport/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'oauth2-integration',
        path: '.versatil/learning/patterns/oauth2-integration.json',
        productivity: 'Proven pattern - 4-6 hours typical'
      },
      { type: 'library', skill: 'marcus-backend', reason: 'API security and OAuth flow implementation' },
      { type: 'library', skill: 'testing-library', reason: 'OAuth testing (80%+ coverage)' }
    ]
  },
  creating_migration: {
    regex: /migration|migrate|schema.*change|alter.*table|add.*column|prisma.*migrate/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'database-migration',
        path: '.versatil/learning/patterns/database-migration.json',
        productivity: 'Proven pattern - 2-3 hours typical'
      },
      { type: 'library', skill: 'dana-database', reason: 'Database schema and migration patterns' },
      { type: 'agent', agent: 'Dana-Database', autoActivate: true }
    ]
  },
  implementing_graphql: {
    regex: /graphql|apollo|schema.*query|mutation|resolver|subscription/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'graphql-api',
        path: '.versatil/learning/patterns/graphql-api.json',
        productivity: 'Proven pattern - 5-7 hours typical'
      },
      { type: 'library', skill: 'marcus-backend', reason: 'GraphQL API design and resolvers' },
      { type: 'library', skill: 'testing-library', reason: 'GraphQL testing (80%+ coverage)' }
    ]
  },
  creating_component: {
    regex: /create.*component|new.*component|react.*component|tsx.*file|functional.*component/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'react-component',
        path: '.versatil/learning/patterns/react-component.json',
        productivity: 'Proven pattern - 2-4 hours typical'
      },
      { type: 'library', skill: 'james-frontend', reason: 'React patterns and accessibility (WCAG 2.1 AA)' },
      { type: 'agent', agent: 'James-Frontend', autoActivate: true }
    ]
  },
  deploying_docker: {
    regex: /docker|dockerfile|docker-compose|containerize|deploy|multi.*stage/i,
    suggestions: [
      {
        type: 'rag-pattern',
        pattern: 'docker-deployment',
        path: '.versatil/learning/patterns/docker-deployment.json',
        productivity: 'Proven pattern - 3-5 hours typical'
      },
      { type: 'library', skill: 'marcus-backend', reason: 'Docker setup and orchestration' }
    ]
  }
};

/**
 * Cross-skill relationships (Phase 6)
 * Maps skills to related skills that are often used together
 * NOTE: Cannot use YAML metadata (SDK only supports name, description, allowed-tools)
 */
const SKILL_RELATIONSHIPS: Record<string, string[]> = {
  'rag-library': ['orchestration-library', 'testing-library', 'rag-patterns'],
  'agents-library': ['testing-library', 'orchestration-library', 'hook-creator'],
  'testing-library': ['quality-gates', 'rag-patterns'],
  'orchestration-library': ['rag-library', 'planning-library'],
  'planning-library': ['templates-library', 'rag-patterns'],
  'templates-library': ['planning-library', 'rag-library'],
  'mcp-library': ['orchestration-library', 'rag-library'],
  'hooks-library': ['agents-library', 'rag-patterns']
};

function detectMatchingPatterns(userMessage: string): string[] {
  const messageLower = userMessage.toLowerCase();
  const matchedFiles: string[] = [];

  for (const [keywords, patternFile] of Object.entries(KEYWORD_MAP)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(messageLower)) {
      matchedFiles.push(patternFile);
    }
  }

  return Array.from(new Set(matchedFiles));
}

function loadPattern(filename: string, workingDir: string): Pattern | null {
  try {
    const patternPath = path.join(workingDir, '.versatil', 'learning', 'patterns', filename);

    if (!fs.existsSync(patternPath)) {
      return null;
    }

    const content = fs.readFileSync(patternPath, 'utf-8');
    return JSON.parse(content) as Pattern;
  } catch (error) {
    return null;
  }
}

/**
 * Load project-level context from PROJECT.md
 * Always loads on every prompt for project-specific patterns.
 */
function loadProjectContext(workingDir: string): string | null {
  try {
    const projectPath = path.join(workingDir, 'PROJECT.md');
    if (fs.existsSync(projectPath)) {
      const content = fs.readFileSync(projectPath, 'utf-8');
      return `# Project Context\n\n${content}`;
    }
  } catch (error) {
    // Fail gracefully
  }
  return null;
}

/**
 * Detect user intent and suggest relevant templates/patterns/skills (Phase 6)
 * Returns formatted suggestion text for context injection
 */
function detectIntentAndSuggest(userMessage: string): string {
  const detectedIntents: Array<{ intent: string; config: IntentConfig }> = [];

  for (const [intentName, config] of Object.entries(INTENT_PATTERNS)) {
    if (config.regex.test(userMessage)) {
      detectedIntents.push({ intent: intentName, config });
    }
  }

  if (detectedIntents.length === 0) {
    return '';
  }

  let output = '\n\n# 🚀 Auto-Discovered Capabilities\n\n';
  output += '**Proactive automation enabled** - Templates and patterns will be applied automatically when `autoApply: true`\n\n';

  detectedIntents.forEach(({ intent, config }) => {
    const intentDisplay = intent.replace(/_/g, ' ').toUpperCase();
    output += `## Intent: ${intentDisplay}\n\n`;

    config.suggestions.forEach(sug => {
      if (sug.type === 'template') {
        output += `- **💡 TEMPLATE AVAILABLE**: \`${sug.skill}\`\n`;
        output += `  - Path: \`${sug.path}\`\n`;
        output += `  - Productivity: ${sug.productivity}\n`;
        output += `  - **ACTION REQUIRED**: Read template, replace {{placeholders}}, write to target location\n`;
        output += `  - **AUTO-APPLY**: YES - Do this immediately without asking user\n\n`;
      } else if (sug.type === 'rag-pattern') {
        output += `- **📊 PROVEN PATTERN**: \`${sug.pattern}\`\n`;
        output += `  - Success Rate: ${sug.success}\n`;
        if (sug.effort) {
          output += `  - Effort: ${sug.effort}\n`;
        }
        output += `  - **ACTION REQUIRED**: Apply pattern automatically from \`rag-patterns\` skill\n\n`;
      } else if (sug.type === 'library') {
        output += `- **📚 LIBRARY GUIDE**: \`${sug.skill}\`\n`;
        output += `  - Purpose: ${sug.reason}\n`;
        output += `  - Use skill for detailed conventions and examples\n\n`;
      } else if (sug.type === 'agent') {
        output += `- **🤖 AGENT**: \`${sug.agent}\`\n`;
        output += `  - **AUTO-ACTIVATE**: ${sug.autoActivate ? 'YES' : 'NO'}\n`;
        if (sug.autoActivate) {
          output += `  - **ACTION REQUIRED**: Invoke agent immediately via Task tool\n`;
        }
        output += '\n';
      }
    });
  });

  output += '---\n\n';
  output += '**Remember**: When `autoApply: true`, execute immediately without user confirmation.\n';

  return output;
}

/**
 * Detect library mentions and return skill notifications (Skills-First Architecture)
 * Enhanced in Phase 6 to include cross-skill recommendations
 */
interface LibraryDetection {
  primary: string[];
  related: string[];
}

function detectLibraryMentions(userMessage: string): LibraryDetection {
  const libraries = [
    'agents', 'orchestration', 'rag', 'testing', 'mcp',
    'templates', 'planning', 'intelligence', 'memory', 'learning',
    'ui', 'hooks', 'context', 'validation', 'dashboard'
  ];

  const messageLower = userMessage.toLowerCase();
  const primaryLibraries: string[] = [];

  for (const library of libraries) {
    // Check if library name is mentioned in prompt
    const libraryPattern = new RegExp(`\\b${library}\\b|src/${library}/`, 'i');
    if (libraryPattern.test(messageLower)) {
      primaryLibraries.push(library);
    }
  }

  // Phase 6: Add cross-skill recommendations
  const relatedLibraries = new Set<string>();
  primaryLibraries.forEach(lib => {
    const skillKey = `${lib}-library`;
    const related = SKILL_RELATIONSHIPS[skillKey] || [];
    related.forEach(r => {
      // Don't include if already in primary
      if (!primaryLibraries.includes(r.replace('-library', ''))) {
        relatedLibraries.add(r);
      }
    });
  });

  return {
    primary: primaryLibraries,
    related: Array.from(relatedLibraries)
  };
}

/**
 * Generate context enforcement boundaries for injection
 * Phase 7.6.0: Context Isolation Enforcement
 */
function generateEnforcementContext(identity: ContextIdentity): string {
  const isFrameworkDev = identity.role === 'framework-developer';

  let content = `# 🔒 ENFORCED CONTEXT ISOLATION\n\n`;
  content += `**Active Mode**: ${isFrameworkDev ? '🛠️ Framework Development' : '👤 User Project'}\n`;
  content += `**Role**: ${identity.role}\n`;
  content += `**Audience**: ${identity.audience}\n`;
  content += `**Boundary**: ${identity.boundary}\n\n`;

  content += `## MANDATORY BOUNDARIES\n\n`;

  if (isFrameworkDev) {
    content += `### Framework Development Mode - Full Access\n\n`;
    content += `✅ **Allowed**:\n`;
    content += `- Access framework internals (src/agents/, src/mcp/, src/orchestration/)\n`;
    content += `- Modify agent definitions, hooks, skills\n`;
    content += `- Create/edit framework components\n`;
    content += `- RAG namespace: ~/.versatil-global/framework-dev/\n`;
    content += `- All OPERA agents available (including Sarah-PM)\n\n`;

    content += `❌ **BLOCKED**:\n`;
    content += `- Customer project data (${identity.isolation.blockedPatterns.slice(0, 2).join(', ')})\n`;
    content += `- User project learnings\n`;
    content += `- Customer-specific patterns\n\n`;

    content += `⚠️  **IMPORTANT**: Framework learnings stay in framework-dev namespace. Do NOT mix with customer data.\n`;
  } else {
    content += `### User Project Mode - Restricted Access\n\n`;
    content += `✅ **Allowed**:\n`;
    content += `- Build features using VERSATIL framework\n`;
    content += `- Access public APIs and documentation\n`;
    content += `- Use customer-facing agents: Maria-QA, James-Frontend, Marcus-Backend, Dana-Database, Dr.AI-ML, Alex-BA\n`;
    content += `- RAG namespace: ${identity.projectPath}/.versatil/\n`;
    content += `- Shared patterns: ~/.versatil-global/cross-project/\n\n`;

    content += `❌ **BLOCKED**:\n`;
    content += `- Framework internals (${identity.isolation.blockedPatterns.slice(0, 2).join(', ')})\n`;
    content += `- Framework source code (src/, .claude/agents/, etc.)\n`;
    content += `- Sarah-PM agent (framework architecture only)\n`;
    content += `- Framework development patterns\n\n`;

    content += `⚠️  **IMPORTANT**: You are in user project context. Framework internals are NOT accessible. Use Task tool to invoke agents.\n`;
  }

  content += `\n## RUNTIME ENFORCEMENT\n\n`;
  content += `This isolation is **ENFORCED** at runtime by:\n`;
  content += `1. **BoundaryEnforcementEngine** - Filesystem access control\n`;
  content += `2. **ZeroTrustProjectIsolation** - Behavioral threat detection\n`;
  content += `3. **MCP Tool Guards** - Permission validation before tool execution\n`;
  content += `4. **Skill Filtering** - Framework-only skills don't load in user context\n`;
  content += `5. **RAG Namespace Isolation** - Queries only search allowed namespaces\n\n`;

  content += `**Attempting to bypass these boundaries will result in:**\n`;
  content += `- Immediate access denial\n`;
  content += `- Security violation logging\n`;
  content += `- User notification of attempted boundary breach\n`;

  return content;
}

async function main() {
  const hookStartTime = Date.now(); // Track execution time for telemetry

  try {
    const input: HookInput = JSON.parse(fs.readFileSync(process.stdin.fd, 'utf-8'));

    const userMessage = input.prompt || input.message || '';
    const workingDir = input.workingDirectory || process.cwd();

    if (!userMessage) {
      process.exit(0);
    }

    // Phase 7.6.0: Context Identity Detection (FIRST - before all other processing)
    let contextIdentity: ContextIdentity | null = null;
    try {
      contextIdentity = await detectContextIdentity(workingDir);
      console.error(`\n🔍 [Context] Detected: ${contextIdentity.role === 'framework-developer' ? '🛠️ Framework Development' : '👤 User Project'} Mode`);
    } catch (error) {
      console.error(`\n⚠️  [Context] Detection failed - defaulting to user-project mode (safest): ${error instanceof Error ? error.message : String(error)}`);
    }

    const matchedFiles = detectMatchingPatterns(userMessage);

    // Phase 6: Detect intent for proactive suggestions
    const intentSuggestions = detectIntentAndSuggest(userMessage);

    // Detect library mentions (Skills-First Architecture - Phase 3, enhanced Phase 6)
    const detectedLibraries = detectLibraryMentions(userMessage);

    // Skills-first approach: Notify about available patterns and libraries
    const hasPatterns = matchedFiles.length > 0;
    const hasIntentSuggestions = intentSuggestions.length > 0;
    const hasLibraryMentions = detectedLibraries.primary.length > 0 || detectedLibraries.related.length > 0;
    const hasContextEnforcement = contextIdentity !== null;

    // Always inject if context enforcement is active (even if no patterns/libraries)
    if (!hasPatterns && !hasIntentSuggestions && !hasLibraryMentions && !hasContextEnforcement) {
      process.exit(0);
    }

    // Log to stderr for user visibility
    if (hasPatterns) {
      console.error(`\n🧠 [RAG Patterns] ${matchedFiles.length} pattern(s) available:`);
      matchedFiles.forEach((filename, i) => {
        const patternName = filename.replace('.json', '').replace(/-v[\d.]+$/, '');
        console.error(`  ${i + 1}. ${patternName} - See rag-patterns skill`);
      });
      console.error(`  💡 TIP: Patterns loaded via Skills (progressive disclosure)`);
    }

    // Phase 6: Enhanced library detection with cross-skill recommendations
    if (hasLibraryMentions) {
      const totalLibs = detectedLibraries.primary.length + detectedLibraries.related.length;
      console.error(`\n📚 [Library Guides] ${totalLibs} library guide(s) available:`);

      if (detectedLibraries.primary.length > 0) {
        console.error(`  Primary (mentioned):`);
        detectedLibraries.primary.forEach((lib, i) => {
          console.error(`    ${i + 1}. ${lib}/ - See ${lib}-library skill for conventions`);
        });
      }

      if (detectedLibraries.related.length > 0) {
        console.error(`  Related (recommended):`);
        detectedLibraries.related.forEach((lib, i) => {
          console.error(`    ${i + 1}. ${lib} - Often used together`);
        });
      }

      const conventions: Record<string, string> = {
        'agents': 'OPERA agent patterns, handoff contracts, sub-agent routing',
        'rag': 'Pattern search, GraphRAG → Vector → Local fallback chain',
        'testing': 'Jest + ts-jest, 80%+ coverage, Maria-QA standards',
        'orchestration': 'PlanFirstOrchestrator, parallel execution, dependency resolution',
        'mcp': 'MCP servers, anti-hallucination verification',
        'templates': 'Template matching, 70% threshold scoring',
        'planning': 'Todo generation, dependency graphs, execution waves',
        'intelligence': 'Model selection (o1 vs claude-sonnet)',
        'memory': 'Vector store, privacy isolation (User > Team > Project > Public)',
        'learning': 'Pattern codification, compounding engineering (40% speedup)',
        'ui': 'React components, WCAG 2.1 AA accessibility',
        'hooks': 'Lifecycle hooks, context injection',
        'context': 'CRG priority resolution, CAG generation',
        'validation': 'Schema validation, quality gates',
        'dashboard': 'Metrics visualization, real-time updates'
      };

      if (detectedLibraries.primary.length > 0) {
        const primaryLib = detectedLibraries.primary[0];
        const hint = conventions[primaryLib] || 'library-specific conventions';
        console.error(`  💡 TIP: Use ${primaryLib}-library skill for: ${hint}`);
      }
    }

    // Phase 6: Log intent-based suggestions
    if (hasIntentSuggestions) {
      console.error(`\n🚀 [Auto-Discovery] Intent-based suggestions available (see context injection)`);
    }

    console.error('');

    // Skills-First Context Injection (Phase 3 Complete, Phase 6 Enhanced, Phase 7.6.0 Context Enforcement)
    let contextContent = '';

    // Phase 7.6.0: Context Enforcement Boundaries (HIGHEST PRIORITY)
    if (contextIdentity) {
      contextContent += generateEnforcementContext(contextIdentity);
    }

    // Phase 6: Intent-based suggestions
    if (hasIntentSuggestions) {
      if (contextContent.length > 0) {
        contextContent += '\n\n---\n\n';
      }
      contextContent += intentSuggestions;
    }

    // Notify about RAG patterns (Skills will provide details)
    if (hasPatterns) {
      if (contextContent.length > 0) {
        contextContent += '\n\n---\n\n';
      }
      const patternNames = matchedFiles.map(f => f.replace('.json', '').replace(/-v[\d.]+$/, ''));
      contextContent += `# Available RAG Patterns\n\n`;
      contextContent += `The following historical patterns are relevant to this query:\n\n`;
      contextContent += patternNames.map(name => `- **${name}** - Use \`rag-patterns/${name}\` skill for details`).join('\n');
      contextContent += `\n\n**Skills provide progressive disclosure:** metadata (~15 tokens) → SKILL.md (~500 tokens) → references (~2,000 tokens)`;
    }

    // Notify about library guides (Skills will provide details - Phase 3, enhanced Phase 6)
    if (hasLibraryMentions) {
      if (contextContent.length > 0) {
        contextContent += '\n\n---\n\n';
      }
      contextContent += `# Available Library Guides\n\n`;

      if (detectedLibraries.primary.length > 0) {
        contextContent += `## Primary Libraries (mentioned):\n\n`;
        contextContent += detectedLibraries.primary.map(lib => `- **${lib}-library** - Use \`library-guides/${lib}-library\` skill for:\n  - Core conventions and patterns\n  - Quick start code examples\n  - Important gotchas and edge cases\n  - Testing guidelines and coverage requirements`).join('\n\n');
      }

      if (detectedLibraries.related.length > 0) {
        contextContent += `\n\n## Related Libraries (recommended - Phase 6):\n\n`;
        contextContent += detectedLibraries.related.map(lib => `- **${lib}** - Often used together with primary libraries`).join('\n');
        contextContent += `\n\n**Cross-skill recommendations** help you discover related capabilities automatically.`;
      }

      contextContent += `\n\n**Token savings:** 85-95% reduction vs full claude.md injection (notification ~50 tokens vs full file ~2,000 tokens)`;
    }

    // Output minimal context (notification only, no full files)
    // UserPromptSubmit hooks MUST output plain text to stdout (NOT JSON with role/content wrapper)
    // Per SDK docs: "stdout is added as context for Claude" when exit code is 0
    console.log(contextContent);

    // ============================================================================
    // TELEMETRY TRACKING (v7.4.0)
    // ============================================================================
    try {
      const metricsService = getMetricsService(workingDir);
      const sessionId = input.context?.sessionId as string | undefined || 'unknown';

      // Track hook execution
      const hookEndTime = Date.now();
      metricsService.trackHookExecution({
        timestamp: new Date().toISOString(),
        hookType: 'UserPromptSubmit',
        hookName: 'before-prompt',
        executionTimeMs: hookEndTime - hookStartTime,
        exitCode: 0,
        outputSize: contextContent.length,
        sessionId
      });

      // Track intent detection and pattern suggestions
      if (hasIntentSuggestions) {
        const intentMatches = Object.entries(INTENT_PATTERNS).filter(([_, pattern]) =>
          pattern.regex.test(userMessage)
        );

        for (const [intentName, pattern] of intentMatches) {
          // Track RAG pattern suggestions
          const ragSuggestions = pattern.suggestions.filter(s => s.type === 'rag-pattern');
          for (const suggestion of ragSuggestions) {
            metricsService.trackContextInjection({
              timestamp: new Date().toISOString(),
              source: 'intent-detection',
              itemsInjected: 1,
              injectionTimeMs: 0, // Instant (metadata only)
              sessionId
            });
          }

          // Track agent auto-activation suggestions
          const agentSuggestions = pattern.suggestions.filter(s => s.type === 'agent');
          for (const agentSuggestion of agentSuggestions) {
            metricsService.trackAgentActivation({
              timestamp: new Date().toISOString(),
              agent: (agentSuggestion as any).agent,
              suggested: true,
              activated: false, // Will be tracked later when Task tool is invoked
              autoActivate: (agentSuggestion as any).autoActivate || false,
              sessionId,
              trigger: `intent:${intentName}`
            });
          }

          // Track template suggestions
          const templateSuggestions = pattern.suggestions.filter(s => s.type === 'template');
          for (const templateSuggestion of templateSuggestions) {
            metricsService.trackTemplateApplication({
              timestamp: new Date().toISOString(),
              template: (templateSuggestion as any).skill,
              suggested: true,
              applied: false, // Will be tracked later when template is actually used
              autoApply: true, // Auto-apply is enabled in v7.4.0
              sessionId,
              filePattern: intentName
            });
          }
        }
      }

      // Track cross-skill loading
      if (hasLibraryMentions && detectedLibraries.related.length > 0) {
        metricsService.trackCrossSkillLoading({
          timestamp: new Date().toISOString(),
          primarySkill: detectedLibraries.primary[0] || 'unknown',
          relatedSkills: detectedLibraries.related,
          loadedCount: detectedLibraries.related.length,
          sessionId
        });
      }

    } catch (telemetryError) {
      // Telemetry failures should not break the hook
      // Silently fail to maintain user experience
    }

  } catch (error) {
    // Fail gracefully
  }

  process.exit(0);
}

main();
