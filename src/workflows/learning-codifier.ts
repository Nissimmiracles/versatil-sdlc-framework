/**
 * VERSATIL Learning Codifier
 *
 * Stores extracted learnings in Supabase RAG for future retrieval.
 * Implements the "Codify" phase of the EVERY Workflow.
 *
 * Responsibilities:
 * - Store code patterns in vector database
 * - Store lessons learned for future reference
 * - Tag learnings by agent, category, and effectiveness
 * - Create embeddings for similarity search
 * - Update agent memory with insights
 *
 * Integration: Final step in stop hook learning workflow
 */

import { ExtractedLearnings, CodePattern, LessonLearned } from './learning-extractor.js';
import { SupabaseVectorStore } from '../lib/supabase-vector-store.js';
import { supabaseConfig } from '../config/supabase-config.js';
import { memoryToolHandler } from '../memory/memory-tool-handler.js';
import { VERSATILLogger } from '../utils/logger.js';
import * as path from 'path';
import * as os from 'os';

export interface CodificationResult {
  patternsStored: number;
  lessonsStored: number;
  agentMemoriesUpdated: number;
  ragEntriesCreated: number;
  success: boolean;
  error?: string;
}

export class LearningCodifier {
  private logger: VERSATILLogger;
  private vectorStore: SupabaseVectorStore | null = null;

  constructor() {
    this.logger = new VERSATILLogger();
  }

  /**
   * Initialize vector store connection
   */
  private async initializeVectorStore(): Promise<void> {
    if (this.vectorStore) return;

    try {
      const config = supabaseConfig.getAgentConfig('system');

      if (!config.supabaseUrl || !config.supabaseKey) {
        this.logger.warn('Supabase not configured, skipping RAG storage', {}, 'learning-codifier');
        return;
      }

      this.vectorStore = new SupabaseVectorStore({
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        openaiKey: config.openaiKey,
        useLocalEmbeddings: config.useLocalEmbeddings,
        embeddingModel: config.embeddingModel
      });

      await this.vectorStore.initialize();
      this.logger.info('Vector store initialized', {}, 'learning-codifier');
    } catch (error) {
      this.logger.warn('Failed to initialize vector store', { error }, 'learning-codifier');
    }
  }

