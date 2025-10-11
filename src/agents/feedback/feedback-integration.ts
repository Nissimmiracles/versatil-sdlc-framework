/**
 * VERSATIL v6.1 - Feedback Integration
 *
 * Integrates GitPRFeedbackAgent with existing framework components
 * to automatically capture user sentiment during agent activations.
 */

import { getGitPRFeedbackAgent } from './git-pr-feedback-agent.js';
import type { UserFeedback } from './git-pr-feedback-agent.js';
import type { AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';

/**
 * Initialize feedback collection
 */
export async function initializeFeedbackCollection(
  vectorStore?: EnhancedVectorMemoryStore,
  githubOwner: string = 'versatil-sdlc-framework',
  githubRepo: string = 'versatil-framework'
): Promise<void> {
  const feedbackAgent = getGitPRFeedbackAgent({
    enabled: process.env.FEEDBACK_COLLECTION_ENABLED === 'true',
    sentimentThreshold: parseFloat(process.env.FEEDBACK_SENTIMENT_THRESHOLD || '-0.3'),
    minFeedbackForPR: parseInt(process.env.FEEDBACK_MIN_FOR_PR || '3'),
    autoSubmitPR: process.env.FEEDBACK_AUTO_SUBMIT_PR === 'true',
    collectionInterval: parseInt(process.env.FEEDBACK_COLLECTION_INTERVAL || '3600000'), // 1 hour
    vectorStore,
    githubConfig: {
      owner: githubOwner,
      repo: githubRepo,
      baseBranch: 'main',
      autoCreateBranch: true,
      prLabels: ['user-feedback', 'automated'],
      assignees: process.env.FEEDBACK_PR_ASSIGNEES?.split(',')
    }
  });

  await feedbackAgent.start();

  console.log('[FeedbackIntegration] ✅ Feedback collection initialized');
}

/**
 * Capture feedback from agent activation
 */
export async function captureAgentFeedback(
  agentId: string,
  context: AgentActivationContext,
  response: AgentResponse,
  executionTime: number
): Promise<void> {
  try {
    const feedbackAgent = getGitPRFeedbackAgent();

    // Determine if this was a negative experience
    const wasSuccess = response.priority !== 'critical' &&
                       !response.context?.error &&
                       executionTime < 30000; // < 30s

    // Extract keywords from suggestions
    const keywords: string[] = [];
    if (response.suggestions) {
      response.suggestions.forEach(s => {
        if (s.type) keywords.push(s.type);
        if (s.priority === 'critical' || s.priority === 'high') {
          keywords.push('urgent');
        }
      });
    }

    // Determine category
    let category: UserFeedback['category'] = 'other';
    if (response.context?.error) category = 'bug';
    else if (executionTime > 20000) category = 'performance';
    else if (response.suggestions?.length > 5) category = 'ux';

    await feedbackAgent.collectFeedback({
      agentId,
      taskDescription: context.userRequest || `Analyze ${context.filePath || 'code'}`,
      userMessage: response.message,
      category,
      context: {
        filePath: context.filePath,
        errorMessage: response.context?.error as string,
        duration: executionTime,
        retryCount: 0, // Would need to track retries
        success: wasSuccess
      },
      keywords,
      suggestedFix: response.suggestions?.[0]?.message
    });

  } catch (error) {
    // Silently fail - don't disrupt agent execution
    console.debug('[FeedbackIntegration] Failed to capture feedback:', error);
  }
}

/**
 * Capture feedback from user interaction
 */
export async function captureUserInteraction(interaction: {
  agentId: string;
  action: string;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  userMessage?: string;
}): Promise<void> {
  try {
    const feedbackAgent = getGitPRFeedbackAgent();

    await feedbackAgent.collectFeedback({
      agentId: interaction.agentId,
      taskDescription: interaction.action,
      userMessage: interaction.userMessage,
      category: interaction.errorMessage ? 'bug' : 'ux',
      context: {
        errorMessage: interaction.errorMessage,
        duration: interaction.duration,
        success: interaction.success,
        retryCount: 0
      },
      keywords: [interaction.action],
      suggestedFix: interaction.errorMessage ? 'Improve error handling' : undefined
    });

  } catch (error) {
    console.debug('[FeedbackIntegration] Failed to capture interaction:', error);
  }
}

/**
 * Stop feedback collection
 */
export async function stopFeedbackCollection(): Promise<void> {
  const feedbackAgent = getGitPRFeedbackAgent();
  await feedbackAgent.stop();
  console.log('[FeedbackIntegration] 🛑 Feedback collection stopped');
}
