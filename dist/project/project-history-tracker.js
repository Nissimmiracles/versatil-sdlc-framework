/**
 * VERSATIL SDLC Framework - Project History Tracker
 *
 * Automatic event tracking when agents complete work
 * Part of Layer 2 (Project Context) - Task 3
 *
 * Features:
 * - Auto-track when agents finish features
 * - Auto-track architecture decisions
 * - Hook into agent completion events
 * - Timeline visualization helpers
 */
import { EventEmitter } from 'events';
import { projectVisionManager } from './project-vision-manager.js';
// ==================== PROJECT HISTORY TRACKER ====================
export class ProjectHistoryTracker extends EventEmitter {
    constructor() {
        super();
        this.activeProjectId = null;
        this.sessionStartTimes = new Map();
        this.setupAgentListeners();
    }
    /**
     * Set the active project for tracking
     */
    setActiveProject(projectId) {
        this.activeProjectId = projectId;
        console.log(`📊 Project history tracking enabled for: ${projectId}`);
    }
    /**
     * Get the active project ID
     */
    getActiveProject() {
        return this.activeProjectId;
    }
    /**
     * Setup listeners for agent completion events
     * This hooks into the RAGEnabledAgent EventEmitter
     */
    setupAgentListeners() {
        // Listen for agent activation events
        // These will be emitted by agents when they complete work
        this.on('agent:completed', async (event) => {
            await this.handleAgentCompletion(event);
        });
        this.on('agent:decision', async (decision) => {
            await this.handleArchitectureDecision(decision);
        });
        this.on('feature:completed', async (feature) => {
            await this.handleFeatureCompletion(feature);
        });
    }
    /**
     * Track agent completion event
     */
    async trackAgentCompletion(event) {
        this.emit('agent:completed', event);
    }
    /**
     * Track architecture decision
     */
    async trackArchitectureDecision(decision) {
        this.emit('agent:decision', decision);
    }
    /**
     * Track feature completion
     */
    async trackFeatureCompletion(feature) {
        this.emit('feature:completed', feature);
    }
    /**
     * Handle agent completion event
     */
    async handleAgentCompletion(event) {
        if (!event.projectId) {
            console.warn('⚠️ Agent completion event missing projectId, using active project');
            event.projectId = this.activeProjectId || 'default';
        }
        try {
            // Determine event type based on agent response
            const eventType = this.inferEventType(event);
            // Create project event
            const projectEvent = {
                type: eventType,
                description: this.generateEventDescription(event),
                impact: this.generateImpactDescription(event),
                agent: event.agentId,
                metadata: {
                    action: event.action,
                    duration: event.duration,
                    priority: event.result.priority,
                    filePaths: event.filePaths,
                    suggestions: event.result.suggestions?.length || 0,
                    ...event.metadata
                }
            };
            // Track to project vision manager
            await projectVisionManager.trackEvent(event.projectId, projectEvent);
            console.log(`✅ Tracked ${eventType} event for ${event.agentId} in project ${event.projectId}`);
        }
        catch (error) {
            console.error('❌ Failed to handle agent completion:', error.message);
        }
    }
    /**
     * Handle architecture decision
     */
    async handleArchitectureDecision(decision) {
        const projectId = this.activeProjectId || 'default';
        try {
            // Track as decision in project vision manager
            await projectVisionManager.storeDecision(projectId, {
                decision: decision.decision,
                rationale: decision.rationale,
                alternatives: decision.alternatives,
                consequences: decision.consequences,
                decidedBy: decision.decidedBy
            });
            // Also track as architecture_changed event
            await projectVisionManager.trackEvent(projectId, {
                type: 'architecture_changed',
                description: decision.decision,
                impact: decision.rationale,
                agent: decision.decidedBy,
                metadata: {
                    affectedComponents: decision.affectedComponents,
                    alternatives: decision.alternatives
                }
            });
            console.log(`✅ Tracked architecture decision: ${decision.decision}`);
        }
        catch (error) {
            console.error('❌ Failed to handle architecture decision:', error.message);
        }
    }
    /**
     * Handle feature completion
     */
    async handleFeatureCompletion(feature) {
        const projectId = this.activeProjectId || 'default';
        try {
            await projectVisionManager.trackEvent(projectId, {
                type: 'feature_added',
                description: feature.featureName,
                impact: feature.impact,
                agent: feature.agentId,
                metadata: {
                    filesModified: feature.filesModified,
                    testsAdded: feature.testsAdded,
                    fullDescription: feature.description
                }
            });
            console.log(`✅ Tracked feature completion: ${feature.featureName}`);
        }
        catch (error) {
            console.error('❌ Failed to handle feature completion:', error.message);
        }
    }
    /**
     * Infer event type from agent completion event
     */
    inferEventType(event) {
        const action = event.action.toLowerCase();
        const agentId = event.agentId.toLowerCase();
        // Feature-related actions
        if (action.includes('implement') || action.includes('add') || action.includes('create')) {
            return 'feature_added';
        }
        // Refactoring actions
        if (action.includes('refactor') || action.includes('restructure') || action.includes('optimize')) {
            return 'refactor_completed';
        }
        // Bug fixes
        if (action.includes('fix') || action.includes('resolve') || action.includes('bug')) {
            return 'bug_fixed';
        }
        // Architecture changes
        if (action.includes('architecture') || action.includes('design') || agentId.includes('alex-ba')) {
            return 'architecture_changed';
        }
        // Dependency changes
        if (action.includes('dependency') || action.includes('package') || action.includes('install')) {
            return 'dependency_added';
        }
        // Default to feature_added
        return 'feature_added';
    }
    /**
     * Generate human-readable event description
     */
    generateEventDescription(event) {
        const agentName = this.formatAgentName(event.agentId);
        const action = event.action;
        const files = event.filePaths?.length || 0;
        if (files > 0) {
            return `${agentName} ${action} (${files} file${files > 1 ? 's' : ''} modified)`;
        }
        return `${agentName} ${action}`;
    }
    /**
     * Generate impact description from agent response
     */
    generateImpactDescription(event) {
        const result = event.result;
        // Use agent's message if available
        if (result.message && result.message.length > 0) {
            return result.message;
        }
        // Generate from suggestions
        if (result.suggestions && result.suggestions.length > 0) {
            const highPriority = result.suggestions.filter(s => s.priority === 'high' || s.priority === 'critical');
            if (highPriority.length > 0) {
                return `Addressed ${highPriority.length} high-priority issue${highPriority.length > 1 ? 's' : ''}`;
            }
            return `Provided ${result.suggestions.length} suggestion${result.suggestions.length > 1 ? 's' : ''}`;
        }
        // Generic impact
        return `Completed ${event.action}`;
    }
    /**
     * Format agent ID for display
     */
    formatAgentName(agentId) {
        const nameMap = {
            'maria-qa': 'Maria-QA',
            'james-frontend': 'James-Frontend',
            'marcus-backend': 'Marcus-Backend',
            'alex-ba': 'Alex-BA',
            'sarah-pm': 'Sarah-PM',
            'dana-database': 'Dana-Database',
            'dr-ai-ml': 'Dr.AI-ML',
            'oliver-mcp': 'Oliver-MCP'
        };
        return nameMap[agentId] || agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
    }
    /**
     * Start tracking session for an agent
     */
    startSession(agentId) {
        this.sessionStartTimes.set(agentId, Date.now());
    }
    /**
     * End tracking session and return duration
     */
    endSession(agentId) {
        const startTime = this.sessionStartTimes.get(agentId);
        if (!startTime)
            return null;
        const duration = Date.now() - startTime;
        this.sessionStartTimes.delete(agentId);
        return duration;
    }
    /**
     * Generate timeline visualization data
     */
    async generateTimelineVisualization(projectId, limit = 50) {
        const history = await projectVisionManager.getProjectHistory(projectId, limit);
        // Convert events to timeline format
        const events = history.events.map(event => ({
            date: new Date(event.timestamp).toISOString().split('T')[0],
            type: event.type,
            description: event.description,
            agent: event.agent,
            icon: this.getEventIcon(event.type)
        }));
        // Calculate summary statistics
        const eventsByType = {};
        const eventsByAgent = {};
        history.events.forEach(event => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsByAgent[event.agent] = (eventsByAgent[event.agent] || 0) + 1;
        });
        const timestamps = history.events.map(e => e.timestamp);
        const start = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
        const end = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
        const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return {
            events,
            summary: {
                totalEvents: history.events.length,
                eventsByType,
                eventsByAgent,
                timeRange: {
                    start,
                    end,
                    durationDays
                }
            }
        };
    }
    /**
     * Get icon for event type (for terminal/markdown display)
     */
    getEventIcon(eventType) {
        const iconMap = {
            'feature_added': '✨',
            'decision_made': '💡',
            'milestone_reached': '🎯',
            'refactor_completed': '🔧',
            'architecture_changed': '🏗️',
            'dependency_added': '📦',
            'bug_fixed': '🐛'
        };
        return iconMap[eventType] || '📝';
    }
    /**
     * Generate markdown timeline report
     */
    async generateMarkdownTimeline(projectId, limit = 50) {
        const timeline = await this.generateTimelineVisualization(projectId, limit);
        let markdown = `# Project Timeline - ${projectId}\n\n`;
        markdown += `**Total Events**: ${timeline.summary.totalEvents}\n`;
        markdown += `**Time Range**: ${timeline.summary.timeRange.durationDays} days\n\n`;
        // Events by type
        markdown += `## Events by Type\n\n`;
        Object.entries(timeline.summary.eventsByType)
            .sort(([, a], [, b]) => b - a)
            .forEach(([type, count]) => {
            markdown += `- **${type}**: ${count}\n`;
        });
        markdown += `\n`;
        // Events by agent
        markdown += `## Events by Agent\n\n`;
        Object.entries(timeline.summary.eventsByAgent)
            .sort(([, a], [, b]) => b - a)
            .forEach(([agent, count]) => {
            markdown += `- **${this.formatAgentName(agent)}**: ${count}\n`;
        });
        markdown += `\n`;
        // Timeline
        markdown += `## Timeline\n\n`;
        timeline.events.forEach(event => {
            markdown += `### ${event.icon} ${event.date} - ${event.type}\n`;
            markdown += `**Agent**: ${this.formatAgentName(event.agent)}\n`;
            markdown += `**Description**: ${event.description}\n\n`;
        });
        return markdown;
    }
    /**
     * Get recent activity summary
     */
    async getRecentActivity(projectId, hours = 24) {
        const history = await projectVisionManager.getProjectHistory(projectId);
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        const recentEvents = history.events.filter(e => e.timestamp >= cutoffTime);
        const agents = new Set(recentEvents.map(e => e.agent));
        // Find most common event type
        const eventCounts = {};
        recentEvents.forEach(e => {
            eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
        });
        const topEventType = Object.entries(eventCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
        return {
            events: recentEvents.length,
            agents,
            topEventType
        };
    }
}
// Export singleton instance
export const projectHistoryTracker = new ProjectHistoryTracker();
//# sourceMappingURL=project-history-tracker.js.map