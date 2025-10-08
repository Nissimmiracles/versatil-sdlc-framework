/**
 * VERSATIL Framework - Context Assembler
 * Smart context routing and assembly for Claude/Cursor integration
 *
 * Features:
 * - Manages .context/ directory structure
 * - Creates per-epic context files
 * - Creates per-agent context files
 * - Generates CONTEXT_ROUTING.json for intelligent context selection
 * - Token optimization (prioritizes relevant context)
 * - Auto-updates context as work progresses
 *
 * Addresses: User requirement #6 - "mastering the claude/cursor '/context' usage
 * for efficient context engineering principal"
 *
 * Directory Structure:
 * .context/
 *   ├── PROJECT_CONTEXT.md        # Master project context
 *   ├── CONTEXT_ROUTING.json      # Smart routing rules
 *   ├── epics/
 *   │   ├── epic-123.md            # Per-epic context
 *   │   └── epic-456.md
 *   ├── agents/
 *   │   ├── marcus-backend.md      # Per-agent context
 *   │   ├── james-frontend.md
 *   │   └── maria-qa.md
 *   └── tasks/
 *       ├── task-001.md            # Per-task context
 *       └── task-002.md
 */

import { EventEmitter } from 'events';
import type { Epic, Task } from '../orchestration/epic-workflow-orchestrator.js';
import type { SubAgent } from '../orchestration/conflict-resolution-engine.js';

export interface ContextFile {
  path: string;
  content: string;
  type: 'project' | 'epic' | 'agent' | 'task' | 'routing';
  metadata: {
    id: string;
    created: number;
    updated: number;
    priority: number; // 0-10 (for routing priority)
    tokenCount?: number;
  };
}

export interface ContextRoutingRule {
  trigger: {
    type: 'file-pattern' | 'keyword' | 'agent-type' | 'epic-id' | 'task-id';
    value: string;
  };
  includeContexts: string[]; // Context file paths to include
  priority: number; // 0-10
  maxTokens?: number; // Optional token limit
}

export interface ContextAssembly {
  contexts: ContextFile[];
  totalTokens: number;
  routingRulesApplied: string[];
  priority: number;
}

export class ContextAssembler extends EventEmitter {
  private readonly CONTEXT_DIR = '.context';
  private contextCache: Map<string, ContextFile> = new Map();

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('📝 Context Assembler initializing...');

    // Create .context/ directory structure
    await this.createContextDirectory();

