/**
 * VERSATIL SDLC Framework - Guardian Layer Classifier
 *
 * Classifies issues into three verification layers:
 * - Framework Layer: Infrastructure (build, agents, hooks, MCP, RAG)
 * - Project Layer: Application code (tests, security, quality)
 * - Context Layer: Preferences (user prefs, team conventions, vision)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */

import type { HealthIssue } from './types.js';

export type VerificationLayer = 'framework' | 'project' | 'context';

export interface LayerClassification {
  layer: VerificationLayer;
  confidence: number; // 0-100 confidence in classification
  matched_patterns: string[];
  reasoning: string;
}

/**
 * Pattern definitions for each layer
 * Each pattern maps to a specific verification layer
 */
const LAYER_PATTERNS: Record<VerificationLayer, RegExp[]> = {
  // Framework Layer: Infrastructure components
  framework: [
    // Build system
    /build.*fail/i,
    /compilation.*error/i,
    /typescript.*error/i,
    /tsc.*error/i,
    /npm.*build/i,

    // Agent system
    /agent.*invalid/i,
    /agent.*definition/i,
    /agent.*not.*found/i,
    /handoff.*contract/i,
    /agent.*registry/i,

    // Hook system
    /hook.*not.*found/i,
    /hook.*error/i,
    /lifecycle.*hook/i,
    /before-prompt/i,
    /post-file-edit/i,
    /session-codify/i,

    // MCP server
    /mcp.*error/i,
    /mcp.*server/i,
    /mcp.*tool/i,
    /versatil-mcp/i,

    // RAG system
    /rag.*health/i,
    /rag.*error/i,
    /graphrag/i,
    /vector.*store/i,
    /rag.*router/i,

    // Orchestration
    /flywheel/i,
    /sdlc.*phase/i,
    /orchestrator/i,

    // Template/Pattern system
    /template.*match/i,
    /pattern.*search/i,
    /compounding/i
  ],

  // Project Layer: Application code quality
  project: [
    // Testing
    /test.*fail/i,
    /test.*error/i,
    /coverage.*below/i,
    /jest.*error/i,
    /vitest.*error/i,
    /playwright.*error/i,

    // Security
    /security.*vulnerabilit/i,
    /npm.*audit/i,
    /cve-\d+/i,
    /semgrep/i,
    /owasp/i,

    // Code quality
    /eslint/i,
    /prettier/i,
    /lint.*error/i,
    /code.*quality/i,

    // Accessibility
    /accessibility/i,
    /wcag/i,
    /axe-core/i,
    /aria/i,

    // Performance
    /performance/i,
    /lighthouse/i,
    /bundle.*size/i,
    /api.*response.*time/i,

    // Dependencies
    /outdated.*dependenc/i,
    /package.*version/i,
    /npm.*update/i,

    // Database
    /database.*error/i,
    /migration.*fail/i,
    /sql.*error/i,
    /prisma/i
  ],

  // Context Layer: User/Team/Project preferences
  context: [
    // Style consistency
    /style.*inconsistent/i,
    /indentation.*incorrect/i,
    /tabs.*vs.*spaces/i,
    /quote.*style/i,
    /naming.*convention/i,

    // Team conventions
    /convention.*violation/i,
    /team.*standard/i,
    /commit.*message.*format/i,
    /branch.*naming/i,

    // User preferences
    /user.*preference/i,
    /personal.*style/i,

    // Project vision
    /vision.*misalign/i,
    /goal.*conflict/i,
    /priority.*mismatch/i,

    // Code style
    /async.*style/i,
    /error.*handling.*pattern/i,
    /test.*framework.*mismatch/i
  ]
};

/**
 * Component-to-layer mapping
 * Some components clearly belong to specific layers
 */
const COMPONENT_LAYER_MAP: Record<string, VerificationLayer> = {
  // Framework components
  'build-system': 'framework',
  'typescript': 'framework',
  'agent-system': 'framework',
  'agent-registry': 'framework',
  'hook-system': 'framework',
  'mcp-server': 'framework',
  'rag-system': 'framework',
  'graphrag': 'framework',
  'flywheel': 'framework',
  'orchestrator': 'framework',
  'template-matcher': 'framework',
  'pattern-search': 'framework',

  // Project components
  'test-runner': 'project',
  'test-coverage': 'project',
  'security-audit': 'project',
  'code-quality': 'project',
  'accessibility-audit': 'project',
  'performance-monitor': 'project',
  'dependency-manager': 'project',
  'database': 'project',

  // Context components
  'user-preferences': 'context',
  'team-conventions': 'context',
  'project-vision': 'context',
  'style-checker': 'context'
};

/**
 * Classify issue into verification layer
 */
