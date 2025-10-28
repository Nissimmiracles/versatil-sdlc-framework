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
import { SupabaseVectorStore } from '../lib/supabase-vector-store.js';
import { supabaseConfig } from '../config/supabase-config.js';
import { memoryToolHandler } from '../memory/memory-tool-handler.js';
import { VERSATILLogger } from '../utils/logger.js';
import { RAGRouter } from '../rag/rag-router.js';
import { getSanitizationPolicy, PatternClassification, StorageDestination } from '../rag/sanitization-policy.js';
import * as path from 'path';
import * as os from 'os';
export class LearningCodifier {
    constructor() {
        this.vectorStore = null;
        this.logger = new VERSATILLogger();
        this.ragRouter = RAGRouter.getInstance();
        this.sanitizationPolicy = getSanitizationPolicy();
    }
    /**
     * Initialize vector store connection
     */
    async initializeVectorStore() {
        if (this.vectorStore)
            return;
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
        }
        catch (error) {
            this.logger.warn('Failed to initialize vector store', { error }, 'learning-codifier');
        }
    }
    /**
     * Main entry point: Codify learnings to RAG
     * v7.8.0: Now supports Public/Private RAG routing with auto-sanitization
     */
    async codifyLearnings(learnings, storageDestination = StorageDestination.PRIVATE_ONLY) {
        this.logger.info('Starting learning codification', {
            sessionId: learnings.sessionId,
            patterns: learnings.codePatterns.length,
            lessons: learnings.lessons.length,
            destination: storageDestination
        }, 'learning-codifier');
        try {
            await this.initializeVectorStore();
            const [{ patternsStored, publicStored, privateStored, sanitized }, lessonsStored, agentMemoriesUpdated] = await Promise.all([
                this.storeCodePatterns(learnings.codePatterns, learnings.sessionId, storageDestination),
                this.storeLessonsLearned(learnings.lessons, learnings.sessionId, storageDestination),
                this.updateAgentMemories(learnings)
            ]);
            const ragEntriesCreated = patternsStored + lessonsStored;
            this.logger.info('Learning codification complete', {
                patternsStored,
                publicPatternsStored: publicStored,
                privatePatternsStored: privateStored,
                sanitizedPatterns: sanitized,
                lessonsStored,
                agentMemoriesUpdated,
                ragEntriesCreated
            }, 'learning-codifier');
            return {
                patternsStored,
                lessonsStored,
                agentMemoriesUpdated,
                ragEntriesCreated,
                publicPatternsStored: publicStored,
                privatePatternsStored: privateStored,
                sanitizedPatterns: sanitized,
                success: true
            };
        }
        catch (error) {
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
     * v7.8.0: Now routes to Public/Private RAG with auto-sanitization
     */
    async storeCodePatterns(patterns, sessionId, storageDestination) {
        let patternsStored = 0;
        let publicStored = 0;
        let privateStored = 0;
        let sanitized = 0;
        for (const pattern of patterns) {
            try {
                // Only store high-effectiveness patterns (>= 75)
                if (pattern.effectiveness < 75) {
                    continue;
                }
                // Classify pattern for storage destination
                const policyDecision = await this.sanitizationPolicy.evaluatePattern({
                    pattern: pattern.pattern,
                    description: pattern.description,
                    code: pattern.codeSnippet,
                    agent: this.mapCategoryToAgent(pattern.category),
                    category: pattern.category,
                    tags: pattern.tags
                });
                // Prepare pattern data
                const patternData = {
                    pattern: pattern.pattern,
                    description: pattern.description,
                    code: pattern.codeSnippet,
                    agent: this.mapCategoryToAgent(pattern.category),
                    category: pattern.category,
                    effectiveness: pattern.effectiveness,
                    tags: pattern.tags,
                    metadata: {
                        language: pattern.language,
                        framework: pattern.framework,
                        usageContext: pattern.usageContext,
                        recommendations: pattern.recommendations,
                        sessionId,
                        timestamp: new Date().toISOString()
                    }
                };
                // Route to appropriate RAG store(s)
                if (storageDestination === StorageDestination.BOTH) {
                    // Store in both Private and Public
                    if (policyDecision.classification === PatternClassification.PUBLIC_SAFE ||
                        policyDecision.classification === PatternClassification.REQUIRES_SANITIZATION) {
                        // Store sanitized version in Public RAG
                        await this.ragRouter.storePattern({
                            ...patternData,
                            code: policyDecision.sanitizationResult?.sanitized || patternData.code,
                            description: policyDecision.sanitizationResult?.sanitized || patternData.description
                        }, StorageDestination.PUBLIC_ONLY);
                        publicStored++;
                        if (policyDecision.classification === PatternClassification.REQUIRES_SANITIZATION) {
                            sanitized++;
                        }
                    }
                    // Store original in Private RAG (if configured)
                    try {
                        await this.ragRouter.storePattern(patternData, StorageDestination.PRIVATE_ONLY);
                        privateStored++;
                    }
                    catch (error) {
                        this.logger.warn('Private RAG not configured, skipping private storage', {}, 'learning-codifier');
                    }
                }
                else if (storageDestination === StorageDestination.PUBLIC_ONLY) {
                    // Public only - reject if not safe
                    if (policyDecision.classification === PatternClassification.CREDENTIALS ||
                        policyDecision.classification === PatternClassification.PRIVATE_ONLY ||
                        policyDecision.classification === PatternClassification.UNSANITIZABLE) {
                        this.logger.warn('Pattern not suitable for Public RAG', {
                            pattern: pattern.pattern,
                            classification: policyDecision.classification
                        }, 'learning-codifier');
                        continue;
                    }
                    // Store sanitized version
                    await this.ragRouter.storePattern({
                        ...patternData,
                        code: policyDecision.sanitizationResult?.sanitized || patternData.code,
                        description: policyDecision.sanitizationResult?.sanitized || patternData.description
                    }, StorageDestination.PUBLIC_ONLY);
                    publicStored++;
                    if (policyDecision.classification === PatternClassification.REQUIRES_SANITIZATION) {
                        sanitized++;
                    }
                }
                else {
                    // Private only (default)
                    try {
                        await this.ragRouter.storePattern(patternData, StorageDestination.PRIVATE_ONLY);
                        privateStored++;
                    }
                    catch (error) {
                        this.logger.warn('Private RAG not configured', {}, 'learning-codifier');
                        // Fallback to old vector store if available
                        if (this.vectorStore) {
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
                        }
                    }
                }
                patternsStored++;
                this.logger.debug('Pattern stored in RAG', {
                    category: pattern.category,
                    language: pattern.language,
                    effectiveness: pattern.effectiveness,
                    destination: storageDestination,
                    classification: policyDecision.classification
                }, 'learning-codifier');
            }
            catch (error) {
                this.logger.warn('Failed to store pattern', {
                    pattern: pattern.pattern,
                    error
                }, 'learning-codifier');
            }
        }
        return { patternsStored, publicStored, privateStored, sanitized };
    }
    /**
     * Store lessons learned in RAG
     * v7.8.0: Now routes to Public/Private RAG with auto-sanitization
     */
    async storeLessonsLearned(lessons, sessionId, storageDestination) {
        let stored = 0;
        for (const lesson of lessons) {
            try {
                // Classify lesson for storage destination
                const policyDecision = await this.sanitizationPolicy.evaluatePattern({
                    pattern: lesson.title,
                    description: `${lesson.context}\n\n${lesson.insight}\n\n${lesson.application}`,
                    agent: 'system',
                    category: 'lesson-learned'
                });
                // Prepare lesson data
                const lessonData = {
                    pattern: lesson.title,
                    description: `${lesson.context}\n\n${lesson.insight}\n\n${lesson.application}`,
                    agent: 'system',
                    category: 'lesson-learned',
                    effectiveness: 90, // High effectiveness for lessons
                    metadata: {
                        evidence: lesson.evidence,
                        relatedPatterns: lesson.relatedPatterns,
                        sessionId,
                        timestamp: new Date().toISOString()
                    }
                };
                // Route based on destination (same logic as patterns)
                if (storageDestination === StorageDestination.BOTH) {
                    if (policyDecision.classification === PatternClassification.PUBLIC_SAFE ||
                        policyDecision.classification === PatternClassification.REQUIRES_SANITIZATION) {
                        await this.ragRouter.storePattern({
                            ...lessonData,
                            description: policyDecision.sanitizationResult?.sanitized || lessonData.description
                        }, StorageDestination.PUBLIC_ONLY);
                    }
                    try {
                        await this.ragRouter.storePattern(lessonData, StorageDestination.PRIVATE_ONLY);
                    }
                    catch (error) {
                        this.logger.warn('Private RAG not configured', {}, 'learning-codifier');
                    }
                }
                else if (storageDestination === StorageDestination.PUBLIC_ONLY) {
                    if (policyDecision.classification !== PatternClassification.CREDENTIALS &&
                        policyDecision.classification !== PatternClassification.PRIVATE_ONLY &&
                        policyDecision.classification !== PatternClassification.UNSANITIZABLE) {
                        await this.ragRouter.storePattern({
                            ...lessonData,
                            description: policyDecision.sanitizationResult?.sanitized || lessonData.description
                        }, StorageDestination.PUBLIC_ONLY);
                    }
                }
                else {
                    // Private only (default) - fallback to vector store if RAG not configured
                    try {
                        await this.ragRouter.storePattern(lessonData, StorageDestination.PRIVATE_ONLY);
                    }
                    catch (error) {
                        if (this.vectorStore) {
                            await this.vectorStore.learnFromInteraction({
                                agent: 'system',
                                problemType: 'lesson-learned',
                                problem: lesson.context,
                                solution: lesson.insight,
                                explanation: `${lesson.application}\n\nEvidence: ${lesson.evidence}`,
                                score: 0.9,
                                context: {
                                    title: lesson.title,
                                    relatedPatterns: lesson.relatedPatterns,
                                    sessionId,
                                    timestamp: new Date().toISOString()
                                }
                            });
                        }
                    }
                }
                stored++;
                this.logger.debug('Lesson stored in RAG', {
                    title: lesson.title,
                    destination: storageDestination,
                    classification: policyDecision.classification
                }, 'learning-codifier');
            }
            catch (error) {
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
    async updateAgentMemories(learnings) {
        let updated = 0;
        for (const agentInsight of learnings.agentInsights) {
            try {
                // Determine agent memory path
                const agentMemoryDir = path.join(os.homedir(), '.versatil', 'memories', agentInsight.agentId);
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
            }
            catch (error) {
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
        }
        catch (error) {
            this.logger.warn('Failed to update project knowledge', { error }, 'learning-codifier');
        }
        return updated;
    }
    /**
     * Format agent insights for memory storage
     */
    formatAgentInsights(insight, learnings) {
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
    formatProjectKnowledge(learnings) {
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
    mapCategoryToAgent(category) {
        const mapping = {
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
export function createLearningCodifier() {
    return new LearningCodifier();
}
//# sourceMappingURL=learning-codifier.js.map