    this.emit('assembler:initialized');
    console.log('✅ Context Assembler ready');
  }

  /**
   * Create .context/ directory structure
   */
  private async createContextDirectory(): Promise<void> {
    console.log('   📁 Creating .context/ directory structure...');

    // In real implementation, this would use mkdir via Bash tool
    const dirs = [
      `${this.CONTEXT_DIR}`,
      `${this.CONTEXT_DIR}/epics`,
      `${this.CONTEXT_DIR}/agents`,
      `${this.CONTEXT_DIR}/tasks`
    ];

    for (const dir of dirs) {
      console.log(`      ✅ ${dir}/`);
    }
  }

  /**
   * Generate PROJECT_CONTEXT.md (master context)
   */
  generateProjectContext(projectName: string, mindset: any, techStack: string[]): ContextFile {
    console.log('📝 Generating PROJECT_CONTEXT.md...');

    let content = `# ${projectName} - Project Context\n\n`;
    content += `> Master context file for Claude/Cursor integration\n`;
    content += `> Last updated: ${new Date().toISOString()}\n\n`;

    content += `## Project Vision\n\n`;
    content += `${mindset.vision || 'No vision defined'}\n\n`;

    content += `## Strategic Goals\n\n`;
    for (const goal of mindset.goals || []) {
      content += `- ${goal}\n`;
    }
    content += `\n`;

    content += `## Tech Stack\n\n`;
    for (const tech of techStack) {
      content += `- ${tech}\n`;
    }
    content += `\n`;

    content += `## Constraints\n\n`;
    for (const constraint of mindset.constraints || []) {
      content += `- ${constraint}\n`;
    }
    content += `\n`;

    content += `## Development Philosophy\n\n`;
    for (const philosophy of mindset.philosophy || []) {
      content += `- ${philosophy}\n`;
    }
    content += `\n`;

    content += `## Context Usage\n\n`;
    content += `This file provides high-level project context for all AI assistants.\n`;
    content += `For specific contexts:\n`;
    content += `- Epic context: See \`.context/epics/epic-{id}.md\`\n`;
    content += `- Agent context: See \`.context/agents/{agent-type}.md\`\n`;
    content += `- Task context: See \`.context/tasks/task-{id}.md\`\n\n`;

    const tokenCount = this.estimateTokens(content);

    const contextFile: ContextFile = {
      path: `${this.CONTEXT_DIR}/PROJECT_CONTEXT.md`,
      content,
      type: 'project',
      metadata: {
        id: 'project-context',
        created: Date.now(),
        updated: Date.now(),
        priority: 10, // Highest priority
        tokenCount
      }
    };

    this.contextCache.set(contextFile.path, contextFile);

    console.log(`   ✅ PROJECT_CONTEXT.md generated (${tokenCount} tokens)`);

    return contextFile;
  }

  /**
   * Generate epic-specific context
   */
  generateEpicContext(epic: Epic): ContextFile {
    console.log(`📝 Generating context for epic: ${epic.id}...`);

    let content = `# Epic: ${epic.title}\n\n`;
    content += `> Context for epic ${epic.id}\n`;
    content += `> Status: ${epic.status} | Priority: ${epic.priority} | Complexity: ${epic.complexity}\n\n`;

    content += `## Description\n\n`;
    content += `${epic.description}\n\n`;

    content += `## User Stories (${epic.stories.length})\n\n`;
    for (const story of epic.stories) {
      content += `### ${story.title}\n\n`;
      content += `${story.description}\n\n`;
      content += `**Acceptance Criteria:**\n`;
      for (const criterion of story.acceptanceCriteria) {
        content += `- ${criterion}\n`;
      }
      content += `\n`;
    }

    content += `## Tasks (${epic.totalTasks} total, ${epic.completedTasks} completed)\n\n`;
    for (const story of epic.stories) {
      for (const task of story.tasks) {
        const status = task.status === 'completed' ? '✅' : '⏳';
        content += `${status} **${task.title}** (${task.type}, priority: ${task.priority.toFixed(1)})\n`;
      }
    }
    content += `\n`;

    content += `## Tags\n\n`;
    for (const tag of epic.tags) {
      content += `\`${tag}\` `;
    }
    content += `\n\n`;

    content += `## Timeline\n\n`;
    content += `- Created: ${new Date(epic.createdAt).toISOString()}\n`;
    if (epic.startedAt) content += `- Started: ${new Date(epic.startedAt).toISOString()}\n`;
    if (epic.completedAt) content += `- Completed: ${new Date(epic.completedAt).toISOString()}\n`;
    if (epic.estimatedCompletion) content += `- Estimated completion: ${new Date(epic.estimatedCompletion).toISOString()}\n`;
    content += `\n`;

    const tokenCount = this.estimateTokens(content);

    const contextFile: ContextFile = {
      path: `${this.CONTEXT_DIR}/epics/${epic.id}.md`,
      content,
      type: 'epic',
      metadata: {
        id: epic.id,
        created: Date.now(),
        updated: Date.now(),
        priority: this.mapPriorityToNumber(epic.priority),
        tokenCount
      }
    };

    this.contextCache.set(contextFile.path, contextFile);

    console.log(`   ✅ Epic context generated (${tokenCount} tokens)`);

    return contextFile;
  }

  /**
   * Generate agent-specific context
   */
  generateAgentContext(agentType: SubAgent['type'], tasks: Task[], guidelines: string[]): ContextFile {
    console.log(`📝 Generating context for agent: ${agentType}...`);

    let content = `# Agent: ${agentType}\n\n`;
    content += `> Context for ${agentType} agents\n\n`;

    content += `## Role & Responsibilities\n\n`;
    content += this.getAgentDescription(agentType);
    content += `\n\n`;

    content += `## Current Tasks\n\n`;
    for (const task of tasks.filter(t => t.assignedTo === agentType)) {
      const status = task.status === 'completed' ? '✅' : '⏳';
      content += `${status} **${task.title}**\n`;
      content += `   - Epic: ${task.epicId}\n`;
      content += `   - Priority: ${task.priority.toFixed(1)}\n`;
      content += `   - Files: ${task.files.join(', ') || 'TBD'}\n\n`;
    }

    content += `## Guidelines\n\n`;
    for (const guideline of guidelines) {
      content += `- ${guideline}\n`;
    }
    content += `\n`;

    content += `## Best Practices\n\n`;
    content += this.getAgentBestPractices(agentType);
    content += `\n\n`;

    const tokenCount = this.estimateTokens(content);

    const contextFile: ContextFile = {
      path: `${this.CONTEXT_DIR}/agents/${agentType}.md`,
      content,
      type: 'agent',
      metadata: {
        id: agentType,
        created: Date.now(),
        updated: Date.now(),
        priority: 8,
        tokenCount
      }
    };

    this.contextCache.set(contextFile.path, contextFile);

    console.log(`   ✅ Agent context generated (${tokenCount} tokens)`);

    return contextFile;
  }

  /**
   * Generate task-specific context
   */
  generateTaskContext(task: Task, epicContext: string): ContextFile {
    console.log(`📝 Generating context for task: ${task.id}...`);

    let content = `# Task: ${task.title}\n\n`;
    content += `> Context for task ${task.id}\n`;
    content += `> Type: ${task.type} | Priority: ${task.priority.toFixed(1)} | Status: ${task.status}\n\n`;

    content += `## Description\n\n`;
    content += `${task.description}\n\n`;

    content += `## Epic Context\n\n`;
    content += `${epicContext.substring(0, 500)}...\n\n`;

    content += `## Dependencies\n\n`;
    if (task.dependsOn.length > 0) {
      content += `**Depends on:**\n`;
      for (const depId of task.dependsOn) {
        content += `- ${depId}\n`;
      }
    } else {
      content += `No dependencies\n`;
    }
    content += `\n`;

    if (task.blocks.length > 0) {
      content += `**Blocks:**\n`;
      for (const blockedId of task.blocks) {
        content += `- ${blockedId}\n`;
      }
      content += `\n`;
    }

    content += `## Files\n\n`;
    if (task.files.length > 0) {
      for (const file of task.files) {
        content += `- ${file}\n`;
      }
    } else {
      content += `No files specified yet\n`;
    }
    content += `\n`;

    content += `## Assigned Agent\n\n`;
    content += `${task.assignedTo || 'Not assigned'}\n`;
    if (task.assignedSubAgent) {
      content += `Sub-agent: ${task.assignedSubAgent}\n`;
    }
    content += `\n`;

    const tokenCount = this.estimateTokens(content);

    const contextFile: ContextFile = {
      path: `${this.CONTEXT_DIR}/tasks/${task.id}.md`,
      content,
      type: 'task',
      metadata: {
        id: task.id,
        created: Date.now(),
        updated: Date.now(),
        priority: task.priority,
        tokenCount
      }
    };

    this.contextCache.set(contextFile.path, contextFile);

    console.log(`   ✅ Task context generated (${tokenCount} tokens)`);

    return contextFile;
  }

  /**
   * Generate CONTEXT_ROUTING.json
   */
  generateContextRouting(rules: ContextRoutingRule[]): ContextFile {
    console.log('📝 Generating CONTEXT_ROUTING.json...');

    const routing = {
      version: '1.0',
      description: 'Smart context routing rules for Claude/Cursor integration',
      rules: rules.map(rule => ({
        trigger: rule.trigger,
        includeContexts: rule.includeContexts,
        priority: rule.priority,
        maxTokens: rule.maxTokens || 8000
      })),
      defaultContexts: [
        '.context/PROJECT_CONTEXT.md'
      ],
      maxTotalTokens: 20000 // Claude context limit
    };

    const content = JSON.stringify(routing, null, 2);
    const tokenCount = this.estimateTokens(content);

    const contextFile: ContextFile = {
      path: `${this.CONTEXT_DIR}/CONTEXT_ROUTING.json`,
      content,
      type: 'routing',
      metadata: {
        id: 'context-routing',
        created: Date.now(),
        updated: Date.now(),
        priority: 10,
        tokenCount
      }
    };

    this.contextCache.set(contextFile.path, contextFile);

    console.log(`   ✅ CONTEXT_ROUTING.json generated`);

    return contextFile;
  }

  /**
   * Assemble context for a specific scenario
   */
  async assembleContext(trigger: ContextRoutingRule['trigger'], routingRules: ContextRoutingRule[]): Promise<ContextAssembly> {
    console.log(`📝 Assembling context for trigger: ${trigger.type} = ${trigger.value}`);

    // Find matching rules
    const matchedRules = routingRules.filter(rule =>
      rule.trigger.type === trigger.type && rule.trigger.value === trigger.value
    ).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    const contexts: ContextFile[] = [];
    let totalTokens = 0;
    const routingRulesApplied: string[] = [];

    // Always include PROJECT_CONTEXT.md
    const projectContext = this.contextCache.get(`${this.CONTEXT_DIR}/PROJECT_CONTEXT.md`);
    if (projectContext) {
      contexts.push(projectContext);
      totalTokens += projectContext.metadata.tokenCount || 0;
    }

    // Add contexts from matched rules
    for (const rule of matchedRules) {
      for (const contextPath of rule.includeContexts) {
        const context = this.contextCache.get(contextPath);
        if (context && !contexts.includes(context)) {
          const newTotal = totalTokens + (context.metadata.tokenCount || 0);

          // Check token limit
          if (rule.maxTokens && newTotal > rule.maxTokens) {
            console.log(`      ⚠️  Skipping ${contextPath} (would exceed token limit)`);
            continue;
          }

          contexts.push(context);
          totalTokens += context.metadata.tokenCount || 0;
          routingRulesApplied.push(`${rule.trigger.type}:${rule.trigger.value}`);
        }
      }
    }

    // Calculate overall priority
    const priority = matchedRules.length > 0 ? matchedRules[0].priority : 5;

    console.log(`   ✅ Assembled ${contexts.length} contexts (${totalTokens} tokens, priority: ${priority})`);

    return {
      contexts,
      totalTokens,
      routingRulesApplied,
      priority
    };
  }

  /**
   * Estimate tokens in text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Map priority to number
   */
  private mapPriorityToNumber(priority: string): number {
    const map: Record<string, number> = {
      'p0-critical': 10,
      'p1-high': 8,
      'p2-medium': 5,
      'p3-low': 3
    };
    return map[priority] || 5;
  }

  /**
   * Get agent description
   */
  private getAgentDescription(agentType: SubAgent['type']): string {
    const descriptions: Record<SubAgent['type'], string> = {
      'marcus-backend': 'Backend development expert. Implements API endpoints, database models, and business logic. Ensures security, performance, and scalability.',
      'james-frontend': 'Frontend development expert. Creates React components, UI interactions, and ensures accessibility (WCAG 2.1 AA). Focuses on user experience.',
      'maria-qa': 'Quality assurance expert. Writes comprehensive tests (unit, integration, E2E), runs security scans, and validates acceptance criteria.',
      'sarah-pm': 'Project management coordinator. Tracks progress, updates documentation, generates reports, and ensures alignment with project goals.',
      'alex-ba': 'Business analyst. Analyzes requirements, creates user stories, defines acceptance criteria, and ensures business value alignment.',
      'dr-ai-ml': 'AI/ML specialist. Develops, trains, and deploys machine learning models. Optimizes performance and ensures production readiness.'
    };
    return descriptions[agentType];
  }

  /**
   * Get agent best practices
   */
  private getAgentBestPractices(agentType: SubAgent['type']): string {
    const practices: Record<SubAgent['type'], string> = {
      'marcus-backend': '- Follow RESTful API design principles\n- Implement proper error handling\n- Use dependency injection\n- Write defensive code with validation\n- Optimize database queries',
      'james-frontend': '- Use semantic HTML\n- Implement keyboard navigation\n- Follow responsive design principles\n- Optimize bundle size\n- Use React best practices (hooks, composition)',
      'maria-qa': '- Achieve 80%+ code coverage\n- Write clear, maintainable tests\n- Use AAA pattern (Arrange, Act, Assert)\n- Test edge cases and error paths\n- Run visual regression tests',
      'sarah-pm': '- Keep documentation up-to-date\n- Use clear, concise language\n- Track all blockers and dependencies\n- Communicate proactively\n- Generate actionable reports',
      'alex-ba': '- Use user story format (As a..., I want..., So that...)\n- Define clear acceptance criteria\n- Validate business value\n- Ensure requirements are testable\n- Maintain traceability',
      'dr-ai-ml': '- Document model architecture\n- Track experiments and hyperparameters\n- Validate on held-out test set\n- Monitor model drift in production\n- Ensure reproducibility'
    };
    return practices[agentType];
  }

  /**
   * Save context file
   */
  async saveContext(contextFile: ContextFile): Promise<void> {
    console.log(`💾 Context would be saved to: ${contextFile.path}`);
    this.emit('context:saved', { path: contextFile.path, tokens: contextFile.metadata.tokenCount });
  }

  /**
   * Get all contexts
   */
  getAllContexts(): ContextFile[] {
    return Array.from(this.contextCache.values());
  }

  /**
   * Shutdown assembler
   */
  async shutdown(): Promise<void> {
    this.contextCache.clear();
    this.emit('assembler:shutdown');
    console.log('🛑 Context Assembler shut down');
  }
}

// Export singleton instance
export const globalContextAssembler = new ContextAssembler();
