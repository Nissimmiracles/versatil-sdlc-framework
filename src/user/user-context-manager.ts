/**
 * VERSATIL SDLC Framework - User Context Manager
 *
 * Manages per-user coding preferences and context
 * Part of Layer 3 (User/Team Context) - Task 6
 *
 * Storage: ~/.versatil/users/[user-id]/preferences.json
 *
 * Features:
 * - Per-user coding style preferences
 * - Privacy-isolated user memories
 * - User-specific agent configurations
 * - Coding convention overrides
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ==================== INTERFACES ====================

export interface UserCodingPreferences {
  // Code Formatting
  indentation: 'tabs' | 'spaces';
  indentSize: number; // 2 or 4 for spaces, 1 for tabs
  lineLength: number; // Max line length (80, 100, 120, etc.)
  semicolons: 'always' | 'never' | 'auto';
  quotes: 'single' | 'double' | 'backticks';
  trailingCommas: 'none' | 'es5' | 'all';

  // Naming Conventions
  naming: {
    variables: 'camelCase' | 'snake_case' | 'PascalCase';
    functions: 'camelCase' | 'snake_case' | 'PascalCase';
    classes: 'PascalCase' | 'camelCase';
    constants: 'UPPER_CASE' | 'camelCase';
    files: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
  };

  // Documentation Style
  commentStyle: 'jsdoc' | 'inline' | 'minimal' | 'verbose';
  includeTypeAnnotations: boolean;
  includeExamples: boolean;

  // Testing Preferences
  testFramework: 'jest' | 'vitest' | 'mocha' | 'playwright' | 'cypress';
  testFileLocation: 'alongside' | 'tests-directory' | 'spec-directory';
  testNaming: 'describe-it' | 'test-cases' | 'behavior-driven';

  // Code Style
  asyncStyle: 'async-await' | 'promises' | 'callbacks';
  errorHandling: 'try-catch' | 'error-first' | 'optional' | 'result-type';
  nullHandling: 'null' | 'undefined' | 'optional' | 'maybe';

  // Import/Export Style
  importStyle: 'named' | 'default' | 'namespace';
  exportStyle: 'named' | 'default' | 'mixed';

  // Framework-Specific
  reactHooks: boolean; // Prefer hooks over class components
  reactStateManagement: 'useState' | 'useReducer' | 'context' | 'redux' | 'zustand';
  vueComposition: boolean; // Prefer Composition API over Options API
}

export interface UserAgentPreferences {
  // Agent-specific preferences
  [agentId: string]: {
    enabled: boolean;
    priority: 'low' | 'medium' | 'high';
    customPrompts?: string[];
    autoActivate?: boolean;
    settings?: Record<string, any>;
  };
}

export interface UserProfile {
  userId: string;
  name: string;
  email?: string;
  timezone?: string;
  locale?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserContext {
  profile: UserProfile;
  codingPreferences: UserCodingPreferences;
  agentPreferences: UserAgentPreferences;
}

// ==================== USER CONTEXT MANAGER ====================

export class UserContextManager extends EventEmitter {
  private versatilHome: string;
  private usersPath: string;

  constructor() {
    super();
    this.versatilHome = join(homedir(), '.versatil');
    this.usersPath = join(this.versatilHome, 'users');
  }

  /**
   * Initialize user directory
   */
  private async ensureUserDir(userId: string): Promise<string> {
    const userDir = join(this.usersPath, userId);
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(join(userDir, 'memories'), { recursive: true });
    return userDir;
  }

  /**
   * Create new user with default preferences
   */
  async createUser(
    userId: string,
    profile: { name: string; email?: string; timezone?: string; locale?: string },
    preferences?: Partial<UserCodingPreferences>
  ): Promise<UserContext> {
    const userDir = await this.ensureUserDir(userId);
    const preferencesPath = join(userDir, 'preferences.json');

    // Check if user already exists
    const exists = await this.userExists(userId);
    if (exists) {
      throw new Error(`User ${userId} already exists`);
    }

    const now = Date.now();

    const userContext: UserContext = {
      profile: {
        userId,
        name: profile.name,
        email: profile.email,
        timezone: profile.timezone || 'UTC',
        locale: profile.locale || 'en-US',
        createdAt: now,
        updatedAt: now
      },
      codingPreferences: {
        ...this.getDefaultCodingPreferences(),
        ...preferences
      },
      agentPreferences: {}
    };

    await fs.writeFile(preferencesPath, JSON.stringify(userContext, null, 2));

    this.emit('user_created', { userId, profile: userContext.profile });
    console.log(`✅ User created: ${userId} (${profile.name})`);

    return userContext;
  }

  /**
   * Get user context (profile + preferences)
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      const preferencesPath = join(this.usersPath, userId, 'preferences.json');
      const data = await fs.readFile(preferencesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Update user coding preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserCodingPreferences>
  ): Promise<void> {
    const context = await this.getUserContext(userId);
    if (!context) {
      throw new Error(`User ${userId} not found`);
    }

    // Merge preferences
    context.codingPreferences = {
      ...context.codingPreferences,
      ...preferences
    };

    context.profile.updatedAt = Date.now();

    const preferencesPath = join(this.usersPath, userId, 'preferences.json');
    await fs.writeFile(preferencesPath, JSON.stringify(context, null, 2));

    this.emit('preferences_updated', { userId, preferences });
    console.log(`✅ Preferences updated for user ${userId}`);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    profile: Partial<UserProfile>
  ): Promise<void> {
    const context = await this.getUserContext(userId);
    if (!context) {
      throw new Error(`User ${userId} not found`);
    }

    // Merge profile (but preserve userId, createdAt)
    context.profile = {
      ...context.profile,
      ...profile,
      userId: context.profile.userId,
      createdAt: context.profile.createdAt,
      updatedAt: Date.now()
    };

    const preferencesPath = join(this.usersPath, userId, 'preferences.json');
    await fs.writeFile(preferencesPath, JSON.stringify(context, null, 2));

    this.emit('profile_updated', { userId, profile: context.profile });
    console.log(`✅ Profile updated for user ${userId}`);
  }

  /**
   * Update agent preferences for user
   */
  async updateAgentPreferences(
    userId: string,
    agentId: string,
    preferences: {
      enabled?: boolean;
      priority?: 'low' | 'medium' | 'high';
      customPrompts?: string[];
      autoActivate?: boolean;
      settings?: Record<string, any>;
    }
  ): Promise<void> {
    const context = await this.getUserContext(userId);
    if (!context) {
      throw new Error(`User ${userId} not found`);
    }

    // Update agent preferences
    context.agentPreferences[agentId] = {
      ...context.agentPreferences[agentId],
      ...preferences
    };

    context.profile.updatedAt = Date.now();

    const preferencesPath = join(this.usersPath, userId, 'preferences.json');
    await fs.writeFile(preferencesPath, JSON.stringify(context, null, 2));

    this.emit('agent_preferences_updated', { userId, agentId, preferences });
    console.log(`✅ Agent preferences updated for ${agentId} (user: ${userId})`);
  }

  /**
   * Store user-specific agent memory
   */
  async storeUserAgentMemory(
    userId: string,
    agentId: string,
    memory: {
      key: string;
      value: any;
      tags?: string[];
    }
  ): Promise<void> {
    const userDir = await this.ensureUserDir(userId);
    const memoryDir = join(userDir, 'memories', agentId);
    await fs.mkdir(memoryDir, { recursive: true });

    const memoryPath = join(memoryDir, `${memory.key}.json`);
    const memoryData = {
      ...memory,
      timestamp: Date.now()
    };

    await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));

    this.emit('memory_stored', { userId, agentId, key: memory.key });
    console.log(`✅ Memory stored for ${agentId}: ${memory.key} (user: ${userId})`);
  }

  /**
   * Get user-specific agent memory
   */
  async getUserAgentMemory(
    userId: string,
    agentId: string,
    key: string
  ): Promise<any | null> {
    try {
      const memoryPath = join(this.usersPath, userId, 'memories', agentId, `${key}.json`);
      const data = await fs.readFile(memoryPath, 'utf-8');
      const memory = JSON.parse(data);
      return memory.value;
    } catch {
      return null;
    }
  }

  /**
   * List all memories for an agent (for a specific user)
   */
  async listUserAgentMemories(
    userId: string,
    agentId: string
  ): Promise<string[]> {
    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      const files = await fs.readdir(memoryDir);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const preferencesPath = join(this.usersPath, userId, 'preferences.json');
      await fs.access(preferencesPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
    const userDir = join(this.usersPath, userId);
    await fs.rm(userDir, { recursive: true, force: true });

    this.emit('user_deleted', { userId });
    console.log(`✅ User deleted: ${userId}`);
  }

  /**
   * List all users
   */
  async listUsers(): Promise<UserProfile[]> {
    try {
      const users: UserProfile[] = [];
      const entries = await fs.readdir(this.usersPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const context = await this.getUserContext(entry.name);
          if (context) {
            users.push(context.profile);
          }
        }
      }

      return users;
    } catch {
      return [];
    }
  }

  /**
   * Get default coding preferences
   */
  private getDefaultCodingPreferences(): UserCodingPreferences {
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
}

// Export singleton instance
export const userContextManager = new UserContextManager();
