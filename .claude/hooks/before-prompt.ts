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
 * Detect library mentions and return skill notifications (Skills-First Architecture)
 * Instead of loading full claude.md files, notify about available library-guides skills.
 */
function detectLibraryMentions(userMessage: string): string[] {
  const libraries = [
    'agents', 'orchestration', 'rag', 'testing', 'mcp',
    'templates', 'planning', 'intelligence', 'memory', 'learning',
    'ui', 'hooks', 'context', 'validation', 'dashboard'
  ];

  const messageLower = userMessage.toLowerCase();
  const detectedLibraries: string[] = [];

  for (const library of libraries) {
    // Check if library name is mentioned in prompt
    const libraryPattern = new RegExp(`\\b${library}\\b|src/${library}/`, 'i');
    if (libraryPattern.test(messageLower)) {
      detectedLibraries.push(library);
    }
  }

  return detectedLibraries;
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync(process.stdin.fd, 'utf-8'));

    const userMessage = input.prompt || input.message || '';
    const workingDir = input.workingDirectory || process.cwd();

    if (!userMessage) {
      process.exit(0);
    }

    const matchedFiles = detectMatchingPatterns(userMessage);

    // Detect library mentions (Skills-First Architecture - Phase 3)
    const detectedLibraries = detectLibraryMentions(userMessage);

    // Skills-first approach: Notify about available patterns and libraries
    const hasPatterns = matchedFiles.length > 0;
    const hasLibraryMentions = detectedLibraries.length > 0;

    // Exit if nothing to inject
    if (!hasPatterns && !hasLibraryMentions) {
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

    if (hasLibraryMentions) {
      console.error(`\n📚 [Library Guides] ${detectedLibraries.length} library guide(s) available:`);
      detectedLibraries.forEach((lib, i) => {
        console.error(`  ${i + 1}. ${lib}/ - See ${lib}-library skill for conventions`);
      });

      const conventions = {
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

      const primaryLib = detectedLibraries[0];
      const hint = conventions[primaryLib] || 'library-specific conventions';
      console.error(`  💡 TIP: Use ${primaryLib}-library skill for: ${hint}`);
    }

    console.error('');

    // Skills-First Context Injection (Phase 3 Complete)
    let contextContent = '';

    // Notify about RAG patterns (Skills will provide details)
    if (hasPatterns) {
      const patternNames = matchedFiles.map(f => f.replace('.json', '').replace(/-v[\d.]+$/, ''));
      contextContent += `# Available RAG Patterns\n\n`;
      contextContent += `The following historical patterns are relevant to this query:\n\n`;
      contextContent += patternNames.map(name => `- **${name}** - Use \`rag-patterns/${name}\` skill for details`).join('\n');
      contextContent += `\n\n**Skills provide progressive disclosure:** metadata (~15 tokens) → SKILL.md (~500 tokens) → references (~2,000 tokens)`;
    }

    // Notify about library guides (Skills will provide details - Phase 3 NEW)
    if (hasLibraryMentions) {
      if (hasPatterns) {
        contextContent += '\n\n---\n\n';
      }
      contextContent += `# Available Library Guides\n\n`;
      contextContent += `The following library-specific guides are relevant:\n\n`;
      contextContent += detectedLibraries.map(lib => `- **${lib}-library** - Use \`library-guides/${lib}-library\` skill for:\n  - Core conventions and patterns\n  - Quick start code examples\n  - Important gotchas and edge cases\n  - Testing guidelines and coverage requirements`).join('\n\n');
      contextContent += `\n\n**Token savings:** 85-95% reduction vs full claude.md injection (notification ~50 tokens vs full file ~2,000 tokens)`;
    }

    // Output minimal context (notification only, no full files)
    const combinedContext = {
      role: 'system',
      content: contextContent
    };

    console.log(JSON.stringify(combinedContext));

  } catch (error) {
    // Fail gracefully
  }

  process.exit(0);
}

main();
