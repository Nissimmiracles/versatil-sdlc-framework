/**
 * VERSATIL SDLC Framework - Agent Monitor
 * Monitors agent activations, failures, and health
 *
 * Integrates with:
 * - AgentRegistry (src/agents/core/agent-registry.ts)
 * - post-file-edit.ts hook (agent activation failures)
 * - Guardian logger
 *
 * Auto-Remediation Scenarios:
 * 1. Agent not found → Validate agent definition
 * 2. Agent activation failure → Rebuild framework
 * 3. Agent hook failure → Reload hooks
 * 4. Agent timeout → Increase timeout limits
 * 5. Agent missing dependencies → Install dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GuardianLogger } from './guardian-logger.js';

const execAsync = promisify(exec);

export interface AgentActivation {
  agent: string;
  timestamp: string;
  success: boolean;
  duration_ms: number;
  error?: string;
  triggered_by?: string; // File pattern that triggered activation
  context?: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
}

export interface AgentHealth {
  agent: string;
  healthy: boolean;
  activation_count: number;
  failure_count: number;
  success_rate: number;
  avg_duration_ms: number;
  last_activation?: string;
  last_failure?: string;
  issues: string[];
}

export interface AgentMonitorReport {
  overall_health: number; // 0-100
  status: 'healthy' | 'degraded' | 'critical';
  total_agents: number;
  healthy_agents: number;
  degraded_agents: string[];
  failed_agents: string[];
  activations_24h: number;
  failures_24h: number;
  agents: Record<string, AgentHealth>;
  issues: AgentIssue[];
  recommendations: string[];
  timestamp: string;
}

export interface AgentIssue {
  agent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_fix: string;
  confidence: number; // 0-100
  auto_fixable: boolean;
}

export interface AgentRemediationResult {
  success: boolean;
  action_taken: string;
  confidence: number;
  duration_ms: number;
  learned: string; // Pattern to store in RAG
}

/**
 * Agent Monitor - Tracks agent health and performance
 */
export class AgentMonitor {
  private static instance: AgentMonitor | null = null;
  private logger: GuardianLogger;
  private activationHistory: AgentActivation[] = [];
  private historyFile: string;
  private maxHistorySize = 1000;

  // OPERA agents to monitor
  private readonly coreAgents = [
    'maria-qa',
    'james-frontend',
    'marcus-backend',
    'dana-database',
    'alex-ba',
    'sarah-pm',
    'dr-ai-ml',
    'oliver-mcp',
    'iris-guardian'
  ];

  private readonly subAgents = [
    'react-frontend',
    'vue-frontend',
    'nextjs-frontend',
    'angular-frontend',
    'svelte-frontend',
    'nodejs-backend',
    'python-backend',
    'rails-backend',
    'go-backend',
    'java-backend'
  ];

  private constructor() {
    this.logger = GuardianLogger.getInstance();
    const versatilHome = path.join(os.homedir(), '.versatil');
    this.historyFile = path.join(versatilHome, 'logs', 'guardian', 'agents', 'activation-history.jsonl');
    this.loadActivationHistory();
  }

  public static getInstance(): AgentMonitor {
    if (!AgentMonitor.instance) {
      AgentMonitor.instance = new AgentMonitor();
    }
    return AgentMonitor.instance;
  }

  /**
   * Track agent activation
   */
  public async trackAgentActivation(
    agent: string,
    success: boolean,
    duration_ms: number,
    error?: string,
    triggered_by?: string,
    context?: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT'
  ): Promise<void> {
    const activation: AgentActivation = {
      agent,
      timestamp: new Date().toISOString(),
      success,
      duration_ms,
      error,
      triggered_by,
      context
    };

    this.activationHistory.push(activation);

    // Keep history size manageable
    if (this.activationHistory.length > this.maxHistorySize) {
      this.activationHistory = this.activationHistory.slice(-this.maxHistorySize);
    }

    // Persist to file
    await this.persistActivation(activation);

    // Log to Guardian
    this.logger.logAgentActivation({
      agent,
      success,
      duration_ms,
      triggered_by: triggered_by || 'manual',
      context: context || 'PROJECT_CONTEXT'
    });

    // Check if we need to remediate
    if (!success && error) {
      const shouldAutoFix = await this.shouldAutoRemediate(agent, error);
      if (shouldAutoFix) {
        await this.remediateAgentFailure(agent, error);
      }
    }
  }

