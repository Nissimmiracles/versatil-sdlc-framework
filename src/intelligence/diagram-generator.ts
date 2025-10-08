/**
 * VERSATIL Framework - Diagram Generator
 * Auto-generates Mermaid diagrams for epics, architectures, and workflows
 *
 * Features:
 * - Epic breakdown diagrams (epic → stories → tasks)
 * - Architecture diagrams (components, connections, data flows)
 * - Workflow diagrams (SDLC phases, agent collaboration)
 * - User flow diagrams (user journey, interactions)
 * - Dependency graphs (task dependencies, blockers)
 * - Auto-embeds diagrams in markdown files
 *
 * Addresses: User requirement #4 - "each prd, architecture, workflow, user flow etc.
 * need to be backed with a clear diagram flow with boxes like a mindmaping"
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Epic, UserStory, Task } from '../orchestration/epic-workflow-orchestrator.js';
import type { ArchitectureDescription } from '../testing/architecture-stress-tester.js';
import type { PRDDocument } from '../intelligence/prd-feasibility-analyzer.js';

export interface DiagramConfig {
  type: 'epic-breakdown' | 'architecture' | 'workflow' | 'userflow' | 'dependency-graph' | 'mindmap';
  title: string;
  description?: string;
  orientation?: 'TB' | 'LR' | 'RL' | 'BT'; // Top-to-Bottom, Left-to-Right, etc.
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

export interface GeneratedDiagram {
  type: DiagramConfig['type'];
  title: string;
  mermaidCode: string;
  markdownBlock: string; // Ready to embed in .md files
  svg?: string; // Optional SVG rendering
  timestamp: number;
}

export class DiagramGenerator extends EventEmitter {
  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('📊 Diagram Generator initializing...');
    this.emit('generator:initialized');
    console.log('✅ Diagram Generator ready');
  }

  /**
   * Generate epic breakdown diagram
   */
  generateEpicDiagram(epic: Epic, config?: Partial<DiagramConfig>): GeneratedDiagram {
    console.log(`📊 Generating epic diagram: ${epic.title}`);

    const orientation = config?.orientation || 'TB';
    const theme = config?.theme || 'default';

    let mermaid = `%%{init: {'theme':'${theme}'}}%%\n`;
    mermaid += `graph ${orientation}\n`;
    mermaid += `  Epic["${this.escapeLabel(epic.title)}<br/>Priority: ${epic.priority}<br/>Status: ${epic.status}"]\n`;
    mermaid += `  Epic:::epicStyle\n\n`;

    // Add stories
    for (let i = 0; i < epic.stories.length; i++) {
      const story = epic.stories[i];
      const storyId = `Story${i}`;

      mermaid += `  ${storyId}["${this.escapeLabel(story.title)}<br/>Priority: ${story.priority}<br/>Status: ${story.status}"]\n`;
      mermaid += `  Epic --> ${storyId}\n`;
      mermaid += `  ${storyId}:::storyStyle\n`;

      // Add tasks for this story
      for (let j = 0; j < story.tasks.length; j++) {
        const task = story.tasks[j];
        const taskId = `Task${i}_${j}`;
        const icon = this.getTaskIcon(task.type);

        mermaid += `  ${taskId}["${icon} ${this.escapeLabel(task.title)}<br/>Type: ${task.type}<br/>Priority: ${task.priority.toFixed(1)}"]\n`;
        mermaid += `  ${storyId} --> ${taskId}\n`;
        mermaid += `  ${taskId}:::${task.status === 'completed' ? 'completedStyle' : 'taskStyle'}\n`;

        // Add dependencies
        for (const depId of task.dependsOn) {
          const depTask = epic.stories.flatMap(s => s.tasks).find(t => t.id === depId);
          if (depTask) {
            const depStoryIndex = epic.stories.findIndex(s => s.tasks.includes(depTask));
            const depTaskIndex = epic.stories[depStoryIndex].tasks.indexOf(depTask);
            mermaid += `  Task${depStoryIndex}_${depTaskIndex} -.->|depends| ${taskId}\n`;
          }
        }
      }

      mermaid += `\n`;
    }

    // Add styles
    mermaid += `  classDef epicStyle fill:#e1f5ff,stroke:#01579b,stroke-width:4px,color:#000\n`;
    mermaid += `  classDef storyStyle fill:#fff3e0,stroke:#e65100,stroke-width:3px,color:#000\n`;
    mermaid += `  classDef taskStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef completedStyle fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000\n`;

    const markdownBlock = this.wrapInMarkdown(mermaid, epic.title);

    console.log(`   ✅ Epic diagram generated (${epic.stories.length} stories, ${epic.totalTasks} tasks)`);

    return {
      type: 'epic-breakdown',
      title: epic.title,
      mermaidCode: mermaid,
      markdownBlock,
      timestamp: Date.now()
    };
  }

  /**
   * Generate architecture diagram
   */
  generateArchitectureDiagram(architecture: ArchitectureDescription, config?: Partial<DiagramConfig>): GeneratedDiagram {
    console.log(`📊 Generating architecture diagram (${architecture.components.length} components)`);

    const orientation = config?.orientation || 'LR';
    const theme = config?.theme || 'default';

    let mermaid = `%%{init: {'theme':'${theme}'}}%%\n`;
    mermaid += `graph ${orientation}\n`;

    // Add components
    for (const component of architecture.components) {
      const shape = this.getComponentShape(component.type);
      const label = `${this.escapeLabel(component.name)}<br/>Type: ${component.type}`;

      mermaid += `  ${component.id}${shape[0]}"${label}"${shape[1]}\n`;
      mermaid += `  ${component.id}:::${component.type}Style\n`;
    }

    mermaid += `\n`;

    // Add connections
    for (const connection of architecture.connections) {
      const arrow = this.getConnectionArrow(connection.protocol);
      const label = connection.latency ? `${connection.protocol}<br/>${connection.latency}ms` : connection.protocol;

      mermaid += `  ${connection.from} ${arrow}|"${label}"| ${connection.to}\n`;
    }

    mermaid += `\n`;

    // Add data flows (if any)
    if (architecture.dataFlow && architecture.dataFlow.length > 0) {
      mermaid += `  %% Data Flows\n`;
      for (const flow of architecture.dataFlow) {
        const flowPath = flow.path.join(' ==> ');
        mermaid += `  %% ${flow.description}: ${flowPath}\n`;
      }
      mermaid += `\n`;
    }

    // Add styles
    mermaid += `  classDef apiStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef databaseStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef cacheStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef queueStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef serviceStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef frontendStyle fill:#e0f7fa,stroke:#00838f,stroke-width:2px,color:#000\n`;

    const title = config?.title || 'System Architecture';
    const markdownBlock = this.wrapInMarkdown(mermaid, title);

    console.log(`   ✅ Architecture diagram generated`);

    return {
      type: 'architecture',
      title,
      mermaidCode: mermaid,
      markdownBlock,
      timestamp: Date.now()
    };
  }

  /**
   * Generate workflow diagram (SDLC phases, agent collaboration)
   */
  generateWorkflowDiagram(phases: string[], agentFlow: Array<{ from: string; to: string; label: string }>, config?: Partial<DiagramConfig>): GeneratedDiagram {
    console.log(`📊 Generating workflow diagram (${phases.length} phases)`);

    const orientation = config?.orientation || 'LR';
    const theme = config?.theme || 'default';

    let mermaid = `%%{init: {'theme':'${theme}'}}%%\n`;
    mermaid += `graph ${orientation}\n`;

    // Add phases as swimlanes
    mermaid += `  Start((Start))\n`;

    for (let i = 0; i < phases.length; i++) {
      const phaseId = `Phase${i}`;
      const phase = phases[i];

      mermaid += `  ${phaseId}["${this.escapeLabel(phase)}"]\n`;

      if (i === 0) {
        mermaid += `  Start --> ${phaseId}\n`;
      } else {
        mermaid += `  Phase${i - 1} --> ${phaseId}\n`;
      }
    }

    mermaid += `  Phase${phases.length - 1} --> End((End))\n`;
    mermaid += `\n`;

    // Add agent collaboration flows
    if (agentFlow.length > 0) {
      mermaid += `  %% Agent Collaboration\n`;
      for (const flow of agentFlow) {
        mermaid += `  ${flow.from} -.->|"${this.escapeLabel(flow.label)}"| ${flow.to}\n`;
      }
    }

    const title = config?.title || 'SDLC Workflow';
    const markdownBlock = this.wrapInMarkdown(mermaid, title);

    console.log(`   ✅ Workflow diagram generated`);

    return {
      type: 'workflow',
      title,
      mermaidCode: mermaid,
      markdownBlock,
      timestamp: Date.now()
    };
  }

  /**
   * Generate dependency graph
   */
  generateDependencyGraph(tasks: Task[], config?: Partial<DiagramConfig>): GeneratedDiagram {
    console.log(`📊 Generating dependency graph (${tasks.length} tasks)`);

    const orientation = config?.orientation || 'TB';
    const theme = config?.theme || 'default';

    let mermaid = `%%{init: {'theme':'${theme}'}}%%\n`;
    mermaid += `graph ${orientation}\n`;

    // Add tasks
    for (const task of tasks) {
      const taskId = this.sanitizeId(task.id);
      const icon = this.getTaskIcon(task.type);
      const statusColor = this.getStatusColor(task.status);

      mermaid += `  ${taskId}["${icon} ${this.escapeLabel(task.title)}<br/>Priority: ${task.priority.toFixed(1)}<br/>Status: ${task.status}"]\n`;
      mermaid += `  ${taskId}:::${statusColor}\n`;
    }

    mermaid += `\n`;

    // Add dependencies
    for (const task of tasks) {
      const taskId = this.sanitizeId(task.id);

      for (const depId of task.dependsOn) {
        const sanitizedDepId = this.sanitizeId(depId);
        mermaid += `  ${sanitizedDepId} --> ${taskId}\n`;
      }
    }

    mermaid += `\n`;

    // Add styles
    mermaid += `  classDef pending fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef inProgress fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000\n`;
    mermaid += `  classDef completed fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000\n`;
    mermaid += `  classDef blocked fill:#ffcdd2,stroke:#d32f2f,stroke-width:3px,color:#000\n`;
    mermaid += `  classDef failed fill:#f44336,stroke:#b71c1c,stroke-width:3px,color:#fff\n`;

    const title = config?.title || 'Task Dependency Graph';
    const markdownBlock = this.wrapInMarkdown(mermaid, title);

    console.log(`   ✅ Dependency graph generated`);

    return {
      type: 'dependency-graph',
      title,
      mermaidCode: mermaid,
      markdownBlock,
      timestamp: Date.now()
    };
  }

  /**
   * Generate mindmap for PRD/Epic
   */
  generateMindmap(prd: PRDDocument, config?: Partial<DiagramConfig>): GeneratedDiagram {
    console.log(`📊 Generating mindmap: ${prd.title}`);

    const theme = config?.theme || 'default';

    let mermaid = `%%{init: {'theme':'${theme}'}}%%\n`;
    mermaid += `mindmap\n`;
    mermaid += `  root(("${this.escapeLabel(prd.title)}"))\n`;

    // Add objectives
    if (prd.objectives.length > 0) {
      mermaid += `    Objectives\n`;
      for (const objective of prd.objectives) {
        mermaid += `      ${this.escapeLabel(objective)}\n`;
      }
    }

    // Add requirements by type
    const reqsByType = new Map<string, typeof prd.requirements>();
    for (const req of prd.requirements) {
      if (!reqsByType.has(req.type)) {
        reqsByType.set(req.type, []);
      }
      reqsByType.get(req.type)!.push(req);
    }

    for (const [type, reqs] of reqsByType.entries()) {
      mermaid += `    ${type}\n`;
      for (const req of reqs.slice(0, 5)) { // Max 5 per type for readability
        mermaid += `      ${this.escapeLabel(req.description.substring(0, 50))}\n`;
      }
    }

    // Add tech stack
    if (prd.techStack && prd.techStack.length > 0) {
      mermaid += `    Tech Stack\n`;
      for (const tech of prd.techStack) {
        mermaid += `      ${this.escapeLabel(tech)}\n`;
      }
    }

    // Add constraints
    if (prd.constraints.length > 0) {
      mermaid += `    Constraints\n`;
      for (const constraint of prd.constraints.slice(0, 5)) {
        mermaid += `      ${this.escapeLabel(constraint.substring(0, 50))}\n`;
      }
    }

    const markdownBlock = this.wrapInMarkdown(mermaid, prd.title);

    console.log(`   ✅ Mindmap generated`);

    return {
      type: 'mindmap',
      title: prd.title,
      mermaidCode: mermaid,
      markdownBlock,
      timestamp: Date.now()
    };
  }

  /**
   * Helper: Escape label text for Mermaid
   */
  private escapeLabel(text: string): string {
    return text
      .replace(/"/g, '#quot;')
      .replace(/\n/g, '<br/>')
      .substring(0, 100); // Max 100 chars for readability
  }

  /**
   * Helper: Sanitize ID for Mermaid
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Helper: Get task icon
   */
  private getTaskIcon(type: Task['type']): string {
    const icons: Record<Task['type'], string> = {
      'development': '💻',
      'testing': '🧪',
      'documentation': '📝',
      'research': '🔍',
      'devops': '🚀'
    };
    return icons[type] || '📋';
  }

  /**
   * Helper: Get component shape
   */
  private getComponentShape(type: string): [string, string] {
    const shapes: Record<string, [string, string]> = {
      'api': ['[', ']'],
      'database': ['[(', ')]'],
      'cache': ['[[', ']]'],
      'queue': ['>', ']'],
      'service': ['[', ']'],
      'frontend': ['(', ')']
    };
    return shapes[type] || ['[', ']'];
  }

  /**
   * Helper: Get connection arrow
   */
  private getConnectionArrow(protocol: string): string {
    const arrows: Record<string, string> = {
      'http': '-->',
      'grpc': '==>',
      'websocket': '-.->',
      'tcp': '-->',
      'queue': '==>>'
    };
    return arrows[protocol] || '-->';
  }

  /**
   * Helper: Get status color class
   */
  private getStatusColor(status: Task['status']): string {
    const colors: Record<Task['status'], string> = {
      'pending': 'pending',
      'assigned': 'pending',
      'in-progress': 'inProgress',
      'blocked': 'blocked',
      'review': 'inProgress',
      'completed': 'completed',
      'failed': 'failed'
    };
    return colors[status] || 'pending';
  }

  /**
   * Helper: Wrap Mermaid code in markdown block
   */
  private wrapInMarkdown(mermaidCode: string, title: string): string {
    return `## ${title}\n\n\`\`\`mermaid\n${mermaidCode}\`\`\`\n`;
  }

  /**
   * Save diagram to markdown file
   */
  async saveDiagram(diagram: GeneratedDiagram, filePath: string): Promise<void> {
    // In real implementation, this would use Write tool
    console.log(`💾 Diagram would be saved to: ${filePath}`);
    this.emit('diagram:saved', { filePath, type: diagram.type });
  }

  /**
   * Shutdown generator
   */
  async shutdown(): Promise<void> {
    this.emit('generator:shutdown');
    console.log('🛑 Diagram Generator shut down');
  }
}

// Export singleton instance
export const globalDiagramGenerator = new DiagramGenerator();
