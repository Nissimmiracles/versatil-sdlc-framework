/**
 * VERSATIL SDLC Framework - Project Vision Manager
 *
 * Manages project vision, market context, goals, and history persistently
 * Part of Layer 2 (Project Context) in three-layer context enrichment system
 *
 * Storage: ~/.versatil/projects/[project-id]/
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ==================== INTERFACES ====================

export interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
  differentiators?: string[];
}

export interface UserPersona {
  name: string;
  role: string;
  needs: string[];
  painPoints: string[];
  goals: string[];
}

export interface Goal {
  id: string;
  description: string;
  timeframe: '1-month' | '3-months' | '6-months' | '1-year' | '3-years';
  metrics: Metric[];
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  progress: number; // 0-100
}

export interface Metric {
  name: string;
  current: number;
  target: number;
  unit: string;
}

export interface MarketAnalysis {
  size: string;
  opportunity: string;
  trends: string[];
  timing: string;
  competitiveLandscape: string;
}

export interface ProjectVision {
  mission: string;
  northStar: string;
  marketOpportunity: string;
  targetMarket: string;
  competitors: Competitor[];
  targetUsers: UserPersona[];
  goals: Goal[];
  values: string[];
  strategicPriorities: string[];
  productPhilosophy: string[];
  scope: {
    inScope: string[];
    outOfScope: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface ProjectEvent {
  id: string;
  timestamp: number;
  type: 'feature_added' | 'decision_made' | 'milestone_reached' | 'refactor_completed' | 'architecture_changed' | 'dependency_added' | 'bug_fixed';
  description: string;
  impact: string;
  agent: string;
  metadata?: Record<string, any>;
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: number;
  completedDate?: number;
  status: 'planned' | 'in-progress' | 'completed' | 'missed';
  successCriteria: string[];
  dependencies: string[];
}

export interface Decision {
  id: string;
  timestamp: number;
  decision: string;
  rationale: string;
  alternatives: string[];
  consequences: string[];
  decidedBy: string; // agent or user
}

export interface ProjectHistory {
  events: ProjectEvent[];
  milestones: Milestone[];
  decisions: Decision[];
}

// ==================== PROJECT VISION MANAGER ====================

export class ProjectVisionManager extends EventEmitter {
  private versatilHome: string;
  private projectsPath: string;

  constructor() {
    super();
    this.versatilHome = join(homedir(), '.versatil');
    this.projectsPath = join(this.versatilHome, 'projects');
  }

  /**
   * Initialize project vision storage directory
   */
  private async ensureProjectDir(projectId: string): Promise<string> {
    const projectDir = join(this.projectsPath, projectId);
    await fs.mkdir(projectDir, { recursive: true });
    return projectDir;
  }

  /**
   * Store project vision
   */
  async storeVision(projectId: string, vision: Partial<ProjectVision>): Promise<void> {
    try {
      const projectDir = await this.ensureProjectDir(projectId);
      const visionPath = join(projectDir, 'vision.json');

      // Load existing vision or create new
      let existingVision: ProjectVision | null = null;
      try {
        const data = await fs.readFile(visionPath, 'utf-8');
        existingVision = JSON.parse(data);
      } catch {
        // File doesn't exist, create new
      }

      const now = Date.now();
      const updatedVision: ProjectVision = {
        ...(existingVision || this.getDefaultVision()),
        ...vision,
        createdAt: existingVision?.createdAt || now,
        updatedAt: now
      };

      await fs.writeFile(visionPath, JSON.stringify(updatedVision, null, 2));

      this.emit('vision_stored', { projectId, vision: updatedVision });
      console.log(`✅ Project vision stored for ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to store vision for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get project vision
   */
  async getVision(projectId: string): Promise<ProjectVision | null> {
    try {
      const projectDir = join(this.projectsPath, projectId);
      const visionPath = join(projectDir, 'vision.json');

      const data = await fs.readFile(visionPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Update market context
   */
  async updateMarketContext(projectId: string, market: MarketAnalysis): Promise<void> {
    try {
      const projectDir = await this.ensureProjectDir(projectId);
      const marketPath = join(projectDir, 'market-context.json');

      const marketContext = {
        ...market,
        updatedAt: Date.now()
      };

      await fs.writeFile(marketPath, JSON.stringify(marketContext, null, 2));

      this.emit('market_updated', { projectId, market: marketContext });
      console.log(`✅ Market context updated for ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to update market context for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get market context
   */
  async getMarketContext(projectId: string): Promise<MarketAnalysis | null> {
    try {
      const marketPath = join(this.projectsPath, projectId, 'market-context.json');
      const data = await fs.readFile(marketPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Track project event (append to history timeline)
   */
  async trackEvent(projectId: string, event: Omit<ProjectEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const projectDir = await this.ensureProjectDir(projectId);
      const historyPath = join(projectDir, 'history.jsonl');

      const fullEvent: ProjectEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...event
      };

      // Append to JSONL file (one event per line)
      const line = JSON.stringify(fullEvent) + '\n';
      await fs.appendFile(historyPath, line, 'utf-8');

      this.emit('event_tracked', { projectId, event: fullEvent });
    } catch (error) {
      console.error(`❌ Failed to track event for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Track milestone
   */
  async trackMilestone(projectId: string, milestone: Milestone): Promise<void> {
    try {
      const projectDir = await this.ensureProjectDir(projectId);
      const milestonesPath = join(projectDir, 'milestones.json');

      // Load existing milestones
      let milestones: Milestone[] = [];
      try {
        const data = await fs.readFile(milestonesPath, 'utf-8');
        milestones = JSON.parse(data);
      } catch {
        // File doesn't exist
      }

      // Update or add milestone
      const existingIndex = milestones.findIndex(m => m.id === milestone.id);
      if (existingIndex >= 0) {
        milestones[existingIndex] = milestone;
      } else {
        milestones.push(milestone);
      }

      await fs.writeFile(milestonesPath, JSON.stringify(milestones, null, 2));

      this.emit('milestone_tracked', { projectId, milestone });
      console.log(`✅ Milestone tracked for ${projectId}: ${milestone.name}`);
    } catch (error) {
      console.error(`❌ Failed to track milestone for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Store decision
   */
  async storeDecision(projectId: string, decision: Omit<Decision, 'id' | 'timestamp'>): Promise<void> {
    try {
      const projectDir = await this.ensureProjectDir(projectId);
      const decisionsPath = join(projectDir, 'decisions.jsonl');

      const fullDecision: Decision = {
        id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...decision
      };

      // Append to JSONL file
      const line = JSON.stringify(fullDecision) + '\n';
      await fs.appendFile(decisionsPath, line, 'utf-8');

      this.emit('decision_stored', { projectId, decision: fullDecision });
    } catch (error) {
      console.error(`❌ Failed to store decision for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get project history (events, milestones, decisions)
   */
  async getProjectHistory(projectId: string, limit?: number): Promise<ProjectHistory> {
    try {
      const projectDir = join(this.projectsPath, projectId);

      // Load events from JSONL
      const events: ProjectEvent[] = [];
      try {
        const historyData = await fs.readFile(join(projectDir, 'history.jsonl'), 'utf-8');
        const lines = historyData.trim().split('\n');
        for (const line of lines) {
          if (line) events.push(JSON.parse(line));
        }
      } catch {
        // No history file
      }

      // Load milestones
      let milestones: Milestone[] = [];
      try {
        const milestonesData = await fs.readFile(join(projectDir, 'milestones.json'), 'utf-8');
        milestones = JSON.parse(milestonesData);
      } catch {
        // No milestones file
      }

      // Load decisions from JSONL
      const decisions: Decision[] = [];
      try {
        const decisionsData = await fs.readFile(join(projectDir, 'decisions.jsonl'), 'utf-8');
        const lines = decisionsData.trim().split('\n');
        for (const line of lines) {
          if (line) decisions.push(JSON.parse(line));
        }
      } catch {
        // No decisions file
      }

      // Sort by timestamp (most recent first)
      events.sort((a, b) => b.timestamp - a.timestamp);
      decisions.sort((a, b) => b.timestamp - a.timestamp);

      // Apply limit if specified
      if (limit) {
        return {
          events: events.slice(0, limit),
          milestones,
          decisions: decisions.slice(0, limit)
        };
      }

      return { events, milestones, decisions };
    } catch (error) {
      console.error(`❌ Failed to get history for ${projectId}:`, error);
      return { events: [], milestones: [], decisions: [] };
    }
  }

  /**
   * Query events by type
   */
  async queryEvents(projectId: string, type: ProjectEvent['type'], limit: number = 10): Promise<ProjectEvent[]> {
    const history = await this.getProjectHistory(projectId);
    return history.events.filter(e => e.type === type).slice(0, limit);
  }

  /**
   * Get project timeline summary
   */
  async getTimelineSummary(projectId: string): Promise<string> {
    const history = await this.getProjectHistory(projectId, 20);

    let summary = `📊 Project Timeline Summary\n\n`;

    // Recent events
    if (history.events.length > 0) {
      summary += `📅 Recent Events (${history.events.length}):\n`;
      history.events.slice(0, 5).forEach(e => {
        const date = new Date(e.timestamp).toLocaleDateString();
        summary += `  • ${date} - ${e.description} (${e.type})\n`;
      });
      summary += `\n`;
    }

    // Milestones
    if (history.milestones.length > 0) {
      summary += `🎯 Milestones:\n`;
      history.milestones.forEach(m => {
        const status = m.status === 'completed' ? '✅' : '🔄';
        summary += `  ${status} ${m.name} (${m.status})\n`;
      });
      summary += `\n`;
    }

    // Recent decisions
    if (history.decisions.length > 0) {
      summary += `💡 Recent Decisions (${history.decisions.length}):\n`;
      history.decisions.slice(0, 3).forEach(d => {
        const date = new Date(d.timestamp).toLocaleDateString();
        summary += `  • ${date} - ${d.decision}\n`;
      });
    }

    return summary;
  }

  /**
   * Get default vision template
   */
  private getDefaultVision(): ProjectVision {
    return {
      mission: '',
      northStar: '',
      marketOpportunity: '',
      targetMarket: '',
      competitors: [],
      targetUsers: [],
      goals: [],
      values: [],
      strategicPriorities: [],
      productPhilosophy: [],
      scope: {
        inScope: [],
        outOfScope: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Check if project has vision stored
   */
  async hasVision(projectId: string): Promise<boolean> {
    try {
      const visionPath = join(this.projectsPath, projectId, 'vision.json');
      await fs.access(visionPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete project vision (cleanup)
   */
  async deleteProjectData(projectId: string): Promise<void> {
    try {
      const projectDir = join(this.projectsPath, projectId);
      await fs.rm(projectDir, { recursive: true, force: true });
      this.emit('project_deleted', { projectId });
      console.log(`✅ Project data deleted for ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to delete project data for ${projectId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const projectVisionManager = new ProjectVisionManager();
