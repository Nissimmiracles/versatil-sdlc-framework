"use strict";
/**
 * VERSATIL SDLC Framework - Context Priority Resolver
 *
 * Merges contexts with priority: User > Team > Project > Framework
 * Part of Layer 3 (User/Team Context) - Task 10
 *
 * Features:
 * - Priority-based context merging
 * - User preferences override team conventions
 * - Team conventions override project defaults
 * - Project defaults override framework defaults
 * - Conflict resolution with clear precedence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextPriorityResolver = exports.ContextPriorityResolver = void 0;
const events_1 = require("events");
const user_context_manager_js_1 = require("../user/user-context-manager.js");
const team_context_manager_js_1 = require("../team/team-context-manager.js");
const project_vision_manager_js_1 = require("../project/project-vision-manager.js");
// ==================== CONTEXT PRIORITY RESOLVER ====================
class ContextPriorityResolver extends events_1.EventEmitter {
    /**
     * Resolve context with priority merging
     * Priority order: User > Team > Project > Framework
     */
    async resolveContext(input) {
        const resolved = {
            userId: input.userId,
            teamId: input.teamId,
            projectId: input.projectId,
            codingPreferences: this.getFrameworkDefaults(),
            resolution: {
                userOverrides: [],
                teamOverrides: [],
                projectOverrides: [],
                conflicts: []
            }
        };
        // Layer 1: Framework defaults (already applied above)
        console.log('📊 Resolving context with priority: User > Team > Project > Framework');
        // Layer 2: Project defaults (lowest priority override)
        if (input.projectId) {
            await this.applyProjectContext(input.projectId, resolved);
        }
        // Layer 3: Team conventions (higher priority)
        if (input.teamId) {
            await this.applyTeamContext(input.teamId, resolved);
        }
        // Layer 4: User preferences (highest priority)
        if (input.userId) {
            await this.applyUserContext(input.userId, resolved);
        }
        this.emit('context_resolved', {
            userId: input.userId,
            teamId: input.teamId,
            projectId: input.projectId,
            overrides: resolved.resolution
        });
        console.log(`✅ Context resolved:`);
        console.log(`   User overrides: ${resolved.resolution.userOverrides.length}`);
        console.log(`   Team overrides: ${resolved.resolution.teamOverrides.length}`);
        console.log(`   Project overrides: ${resolved.resolution.projectOverrides.length}`);
        return resolved;
    }
    /**
     * Apply project-specific context
     */
    async applyProjectContext(projectId, resolved) {
        try {
            const vision = await project_vision_manager_js_1.projectVisionManager.getVision(projectId);
            if (vision) {
                resolved.projectVision = vision;
                // Project vision can suggest coding standards via values/philosophy
                // For example: "We value clean code" → prefer verbose comments
                if (vision.values.some(v => v.toLowerCase().includes('clean code'))) {
                    resolved.codingPreferences.commentStyle = 'verbose';
                    resolved.resolution.projectOverrides.push('commentStyle (from project values)');
                }
                console.log(`   📋 Applied project context: ${projectId}`);
            }
        }
        catch (error) {
            console.warn(`   ⚠️ Failed to load project context: ${error.message}`);
        }
    }
    /**
     * Apply team conventions
     */
    async applyTeamContext(teamId, resolved) {
        try {
            const teamContext = await team_context_manager_js_1.teamContextManager.getTeamContext(teamId);
            if (!teamContext) {
                console.warn(`   ⚠️ Team ${teamId} not found`);
                return;
            }
            resolved.teamConventions = teamContext.conventions;
            // Map team conventions to coding preferences
            const teamPrefs = this.mapTeamConventionsToPreferences(teamContext.conventions);
            for (const [key, value] of Object.entries(teamPrefs)) {
                const prefKey = key;
                const currentValue = resolved.codingPreferences[prefKey];
                // Only override if different
                if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
                    resolved.codingPreferences[prefKey] = value;
                    resolved.resolution.teamOverrides.push(`${key} (team: ${teamId})`);
                    // Log conflict if project had a different value
                    if (resolved.resolution.projectOverrides.some(o => o.startsWith(key))) {
                        resolved.resolution.conflicts.push({
                            field: key,
                            source: 'team',
                            value
                        });
                    }
                }
            }
            console.log(`   👥 Applied team conventions: ${teamId} (${teamContext.profile.name})`);
        }
        catch (error) {
            console.warn(`   ⚠️ Failed to load team context: ${error.message}`);
        }
    }
    /**
     * Apply user preferences (highest priority)
     */
    async applyUserContext(userId, resolved) {
        try {
            const userContext = await user_context_manager_js_1.userContextManager.getUserContext(userId);
            if (!userContext) {
                console.warn(`   ⚠️ User ${userId} not found`);
                return;
            }
            // User preferences override everything
            for (const [key, value] of Object.entries(userContext.codingPreferences)) {
                const prefKey = key;
                const currentValue = resolved.codingPreferences[prefKey];
                // Only override if different
                if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
                    resolved.codingPreferences[prefKey] = value;
                    resolved.resolution.userOverrides.push(`${key} (user: ${userId})`);
                    // Log conflict if team or project had a different value
                    if (resolved.resolution.teamOverrides.some(o => o.startsWith(key)) ||
                        resolved.resolution.projectOverrides.some(o => o.startsWith(key))) {
                        resolved.resolution.conflicts.push({
                            field: key,
                            source: 'user',
                            value
                        });
                    }
                }
            }
            console.log(`   👤 Applied user preferences: ${userId} (${userContext.profile.name})`);
        }
        catch (error) {
            console.warn(`   ⚠️ Failed to load user context: ${error.message}`);
        }
    }
    /**
     * Map team conventions to coding preferences
     */
    mapTeamConventionsToPreferences(conventions) {
        const prefs = {};
        // Code style
        if (conventions.codeStyle === 'airbnb') {
            prefs.indentation = 'spaces';
            prefs.indentSize = 2;
            prefs.quotes = 'single';
            prefs.semicolons = 'always';
            prefs.trailingCommas = 'es5';
        }
        else if (conventions.codeStyle === 'google') {
            prefs.indentation = 'spaces';
            prefs.indentSize = 2;
            prefs.quotes = 'single';
            prefs.semicolons = 'always';
        }
        else if (conventions.codeStyle === 'standard') {
            prefs.indentation = 'spaces';
            prefs.indentSize = 2;
            prefs.quotes = 'single';
            prefs.semicolons = 'never';
        }
        // Documentation
        if (conventions.requireDocstrings) {
            prefs.commentStyle = 'jsdoc';
            prefs.includeTypeAnnotations = true;
        }
        // Testing
        prefs.testFramework = this.inferTestFramework(conventions);
        return prefs;
    }
    /**
     * Infer test framework from team conventions
     */
    inferTestFramework(conventions) {
        // Could be enhanced to read from team metadata
        // For now, default to jest if testing is required
        if (conventions.testingPolicy.required) {
            return 'jest';
        }
        return 'jest'; // Default
    }
    /**
     * Get framework default preferences
     */
    getFrameworkDefaults() {
        return {
            // Code Formatting
            indentation: 'spaces',
            indentSize: 2,
            lineLength: 100,
            semicolons: 'auto',
            quotes: 'single',
            trailingCommas: 'es5',
            // Naming Conventions
            naming: {
                variables: 'camelCase',
                functions: 'camelCase',
                classes: 'PascalCase',
                constants: 'UPPER_CASE',
                files: 'kebab-case'
            },
            // Documentation Style
            commentStyle: 'jsdoc',
            includeTypeAnnotations: true,
            includeExamples: false,
            // Testing Preferences
            testFramework: 'jest',
            testFileLocation: 'alongside',
            testNaming: 'describe-it',
            // Code Style
            asyncStyle: 'async-await',
            errorHandling: 'try-catch',
            nullHandling: 'undefined',
            // Import/Export Style
            importStyle: 'named',
            exportStyle: 'named',
            // Framework-Specific
            reactHooks: true,
            reactStateManagement: 'useState',
            vueComposition: true
        };
    }
    /**
     * Get context summary for agent usage
     */
    async getContextSummary(input) {
        const resolved = await this.resolveContext(input);
        let summary = '📊 **Context Summary**\n\n';
        // User info
        if (resolved.userId) {
            const userContext = await user_context_manager_js_1.userContextManager.getUserContext(resolved.userId);
            if (userContext) {
                summary += `👤 **User**: ${userContext.profile.name}\n`;
                summary += `   Preferences: ${resolved.resolution.userOverrides.length} custom settings\n`;
            }
        }
        // Team info
        if (resolved.teamId) {
            const teamContext = await team_context_manager_js_1.teamContextManager.getTeamContext(resolved.teamId);
            if (teamContext) {
                summary += `👥 **Team**: ${teamContext.profile.name}\n`;
                summary += `   Code Style: ${teamContext.conventions.codeStyle}\n`;
                summary += `   Min Coverage: ${teamContext.conventions.testingPolicy.minCoverage}%\n`;
            }
        }
        // Project info
        if (resolved.projectId && resolved.projectVision) {
            summary += `📋 **Project**: ${resolved.projectId}\n`;
            summary += `   Mission: ${resolved.projectVision.mission}\n`;
            summary += `   Goals: ${resolved.projectVision.goals.length}\n`;
        }
        // Coding preferences
        summary += `\n**Coding Preferences**:\n`;
        summary += `- Indentation: ${resolved.codingPreferences.indentation} (${resolved.codingPreferences.indentSize})\n`;
        summary += `- Quotes: ${resolved.codingPreferences.quotes}\n`;
        summary += `- Semicolons: ${resolved.codingPreferences.semicolons}\n`;
        summary += `- Test Framework: ${resolved.codingPreferences.testFramework}\n`;
        summary += `- Async Style: ${resolved.codingPreferences.asyncStyle}\n`;
        // Conflicts
        if (resolved.resolution.conflicts.length > 0) {
            summary += `\n⚠️ **Conflicts Resolved**: ${resolved.resolution.conflicts.length}\n`;
            resolved.resolution.conflicts.forEach(c => {
                summary += `   - ${c.field}: ${c.source} override\n`;
            });
        }
        return summary;
    }
}
exports.ContextPriorityResolver = ContextPriorityResolver;
// Export singleton instance
exports.contextPriorityResolver = new ContextPriorityResolver();