export function classifyIssueLayer(issue: HealthIssue): LayerClassification {
  const matchedPatterns: { layer: VerificationLayer; pattern: string }[] = [];

  // Step 1: Check component mapping (highest confidence)
  const componentLayer = COMPONENT_LAYER_MAP[issue.component];
  if (componentLayer) {
    return {
      layer: componentLayer,
      confidence: 95,
      matched_patterns: [`component:${issue.component}`],
      reasoning: `Component '${issue.component}' maps directly to ${componentLayer} layer`
    };
  }

  // Step 2: Pattern matching on description
  const searchText = `${issue.component} ${issue.description}`.toLowerCase();

  for (const [layer, patterns] of Object.entries(LAYER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        matchedPatterns.push({
          layer: layer as VerificationLayer,
          pattern: pattern.source
        });
      }
    }
  }

  // Step 3: Determine layer by vote
  if (matchedPatterns.length === 0) {
    // No matches - default to project layer (most common)
    return {
      layer: 'project',
      confidence: 50,
      matched_patterns: [],
      reasoning: 'No patterns matched, defaulting to project layer'
    };
  }

  // Count votes per layer
  const layerVotes: Record<VerificationLayer, number> = {
    framework: 0,
    project: 0,
    context: 0
  };

  for (const match of matchedPatterns) {
    layerVotes[match.layer]++;
  }

  // Find layer with most votes
  const winningLayer = (Object.entries(layerVotes) as [VerificationLayer, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const totalVotes = matchedPatterns.length;
  const winningVotes = layerVotes[winningLayer];

  // Calculate confidence based on vote ratio
  const confidence = Math.round((winningVotes / totalVotes) * 100);

  return {
    layer: winningLayer,
    confidence,
    matched_patterns: matchedPatterns
      .filter(m => m.layer === winningLayer)
      .map(m => m.pattern)
      .slice(0, 3), // Top 3 patterns
    reasoning: `Matched ${winningVotes}/${totalVotes} patterns for ${winningLayer} layer`
  };
}

/**
 * Classify multiple issues in batch
 */
export function classifyIssues(issues: HealthIssue[]): Map<HealthIssue, LayerClassification> {
  const classifications = new Map<HealthIssue, LayerClassification>();

  for (const issue of issues) {
    classifications.set(issue, classifyIssueLayer(issue));
  }

  return classifications;
}

/**
 * Get layer statistics for a set of issues
 */
export function getLayerStatistics(
  classifications: Map<HealthIssue, LayerClassification>
): {
  total: number;
  by_layer: Record<VerificationLayer, number>;
  avg_confidence: Record<VerificationLayer, number>;
} {
  const stats = {
    total: classifications.size,
    by_layer: {
      framework: 0,
      project: 0,
      context: 0
    },
    avg_confidence: {
      framework: 0,
      project: 0,
      context: 0
    }
  };

  // Count issues per layer and sum confidence
  const confidenceSums: Record<VerificationLayer, number> = {
    framework: 0,
    project: 0,
    context: 0
  };

  for (const classification of classifications.values()) {
    stats.by_layer[classification.layer]++;
    confidenceSums[classification.layer] += classification.confidence;
  }

  // Calculate average confidence per layer
  for (const layer of ['framework', 'project', 'context'] as VerificationLayer[]) {
    if (stats.by_layer[layer] > 0) {
      stats.avg_confidence[layer] = Math.round(
        confidenceSums[layer] / stats.by_layer[layer]
      );
    }
  }

  return stats;
}

/**
 * Export layer-specific agent routing rules
 * Used by verified-issue-detector for agent assignment
 */
export const LAYER_AGENT_ROUTING = {
  framework: {
    'build-failure': 'Maria-QA',
    'typescript-error': 'Marcus-Backend',
    'agent-invalid': 'Sarah-PM',  // Framework-only agent
    'hook-error': 'Marcus-Backend',
    'mcp-error': 'Oliver-MCP',
    'rag-health': 'Dr.AI-ML',
    'orchestrator-error': 'Sarah-PM'
  },
  project: {
    'test-failure': 'Maria-QA',
    'test-coverage': 'Maria-QA',
    'security-vulnerability': 'Marcus-Backend',
    'code-quality': 'Maria-QA',
    'accessibility': 'James-Frontend',
    'performance': 'James-Frontend',
    'database': 'Dana-Database',
    'dependency': 'Marcus-Backend'
  },
  context: {
    'style-violation': 'git-blame',  // Special: Use git blame to find author
    'convention-violation': 'Alex-BA',
    'vision-misalignment': 'Sarah-PM',  // Framework-only agent
    'preference-mismatch': 'git-blame'
  }
} as const;
