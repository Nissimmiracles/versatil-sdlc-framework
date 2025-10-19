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

export interface ProjectContext {
  projectName: string;
  branch: string;
  gitStatus: {
    clean: boolean;
    ahead: number;
    behind: number;
    modified: number;
    untracked: number;
  };
  lastSession: {
    when: string; // "2h ago"
    timeSaved: number; // minutes
    impactScore: number; // 0-10
  } | null;
}

export interface MainPlanSummary {
  activeFeature: string | null;
  status: string; // "Phase 2/5 (40% complete)"
  agentsWorking: string[];
  phases: Array<{
    number: number;
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
    progress: number; // 0-100
    eta: string; // "30 min" or "COMPLETED"
  }>;
  totalETA: string; // "2.5 hours remaining"
}

export interface TaskPriority {
  priority: 'high' | 'medium' | 'low';
  tasks: Array<{
    id: string;
    description: string;
    assignedAgent: string;
    canParallel: boolean;
    dependsOn: string[];
    contextNeeded: number; // tokens
    eta: string; // "30 minutes"
  }>;
}

export interface ParallelOpportunities {
  now: string[]; // Task IDs can run now
  after: Record<string, string[]>; // After task X, run tasks Y, Z in parallel
  timeSavings: string; // "15 minutes via parallelization"
}

export interface ContextBudgetStatus {
  available: number; // tokens
  allocated: number; // tokens for prioritized tasks
  reserved: number; // emergency buffer
  remaining: number; // safe remaining
  status: 'healthy' | 'warning' | 'critical';
  message: string;
}

export interface ThreeTierStatus {
  backend: {
    progress: number; // 0-100
    completed: number;
    total: number;
    next: string;
    recommendation: string;
  };
  database: {
    progress: number;
    status: string;
    recommendation: string;
  };
  frontend: {
    progress: number;
    completed: number;
    total: number;
    next: string;
    recommendation: string;
  };
}

export interface QuickStats {
  frameworkHealth: number; // 0-100
  activeAgents: string; // "3/17"
  openTodos: string; // "6 (4 pending, 2 in progress)"
  gitStatus: string; // "Clean (2 commits ahead)"
  lastBuild: string; // "✅ Passing (2 min ago)"
  tests: string; // "✅ 127/130 passing (97.7%)"
}

export interface SessionCompassData {
  projectContext: ProjectContext;
  mainPlan: MainPlanSummary;
  taskPriority: {
    high: TaskPriority['tasks'];
    medium: TaskPriority['tasks'];
    low: TaskPriority['tasks'];
  };
  parallelOpportunities: ParallelOpportunities;
  contextBudget: ContextBudgetStatus;
  threeTierStatus: ThreeTierStatus;
  quickStats: QuickStats;
  timestamp: Date;
}

