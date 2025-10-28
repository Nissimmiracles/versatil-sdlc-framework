/**
 * VERSATIL Agent Memory Manager
 *
 * Manages agent-specific memory directories and pattern storage
 * - Creates agent memory directories on activation
 * - Loads agent-specific patterns from memory
 * - Saves successful patterns to memory
 * - Memory lifecycle management (create, update, cleanup)
 *
 * Directory Structure:
 * ~/.versatil/memories/
 * ├── maria-qa/
 * │   ├── test-patterns.md
 * │   ├── coverage-strategies.md
 * │   └── bug-detection-patterns.md
 * ├── marcus-backend/
 * │   ├── api-security-patterns.md
 * │   ├── stress-test-examples.md
 * │   └── performance-optimizations.md
 * ├── james-frontend/
 * │   ├── react-patterns.md
 * │   ├── accessibility-fixes.md
 * │   └── performance-patterns.md
 * ... (for all 8 agents)
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { MEMORY_TOOL_CONFIG, AGENT_MEMORY_TEMPLATES, getAgentMemoryPath, getAllAgentIds } from './memory-tool-config.js';
/**
 * Agent Memory Manager
 *
 * Handles agent-specific memory operations
 */
export class AgentMemoryManager {
    constructor() {
        this.agentLastAccess = new Map();
        this.initialized = false;
        this.baseDir = MEMORY_TOOL_CONFIG.memoryDirectory;
    }
    /**
     * Initialize agent memory directories and templates
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            console.log('🤖 Initializing Agent Memory Manager...');
            // Create base memories directory
            await fs.ensureDir(this.baseDir);
            // Initialize each agent's memory directory
            for (const agentId of getAllAgentIds()) {
                await this.initializeAgentMemory(agentId);
            }
            // Create project-knowledge directory (shared across agents)
            const projectKnowledgePath = path.join(this.baseDir, 'project-knowledge');
            await fs.ensureDir(projectKnowledgePath);
            // Create shared templates
            await this.createSharedTemplates(projectKnowledgePath);
            this.initialized = true;
            console.log('✅ Agent Memory Manager initialized');
            console.log(`   Agents: ${getAllAgentIds().length}`);
            console.log(`   Base directory: ${this.baseDir}`);
        }
        catch (error) {
            console.error('❌ Failed to initialize Agent Memory Manager:', error);
            throw error;
        }
    }
    /**
     * Initialize memory directory for a specific agent
     *
     * @param agentId - Agent ID
     */
    async initializeAgentMemory(agentId) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            // Create agent directory
            await fs.ensureDir(agentPath);
            // Get templates for this agent
            const templates = AGENT_MEMORY_TEMPLATES[agentId] || [];
            // Create template files if they don't exist
            for (const template of templates) {
                const filePath = path.join(agentPath, template.filename);
                const exists = await fs.pathExists(filePath);
                if (!exists) {
                    await fs.writeFile(filePath, template.initialContent, 'utf-8');
                    console.log(`   ✅ Created template: ${agentId}/${template.filename}`);
                }
            }
            // Create metadata file
            const metadataFile = path.join(agentPath, '.metadata.json');
            const metadataExists = await fs.pathExists(metadataFile);
            if (!metadataExists) {
                const metadata = {
                    agentId,
                    createdAt: new Date().toISOString(),
                    lastAccess: new Date().toISOString(),
                    patternCount: templates.length
                };
                await fs.writeJson(metadataFile, metadata, { spaces: 2 });
            }
        }
        catch (error) {
            console.error(`❌ Failed to initialize memory for ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Create shared templates in project-knowledge directory
     */
    async createSharedTemplates(projectKnowledgePath) {
        const sharedTemplates = [
            {
                filename: 'architecture-decisions.md',
                content: `# Architecture Decisions

## Decision Log
Document major architectural decisions and their rationale.

### Template
\`\`\`markdown
## [Date] - [Decision Title]

**Context**: [What situation led to this decision?]

**Decision**: [What did we decide?]

**Rationale**: [Why did we make this decision?]

**Alternatives Considered**:
- [Alternative 1] - [Why rejected]
- [Alternative 2] - [Why rejected]

**Consequences**:
- [Positive consequence 1]
- [Positive consequence 2]
- [Negative consequence 1] (mitigated by...)

**Status**: [Proposed | Accepted | Deprecated | Superseded]
\`\`\`
`
            },
            {
                filename: 'tech-stack.md',
                content: `# Tech Stack

## Current Stack
Document the current technology stack and versions.

### Frontend
- Framework: [e.g., React 18.2]
- State Management: [e.g., Zustand]
- Styling: [e.g., Tailwind CSS]
- Testing: [e.g., Jest + React Testing Library]

### Backend
- Runtime: [e.g., Node.js 18]
- Framework: [e.g., Express]
- Database: [e.g., PostgreSQL 15]
- ORM: [e.g., Prisma]

### Infrastructure
- Hosting: [e.g., Vercel]
- Database: [e.g., Supabase]
- CI/CD: [e.g., GitHub Actions]
- Monitoring: [e.g., Sentry]

### Development Tools
- Package Manager: [e.g., npm]
- Linting: [e.g., ESLint]
- Formatting: [e.g., Prettier]
- Type Checking: [e.g., TypeScript]
`
            },
            {
                filename: 'lessons-learned.md',
                content: `# Lessons Learned

## Project Learnings
Document what worked well and what didn't.

### Template
\`\`\`markdown
## [Date] - [Topic]

**What Happened**: [Brief description]

**What Worked**:
- [Success 1]
- [Success 2]

**What Didn't Work**:
- [Failure 1] → [Root cause]
- [Failure 2] → [Root cause]

**Key Takeaways**:
1. [Lesson 1]
2. [Lesson 2]

**Action Items**:
- [ ] [Action 1]
- [ ] [Action 2]
\`\`\`
`
            }
        ];
        for (const template of sharedTemplates) {
            const filePath = path.join(projectKnowledgePath, template.filename);
            const exists = await fs.pathExists(filePath);
            if (!exists) {
                await fs.writeFile(filePath, template.content, 'utf-8');
                console.log(`   ✅ Created shared template: ${template.filename}`);
            }
        }
    }
    /**
     * Load patterns for a specific agent
     *
     * @param agentId - Agent ID
     * @returns Array of pattern contents (markdown)
     */
    async loadPatterns(agentId) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            const patterns = [];
            // Check if directory exists
            const exists = await fs.pathExists(agentPath);
            if (!exists) {
                console.warn(`⚠️ Agent memory directory does not exist: ${agentId}`);
                return patterns;
            }
            // Read all markdown files in agent directory
            const files = await fs.readdir(agentPath);
            for (const file of files) {
                // Skip metadata and cache files
                if (file.startsWith('.') || file.endsWith('-cache.md')) {
                    continue;
                }
                // Only read markdown files
                if (file.endsWith('.md')) {
                    const filePath = path.join(agentPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    patterns.push(content);
                }
            }
            // Update last access time
            await this.updateLastAccess(agentId);
            return patterns;
        }
        catch (error) {
            console.error(`❌ Failed to load patterns for ${agentId}:`, error);
            return [];
        }
    }
    /**
     * Store a pattern to agent memory
     *
     * @param agentId - Agent ID
     * @param patternName - Pattern filename (e.g., 'oauth-test-pattern.md')
     * @param content - Pattern content (markdown)
     */
    async storePattern(agentId, patternName, content) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            // Ensure filename ends with .md
            const filename = patternName.endsWith('.md') ? patternName : `${patternName}.md`;
            const filePath = path.join(agentPath, filename);
            // Write pattern file
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`✅ Stored pattern for ${agentId}: ${filename}`);
            // Update metadata
            await this.updateMetadata(agentId);
            // Update last access time
            await this.updateLastAccess(agentId);
        }
        catch (error) {
            console.error(`❌ Failed to store pattern for ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Update agent's last access time
     *
     * @param agentId - Agent ID
     */
    async updateLastAccess(agentId) {
        const now = new Date().toISOString();
        this.agentLastAccess.set(agentId, now);
        // Update metadata file
        try {
            const agentPath = getAgentMemoryPath(agentId);
            const metadataFile = path.join(agentPath, '.metadata.json');
            const exists = await fs.pathExists(metadataFile);
            if (exists) {
                const metadata = await fs.readJson(metadataFile);
                metadata.lastAccess = now;
                await fs.writeJson(metadataFile, metadata, { spaces: 2 });
            }
        }
        catch (error) {
            console.warn(`⚠️ Failed to update last access for ${agentId}:`, error);
        }
    }
    /**
     * Update agent metadata (pattern count, etc.)
     */
    async updateMetadata(agentId) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            const metadataFile = path.join(agentPath, '.metadata.json');
            // Count markdown files (exclude metadata and cache)
            const files = await fs.readdir(agentPath);
            const patternCount = files.filter(f => f.endsWith('.md') && !f.startsWith('.') && !f.endsWith('-cache.md')).length;
            // Get directory size
            const stats = await this.getDirectorySize(agentPath);
            const metadata = {
                agentId,
                lastAccess: new Date().toISOString(),
                patternCount,
                memorySizeMB: stats.sizeMB
            };
            await fs.writeJson(metadataFile, metadata, { spaces: 2 });
        }
        catch (error) {
            console.warn(`⚠️ Failed to update metadata for ${agentId}:`, error);
        }
    }
    /**
     * Get statistics for a specific agent
     *
     * @param agentId - Agent ID
     * @returns Agent memory statistics
     */
    async getAgentStats(agentId) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            const metadataFile = path.join(agentPath, '.metadata.json');
            // Load metadata
            const metadata = await fs.pathExists(metadataFile)
                ? await fs.readJson(metadataFile)
                : {
                    agentId,
                    lastAccess: 'Never',
                    patternCount: 0,
                    memorySizeMB: 0
                };
            // Get pattern metadata
            const patterns = await this.getPatternMetadata(agentId);
            return {
                agentId,
                patternCount: metadata.patternCount || 0,
                memorySizeMB: metadata.memorySizeMB || 0,
                lastAccess: metadata.lastAccess || 'Never',
                patterns
            };
        }
        catch (error) {
            console.error(`❌ Failed to get stats for ${agentId}:`, error);
            return {
                agentId,
                patternCount: 0,
                memorySizeMB: 0,
                lastAccess: 'Never',
                patterns: []
            };
        }
    }
    /**
     * Get pattern metadata for an agent
     */
    async getPatternMetadata(agentId) {
        try {
            const agentPath = getAgentMemoryPath(agentId);
            const patterns = [];
            const files = await fs.readdir(agentPath);
            for (const file of files) {
                // Only process markdown files (exclude metadata and cache)
                if (!file.endsWith('.md') || file.startsWith('.') || file.endsWith('-cache.md')) {
                    continue;
                }
                const filePath = path.join(agentPath, file);
                const stats = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                // Extract title from first heading
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
                // Extract description from content (first paragraph after title)
                const descMatch = content.match(/^#\s+.+\n\n(.+)$/m);
                const description = descMatch ? descMatch[1].substring(0, 100) : '';
                // Extract tags (if present in frontmatter or special section)
                const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
                const tags = tagsMatch
                    ? tagsMatch[1].split(',').map(t => t.trim())
                    : [];
                patterns.push({
                    filename: file,
                    title,
                    description,
                    createdAt: stats.birthtime.toISOString(),
                    updatedAt: stats.mtime.toISOString(),
                    accessCount: 0, // Would need separate tracking
                    tags
                });
            }
            return patterns;
        }
        catch (error) {
            console.error(`❌ Failed to get pattern metadata for ${agentId}:`, error);
            return [];
        }
    }
    /**
     * Get directory size recursively
     */
    async getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const items = await fs.readdir(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    const subStats = await this.getDirectorySize(itemPath);
                    totalSize += subStats.size;
                }
                else {
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            console.error('❌ Failed to get directory size:', error);
        }
        return {
            size: totalSize,
            sizeMB: totalSize / (1024 * 1024)
        };
    }
    /**
     * Cleanup old patterns based on retention policy
     *
     * @param agentId - Agent ID (optional, cleans all agents if not specified)
     */
    async cleanupOldPatterns(agentId) {
        try {
            const agentsToClean = agentId ? [agentId] : getAllAgentIds();
            for (const agent of agentsToClean) {
                const agentPath = getAgentMemoryPath(agent);
                const files = await fs.readdir(agentPath);
                // Find cache files older than TTL
                const ttlMs = MEMORY_TOOL_CONFIG.retentionPolicy.documentationCacheTTL * 24 * 60 * 60 * 1000;
                const now = Date.now();
                for (const file of files) {
                    if (file.endsWith('-cache.md')) {
                        const filePath = path.join(agentPath, file);
                        const stats = await fs.stat(filePath);
                        const age = now - stats.mtimeMs;
                        if (age > ttlMs) {
                            console.log(`🗑️ Removing stale cache: ${agent}/${file}`);
                            await fs.remove(filePath);
                        }
                    }
                }
            }
            console.log('✅ Pattern cleanup completed');
        }
        catch (error) {
            console.error('❌ Failed to cleanup old patterns:', error);
        }
    }
}
/**
 * Global agent memory manager instance
 */
export const agentMemoryManager = new AgentMemoryManager();
export default agentMemoryManager;
//# sourceMappingURL=agent-memory-manager.js.map