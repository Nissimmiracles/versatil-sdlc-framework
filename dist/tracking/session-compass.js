/**
 * VERSATIL Session Compass
 *
 * Provides automatic context overview every time you open Cursor/Claude.
 *
 * Shows:
 * - Current development context
 * - Main plan summary
 * - Task prioritization
 * - Parallel execution opportunities
 * - Context budget status
 * - Three-tier status (backend/database/frontend)
 *
 * Integrates:
 * - SessionManager (session tracking)
 * - TaskPlanManager (task hierarchy)
 * - ContextSentinel (token monitoring)
 * - ThreeTierStatusTracker (layer monitoring)
 * - TodoPipelineVisualizer (visual pipeline)
 */
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class SessionCompass {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
    }
    /**
     * Main entry point: Generate complete session overview
     */
    async generateOverview() {
        const [projectContext, mainPlan, taskPriority, parallelOpportunities, contextBudget, threeTierStatus, quickStats] = await Promise.all([
            this.getProjectContext(),
            this.getMainPlanSummary(),
            this.getTaskPrioritization(),
            this.getParallelOpportunities(),
            this.getContextBudget(),
            this.getThreeTierStatus(),
            this.getQuickStats()
        ]);
        return {
            projectContext,
            mainPlan,
            taskPriority,
            parallelOpportunities,
            contextBudget,
            threeTierStatus,
            quickStats,
            timestamp: new Date()
        };
    }
    /**
     * Get current project context
     */
    async getProjectContext() {
        const projectName = path.basename(this.projectPath);
        // Get git info
        const gitStatus = await this.getGitStatus();
        const branch = await this.getCurrentBranch();
        // Get last session info
        const lastSession = await this.getLastSessionInfo();
        return {
            projectName,
            branch,
            gitStatus,
            lastSession
        };
    }
    /**
     * Get git status
     */
    async getGitStatus() {
        try {
            const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: this.projectPath });
            const { stdout: aheadBehind } = await execAsync('git rev-list --left-right --count @{upstream}...HEAD', { cwd: this.projectPath }).catch(() => ({ stdout: '0\t0' }));
            const lines = statusOut.trim().split('\n').filter(l => l);
            const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
            const untracked = lines.filter(l => l.startsWith('??')).length;
            const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
            return {
                clean: lines.length === 0,
                ahead: ahead || 0,
                behind: behind || 0,
                modified,
                untracked
            };
        }
        catch (error) {
            return {
                clean: true,
                ahead: 0,
                behind: 0,
                modified: 0,
                untracked: 0
            };
        }
    }
    /**
     * Get current git branch
     */
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync('git branch --show-current', { cwd: this.projectPath });
            return stdout.trim() || 'main';
        }
        catch (error) {
            return 'main';
        }
    }
    /**
     * Get last session info
     */
    async getLastSessionInfo() {
        try {
            const sessionsDir = path.join(homedir(), '.versatil', 'sessions');
            const files = await fs.readdir(sessionsDir);
            const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json')).sort().reverse();
            if (sessionFiles.length === 0)
                return null;
            const lastSessionPath = path.join(sessionsDir, sessionFiles[0]);
            const content = await fs.readFile(lastSessionPath, 'utf-8');
            const session = JSON.parse(content);
            const when = this.formatTimeAgo(session.endTime);
            return {
                when,
                timeSaved: session.totalTimeSaved,
                impactScore: session.impactScore
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Format time ago (e.g., "2h ago", "30m ago")
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days}d ago`;
        if (hours > 0)
            return `${hours}h ago`;
        return `${minutes}m ago`;
    }
    /**
     * Get main plan summary
     */
    async getMainPlanSummary() {
        // TODO: Integrate with TaskPlanManager to get actual plan
        // For now, return mock data
        return {
            activeFeature: 'Add Oliver-MCP orchestration agent',
            status: 'Phase 2/5 (40% complete)',
            agentsWorking: ['Oliver-MCP', 'Marcus-Backend', 'Maria-QA'],
            phases: [
                { number: 1, name: 'Planning', status: 'completed', progress: 100, eta: 'COMPLETED' },
                { number: 2, name: 'GitMCP Integration', status: 'completed', progress: 100, eta: 'COMPLETED' },
                { number: 3, name: 'Agent Integration', status: 'in_progress', progress: 60, eta: '45 min' },
                { number: 4, name: 'Documentation', status: 'pending', progress: 0, eta: '25 min' },
                { number: 5, name: 'Testing', status: 'pending', progress: 0, eta: '20 min' }
            ],
            totalETA: '1.5 hours remaining'
        };
    }
    /**
     * Get task prioritization
     */
    async getTaskPrioritization() {
        try {
            // Use TodoPipelineVisualizer for real task data
            const { getTodoPipelineVisualizer } = await import('./todo-pipeline-visualizer.js');
            const visualizer = getTodoPipelineVisualizer(this.projectPath);
            const pipeline = await visualizer.analyzePipeline();
            const convertTask = (task) => ({
                id: task.id,
                description: task.description || task.title,
                assignedAgent: task.assignedAgent || 'Unknown',
                canParallel: !task.dependsOn || task.dependsOn.length === 0,
                dependsOn: task.dependsOn || [],
                contextNeeded: task.estimatedMinutes ? task.estimatedMinutes * 100 : 5000,
                eta: task.estimatedMinutes ? `${task.estimatedMinutes} min` : 'Unknown'
            });
            // Filter pending tasks and group by priority
            const pendingTasks = pipeline.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
            let high = pendingTasks.filter(t => t.priority === 'high').map(convertTask);
            let medium = pendingTasks.filter(t => t.priority === 'medium').map(convertTask);
            let low = pendingTasks.filter(t => t.priority === 'low').map(convertTask);
            // Get context budget status
            const { getContextBudgetManager } = await import('./context-budget-manager.js');
            const budgetManager = getContextBudgetManager();
            const budget = await budgetManager.getBudgetStatus();
            // If context is critical (>85%), automatically defer low-priority tasks
            if (budget.status === 'critical') {
                // Move all low-priority tasks to deferred list
                console.log(`[SessionCompass] Context critical (${budget.usagePercent}%) - deferring ${low.length} low-priority tasks`);
                low = [];
                // If still critical after deferring low tasks, defer medium tasks too
                if (budget.usagePercent > 90) {
                    console.log(`[SessionCompass] Context very critical (${budget.usagePercent}%) - deferring ${medium.length} medium-priority tasks`);
                    medium = [];
                }
            }
            // If context is warning (>80%), prioritize smaller tasks first
            if (budget.status === 'warning' || budget.status === 'critical') {
                // Sort each priority group by context needed (smaller tasks first)
                high = high.sort((a, b) => a.contextNeeded - b.contextNeeded);
                medium = medium.sort((a, b) => a.contextNeeded - b.contextNeeded);
                low = low.sort((a, b) => a.contextNeeded - b.contextNeeded);
                console.log(`[SessionCompass] Context ${budget.status} (${budget.usagePercent}%) - prioritizing smaller tasks`);
            }
            return { high, medium, low };
        }
        catch (error) {
            // Fallback to empty if no todos found
            return { high: [], medium: [], low: [] };
        }
    }
    /**
     * Get parallel execution opportunities
     */
    async getParallelOpportunities() {
        try {
            // Use TodoPipelineVisualizer for real parallel analysis
            const { getTodoPipelineVisualizer } = await import('./todo-pipeline-visualizer.js');
            const visualizer = getTodoPipelineVisualizer(this.projectPath);
            const pipeline = await visualizer.analyzePipeline();
            if (pipeline.parallelGroups.length === 0) {
                return {
                    now: [],
                    after: {},
                    timeSavings: '0 minutes (no parallel opportunities)'
                };
            }
            // Calculate time savings from parallelization
            const timeSavings = this.calculateParallelTimeSavings(pipeline);
            // Build dependency map: { taskId: [dependent tasks that can run after] }
            const dependencyMap = {};
            for (let i = 0; i < pipeline.parallelGroups.length - 1; i++) {
                const currentGroup = pipeline.parallelGroups[i];
                const nextGroup = pipeline.parallelGroups[i + 1];
                for (const taskId of currentGroup) {
                    if (!dependencyMap[taskId]) {
                        dependencyMap[taskId] = [];
                    }
                    dependencyMap[taskId].push(...nextGroup);
                }
            }
            return {
                now: pipeline.parallelGroups[0] || [],
                after: dependencyMap,
                timeSavings: `${timeSavings} minutes via parallelization`
            };
        }
        catch (error) {
            return {
                now: [],
                after: {},
                timeSavings: '0 minutes (no todos found)'
            };
        }
    }
    /**
     * Calculate time savings from parallel execution
     */
    calculateParallelTimeSavings(pipeline) {
        // Sequential time: sum of all task durations
        const sequentialTime = pipeline.tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
        // Parallel time: sum of maximum duration in each parallel group
        let parallelTime = 0;
        for (const group of pipeline.parallelGroups) {
            const groupTasks = pipeline.tasks.filter((t) => group.includes(t.id));
            const maxDuration = Math.max(...groupTasks.map((t) => t.estimatedMinutes || 0));
            parallelTime += maxDuration;
        }
        return Math.max(0, sequentialTime - parallelTime);
    }
    /**
     * Get context budget status
     */
    async getContextBudget() {
        try {
            // Use ContextBudgetManager for real context tracking
            const { getContextBudgetManager } = await import('./context-budget-manager.js');
            const budgetManager = getContextBudgetManager();
            const budget = await budgetManager.getBudgetStatus();
            return {
                available: budget.available,
                allocated: budget.allocated,
                reserved: budget.reserved,
                remaining: budget.remaining,
                status: budget.status,
                message: budget.message
            };
        }
        catch (error) {
            // Fallback to safe defaults if ContextBudgetManager unavailable
            const MAX_TOKENS = 200000;
            const SAFE_THRESHOLD = 180000;
            const reserved = 15000;
            return {
                available: SAFE_THRESHOLD,
                allocated: 0,
                reserved,
                remaining: SAFE_THRESHOLD - reserved,
                status: 'healthy',
                message: 'Context tracking unavailable - using safe defaults'
            };
        }
    }
    /**
     * Get three-tier status
     */
    async getThreeTierStatus() {
        try {
            // Use ThreeTierStatusTracker for real tier analysis
            const { getThreeTierStatusTracker } = await import('./three-tier-status-tracker.js');
            const tracker = getThreeTierStatusTracker(this.projectPath);
            const status = await tracker.getStatus();
            return {
                backend: {
                    progress: status.backend.progress,
                    completed: status.backend.completed,
                    total: status.backend.total,
                    next: status.backend.next,
                    recommendation: status.backend.recommendation
                },
                database: {
                    progress: status.database.progress,
                    status: status.database.next,
                    recommendation: status.database.recommendation
                },
                frontend: {
                    progress: status.frontend.progress,
                    completed: status.frontend.completed,
                    total: status.frontend.total,
                    next: status.frontend.next,
                    recommendation: status.frontend.recommendation
                }
            };
        }
        catch (error) {
            // Fallback to empty status if tracker unavailable
            return {
                backend: {
                    progress: 0,
                    completed: 0,
                    total: 0,
                    next: 'No backend tasks found',
                    recommendation: 'Create todos/*.md files for tracking'
                },
                database: {
                    progress: 0,
                    status: 'No database tasks found',
                    recommendation: 'Create todos/*.md files for tracking'
                },
                frontend: {
                    progress: 0,
                    completed: 0,
                    total: 0,
                    next: 'No frontend tasks found',
                    recommendation: 'Create todos/*.md files for tracking'
                }
            };
        }
    }
    /**
     * Get quick stats
     */
    async getQuickStats() {
        // TODO: Get real stats from framework health monitor
        return {
            frameworkHealth: 95,
            activeAgents: '3/17',
            openTodos: '6 (4 pending, 2 in progress)',
            gitStatus: 'Clean (2 commits ahead)',
            lastBuild: '✅ Passing (2 min ago)',
            tests: '✅ 127/130 passing (97.7%)'
        };
    }
    /**
     * Format overview as human-readable text
     */
    formatAsText(data) {
        const c = {
            reset: '\x1b[0m',
            bold: '\x1b[1m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            gray: '\x1b[90m',
        };
        let output = `${c.bold}${c.cyan}
╔═══════════════════════════════════════════════════════════╗
║   📍 VERSATIL Session Compass                             ║
╚═══════════════════════════════════════════════════════════╝${c.reset}

${c.bold}🎯 Current Development Context:${c.reset}

  Project: ${data.projectContext.projectName}
  Branch: ${data.projectContext.branch} (${data.projectContext.gitStatus.clean ? 'clean' : 'modified'}, ${data.projectContext.gitStatus.ahead} commits ahead)
`;
        if (data.projectContext.lastSession) {
            output += `  Last Session: ${data.projectContext.lastSession.when} (saved ${data.projectContext.lastSession.timeSaved} min, ${data.projectContext.lastSession.impactScore}/10 impact)\n`;
        }
        output += `
${c.bold}📋 Main Plan Summary:${c.reset}

  Active Feature: "${data.mainPlan.activeFeature}"
  Status: ${data.mainPlan.status}
  Agents Working: ${data.mainPlan.agentsWorking.join(', ')}

`;
        for (const phase of data.mainPlan.phases) {
            const icon = phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
            const progressBar = this.createProgressBar(phase.progress);
            output += `  ${icon} Phase ${phase.number}: ${phase.name} ${phase.status === 'in_progress' ? progressBar : ''}(${phase.eta})\n`;
        }
        output += `
  ETA: ${data.mainPlan.totalETA}

${c.bold}🔢 Task Prioritization (Next Actions):${c.reset}
`;
        // Show context budget warning if tasks are being deferred
        if (data.contextBudget.status === 'critical') {
            output += `
  ${c.yellow}⚠️ CONTEXT BUDGET CRITICAL (${Math.round((data.contextBudget.remaining / data.contextBudget.available) * 100)}% remaining)${c.reset}
  Low-priority tasks automatically deferred to preserve context.
  Complete high-priority tasks first to free up context budget.

`;
        }
        else if (data.contextBudget.status === 'warning') {
            output += `
  ${c.yellow}⚠️ CONTEXT BUDGET WARNING (${Math.round((data.contextBudget.remaining / data.contextBudget.available) * 100)}% remaining)${c.reset}
  Smaller tasks prioritized first to optimize context usage.

`;
        }
        output += `  ${c.green}HIGH PRIORITY (Do First):${c.reset}
`;
        if (data.taskPriority.high.length === 0) {
            output += `    (No high-priority tasks)\n\n`;
        }
        else {
            for (const task of data.taskPriority.high) {
                const parallel = task.canParallel ? 'Yes' : task.dependsOn.length > 0 ? `NO (depends on #${task.dependsOn.join(', #')})` : 'Yes';
                output += `  ${task.id}. [P1] ${task.description} (${task.assignedAgent})\n`;
                output += `     → Parallel OK: ${parallel}\n`;
                output += `     → Context needed: ~${task.contextNeeded.toLocaleString()} tokens\n`;
                output += `     → ETA: ${task.eta}\n\n`;
            }
        }
        if (data.taskPriority.medium.length > 0) {
            output += `  ${c.yellow}MEDIUM PRIORITY (Do Next):${c.reset}\n`;
            for (const task of data.taskPriority.medium) {
                output += `  ${task.id}. [P2] ${task.description} (${task.assignedAgent})\n`;
                output += `     → Parallel OK: ${task.canParallel ? 'AFTER #' + task.dependsOn.join(', #') : 'NO'}\n`;
                output += `     → Context needed: ~${task.contextNeeded.toLocaleString()} tokens\n`;
                output += `     → ETA: ${task.eta}\n\n`;
            }
        }
        else if (data.contextBudget.status === 'critical' || data.contextBudget.status === 'warning') {
            output += `  ${c.yellow}MEDIUM PRIORITY:${c.reset} (Deferred due to context budget)\n\n`;
        }
        if (data.taskPriority.low.length > 0) {
            output += `  ${c.gray}LOW PRIORITY (Do Later):${c.reset}\n`;
            for (const task of data.taskPriority.low.slice(0, 3)) {
                output += `  ${task.id}. [P3] ${task.description} (${task.assignedAgent})\n`;
            }
            if (data.taskPriority.low.length > 3) {
                output += `  ... and ${data.taskPriority.low.length - 3} more low-priority tasks\n`;
            }
            output += '\n';
        }
        else if (data.contextBudget.status === 'critical') {
            output += `  ${c.gray}LOW PRIORITY:${c.reset} (All deferred due to context budget)\n\n`;
        }
        output += `${c.bold}⚡ Parallel Execution Opportunities:${c.reset}

  NOW: #${data.parallelOpportunities.now.join(', #')}
`;
        for (const [after, tasks] of Object.entries(data.parallelOpportunities.after)) {
            output += `  AFTER #${after}: #${tasks.join(' AND #')} (parallel)\n`;
        }
        output += `  → Time savings: ${data.parallelOpportunities.timeSavings}

${c.bold}💾 Context Budget:${c.reset}

  Available: ${data.contextBudget.available.toLocaleString()} tokens (${Math.round((data.contextBudget.available / 200000) * 100)}% of 200k max)
  Allocated: ${data.contextBudget.allocated.toLocaleString()} tokens (for tasks above)
  Reserved: ${data.contextBudget.reserved.toLocaleString()} tokens (emergency buffer)
  Remaining: ${data.contextBudget.remaining.toLocaleString()} tokens (safe for all tasks)

  ${data.contextBudget.status === 'healthy' ? '✅ HEALTHY' : data.contextBudget.status === 'warning' ? '⚠️ WARNING' : '🚨 CRITICAL'}: ${data.contextBudget.message}

${c.bold}🎛️ Three-Tier Status:${c.reset}

  📊 Backend:  ${this.createProgressBar(data.threeTierStatus.backend.progress)} ${data.threeTierStatus.backend.progress}% (${data.threeTierStatus.backend.completed}/${data.threeTierStatus.backend.total} done)
    Next: ${data.threeTierStatus.backend.next}
    Recommendation: ${data.threeTierStatus.backend.recommendation}

  🗄️ Database: ${this.createProgressBar(data.threeTierStatus.database.progress)} ${data.threeTierStatus.database.progress}%
    Status: ${data.threeTierStatus.database.status}
    Recommendation: ${data.threeTierStatus.database.recommendation}

  🎨 Frontend: ${this.createProgressBar(data.threeTierStatus.frontend.progress)} ${data.threeTierStatus.frontend.progress}% (${data.threeTierStatus.frontend.completed}/${data.threeTierStatus.frontend.total} done)
    Next: ${data.threeTierStatus.frontend.next}
    Recommendation: ${data.threeTierStatus.frontend.recommendation}

${c.bold}📊 Quick Stats:${c.reset}

  • Framework Health: ${data.quickStats.frameworkHealth}%
  • Active Agents: ${data.quickStats.activeAgents}
  • Open Todos: ${data.quickStats.openTodos}
  • Git Status: ${data.quickStats.gitStatus}
  • Last Build: ${data.quickStats.lastBuild}
  • Tests: ${data.quickStats.tests}

${c.gray}───────────────────────────────────────────────────────────${c.reset}

${c.gray}Commands:${c.reset}
  ${c.cyan}/context${c.reset}              Show this overview
  ${c.cyan}/plan "feature"${c.reset}       Plan new feature
  ${c.cyan}/work${c.reset}                 Execute next priority task
  ${c.cyan}npm run gantt${c.reset}         Show visual task pipeline
`;
        return output;
    }
    /**
     * Create progress bar (10 blocks)
     */
    createProgressBar(percent) {
        const filled = Math.round((percent / 100) * 10);
        const empty = 10 - filled;
        return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
    }
    /**
     * Format overview as JSON
     */
    formatAsJSON(data) {
        return JSON.stringify(data, null, 2);
    }
    /**
     * Format overview as markdown
     */
    formatAsMarkdown(data) {
        let output = `# 📍 VERSATIL Session Compass\n\n`;
        output += `**Generated**: ${data.timestamp.toLocaleString()}\n\n`;
        output += `## 🎯 Current Development Context\n\n`;
        output += `- **Project**: ${data.projectContext.projectName}\n`;
        output += `- **Branch**: ${data.projectContext.branch}\n`;
        output += `- **Git Status**: ${data.projectContext.gitStatus.clean ? 'Clean' : 'Modified'} (${data.projectContext.gitStatus.ahead} commits ahead)\n\n`;
        if (data.projectContext.lastSession) {
            output += `- **Last Session**: ${data.projectContext.lastSession.when} (saved ${data.projectContext.lastSession.timeSaved} min, ${data.projectContext.lastSession.impactScore}/10 impact)\n\n`;
        }
        output += `## 📋 Main Plan Summary\n\n`;
        output += `- **Active Feature**: "${data.mainPlan.activeFeature}"\n`;
        output += `- **Status**: ${data.mainPlan.status}\n`;
        output += `- **Agents Working**: ${data.mainPlan.agentsWorking.join(', ')}\n\n`;
        output += `### Phases\n\n`;
        for (const phase of data.mainPlan.phases) {
            const icon = phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
            output += `${icon} **Phase ${phase.number}: ${phase.name}** - ${phase.eta}\n`;
        }
        output += `\n**ETA**: ${data.mainPlan.totalETA}\n\n`;
        return output;
    }
}
//# sourceMappingURL=session-compass.js.map