export class SessionCompass {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Main entry point: Generate complete session overview
   */
  async generateOverview(): Promise<SessionCompassData> {
    const [
      projectContext,
      mainPlan,
      taskPriority,
      parallelOpportunities,
      contextBudget,
      threeTierStatus,
      quickStats
    ] = await Promise.all([
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
  private async getProjectContext(): Promise<ProjectContext> {
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
  private async getGitStatus(): Promise<ProjectContext['gitStatus']> {
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
    } catch (error) {
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
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: this.projectPath });
      return stdout.trim() || 'main';
    } catch (error) {
      return 'main';
    }
  }

  /**
   * Get last session info
   */
  private async getLastSessionInfo(): Promise<ProjectContext['lastSession']> {
    try {
      const sessionsDir = path.join(homedir(), '.versatil', 'sessions');
      const files = await fs.readdir(sessionsDir);
      const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json')).sort().reverse();

      if (sessionFiles.length === 0) return null;

      const lastSessionPath = path.join(sessionsDir, sessionFiles[0]);
      const content = await fs.readFile(lastSessionPath, 'utf-8');
      const session = JSON.parse(content);

      const when = this.formatTimeAgo(session.endTime);

      return {
        when,
        timeSaved: session.totalTimeSaved,
        impactScore: session.impactScore
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Format time ago (e.g., "2h ago", "30m ago")
   */
  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  }

  /**
   * Get main plan summary
   */
  private async getMainPlanSummary(): Promise<MainPlanSummary> {
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
  private async getTaskPrioritization(): Promise<{
    high: TaskPriority['tasks'];
    medium: TaskPriority['tasks'];
    low: TaskPriority['tasks'];
  }> {
    // TODO: Read from todos/*.md files and prioritize
    // For now, return mock data
    const high: TaskPriority['tasks'] = [
      {
        id: '1',
        description: 'Complete Oliver-MCP agent integration',
        assignedAgent: 'Marcus-Backend',
        canParallel: true,
        dependsOn: [],
        contextNeeded: 8000,
        eta: '30 minutes'
      },
      {
        id: '2',
        description: 'Update agent registry',
        assignedAgent: 'Sarah-PM',
        canParallel: false,
        dependsOn: ['1'],
        contextNeeded: 3000,
        eta: '15 minutes'
      }
    ];

    const medium: TaskPriority['tasks'] = [
      {
        id: '3',
        description: 'Write integration tests',
        assignedAgent: 'Maria-QA',
        canParallel: true,
        dependsOn: ['1'],
        contextNeeded: 5000,
        eta: '20 minutes'
      },
      {
        id: '4',
        description: 'Create documentation',
        assignedAgent: 'Sarah-PM',
        canParallel: true,
        dependsOn: ['1'],
        contextNeeded: 4000,
        eta: '25 minutes'
      }
    ];

    const low: TaskPriority['tasks'] = [];

    return { high, medium, low };
  }

  /**
   * Get parallel execution opportunities
   */
  private async getParallelOpportunities(): Promise<ParallelOpportunities> {
    // TODO: Calculate from task dependencies
    return {
      now: ['1'],
      after: {
        '1': ['2', '3', '4']
      },
      timeSavings: '15 minutes via parallelization'
    };
  }

  /**
   * Get context budget status
   */
  private async getContextBudget(): Promise<ContextBudgetStatus> {
    // TODO: Integrate with ContextSentinel for real metrics
    const MAX_TOKENS = 200000;
    const SAFE_THRESHOLD = 180000;
    const currentUsage = 17000; // Mock: would get from ContextSentinel

    const available = SAFE_THRESHOLD - currentUsage;
    const allocated = 20000; // Mock: sum of task context needs
    const reserved = 15000;
    const remaining = available - allocated - reserved;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'All prioritized tasks fit in context';

    if (remaining < 20000) {
      status = 'warning';
      message = 'Context budget tight - consider deferring low-priority tasks';
    }
    if (remaining < 10000) {
      status = 'critical';
      message = 'Context budget exceeded - must defer some tasks';
    }

    return {
      available,
      allocated,
      reserved,
      remaining,
      status,
      message
    };
  }

  /**
   * Get three-tier status
   */
  private async getThreeTierStatus(): Promise<ThreeTierStatus> {
    // TODO: Integrate with ThreeTierStatusTracker
    return {
      backend: {
        progress: 80,
        completed: 4,
        total: 5,
        next: 'Finalize Oliver-MCP API routes',
        recommendation: 'Add error handling for edge cases'
      },
      database: {
        progress: 100,
        status: 'All migrations applied, RLS policies active',
        recommendation: 'Consider adding indexes for MCP queries'
      },
      frontend: {
        progress: 60,
        completed: 3,
        total: 5,
        next: 'Create MCP selection dropdown component',
        recommendation: 'Implement loading states for async operations'
      }
    };
  }

  /**
   * Get quick stats
   */
  private async getQuickStats(): Promise<QuickStats> {
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
  formatAsText(data: SessionCompassData): string {
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

  ${c.green}HIGH PRIORITY (Do First):${c.reset}
`;

    for (const task of data.taskPriority.high) {
      const parallel = task.canParallel ? 'Yes' : task.dependsOn.length > 0 ? `NO (depends on #${task.dependsOn.join(', #')})` : 'Yes';
      output += `  ${task.id}. [P1] ${task.description} (${task.assignedAgent})\n`;
      output += `     → Parallel OK: ${parallel}\n`;
      output += `     → Context needed: ~${task.contextNeeded.toLocaleString()} tokens\n`;
      output += `     → ETA: ${task.eta}\n\n`;
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
  private createProgressBar(percent: number): string {
    const filled = Math.round((percent / 100) * 10);
    const empty = 10 - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  }

  /**
   * Format overview as JSON
   */
  formatAsJSON(data: SessionCompassData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Format overview as markdown
   */
  formatAsMarkdown(data: SessionCompassData): string {
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
