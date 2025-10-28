/**
 * VERSATIL Memory Tool Operations
 *
 * Implements 6 core memory operations:
 * - view: Read memory file or list directory
 * - create: Create or overwrite memory file
 * - str_replace: Replace text in memory file
 * - insert: Insert text at specific line
 * - delete: Remove memory file
 * - rename: Rename or move memory file
 *
 * All operations include:
 * - File validation
 * - Error handling
 * - Security checks (path traversal prevention)
 * - Markdown format support
 *
 * Reference: https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { MEMORY_TOOL_CONFIG } from './memory-tool-config.js';
/**
 * Memory Tool Operations Handler
 *
 * Implements all 6 memory operations with validation and security
 */
export class MemoryToolOperations {
    constructor(baseDir) {
        this.baseDir = baseDir || MEMORY_TOOL_CONFIG.memoryDirectory;
    }
    /**
     * Execute a memory operation
     *
     * @param operation - Memory operation to execute
     * @returns Operation result
     */
    async execute(operation) {
        const startTime = Date.now();
        try {
            // Validate path security
            if (!this.isValidPath(operation.path)) {
                return this.errorResult(operation.type, operation.path, `Invalid path: ${operation.path} (security violation)`);
            }
            // Execute operation based on type
            let result;
            switch (operation.type) {
                case 'view':
                    result = await this.view(operation);
                    break;
                case 'create':
                    result = await this.create(operation);
                    break;
                case 'str_replace':
                    result = await this.strReplace(operation);
                    break;
                case 'insert':
                    result = await this.insert(operation);
                    break;
                case 'delete':
                    result = await this.delete(operation);
                    break;
                case 'rename':
                    result = await this.rename(operation);
                    break;
                default:
                    // This should never happen due to TypeScript type checking
                    const unknownOp = operation;
                    return this.errorResult(unknownOp.type || 'unknown', unknownOp.path || 'unknown', `Unknown operation type: ${unknownOp.type}`);
            }
            // Add metadata
            result.metadata = {
                path: operation.path,
                operation: operation.type,
                timestamp: new Date().toISOString(),
                tokensUsed: this.estimateTokenUsage(result.content || result.message || '')
            };
            return result;
        }
        catch (error) {
            return this.errorResult(operation.type, operation.path, error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * VIEW operation implementation
     */
    async view(operation) {
        const fullPath = this.getFullPath(operation.path);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return this.errorResult('view', operation.path, `Path does not exist: ${operation.path}`);
        }
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            // List directory contents
            const files = await fs.readdir(fullPath);
            const items = [];
            for (const file of files) {
                const filePath = path.join(fullPath, file);
                const fileStats = await fs.stat(filePath);
                items.push(fileStats.isDirectory() ? `${file}/` : file);
            }
            return {
                success: true,
                message: `Directory: ${operation.path}`,
                content: items.join('\n')
            };
        }
        else {
            // Read file contents
            const content = await fs.readFile(fullPath, 'utf-8');
            return {
                success: true,
                message: `File: ${operation.path}`,
                content
            };
        }
    }
    /**
     * CREATE operation implementation
     */
    async create(operation) {
        const fullPath = this.getFullPath(operation.path);
        // Ensure parent directory exists
        await fs.ensureDir(path.dirname(fullPath));
        // Write file
        await fs.writeFile(fullPath, operation.content, 'utf-8');
        return {
            success: true,
            message: `Created/updated: ${operation.path}`
        };
    }
    /**
     * STR_REPLACE operation implementation
     */
    async strReplace(operation) {
        const fullPath = this.getFullPath(operation.path);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return this.errorResult('str_replace', operation.path, `File does not exist: ${operation.path}`);
        }
        // Read file
        let content = await fs.readFile(fullPath, 'utf-8');
        // Check if old string exists
        if (!content.includes(operation.oldStr)) {
            return this.errorResult('str_replace', operation.path, `String not found in file: "${operation.oldStr}"`);
        }
        // Replace string (once or all occurrences)
        if (operation.replaceAll) {
            content = content.split(operation.oldStr).join(operation.newStr);
        }
        else {
            content = content.replace(operation.oldStr, operation.newStr);
        }
        // Write back
        await fs.writeFile(fullPath, content, 'utf-8');
        return {
            success: true,
            message: `Replaced text in: ${operation.path}`
        };
    }
    /**
     * INSERT operation implementation
     */
    async insert(operation) {
        const fullPath = this.getFullPath(operation.path);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return this.errorResult('insert', operation.path, `File does not exist: ${operation.path}`);
        }
        // Read file
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        const lines = fileContent.split('\n');
        // Validate line number
        if (operation.insertLine < 0 || operation.insertLine > lines.length) {
            return this.errorResult('insert', operation.path, `Invalid line number: ${operation.insertLine} (file has ${lines.length} lines)`);
        }
        // Insert content
        lines.splice(operation.insertLine, 0, operation.content);
        // Write back
        await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');
        return {
            success: true,
            message: `Inserted text at line ${operation.insertLine} in: ${operation.path}`
        };
    }
    /**
     * DELETE operation implementation
     */
    async delete(operation) {
        const fullPath = this.getFullPath(operation.path);
        const exists = await fs.pathExists(fullPath);
        if (!exists) {
            return this.errorResult('delete', operation.path, `Path does not exist: ${operation.path}`);
        }
        // Remove file or directory
        await fs.remove(fullPath);
        return {
            success: true,
            message: `Deleted: ${operation.path}`
        };
    }
    /**
     * RENAME operation implementation
     */
    async rename(operation) {
        const fullOldPath = this.getFullPath(operation.path);
        const fullNewPath = this.getFullPath(operation.newPath);
        // Validate both paths
        if (!this.isValidPath(operation.path) || !this.isValidPath(operation.newPath)) {
            return this.errorResult('rename', operation.path, 'Invalid path (security violation)');
        }
        const exists = await fs.pathExists(fullOldPath);
        if (!exists) {
            return this.errorResult('rename', operation.path, `Path does not exist: ${operation.path}`);
        }
        // Ensure parent directory of new path exists
        await fs.ensureDir(path.dirname(fullNewPath));
        // Move/rename
        await fs.move(fullOldPath, fullNewPath, { overwrite: false });
        return {
            success: true,
            message: `Renamed: ${operation.path} → ${operation.newPath}`
        };
    }
    /**
     * Validate path for security
     *
     * Prevents directory traversal attacks
     */
    isValidPath(targetPath) {
        try {
            // Resolve path
            const fullPath = path.resolve(this.baseDir, targetPath);
            // Ensure path is within base directory
            if (!fullPath.startsWith(this.baseDir)) {
                console.warn('⚠️ Security violation: Path outside base directory:', targetPath);
                return false;
            }
            // Prevent dangerous patterns
            if (targetPath.includes('..') || targetPath.includes('~')) {
                console.warn('⚠️ Security violation: Dangerous path pattern:', targetPath);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('❌ Path validation error:', error);
            return false;
        }
    }
    /**
     * Get full path from relative path
     */
    getFullPath(relativePath) {
        return path.join(this.baseDir, relativePath);
    }
    /**
     * Create error result
     */
    errorResult(operation, path, error) {
        return {
            success: false,
            error,
            metadata: {
                path,
                operation,
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * Estimate token usage for content
     *
     * Rough approximation: 1 token ≈ 4 characters
     */
    estimateTokenUsage(content) {
        return Math.ceil(content.length / 4);
    }
}
/**
 * Global operations instance
 */
export const memoryToolOperations = new MemoryToolOperations();
export default MemoryToolOperations;
//# sourceMappingURL=memory-tool-operations.js.map