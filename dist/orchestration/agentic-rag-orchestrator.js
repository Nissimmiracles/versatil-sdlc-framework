/**
 * VERSATIL SDLC Framework - Agentic RAG Orchestrator
 * Enhanced RAG system specifically for agent collaboration with full context
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import * as path from 'path';
export class AgenticRAGOrchestrator extends EventEmitter {
    constructor(paths) {
        super();
        // Multi-dimensional memory stores
        this.memoryStores = {
            code: new EnhancedVectorMemoryStore(),
            decisions: new EnhancedVectorMemoryStore(),
            patterns: new EnhancedVectorMemoryStore(),
            ui: new EnhancedVectorMemoryStore(),
            errors: new EnhancedVectorMemoryStore(),
            learnings: new EnhancedVectorMemoryStore(),
            rule_execution: new EnhancedVectorMemoryStore(),
            cross_rule_optimization: new EnhancedVectorMemoryStore()
        };
        // Agent-specific memory indexes
        this.agentMemories = new Map();
        // Planning and execution tracking
        this.currentPlan = {
            id: '',
            steps: [],
            completed: 0,
            total: 0,
            blockers: []
        };
        // Pattern detection and learning
        this.patternDetector = {
            codePatterns: new Map(),
            errorPatterns: new Map(),
            successPatterns: new Map(),
            rulePatterns: new Map(),
            crossRulePatterns: new Map()
        };
        // Rule execution tracking
        this.ruleExecutionMetrics = {
            parallel_execution: { successes: 0, failures: 0, avgTime: 0, collisions: 0 },
            stress_testing: { testsGenerated: 0, testsRun: 0, failuresDetected: 0, avgDuration: 0 },
            daily_audit: { auditsRun: 0, issuesFound: 0, avgScore: 0, trends: [] }
        };
        // Cross-rule optimization knowledge
        this.crossRuleKnowledge = {
            synergies: new Map(), // Rule combinations that work well together
            conflicts: new Map(), // Rule combinations that interfere
            optimizations: new Map() // Learned optimization patterns
        };
        this.logger = new VERSATILLogger('AgenticRAG');
        this.paths = paths;
    }
    async initialize() {
        // Initialize all memory stores
        for (const [name, store] of Object.entries(this.memoryStores)) {
            await store.initialize();
            this.logger.debug(`Initialized ${name} memory store`);
        }
        // Load existing memories
        await this.loadExistingMemories();
        // Initialize pattern detection
        await this.initializePatternDetection();
        this.logger.info('Agentic RAG system initialized');
    }
    /**
     * Get full context for a specific agent and task
     */
    async getContextForAgent(agentId, task) {
        this.logger.debug(`Building context for agent ${agentId}`, { task });
        const context = {
            repository: await this.getRepositoryContext(),
            stack: await this.getStackContext(),
            ui: await this.getUIContext(),
            plan: await this.getDevelopmentPlan(),
            memories: await this.getRelevantMemories(agentId, task),
            patterns: await this.getRelevantPatterns(task),
            errors: await this.getRelevantErrors(task)
        };
        // Enhance context based on agent type
        return await this.enhanceContextForAgent(agentId, context);
    }
    /**
     * Get repository context with full awareness
     */
    async getRepositoryContext() {
        const { exec } = require('child_process').promises;
        try {
            // Get git information
            const [branch, status, log] = await Promise.all([
                exec('git branch --show-current', { cwd: this.paths.project.root }),
                exec('git status --porcelain', { cwd: this.paths.project.root }),
                exec('git log --oneline -10', { cwd: this.paths.project.root })
            ]);
            // Parse uncommitted changes
            const changes = status.stdout.trim().split('\n').filter(Boolean).map((line) => {
                const [type, path] = line.trim().split(/\s+/);
                return {
                    path,
                    type: type.includes('A') ? 'added' : type.includes('M') ? 'modified' : 'deleted'
                };
            });
            // Get branches
            const branches = await exec('git branch -a', { cwd: this.paths.project.root });
            const branchList = branches.stdout.trim().split('\n').map((b) => ({
                name: b.trim().replace('* ', ''),
                lastCommit: '' // Would need additional git commands
            }));
            return {
                structure: await this.scanProjectStructure(),
                dependencies: await this.buildDependencyGraph(),
                history: this.parseGitHistory(log.stdout),
                branches: branchList,
                currentBranch: branch.stdout.trim(),
                uncommittedChanges: changes
            };
        }
        catch (error) {
            this.logger.warn('Failed to get full repository context', { error });
            return this.getDefaultRepositoryContext();
        }
    }
    /**
     * Get stack-specific context
     */
    async getStackContext() {
        const context = {};
        // Supabase context
        if (await this.hasSupabase()) {
            context.supabase = {
                schema: await this.getSupabaseSchema(),
                edgeFunctions: await this.getSupabaseEdgeFunctions(),
                rlsPolicies: await this.getRLSPolicies(),
                realtimeChannels: await this.getRealtimeChannels()
            };
        }
        // Vercel context
        if (await this.hasVercel()) {
            context.vercel = {
                config: await this.getVercelConfig(),
                env: this.getVercelEnv(),
                analytics: await this.getVercelAnalytics(),
                deployments: await this.getVercelDeployments()
            };
        }
        // n8n context
        if (await this.hasN8N()) {
            context.n8n = {
                workflows: await this.getN8NWorkflows(),
                credentials: await this.getN8NCredentials(),
                executions: await this.getRecentExecutions()
            };
        }
        return context;
    }
    /**
     * Get UI/UX context
     */
    async getUIContext() {
        return {
            components: await this.getShadcnComponents(),
            theme: await this.getThemeConfig(),
            routes: await this.getAppRoutes(),
            tests: await this.getPlaywrightTests(),
            coverage: await this.getCoverageReport()
        };
    }
    /**
     * Get current development plan
     */
    async getDevelopmentPlan() {
        // Load from plan orchestrator
        return {
            current: await this.getCurrentPlan(),
            progress: await this.calculateProgress(),
            blockers: await this.identifyBlockers(),
            nextSteps: await this.getNextSteps(),
            timeline: await this.getTimeline()
        };
    }
    /**
     * Get relevant memories for agent and task
     */
    async getRelevantMemories(agentId, task) {
        const memories = [];
        // Search across all memory stores
        for (const [type, store] of Object.entries(this.memoryStores)) {
            const results = await store.searchMemories(task.description || task.goal, {
                agentId,
                limit: 10,
                rerank: true
            });
            memories.push(...results.map(r => ({
                id: r.id,
                agentId: r.metadata.agentId,
                type: type,
                content: JSON.parse(r.content),
                context: r.metadata.context,
                timestamp: r.metadata.timestamp,
                relevance: r.similarity,
                tags: r.metadata.tags || []
            })));
        }
        // Sort by relevance and recency
        return memories.sort((a, b) => {
            const scoreA = (a.relevance || 0) * this.getRecencyScore(a.timestamp);
            const scoreB = (b.relevance || 0) * this.getRecencyScore(b.timestamp);
            return scoreB - scoreA;
        }).slice(0, 20);
    }
    /**
     * Get relevant patterns
     */
    async getRelevantPatterns(task) {
        const patterns = [];
        // Search for patterns related to the task
        const taskKeywords = this.extractKeywords(task);
        for (const [id, pattern] of this.patternDetector.codePatterns) {
            if (this.isPatternRelevant(pattern, taskKeywords)) {
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    /**
     * Get relevant errors and solutions
     */
    async getRelevantErrors(task) {
        const errors = [];
        // Search error memory for similar issues
        const errorResults = await this.memoryStores.errors.searchMemories(task.description || 'error', { limit: 5 });
        return errorResults.map(r => {
            const content = JSON.parse(r.content);
            return {
                id: r.id,
                error: content.error,
                solution: content.solution
            };
        });
    }
    /**
     * Enhance context based on agent specialization
     */
    async enhanceContextForAgent(agentId, context) {
        // Add agent-specific enhancements
        switch (agentId) {
            case 'claude-coder':
                // Add code-specific context
                context.repository.dependencies = await this.getDetailedDependencies();
                break;
            case 'ui-specialist':
                // Add UI-specific context
                context.ui.components = await this.getDetailedComponents();
                break;
            case 'supabase-architect':
                // Add database-specific context
                if (context.stack.supabase) {
                    context.stack.supabase.schema = await this.getDetailedSchema();
                }
                break;
            case 'introspective-agent':
                // Give full system view
                context.memories = await this.getAllRecentMemories();
                break;
        }
        return context;
    }
    /**
     * Store agent execution for learning
     */
    async storeAgentExecution(agentId, task, context, result) {
        const memory = {
            id: this.generateMemoryId(),
            agentId,
            type: this.inferMemoryType(task, result),
            content: {
                task,
                result,
                success: result.status === 'completed'
            },
            context: {
                repository: context.repository?.currentBranch,
                stack: Object.keys(context.stack || {}),
                timestamp: Date.now()
            },
            timestamp: Date.now(),
            tags: this.generateTags(task, result)
        };
        // Store in appropriate memory store
        const store = this.memoryStores[memory.type] || this.memoryStores.learnings;
        await store.storeMemory({
            content: JSON.stringify(memory.content),
            metadata: {
                agentId,
                timestamp: memory.timestamp,
                tags: memory.tags,
                context: memory.context
            }
        });
        // Update agent-specific memory index
        if (!this.agentMemories.has(agentId)) {
            this.agentMemories.set(agentId, []);
        }
        this.agentMemories.get(agentId).push(memory);
        // Detect patterns
        await this.detectPatterns(memory);
        this.logger.debug('Stored agent execution memory', { agentId, type: memory.type });
    }
    /**
     * Detect patterns from new memories
     */
    async detectPatterns(memory) {
        // Look for recurring patterns
        const similarMemories = await this.findSimilarMemories(memory);
        if (similarMemories.length >= 3) {
            // Pattern detected
            const pattern = {
                id: this.generatePatternId(),
                type: memory.type,
                description: this.describePattern(similarMemories),
                examples: similarMemories.map(m => m.id)
            };
            // Store pattern
            if (memory.type === 'error') {
                this.patternDetector.errorPatterns.set(pattern.id, pattern);
            }
            else if (memory.content.success) {
                this.patternDetector.successPatterns.set(pattern.id, pattern);
            }
            else {
                this.patternDetector.codePatterns.set(pattern.id, pattern);
            }
            // Store in RAG
            await this.memoryStores.patterns.storeMemory({
                content: JSON.stringify(pattern),
                contentType: 'code',
                metadata: {
                    agentId: memory.agentId,
                    timestamp: Date.now(),
                    tags: ['pattern', pattern.type]
                }
            });
            this.emit('pattern:detected', pattern);
        }
    }
    /**
     * Helper methods for context building
     */
    async scanProjectStructure() {
        // Implement project structure scanning
        return {};
    }
    async buildDependencyGraph() {
        // Build dependency graph from package.json and imports
        return {};
    }
    parseGitHistory(log) {
        const commits = log.trim().split('\n').map(line => {
            const [hash, ...messageParts] = line.split(' ');
            return {
                hash,
                message: messageParts.join(' '),
                author: '', // Would need more git info
                date: new Date() // Would need more git info
            };
        });
        return { commits };
    }
    getDefaultRepositoryContext() {
        return {
            structure: {},
            dependencies: {},
            history: { commits: [] },
            branches: [],
            currentBranch: 'main',
            uncommittedChanges: []
        };
    }
    async hasSupabase() {
        const fs = require('fs').promises;
        try {
            await fs.access(path.join(this.paths.project.root, 'supabase'));
            return true;
        }
        catch {
            return false;
        }
    }
    async hasVercel() {
        const fs = require('fs').promises;
        try {
            await fs.access(path.join(this.paths.project.root, 'vercel.json'));
            return true;
        }
        catch {
            return false;
        }
    }
    async hasN8N() {
        const fs = require('fs').promises;
        try {
            await fs.access(path.join(this.paths.project.root, '.n8n'));
            return true;
        }
        catch {
            return false;
        }
    }
    // Implement all the get* methods...
    async getSupabaseSchema() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            // Try to read schema from common locations
            const schemaPath = join(process.cwd(), 'supabase', 'migrations');
            const files = await fs.readdir(schemaPath).catch(() => []);
            const tables = [];
            for (const file of files) {
                if (file.endsWith('.sql')) {
                    const content = await fs.readFile(join(schemaPath, file), 'utf-8');
                    // Simple table extraction
                    const tableMatches = content.match(/create table\s+(\w+)/gi);
                    if (tableMatches) {
                        tables.push(...tableMatches.map(m => ({ name: m.split(/\s+/)[2] })));
                    }
                }
            }
            return { tables };
        }
        catch (error) {
            return { tables: [] };
        }
    }
    async getSupabaseEdgeFunctions() { return []; }
    async getRLSPolicies() { return []; }
    async getRealtimeChannels() { return []; }
    async getVercelConfig() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            const vercelPath = join(process.cwd(), 'vercel.json');
            const content = await fs.readFile(vercelPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            return { builds: [], routes: [], env: {} };
        }
    }
    getVercelEnv() { return {}; }
    async getVercelAnalytics() {
        // Return analytics data structure
        return {
            pageViews: 0,
            uniqueVisitors: 0,
            topPages: [],
            deviceBreakdown: {},
            locationBreakdown: {},
            timestamp: Date.now()
        };
    }
    async getVercelDeployments() { return []; }
    async getN8NWorkflows() { return []; }
    async getN8NCredentials() { return []; }
    async getRecentExecutions() { return []; }
    async getShadcnComponents() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            const componentsPath = join(process.cwd(), 'components', 'ui');
            const files = await fs.readdir(componentsPath).catch(() => []);
            return files
                .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
                .map(f => ({
                name: f.replace(/\.(tsx?|jsx?)$/, ''),
                path: join(componentsPath, f),
                props: {} // Will be populated from component analysis
            }));
        }
        catch (error) {
            return [];
        }
    }
    async getThemeConfig() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            const tailwindPath = join(process.cwd(), 'tailwind.config.js');
            const content = await fs.readFile(tailwindPath, 'utf-8');
            // Simple extraction of theme colors and fonts
            const colors = {};
            const fonts = {};
            // Extract colors from config
            const colorMatch = content.match(/colors:\s*{([^}]+)}/);
            if (colorMatch) {
                const colorLines = colorMatch[1].split(',');
                for (const line of colorLines) {
                    const [key, value] = line.split(':').map(s => s.trim());
                    if (key && value) {
                        colors[key.replace(/['"]/g, '')] = value.replace(/['"]/g, '');
                    }
                }
            }
            // Extract fonts from config
            const fontMatch = content.match(/fontFamily:\s*{([^}]+)}/);
            if (fontMatch) {
                const fontLines = fontMatch[1].split(',');
                for (const line of fontLines) {
                    const [key, value] = line.split(':').map(s => s.trim());
                    if (key && value) {
                        fonts[key.replace(/['"]/g, '')] = value.replace(/['"]/g, '');
                    }
                }
            }
            return { colors, fonts };
        }
        catch (error) {
            return { colors: {}, fonts: {} };
        }
    }
    async getAppRoutes() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        try {
            // Find route files (Next.js app router or pages)
            const { stdout } = await execAsync(`find ${process.cwd()} -type f \\( -name "page.tsx" -o -name "route.ts" -o -path "*/pages/*.tsx" \\) 2>/dev/null`, { timeout: 10000 });
            const files = stdout.trim().split('\n').filter(Boolean);
            return files.map(filePath => ({
                path: filePath.replace(process.cwd(), ''),
                component: filePath.split('/').pop() || ''
            }));
        }
        catch (error) {
            return [];
        }
    }
    async getPlaywrightTests() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            const testsPath = join(process.cwd(), 'tests');
            const e2ePath = join(process.cwd(), 'e2e');
            // Check both common test directories
            const testFiles = [];
            for (const dir of [testsPath, e2ePath]) {
                try {
                    const files = await fs.readdir(dir, { recursive: true });
                    for (const file of files) {
                        if (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) {
                            testFiles.push(join(dir, file));
                        }
                    }
                }
                catch {
                    // Directory doesn't exist, skip
                }
            }
            return testFiles.map(filePath => ({
                name: filePath.split('/').pop()?.replace(/\.(spec|test)\.ts$/, '') || '',
                path: filePath,
                status: 'pending'
            }));
        }
        catch (error) {
            return [];
        }
    }
    async getCoverageReport() {
        const { promises: fs } = await import('fs');
        const { join } = await import('path');
        try {
            const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json');
            const content = await fs.readFile(coveragePath, 'utf-8');
            const data = JSON.parse(content);
            if (data.total) {
                return {
                    total: data.total.lines.total || 0,
                    covered: data.total.lines.covered || 0
                };
            }
            return { total: 0, covered: 0 };
        }
        catch (error) {
            return { total: 0, covered: 0 };
        }
    }
    async getCurrentPlan() {
        // Return current execution plan with detailed status
        return {
            ...this.currentPlan,
            progressPercentage: this.currentPlan.total > 0
                ? (this.currentPlan.completed / this.currentPlan.total) * 100
                : 0,
            duration: this.currentPlan.startedAt
                ? Date.now() - this.currentPlan.startedAt
                : 0,
            estimatedCompletion: this.currentPlan.startedAt && this.currentPlan.completed > 0
                ? this.currentPlan.startedAt + ((Date.now() - this.currentPlan.startedAt) / this.currentPlan.completed) * this.currentPlan.total
                : null
        };
    }
    async calculateProgress() {
        // Calculate real progress percentage
        if (this.currentPlan.total === 0)
            return 0;
        return (this.currentPlan.completed / this.currentPlan.total) * 100;
    }
    async identifyBlockers() {
        // Identify blockers from plan execution
        const blockers = [];
        // Check for failed steps
        for (const step of this.currentPlan.steps) {
            if (step.status === 'failed') {
                blockers.push({
                    id: `blocker-${step.id}`,
                    description: `Step failed: ${step.description}`,
                    severity: 'high'
                });
            }
        }
        // Check for long-running pending steps
        const longRunningSteps = this.currentPlan.steps.filter(s => s.status === 'in-progress');
        if (longRunningSteps.length > 3) {
            blockers.push({
                id: 'blocker-concurrent',
                description: `Too many concurrent steps (${longRunningSteps.length}), may indicate resource contention`,
                severity: 'medium'
            });
        }
        // Add existing blockers from plan
        blockers.push(...this.currentPlan.blockers.map(b => ({
            ...b,
            severity: b.severity
        })));
        return blockers;
    }
    async getNextSteps() {
        // Generate next steps from current plan state
        const nextSteps = [];
        // Get pending steps
        const pendingSteps = this.currentPlan.steps.filter(s => s.status === 'pending');
        for (const step of pendingSteps.slice(0, 5)) { // Next 5 steps
            nextSteps.push({
                id: step.id,
                description: step.description,
                agent: step.agent || 'auto-assign'
            });
        }
        // If no pending steps but plan not complete, suggest completion
        if (nextSteps.length === 0 && this.currentPlan.completed < this.currentPlan.total) {
            nextSteps.push({
                id: 'complete-plan',
                description: 'Review and finalize plan execution',
                agent: 'sarah-pm'
            });
        }
        return nextSteps;
    }
    async getTimeline() {
        return {
            start: new Date(),
            end: new Date(),
            milestones: []
        };
    }
    getRecencyScore(timestamp) {
        const age = Date.now() - timestamp;
        const dayInMs = 24 * 60 * 60 * 1000;
        if (age < dayInMs)
            return 1.0;
        if (age < 7 * dayInMs)
            return 0.8;
        if (age < 30 * dayInMs)
            return 0.6;
        return 0.4;
    }
    extractKeywords(task) {
        const text = JSON.stringify(task).toLowerCase();
        // Simple keyword extraction
        return text.match(/\b\w+\b/g) || [];
    }
    isPatternRelevant(pattern, keywords) {
        const patternText = pattern.description.toLowerCase();
        return keywords.some(keyword => patternText.includes(keyword));
    }
    async getDetailedDependencies() {
        // Get detailed dependency information
        return {};
    }
    async getDetailedComponents() {
        // Get detailed component information
        return [];
    }
    async getDetailedSchema() {
        // Get detailed database schema
        return {};
    }
    async getAllRecentMemories() {
        const allMemories = [];
        for (const memories of this.agentMemories.values()) {
            allMemories.push(...memories);
        }
        return allMemories
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100);
    }
    generateMemoryId() {
        return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    inferMemoryType(task, result) {
        if (result.error)
            return 'error';
        if (task.type === 'code' || task.description?.includes('implement'))
            return 'code';
        if (task.type === 'decision')
            return 'decision';
        if (task.type === 'pattern')
            return 'pattern';
        return 'learning';
    }
    generateTags(task, result) {
        const tags = [];
        if (task.type)
            tags.push(task.type);
        if (result.status)
            tags.push(result.status);
        if (result.success)
            tags.push('success');
        if (result.error)
            tags.push('error');
        return tags;
    }
    async findSimilarMemories(memory) {
        const similar = [];
        for (const [agentId, memories] of this.agentMemories) {
            for (const mem of memories) {
                if (mem.id !== memory.id && this.areSimilar(mem, memory)) {
                    similar.push(mem);
                }
            }
        }
        return similar;
    }
    areSimilar(mem1, mem2) {
        // Simple similarity check
        return mem1.type === mem2.type &&
            mem1.agentId === mem2.agentId &&
            JSON.stringify(mem1.content).includes(JSON.stringify(mem2.content).substring(0, 50));
    }
    describePattern(memories) {
        // Generate pattern description
        return `Pattern detected from ${memories.length} similar occurrences`;
    }
    generatePatternId() {
        return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Load existing memories from disk
     */
    async loadExistingMemories() {
        // Load from memory stores
        for (const [type, store] of Object.entries(this.memoryStores)) {
            const memories = await store.getAllMemories();
            this.logger.info(`Loaded ${memories.length} ${type} memories`);
        }
    }
    /**
     * Initialize pattern detection
     */
    async initializePatternDetection() {
        // Load existing patterns
        const patterns = await this.memoryStores.patterns.searchMemories('pattern', { limit: 100 });
        for (const patternMemory of patterns) {
            const pattern = JSON.parse(patternMemory.content);
            if (pattern.type === 'error') {
                this.patternDetector.errorPatterns.set(pattern.id, pattern);
            }
            else if (pattern.type === 'success') {
                this.patternDetector.successPatterns.set(pattern.id, pattern);
            }
            else {
                this.patternDetector.codePatterns.set(pattern.id, pattern);
            }
        }
        this.logger.info('Loaded patterns', {
            code: this.patternDetector.codePatterns.size,
            error: this.patternDetector.errorPatterns.size,
            success: this.patternDetector.successPatterns.size
        });
    }
    /**
     * Get all agent memories
     */
    async getAgentMemories() {
        return this.agentMemories;
    }
    /**
     * Cleanup
     */
    async shutdown() {
        // Save any pending memories
        for (const store of Object.values(this.memoryStores)) {
            await store.close();
        }
    }
    async searchAllStores(query) {
        const results = [];
        // Search across all memory stores
        for (const [type, store] of Object.entries(this.memoryStores)) {
            try {
                const storeResults = await store.searchMemories(query.query || query, { limit: query.limit || 10 });
                results.push(...storeResults.map((r) => ({ ...r, storeType: type })));
            }
            catch (error) {
                this.logger.warn(`Error searching ${type} store`, { error });
            }
        }
        return results;
    }
    async getMemoryStatistics() {
        const stats = {
            totalMemories: 0,
            byType: {},
            byAgent: {},
            recentActivity: []
        };
        // Aggregate statistics from all stores
        for (const [type, store] of Object.entries(this.memoryStores)) {
            try {
                const memories = await store.getAllMemories();
                stats.byType[type] = memories.length;
                stats.totalMemories += memories.length;
            }
            catch (error) {
                stats.byType[type] = 0;
            }
        }
        // Agent-specific stats
        for (const [agentId, memories] of this.agentMemories) {
            stats.byAgent[agentId] = memories.length;
        }
        return stats;
    }
    /**
     * Store rule execution result for learning
     */
    async storeRuleExecution(ruleType, ruleId, executionData) {
        const memory = {
            id: this.generateMemoryId(),
            agentId: 'versatil-orchestrator',
            type: 'rule_execution',
            ruleId,
            ruleType,
            content: {
                ruleType,
                ruleId,
                ...executionData,
                timestamp: Date.now()
            },
            context: {
                systemLoad: await this.getSystemLoad(),
                activeAgents: await this.getActiveAgents(),
                projectPhase: await this.getCurrentProjectPhase()
            },
            timestamp: Date.now(),
            tags: ['rule_execution', ruleType, executionData.success ? 'success' : 'failure']
        };
        // Store in rule execution memory store
        await this.memoryStores.rule_execution.storeMemory({
            content: JSON.stringify(memory.content),
            contentType: 'text',
            metadata: {
                agentId: memory.agentId,
                timestamp: memory.timestamp,
                tags: memory.tags,
                context: memory.context,
                ruleType,
                ruleId
            }
        });
        // Update metrics
        this.updateRuleMetrics(ruleType, executionData);
        // Detect rule patterns
        await this.detectRulePatterns(memory);
        this.logger.debug('Stored rule execution memory', { ruleType, ruleId, success: executionData.success });
    }
    /**
     * Store cross-rule optimization insights
     */
    async storeCrossRuleOptimization(ruleTypes, optimizationData) {
        const memory = {
            id: this.generateMemoryId(),
            agentId: 'versatil-orchestrator',
            type: 'cross_rule_optimization',
            content: {
                ruleTypes,
                optimization: optimizationData,
                impact: optimizationData.impact,
                confidence: optimizationData.confidence
            },
            context: {
                combinationKey: ruleTypes.sort().join('_'),
                timestamp: Date.now()
            },
            timestamp: Date.now(),
            tags: ['cross_rule', 'optimization', ...ruleTypes]
        };
        // Store in cross-rule memory store
        await this.memoryStores.cross_rule_optimization.storeMemory({
            content: JSON.stringify(memory.content),
            contentType: 'text',
            metadata: {
                agentId: memory.agentId,
                timestamp: memory.timestamp,
                tags: memory.tags,
                context: memory.context,
                ruleTypes: ruleTypes.join(',')
            }
        });
        // Update cross-rule knowledge
        await this.updateCrossRuleKnowledge(ruleTypes, optimizationData);
        this.logger.info('Stored cross-rule optimization', { ruleTypes, impact: optimizationData.impact });
    }
    /**
     * Get rule execution insights for optimization
     */
    async getRuleExecutionInsights(ruleType) {
        const insights = {
            metrics: ruleType ? this.ruleExecutionMetrics[ruleType] : this.ruleExecutionMetrics,
            patterns: await this.getRulePatterns(ruleType),
            crossRuleOptimizations: await this.getCrossRuleOptimizations(ruleType),
            recommendations: await this.generateRuleRecommendations(ruleType)
        };
        return insights;
    }
    /**
     * Get context enhanced with rule execution memory
     */
    async getContextWithRuleMemory(agentId, task) {
        const baseContext = await this.getContextForAgent(agentId, task);
        // Add rule execution memories
        const ruleMemories = await this.getRuleExecutionMemories(task);
        baseContext.memories.push(...ruleMemories);
        // Add cross-rule optimizations
        const crossRuleInsights = await this.getCrossRuleInsights(task);
        baseContext.ruleInsights = crossRuleInsights;
        return baseContext;
    }
    /**
     * Detect patterns in rule executions
     */
    async detectRulePatterns(memory) {
        const similarExecutions = await this.findSimilarRuleExecutions(memory);
        if (similarExecutions.length >= 3) {
            const pattern = {
                id: this.generatePatternId(),
                type: `rule_${memory.ruleType}`,
                description: this.describeRulePattern(similarExecutions),
                examples: similarExecutions.map(m => m.id)
            };
            this.patternDetector.rulePatterns.set(pattern.id, pattern);
            // Store pattern in RAG
            await this.memoryStores.patterns.storeMemory({
                content: JSON.stringify(pattern),
                contentType: 'code',
                metadata: {
                    agentId: memory.agentId,
                    timestamp: Date.now(),
                    tags: ['pattern', 'rule', memory.ruleType],
                    ruleType: memory.ruleType
                }
            });
            this.emit('rule_pattern:detected', pattern);
        }
    }
    /**
     * Update rule execution metrics
     */
    updateRuleMetrics(ruleType, executionData) {
        const metrics = this.ruleExecutionMetrics[ruleType];
        if (!metrics)
            return;
        if (executionData.success && 'successes' in metrics) {
            metrics.successes++;
        }
        else if ('failures' in metrics) {
            metrics.failures++;
        }
        // Update specific metrics based on rule type
        if (ruleType === 'parallel_execution' && 'avgTime' in metrics) {
            if (executionData.avgTime) {
                metrics.avgTime = (metrics.avgTime + executionData.avgTime) / 2;
            }
            if (executionData.collisions) {
                metrics.collisions += executionData.collisions;
            }
        }
        else if (ruleType === 'stress_testing') {
            if (executionData.testsGenerated) {
                metrics.testsGenerated += executionData.testsGenerated;
            }
            if (executionData.testsRun) {
                metrics.testsRun += executionData.testsRun;
            }
        }
        else if (ruleType === 'daily_audit') {
            if (executionData.score) {
                metrics.avgScore = (metrics.avgScore + executionData.score) / 2;
            }
        }
    }
    /**
     * Update cross-rule knowledge base
     */
    async updateCrossRuleKnowledge(ruleTypes, optimizationData) {
        const combinationKey = ruleTypes.sort().join('_');
        if (optimizationData.impact > 0.1) {
            // Positive synergy
            this.crossRuleKnowledge.synergies.set(combinationKey, {
                ruleTypes,
                impact: optimizationData.impact,
                confidence: optimizationData.confidence,
                description: optimizationData.description,
                lastUpdated: Date.now()
            });
        }
        else if (optimizationData.impact < -0.1) {
            // Negative interaction (conflict)
            this.crossRuleKnowledge.conflicts.set(combinationKey, {
                ruleTypes,
                impact: optimizationData.impact,
                confidence: optimizationData.confidence,
                description: optimizationData.description,
                lastUpdated: Date.now()
            });
        }
        // Store optimization pattern
        if (optimizationData.optimization) {
            this.crossRuleKnowledge.optimizations.set(combinationKey, {
                ruleTypes,
                optimization: optimizationData.optimization,
                effectiveness: optimizationData.effectiveness,
                lastUpdated: Date.now()
            });
        }
    }
    /**
     * Get rule execution memories relevant to current task
     */
    async getRuleExecutionMemories(task) {
        const ruleMemories = await this.memoryStores.rule_execution.searchMemories(task.description || 'rule execution', { limit: 10, rerank: true });
        return ruleMemories.map(r => ({
            id: r.id,
            agentId: r.metadata.agentId,
            type: 'rule_execution',
            content: JSON.parse(r.content),
            context: r.metadata.context,
            timestamp: r.metadata.timestamp,
            relevance: r.similarity,
            tags: r.metadata.tags || [],
            ruleType: r.metadata.ruleType
        }));
    }
    /**
     * Get cross-rule insights for current task
     */
    async getCrossRuleInsights(task) {
        const crossRuleMemories = await this.memoryStores.cross_rule_optimization.searchMemories(task.description || 'cross rule', { limit: 5 });
        return {
            optimizations: crossRuleMemories.map(r => JSON.parse(r.content)),
            synergies: Array.from(this.crossRuleKnowledge.synergies.values()),
            conflicts: Array.from(this.crossRuleKnowledge.conflicts.values()),
            recommendations: await this.generateCrossRuleRecommendations(task)
        };
    }
    /**
     * Generate rule-specific recommendations
     */
    async generateRuleRecommendations(ruleType) {
        const recommendations = [];
        if (!ruleType || ruleType === 'parallel_execution') {
            const parallelMetrics = this.ruleExecutionMetrics.parallel_execution;
            if (parallelMetrics.collisions > parallelMetrics.successes * 0.1) {
                recommendations.push('Consider reducing parallel task concurrency to minimize collisions');
            }
            if (parallelMetrics.avgTime > 5000) {
                recommendations.push('Optimize parallel task execution times through better resource allocation');
            }
        }
        if (!ruleType || ruleType === 'stress_testing') {
            const stressMetrics = this.ruleExecutionMetrics.stress_testing;
            if (stressMetrics.failuresDetected > stressMetrics.testsRun * 0.3) {
                recommendations.push('High failure rate detected - consider improving test coverage or implementation quality');
            }
        }
        if (!ruleType || ruleType === 'daily_audit') {
            const auditMetrics = this.ruleExecutionMetrics.daily_audit;
            if (auditMetrics.avgScore < 0.8) {
                recommendations.push('Average audit score below threshold - implement targeted improvements');
            }
        }
        return recommendations;
    }
    /**
     * Generate cross-rule recommendations
     */
    async generateCrossRuleRecommendations(task) {
        const recommendations = [];
        // Check for beneficial synergies
        for (const synergy of this.crossRuleKnowledge.synergies.values()) {
            if (synergy.impact > 0.2 && synergy.confidence > 0.8) {
                recommendations.push(`Consider combining ${synergy.ruleTypes.join(' + ')} for enhanced performance`);
            }
        }
        // Warn about conflicts
        for (const conflict of this.crossRuleKnowledge.conflicts.values()) {
            if (Math.abs(conflict.impact) > 0.2 && conflict.confidence > 0.8) {
                recommendations.push(`Avoid running ${conflict.ruleTypes.join(' + ')} simultaneously to prevent conflicts`);
            }
        }
        return recommendations;
    }
    // Helper methods for new functionality
    async getSystemLoad() {
        // Get current system load metrics
        return 0.5; // Placeholder
    }
    async getActiveAgents() {
        // Get list of currently active agents
        return Array.from(this.agentMemories.keys());
    }
    async getCurrentProjectPhase() {
        // Determine current project phase
        return 'development'; // Placeholder
    }
    async getRulePatterns(ruleType) {
        const patterns = [];
        for (const pattern of this.patternDetector.rulePatterns.values()) {
            if (!ruleType || pattern.type.includes(ruleType)) {
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    async getCrossRuleOptimizations(ruleType) {
        const optimizations = [];
        for (const optimization of this.crossRuleKnowledge.optimizations.values()) {
            if (!ruleType || optimization.ruleTypes.includes(ruleType)) {
                optimizations.push(optimization);
            }
        }
        return optimizations;
    }
    async findSimilarRuleExecutions(memory) {
        const similar = [];
        // Search in rule execution store
        const results = await this.memoryStores.rule_execution.searchMemories(JSON.stringify(memory.content).substring(0, 100), { limit: 10 });
        return results.map(r => ({
            id: r.id,
            agentId: r.metadata.agentId,
            type: 'rule_execution',
            content: JSON.parse(r.content),
            context: r.metadata.context,
            timestamp: r.metadata.timestamp,
            tags: r.metadata.tags || [],
            ruleType: r.metadata.ruleType
        })).filter(m => m.id !== memory.id && m.ruleType === memory.ruleType);
    }
    describeRulePattern(executions) {
        const ruleType = executions[0]?.ruleType;
        const successRate = executions.filter(e => e.content.success).length / executions.length;
        return `Rule ${ruleType} pattern: ${executions.length} executions with ${(successRate * 100).toFixed(1)}% success rate`;
    }
}
//# sourceMappingURL=agentic-rag-orchestrator.js.map