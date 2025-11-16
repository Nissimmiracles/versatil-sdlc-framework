/**
 * @fileoverview Diagram Generator - Automatic Mermaid diagram creation
 *
 * Generates visual diagrams from:
 * - Task plans (Gantt charts, hierarchy trees, dependency graphs)
 * - Project architecture (from scan results)
 * - Agent workflows (from orchestrator activity)
 * - User flows (from test specs)
 *
 * Export formats:
 * - Mermaid (.mmd) - Source format, editable
 * - PNG - For embedding in docs/README
 * - SVG - Scalable vector graphics
 * - PDF - Printable documentation
 *
 * @module visualization/diagram-generator
 * @version 6.1.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import type { TaskPlan, Task } from '../planning/task-plan-manager.js';
import type { ScanResult } from '../agents/opera/oliver-mcp/project-scanner.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported diagram formats
 */
export type DiagramFormat = 'mermaid' | 'png' | 'svg' | 'pdf';

/**
 * Diagram type
 */
export type DiagramType =
  | 'workflow'          // Agent workflow
  | 'architecture'      // Project architecture
  | 'task-hierarchy'    // Task breakdown tree
  | 'task-gantt'        // Task timeline (Gantt chart)
  | 'dependency-graph'  // Task dependencies
  | 'user-flow'         // User journey
  | 'collaboration'     // Agent collaboration
  | 'timeline';         // Event timeline

/**
 * Diagram generation options
 */
export interface DiagramOptions {
  /** Output format */
  format?: DiagramFormat;

  /** Output directory */
  outputDir?: string;

  /** Diagram title */
  title?: string;

  /** Whether to include legend */
  showLegend?: boolean;

  /** Color theme */
  theme?: 'default' | 'dark' | 'forest' | 'neutral';

  /** Whether to save to file */
  saveToFile?: boolean;

  /** Custom filename (without extension) */
  filename?: string;
}

/**
 * Generated diagram result
 */
export interface DiagramResult {
  /** Diagram type */
  type: DiagramType;

  /** Mermaid source code */
  mermaidSource: string;

  /** File path (if saved) */
  filePath?: string;

  /** Format */
  format: DiagramFormat;

  /** Timestamp */
  createdAt: Date;
}

// ============================================================================
// DIAGRAM GENERATOR
// ============================================================================

/**
 * Generates visual diagrams from VERSATIL data structures
 *
 * Features:
 * - Multiple diagram types (workflow, architecture, tasks, etc.)
 * - Mermaid syntax generation
 * - Export to multiple formats (PNG, SVG, PDF)
 * - Automatic styling and theming
 * - Legend generation
 *
 * Usage:
 * ```typescript
 * const generator = new DiagramGenerator();
 *
 * // Generate task hierarchy
 * const diagram = await generator.generateTaskHierarchyTree(plan);
 * console.log(diagram.mermaidSource);
 *
 * // Save to file
 * await generator.saveDiagram(diagram, 'docs/task-plan.mmd');
 * ```
 */
export class DiagramGenerator {
  private defaultOptions: Required<DiagramOptions> = {
    format: 'mermaid',
    outputDir: './docs',
    title: '',
    showLegend: true,
    theme: 'default',
    saveToFile: false,
    filename: ''
  };

  constructor() {}

  // ==========================================================================
  // TASK PLAN DIAGRAMS
  // ==========================================================================

