/* eslint-disable no-case-declarations */
/**
 * VERSATIL Memory Tool Handler
 *
 * Implements Claude's Memory Tool API for cross-session learning
 *
 * Features:
 * - File operations (view, create, str_replace, insert, delete, rename)
 * - Path validation and security
 * - Memory directory management
 * - Pattern storage and retrieval
 *
 * Reference: https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { MEMORY_TOOL_CONFIG, AGENT_MEMORY_TEMPLATES, getAgentMemoryPath } from './memory-tool-config.js';
import { getGlobalContextTracker } from './context-stats-tracker.js';
/**
 * Memory Tool Handler
 *
 * Handles all memory operations with security validation
 */
export class MemoryToolHandler {
    constructor() {
        this.baseDir = MEMORY_TOOL_CONFIG.memoryDirectory;
    }
    /**
     * Initialize memory directory structure
     *
     * Creates ~/.versatil/memories/ with agent subdirectories
     * and template files
     */
    async initialize() {
        try {
            // Create base memories directory
            await fs.ensureDir(this.baseDir);
            // Create project-knowledge directory
            await fs.ensureDir(path.join(this.baseDir, 'project-knowledge'));
            // Create agent-specific directories and templates
            for (const [agentId, templates] of Object.entries(AGENT_MEMORY_TEMPLATES)) {
                const agentPath = getAgentMemoryPath(agentId);
                await fs.ensureDir(agentPath);
                // Create template files if they don't exist
                for (const template of templates) {
                    const filePath = path.join(agentPath, template.filename);
                    const exists = await fs.pathExists(filePath);
                    if (!exists) {
                        await fs.writeFile(filePath, template.initialContent, 'utf-8');
                    }
                }
            }
            console.log('✅ Memory Tool initialized:', this.baseDir);
        }
        catch (error) {
            console.error('❌ Failed to initialize Memory Tool:', error);
            throw error;
        }
    }
    /**
     * Execute memory tool operation
     */
    async execute(operation, agentId) {
        const startTime = Date.now();
        let result;
        try {
            // Validate path security
            const validPath = await this.validatePath(operation.path);
            if (!validPath) {
                result = {
                    success: false,
                    error: `Invalid path: ${operation.path} (security violation)`
                };
                // Track failed operation
                await this.trackOperation(operation.type, operation.path, false, agentId);
                return result;
            }
            // Execute operation
            switch (operation.type) {
                case 'view':
                    result = await this.view(operation.path);
                    break;
                case 'create':
                    result = await this.create(operation.path, operation.content);
                    break;
                case 'str_replace':
                    result = await this.strReplace(operation.path, operation.oldStr, operation.newStr);
                    break;
                case 'insert':
                    result = await this.insert(operation.path, operation.insertLine, operation.content);
                    break;
                case 'delete':
                    result = await this.delete(operation.path);
                    break;
                case 'rename':
                    result = await this.rename(operation.path, operation.newPath);
                    break;
                default:
                    result = {
                        success: false,
                        error: `Unknown operation type: ${operation.type}`
                    };
            }
            // Track successful operation
            const tokensUsed = this.estimateTokenUsage(result.content || result.message || '');
            await this.trackOperation(operation.type, operation.path, result.success, agentId, tokensUsed);
            return result;
        }
        catch (error) {
            result = {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            // Track failed operation
            await this.trackOperation(operation.type, operation.path, false, agentId);
            return result;
        }
    }
    /**
     * Track memory operation in statistics
     */
    async trackOperation(operation, path, success, agentId, tokensUsed) {
        try {
            const tracker = getGlobalContextTracker();
            await tracker.trackMemoryOperation({
                operation,
                path,
                success,
                agentId,
                tokensUsed
            });
        }
        catch (error) {
            // Don't fail operation if tracking fails
            console.warn('Failed to track memory operation:', error);
        }
    }
    /**
     * Estimate token usage for content
     * Rough approximation: 1 token ≈ 4 characters
     */
    estimateTokenUsage(content) {
        return Math.ceil(content.length / 4);
    }
    /**
     * VIEW operation: Show directory or file contents
     */
    async view(targetPath) {
        const fullPath = path.join(this.baseDir, targetPath);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return {
                success: false,
                error: `Path does not exist: ${targetPath}`
            };
        }
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            // List directory contents
            const files = await fs.readdir(fullPath);
            const contents = files.map(file => {
                const filePath = path.join(fullPath, file);
                const fileStats = fs.statSync(filePath);
                return fileStats.isDirectory() ? `${file}/` : file;
            }).join('\n');
            return {
                success: true,
                message: `Directory: ${targetPath}`,
                content: contents
            };
        }
        else {
            // Read file contents
            const content = await fs.readFile(fullPath, 'utf-8');
            return {
                success: true,
                message: `File: ${targetPath}`,
                content
            };
        }
    }
    /**
     * CREATE operation: Create or overwrite file
     */
    async create(targetPath, content) {
        const fullPath = path.join(this.baseDir, targetPath);
        // Ensure parent directory exists
        await fs.ensureDir(path.dirname(fullPath));
        // Write file
        await fs.writeFile(fullPath, content, 'utf-8');
        return {
            success: true,
            message: `Created/updated: ${targetPath}`
        };
    }
    /**
     * STR_REPLACE operation: Replace text in file
     */
    async strReplace(targetPath, oldStr, newStr) {
        const fullPath = path.join(this.baseDir, targetPath);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return {
                success: false,
                error: `File does not exist: ${targetPath}`
            };
        }
        // Read file
        let content = await fs.readFile(fullPath, 'utf-8');
        // Check if old string exists
        if (!content.includes(oldStr)) {
            return {
                success: false,
                error: `String not found in file: "${oldStr}"`
            };
        }
        // Replace string
        content = content.replace(oldStr, newStr);
        // Write back
        await fs.writeFile(fullPath, content, 'utf-8');
        return {
            success: true,
            message: `Replaced text in: ${targetPath}`
        };
    }
    /**
     * INSERT operation: Insert text at specific line
     */
    async insert(targetPath, insertLine, content) {
        const fullPath = path.join(this.baseDir, targetPath);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return {
                success: false,
                error: `File does not exist: ${targetPath}`
            };
        }
        // Read file
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        const lines = fileContent.split('\n');
        // Validate line number
        if (insertLine < 0 || insertLine > lines.length) {
            return {
                success: false,
                error: `Invalid line number: ${insertLine} (file has ${lines.length} lines)`
            };
        }
        // Insert content
        lines.splice(insertLine, 0, content);
        // Write back
        await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');
        return {
            success: true,
            message: `Inserted text at line ${insertLine} in: ${targetPath}`
        };
    }
    /**
     * DELETE operation: Remove file or directory
     */
    async delete(targetPath) {
        const fullPath = path.join(this.baseDir, targetPath);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return {
                success: false,
                error: `Path does not exist: ${targetPath}`
            };
        }
        // Remove file or directory
        await fs.remove(fullPath);
        return {
            success: true,
            message: `Deleted: ${targetPath}`
        };
    }
    /**
     * RENAME operation: Move or rename file/directory
     */
    async rename(oldPath, newPath) {
        const fullOldPath = path.join(this.baseDir, oldPath);
        const fullNewPath = path.join(this.baseDir, newPath);
        // Validate both paths
        const validOldPath = await this.validatePath(oldPath);
        const validNewPath = await this.validatePath(newPath);
        if (!validOldPath || !validNewPath) {
            return {
                success: false,
                error: 'Invalid path (security violation)'
            };
        }
        const exists = await fs.pathExists(fullOldPath);
        if (!exists) {
            return {
                success: false,
                error: `Path does not exist: ${oldPath}`
            };
        }
        // Ensure parent directory of new path exists
        await fs.ensureDir(path.dirname(fullNewPath));
        // Move/rename
        await fs.move(fullOldPath, fullNewPath);
        return {
            success: true,
            message: `Renamed: ${oldPath} → ${newPath}`
        };
    }
    /**
     * Validate path for security
     *
     * Prevents directory traversal attacks
     */
    async validatePath(targetPath) {
        try {
            // Resolve path
            const fullPath = path.resolve(this.baseDir, targetPath);
            // Ensure path is within base directory
            if (!fullPath.startsWith(this.baseDir)) {
                console.warn('Security violation: Path outside base directory:', targetPath);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Path validation error:', error);
            return false;
        }
    }
    /**
     * Get memory statistics
     */
    async getStats() {
        try {
            const stats = await this.getDirectoryStats(this.baseDir);
            return {
                totalSizeMB: stats.size / (1024 * 1024),
                fileCount: stats.fileCount,
                maxSizeMB: MEMORY_TOOL_CONFIG.retentionPolicy.maxMemorySizeMB,
                cleanupThreshold: MEMORY_TOOL_CONFIG.retentionPolicy.cleanupThresholdPercent,
                needsCleanup: (stats.size / (1024 * 1024)) >
                    (MEMORY_TOOL_CONFIG.retentionPolicy.maxMemorySizeMB *
                        MEMORY_TOOL_CONFIG.retentionPolicy.cleanupThresholdPercent / 100)
            };
        }
        catch (error) {
            throw new Error(`Failed to get memory stats: ${error}`);
        }
    }
    /**
     * Get directory statistics (recursive)
     */
    async getDirectoryStats(dirPath) {
        let totalSize = 0;
        let fileCount = 0;
        const items = await fs.readdir(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            if (stats.isDirectory()) {
                const subStats = await this.getDirectoryStats(itemPath);
                totalSize += subStats.size;
                fileCount += subStats.fileCount;
            }
            else {
                totalSize += stats.size;
                fileCount++;
            }
        }
        return { size: totalSize, fileCount };
    }
    /**
     * Cleanup old cached documentation
     */
    async cleanupCache() {
        try {
            const ttlDays = MEMORY_TOOL_CONFIG.retentionPolicy.documentationCacheTTL;
            const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
            const now = Date.now();
            // Find all -cache.md files
            const cacheFiles = await this.findCacheFiles(this.baseDir);
            for (const cacheFile of cacheFiles) {
                const stats = await fs.stat(cacheFile);
                const age = now - stats.mtimeMs;
                if (age > ttlMs) {
                    console.log(`Removing stale cache: ${cacheFile}`);
                    await fs.remove(cacheFile);
                }
            }
        }
        catch (error) {
            console.error('Cache cleanup failed:', error);
        }
    }
    /**
     * Find all cache files recursively
     */
    async findCacheFiles(dirPath) {
        const cacheFiles = [];
        const items = await fs.readdir(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            if (stats.isDirectory()) {
                const subCacheFiles = await this.findCacheFiles(itemPath);
                cacheFiles.push(...subCacheFiles);
            }
            else if (item.endsWith('-cache.md')) {
                cacheFiles.push(itemPath);
            }
        }
        return cacheFiles;
    }
}
/**
 * Global Memory Tool instance
 */
export const memoryToolHandler = new MemoryToolHandler();
//# sourceMappingURL=memory-tool-handler.js.map