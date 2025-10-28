/**
 * Three-Tier Status Tracker
 *
 * Monitors progress across backend, database, and frontend layers
 * Provides recommendations for each tier
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class ThreeTierStatusTracker {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
    }
    /**
     * Get comprehensive three-tier status
     */
    async getStatus() {
        const [backendStatus, databaseStatus, frontendStatus] = await Promise.all([
            this.getBackendStatus(),
            this.getDatabaseStatus(),
            this.getFrontendStatus()
        ]);
        // Calculate overall progress
        const overallProgress = Math.round((backendStatus.progress + databaseStatus.progress + frontendStatus.progress) / 3);
        // Check if tiers are balanced (no tier more than 30% ahead/behind average)
        const progressValues = [backendStatus.progress, databaseStatus.progress, frontendStatus.progress];
        const maxDiff = Math.max(...progressValues) - Math.min(...progressValues);
        const balanced = maxDiff <= 30;
        let message = '';
        if (balanced) {
            message = 'All tiers progressing evenly';
        }
        else {
            // Identify lagging tier
            const minProgress = Math.min(...progressValues);
            if (backendStatus.progress === minProgress) {
                message = 'Backend tier lagging - prioritize Marcus-Backend tasks';
            }
            else if (databaseStatus.progress === minProgress) {
                message = 'Database tier lagging - prioritize Dana-Database tasks';
            }
            else {
                message = 'Frontend tier lagging - prioritize James-Frontend tasks';
            }
        }
        return {
            backend: backendStatus,
            database: databaseStatus,
            frontend: frontendStatus,
            overall: {
                progress: overallProgress,
                balanced,
                message
            }
        };
    }
    /**
     * Get backend status (Marcus-Backend)
     */
    async getBackendStatus() {
        const todos = await this.getTodosByTier('backend');
        const completed = todos.filter(t => t.status === 'completed').length;
        const total = todos.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        // Find next task
        const nextTask = todos.find(t => t.status === 'pending' || t.status === 'in_progress');
        const next = nextTask ? nextTask.description : 'No pending backend tasks';
        // Check for API files
        const apiFiles = await this.findFiles('**/{api,routes,controllers,services}/**/*.{ts,js}');
        const hasApi = apiFiles.length > 0;
        // Check for tests
        const testFiles = await this.findFiles('**/*.{test,spec}.{ts,js}');
        const backendTests = testFiles.filter(f => f.includes('/api/') || f.includes('/backend/') || f.includes('/server/'));
        // Generate recommendation
        let recommendation = '';
        const blockers = [];
        if (!hasApi) {
            recommendation = 'Create API structure (routes, controllers, services)';
            blockers.push('No API structure found');
        }
        else if (backendTests.length === 0) {
            recommendation = 'Add backend tests for API endpoints';
        }
        else if (progress < 50) {
            recommendation = 'Focus on completing core API endpoints';
        }
        else if (progress < 80) {
            recommendation = 'Add error handling and validation';
        }
        else {
            recommendation = 'Polish API documentation and edge cases';
        }
        // Determine health
        let health;
        if (blockers.length > 0) {
            health = 'blocked';
        }
        else if (progress >= 80) {
            health = 'excellent';
        }
        else if (progress >= 50) {
            health = 'good';
        }
        else {
            health = 'needs_attention';
        }
        return {
            progress,
            completed,
            total,
            next,
            recommendation,
            health,
            blockers: blockers.length > 0 ? blockers : undefined
        };
    }
    /**
     * Get database status (Dana-Database)
     */
    async getDatabaseStatus() {
        const todos = await this.getTodosByTier('database');
        const completed = todos.filter(t => t.status === 'completed').length;
        const total = todos.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        // Find next task
        const nextTask = todos.find(t => t.status === 'pending' || t.status === 'in_progress');
        const next = nextTask ? nextTask.description : 'No pending database tasks';
        // Check for database files
        const migrationFiles = await this.findFiles('**/{migrations,supabase/migrations}/**/*.sql');
        const schemaFiles = await this.findFiles('**/{schema,prisma}/**/*.{prisma,sql}');
        const hasMigrations = migrationFiles.length > 0;
        const hasSchema = schemaFiles.length > 0;
        // Check for RLS policies (Supabase)
        let hasRLS = false;
        for (const file of migrationFiles) {
            const content = await this.readFile(file);
            if (content.toLowerCase().includes('create policy') || content.toLowerCase().includes('enable row level security')) {
                hasRLS = true;
                break;
            }
        }
        // Generate recommendation
        let recommendation = '';
        const blockers = [];
        if (!hasSchema && !hasMigrations) {
            recommendation = 'Create database schema and initial migrations';
            blockers.push('No database schema found');
        }
        else if (!hasRLS && migrationFiles.some(f => f.includes('supabase'))) {
            recommendation = 'Add Row Level Security (RLS) policies for multi-tenant support';
        }
        else if (progress < 50) {
            recommendation = 'Complete core tables and relationships';
        }
        else if (progress < 80) {
            recommendation = 'Add indexes for query optimization';
        }
        else {
            recommendation = 'Review and optimize query performance';
        }
        // Determine health
        let health;
        if (blockers.length > 0) {
            health = 'blocked';
        }
        else if (progress >= 80) {
            health = 'excellent';
        }
        else if (progress >= 50) {
            health = 'good';
        }
        else {
            health = 'needs_attention';
        }
        return {
            progress,
            completed,
            total,
            next,
            recommendation,
            health,
            blockers: blockers.length > 0 ? blockers : undefined
        };
    }
    /**
     * Get frontend status (James-Frontend)
     */
    async getFrontendStatus() {
        const todos = await this.getTodosByTier('frontend');
        const completed = todos.filter(t => t.status === 'completed').length;
        const total = todos.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        // Find next task
        const nextTask = todos.find(t => t.status === 'pending' || t.status === 'in_progress');
        const next = nextTask ? nextTask.description : 'No pending frontend tasks';
        // Check for component files
        const componentFiles = await this.findFiles('**/{components,src}/**/*.{tsx,jsx,vue}');
        const hasComponents = componentFiles.length > 0;
        // Check for styling
        const styleFiles = await this.findFiles('**/*.{css,scss,sass,tailwind}');
        const hasStyles = styleFiles.length > 0;
        // Check for frontend tests
        const testFiles = await this.findFiles('**/*.{test,spec}.{tsx,jsx}');
        const hasFrontendTests = testFiles.length > 0;
        // Generate recommendation
        let recommendation = '';
        const blockers = [];
        if (!hasComponents) {
            recommendation = 'Create component structure and base components';
            blockers.push('No frontend components found');
        }
        else if (!hasStyles) {
            recommendation = 'Add styling system (Tailwind, CSS modules, etc.)';
        }
        else if (!hasFrontendTests) {
            recommendation = 'Add component tests with React Testing Library';
        }
        else if (progress < 50) {
            recommendation = 'Complete core UI components';
        }
        else if (progress < 80) {
            recommendation = 'Add accessibility (WCAG 2.1 AA) and responsive design';
        }
        else {
            recommendation = 'Optimize bundle size and performance';
        }
        // Determine health
        let health;
        if (blockers.length > 0) {
            health = 'blocked';
        }
        else if (progress >= 80) {
            health = 'excellent';
        }
        else if (progress >= 50) {
            health = 'good';
        }
        else {
            health = 'needs_attention';
        }
        return {
            progress,
            completed,
            total,
            next,
            recommendation,
            health,
            blockers: blockers.length > 0 ? blockers : undefined
        };
    }
    /**
     * Get todos by tier from todos/*.md files
     */
    async getTodosByTier(tier) {
        const todosDir = path.join(this.projectRoot, 'todos');
        try {
            await fs.access(todosDir);
        }
        catch {
            // No todos directory yet
            return [];
        }
        const files = await fs.readdir(todosDir);
        const todoFiles = files.filter(f => f.endsWith('.md'));
        const todos = [];
        for (const file of todoFiles) {
            const content = await fs.readFile(path.join(todosDir, file), 'utf-8');
            // Extract tier from filename (e.g., "001-backend-api.md")
            let fileTier = 'other';
            if (file.includes('backend') || file.includes('api') || file.includes('marcus')) {
                fileTier = 'backend';
            }
            else if (file.includes('database') || file.includes('db') || file.includes('dana')) {
                fileTier = 'database';
            }
            else if (file.includes('frontend') || file.includes('ui') || file.includes('james')) {
                fileTier = 'frontend';
            }
            // Skip if not matching requested tier
            if (fileTier !== tier) {
                continue;
            }
            // Parse markdown for task status
            const lines = content.split('\n');
            for (const line of lines) {
                // Look for checkbox items: - [ ] task or - [x] task
                const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
                if (match) {
                    const isCompleted = match[1].toLowerCase() === 'x';
                    const description = match[2].trim();
                    todos.push({
                        id: `${file}-${todos.length}`,
                        tier: fileTier,
                        status: isCompleted ? 'completed' : 'pending',
                        description
                    });
                }
            }
        }
        return todos;
    }
    /**
     * Find files matching glob pattern
     */
    async findFiles(pattern) {
        try {
            const { stdout } = await execAsync(`find . -path "./${pattern}" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null || true`);
            return stdout.trim().split('\n').filter(Boolean);
        }
        catch {
            return [];
        }
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch {
            return '';
        }
    }
    /**
     * Generate ASCII art progress bar for tier
     */
    generateProgressBar(tier, width = 30) {
        const filled = Math.round((tier.progress / 100) * width);
        const empty = width - filled;
        let emoji = '';
        if (tier.health === 'excellent') {
            emoji = '✅';
        }
        else if (tier.health === 'good') {
            emoji = '🟢';
        }
        else if (tier.health === 'needs_attention') {
            emoji = '🟡';
        }
        else {
            emoji = '🔴';
        }
        return `${emoji} ${'█'.repeat(filled)}${'░'.repeat(empty)} ${tier.progress}%`;
    }
    /**
     * Get status summary as text
     */
    async getStatusSummary() {
        const status = await this.getStatus();
        let output = '🏗️  Three-Tier Architecture Status:\n\n';
        output += `💻 Backend (Marcus): ${this.generateProgressBar(status.backend)}\n`;
        output += `   Next: ${status.backend.next}\n`;
        output += `   💡 ${status.backend.recommendation}\n`;
        if (status.backend.blockers) {
            output += `   ⚠️ Blockers: ${status.backend.blockers.join(', ')}\n`;
        }
        output += '\n';
        output += `🗄️  Database (Dana): ${this.generateProgressBar(status.database)}\n`;
        output += `   Next: ${status.database.next}\n`;
        output += `   💡 ${status.database.recommendation}\n`;
        if (status.database.blockers) {
            output += `   ⚠️ Blockers: ${status.database.blockers.join(', ')}\n`;
        }
        output += '\n';
        output += `🎨 Frontend (James): ${this.generateProgressBar(status.frontend)}\n`;
        output += `   Next: ${status.frontend.next}\n`;
        output += `   💡 ${status.frontend.recommendation}\n`;
        if (status.frontend.blockers) {
            output += `   ⚠️ Blockers: ${status.frontend.blockers.join(', ')}\n`;
        }
        output += '\n';
        output += `📊 Overall: ${status.overall.progress}% complete\n`;
        output += `   ${status.overall.balanced ? '✅' : '⚠️'} ${status.overall.message}\n`;
        return output;
    }
}
// Export singleton instance
let _trackerInstance = null;
export function getThreeTierStatusTracker(projectRoot) {
    if (!_trackerInstance) {
        _trackerInstance = new ThreeTierStatusTracker(projectRoot);
    }
    return _trackerInstance;
}
//# sourceMappingURL=three-tier-status-tracker.js.map