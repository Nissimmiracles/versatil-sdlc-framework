/**
 * VERSATIL SDLC Framework - Todo Scanner
 * Scans and analyzes todos/*.md files for open work and stale items
 */
import * as fs from 'fs/promises';
import * as path from 'path';
export class TodoScanner {
    constructor(options = {}) {
        this.todosDir = options.todosDir || path.join(process.cwd(), 'todos');
        this.staleThresholdDays = options.staleThresholdDays || 30;
        this.recentThresholdDays = options.recentThresholdDays || 7;
    }
    /**
     * Scan all todos and generate summary
     */
    async scanTodos(includeResolved = false) {
        try {
            // Get all todo files
            const files = await fs.readdir(this.todosDir);
            const todoFiles = files.filter(f => f.endsWith('.md') &&
                f !== 'README.md' &&
                f !== '000-pending-p1-TEMPLATE.md' &&
                (includeResolved || f.includes('pending')));
            // Parse all todos
            const todos = [];
            for (const file of todoFiles) {
                const todo = await this.parseTodoFile(file);
                if (todo) {
                    todos.push(todo);
                }
            }
            // Generate summary
            return this.generateSummary(todos);
        }
        catch (error) {
            console.warn('⚠️  Todo scan failed:', error.message);
            return this.getEmptySummary();
        }
    }
    /**
     * Parse a single todo file
     */
    async parseTodoFile(filename) {
        try {
            const filePath = path.join(this.todosDir, filename);
            const content = await fs.readFile(filePath, 'utf-8');
            // Parse filename: NNN-STATUS-PRIORITY-description.md
            const match = filename.match(/^(\d+)-(pending|resolved)-(p[1-4])-(.+)\.md$/);
            if (!match) {
                return null;
            }
            const [, number, status, priority, description] = match;
            // Extract metadata from file content
            const createdDate = this.extractCreatedDate(content);
            const assignedAgent = this.extractAssignedAgent(content);
            const estimatedEffort = this.extractEstimatedEffort(content);
            // Calculate age
            const stats = await fs.stat(filePath);
            const fileAge = createdDate
                ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                : Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
            return {
                filename,
                number,
                status: status,
                priority: priority,
                description: description.replace(/-/g, ' '),
                age: fileAge,
                createdDate,
                assignedAgent,
                estimatedEffort,
            };
        }
        catch (error) {
            console.warn(`Failed to parse ${filename}:`, error.message);
            return null;
        }
    }
    /**
     * Extract created date from file content
     */
    extractCreatedDate(content) {
        // Look for "Created: YYYY-MM-DD" pattern
        const match = content.match(/(?:Created|Date):\s*(\d{4}-\d{2}-\d{2})/i);
        if (match) {
            return new Date(match[1]);
        }
        return null;
    }
    /**
     * Extract assigned agent from file content
     */
    extractAssignedAgent(content) {
        // Look for "Assigned: Agent-Name" pattern
        const match = content.match(/Assigned:\s*([A-Z][a-zA-Z-]+)/);
        if (match) {
            return match[1];
        }
        // Also check for agent mentions in content
        const agents = ['Maria-QA', 'Marcus-Backend', 'James-Frontend', 'Dana-Database', 'Alex-BA', 'Sarah-PM', 'Dr.AI-ML', 'Oliver-MCP'];
        for (const agent of agents) {
            if (content.includes(agent)) {
                return agent;
            }
        }
        return null;
    }
    /**
     * Extract estimated effort from file content
     */
    extractEstimatedEffort(content) {
        // Look for "Estimated Effort: Small/Medium/Large" pattern
        const match = content.match(/Estimated Effort:\s*(Small|Medium|Large|XL)/i);
        if (match) {
            return match[1];
        }
        // Look for hour estimates
        const hourMatch = content.match(/Estimated:\s*(\d+)\s*hours?/i);
        if (hourMatch) {
            return `${hourMatch[1]}h`;
        }
        return null;
    }
    /**
     * Generate summary from parsed todos
     */
    generateSummary(todos) {
        const pending = todos.filter(t => t.status === 'pending');
        const resolved = todos.filter(t => t.status === 'resolved');
        // Count by priority
        const byPriority = {
            p1: pending.filter(t => t.priority === 'p1').length,
            p2: pending.filter(t => t.priority === 'p2').length,
            p3: pending.filter(t => t.priority === 'p3').length,
            p4: pending.filter(t => t.priority === 'p4').length,
        };
        // Count by agent
        const byAgent = {};
        pending.forEach(todo => {
            if (todo.assignedAgent) {
                byAgent[todo.assignedAgent] = (byAgent[todo.assignedAgent] || 0) + 1;
            }
        });
        // Identify stale and recent
        const stale = pending.filter(t => t.age > this.staleThresholdDays);
        const recent = pending.filter(t => t.age < this.recentThresholdDays);
        // Find oldest and newest pending
        const sortedPending = [...pending].sort((a, b) => b.age - a.age);
        const oldestPending = sortedPending[0] || null;
        const newestPending = sortedPending[sortedPending.length - 1] || null;
        return {
            total: todos.length,
            pending: pending.length,
            resolved: resolved.length,
            byPriority,
            byAgent,
            stale,
            recent,
            oldestPending,
            newestPending,
        };
    }
    /**
     * Get empty summary (fallback)
     */
    getEmptySummary() {
        return {
            total: 0,
            pending: 0,
            resolved: 0,
            byPriority: { p1: 0, p2: 0, p3: 0, p4: 0 },
            byAgent: {},
            stale: [],
            recent: [],
            oldestPending: null,
            newestPending: null,
        };
    }
    /**
     * Get detailed todo information
     */
    async getTodoDetails(number) {
        try {
            const files = await fs.readdir(this.todosDir);
            const todoFile = files.find(f => f.startsWith(`${number.padStart(3, '0')}-`));
            if (!todoFile) {
                return null;
            }
            return this.parseTodoFile(todoFile);
        }
        catch {
            return null;
        }
    }
    /**
     * Get todos by priority
     */
    async getTodosByPriority(priority) {
        const summary = await this.scanTodos(false);
        const todos = [...summary.stale, ...summary.recent];
        return todos.filter(t => t.priority === priority);
    }
    /**
     * Get todos by agent
     */
    async getTodosByAgent(agentName) {
        try {
            const files = await fs.readdir(this.todosDir);
            const todoFiles = files.filter(f => f.includes('pending'));
            const todos = [];
            for (const file of todoFiles) {
                const todo = await this.parseTodoFile(file);
                if (todo && todo.assignedAgent === agentName) {
                    todos.push(todo);
                }
            }
            return todos;
        }
        catch {
            return [];
        }
    }
    /**
     * Format summary for console output
     */
    formatSummary(summary) {
        const lines = [];
        lines.push('');
        lines.push(`## 📝 Open Todos: ${summary.pending} pending`);
        lines.push('');
        if (summary.byPriority.p1 > 0) {
            lines.push(`### Critical (P1): ${summary.byPriority.p1} items`);
            summary.stale.concat(summary.recent)
                .filter(t => t.priority === 'p1')
                .slice(0, 5)
                .forEach(todo => {
                lines.push(`- ${todo.filename} (Age: ${todo.age} days)`);
            });
            lines.push('');
        }
        if (summary.byPriority.p2 > 0) {
            lines.push(`### High (P2): ${summary.byPriority.p2} items`);
            summary.stale.concat(summary.recent)
                .filter(t => t.priority === 'p2')
                .slice(0, 5)
                .forEach(todo => {
                lines.push(`- ${todo.filename} (Age: ${todo.age} days)`);
            });
            lines.push('');
        }
        if (summary.stale.length > 0) {
            lines.push(`**Stale Todos**: ${summary.stale.length} items >${this.staleThresholdDays} days old`);
            lines.push('');
        }
        if (Object.keys(summary.byAgent).length > 0) {
            lines.push('**By Agent**:');
            Object.entries(summary.byAgent)
                .sort(([, a], [, b]) => b - a)
                .forEach(([agent, count]) => {
                lines.push(`  - ${agent}: ${count} pending`);
            });
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Format recommendations based on summary
     */
    formatRecommendations(summary) {
        const recommendations = [];
        if (summary.stale.length > 0) {
            recommendations.push(`Review ${summary.stale.length} stale todos (>${this.staleThresholdDays} days old): /resolve "${summary.stale.map(t => t.number).join('|')}"`);
        }
        if (summary.byPriority.p1 > 0) {
            recommendations.push(`Work on ${summary.byPriority.p1} critical (P1) todos: Start with ${summary.oldestPending?.filename || 'oldest item'}`);
        }
        if (summary.byPriority.p2 > 5) {
            recommendations.push(`High backlog: ${summary.byPriority.p2} P2 todos pending. Consider prioritizing or delegating.`);
        }
        return recommendations;
    }
    /**
     * Export summary to JSON
     */
    async exportSummaryToJSON(outputPath) {
        const summary = await this.scanTodos(true); // Include resolved
        const output = {
            generated: new Date().toISOString(),
            summary,
            todos: [...summary.stale, ...summary.recent],
        };
        const json = JSON.stringify(output, null, 2);
        if (outputPath) {
            await fs.writeFile(outputPath, json);
        }
        return json;
    }
}
/**
 * Default todo scanner instance
 */
export const defaultTodoScanner = new TodoScanner();
//# sourceMappingURL=todo-scanner.js.map