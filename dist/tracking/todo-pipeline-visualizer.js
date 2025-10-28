/**
 * Todo Pipeline Visualizer
 *
 * Creates ASCII art pipeline/Gantt chart visualization of todos
 * Supports:
 * - Task dependencies (depends_on)
 * - Parallel execution opportunities
 * - Timeline estimation
 * - Progress tracking
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
import { promises as fs } from 'fs';
import * as path from 'path';
export class TodoPipelineVisualizer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.todosDir = path.join(this.projectRoot, 'todos');
    }
    /**
     * Load all todos from todos/*.md files
     */
    async loadTodos() {
        try {
            await fs.access(this.todosDir);
        }
        catch {
            // No todos directory
            return [];
        }
        const files = await fs.readdir(this.todosDir);
        const todoFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
        const tasks = [];
        for (const file of todoFiles) {
            const content = await fs.readFile(path.join(this.todosDir, file), 'utf-8');
            const fileTasks = this.parseTodoFile(file, content);
            tasks.push(...fileTasks);
        }
        return tasks;
    }
    /**
     * Parse todo markdown file
     */
    parseTodoFile(filename, content) {
        const tasks = [];
        const lines = content.split('\n');
        // Extract priority from filename (e.g., "001-pending-p1-feature.md")
        const priorityMatch = filename.match(/-p([123])-/i);
        const filePriority = priorityMatch
            ? priorityMatch[1] === '1'
                ? 'high'
                : priorityMatch[1] === '2'
                    ? 'medium'
                    : 'low'
            : 'medium';
        // Extract agent from filename
        let assignedAgent;
        if (filename.includes('backend') || filename.includes('marcus')) {
            assignedAgent = 'Marcus-Backend';
        }
        else if (filename.includes('frontend') || filename.includes('james')) {
            assignedAgent = 'James-Frontend';
        }
        else if (filename.includes('database') || filename.includes('dana')) {
            assignedAgent = 'Dana-Database';
        }
        else if (filename.includes('qa') || filename.includes('maria')) {
            assignedAgent = 'Maria-QA';
        }
        else if (filename.includes('pm') || filename.includes('sarah')) {
            assignedAgent = 'Sarah-PM';
        }
        let currentSection = '';
        let taskId = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Section headers
            if (line.startsWith('# ')) {
                currentSection = line.substring(2);
                continue;
            }
            // Checkbox items: - [ ] task or - [x] task
            const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
            if (match) {
                const isCompleted = match[1].toLowerCase() === 'x';
                const taskText = match[2].trim();
                // Extract dependencies from task text
                // Format: "Task description (depends on: TASK-1, TASK-2)"
                const dependsMatch = taskText.match(/\(depends on:\s*([^)]+)\)/i);
                const dependsOn = dependsMatch
                    ? dependsMatch[1].split(',').map(d => d.trim())
                    : undefined;
                // Extract estimate from task text
                // Format: "Task description (est: 30m)" or "(est: 2h)"
                const estimateMatch = taskText.match(/\(est:\s*(\d+)(m|h)\)/i);
                let estimatedMinutes;
                if (estimateMatch) {
                    const value = parseInt(estimateMatch[1]);
                    const unit = estimateMatch[2].toLowerCase();
                    estimatedMinutes = unit === 'h' ? value * 60 : value;
                }
                // Clean task description (remove metadata)
                const cleanDescription = taskText
                    .replace(/\(depends on:[^)]+\)/gi, '')
                    .replace(/\(est:\s*\d+(m|h)\)/gi, '')
                    .trim();
                tasks.push({
                    id: `${filename.replace('.md', '')}-${taskId++}`,
                    title: cleanDescription.substring(0, 50),
                    description: cleanDescription,
                    status: isCompleted ? 'completed' : 'pending',
                    priority: filePriority,
                    assignedAgent,
                    estimatedMinutes,
                    dependsOn,
                    tags: this.extractTags(filename, cleanDescription),
                    createdAt: new Date() // TODO: Get from file metadata
                });
            }
        }
        return tasks;
    }
    /**
     * Extract tags from filename and description
     */
    extractTags(filename, description) {
        const tags = [];
        // From filename
        if (filename.includes('backend'))
            tags.push('backend');
        if (filename.includes('frontend'))
            tags.push('frontend');
        if (filename.includes('database'))
            tags.push('database');
        if (filename.includes('api'))
            tags.push('api');
        if (filename.includes('ui'))
            tags.push('ui');
        // From description (lowercase)
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('test'))
            tags.push('testing');
        if (lowerDesc.includes('security'))
            tags.push('security');
        if (lowerDesc.includes('performance'))
            tags.push('performance');
        if (lowerDesc.includes('accessibility'))
            tags.push('accessibility');
        if (lowerDesc.includes('documentation') || lowerDesc.includes('docs')) {
            tags.push('documentation');
        }
        return [...new Set(tags)]; // Remove duplicates
    }
    /**
     * Analyze pipeline and identify parallel opportunities
     */
    async analyzePipeline() {
        const tasks = await this.loadTodos();
        // Build dependency graph
        const graph = this.buildDependencyGraph(tasks);
        // Find parallel groups (tasks with no dependencies between them)
        const parallelGroups = this.findParallelGroups(tasks, graph);
        // Find critical path (longest dependency chain)
        const criticalPath = this.findCriticalPath(tasks, graph);
        // Calculate time estimates
        const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
        const completedMinutes = tasks
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
        const remainingMinutes = totalEstimatedMinutes - completedMinutes;
        return {
            tasks,
            parallelGroups,
            criticalPath,
            totalEstimatedMinutes,
            completedMinutes,
            remainingMinutes
        };
    }
    /**
     * Build dependency graph
     */
    buildDependencyGraph(tasks) {
        const graph = new Map();
        for (const task of tasks) {
            if (!graph.has(task.id)) {
                graph.set(task.id, new Set());
            }
            if (task.dependsOn) {
                for (const depId of task.dependsOn) {
                    if (!graph.has(depId)) {
                        graph.set(depId, new Set());
                    }
                    graph.get(depId).add(task.id);
                }
            }
        }
        return graph;
    }
    /**
     * Find tasks that can run in parallel
     */
    findParallelGroups(tasks, graph) {
        const groups = [];
        const processed = new Set();
        // Group tasks by dependency level
        const levels = [];
        const getLevel = (taskId, visited = new Set()) => {
            if (visited.has(taskId))
                return 0; // Cycle detection
            visited.add(taskId);
            const task = tasks.find(t => t.id === taskId);
            if (!task || !task.dependsOn || task.dependsOn.length === 0) {
                return 0;
            }
            const depLevels = task.dependsOn.map(depId => getLevel(depId, new Set(visited)));
            return Math.max(...depLevels) + 1;
        };
        for (const task of tasks) {
            if (task.status === 'completed')
                continue;
            const level = getLevel(task.id);
            if (!levels[level])
                levels[level] = [];
            levels[level].push(task.id);
        }
        // Each level can run in parallel
        for (const level of levels) {
            if (level && level.length > 1) {
                groups.push(level);
            }
        }
        return groups;
    }
    /**
     * Find critical path (longest dependency chain)
     */
    findCriticalPath(tasks, graph) {
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        let longestPath = [];
        let longestDuration = 0;
        const findPath = (taskId, currentPath = []) => {
            const task = taskMap.get(taskId);
            if (!task)
                return;
            const newPath = [...currentPath, taskId];
            const duration = newPath.reduce((sum, id) => sum + (taskMap.get(id)?.estimatedMinutes || 0), 0);
            if (duration > longestDuration) {
                longestDuration = duration;
                longestPath = newPath;
            }
            const dependents = graph.get(taskId);
            if (dependents) {
                for (const depId of dependents) {
                    findPath(depId, newPath);
                }
            }
        };
        // Start from tasks with no dependencies
        for (const task of tasks) {
            if (!task.dependsOn || task.dependsOn.length === 0) {
                findPath(task.id);
            }
        }
        return longestPath;
    }
    /**
     * Generate ASCII Gantt chart
     */
    async generateGanttChart(width = 80) {
        const pipeline = await this.analyzePipeline();
        const { tasks, criticalPath } = pipeline;
        if (tasks.length === 0) {
            return {
                ascii: 'No tasks found',
                width,
                height: 1,
                timeScale: 'minutes'
            };
        }
        // Determine time scale
        const maxMinutes = Math.max(...tasks.map(t => t.estimatedMinutes || 0));
        const timeScale = maxMinutes > 1440 ? 'days' : maxMinutes > 120 ? 'hours' : 'minutes';
        // Build ASCII chart
        const lines = [];
        // Header
        lines.push('┌' + '─'.repeat(width - 2) + '┐');
        lines.push('│' + ' '.repeat(width - 2) + '│');
        lines.push('│' +
            this.centerText('TODO PIPELINE GANTT CHART', width - 2) +
            '│');
        lines.push('│' + ' '.repeat(width - 2) + '│');
        lines.push('├' + '─'.repeat(width - 2) + '┤');
        // Timeline header
        const timelineWidth = Math.floor((width - 30) / 2);
        const timeHeader = this.generateTimelineHeader(pipeline.totalEstimatedMinutes, timelineWidth, timeScale);
        lines.push('│ ' + this.padRight('Task', 25) + ' │ ' + timeHeader + ' │');
        lines.push('├' + '─'.repeat(width - 2) + '┤');
        // Task rows
        const tasksByLevel = this.groupTasksByLevel(tasks);
        for (const level of tasksByLevel) {
            for (const task of level) {
                const taskLine = this.generateTaskRow(task, criticalPath, timelineWidth, pipeline);
                lines.push(taskLine);
            }
            // Separator between levels
            if (level !== tasksByLevel[tasksByLevel.length - 1]) {
                lines.push('├' + '─'.repeat(width - 2) + '┤');
            }
        }
        // Footer
        lines.push('└' + '─'.repeat(width - 2) + '┘');
        // Summary
        lines.push('');
        lines.push(`📊 Total: ${pipeline.totalEstimatedMinutes} min | ✅ Completed: ${pipeline.completedMinutes} min | ⏳ Remaining: ${pipeline.remainingMinutes} min`);
        lines.push(`⚡ Parallel Groups: ${pipeline.parallelGroups.length} | 🎯 Critical Path: ${criticalPath.length} tasks`);
        return {
            ascii: lines.join('\n'),
            width,
            height: lines.length,
            timeScale
        };
    }
    /**
     * Generate timeline header
     */
    generateTimelineHeader(totalMinutes, width, scale) {
        const markers = [];
        const interval = Math.ceil(totalMinutes / 5);
        for (let i = 0; i <= 5; i++) {
            const minutes = i * interval;
            let label = '';
            if (scale === 'days') {
                label = `${Math.round(minutes / 1440)}d`;
            }
            else if (scale === 'hours') {
                label = `${Math.round(minutes / 60)}h`;
            }
            else {
                label = `${minutes}m`;
            }
            markers.push(label);
        }
        const spacing = Math.floor(width / markers.length);
        return markers.map(m => this.padRight(m, spacing)).join('');
    }
    /**
     * Generate task row
     */
    generateTaskRow(task, criticalPath, timelineWidth, pipeline) {
        // Task name with status icon
        const statusIcon = this.getStatusIcon(task.status);
        const priorityIcon = this.getPriorityIcon(task.priority);
        const isCritical = criticalPath.includes(task.id);
        const criticalIcon = isCritical ? '🎯' : '  ';
        const taskName = this.truncate(task.title, 18);
        const taskLabel = `${statusIcon} ${priorityIcon} ${criticalIcon} ${taskName}`;
        // Timeline bar
        const bar = this.generateTimelineBar(task, timelineWidth, pipeline.totalEstimatedMinutes);
        return `│ ${this.padRight(taskLabel, 25)} │ ${bar} │`;
    }
    /**
     * Generate timeline bar for task
     */
    generateTimelineBar(task, width, totalMinutes) {
        const duration = task.estimatedMinutes || 0;
        const barLength = Math.max(1, Math.floor((duration / totalMinutes) * width));
        let char = '';
        if (task.status === 'completed') {
            char = '█';
        }
        else if (task.status === 'in_progress') {
            char = '▓';
        }
        else if (task.status === 'blocked') {
            char = '░';
        }
        else {
            char = '─';
        }
        const bar = char.repeat(barLength);
        return this.padRight(bar, width);
    }
    /**
     * Group tasks by dependency level
     */
    groupTasksByLevel(tasks) {
        const levels = [];
        const getLevel = (task, visited = new Set()) => {
            if (visited.has(task.id))
                return 0;
            visited.add(task.id);
            if (!task.dependsOn || task.dependsOn.length === 0) {
                return 0;
            }
            const depLevels = task.dependsOn.map(depId => {
                const depTask = tasks.find(t => t.id === depId);
                return depTask ? getLevel(depTask, new Set(visited)) : 0;
            });
            return Math.max(...depLevels) + 1;
        };
        for (const task of tasks) {
            const level = getLevel(task);
            if (!levels[level])
                levels[level] = [];
            levels[level].push(task);
        }
        return levels.filter(Boolean);
    }
    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            completed: '✅',
            in_progress: '🔄',
            pending: '⏸️',
            blocked: '🔴'
        };
        return icons[status] || '❓';
    }
    /**
     * Get priority icon
     */
    getPriorityIcon(priority) {
        const icons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };
        return icons[priority] || '⚪';
    }
    /**
     * Utility: Center text
     */
    centerText(text, width) {
        const padding = Math.max(0, width - text.length);
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    }
    /**
     * Utility: Pad right
     */
    padRight(text, width) {
        return text + ' '.repeat(Math.max(0, width - text.length));
    }
    /**
     * Utility: Truncate text
     */
    truncate(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
}
// Export singleton instance
let _visualizerInstance = null;
export function getTodoPipelineVisualizer(projectRoot) {
    if (!_visualizerInstance) {
        _visualizerInstance = new TodoPipelineVisualizer(projectRoot);
    }
    return _visualizerInstance;
}
//# sourceMappingURL=todo-pipeline-visualizer.js.map