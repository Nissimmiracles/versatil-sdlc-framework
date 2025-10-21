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
import { userContextManager, type UserContext, type UserCodingPreferences } from '../user/user-context-manager.js';
import { teamContextManager, type TeamContext, type TeamConventions } from '../team/team-context-manager.js';
import { projectVisionManager, type ProjectVision } from '../project/project-vision-manager.js';

// ==================== INTERFACES ====================

export interface ResolvedContext {
  // Priority layers (in order: User > Team > Project > Framework)
  userId?: string;
  teamId?: string;
  projectId?: string;

  // Resolved coding preferences (merged with priority)
  codingPreferences: UserCodingPreferences;

  // Team conventions (if applicable)
  teamConventions?: TeamConventions;

  // Project vision (if applicable)
  projectVision?: ProjectVision;

  // Resolution metadata
  resolution: {
    userOverrides: string[]; // Fields overridden by user preferences
    teamOverrides: string[]; // Fields overridden by team conventions
    projectOverrides: string[]; // Fields overridden by project defaults
    conflicts: Array<{ field: string; source: string; value: any }>; // Logged conflicts
  };
}

export interface ContextInput {
  userId?: string;
  teamId?: string;
  projectId?: string;
}

// ==================== CONTEXT PRIORITY RESOLVER ====================

export class ContextPriorityResolver extends EventEmitter {
  /**
   * Resolve context with priority merging
   * Priority order: User > Team > Project > Framework
   */
  async resolveContext(input: ContextInput): Promise<ResolvedContext> {
    const resolved: ResolvedContext = {
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
  private async applyProjectContext(projectId: string, resolved: ResolvedContext): Promise<void> {
    try {
      const vision = await projectVisionManager.getVision(projectId);
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
    } catch (error: any) {
      console.warn(`   ⚠️ Failed to load project context: ${error.message}`);
    }
  }

  /**
   * Apply team conventions
   */
  private async applyTeamContext(teamId: string, resolved: ResolvedContext): Promise<void> {
    try {
      const teamContext = await teamContextManager.getTeamContext(teamId);
      if (!teamContext) {
        console.warn(`   ⚠️ Team ${teamId} not found`);
        return;
      }

      resolved.teamConventions = teamContext.conventions;

      // Map team conventions to coding preferences
      const teamPrefs = this.mapTeamConventionsToPreferences(teamContext.conventions);

      for (const [key, value] of Object.entries(teamPrefs)) {
        const prefKey = key as keyof UserCodingPreferences;
        const currentValue = resolved.codingPreferences[prefKey];

        // Only override if different
        if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
          (resolved.codingPreferences as any)[prefKey] = value;
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
    } catch (error: any) {
      console.warn(`   ⚠️ Failed to load team context: ${error.message}`);
    }
  }

  /**
   * Apply user preferences (highest priority)
   */
  private async applyUserContext(userId: string, resolved: ResolvedContext): Promise<void> {
    try {
      const userContext = await userContextManager.getUserContext(userId);
      if (!userContext) {
        console.warn(`   ⚠️ User ${userId} not found`);
        return;
      }

      // User preferences override everything
      for (const [key, value] of Object.entries(userContext.codingPreferences)) {
        const prefKey = key as keyof UserCodingPreferences;
        const currentValue = resolved.codingPreferences[prefKey];

        // Only override if different
        if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
          (resolved.codingPreferences as any)[prefKey] = value;
          resolved.resolution.userOverrides.push(`${key} (user: ${userId})`);

          // Log conflict if team or project had a different value
          if (
            resolved.resolution.teamOverrides.some(o => o.startsWith(key)) ||
            resolved.resolution.projectOverrides.some(o => o.startsWith(key))
          ) {
            resolved.resolution.conflicts.push({
              field: key,
              source: 'user',
              value
            });
          }
        }
      }

      console.log(`   👤 Applied user preferences: ${userId} (${userContext.profile.name})`);
    } catch (error: any) {
      console.warn(`   ⚠️ Failed to load user context: ${error.message}`);
    }
  }

  /**
   * Map team conventions to coding preferences
   */
  private mapTeamConventionsToPreferences(conventions: TeamConventions): Partial<UserCodingPreferences> {
    const prefs: Partial<UserCodingPreferences> = {};

    // Code style
    if (conventions.codeStyle === 'airbnb') {
      prefs.indentation = 'spaces';
      prefs.indentSize = 2;
      prefs.quotes = 'single';
      prefs.semicolons = 'always';
      prefs.trailingCommas = 'es5';
    } else if (conventions.codeStyle === 'google') {
      prefs.indentation = 'spaces';
      prefs.indentSize = 2;
      prefs.quotes = 'single';
      prefs.semicolons = 'always';
    } else if (conventions.codeStyle === 'standard') {
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
  private inferTestFramework(conventions: TeamConventions): UserCodingPreferences['testFramework'] {
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
  private getFrameworkDefaults(): UserCodingPreferences {
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
  async getContextSummary(input: ContextInput): Promise<string> {
    const resolved = await this.resolveContext(input);

    let summary = '📊 **Context Summary**\n\n';

    // User info
    if (resolved.userId) {
      const userContext = await userContextManager.getUserContext(resolved.userId);
      if (userContext) {
        summary += `👤 **User**: ${userContext.profile.name}\n`;
        summary += `   Preferences: ${resolved.resolution.userOverrides.length} custom settings\n`;
      }
    }

    // Team info
    if (resolved.teamId) {
      const teamContext = await teamContextManager.getTeamContext(resolved.teamId);
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

// Export singleton instance
export const contextPriorityResolver = new ContextPriorityResolver();
