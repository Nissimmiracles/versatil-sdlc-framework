/**
 * VERSATIL SDLC Framework - Vector Store Migration System
 *
 * Migrates existing Enhanced Vector Memory Store data to Supabase Vector Store
 * while preserving all agent knowledge, maintaining backward compatibility,
 * and providing zero-downtime migration.
 */
import { SupabaseVectorStore } from '../lib/supabase-vector-store.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { VERSATILLogger } from '../utils/logger.js';
import { supabaseConfig } from '../config/supabase-config.js';
import * as fs from 'fs';
import * as path from 'path';
export class VectorStoreMigration {
    constructor() {
        this.startTime = 0;
        this.logger = new VERSATILLogger();
        this.sourceStore = new EnhancedVectorMemoryStore();
        // Initialize Supabase store with current configuration
        const config = supabaseConfig.getAgentConfig('migration-agent');
        this.targetStore = new SupabaseVectorStore({
            supabaseUrl: config.supabaseUrl,
            supabaseKey: config.supabaseKey,
            openaiKey: config.openaiKey,
            useLocalEmbeddings: config.useLocalEmbeddings
        });
        this.progress = {
            phase: 'initialization',
            step: 0,
            totalSteps: 6,
            processed: 0,
            totalItems: 0,
            success: 0,
            errors: 0,
            warnings: 0,
            estimated: 0
        };
        this.report = {
            success: false,
            duration: 0,
            phases: {},
            finalStats: {
                totalMemories: 0,
                migratedPatterns: 0,
                migratedSolutions: 0,
                migratedInteractions: 0,
                preservedEmbeddings: 0,
                duplicatesSkipped: 0
            },
            recommendations: []
        };
    }
    /**
     * Execute complete migration with progress tracking
     */
    async migrate(options = {}) {
        this.startTime = Date.now();
        const opts = {
            dryRun: false,
            preserveLocal: true,
            batchSize: 50,
            skipDuplicates: true,
            preserveEmbeddings: true,
            validateIntegrity: true,
            createBackup: true,
            ...options
        };
        try {
            this.logger.info('Starting vector store migration', { options: opts }, 'migration');
            // Phase 1: Pre-migration validation
            await this.phase1PreValidation(opts);
            // Phase 2: Create backup (if requested)
            if (opts.createBackup) {
                await this.phase2CreateBackup(opts);
            }
            // Phase 3: Initialize target store
            await this.phase3InitializeTarget(opts);
            // Phase 4: Migrate memories and patterns
            await this.phase4MigrateMemories(opts);
            // Phase 5: Migrate agent solutions and interactions
            await this.phase5MigrateSolutions(opts);
            // Phase 6: Post-migration validation
            await this.phase6PostValidation(opts);
            this.report.success = true;
            this.report.duration = Date.now() - this.startTime;
            this.logger.info('Vector store migration completed successfully', {
                duration: this.report.duration,
                stats: this.report.finalStats
            }, 'migration');
            return this.report;
        }
        catch (error) {
            this.logger.error('Vector store migration failed', { error }, 'migration');
            this.report.success = false;
            this.report.duration = Date.now() - this.startTime;
            throw error;
        }
    }
    /**
     * Phase 1: Pre-migration validation
     */
    async phase1PreValidation(options) {
        this.updateProgress('pre-validation', 1, 0);
        const phase = this.initPhase('pre-validation');
        try {
            // Validate source store availability
            await this.sourceStore.initialize();
            const memories = await this.sourceStore.getAllMemories();
            this.progress.totalItems = memories.length;
            this.logger.info('Source store validated', {
                memories: memories.length
            }, 'migration');
            // Validate Supabase configuration
            if (!supabaseConfig.isSupabaseConfigured()) {
                throw new Error('Supabase is not properly configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
            }
            // Validate embedding configuration
            if (!supabaseConfig.isEmbeddingConfigured()) {
                phase.warnings.push('No embedding provider configured. Migration will use local embeddings.');
            }
            // Check for existing data in target
            if (await this.targetStore.hasExistingData()) {
                if (!options.skipDuplicates) {
                    throw new Error('Target store already has data. Use skipDuplicates option or clear target first.');
                }
                phase.warnings.push('Target store has existing data. Duplicates will be skipped.');
            }
            phase.completed = true;
            phase.items = memories.length;
            phase.success = memories.length;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Phase 2: Create backup
     */
    async phase2CreateBackup(options) {
        this.updateProgress('backup', 2, 0);
        const phase = this.initPhase('backup');
        try {
            const backupPath = path.join(process.cwd(), '.versatil', 'backups', `vector-store-${Date.now()}.json`);
            await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
            const memories = await this.sourceStore.getAllMemories();
            const backup = {
                timestamp: Date.now(),
                version: '1.2.1',
                memories: memories,
                metadata: {
                    totalMemories: memories.length,
                    agentBreakdown: this.getAgentBreakdown(memories),
                    contentTypes: this.getContentTypeBreakdown(memories)
                }
            };
            await fs.promises.writeFile(backupPath, JSON.stringify(backup, null, 2));
            this.logger.info('Backup created', {
                path: backupPath,
                memories: memories.length
            }, 'migration');
            phase.completed = true;
            phase.items = 1;
            phase.success = 1;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Phase 3: Initialize target store
     */
    async phase3InitializeTarget(options) {
        this.updateProgress('target-init', 3, 0);
        const phase = this.initPhase('target-init');
        try {
            await this.targetStore.initialize();
            this.logger.info('Target store initialized', {
                provider: this.targetStore.getEmbeddingProvider(),
                features: this.targetStore.getFeatures()
            }, 'migration');
            phase.completed = true;
            phase.items = 1;
            phase.success = 1;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Phase 4: Migrate memories and patterns
     */
    async phase4MigrateMemories(options) {
        this.updateProgress('migrate-memories', 4, 0);
        const phase = this.initPhase('migrate-memories');
        try {
            const memories = await this.sourceStore.getAllMemories();
            let filteredMemories = memories;
            // Apply filters
            if (options.agentFilter?.length) {
                filteredMemories = memories.filter(m => options.agentFilter.includes(m.metadata.agentId));
            }
            if (options.timeRange) {
                filteredMemories = filteredMemories.filter(m => m.metadata.timestamp >= options.timeRange.start &&
                    m.metadata.timestamp <= options.timeRange.end);
            }
            phase.items = filteredMemories.length;
            // Process in batches
            const batchSize = options.batchSize || 50;
            for (let i = 0; i < filteredMemories.length; i += batchSize) {
                const batch = filteredMemories.slice(i, i + batchSize);
                for (const memory of batch) {
                    try {
                        if (options.dryRun) {
                            this.logger.info('DRY RUN: Would migrate memory', {
                                id: memory.id,
                                agent: memory.metadata.agentId,
                                contentType: memory.contentType
                            }, 'migration');
                        }
                        else {
                            const pattern = await this.convertMemoryToPattern(memory, options);
                            if (options.skipDuplicates && await this.isDuplicatePattern(pattern)) {
                                this.report.finalStats.duplicatesSkipped++;
                                continue;
                            }
                            await this.targetStore.addPattern(pattern);
                            this.report.finalStats.migratedPatterns++;
                            if (options.preserveEmbeddings && memory.embedding) {
                                this.report.finalStats.preservedEmbeddings++;
                            }
                        }
                        phase.success++;
                        this.progress.processed++;
                        this.updateProgress('migrate-memories', 4, this.progress.processed);
                    }
                    catch (error) {
                        phase.errors++;
                        this.progress.errors++;
                        this.logger.warn('Failed to migrate memory', {
                            memoryId: memory.id,
                            error: error instanceof Error ? error.message : String(error)
                        }, 'migration');
                    }
                }
                // Update progress after each batch
                this.logger.info('Migration batch completed', {
                    processed: Math.min(i + batchSize, filteredMemories.length),
                    total: filteredMemories.length,
                    success: phase.success,
                    errors: phase.errors
                }, 'migration');
            }
            phase.completed = true;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Phase 5: Migrate agent solutions and interactions
     */
    async phase5MigrateSolutions(options) {
        this.updateProgress('migrate-solutions', 5, 0);
        const phase = this.initPhase('migrate-solutions');
        try {
            // Extract solution-like memories (those with problem-solving context)
            const memories = await this.sourceStore.getAllMemories();
            const solutionMemories = memories.filter(m => m.metadata.tags?.includes('solution') ||
                m.metadata.tags?.includes('fix') ||
                m.content.toLowerCase().includes('solution'));
            phase.items = solutionMemories.length;
            for (const memory of solutionMemories) {
                try {
                    if (options.dryRun) {
                        this.logger.info('DRY RUN: Would migrate solution', {
                            id: memory.id,
                            agent: memory.metadata.agentId
                        }, 'migration');
                    }
                    else {
                        const solution = this.convertMemoryToSolution(memory);
                        await this.targetStore.addSolution(solution);
                        this.report.finalStats.migratedSolutions++;
                        // Create interaction record
                        const interaction = this.convertMemoryToInteraction(memory);
                        await this.targetStore.learnFromInteraction(interaction);
                        this.report.finalStats.migratedInteractions++;
                    }
                    phase.success++;
                }
                catch (error) {
                    phase.errors++;
                    this.logger.warn('Failed to migrate solution', {
                        memoryId: memory.id,
                        error: error instanceof Error ? error.message : String(error)
                    }, 'migration');
                }
            }
            phase.completed = true;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Phase 6: Post-migration validation
     */
    async phase6PostValidation(options) {
        this.updateProgress('post-validation', 6, 0);
        const phase = this.initPhase('post-validation');
        try {
            if (options.validateIntegrity) {
                // Validate data integrity
                const sourceCount = (await this.sourceStore.getAllMemories()).length;
                const targetCount = await this.targetStore.getPatternCount();
                const migrationRatio = targetCount / sourceCount;
                if (migrationRatio < 0.95) {
                    phase.warnings.push(`Migration ratio ${(migrationRatio * 100).toFixed(1)}% is below 95%`);
                }
                // Test search functionality
                try {
                    const testQuery = 'test query';
                    const results = await this.targetStore.retrieveSimilarPatterns(testQuery, {
                        agentName: 'test',
                        limit: 5
                    });
                    if (results.length === 0) {
                        phase.warnings.push('Search functionality test returned no results');
                    }
                }
                catch (error) {
                    phase.warnings.push('Search functionality test failed');
                }
            }
            // Generate recommendations
            this.generateRecommendations();
            phase.completed = true;
            phase.items = 1;
            phase.success = 1;
        }
        catch (error) {
            phase.errors++;
            throw error;
        }
    }
    /**
     * Convert memory document to code pattern
     */
    async convertMemoryToPattern(memory, options) {
        return {
            agent: memory.metadata.agentId,
            type: this.inferPatternType(memory),
            code: memory.content,
            filePath: memory.metadata.projectContext || 'unknown',
            language: memory.metadata.language || this.inferLanguage(memory.content),
            framework: memory.metadata.framework || 'unknown',
            score: this.calculateQualityScore(memory),
            embedding: options.preserveEmbeddings ? memory.embedding : undefined,
            similarity: memory.metadata.relevanceScore || 0,
            metadata: {
                migratedFrom: 'enhanced-vector-memory-store',
                originalId: memory.id,
                originalTimestamp: memory.metadata.timestamp,
                tags: memory.metadata.tags || [],
                contentType: memory.contentType
            }
        };
    }
    /**
     * Convert memory to agent solution
     */
    convertMemoryToSolution(memory) {
        return {
            agent: memory.metadata.agentId,
            problemType: memory.metadata.tags?.find(t => t.includes('problem')) || 'general',
            problem: this.extractProblemFromContent(memory.content),
            solution: memory.content,
            explanation: `Migrated solution from memory ${memory.id}`,
            score: memory.metadata.relevanceScore || 0.8,
            context: memory.metadata || {},
            effectiveness_score: this.calculateEffectivenessScore(memory),
            metadata: {
                migratedFrom: 'enhanced-vector-memory-store',
                originalId: memory.id,
                originalTimestamp: memory.metadata.timestamp
            }
        };
    }
    /**
     * Convert memory to agent interaction
     */
    convertMemoryToInteraction(memory) {
        return {
            agent: memory.metadata.agentId,
            problemType: memory.metadata.tags?.find(t => t.includes('problem')) || 'general',
            problem: this.extractProblemFromContent(memory.content),
            solution: memory.content,
            explanation: `Migrated interaction from memory ${memory.id}`,
            score: memory.metadata.relevanceScore || 0.8,
            context: {
                migratedFrom: 'enhanced-vector-memory-store',
                originalId: memory.id,
                originalTimestamp: memory.metadata.timestamp,
                contentType: memory.contentType,
                tags: memory.metadata.tags || []
            }
        };
    }
    /**
     * Get current migration progress
     */
    getProgress() {
        return { ...this.progress };
    }
    /**
     * Subscribe to migration progress updates
     */
    onProgress(callback) {
        const handler = () => callback(this.getProgress());
        this.targetStore.on('progress', handler);
        return () => this.targetStore.off('progress', handler);
    }
    // Utility methods
    updateProgress(phase, step, processed) {
        this.progress.phase = phase;
        this.progress.step = step;
        this.progress.processed = processed;
        // Estimate remaining time
        if (processed > 0) {
            const elapsed = Date.now() - this.startTime;
            const rate = processed / elapsed;
            this.progress.estimated = (this.progress.totalItems - processed) / rate;
        }
    }
    initPhase(name) {
        const phase = {
            completed: false,
            items: 0,
            success: 0,
            errors: 0,
            warnings: []
        };
        this.report.phases[name] = phase;
        return phase;
    }
    getAgentBreakdown(memories) {
        const breakdown = {};
        for (const memory of memories) {
            const agent = memory.metadata.agentId;
            breakdown[agent] = (breakdown[agent] || 0) + 1;
        }
        return breakdown;
    }
    getContentTypeBreakdown(memories) {
        const breakdown = {};
        for (const memory of memories) {
            breakdown[memory.contentType] = (breakdown[memory.contentType] || 0) + 1;
        }
        return breakdown;
    }
    inferPatternType(memory) {
        const content = memory.content.toLowerCase();
        if (content.includes('test'))
            return 'test';
        if (content.includes('component'))
            return 'component';
        if (content.includes('api'))
            return 'api';
        if (content.includes('security'))
            return 'security';
        return 'general';
    }
    inferLanguage(content) {
        if (content.includes('import React'))
            return 'typescript';
        if (content.includes('function ') || content.includes('const '))
            return 'javascript';
        if (content.includes('def '))
            return 'python';
        if (content.includes('class ') && content.includes('public'))
            return 'java';
        return 'unknown';
    }
    calculateQualityScore(memory) {
        let score = 70; // Base score
        if (memory.metadata.tags?.length)
            score += 10;
        if (memory.metadata.language)
            score += 5;
        if (memory.metadata.framework)
            score += 5;
        if (memory.content.length > 100)
            score += 10;
        return Math.min(100, score);
    }
    calculateEffectivenessScore(memory) {
        const relevance = memory.metadata.relevanceScore || 0.5;
        const contentQuality = memory.content.length > 50 ? 0.2 : 0.1;
        const hasContext = memory.metadata.tags?.length ? 0.2 : 0.1;
        return Math.min(1, relevance + contentQuality + hasContext);
    }
    extractProblemFromContent(content) {
        // Simple heuristic to extract problem description
        const lines = content.split('\n');
        const problemLine = lines.find(line => line.toLowerCase().includes('problem') ||
            line.toLowerCase().includes('issue') ||
            line.toLowerCase().includes('bug'));
        return problemLine || 'General problem solving';
    }
    async isDuplicatePattern(pattern) {
        try {
            const existing = await this.targetStore.retrieveSimilarPatterns(pattern.code.substring(0, 100), {
                agentName: pattern.agent,
                minSimilarity: 0.95,
                limit: 1
            });
            return existing.length > 0;
        }
        catch {
            return false;
        }
    }
    generateRecommendations() {
        const stats = this.report.finalStats;
        if (stats.duplicatesSkipped > 0) {
            this.report.recommendations.push(`${stats.duplicatesSkipped} duplicates were skipped. Consider cleaning up redundant patterns.`);
        }
        if (stats.preservedEmbeddings < stats.migratedPatterns * 0.8) {
            this.report.recommendations.push('Many embeddings were not preserved. Consider regenerating embeddings for better search performance.');
        }
        this.report.recommendations.push('Test agent RAG functionality to ensure migration was successful.');
        this.report.recommendations.push('Consider updating agent configurations to use the new Supabase store.');
    }
    /**
     * Rollback migration (if preserveLocal was true)
     */
    async rollback() {
        this.logger.warn('Migration rollback requested', {}, 'migration');
        // This would involve clearing Supabase data and ensuring local store is intact
        // Implementation depends on specific requirements
        throw new Error('Rollback functionality not yet implemented');
    }
}
// Export factory function
export function createMigration() {
    return new VectorStoreMigration();
}
// Export CLI helper for migration scripts
export async function runMigration(options = {}) {
    const migration = createMigration();
    return migration.migrate(options);
}
//# sourceMappingURL=vector-store-migration.js.map