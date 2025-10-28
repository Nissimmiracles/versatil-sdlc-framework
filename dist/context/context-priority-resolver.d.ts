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
import { EventEmitter } from 'events';
import { type UserCodingPreferences } from '../user/user-context-manager.js';
import { type TeamConventions } from '../team/team-context-manager.js';
import { type ProjectVision } from '../project/project-vision-manager.js';
export interface ResolvedContext {
    userId?: string;
    teamId?: string;
    projectId?: string;
    codingPreferences: UserCodingPreferences;
    teamConventions?: TeamConventions;
    projectVision?: ProjectVision;
    resolution: {
        userOverrides: string[];
        teamOverrides: string[];
        projectOverrides: string[];
        conflicts: Array<{
            field: string;
            source: string;
            value: any;
        }>;
    };
}
export interface ContextInput {
    userId?: string;
    teamId?: string;
    projectId?: string;
}
export declare class ContextPriorityResolver extends EventEmitter {
    /**
     * Resolve context with priority merging
     * Priority order: User > Team > Project > Framework
     */
    resolveContext(input: ContextInput): Promise<ResolvedContext>;
    /**
     * Apply project-specific context
     */
    private applyProjectContext;
    /**
     * Apply team conventions
     */
    private applyTeamContext;
    /**
     * Apply user preferences (highest priority)
     */
    private applyUserContext;
    /**
     * Map team conventions to coding preferences
     */
    private mapTeamConventionsToPreferences;
    /**
     * Infer test framework from team conventions
     */
    private inferTestFramework;
    /**
     * Get framework default preferences
     */
    private getFrameworkDefaults;
    /**
     * Get context summary for agent usage
     */
    getContextSummary(input: ContextInput): Promise<string>;
}
export declare const contextPriorityResolver: ContextPriorityResolver;
