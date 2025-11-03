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

import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TodoFileSpec {
  title: string;
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  assigned_agent: string;
  estimated_effort: 'Small' | 'Medium' | 'Large' | 'XL';
  acceptance_criteria: string[];
  dependencies: {
    depends_on: string[]; // Todo numbers: ["002", "003"]
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
  dependency_graph: string; // Mermaid diagram
  total_estimated_hours: number;
  execution_waves: ExecutionWave[];
}

export interface ExecutionWave {
  wave_number: number;
  todos: string[]; // Todo numbers
  can_run_parallel: boolean;
  estimated_hours: number;
}

// ============================================================================
// Todo File Generator Service
// ============================================================================

export class TodoFileGenerator {
  private logger: VERSATILLogger;
  private todosDir: string;
  private templatePath: string;
  private templateContent: string | null = null;

  // Effort estimates in hours
  private effortHours: Record<string, number> = {
    'Small': 2,
    'Medium': 4,
    'Large': 8,
    'XL': 16
  };

  constructor(todosDir?: string) {
    this.logger = new VERSATILLogger();
    this.todosDir = todosDir || path.join(process.cwd(), 'todos');
    this.templatePath = path.join(this.todosDir, '000-pending-p1-TEMPLATE.md');
  }

  /**
   * Load template file
   */
  private loadTemplate(): string {
    if (this.templateContent) return this.templateContent;

    try {
      this.templateContent = fs.readFileSync(this.templatePath, 'utf-8');
      this.logger.info('Todo template loaded', {}, 'todo-generator');
      return this.templateContent;
    } catch (error) {
      this.logger.error('Failed to load todo template', { error }, 'todo-generator');
      throw new Error(`Template not found at ${this.templatePath}`);
    }
  }

  /**
   * Get next available todo number
   *
   * Layer 4: Namespacing - Ignores Guardian todos (guardian-*.md files)
   * Sequential numbers (001-899) reserved for /plan command
   * Guardian uses namespaced format: guardian-timestamp-xxxx-p1-layer.md
   */
  private getNextTodoNumber(): number {
    try {
      const files = fs.readdirSync(this.todosDir);
      const numbers = files
        .map(f => {
          // Layer 4: Only match 3-digit sequential numbers (001, 002, etc.)
          // Ignore Guardian todos (guardian-timestamp-xxx.md)
          const match = f.match(/^(\d{3})-/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0 && n < 900); // Exclude 900+ (reserved for system)

      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      return maxNumber + 1;
    } catch (error) {
      this.logger.error('Failed to get next todo number', { error }, 'todo-generator');
      return 1;
    }
  }

  /**
   * Generate todos from specifications
   */
  async generateTodos(specs: TodoFileSpec[]): Promise<TodoGenerationResult> {
    this.logger.info(`Generating ${specs.length} todo files`, {}, 'todo-generator');

    const template = this.loadTemplate();
    let nextNumber = this.getNextTodoNumber();
    const filesCreated: string[] = [];
    const todowriteItems: TodoGenerationResult['todowrite_items'] = [];
    const todoNumberMap = new Map<number, string>(); // index -> number

    // Create each todo file
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const todoNumber = String(nextNumber).padStart(3, '0');
      todoNumberMap.set(i, todoNumber);

      const fileName = this.generateFileName(todoNumber, spec);
      const filePath = path.join(this.todosDir, fileName);
      const content = this.populateTemplate(template, spec, todoNumber);

      // Write file
      fs.writeFileSync(filePath, content, 'utf-8');
      filesCreated.push(fileName);

      // Create TodoWrite item
      todowriteItems.push({
        content: spec.title,
        activeForm: this.toActiveForm(spec.title),
        status: spec.dependencies.depends_on.length === 0 ? 'pending' : 'pending',
        file_path: filePath
      });

      nextNumber++;
    }

    // Generate dependency graph
    const dependencyGraph = this.generateDependencyGraph(specs, todoNumberMap);

    // Detect execution waves
    const executionWaves = this.detectExecutionWaves(specs, todoNumberMap);

    // Calculate total effort
    const totalEffort = specs.reduce((sum, spec) => sum + this.effortHours[spec.estimated_effort], 0);

    this.logger.info(`Created ${filesCreated.length} todo files`, {
      totalEffort,
      waves: executionWaves.length
    }, 'todo-generator');

    return {
      files_created: filesCreated,
      todowrite_items: todowriteItems,
      dependency_graph: dependencyGraph,
      total_estimated_hours: totalEffort,
      execution_waves: executionWaves
    };
  }

  /**
   * Generate file name from todo spec
   */
  private generateFileName(todoNumber: string, spec: TodoFileSpec): string {
    const slug = spec.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return `${todoNumber}-pending-${spec.priority}-${slug}.md`;
  }

  /**
   * Populate template with spec data
   */
  private populateTemplate(template: string, spec: TodoFileSpec, todoNumber: string): string {
    const today = new Date().toISOString().split('T')[0];

    let content = template;

    // Replace placeholders
    content = content.replace(/\[TITLE\]/g, spec.title);
    content = content.replace(/P\[1-3\]/g, spec.priority.toUpperCase());
    content = content.replace(/\[YYYY-MM-DD\]/g, today);
    content = content.replace(/\[Agent Name[^\]]*\]/g, spec.assigned_agent);
    content = content.replace(/\[Small\|Medium\|Large\|XL\]/g, spec.estimated_effort);
    content = content.replace(/\[Clear, concise description[^\]]*\]/g, spec.context.feature_description);

    // Replace acceptance criteria
    const criteriaList = spec.acceptance_criteria
      .map(c => `- [ ] ${c}`)
      .join('\n');
    content = content.replace(/- \[ \] Criterion 1:[^\n]*\n- \[ \] Criterion 2:[^\n]*\n- \[ \] Criterion 3:[^\n]*/g, criteriaList);

    // Replace files involved
    const filesList = spec.files_involved
      .map(f => `  - \`${f}\``)
      .join('\n');
    content = content.replace(/ {2}- `path\/to\/file1.ts`\n {2}- `path\/to\/file2.ts`/g, filesList);

    // Replace dependencies
    if (spec.dependencies.depends_on.length > 0) {
      const depsList = spec.dependencies.depends_on
        .map(d => `- **Depends on**: ${d} - [Brief description]`)
        .join('\n');
      content = content.replace(/- \*\*Depends on\*\*:[^\n]*/g, depsList);
    }

    if (spec.dependencies.blocks.length > 0) {
      const blocksList = spec.dependencies.blocks
        .map(b => `- **Blocks**: ${b} - [Brief description]`)
        .join('\n');
      content = content.replace(/- \*\*Blocks\*\*:[^\n]*/g, blocksList);
    }

    // Replace implementation notes
    if (spec.implementation_notes) {
      content = content.replace(/\[Technical notes, architecture decisions[^\]]*\]/g, spec.implementation_notes);
    }

    // Replace related issue/PR
    if (spec.context.related_issue) {
      content = content.replace(/- \*\*Related Issue\*\*:[^\n]*/g, `- **Related Issue**: ${spec.context.related_issue}`);
    }
    if (spec.context.related_pr) {
      content = content.replace(/- \*\*Related PR\*\*:[^\n]*/g, `- **Related PR**: ${spec.context.related_pr}`);
    }

    return content;
  }

  /**
   * Convert title to active form for TodoWrite
   */
  private toActiveForm(title: string): string {
    // Convert "Create auth service" -> "Creating auth service"
    const firstWord = title.split(' ')[0].toLowerCase();
    const rest = title.substring(firstWord.length).trim();

    const gerunds: Record<string, string> = {
      'create': 'Creating',
      'implement': 'Implementing',
      'add': 'Adding',
      'build': 'Building',
      'design': 'Designing',
      'develop': 'Developing',
      'write': 'Writing',
      'test': 'Testing',
      'fix': 'Fixing',
      'update': 'Updating',
      'refactor': 'Refactoring'
    };

    return gerunds[firstWord] ? `${gerunds[firstWord]} ${rest}` : `Working on: ${title}`;
  }

  /**
   * Generate Mermaid dependency graph
   */
  private generateDependencyGraph(specs: TodoFileSpec[], numberMap: Map<number, string>): string {
    const lines = ['```mermaid', 'graph TD'];

    // Add nodes
    specs.forEach((spec, index) => {
      const num = numberMap.get(index);
      const label = spec.title.length > 30 ? spec.title.substring(0, 30) + '...' : spec.title;
      lines.push(`    ${num}[${num}: ${label}]`);
    });

    // Add edges
    specs.forEach((spec, index) => {
      const num = numberMap.get(index);
      for (const dep of spec.dependencies.depends_on) {
        lines.push(`    ${dep} --> ${num}`);
      }
    });

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Detect execution waves (parallel vs sequential)
   */
  private detectExecutionWaves(specs: TodoFileSpec[], numberMap: Map<number, string>): ExecutionWave[] {
    const waves: ExecutionWave[] = [];
    const completed = new Set<string>();
    let waveNumber = 1;

    while (completed.size < specs.length) {
      const currentWave: string[] = [];
      let waveEffort = 0;

      specs.forEach((spec, index) => {
        const num = numberMap.get(index)!;
        if (completed.has(num)) return;

        // Check if all dependencies are completed
        const allDepsCompleted = spec.dependencies.depends_on.every(dep => completed.has(dep));

        if (allDepsCompleted) {
          currentWave.push(num);
          waveEffort += this.effortHours[spec.estimated_effort];
          completed.add(num);
        }
      });

      if (currentWave.length === 0) break; // Circular dependency or error

      waves.push({
        wave_number: waveNumber,
        todos: currentWave,
        can_run_parallel: currentWave.length > 1,
        estimated_hours: waveEffort
      });

      waveNumber++;
    }

    return waves;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const todoFileGenerator = new TodoFileGenerator();
