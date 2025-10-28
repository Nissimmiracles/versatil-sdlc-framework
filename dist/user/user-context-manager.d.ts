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
export interface UserCodingPreferences {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    lineLength: number;
    semicolons: 'always' | 'never' | 'auto';
    quotes: 'single' | 'double' | 'backticks';
    trailingCommas: 'none' | 'es5' | 'all';
    naming: {
        variables: 'camelCase' | 'snake_case' | 'PascalCase';
        functions: 'camelCase' | 'snake_case' | 'PascalCase';
        classes: 'PascalCase' | 'camelCase';
        constants: 'UPPER_CASE' | 'camelCase';
        files: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
    };
    commentStyle: 'jsdoc' | 'inline' | 'minimal' | 'verbose';
    includeTypeAnnotations: boolean;
    includeExamples: boolean;
    testFramework: 'jest' | 'vitest' | 'mocha' | 'playwright' | 'cypress';
    testFileLocation: 'alongside' | 'tests-directory' | 'spec-directory';
    testNaming: 'describe-it' | 'test-cases' | 'behavior-driven';
    asyncStyle: 'async-await' | 'promises' | 'callbacks';
    errorHandling: 'try-catch' | 'error-first' | 'optional' | 'result-type';
    nullHandling: 'null' | 'undefined' | 'optional' | 'maybe';
    importStyle: 'named' | 'default' | 'namespace';
    exportStyle: 'named' | 'default' | 'mixed';
    reactHooks: boolean;
    reactStateManagement: 'useState' | 'useReducer' | 'context' | 'redux' | 'zustand';
    vueComposition: boolean;
}
export interface UserAgentPreferences {
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
export declare class UserContextManager extends EventEmitter {
    private versatilHome;
    private usersPath;
    constructor();
    /**
     * Initialize user directory
     */
    private ensureUserDir;
    /**
     * Create new user with default preferences
     */
    createUser(userId: string, profile: {
        name: string;
        email?: string;
        timezone?: string;
        locale?: string;
    }, preferences?: Partial<UserCodingPreferences>): Promise<UserContext>;
    /**
     * Get user context (profile + preferences)
     */
    getUserContext(userId: string): Promise<UserContext | null>;
    /**
     * Update user coding preferences
     */
    updatePreferences(userId: string, preferences: Partial<UserCodingPreferences>): Promise<void>;
    /**
     * Update user profile
     */
    updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
    /**
     * Update agent preferences for user
     */
    updateAgentPreferences(userId: string, agentId: string, preferences: {
        enabled?: boolean;
        priority?: 'low' | 'medium' | 'high';
        customPrompts?: string[];
        autoActivate?: boolean;
        settings?: Record<string, any>;
    }): Promise<void>;
    /**
     * Store user-specific agent memory
     */
    storeUserAgentMemory(userId: string, agentId: string, memory: {
        key: string;
        value: any;
        tags?: string[];
    }): Promise<void>;
    /**
     * Get user-specific agent memory
     */
    getUserAgentMemory(userId: string, agentId: string, key: string): Promise<any | null>;
    /**
     * List all memories for an agent (for a specific user)
     */
    listUserAgentMemories(userId: string, agentId: string): Promise<string[]>;
    /**
     * Check if user exists
     */
    userExists(userId: string): Promise<boolean>;
    /**
     * Delete user and all associated data
     */
    deleteUser(userId: string): Promise<void>;
    /**
     * List all users
     */
    listUsers(): Promise<UserProfile[]>;
    /**
     * Get default coding preferences
     */
    private getDefaultCodingPreferences;
}
export declare const userContextManager: UserContextManager;
