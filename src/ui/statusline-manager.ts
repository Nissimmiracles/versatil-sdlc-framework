/**
 * VERSATIL SDLC Framework - Real-Time Statusline Manager
 *
 * Sprint 1 Day 7: Real-time statusline for live agent visibility
 * v6.1.0: Enhanced with hierarchical task tracking
 *
 * Features:
 * - Progress bars with emoji indicators
 * - Multi-agent display (shows +N more)
 * - RAG indicator (🧠 + retrieval count)
 * - MCP indicator (🔧 + tool names)
 * - Activity descriptions
 * - Performance metrics
 * - **NEW: Multi-level task hierarchy display**
 * - **NEW: Subagent task tracking**
 * - **NEW: Plan progress visualization**
 * - **NEW: Timeline view**
 */

import { EventEmitter } from 'events';
import type { TaskPlan, Task, PlanStatusSnapshot } from '../planning/task-plan-manager.js';

export interface AgentProgress {
  agentId: string;
  activity: string;
  progress: number; // 0-100
  startTime: number;
  ragRetrievals?: number;
  mcpTools?: string[];
  status: 'idle' | 'active' | 'completed' | 'error';

  // NEW: Task hierarchy tracking
  taskId?: string; // Associated task ID
  parentTaskId?: string; // Parent task (for subagents)
  subtasks?: SubtaskProgress[]; // Child subtasks
  isSubagent?: boolean; // Whether this is a subagent task
}

export interface SubtaskProgress {
  id: string;
  description: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
}

export interface StatuslineOptions {
  maxWidth?: number; // Max width in characters (default: 120)
  maxAgents?: number; // Max agents to show (default: 3)
  showRAG?: boolean; // Show RAG indicators (default: true)
  showMCP?: boolean; // Show MCP indicators (default: true)
  showProgress?: boolean; // Show progress bars (default: true)
  refreshRate?: number; // ms between updates (default: 100ms)
}

export class StatuslineManager extends EventEmitter {
  private activeAgents: Map<string, AgentProgress> = new Map();
  private options: Required<StatuslineOptions>;
  private lastRender: string = '';
  private renderInterval: NodeJS.Timeout | null = null;

  constructor(options: StatuslineOptions = {}) {
    super();

    this.options = {
      maxWidth: options.maxWidth ?? 120,
      maxAgents: options.maxAgents ?? 3,
      showRAG: options.showRAG ?? true,
      showMCP: options.showMCP ?? true,
      showProgress: options.showProgress ?? true,
      refreshRate: options.refreshRate ?? 100
    };
  }

  /**
   * Start tracking an agent's progress
   */
  public startAgent(agentId: string, activity: string): void {
    this.activeAgents.set(agentId, {
      agentId,
      activity,
      progress: 0,
      startTime: Date.now(),
      ragRetrievals: 0,
      mcpTools: [],
      status: 'active'
    });

    this.emit('agent:started', agentId);
    this.render();
  }

  /**
   * Update agent progress
   */
  public updateProgress(agentId: string, progress: number, activity?: string): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    agent.progress = Math.min(100, Math.max(0, progress));
    if (activity) agent.activity = activity;

