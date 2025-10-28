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
import type { TaskPlan } from '../planning/task-plan-manager.js';
import type { ScanResult } from '../agents/opera/oliver-mcp/project-scanner.js';
/**
 * Supported diagram formats
 */
export type DiagramFormat = 'mermaid' | 'png' | 'svg' | 'pdf';
/**
 * Diagram type
 */
export type DiagramType = 'workflow' | 'architecture' | 'task-hierarchy' | 'task-gantt' | 'dependency-graph' | 'user-flow' | 'collaboration' | 'timeline';
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
export declare class DiagramGenerator {
    private defaultOptions;
    constructor();
    /**
     * Generate task hierarchy tree from plan
     *
     * Visualizes:
     * - Task breakdown (parent → child relationships)
     * - Agent assignments
     * - Task status
     * - Subagent tasks
     */
    generateTaskHierarchyTree(plan: TaskPlan, options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Generate Gantt chart from task plan
     *
     * Visualizes:
     * - Task timeline
     * - Agent assignments
     * - Task dependencies
     * - Estimated vs actual duration
     */
    generateTaskGanttChart(plan: TaskPlan, options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Generate dependency graph from task plan
     *
     * Visualizes:
     * - Task dependencies (blocks, enables, handoff)
     * - Critical path
     * - Blocked tasks
     */
    generateDependencyGraph(plan: TaskPlan, options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Generate project architecture diagram from scan result
     *
     * Visualizes:
     * - Project layers (frontend, backend, database)
     * - Technology stack
     * - Component relationships
     */
    generateArchitectureDiagram(scanResult: ScanResult, options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Generate agent workflow diagram
     *
     * Visualizes:
     * - Agent collaboration flow
     * - Handoffs between agents
     * - SDLC phases
     */
    generateWorkflowDiagram(agents?: string[], options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Generate user flow diagram (journey map)
     *
     * Visualizes:
     * - User journey through application
     * - Decision points
     * - Success/error paths
     */
    generateUserFlowDiagram(flowSteps: Array<{
        title: string;
        sections: Array<{
            action: string;
            score: number;
        }>;
    }>, options?: DiagramOptions): Promise<DiagramResult>;
    /**
     * Render task tree as Mermaid nodes
     */
    private renderTaskTreeMermaid;
    /**
     * Render tasks as Gantt chart entries
     */
    private renderGanttTasks;
    /**
     * Flatten task hierarchy
     */
    private flattenTaskHierarchy;
    /**
     * Group tasks by assigned agent
     */
    private groupTasksByAgent;
    /**
     * Get task status icon
     */
    private getTaskIcon;
    /**
     * Get task CSS class based on status
     */
    private getTaskStyle;
    /**
     * Get Gantt status string
     */
    private getGanttStatus;
    /**
     * Get agent emoji
     */
    private getAgentEmoji;
    /**
     * Get agent display name
     */
    private getAgentDisplayName;
    /**
     * Escape special characters for Mermaid labels
     */
    private escapeLabel;
    /**
     * Format date for Gantt chart
     */
    private formatDate;
    /**
     * Save diagram to file
     *
     * @param diagram - Diagram result
     * @param outputDir - Output directory
     * @param filename - Filename (without extension)
     * @returns File path
     */
    saveDiagram(diagram: DiagramResult, outputDir?: string, filename?: string): Promise<string>;
    /**
     * Generate all diagrams for a plan
     *
     * Convenience method to generate all diagram types at once
     */
    generateAllPlanDiagrams(plan: TaskPlan, outputDir?: string): Promise<DiagramResult[]>;
}
export default DiagramGenerator;
