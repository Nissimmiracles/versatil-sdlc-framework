#!/usr/bin/env tsx
/**
 * OPERA Phase Detection Script
 *
 * Detects current OPERA phase based on command and context.
 *
 * Usage:
 *   npx tsx execute-phase-detection.ts \
 *     --command "/plan" \
 *     --context "User requested feature planning"
 */

interface PhaseMetadata {
  description: string;
  agents: string[];
  next_phase: string;
  typical_duration: string;
  outputs: string[];
}

const PHASES: Record<string, PhaseMetadata> = {
  OBSERVE: {
    description: 'Gather context, understand requirements, analyze current state',
    agents: ['Alex-BA', 'Sarah-PM', 'Oliver-MCP'],
    next_phase: 'PLAN',
    typical_duration: '10-20% of project',
    outputs: ['Requirements analysis', 'User stories', 'Context documentation']
  },
  PLAN: {
    description: 'Design solution, estimate effort, create implementation roadmap',
    agents: ['Sarah-PM', 'Alex-BA', 'Marcus-Backend', 'James-Frontend'],
    next_phase: 'EXECUTE',
    typical_duration: '15-25% of project',
    outputs: ['Architecture design', 'Todo files', 'Effort estimates']
  },
  EXECUTE: {
    description: 'Implement solution, write code, build features',
    agents: ['Marcus-Backend', 'James-Frontend', 'Dana-Database', 'Dr.AI-ML'],
    next_phase: 'REFINE',
    typical_duration: '50-60% of project',
    outputs: ['Code commits', 'Feature implementation', 'Database migrations']
  },
  REFINE: {
    description: 'Test, review, validate, fix issues',
    agents: ['Maria-QA', 'Victor-Verifier', 'Sarah-PM'],
    next_phase: 'CODIFY',
    typical_duration: '10-20% of project',
    outputs: ['Test results', 'Code reviews', 'Bug fixes', 'Quality reports']
  },
  CODIFY: {
    description: 'Store learnings, update patterns, improve framework',
    agents: ['Feedback-Codifier', 'Sarah-PM'],
    next_phase: 'ARCHIVE',
    typical_duration: '5-10% of project',
    outputs: ['RAG memories', 'Updated templates', 'Lessons learned']
  },
  ARCHIVE: {
    description: 'Document, deploy, close out project',
    agents: ['Sarah-PM', 'Oliver-MCP'],
    next_phase: 'OBSERVE',
    typical_duration: '5-10% of project',
    outputs: ['Deployment logs', 'Project documentation', 'Retrospective']
  }
};

const COMMAND_PHASE_MAP: Record<string, string> = {
  '/assess': 'OBSERVE',
  '/plan': 'PLAN',
  '/work': 'EXECUTE',
  '/delegate': 'EXECUTE',
  '/review': 'REFINE',
  '/triage': 'REFINE',
  '/validate-workflow': 'REFINE',
  '/learn': 'CODIFY'
};

interface CLIArgs {
  command?: string;
  context?: string;
  currentPhase?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--command' && args[i + 1]) {
      parsed.command = args[i + 1];
      i++;
    } else if (arg === '--context' && args[i + 1]) {
      parsed.context = args[i + 1];
      i++;
    } else if (arg === '--current-phase' && args[i + 1]) {
      parsed.currentPhase = args[i + 1];
      i++;
    }
  }

  return parsed;
}

function detectPhaseFromCommand(command: string): string | null {
  return COMMAND_PHASE_MAP[command] || null;
}

function detectPhaseFromContext(context: string): string | null {
  const contextLower = context.toLowerCase();

  if (contextLower.includes('requirements') || contextLower.includes('analyze')) {
    return 'OBSERVE';
  }
  if (contextLower.includes('plan') || contextLower.includes('design')) {
    return 'PLAN';
  }
  if (contextLower.includes('implement') || contextLower.includes('build') || contextLower.includes('code')) {
    return 'EXECUTE';
  }
  if (contextLower.includes('test') || contextLower.includes('review') || contextLower.includes('fix')) {
    return 'REFINE';
  }
  if (contextLower.includes('learn') || contextLower.includes('codify') || contextLower.includes('retrospective')) {
    return 'CODIFY';
  }
  if (contextLower.includes('deploy') || contextLower.includes('document') || contextLower.includes('archive')) {
    return 'ARCHIVE';
  }

  return null;
}

async function main() {
  try {
    const args = parseArgs();

    let detectedPhase: string | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Strategy 1: Explicit override
    if (args.currentPhase) {
      detectedPhase = args.currentPhase.toUpperCase();
      confidence = 'high';
    }
    // Strategy 2: Command-based detection
    else if (args.command) {
      detectedPhase = detectPhaseFromCommand(args.command);
      confidence = detectedPhase ? 'high' : 'low';
    }
    // Strategy 3: Context-based detection
    else if (args.context) {
      detectedPhase = detectPhaseFromContext(args.context);
      confidence = detectedPhase ? 'medium' : 'low';
    }

    // Default to PLAN if no detection
    if (!detectedPhase) {
      detectedPhase = 'PLAN';
      confidence = 'low';
    }

    const metadata = PHASES[detectedPhase];

    const result = {
      phase: detectedPhase,
      metadata,
      context_analyzed: args.context || 'none',
      command_analyzed: args.command || 'none',
      confidence
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      phase: 'UNKNOWN',
      confidence: 'low'
    }, null, 2));
    process.exit(1);
  }
}

main();
