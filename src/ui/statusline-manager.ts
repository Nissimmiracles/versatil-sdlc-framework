/**
 * VERSATIL SDLC Framework - Real-Time Statusline Manager
 *
 * Sprint 1 Day 7: Real-time statusline for live agent visibility
 *
 * Features:
 * - Progress bars with emoji indicators
 * - Multi-agent display (shows +N more)
 * - RAG indicator (🧠 + retrieval count)
 * - MCP indicator (🔧 + tool names)
 * - Activity descriptions
 * - Performance metrics
 */

import { EventEmitter } from 'events';

export interface AgentProgress {
  agentId: string;
  activity: string;
  progress: number; // 0-100
  startTime: number;
  ragRetrievals?: number;
  mcpTools?: string[];
  status: 'idle' | 'active' | 'completed' | 'error';
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
