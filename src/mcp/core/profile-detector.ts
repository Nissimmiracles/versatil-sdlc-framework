/**
 * VERSATIL MCP Profile Detector
 * Auto-detects optimal profile based on agent, files, and task context
 */

import { ProfileManager, AgentContext, ProfileRecommendation } from './profile-manager.js';
import { VERSATILLogger } from '../../utils/logger.js';

export interface DetectionContext {
  agent?: string;
  recentFiles?: string[];
  task?: string;
  userPreference?: string;
}

/**
 * Extract keywords from task description
 */
function extractTaskKeywords(task: string): string[] {
  const keywords: string[] = [];
  const taskLower = task.toLowerCase();

  // Check for common keywords
  const keywordPatterns = [
    'database',
    'migration',
    'rag',
    'embedding',
    'test',
    'qa',
    'security',
    'ml',
    'model',
    'deploy',
    'docker',
    'frontend',
    'react',
    'api',
  ];

  for (const keyword of keywordPatterns) {
    if (taskLower.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

/**
 * Detect optimal profile for given context
 */
export async function detectProfile(
  context: DetectionContext,
  profileManager: ProfileManager,
  logger?: VERSATILLogger
): Promise<ProfileRecommendation> {
  const log = logger || new VERSATILLogger('ProfileDetector');

  // Build agent context
  const agentContext: AgentContext = {
    agent: context.agent,
    recentFiles: context.recentFiles || [],
    taskKeywords: context.task ? extractTaskKeywords(context.task) : [],
    userPreference: context.userPreference,
  };

  log.info('Detecting profile', {
    agent: agentContext.agent,
    recentFiles: agentContext.recentFiles?.length || 0,
    taskKeywords: agentContext.taskKeywords,
  });

  // Get recommendation from profile manager
  const recommendation = await profileManager.recommendProfile(agentContext);

  log.info('Profile recommendation', {
    profile: recommendation.profile,
    confidence: recommendation.confidence,
    reason: recommendation.reason,
  });

  return recommendation;
}

/**
 * Decision tree for profile selection (rule-based)
 */
export function detectProfileRuleBased(context: DetectionContext): string {
  // Priority 1: User explicit preference
  if (context.userPreference) {
    return context.userPreference;
  }

  // Priority 2: Agent-based detection
  if (context.agent) {
    switch (context.agent) {
      case 'guardian':
        return 'coding';

      case 'dana-database':
      case 'dr-ai-ml':
        return 'ml';

      case 'james-frontend':
      case 'maria-qa':
        return 'testing';

      case 'marcus-backend':
      case 'alex-ba':
      case 'sarah-pm':
      case 'oliver-mcp':
        return 'coding';

      default:
        // Unknown agent, check other heuristics
        break;
    }
  }

  // Priority 3: File-based detection
  if (context.recentFiles && context.recentFiles.length > 0) {
    const files = context.recentFiles.join(' ');

    if (files.includes('.sql') || files.includes('migration')) {
      return 'ml';
    }

    if (files.includes('.test.') || files.includes('.spec.') || files.includes('.e2e.')) {
      return 'testing';
    }

    if (files.includes('embedding') || files.includes('rag')) {
      return 'ml';
    }
  }

  // Priority 4: Task-based detection
  if (context.task) {
    const taskLower = context.task.toLowerCase();

    if (
      taskLower.includes('database') ||
      taskLower.includes('migration') ||
      taskLower.includes('rag') ||
      taskLower.includes('embedding') ||
      taskLower.includes('ml') ||
      taskLower.includes('model')
    ) {
      return 'ml';
    }

    if (
      taskLower.includes('test') ||
      taskLower.includes('qa') ||
      taskLower.includes('security') ||
      taskLower.includes('lighthouse') ||
      taskLower.includes('accessibility')
    ) {
      return 'testing';
    }
  }

  // Default: coding profile
  return 'coding';
}

/**
 * Suggest profile upgrade based on current work
 */
export function suggestProfileUpgrade(
  currentProfile: string,
  recentToolCalls: string[]
): { shouldUpgrade: boolean; suggestedProfile: string; reason: string } | null {
  // If user is in coding profile but using many ML tools, suggest upgrade
  if (currentProfile === 'coding') {
    const mlToolCalls = recentToolCalls.filter(tool =>
      tool.includes('embedding') ||
      tool.includes('rag') ||
      tool.includes('vertex') ||
      tool.includes('openai') ||
      tool.includes('database')
    );

    if (mlToolCalls.length >= 3) {
      return {
        shouldUpgrade: true,
        suggestedProfile: 'ml',
        reason: `Detected ${mlToolCalls.length} ML/database tool calls. Consider upgrading to 'ml' profile for better performance.`,
      };
    }

    const testingToolCalls = recentToolCalls.filter(tool =>
      tool.includes('test') ||
      tool.includes('coverage') ||
      tool.includes('playwright') ||
      tool.includes('lighthouse')
    );

    if (testingToolCalls.length >= 3) {
      return {
        shouldUpgrade: true,
        suggestedProfile: 'testing',
        reason: `Detected ${testingToolCalls.length} testing tool calls. Consider upgrading to 'testing' profile.`,
      };
    }
  }

  return null;
}
