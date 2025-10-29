"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userContextManager = exports.UserContextManager = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
// ==================== USER CONTEXT MANAGER ====================
class UserContextManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.versatilHome = (0, path_1.join)((0, os_1.homedir)(), '.versatil');
        this.usersPath = (0, path_1.join)(this.versatilHome, 'users');
    }
    /**
     * Initialize user directory
     */
    async ensureUserDir(userId) {
        const userDir = (0, path_1.join)(this.usersPath, userId);
        await fs_1.promises.mkdir(userDir, { recursive: true });
        await fs_1.promises.mkdir((0, path_1.join)(userDir, 'memories'), { recursive: true });
        return userDir;
    }
    /**
     * Create new user with default preferences
     */
    async createUser(userId, profile, preferences) {
        const userDir = await this.ensureUserDir(userId);
        const preferencesPath = (0, path_1.join)(userDir, 'preferences.json');
        // Check if user already exists
        const exists = await this.userExists(userId);
        if (exists) {
            throw new Error(`User ${userId} already exists`);
        }
        const now = Date.now();
        const userContext = {
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
        await fs_1.promises.writeFile(preferencesPath, JSON.stringify(userContext, null, 2));
        this.emit('user_created', { userId, profile: userContext.profile });
        console.log(`✅ User created: ${userId} (${profile.name})`);
        return userContext;
    }
    /**
     * Get user context (profile + preferences)
     */
    async getUserContext(userId) {
        try {
            const preferencesPath = (0, path_1.join)(this.usersPath, userId, 'preferences.json');
            const data = await fs_1.promises.readFile(preferencesPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    /**
     * Update user coding preferences
     */
    async updatePreferences(userId, preferences) {
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
        const preferencesPath = (0, path_1.join)(this.usersPath, userId, 'preferences.json');
        await fs_1.promises.writeFile(preferencesPath, JSON.stringify(context, null, 2));
        this.emit('preferences_updated', { userId, preferences });
        console.log(`✅ Preferences updated for user ${userId}`);
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, profile) {
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
        const preferencesPath = (0, path_1.join)(this.usersPath, userId, 'preferences.json');
        await fs_1.promises.writeFile(preferencesPath, JSON.stringify(context, null, 2));
        this.emit('profile_updated', { userId, profile: context.profile });
        console.log(`✅ Profile updated for user ${userId}`);
    }
    /**
     * Update agent preferences for user
     */
    async updateAgentPreferences(userId, agentId, preferences) {
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
        const preferencesPath = (0, path_1.join)(this.usersPath, userId, 'preferences.json');
        await fs_1.promises.writeFile(preferencesPath, JSON.stringify(context, null, 2));
        this.emit('agent_preferences_updated', { userId, agentId, preferences });
        console.log(`✅ Agent preferences updated for ${agentId} (user: ${userId})`);
    }
    /**
     * Store user-specific agent memory
     */
    async storeUserAgentMemory(userId, agentId, memory) {
        const userDir = await this.ensureUserDir(userId);
        const memoryDir = (0, path_1.join)(userDir, 'memories', agentId);
        await fs_1.promises.mkdir(memoryDir, { recursive: true });
        const memoryPath = (0, path_1.join)(memoryDir, `${memory.key}.json`);
        const memoryData = {
            ...memory,
            timestamp: Date.now()
        };
        await fs_1.promises.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
        this.emit('memory_stored', { userId, agentId, key: memory.key });
        console.log(`✅ Memory stored for ${agentId}: ${memory.key} (user: ${userId})`);
    }
    /**
     * Get user-specific agent memory
     */
    async getUserAgentMemory(userId, agentId, key) {
        try {
            const memoryPath = (0, path_1.join)(this.usersPath, userId, 'memories', agentId, `${key}.json`);
            const data = await fs_1.promises.readFile(memoryPath, 'utf-8');
            const memory = JSON.parse(data);
            return memory.value;
        }
        catch {
            return null;
        }
    }
    /**
     * List all memories for an agent (for a specific user)
     */
    async listUserAgentMemories(userId, agentId) {
        try {
            const memoryDir = (0, path_1.join)(this.usersPath, userId, 'memories', agentId);
            const files = await fs_1.promises.readdir(memoryDir);
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        }
        catch {
            return [];
        }
    }
    /**
     * Check if user exists
     */
    async userExists(userId) {
        try {
            const preferencesPath = (0, path_1.join)(this.usersPath, userId, 'preferences.json');
            await fs_1.promises.access(preferencesPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Delete user and all associated data
     */
    async deleteUser(userId) {
        const userDir = (0, path_1.join)(this.usersPath, userId);
        await fs_1.promises.rm(userDir, { recursive: true, force: true });
        this.emit('user_deleted', { userId });
        console.log(`✅ User deleted: ${userId}`);
    }
    /**
     * List all users
     */
    async listUsers() {
        try {
            const users = [];
            const entries = await fs_1.promises.readdir(this.usersPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const context = await this.getUserContext(entry.name);
                    if (context) {
                        users.push(context.profile);
                    }
                }
            }
            return users;
        }
        catch {
            return [];
        }
    }
    /**
     * Get default coding preferences
     */
    getDefaultCodingPreferences() {
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
exports.UserContextManager = UserContextManager;
// Export singleton instance
exports.userContextManager = new UserContextManager();
