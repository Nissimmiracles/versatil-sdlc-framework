/**
 * VERSATIL Help Context Detector
 *
 * Provides context-aware help suggestions based on:
 * - Current file being edited
 * - Recent errors or issues
 * - Active agents
 * - Project state
 *
 * Usage:
 * - detectContext(): Analyze current context
 * - suggestHelpTopics(): Get relevant help topics
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Context information
 */
export interface Context {
  currentFile?: string;
  fileType?: string;
  recentErrors?: string[];
  activeAgents?: string[];
  frameworkHealth?: number;
  projectState?: {
    hasTests?: boolean;
    hasAPI?: boolean;
    hasFrontend?: boolean;
    hasDatabase?: boolean;
  };
}

/**
 * Help suggestion with reasoning
 */
export interface HelpSuggestion {
  topic: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  command?: string;
}

/**
 * Detect current context
 */
export function detectContext(): Context {
  const context: Context = {};

  // Detect current file (simulated - in real implementation, would integrate with IDE)
  context.currentFile = detectCurrentFile();
  context.fileType = detectFileType(context.currentFile);

  // Detect recent errors
  context.recentErrors = detectRecentErrors();

  // Detect active agents
  context.activeAgents = detectActiveAgents();

  // Detect framework health
  context.frameworkHealth = detectFrameworkHealth();

  // Detect project state
  context.projectState = detectProjectState();

  return context;
}

/**
 * Suggest help topics based on context
 */
export function suggestHelpTopics(context: Context): HelpSuggestion[] {
  const suggestions: HelpSuggestion[] = [];

  // File type-based suggestions
  if (context.fileType === 'test') {
    suggestions.push({
      topic: 'maria-qa',
      reason: 'You are editing a test file',
      priority: 'high',
      command: '/help maria-qa',
    });
    suggestions.push({
      topic: 'instinctive-testing',
      reason: 'Learn about proactive testing workflow',
      priority: 'medium',
      command: '/help instinctive-testing',
    });
  } else if (context.fileType === 'api') {
    suggestions.push({
      topic: 'marcus-backend',
      reason: 'You are editing an API file',
      priority: 'high',
      command: '/help marcus-backend',
    });
    suggestions.push({
      topic: 'rule-2',
      reason: 'Learn about automated stress testing',
      priority: 'medium',
      command: '/help rule-2',
    });
  } else if (context.fileType === 'component') {
    suggestions.push({
      topic: 'james-frontend',
      reason: 'You are editing a UI component',
      priority: 'high',
      command: '/help james-frontend',
    });
  } else if (context.fileType === 'database') {
    suggestions.push({
      topic: 'dana-database',
      reason: 'You are editing a database file',
      priority: 'high',
      command: '/help dana-database',
    });
  }

  // Error-based suggestions
  if (context.recentErrors) {
    for (const error of context.recentErrors) {
      if (error.includes('MCP')) {
        suggestions.push({
          topic: 'troubleshooting',
          reason: 'Recent MCP server errors detected',
          priority: 'high',
          command: '/help troubleshooting → MCP Server Errors',
        });
        suggestions.push({
          topic: 'oliver-mcp',
          reason: 'Learn about MCP orchestration',
          priority: 'medium',
          command: '/help oliver-mcp',
        });
      } else if (error.includes('coverage')) {
        suggestions.push({
          topic: 'maria-qa',
          reason: 'Test coverage issues detected',
          priority: 'high',
          command: '/help maria-qa',
        });
      } else if (error.includes('build')) {
        suggestions.push({
          topic: 'troubleshooting',
          reason: 'Build failures detected',
          priority: 'high',
          command: '/help troubleshooting → Build Failures',
        });
      } else if (error.includes('isolation')) {
        suggestions.push({
          topic: 'isolation',
          reason: 'Isolation violations detected',
          priority: 'high',
          command: '/help isolation',
        });
      }
    }
  }

  // Health-based suggestions
  if (context.frameworkHealth !== undefined && context.frameworkHealth < 80) {
    suggestions.push({
      topic: 'troubleshooting',
      reason: `Framework health is ${context.frameworkHealth}% (below 80%)`,
      priority: 'high',
      command: '/help troubleshooting → Framework Health',
    });
    suggestions.push({
      topic: 'monitoring',
      reason: 'Learn about framework monitoring',
      priority: 'medium',
      command: '/help monitoring',
    });
  }

  // Project state-based suggestions
  if (context.projectState) {
    if (!context.projectState.hasTests) {
      suggestions.push({
        topic: 'maria-qa',
        reason: 'No tests detected in project',
        priority: 'medium',
        command: '/help maria-qa',
      });
    }
  }

  // Active agent-based suggestions
  if (context.activeAgents) {
    for (const agent of context.activeAgents) {
      if (agent === 'maria-qa') {
        suggestions.push({
          topic: 'maria-qa',
          reason: 'Maria-QA is currently active',
          priority: 'low',
          command: '/help maria-qa',
        });
      }
    }
  }

  // Remove duplicates and sort by priority
  const uniqueSuggestions = deduplicateSuggestions(suggestions);
  return sortSuggestionsByPriority(uniqueSuggestions);
}

/**
 * Detect current file being edited (simulated)
 */
function detectCurrentFile(): string | undefined {
  // In real implementation, would integrate with IDE/editor
  // For now, return undefined
  return undefined;
}