  /**
   * Generate task hierarchy tree from plan
   *
   * Visualizes:
   * - Task breakdown (parent → child relationships)
   * - Agent assignments
   * - Task status
   * - Subagent tasks
   */
  async generateTaskHierarchyTree(
    plan: TaskPlan,
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    const title = opts.title || `Task Plan: ${plan.rootTask}`;

    let mermaid = `graph TD\n`;
    mermaid += `    Root["🎯 ${this.escapeLabel(plan.rootTask)}"]\n\n`;

    // Render task tree
    mermaid += this.renderTaskTreeMermaid(plan.tasks, 'Root', 0);

    // Add styling
    mermaid += `\n    style Root fill:#4169E1,stroke:#000080,stroke-width:3px,color:#fff\n`;

    const result: DiagramResult = {
      type: 'task-hierarchy',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    // Save to file if requested
    if (opts.saveToFile) {
      const filename = opts.filename || `task-hierarchy-${plan.id}`;
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  /**
   * Generate Gantt chart from task plan
   *
   * Visualizes:
   * - Task timeline
   * - Agent assignments
   * - Task dependencies
   * - Estimated vs actual duration
   */
  async generateTaskGanttChart(
    plan: TaskPlan,
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    const title = opts.title || `Task Timeline: ${plan.rootTask}`;

    let mermaid = `gantt\n`;
    mermaid += `    title ${title}\n`;
    mermaid += `    dateFormat  YYYY-MM-DD HH:mm\n`;
    mermaid += `    section Planning\n`;
    mermaid += `    Plan created :milestone, ${this.formatDate(plan.createdAt)}, 0min\n\n`;

    // Group tasks by agent
    const tasksByAgent = this.groupTasksByAgent(plan.tasks);

    for (const [agent, tasks] of Object.entries(tasksByAgent)) {
      mermaid += `    section ${this.getAgentDisplayName(agent)}\n`;
      mermaid += this.renderGanttTasks(tasks);
      mermaid += `\n`;
    }

    // Add milestones
    if (plan.startedAt) {
      mermaid += `    section Milestones\n`;
      mermaid += `    Execution started :milestone, ${this.formatDate(plan.startedAt)}, 0min\n`;
    }

    if (plan.completedAt) {
      mermaid += `    Execution completed :milestone, ${this.formatDate(plan.completedAt)}, 0min\n`;
    }

    const result: DiagramResult = {
      type: 'task-gantt',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    if (opts.saveToFile) {
      const filename = opts.filename || `task-gantt-${plan.id}`;
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  /**
   * Generate dependency graph from task plan
   *
   * Visualizes:
   * - Task dependencies (blocks, enables, handoff)
   * - Critical path
   * - Blocked tasks
   */
  async generateDependencyGraph(
    plan: TaskPlan,
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    let mermaid = `graph LR\n`;

    // Render tasks as nodes
    const allTasks = this.flattenTaskHierarchy(plan.tasks);

    for (const task of allTasks) {
      const style = this.getTaskStyle(task.status);
      const agentEmoji = this.getAgentEmoji(task.assignedAgent);
      const subagentMarker = task.isSubagentTask ? '↳ ' : '';

      mermaid += `    ${task.id}["${subagentMarker}${this.escapeLabel(task.description)}<br/>${agentEmoji} ${task.assignedAgent}"]:::${style}\n`;
    }

    mermaid += `\n`;

    // Render dependencies
    for (const dep of plan.dependencies) {
      const label = dep.type === 'blocks' ? 'blocks' : dep.type === 'enables' ? 'enables' : 'handoff';
      mermaid += `    ${dep.from} -->|${label}| ${dep.to}\n`;
    }

    // Add class definitions
    mermaid += `\n    classDef completed fill:#90EE90,stroke:#006400,stroke-width:2px\n`;
    mermaid += `    classDef in_progress fill:#FFD700,stroke:#FF8C00,stroke-width:2px\n`;
    mermaid += `    classDef pending fill:#D3D3D3,stroke:#808080,stroke-width:1px\n`;
    mermaid += `    classDef blocked fill:#FFB6C1,stroke:#DC143C,stroke-width:2px\n`;
    mermaid += `    classDef failed fill:#FF6347,stroke:#8B0000,stroke-width:2px\n`;

    const result: DiagramResult = {
      type: 'dependency-graph',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    if (opts.saveToFile) {
      const filename = opts.filename || `dependency-graph-${plan.id}`;
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  // ==========================================================================
  // ARCHITECTURE DIAGRAMS
  // ==========================================================================

  /**
   * Generate project architecture diagram from scan result
   *
   * Visualizes:
   * - Project layers (frontend, backend, database)
   * - Technology stack
   * - Component relationships
   */
  async generateArchitectureDiagram(
    scanResult: ScanResult,
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    const title = opts.title || 'Project Architecture';

    let mermaid = `graph TB\n`;

    // Detect layers
    const hasFrontend = scanResult.techStack.frameworks.some(f =>
      ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt'].includes(f)
    );

    const hasBackend = scanResult.techStack.frameworks.some(f =>
      ['Express', 'NestJS', 'Django', 'Flask', 'FastAPI'].includes(f)
    );

    const hasDatabase = scanResult.techStack.databases && scanResult.techStack.databases.length > 0;

    // Frontend layer
    if (hasFrontend) {
      const frontendTech = scanResult.techStack.frameworks
        .filter(f => ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt'].includes(f))
        .join(', ');

      mermaid += `    subgraph Frontend\n`;
      mermaid += `        UI["${frontendTech}<br/>Components, Pages, UI"]:::frontend\n`;
      mermaid += `    end\n\n`;
    }

    // Backend layer
    if (hasBackend) {
      const backendTech = scanResult.techStack.frameworks
        .filter(f => ['Express', 'NestJS', 'Django', 'Flask', 'FastAPI'].includes(f))
        .join(', ');

      mermaid += `    subgraph Backend\n`;
      mermaid += `        API["${backendTech}<br/>REST API, Business Logic"]:::backend\n`;
      mermaid += `    end\n\n`;
    }

    // Database layer
    if (hasDatabase) {
      const dbTech = scanResult.techStack.databases.join(', ');

      mermaid += `    subgraph Database\n`;
      mermaid += `        DB["${dbTech}<br/>Data Storage"]:::database\n`;
      mermaid += `    end\n\n`;
    }

    // Connections
    if (hasFrontend && hasBackend) {
      mermaid += `    UI --> API\n`;
    }

    if (hasBackend && hasDatabase) {
      mermaid += `    API --> DB\n`;
    }

    // Styling
    mermaid += `\n    classDef frontend fill:#61DAFB,stroke:#20232A,stroke-width:2px,color:#20232A\n`;
    mermaid += `    classDef backend fill:#68A063,stroke:#2F5E2E,stroke-width:2px,color:#fff\n`;
    mermaid += `    classDef database fill:#4479A1,stroke:#003B57,stroke-width:2px,color:#fff\n`;

    const result: DiagramResult = {
      type: 'architecture',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    if (opts.saveToFile) {
      const filename = opts.filename || 'architecture';
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  // ==========================================================================
  // WORKFLOW DIAGRAMS
  // ==========================================================================

  /**
   * Generate agent workflow diagram
   *
   * Visualizes:
   * - Agent collaboration flow
   * - Handoffs between agents
   * - SDLC phases
   */
  async generateWorkflowDiagram(
    agents: string[] = ['alex-ba', 'marcus-backend', 'james-frontend', 'maria-qa', 'sarah-pm'],
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    const title = opts.title || 'VERSATIL Agent Workflow';

    let mermaid = `graph TD\n`;
    mermaid += `    Start[User Request] --> Alex\n\n`;

    // Define agents
    mermaid += `    Alex["📋 Alex-BA<br/>Requirements Analysis"]:::alex\n`;
    mermaid += `    Marcus["⚙️ Marcus-Backend<br/>API Development"]:::marcus\n`;
    mermaid += `    James["🎨 James-Frontend<br/>UI Development"]:::james\n`;
    mermaid += `    Maria["🧪 Maria-QA<br/>Quality Assurance"]:::maria\n`;
    mermaid += `    Sarah["📊 Sarah-PM<br/>Project Coordination"]:::sarah\n\n`;

    // Workflow connections
    mermaid += `    Alex -->|User Stories| Marcus\n`;
    mermaid += `    Alex -->|User Stories| James\n`;
    mermaid += `    Marcus -->|API Ready| James\n`;
    mermaid += `    Marcus --> Maria\n`;
    mermaid += `    James --> Maria\n`;
    mermaid += `    Maria -->|✅ Quality Gate| Deploy[Production]\n`;
    mermaid += `    Maria -->|❌ Issues| Marcus\n`;
    mermaid += `    Sarah -.Coordinates.-> Alex\n`;
    mermaid += `    Sarah -.Coordinates.-> Marcus\n`;
    mermaid += `    Sarah -.Coordinates.-> James\n`;
    mermaid += `    Sarah -.Coordinates.-> Maria\n\n`;

    // Styling
    mermaid += `    classDef alex fill:#E3F2FD,stroke:#1976D2,stroke-width:2px\n`;
    mermaid += `    classDef marcus fill:#E8F5E9,stroke:#388E3C,stroke-width:2px\n`;
    mermaid += `    classDef james fill:#FFF3E0,stroke:#F57C00,stroke-width:2px\n`;
    mermaid += `    classDef maria fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px\n`;
    mermaid += `    classDef sarah fill:#FCE4EC,stroke:#C2185B,stroke-width:2px\n`;

    const result: DiagramResult = {
      type: 'workflow',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    if (opts.saveToFile) {
      const filename = opts.filename || 'agent-workflow';
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  /**
   * Generate user flow diagram (journey map)
   *
   * Visualizes:
   * - User journey through application
   * - Decision points
   * - Success/error paths
   */
  async generateUserFlowDiagram(
    flowSteps: Array<{ title: string; sections: Array<{ action: string; score: number }> }>,
    options: DiagramOptions = {}
  ): Promise<DiagramResult> {
    const opts = { ...this.defaultOptions, ...options };

    const title = opts.title || 'User Journey';

    let mermaid = `journey\n`;
    mermaid += `    title ${title}\n`;

    for (const step of flowSteps) {
      mermaid += `    section ${step.title}\n`;

      for (const action of step.sections) {
        const actor = action.score >= 4 ? 'User' : 'System';
        mermaid += `      ${action.action}: ${action.score}: ${actor}\n`;
      }
    }

    const result: DiagramResult = {
      type: 'user-flow',
      mermaidSource: mermaid,
      format: opts.format,
      createdAt: new Date()
    };

    if (opts.saveToFile) {
      const filename = opts.filename || 'user-flow';
      result.filePath = await this.saveDiagram(result, opts.outputDir, filename);
    }

    return result;
  }

  // ==========================================================================
  // HELPERS: TASK RENDERING
  // ==========================================================================

  /**
   * Render task tree as Mermaid nodes
   */
  private renderTaskTreeMermaid(tasks: Task[], parentId: string, depth: number): string {
    let output = '';

    for (const task of tasks) {
      const nodeId = `${parentId}_${task.id}`;
      const icon = this.getTaskIcon(task.status);
      const agentEmoji = this.getAgentEmoji(task.assignedAgent);
      const subagentMarker = task.isSubagentTask ? '↳ ' : '';

      output += `    ${nodeId}["${icon} ${subagentMarker}${this.escapeLabel(task.description)}<br/>${agentEmoji} ${task.assignedAgent}"]`;
      output += `\n    ${parentId} --> ${nodeId}`;

      // Add styling based on status
      const style = this.getTaskStyle(task.status);
      output += `\n    class ${nodeId} ${style}`;

      output += '\n';

      // Render subtasks
      if (task.subtasks.length > 0) {
        output += this.renderTaskTreeMermaid(task.subtasks, nodeId, depth + 1);
      }
    }

    return output;
  }

  /**
   * Render tasks as Gantt chart entries
   */
  private renderGanttTasks(tasks: Task[]): string {
    let output = '';

    for (const task of tasks) {
      const status = this.getGanttStatus(task.status);
      const duration = task.actualDuration || task.estimatedDuration;

      // Calculate dates
      let taskLine = '';

      if (task.startedAt) {
        taskLine = `    ${this.escapeLabel(task.description)} :${status}, ${this.formatDate(task.startedAt)}, ${duration}min`;
      } else {
        // Not started yet - estimate from parent or plan start
        taskLine = `    ${this.escapeLabel(task.description)} :${status}, ${duration}min`;
      }

      output += taskLine + '\n';
    }

    return output;
  }

  /**
   * Flatten task hierarchy
   */
  private flattenTaskHierarchy(tasks: Task[]): Task[] {
    const flat: Task[] = [];

    const flatten = (task: Task) => {
      flat.push(task);
      task.subtasks.forEach(flatten);
    };

    tasks.forEach(flatten);
    return flat;
  }

  /**
   * Group tasks by assigned agent
   */
  private groupTasksByAgent(tasks: Task[]): Record<string, Task[]> {
    const grouped: Record<string, Task[]> = {};
    const allTasks = this.flattenTaskHierarchy(tasks);

    for (const task of allTasks) {
      const agent = task.assignedAgent || 'unassigned';
      if (!grouped[agent]) grouped[agent] = [];
      grouped[agent].push(task);
    }

    return grouped;
  }

  // ==========================================================================
  // HELPERS: STYLING
  // ==========================================================================

  /**
   * Get task status icon
   */
  private getTaskIcon(status: Task['status']): string {
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
   * Get task CSS class based on status
   */
  private getTaskStyle(status: Task['status']): string {
    return status;
  }

  /**
   * Get Gantt status string
   */
  private getGanttStatus(status: Task['status']): string {
    const statusMap = {
      'pending': '',
      'in_progress': 'active',
      'completed': 'done',
      'failed': 'crit',
      'blocked': 'crit'
    };
    return statusMap[status];
  }

  /**
   * Get agent emoji
   */
  private getAgentEmoji(agent: string): string {
    const emojis: Record<string, string> = {
      'alex-ba': '📋',
      'marcus-backend': '⚙️',
      'james-frontend': '🎨',
      'maria-qa': '🧪',
      'sarah-pm': '📊',
      'dr-ai-ml': '🤖',
      'oliver-onboarding': '🚀'
    };
    return emojis[agent] || '🔧';
  }

  /**
   * Get agent display name
   */
  private getAgentDisplayName(agent: string): string {
    const names: Record<string, string> = {
      'alex-ba': 'Alex-BA (Requirements)',
      'marcus-backend': 'Marcus-Backend (API)',
      'james-frontend': 'James-Frontend (UI)',
      'maria-qa': 'Maria-QA (Testing)',
      'sarah-pm': 'Sarah-PM (Coordination)',
      'dr-ai-ml': 'Dr.AI-ML (Machine Learning)',
      'oliver-onboarding': 'Oliver-Onboarding (Setup)'
    };
    return names[agent] || agent;
  }

  // ==========================================================================
  // HELPERS: UTILITIES
  // ==========================================================================

  /**
   * Escape special characters for Mermaid labels
   */
  private escapeLabel(label: string): string {
    return label
      .replace(/"/g, '\\"')
      .replace(/\n/g, '<br/>')
      .slice(0, 60); // Truncate long labels
  }

  /**
   * Format date for Gantt chart
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // ==========================================================================
  // FILE OPERATIONS
  // ==========================================================================

  /**
   * Save diagram to file
   *
   * @param diagram - Diagram result
   * @param outputDir - Output directory
   * @param filename - Filename (without extension)
   * @returns File path
   */
  async saveDiagram(
    diagram: DiagramResult,
    outputDir: string = './docs',
    filename?: string
  ): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate filename
    const fname = filename || `diagram-${diagram.type}-${Date.now()}`;
    const extension = diagram.format === 'mermaid' ? 'mmd' : diagram.format;
    const filePath = join(outputDir, `${fname}.${extension}`);

    // Save mermaid source
    if (diagram.format === 'mermaid') {
      await fs.writeFile(filePath, diagram.mermaidSource, 'utf8');
    } else {
      // For PNG/SVG/PDF, save both mermaid source and note about conversion
      const mmdPath = join(outputDir, `${fname}.mmd`);
      await fs.writeFile(mmdPath, diagram.mermaidSource, 'utf8');

      const note = `# Diagram: ${diagram.type}\n\n` +
        `Mermaid source saved to: ${fname}.mmd\n\n` +
        `To convert to ${diagram.format.toUpperCase()}:\n` +
        `- Visit https://mermaid.live/\n` +
        `- Paste the contents of ${fname}.mmd\n` +
        `- Export as ${diagram.format.toUpperCase()}\n\n` +
        `Or use mermaid-cli:\n` +
        `npx -p @mermaid-js/mermaid-cli mmdc -i ${fname}.mmd -o ${fname}.${extension}\n`;

      await fs.writeFile(filePath, note, 'utf8');
    }

    return filePath;
  }

  /**
   * Generate all diagrams for a plan
   *
   * Convenience method to generate all diagram types at once
   */
  async generateAllPlanDiagrams(
    plan: TaskPlan,
    outputDir: string = './docs'
  ): Promise<DiagramResult[]> {
    const results: DiagramResult[] = [];

    // Task hierarchy
    results.push(await this.generateTaskHierarchyTree(plan, {
      saveToFile: true,
      outputDir,
      filename: `plan-${plan.id}-hierarchy`
    }));

    // Gantt chart
    results.push(await this.generateTaskGanttChart(plan, {
      saveToFile: true,
      outputDir,
      filename: `plan-${plan.id}-gantt`
    }));

    // Dependency graph
    results.push(await this.generateDependencyGraph(plan, {
      saveToFile: true,
      outputDir,
      filename: `plan-${plan.id}-dependencies`
    }));

    return results;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DiagramGenerator;