    this.emit('agent:progress', { agentId, progress });
    this.render();
  }

  /**
   * Add RAG retrieval indicator
   */
  public addRAGRetrieval(agentId: string, count: number = 1): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    agent.ragRetrievals = (agent.ragRetrievals || 0) + count;
    this.emit('agent:rag', { agentId, count: agent.ragRetrievals });
    this.render();
  }

  /**
   * Add MCP tool indicator
   */
  public addMCPTool(agentId: string, toolName: string): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    if (!agent.mcpTools) agent.mcpTools = [];
    if (!agent.mcpTools.includes(toolName)) {
      agent.mcpTools.push(toolName);
    }

    this.emit('agent:mcp', { agentId, tool: toolName });
    this.render();
  }

  /**
   * Mark agent as completed
   */
  public completeAgent(agentId: string): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    agent.progress = 100;
    agent.status = 'completed';
    agent.activity = 'Complete';

    this.emit('agent:completed', agentId);
    this.render();

    // Remove after 2 seconds
    setTimeout(() => {
      this.activeAgents.delete(agentId);
      this.render();
    }, 2000);
  }

  /**
   * Mark agent as error
   */
  public errorAgent(agentId: string, error: string): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    agent.status = 'error';
    agent.activity = `Error: ${error}`;

    this.emit('agent:error', { agentId, error });
    this.render();

    // Remove after 3 seconds
    setTimeout(() => {
      this.activeAgents.delete(agentId);
      this.render();
    }, 3000);
  }

  /**
   * Clear all agents
   */
  public clear(): void {
    this.activeAgents.clear();
    this.lastRender = '';
    this.render();
  }

  /**
   * Get current statusline as string
   */
  public getStatusline(): string {
    if (this.activeAgents.size === 0) {
      return ''; // No active agents
    }

    const agents = Array.from(this.activeAgents.values())
      .sort((a, b) => b.progress - a.progress) // Sort by progress desc
      .slice(0, this.options.maxAgents);

    const lines: string[] = [];

    for (const agent of agents) {
      lines.push(this.formatAgentLine(agent));
    }

    // Show "+N more" if there are hidden agents
    const hiddenCount = this.activeAgents.size - agents.length;
    if (hiddenCount > 0) {
      lines.push(`   ... and ${hiddenCount} more agent${hiddenCount > 1 ? 's' : ''}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a single agent line
   */
  private formatAgentLine(agent: AgentProgress): string {
    const parts: string[] = [];

    // Agent emoji + name
    const emoji = this.getAgentEmoji(agent);
    parts.push(`${emoji} ${agent.agentId}`);

    // Activity
    parts.push(this.truncate(agent.activity, 30));

    // Progress bar
    if (this.options.showProgress) {
      parts.push(this.renderProgressBar(agent.progress));
      parts.push(`${agent.progress}%`);
    }

    // RAG indicator
    if (this.options.showRAG && agent.ragRetrievals && agent.ragRetrievals > 0) {
      parts.push(`🧠 ${agent.ragRetrievals}`);
    }

    // MCP indicator
    if (this.options.showMCP && agent.mcpTools && agent.mcpTools.length > 0) {
      const tools = agent.mcpTools.slice(0, 2).join(', ');
      const more = agent.mcpTools.length > 2 ? ` +${agent.mcpTools.length - 2}` : '';
      parts.push(`🔧 ${tools}${more}`);
    }

    // Duration
    const duration = Math.floor((Date.now() - agent.startTime) / 1000);
    parts.push(`⏱️ ${duration}s`);

    return `   ${parts.join(' │ ')}`;
  }

  /**
   * Get emoji for agent status
   */
  private getAgentEmoji(agent: AgentProgress): string {
    switch (agent.status) {
      case 'active':
        return '🤖';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  }

  /**
   * Render progress bar
   */
  private renderProgressBar(progress: number, width: number = 10): string {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Truncate string to max length
   */
  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Render statusline (called internally on updates)
   */
  private render(): void {
    const newRender = this.getStatusline();

    // Only emit if changed
    if (newRender !== this.lastRender) {
      this.lastRender = newRender;
      this.emit('render', newRender);
    }
  }

  /**
   * Start auto-refresh interval
   */
  public startAutoRefresh(): void {
    if (this.renderInterval) return; // Already running

    this.renderInterval = setInterval(() => {
      this.render(); // Update durations
    }, this.options.refreshRate);
  }

  /**
   * Stop auto-refresh interval
   */
  public stopAutoRefresh(): void {
    if (this.renderInterval) {
      clearInterval(this.renderInterval);
      this.renderInterval = null;
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    activeAgents: number;
    completedAgents: number;
    totalRAGRetrievals: number;
    totalMCPCalls: number;
  } {
    const agents = Array.from(this.activeAgents.values());

    return {
      activeAgents: agents.filter(a => a.status === 'active').length,
      completedAgents: agents.filter(a => a.status === 'completed').length,
      totalRAGRetrievals: agents.reduce((sum, a) => sum + (a.ragRetrievals || 0), 0),
      totalMCPCalls: agents.reduce((sum, a) => sum + (a.mcpTools?.length || 0), 0)
    };
  }

  /**
   * Cleanup (call on shutdown)
   */
  public destroy(): void {
    this.stopAutoRefresh();
    this.activeAgents.clear();
    this.removeAllListeners();
  }

  // ==========================================================================
  // NEW v6.1.0: HIERARCHICAL TASK TRACKING
  // ==========================================================================

  /**
   * Track task hierarchy from a plan
   *
   * @param task - Task to track
   * @param parentAgentId - Parent agent ID (for subagents)
   */
  public trackTask(task: Task, parentAgentId?: string): void {
    const agentId = task.assignedAgent || 'unknown';

    // Start agent if not already tracking
    if (!this.activeAgents.has(agentId)) {
      this.startAgent(agentId, task.description);
    }

    const agent = this.activeAgents.get(agentId)!;

    // Update task hierarchy tracking
    agent.taskId = task.id;
    agent.parentTaskId = task.parentTaskId || parentAgentId;
    agent.isSubagent = task.isSubagentTask;
    agent.progress = task.progress;

    // Track subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      agent.subtasks = task.subtasks.map(st => ({
        id: st.id,
        description: st.description,
        progress: st.progress,
        status: st.status
      }));
    }

    this.render();
  }

  /**
   * Update task progress from plan
   */
  public updateTaskProgress(taskId: string, progress: number, status?: Task['status']): void {
    // Find agent tracking this task
    for (const [agentId, agent] of this.activeAgents.entries()) {
      if (agent.taskId === taskId) {
        agent.progress = progress;

        if (status === 'completed') {
          this.completeAgent(agentId);
        } else if (status === 'failed') {
          this.errorAgent(agentId, 'Task failed');
        }

        this.render();
        return;
      }

      // Check subtasks
      if (agent.subtasks) {
        const subtask = agent.subtasks.find(st => st.id === taskId);
        if (subtask) {
          subtask.progress = progress;
          if (status) subtask.status = status;
          this.render();
          return;
        }
      }
    }
  }

  /**
   * Render plan status as statusline
   *
   * @param planStatus - Plan status snapshot
   * @returns Formatted statusline string
   */
  public renderPlanStatus(planStatus: PlanStatusSnapshot): string {
    const { plan, activeTasks, completedTasks, blockedTasks, failedTasks, progress, estimatedTimeRemaining } = planStatus;

    const lines: string[] = [];

    // Header
    lines.push('┌─ 📋 ' + this.truncate(plan.rootTask, this.options.maxWidth - 10) + ' ' + '─'.repeat(Math.max(0, this.options.maxWidth - plan.rootTask.length - 10)) + '┐');

    // Overall progress
    const progressBar = this.renderProgressBar(progress, 20);
    lines.push(`│ Progress: ${progressBar} ${progress}% │ ${completedTasks.length}/${plan.tasks.length} tasks ${' '.repeat(Math.max(0, this.options.maxWidth - 60))}│`);
    lines.push('│' + ' '.repeat(this.options.maxWidth - 2) + '│');

    // Active tasks
    if (activeTasks.length > 0) {
      lines.push(`│ Active Tasks (${activeTasks.length}):${' '.repeat(Math.max(0, this.options.maxWidth - 20))}│`);

      for (const task of activeTasks.slice(0, 5)) {
        lines.push(this.formatPlanTask(task));
      }

      if (activeTasks.length > 5) {
        lines.push(`│    ... and ${activeTasks.length - 5} more active tasks${' '.repeat(Math.max(0, this.options.maxWidth - 35))}│`);
      }

      lines.push('│' + ' '.repeat(this.options.maxWidth - 2) + '│');
    }

    // Footer with stats
    const statsLine = `│ Completed: ${completedTasks.length} │ Blocked: ${blockedTasks.length} │ Failed: ${failedTasks.length} │ Est. remaining: ~${Math.round(estimatedTimeRemaining)}min `;
    lines.push(statsLine + ' '.repeat(Math.max(0, this.options.maxWidth - statsLine.length + 1)) + '│');
    lines.push('└' + '─'.repeat(this.options.maxWidth - 2) + '┘');

    return lines.join('\n');
  }

  /**
   * Format a task from a plan for display
   */
  private formatPlanTask(task: Task): string {
    const indent = '  '.repeat(Math.min(task.depth, 3)); // Max 3 levels of indentation
    const icon = this.getTaskStatusIcon(task.status);
    const subagentMarker = task.isSubagentTask ? '↳ ' : '';
    const agent = task.assignedAgent ? `[${task.assignedAgent}]` : '';

    const description = this.truncate(task.description, 40);
    const progressBar = this.renderProgressBar(task.progress, 10);
    const progress = `${task.progress}%`;

    const line = `│ ${indent}${subagentMarker}${description.padEnd(42)} ${agent.padEnd(18)} │ ${progressBar} ${progress.padStart(4)} `;

    return line + ' '.repeat(Math.max(0, this.options.maxWidth - line.length + 1)) + '│';
  }

  /**
   * Get icon for task status
   */
  private getTaskStatusIcon(status: Task['status']): string {
    const icons = {
      'pending': '⏳',
      'in_progress': '🔄',
      'completed': '✅',
      'failed': '❌',
      'blocked': '🚫'
    };
    return icons[status];
  }

  /**
   * Render enhanced statusline with task hierarchy
   *
   * Includes:
   * - Main agent tasks
   * - Subagent tasks (indented)
   * - Timeline view
   * - Collaboration graph
   */
  public getEnhancedStatusline(): string {
    if (this.activeAgents.size === 0) {
      return ''; // No active agents
    }

    const lines: string[] = [];

    // Separate main agents and subagents
    const mainAgents = Array.from(this.activeAgents.values())
      .filter(a => !a.isSubagent)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, this.options.maxAgents);

    // Render main agents with their subtasks
    for (const agent of mainAgents) {
      lines.push(this.formatAgentLine(agent));

      // Render subtasks
      if (agent.subtasks && agent.subtasks.length > 0) {
        const activeSubtasks = agent.subtasks
          .filter(st => st.status === 'in_progress' || st.status === 'pending')
          .slice(0, 3);

        for (const subtask of activeSubtasks) {
          lines.push(this.formatSubtaskLine(subtask));
        }

        if (agent.subtasks.length > 3) {
          const completedCount = agent.subtasks.filter(st => st.status === 'completed').length;
          lines.push(`      └─ ${completedCount}/${agent.subtasks.length} subtasks completed`);
        }
      }
    }

    // Show "+N more" if there are hidden agents
    const hiddenCount = this.activeAgents.size - mainAgents.length;
    if (hiddenCount > 0) {
      lines.push(`   ... and ${hiddenCount} more agent${hiddenCount > 1 ? 's' : ''}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a subtask line (indented)
   */
  private formatSubtaskLine(subtask: SubtaskProgress): string {
    const icon = this.getTaskStatusIcon(subtask.status);
    const description = this.truncate(subtask.description, 50);
    const progressBar = this.renderProgressBar(subtask.progress, 10);

    return `      ↳ ${icon} ${description} │ ${progressBar} ${subtask.progress}%`;
  }

  /**
   * Render timeline view (last N activities)
   */
  public renderTimeline(maxEvents: number = 10): string {
    const agents = Array.from(this.activeAgents.values())
      .sort((a, b) => a.startTime - b.startTime);

    if (agents.length === 0) {
      return 'No activity';
    }

    const lines: string[] = [];
    lines.push('Timeline (Recent Activity):');
    lines.push('');

    const startTime = agents[0].startTime;

    for (const agent of agents.slice(-maxEvents)) {
      const elapsed = Math.floor((agent.startTime - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const icon = this.getAgentEmoji(agent);
      const status = agent.status === 'completed' ? '✅' : agent.status === 'error' ? '❌' : '🔄';

      lines.push(`${timestamp} ──${status}── ${icon} ${agent.agentId}: ${this.truncate(agent.activity, 50)}`);
    }

    // Add current progress indicator
    const currentMinutes = Math.floor((Date.now() - startTime) / 60000);
    lines.push('');
    lines.push(`Current: ${currentMinutes} min elapsed │ ${this.activeAgents.size} agents active`);

    return lines.join('\n');
  }

  /**
   * Render collaboration graph (ASCII art)
   */
  public renderCollaborationGraph(): string {
    const agents = Array.from(this.activeAgents.values());

    if (agents.length === 0) {
      return 'No active collaboration';
    }

    const lines: string[] = [];
    lines.push('Agent Collaboration:');
    lines.push('');

    // Group by parent-child relationships
    const roots = agents.filter(a => !a.parentTaskId && !a.isSubagent);
    const children = agents.filter(a => a.parentTaskId || a.isSubagent);

    for (const root of roots) {
      const icon = this.getAgentEmoji(root);
      lines.push(`${icon} ${root.agentId} (${root.progress}%)`);

      // Find children
      const rootChildren = children.filter(c => c.parentTaskId === root.taskId);

      for (const child of rootChildren) {
        const childIcon = this.getAgentEmoji(child);
        lines.push(`   └─> ${childIcon} ${child.agentId} (${child.progress}%)`);
      }
    }

    // Add stats
    lines.push('');
    const blocked = agents.filter(a => a.status === 'error' || (a.subtasks && a.subtasks.some(st => st.status === 'blocked')));
    lines.push(`Active handoffs: ${children.length} │ Blocked: ${blocked.length}`);

    return lines.join('\n');
  }
}

/**
 * Singleton instance for global access
 */
let globalStatusline: StatuslineManager | null = null;

export function getGlobalStatusline(): StatuslineManager {
  if (!globalStatusline) {
    globalStatusline = new StatuslineManager();
    globalStatusline.startAutoRefresh();
  }
  return globalStatusline;
}

export function setGlobalStatusline(manager: StatuslineManager): void {
  if (globalStatusline) {
    globalStatusline.destroy();
  }
  globalStatusline = manager;
}