/**
 * Detect file type from filename
 */
function detectFileType(filename?: string): string | undefined {
  if (!filename) return undefined;

  const lowerFilename = filename.toLowerCase();

  if (
    lowerFilename.includes('.test.') ||
    lowerFilename.includes('.spec.') ||
    lowerFilename.includes('__tests__')
  ) {
    return 'test';
  } else if (
    lowerFilename.includes('/api/') ||
    lowerFilename.includes('controller') ||
    lowerFilename.includes('route')
  ) {
    return 'api';
  } else if (
    lowerFilename.endsWith('.tsx') ||
    lowerFilename.endsWith('.jsx') ||
    lowerFilename.endsWith('.vue')
  ) {
    return 'component';
  } else if (
    lowerFilename.endsWith('.sql') ||
    lowerFilename.includes('migration') ||
    lowerFilename.includes('schema')
  ) {
    return 'database';
  }

  return undefined;
}

/**
 * Detect recent errors from logs
 */
function detectRecentErrors(): string[] {
  const errors: string[] = [];

  try {
    // Check framework logs for recent errors
    const logPath = path.join(
      process.env.HOME || '~',
      '.versatil',
      'logs',
      'framework.log'
    );

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf-8');
      const lines = logContent.split('\n').slice(-100); // Last 100 lines

      for (const line of lines) {
        if (line.includes('ERROR') || line.includes('WARN')) {
          // Extract error type
          if (line.includes('MCP')) errors.push('MCP');
          if (line.includes('coverage')) errors.push('coverage');
          if (line.includes('build')) errors.push('build');
          if (line.includes('isolation')) errors.push('isolation');
        }
      }
    }
  } catch (error) {
    // Ignore errors reading logs
  }

  return [...new Set(errors)]; // Remove duplicates
}

/**
 * Detect active agents
 */
function detectActiveAgents(): string[] {
  const agents: string[] = [];

  try {
    // Check for active agent processes or recent activity
    // For now, return empty array (would be implemented with real agent tracking)
  } catch (error) {
    // Ignore errors
  }

  return agents;
}

/**
 * Detect framework health
 */
function detectFrameworkHealth(): number | undefined {
  try {
    // Would run actual health check
    // For now, return undefined
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Detect project state
 */
function detectProjectState(): Context['projectState'] {
  const state: Context['projectState'] = {};

  try {
    const cwd = process.cwd();

    // Check for tests
    const testPaths = ['tests/', 'test/', 'spec/', '__tests__/'];
    state.hasTests = testPaths.some((p) =>
      fs.existsSync(path.join(cwd, p))
    );

    // Check for API
    const apiPaths = ['src/api/', 'api/', 'routes/', 'controllers/'];
    state.hasAPI = apiPaths.some((p) =>
      fs.existsSync(path.join(cwd, p))
    );

    // Check for frontend
    const frontendPaths = [
      'src/components/',
      'components/',
      'src/pages/',
      'pages/',
    ];
    state.hasFrontend = frontendPaths.some((p) =>
      fs.existsSync(path.join(cwd, p))
    );

    // Check for database
    const dbPaths = [
      'migrations/',
      'supabase/',
      'prisma/',
      'db/',
      'database/',
    ];
    state.hasDatabase = dbPaths.some((p) =>
      fs.existsSync(path.join(cwd, p))
    );
  } catch (error) {
    // Ignore errors
  }

  return state;
}

/**
 * Remove duplicate suggestions (by topic)
 */
function deduplicateSuggestions(
  suggestions: HelpSuggestion[]
): HelpSuggestion[] {
  const seen = new Set<string>();
  const unique: HelpSuggestion[] = [];

  for (const suggestion of suggestions) {
    if (!seen.has(suggestion.topic)) {
      seen.add(suggestion.topic);
      unique.push(suggestion);
    }
  }

  return unique;
}

/**
 * Sort suggestions by priority
 */
function sortSuggestionsByPriority(
  suggestions: HelpSuggestion[]
): HelpSuggestion[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Format suggestions for display
 */
export function formatSuggestions(suggestions: HelpSuggestion[]): string {
  if (suggestions.length === 0) {
    return '';
  }

  let output = '\n**Context-Aware Suggestions**:\n\n';

  for (const suggestion of suggestions) {
    const priority = suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢';
    output += `${priority} **${suggestion.topic}** - ${suggestion.reason}\n`;
    if (suggestion.command) {
      output += `   Command: ${suggestion.command}\n`;
    }
    output += '\n';
  }

  return output;
}

/**
 * Quick context-aware help (main entry point)
 */
export function getContextAwareHelp(): string {
  const context = detectContext();
  const suggestions = suggestHelpTopics(context);

  let output = '🤖 VERSATIL Help - Context-Aware Suggestions\n\n';

  if (context.currentFile) {
    output += `**Current File**: ${context.currentFile}\n`;
    output += `**File Type**: ${context.fileType}\n\n`;
  }

  if (context.frameworkHealth !== undefined) {
    output += `**Framework Health**: ${context.frameworkHealth}%\n\n`;
  }

  output += formatSuggestions(suggestions);

  if (suggestions.length === 0) {
    output += '\nNo specific suggestions. Use `/help` for general help.\n';
  }

  return output;
}
