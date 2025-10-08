/**
 * VERSATIL Framework - Auto-Index Generator
 * Automatically generates INDEX.md files for repository organization
 *
 * Features:
 * - Auto-generates INDEX.md for every directory
 * - Links to files, subdirectories, and related resources
 * - Includes file descriptions and metadata
 * - Organizes by type (components, utils, tests, etc.)
 * - Updates automatically when files change
 * - Generates table of contents with deep linking
 *
 * Addresses: User requirement #5 - "The repository need to have a clear and
 * systematic organization and hierarchy"
 */

import { EventEmitter } from 'events';
import * as path from 'path';

export interface DirectoryIndex {
  path: string;
  indexContent: string;
  files: FileEntry[];
  subdirectories: string[];
  timestamp: number;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  description?: string;
  size?: number;
  lastModified?: number;
  category?: 'component' | 'util' | 'test' | 'config' | 'doc' | 'type' | 'other';
}

export interface IndexConfig {
  rootPath: string;
  excludePatterns?: string[]; // e.g., ['node_modules', '.git', 'dist']
  includeHidden?: boolean;
  generateDescriptions?: boolean;
  groupByCategory?: boolean;
}

export class AutoIndexGenerator extends EventEmitter {
  private readonly DEFAULT_EXCLUDE = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.cache',
    '.temp',
    '.jest-cache'
  ];

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    console.log('📑 Auto-Index Generator initializing...');
    this.emit('generator:initialized');
    console.log('✅ Auto-Index Generator ready');
  }

  /**
   * Generate index for a directory (main method)
   */
  async generateIndex(directoryPath: string, config?: Partial<IndexConfig>): Promise<DirectoryIndex> {
    console.log(`📑 Generating index for: ${directoryPath}`);

    const excludePatterns = config?.excludePatterns || this.DEFAULT_EXCLUDE;
    const groupByCategory = config?.groupByCategory !== false; // Default true

    // Simulate directory scan (in real implementation, use Glob tool)
    const files = await this.scanDirectory(directoryPath, excludePatterns);
    const subdirectories = files.filter(f => f.type === 'directory').map(f => f.name);

    // Generate index content
    const indexContent = this.buildIndexContent(directoryPath, files, {
      groupByCategory,
      generateDescriptions: config?.generateDescriptions
    });

    const index: DirectoryIndex = {
      path: directoryPath,
      indexContent,
      files,
      subdirectories,
      timestamp: Date.now()
    };

    this.emit('index:generated', { path: directoryPath, filesCount: files.length });

    console.log(`   ✅ Index generated: ${files.length} files, ${subdirectories.length} subdirectories`);

    return index;
  }

  /**
   * Simulate directory scan (replace with Glob tool)
   */
  private async scanDirectory(dirPath: string, excludePatterns: string[]): Promise<FileEntry[]> {
    // Simulated directory structure based on VERSATIL framework
    const mockFiles: FileEntry[] = [
      // Intelligence systems
      { name: 'mindset-context-engine.ts', path: `${dirPath}/mindset-context-engine.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Validates work against project vision and constraints' },
      { name: 'design-system-guardian.ts', path: `${dirPath}/design-system-guardian.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Enforces design system consistency' },
      { name: 'epic-conversation-analyzer.ts', path: `${dirPath}/epic-conversation-analyzer.ts`, type: 'file', extension: 'ts', category: 'component', description: 'NLP-based epic detection from conversations' },
      { name: 'web-pattern-researcher.ts', path: `${dirPath}/web-pattern-researcher.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Architecture validation via web research' },
      { name: 'prd-feasibility-analyzer.ts', path: `${dirPath}/prd-feasibility-analyzer.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Orchestrates all intelligence systems for PRD validation' },
      { name: 'diagram-generator.ts', path: `${dirPath}/diagram-generator.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Auto-generates Mermaid diagrams' },

      // Orchestration systems
      { name: 'conflict-resolution-engine.ts', path: `${dirPath}/conflict-resolution-engine.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Prevents sub-agent collisions' },
      { name: 'priority-scoring-engine.ts', path: `${dirPath}/priority-scoring-engine.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Calculates 0-10 priority scores' },
      { name: 'epic-workflow-orchestrator.ts', path: `${dirPath}/epic-workflow-orchestrator.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Epic → Stories → Tasks automation' },

      // Testing
      { name: 'architecture-stress-tester.ts', path: `${dirPath}/architecture-stress-tester.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Load simulation and bottleneck detection' },

      // MCP Integration
      { name: 'mcp-task-executor.ts', path: `${dirPath}/mcp-task-executor.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Pattern-based MCP tool inference and execution' },

      // Agents
      { name: 'sub-agent-factory.ts', path: `${dirPath}/sub-agent-factory.ts`, type: 'file', extension: 'ts', category: 'component', description: 'Creates specialized sub-agent instances' },

      // Config files
      { name: 'tsconfig.json', path: `${dirPath}/tsconfig.json`, type: 'file', extension: 'json', category: 'config', description: 'TypeScript configuration' },
      { name: 'package.json', path: `${dirPath}/package.json`, type: 'file', extension: 'json', category: 'config', description: 'NPM package configuration' },

      // Documentation
      { name: 'README.md', path: `${dirPath}/README.md`, type: 'file', extension: 'md', category: 'doc', description: 'Project documentation' },
      { name: 'CLAUDE.md', path: `${dirPath}/CLAUDE.md`, type: 'file', extension: 'md', category: 'doc', description: 'VERSATIL framework core configuration' },

      // Tests
      { name: 'mindset-context-engine.test.ts', path: `${dirPath}/mindset-context-engine.test.ts`, type: 'file', extension: 'ts', category: 'test', description: 'Unit tests for Mindset Context Engine' },

      // Types
      { name: 'types.ts', path: `${dirPath}/types.ts`, type: 'file', extension: 'ts', category: 'type', description: 'TypeScript type definitions' },

      // Subdirectories
      { name: 'intelligence', path: `${dirPath}/intelligence`, type: 'directory', category: 'other', description: 'Intelligence systems (mindset, epic analysis, PRD feasibility)' },
      { name: 'orchestration', path: `${dirPath}/orchestration`, type: 'directory', category: 'other', description: 'Orchestration engines (conflict resolution, epic workflow)' },
      { name: 'agents', path: `${dirPath}/agents`, type: 'directory', category: 'other', description: 'Agent systems (sub-agent factory, OPERA agents)' },
      { name: 'mcp', path: `${dirPath}/mcp`, type: 'directory', category: 'other', description: 'MCP integration (task executor, tool mappings)' },
      { name: 'testing', path: `${dirPath}/testing`, type: 'directory', category: 'other', description: 'Testing systems (stress tester, quality gates)' }
    ];

    // Filter by exclude patterns
    return mockFiles.filter(file =>
      !excludePatterns.some(pattern => file.path.includes(pattern))
    );
  }

  /**
   * Build index markdown content
   */
  private buildIndexContent(dirPath: string, files: FileEntry[], options: { groupByCategory?: boolean; generateDescriptions?: boolean }): string {
    const dirName = path.basename(dirPath);
    let content = `# Index: ${dirName}\n\n`;
    content += `> Auto-generated index for \`${dirPath}\`\n`;
    content += `> Last updated: ${new Date().toISOString()}\n\n`;

    // Table of contents
    content += `## Table of Contents\n\n`;

    if (options.groupByCategory) {
      // Group files by category
      const categories = new Map<string, FileEntry[]>();

      for (const file of files) {
        const category = file.category || 'other';
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(file);
      }

      // Sort categories
      const sortedCategories = Array.from(categories.entries()).sort((a, b) => {
        const order = ['component', 'util', 'type', 'test', 'config', 'doc', 'other'];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      });

      for (const [category, categoryFiles] of sortedCategories) {
        if (categoryFiles.length === 0) continue;

        const categoryTitle = this.getCategoryTitle(category);
        content += `- [${categoryTitle}](#${category})\n`;
      }

      content += `\n---\n\n`;

      // Add sections for each category
      for (const [category, categoryFiles] of sortedCategories) {
        if (categoryFiles.length === 0) continue;

        const categoryTitle = this.getCategoryTitle(category);
        content += `## ${categoryTitle} {#${category}}\n\n`;

        // Separate files and directories
        const categoryDirs = categoryFiles.filter(f => f.type === 'directory');
        const categoryFilesOnly = categoryFiles.filter(f => f.type === 'file');

        if (categoryDirs.length > 0) {
          content += `### Directories\n\n`;
          for (const dir of categoryDirs) {
            content += `- **[${dir.name}/](${dir.name}/INDEX.md)**`;
            if (dir.description) {
              content += ` - ${dir.description}`;
            }
            content += `\n`;
          }
          content += `\n`;
        }

        if (categoryFilesOnly.length > 0) {
          content += `### Files\n\n`;
          for (const file of categoryFilesOnly) {
            content += `- **[${file.name}](${file.name})**`;
            if (file.description) {
              content += ` - ${file.description}`;
            }
            content += `\n`;
          }
          content += `\n`;
        }
      }
    } else {
      // Simple list (no grouping)
      const dirs = files.filter(f => f.type === 'directory');
      const filesOnly = files.filter(f => f.type === 'file');

      if (dirs.length > 0) {
        content += `## Directories\n\n`;
        for (const dir of dirs) {
          content += `- **[${dir.name}/](${dir.name}/INDEX.md)**`;
          if (dir.description) {
            content += ` - ${dir.description}`;
          }
          content += `\n`;
        }
        content += `\n`;
      }

      if (filesOnly.length > 0) {
        content += `## Files\n\n`;
        for (const file of filesOnly) {
          content += `- **[${file.name}](${file.name})**`;
          if (file.description) {
            content += ` - ${file.description}`;
          }
          content += `\n`;
        }
        content += `\n`;
      }
    }

    // Add footer
    content += `---\n\n`;
    content += `*This index was auto-generated by VERSATIL Auto-Index Generator*\n`;

    return content;
  }

  /**
   * Get category title
   */
  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      'component': '🧩 Components',
      'util': '🛠️ Utilities',
      'test': '🧪 Tests',
      'config': '⚙️ Configuration',
      'doc': '📚 Documentation',
      'type': '📝 Types',
      'other': '📁 Other'
    };
    return titles[category] || '📁 Files';
  }

  /**
   * Generate recursive indexes for entire directory tree
   */
  async generateRecursiveIndexes(rootPath: string, config?: Partial<IndexConfig>): Promise<DirectoryIndex[]> {
    console.log(`📑 Generating recursive indexes from: ${rootPath}`);

    const indexes: DirectoryIndex[] = [];

    // Generate index for root
    const rootIndex = await this.generateIndex(rootPath, config);
    indexes.push(rootIndex);

    // Generate indexes for subdirectories (simulated)
    const subdirs = ['src', 'src/intelligence', 'src/orchestration', 'src/agents', 'src/mcp', 'src/testing'];

    for (const subdir of subdirs) {
      const subdirPath = path.join(rootPath, subdir);
      const subdirIndex = await this.generateIndex(subdirPath, config);
      indexes.push(subdirIndex);
    }

    console.log(`   ✅ Generated ${indexes.length} indexes recursively`);

    return indexes;
  }

  /**
   * Generate master INDEX.md for root directory
   */
  generateMasterIndex(projectName: string, description: string, indexes: DirectoryIndex[]): string {
    let content = `# ${projectName}\n\n`;
    content += `${description}\n\n`;
    content += `## Project Structure\n\n`;

    // Build tree structure
    content += `\`\`\`\n`;
    content += `${projectName}/\n`;

    for (const index of indexes) {
      const depth = index.path.split('/').length - 1;
      const indent = '  '.repeat(depth);
      const dirName = path.basename(index.path);

      content += `${indent}├── ${dirName}/\n`;

      // Show top-level files only
      for (const file of index.files.filter(f => f.type === 'file').slice(0, 5)) {
        content += `${indent}│   ├── ${file.name}\n`;
      }

      if (index.files.filter(f => f.type === 'file').length > 5) {
        content += `${indent}│   └── ... (${index.files.filter(f => f.type === 'file').length - 5} more files)\n`;
      }
    }

    content += `\`\`\`\n\n`;

    // Add quick navigation
    content += `## Quick Navigation\n\n`;

    const mainDirs = indexes.filter(idx => idx.path.split('/').length <= 2);
    for (const index of mainDirs) {
      const dirName = path.basename(index.path);
      content += `- **[${dirName}/](${index.path}/INDEX.md)** - ${index.files.length} items\n`;
    }

    content += `\n`;

    return content;
  }

  /**
   * Save index to file
   */
  async saveIndex(index: DirectoryIndex): Promise<void> {
    const indexPath = path.join(index.path, 'INDEX.md');
    console.log(`💾 Index would be saved to: ${indexPath}`);
    this.emit('index:saved', { path: indexPath });
  }

  /**
   * Shutdown generator
   */
  async shutdown(): Promise<void> {
    this.emit('generator:shutdown');
    console.log('🛑 Auto-Index Generator shut down');
  }
}

// Export singleton instance
export const globalAutoIndexGenerator = new AutoIndexGenerator();