  /**
   * Main entry point: Codify learnings to RAG
   */
  async codifyLearnings(learnings: ExtractedLearnings): Promise<CodificationResult> {
    this.logger.info('Starting learning codification', {
      sessionId: learnings.sessionId,
      patterns: learnings.codePatterns.length,
      lessons: learnings.lessons.length
    }, 'learning-codifier');

    try {
      await this.initializeVectorStore();

      const [
        patternsStored,
        lessonsStored,
        agentMemoriesUpdated
      ] = await Promise.all([
        this.storeCodePatterns(learnings.codePatterns, learnings.sessionId),
        this.storeLessonsLearned(learnings.lessons, learnings.sessionId),
        this.updateAgentMemories(learnings)
      ]);

      const ragEntriesCreated = patternsStored + lessonsStored;

      this.logger.info('Learning codification complete', {
        patternsStored,
        lessonsStored,
        agentMemoriesUpdated,
        ragEntriesCreated
      }, 'learning-codifier');

      return {
        patternsStored,
        lessonsStored,
        agentMemoriesUpdated,
        ragEntriesCreated,
        success: true
      };
    } catch (error) {
      this.logger.error('Learning codification failed', { error }, 'learning-codifier');
      return {
        patternsStored: 0,
        lessonsStored: 0,
        agentMemoriesUpdated: 0,
        ragEntriesCreated: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Store code patterns in RAG
   */
  private async storeCodePatterns(patterns: CodePattern[], sessionId: string): Promise<number> {
    if (!this.vectorStore) {
      this.logger.warn('Vector store not available, skipping pattern storage', {}, 'learning-codifier');
      return 0;
    }

    let stored = 0;

    for (const pattern of patterns) {
      try {
        // Only store high-effectiveness patterns (>= 75)
        if (pattern.effectiveness < 75) {
          continue;
        }

        await this.vectorStore.addPattern({
          agent: this.mapCategoryToAgent(pattern.category),
          type: pattern.category,
          code: pattern.codeSnippet,
          filePath: sessionId,
          language: pattern.language,
          framework: pattern.framework,
          score: pattern.effectiveness / 100,
          metadata: {
            description: pattern.description,
            tags: pattern.tags,
            usageContext: pattern.usageContext,
            recommendations: pattern.recommendations,
            sessionId,
            timestamp: new Date().toISOString()
          }
        });

        stored++;
        this.logger.debug('Pattern stored in RAG', {
          category: pattern.category,
          language: pattern.language,
          effectiveness: pattern.effectiveness
        }, 'learning-codifier');
      } catch (error) {
        this.logger.warn('Failed to store pattern', {
          pattern: pattern.pattern,
          error
        }, 'learning-codifier');
      }
    }

    return stored;
  }

  /**
   * Store lessons learned in RAG
   */
  private async storeLessonsLearned(lessons: LessonLearned[], sessionId: string): Promise<number> {
    if (!this.vectorStore) {
      return 0;
    }

    let stored = 0;

    for (const lesson of lessons) {
      try {
        // Store as agent solution (knowledge)
        await this.vectorStore.learnFromInteraction({
          agent: 'system',
          problemType: 'lesson-learned',
          problem: lesson.context,
          solution: lesson.insight,
          explanation: `${lesson.application}\n\nEvidence: ${lesson.evidence}`,
          score: 0.9, // High score for lessons learned
          context: {
            title: lesson.title,
            relatedPatterns: lesson.relatedPatterns,
            sessionId,
            timestamp: new Date().toISOString()
          }
        });

        stored++;
        this.logger.debug('Lesson stored in RAG', {
          title: lesson.title
        }, 'learning-codifier');
      } catch (error) {
        this.logger.warn('Failed to store lesson', {
          lesson: lesson.title,
          error
        }, 'learning-codifier');
      }
    }

    return stored;
  }

  /**
   * Update agent memories with insights
   */
  private async updateAgentMemories(learnings: ExtractedLearnings): Promise<number> {
    let updated = 0;

    for (const agentInsight of learnings.agentInsights) {
      try {
        // Determine agent memory path
        const agentMemoryDir = path.join(
          os.homedir(),
          '.versatil',
          'memories',
          agentInsight.agentId
        );

        // Create session insights file
        const insightsContent = this.formatAgentInsights(agentInsight, learnings);

        const result = await memoryToolHandler.execute({
          type: 'create',
          path: `${agentInsight.agentId}/session-${learnings.sessionId}-insights.md`,
          content: insightsContent
        }, agentInsight.agentId);

        if (result.success) {
          updated++;
          this.logger.debug('Agent memory updated', {
            agentId: agentInsight.agentId
          }, 'learning-codifier');
        }
      } catch (error) {
        this.logger.warn('Failed to update agent memory', {
          agentId: agentInsight.agentId,
          error
        }, 'learning-codifier');
      }
    }

    // Also update project-knowledge with overall session insights
    try {
      const projectKnowledge = this.formatProjectKnowledge(learnings);

      const result = await memoryToolHandler.execute({
        type: 'create',
        path: `project-knowledge/session-${learnings.sessionId}-learnings.md`,
        content: projectKnowledge
      }, 'system');

      if (result.success) {
        updated++;
      }
    } catch (error) {
      this.logger.warn('Failed to update project knowledge', { error }, 'learning-codifier');
    }

    return updated;
  }

  /**
   * Format agent insights for memory storage
   */
  private formatAgentInsights(
    insight: ExtractedLearnings['agentInsights'][0],
    learnings: ExtractedLearnings
  ): string {
    const content = `# Session Insights: ${learnings.sessionId}

**Generated**: ${learnings.timestamp.toISOString()}
**Agent**: ${insight.agentId}
**Effectiveness**: ${insight.effectiveness}

## Best Practices

${insight.bestPractices.map(p => `- ${p}`).join('\n')}

## Areas for Improvement

${insight.improvementAreas.map(a => `- ${a}`).join('\n')}

## Related Patterns

${learnings.codePatterns
  .filter(p => this.mapCategoryToAgent(p.category) === insight.agentId)
  .map(p => `
### ${p.pattern}

**Language**: ${p.language}${p.framework ? ` (${p.framework})` : ''}
**Effectiveness**: ${p.effectiveness}%

${p.description}

\`\`\`${p.language}
${p.codeSnippet}
\`\`\`

**Usage**: ${p.usageContext}
**Recommendations**: ${p.recommendations}
`).join('\n---\n')}

## Lessons Learned

${learnings.lessons
  .filter(l => l.title.toLowerCase().includes(insight.agentId))
  .map(l => `
### ${l.title}

**Context**: ${l.context}
**Insight**: ${l.insight}
**Application**: ${l.application}
`).join('\n---\n')}

---
*Auto-generated by VERSATIL Learning Codification*
`;

    return content;
  }

  /**
   * Format project knowledge for memory storage
   */
  private formatProjectKnowledge(learnings: ExtractedLearnings): string {
    const content = `# Session Learnings: ${learnings.sessionId}

**Generated**: ${learnings.timestamp.toISOString()}
**Overall Effectiveness**: ${learnings.overallEffectiveness}/100
**Compounding Score**: ${learnings.compoundingScore}/100

## Performance Metrics

${learnings.performanceMetrics.map(m => `
### ${m.metric}

- **Value**: ${m.value} ${m.unit}
- **Benchmark**: ${m.benchmark} ${m.unit}
- **Status**: ${m.status.toUpperCase()}
- **Improvement**: ${m.improvement}
`).join('\n')}

## Code Patterns (${learnings.codePatterns.length})

${learnings.codePatterns.slice(0, 5).map(p => `
### ${p.pattern}

**Category**: ${p.category} | **Language**: ${p.language} | **Effectiveness**: ${p.effectiveness}%

${p.description}

**Tags**: ${p.tags.join(', ')}
`).join('\n---\n')}

## Lessons Learned (${learnings.lessons.length})

${learnings.lessons.map(l => `
### ${l.title}

**Context**: ${l.context}

**Insight**: ${l.insight}

**Application**: ${l.application}

**Evidence**: ${l.evidence}
`).join('\n---\n')}

## Warnings (${learnings.warnings.length})

${learnings.warnings.map(w => `
### [${w.severity.toUpperCase()}] ${w.issue}

**Category**: ${w.category}
**Impact**: ${w.impact}
**Resolution**: ${w.resolution}
${w.agentRelated ? `**Agent**: ${w.agentRelated}` : ''}
`).join('\n---\n')}

## Agent Performance

${learnings.agentInsights.map(a => `
### ${a.agentId}

**Effectiveness**: ${a.effectiveness}

**Best Practices**:
${a.bestPractices.map(p => `- ${p}`).join('\n')}

**Improvement Areas**:
${a.improvementAreas.map(i => `- ${i}`).join('\n')}
`).join('\n---\n')}

## Future Impact

**Compounding Score**: ${learnings.compoundingScore}/100

This session's learnings will make future sessions approximately **${Math.round(learnings.compoundingScore * 0.4)}% faster** through pattern reuse and knowledge application.

---
*Auto-generated by VERSATIL Learning Codification*
*Next similar feature will benefit from these patterns via RAG retrieval*
`;

    return content;
  }

  /**
   * Map pattern category to responsible agent
   */
  private mapCategoryToAgent(category: CodePattern['category']): string {
    const mapping: Record<string, string> = {
      'test': 'maria-qa',
      'component': 'james-frontend',
      'api': 'marcus-backend',
      'database': 'dana-database',
      'configuration': 'sarah-pm',
      'optimization': 'dr-ai-ml'
    };

    return mapping[category] || 'system';
  }
}

/**
 * Factory function for LearningCodifier
 */
export function createLearningCodifier(): LearningCodifier {
  return new LearningCodifier();
}
