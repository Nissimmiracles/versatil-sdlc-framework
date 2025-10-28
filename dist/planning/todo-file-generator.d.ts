/**
 * Todo File Generator Service - Dual Todo System
 *
 * Creates persistent todos/*.md files from plan breakdowns:
 * - Auto-numbers files sequentially
 * - Uses template from todos/000-pending-p1-TEMPLATE.md
 * - Generates dependency graphs (Mermaid format)
 * - Creates both TodoWrite items + persistent files
 * - Detects parallel execution waves
 *
 * @module src/planning/todo-file-generator
 */
export interface TodoFileSpec {
    title: string;
    priority: 'p1' | 'p2' | 'p3' | 'p4';
    assigned_agent: string;
    estimated_effort: 'Small' | 'Medium' | 'Large' | 'XL';
    acceptance_criteria: string[];
    dependencies: {
        depends_on: string[];
        blocks: string[];
    };
    implementation_notes: string;
    files_involved: string[];
    context: {
        feature_description: string;
        related_issue?: string;
        related_pr?: string;
    };
}
export interface TodoGenerationResult {
    files_created: string[];
    todowrite_items: Array<{
        content: string;
        activeForm: string;
        status: 'pending' | 'in_progress' | 'completed';
        file_path?: string;
    }>;
    dependency_graph: string;
    total_estimated_hours: number;
    execution_waves: ExecutionWave[];
}
export interface ExecutionWave {
    wave_number: number;
    todos: string[];
    can_run_parallel: boolean;
    estimated_hours: number;
}
export declare class TodoFileGenerator {
    private logger;
    private todosDir;
    private templatePath;
    private templateContent;
    private effortHours;
    constructor(todosDir?: string);
    /**
     * Load template file
     */
    private loadTemplate;
    /**
     * Get next available todo number
     *
     * Layer 4: Namespacing - Ignores Guardian todos (guardian-*.md files)
     * Sequential numbers (001-899) reserved for /plan command
     * Guardian uses namespaced format: guardian-timestamp-xxxx-p1-layer.md
     */
    private getNextTodoNumber;
    /**
     * Generate todos from specifications
     */
    generateTodos(specs: TodoFileSpec[]): Promise<TodoGenerationResult>;
    /**
     * Generate file name from todo spec
     */
    private generateFileName;
    /**
     * Populate template with spec data
     */
    private populateTemplate;
    /**
     * Convert title to active form for TodoWrite
     */
    private toActiveForm;
    /**
     * Generate Mermaid dependency graph
     */
    private generateDependencyGraph;
    /**
     * Detect execution waves (parallel vs sequential)
     */
    private detectExecutionWaves;
}
export declare const todoFileGenerator: TodoFileGenerator;