  /**
   * Perform health check on all agents
   */
  public async performHealthCheck(): Promise<AgentMonitorReport> {
    const startTime = Date.now();

    // Calculate health metrics for each agent
    const agentHealthMap: Record<string, AgentHealth> = {};

    // Include predefined agents AND any agents from activation history
    const agentsFromHistory = [...new Set(this.activationHistory.map(a => a.agent))];
    const allAgents = [...new Set([...this.coreAgents, ...this.subAgents, ...agentsFromHistory])];

    for (const agentName of allAgents) {
      agentHealthMap[agentName] = this.calculateAgentHealth(agentName);
    }

    // Count healthy/degraded/failed agents
    const healthyAgents: string[] = [];
    const degradedAgents: string[] = [];
    const failedAgents: string[] = [];

    Object.entries(agentHealthMap).forEach(([agent, health]) => {
      if (health.success_rate >= 95 && health.healthy) {
        healthyAgents.push(agent);
      } else if (health.success_rate >= 80 || health.failure_count === 0) {
        degradedAgents.push(agent);
      } else {
        failedAgents.push(agent);
      }
    });

    // Calculate 24h metrics
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const recent = this.activationHistory.filter(a => new Date(a.timestamp).getTime() > oneDayAgo);
    const activations_24h = recent.length;
    const failures_24h = recent.filter(a => !a.success).length;

    // Identify issues
    const issues: AgentIssue[] = [];

    // Issue 1: Agents with low success rates
    Object.entries(agentHealthMap).forEach(([agent, health]) => {
      if (health.success_rate < 80 && health.activation_count > 5) {
        issues.push({
          agent,
          severity: health.success_rate < 50 ? 'critical' : 'high',
          description: `Low success rate: ${health.success_rate.toFixed(1)}%`,
          suggested_fix: 'Run npm run build to rebuild framework',
          confidence: 85,
          auto_fixable: true
        });
      }
    });

    // Issue 2: Agents that haven't activated recently (framework context only)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    this.coreAgents.forEach(agent => {
      const health = agentHealthMap[agent];
      if (!health.last_activation || new Date(health.last_activation).getTime() < sevenDaysAgo) {
        issues.push({
          agent,
          severity: 'low',
          description: 'Agent not activated in 7+ days',
          suggested_fix: 'Verify agent definition and triggers',
          confidence: 60,
          auto_fixable: false
        });
      }
    });

    // Issue 3: Agents with high average duration
    Object.entries(agentHealthMap).forEach(([agent, health]) => {
      if (health.avg_duration_ms > 30000 && health.activation_count > 3) {
        issues.push({
          agent,
          severity: 'medium',
          description: `Slow performance: ${(health.avg_duration_ms / 1000).toFixed(1)}s average`,
          suggested_fix: 'Review agent complexity and optimize',
          confidence: 70,
          auto_fixable: false
        });
      }
    });

    // Calculate overall health
    const healthyCount = healthyAgents.length;
    const totalCount = allAgents.length;
    const overall_health = Math.round((healthyCount / totalCount) * 100);

    let status: 'healthy' | 'degraded' | 'critical';
    if (overall_health >= 90) {
      status = 'healthy';
    } else if (overall_health >= 70) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (failedAgents.length > 0) {
      recommendations.push(`🔴 ${failedAgents.length} agent(s) failing: ${failedAgents.join(', ')} - Run /guardian auto-fix`);
    }

    if (degradedAgents.length > 3) {
      recommendations.push(`⚠️  ${degradedAgents.length} agent(s) degraded - Consider reviewing agent definitions`);
    }

    if (failures_24h > 10) {
      recommendations.push(`⚠️  ${failures_24h} failures in last 24h - Check framework build status`);
    }

    const report: AgentMonitorReport = {
      overall_health,
      status,
      total_agents: totalCount,
      healthy_agents: healthyCount,
      degraded_agents: degradedAgents,
      failed_agents: failedAgents,
      activations_24h,
      failures_24h,
      agents: agentHealthMap,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };

    // Log health check
    this.logger.logHealthCheck({
      overall_health,
      status,
      components: { agents: agentHealthMap },
      issues: issues.map(i => ({ agent: i.agent, severity: i.severity, description: i.description })),
      duration_ms: Date.now() - startTime
    });

    return report;
  }

  /**
   * Calculate health metrics for a specific agent
   */
  private calculateAgentHealth(agent: string): AgentHealth {
    const agentActivations = this.activationHistory.filter(a => a.agent === agent);

    if (agentActivations.length === 0) {
      return {
        agent,
        healthy: true, // No activations = no failures
        activation_count: 0,
        failure_count: 0,
        success_rate: 100,
        avg_duration_ms: 0,
        issues: ['No activation history']
      };
    }

    const activation_count = agentActivations.length;
    const failure_count = agentActivations.filter(a => !a.success).length;
    const success_rate = ((activation_count - failure_count) / activation_count) * 100;

    const total_duration = agentActivations.reduce((sum, a) => sum + a.duration_ms, 0);
    const avg_duration_ms = Math.round(total_duration / activation_count);

    const last_activation = agentActivations[agentActivations.length - 1]?.timestamp;
    const last_failure = agentActivations.filter(a => !a.success).slice(-1)[0]?.timestamp;

    const issues: string[] = [];
    if (success_rate < 80) {
      issues.push(`Low success rate: ${success_rate.toFixed(1)}%`);
    }
    if (avg_duration_ms > 30000) {
      issues.push(`Slow average duration: ${(avg_duration_ms / 1000).toFixed(1)}s`);
    }
    if (failure_count > 5) {
      issues.push(`High failure count: ${failure_count}`);
    }

    const healthy = success_rate >= 80 && avg_duration_ms < 30000;

    return {
      agent,
      healthy,
      activation_count,
      failure_count,
      success_rate,
      avg_duration_ms,
      last_activation,
      last_failure,
      issues
    };
  }

  /**
   * Determine if we should auto-remediate
   */
  private async shouldAutoRemediate(agent: string, error: string): Promise<boolean> {
    // Check failure frequency
    const recentFailures = this.activationHistory
      .filter(a => a.agent === agent && !a.success)
      .slice(-5); // Last 5 activations

    // Auto-remediate if 3+ failures in last 5 attempts
    if (recentFailures.length >= 3) {
      return true;
    }

    // Auto-remediate critical errors immediately
    const criticalErrors = [
      'Agent not found',
      'Agent definition invalid',
      'Module not found',
      'Cannot find module'
    ];

    if (criticalErrors.some(e => error.includes(e))) {
      return true;
    }

    return false;
  }

  /**
   * Remediate agent failure
   */
  public async remediateAgentFailure(agent: string, error: string): Promise<AgentRemediationResult> {
    const startTime = Date.now();
    let success = false;
    let action_taken = '';
    let confidence = 0;
    let learned = '';

    try {
      // Scenario 1: Agent not found → Validate agent definition exists
      if (error.includes('Agent not found') || error.includes('not registered')) {
        action_taken = 'Validating agent definition';
        confidence = 90;

        const agentFile = path.join(process.cwd(), '.claude', 'agents', `${agent}.md`);
        if (!fs.existsSync(agentFile)) {
          learned = `Agent definition missing for ${agent} - needs to be created`;
          success = false;
        } else {
          // Validate YAML frontmatter
          const content = fs.readFileSync(agentFile, 'utf-8');
          if (!content.includes('name:') || !content.includes('role:')) {
            learned = `Agent definition invalid for ${agent} - missing required fields`;
            success = false;
          } else {
            learned = `Agent definition valid for ${agent} - issue may be in registry`;
            success = true;
          }
        }
      }

      // Scenario 2: Agent activation failure → Rebuild framework
      else if (error.includes('activation failed') || error.includes('Cannot find module')) {
        action_taken = 'Rebuilding framework (npm run build)';
        confidence = 95;

        try {
          await execAsync('npm run build', { cwd: process.cwd() });
          learned = `Framework rebuild successful after ${agent} activation failure`;
          success = true;
        } catch (buildError: any) {
          learned = `Framework rebuild failed: ${buildError.message}`;
          success = false;
        }
      }

      // Scenario 3: Agent hook failure → Reload hooks
      else if (error.includes('hook') || error.includes('post-file-edit')) {
        action_taken = 'Reloading lifecycle hooks';
        confidence = 85;

        // In Claude SDK, hooks are loaded at startup
        // Best we can do is validate hook files exist
        const hooksDir = path.join(process.cwd(), '.claude', 'hooks', 'dist');
        const hookFiles = ['before-prompt.cjs', 'post-file-edit.cjs', 'session-codify.cjs'];

        const missingHooks = hookFiles.filter(f => !fs.existsSync(path.join(hooksDir, f)));

        if (missingHooks.length > 0) {
          learned = `Missing hook files: ${missingHooks.join(', ')} - need to rebuild hooks`;
          success = false;
        } else {
          learned = `All hook files present - agent ${agent} may need hook configuration update`;
          success = true;
        }
      }

      // Scenario 4: Agent timeout → Increase timeout (config change)
      else if (error.includes('timeout') || error.includes('ETIMEDOUT')) {
        action_taken = 'Agent timeout detected - recommend increasing timeout limits';
        confidence = 75;
        learned = `Agent ${agent} timing out - may need performance optimization or longer timeout`;
        success = false; // Can't auto-fix, requires config change
      }

      // Scenario 5: Agent missing dependencies → Install dependencies
      else if (error.includes('dependencies') || error.includes('npm ERR!')) {
        action_taken = 'Installing missing dependencies (npm install)';
        confidence = 90;

        try {
          await execAsync('npm install', { cwd: process.cwd() });
          learned = `Dependencies installed successfully after ${agent} dependency error`;
          success = true;
        } catch (installError: any) {
          learned = `Dependency installation failed: ${installError.message}`;
          success = false;
        }
      }

      // Unknown error
      else {
        action_taken = 'Unknown error - manual investigation required';
        confidence = 30;
        learned = `Unknown agent failure for ${agent}: ${error}`;
        success = false;
      }

      // Log remediation attempt
      this.logger.logRemediation({
        issue: `Agent ${agent} failure: ${error}`,
        action_taken,
        success,
        confidence,
        before_state: `Agent ${agent} failing`,
        after_state: success ? `Agent ${agent} fixed` : `Agent ${agent} still failing`,
        duration_ms: Date.now() - startTime,
        learned: success
      });

      return {
        success,
        action_taken,
        confidence,
        duration_ms: Date.now() - startTime,
        learned
      };

    } catch (remediationError: any) {
      this.logger.logRemediation({
        issue: `Agent ${agent} failure: ${error}`,
        action_taken: 'Remediation attempt failed',
        success: false,
        confidence: 0,
        before_state: `Agent ${agent} failing`,
        after_state: `Remediation failed: ${remediationError.message}`,
        duration_ms: Date.now() - startTime,
        learned: false
      });

      return {
        success: false,
        action_taken: 'Remediation failed',
        confidence: 0,
        duration_ms: Date.now() - startTime,
        learned: `Remediation error: ${remediationError.message}`
      };
    }
  }

  /**
   * Check if agent definition is valid
   */
  public async validateAgentDefinition(agent: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const agentFile = path.join(process.cwd(), '.claude', 'agents', `${agent}.md`);

    // Check 1: File exists
    if (!fs.existsSync(agentFile)) {
      issues.push('Agent definition file not found');
      return { valid: false, issues };
    }

    // Check 2: Valid YAML frontmatter
    const content = fs.readFileSync(agentFile, 'utf-8');

    const requiredFields = ['name:', 'role:', 'tools:', 'skills:'];
    requiredFields.forEach(field => {
      if (!content.includes(field)) {
        issues.push(`Missing required field: ${field}`);
      }
    });

    // Check 3: Valid tools
    const toolsMatch = content.match(/tools:\s*\n([\s\S]*?)(?=\n[a-z_]+:|\n---|\n$)/);
    if (!toolsMatch) {
      issues.push('Invalid tools section');
    }

    // Check 4: Valid skills
    const skillsMatch = content.match(/skills:\s*\n([\s\S]*?)(?=\n[a-z_]+:|\n---|\n$)/);
    if (!skillsMatch) {
      issues.push('Invalid skills section');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get agent activation statistics
   */
  public getAgentStats(agent: string): {
    total_activations: number;
    success_count: number;
    failure_count: number;
    success_rate: number;
    avg_duration_ms: number;
    last_24h_activations: number;
  } {
    const agentActivations = this.activationHistory.filter(a => a.agent === agent);

    const total_activations = agentActivations.length;
    const success_count = agentActivations.filter(a => a.success).length;
    const failure_count = total_activations - success_count;
    const success_rate = total_activations > 0 ? (success_count / total_activations) * 100 : 0;

    const total_duration = agentActivations.reduce((sum, a) => sum + a.duration_ms, 0);
    const avg_duration_ms = total_activations > 0 ? Math.round(total_duration / total_activations) : 0;

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const last_24h_activations = agentActivations.filter(
      a => new Date(a.timestamp).getTime() > oneDayAgo
    ).length;

    return {
      total_activations,
      success_count,
      failure_count,
      success_rate,
      avg_duration_ms,
      last_24h_activations
    };
  }

  /**
   * Load activation history from file
   */
  private loadActivationHistory(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const lines = fs.readFileSync(this.historyFile, 'utf-8').trim().split('\n');
        this.activationHistory = lines
          .filter(line => line.trim())
          .map(line => JSON.parse(line))
          .slice(-this.maxHistorySize); // Keep most recent
      }
    } catch (error) {
      // If history file is corrupted, start fresh
      this.activationHistory = [];
    }
  }

  /**
   * Persist activation to file (JSONL format)
   */
  private async persistActivation(activation: AgentActivation): Promise<void> {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(this.historyFile, JSON.stringify(activation) + '\n');
    } catch (error) {
      // Silent fail - don't break agent activation
      console.error('Failed to persist activation:', error);
    }
  }

  /**
   * Clear activation history (maintenance)
   */
  public clearHistory(): void {
    this.activationHistory = [];
    if (fs.existsSync(this.historyFile)) {
      fs.unlinkSync(this.historyFile);
    }
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    if (AgentMonitor.instance) {
      AgentMonitor.instance.activationHistory = [];
      AgentMonitor.instance = null;
    }
  }

  /**
   * Get recent failures for specific agent
   */
  public getRecentFailures(agent: string, limit = 10): AgentActivation[] {
    return this.activationHistory
      .filter(a => a.agent === agent && !a.success)
      .slice(-limit);
  }
}

/**
 * Singleton instance
 */
export const agentMonitor = AgentMonitor.getInstance();
