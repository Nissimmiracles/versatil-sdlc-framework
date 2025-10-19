/**
 * Context-Aware Agent Wrapper
 *
 * Integrates Memory Tool + Context Editing with VERSATIL OPERA agents
 *
 * Features:
 * - Automatic memory directory viewing before tasks
 * - Pattern storage and retrieval across sessions
 * - Context editing for long conversations
 * - Agent-specific memory paths
 *
 * References:
 * - https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 * - https://docs.claude.com/en/docs/build-with-claude/context-editing
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import {
  MEMORY_TOOL_CONFIG,
  getAgentMemoryPath,
  type AgentId
} from '../../memory/memory-tool-config.js';
import { memoryToolHandler } from '../../memory/memory-tool-handler.js';

/**
 * Enhance agent definition with Memory Tool + Context Editing
 *
 * Usage:
 * ```typescript
 * const mariaQA = createContextAwareAgent('maria-qa', MARIA_QA_AGENT);
 * ```
 */
export function createContextAwareAgent(
  agentId: AgentId,
  baseAgent: AgentDefinition
): AgentDefinition {
  return {
    ...baseAgent,

    // Enable Claude's context management beta
    beta: MEMORY_TOOL_CONFIG.beta,

    // Add Memory Tool instructions to prompt
    prompt: enhancePromptWithMemory(agentId, baseAgent.prompt),

    // Configure context editing
    contextManagement: MEMORY_TOOL_CONFIG.contextManagement,

    // Exclude critical tools from context clearing
    excludeTools: MEMORY_TOOL_CONFIG.excludeTools
  };
}

/**
 * Enhance agent prompt with Memory Tool instructions
 *
 * Adds memory workflow pattern to existing agent prompt
 */
function enhancePromptWithMemory(agentId: AgentId, basePrompt: string): string {
  const memoryPath = MEMORY_TOOL_CONFIG.agentMemoryPaths[agentId];

  return `${basePrompt}

---

## 🧠 Memory Tool Integration (CRITICAL)

You have access to a persistent memory system at \`~/.versatil/memories/${memoryPath}\`.

### Memory Workflow (MANDATORY for EVERY task)

1. **ALWAYS view memory directory BEFORE starting work**
   \`\`\`
   memory view ${memoryPath}
   \`\`\`

2. **Retrieve relevant patterns from memory files**
   - Read pattern files that match current task
   - Apply proven patterns from previous sessions
   - Build on existing knowledge instead of starting from scratch

3. **Apply patterns to current task**
   - Use stored test patterns, code examples, best practices
   - Reference successful solutions from past work
   - Maintain consistency with project standards

4. **Update memories with new learnings**
   - When you discover a new successful pattern → store it
   - When you fix a bug → document the bug signature
   - When you optimize something → save the optimization

5. **Store patterns for future use**
   \`\`\`
   memory create ${memoryPath}new-pattern.md
   # Successful pattern documented
   \`\`\`

### Memory Tool Commands

- \`memory view [path]\`: Show directory/file contents
- \`memory create [path] [content]\`: Create/overwrite file
- \`memory str_replace [path] [old] [new]\`: Replace text in file
- \`memory insert [path] [line] [content]\`: Insert text at line
- \`memory delete [path]\`: Remove file/directory
- \`memory rename [old_path] [new_path]\`: Move/rename file

### What to Store in Memory

**DO Store:**
- ✅ Successful patterns and strategies
- ✅ Bug signatures and fixes
- ✅ Performance optimizations
- ✅ Code examples that worked well
- ✅ Best practices for specific libraries
- ✅ Project-specific conventions

**DON'T Store:**
- ❌ Sensitive information (API keys, passwords)
- ❌ Full conversation history (use patterns, not transcripts)
- ❌ Temporary debugging information
- ❌ Duplicate information already in files

### Memory + Context Editing (Beta: context-management-2025-06-27)

**Context editing is ENABLED** for this agent to manage long conversations automatically.

#### How It Works

When conversation context reaches **100,000 input tokens**:
1. ✅ **Automatic clearing triggered** - Old tool results removed to free space
2. ✅ **Last 3 tool uses preserved** - Recent context kept for continuity
3. ✅ **Memory operations NEVER cleared** - Your patterns always accessible
4. ✅ **Minimum 5,000 tokens cleared** - Ensures worthwhile cache invalidation

#### Best Practices for Context Management

**BEFORE context clears (proactive)**:
1. Store critical patterns to memory files immediately when discovered
2. Don't wait - context clearing can happen mid-conversation
3. Use descriptive filenames: \`authentication-pattern-jwt.md\` not \`notes.md\`

**DURING long conversations**:
1. Periodically save progress to memory (every 10-15 significant findings)
2. Reference memory files instead of relying on conversation history
3. Update existing memory files with \`str_replace\` instead of creating duplicates

**AFTER context clears**:
1. Read from memory to restore context (patterns persist!)
2. Continue work seamlessly using stored knowledge
3. **ZERO CONTEXT LOSS** because everything important is in memory ✅

#### Excluded Tools (Never Cleared)

These tool results are ALWAYS preserved, even during context editing:
- \`memory\` - Memory Tool operations (view, create, etc.)
- \`Read\` - File read operations
- \`Write\` - File write operations
- \`TodoWrite\` - Task tracking
- \`Edit\` - File edit operations
- \`Bash\` - Shell command executions

**Why?** These tools provide critical context about project state and cannot be safely discarded.

### Example Memory Workflow

\`\`\`
Agent: Maria-QA

1. View memory:
   memory view maria-qa/

2. Output:
   test-patterns.md
   bug-signatures.md
   coverage-strategies.md

3. Read test patterns:
   memory view maria-qa/test-patterns.md

4. Apply patterns to current task:
   - Use React Testing Library pattern for component tests
   - Follow coverage strategy for 80%+ target

5. Discover new pattern:
   - Found efficient way to test async hooks

6. Store new pattern:
   memory str_replace maria-qa/test-patterns.md
   "## Notes"
   "### Pattern: Async Hooks Testing
   (triple backtick)typescript
   test('async hook updates state', async () => {
     const { result, waitForNextUpdate } = renderHook(() => useAsyncData());
     await waitForNextUpdate();
     expect(result.current.data).toBeDefined();
   });
   (triple backtick)

   ## Notes"
\`\`\`

### Benefits of Memory Tool

- **Compounding Learning**: Each task improves future tasks
- **Consistency**: Maintain project standards across sessions
- **Speed**: Reuse proven patterns instead of re-discovering
- **Quality**: Build on successful solutions
- **Context Preservation**: Zero loss even in long conversations

### Integration with VERSATIL RAG

- **Memory Tool**: Semantic patterns, agent-specific knowledge (this)
- **Supabase RAG**: Code examples, project-wide patterns, embeddings (existing)
- **Claude Memory**: User preferences, high-level decisions (existing)

All three work together for **complete context preservation**.

---

**CRITICAL**: Your first action for EVERY task MUST be viewing your memory directory. This is not optional.
`;
}

/**
 * Create Memory Tool API for agents
 *
 * Provides clean interface for agents to interact with memories
 */
export class AgentMemoryAPI {
  constructor(private agentId: AgentId) {}

  /**
   * View memory directory or file
   */
  async view(path: string = ''): Promise<string> {
    const fullPath = path || MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId];
    const result = await memoryToolHandler.execute({
      type: 'view',
      path: fullPath
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.content || '';
  }

  /**
   * Create or update memory file
   */
  async create(filename: string, content: string): Promise<void> {
    const fullPath = `${MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId]}${filename}`;
    const result = await memoryToolHandler.execute({
      type: 'create',
      path: fullPath,
      content
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Replace text in memory file
   */
  async strReplace(filename: string, oldStr: string, newStr: string): Promise<void> {
    const fullPath = `${MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId]}${filename}`;
    const result = await memoryToolHandler.execute({
      type: 'str_replace',
      path: fullPath,
      oldStr,
      newStr
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Insert text at specific line in memory file
   */
  async insert(filename: string, line: number, content: string): Promise<void> {
    const fullPath = `${MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId]}${filename}`;
    const result = await memoryToolHandler.execute({
      type: 'insert',
      path: fullPath,
      insertLine: line,
      content
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Delete memory file
   */
  async delete(filename: string): Promise<void> {
    const fullPath = `${MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId]}${filename}`;
    const result = await memoryToolHandler.execute({
      type: 'delete',
      path: fullPath
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Rename memory file
   */
  async rename(oldFilename: string, newFilename: string): Promise<void> {
    const agentPath = MEMORY_TOOL_CONFIG.agentMemoryPaths[this.agentId];
    const result = await memoryToolHandler.execute({
      type: 'rename',
      path: `${agentPath}${oldFilename}`,
      newPath: `${agentPath}${newFilename}`
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Store a pattern to memory
   *
   * High-level API for storing successful patterns
   */
  async storePattern(pattern: MemoryPattern): Promise<void> {
    const filename = `${pattern.category}-patterns.md`;
    const patternMarkdown = formatPatternAsMarkdown(pattern);

    try {
      // Try to append to existing file
      const existing = await this.view(filename);
      await this.strReplace(
        filename,
        '## Notes',
        `${patternMarkdown}\n\n## Notes`
      );
    } catch {
      // File doesn't exist, create new
      await this.create(filename, `# ${this.agentId} ${pattern.category} Patterns\n\n${patternMarkdown}\n\n## Notes\n`);
    }
  }

  /**
   * Retrieve patterns by category
   */
  async getPatterns(category: string): Promise<string> {
    const filename = `${category}-patterns.md`;
    try {
      return await this.view(filename);
    } catch {
      return ''; // No patterns found
    }
  }
}

export interface MemoryPattern {
  category: string;
  title: string;
  description: string;
  code?: string;
  language?: string;
  tags?: string[];
  successRate?: string;
}

/**
 * Format pattern as markdown
 */
function formatPatternAsMarkdown(pattern: MemoryPattern): string {
  let md = `### Pattern: ${pattern.title}\n`;
  md += `${pattern.description}\n`;

  if (pattern.code) {
    md += `\`\`\`${pattern.language || 'typescript'}\n${pattern.code}\n\`\`\`\n`;
  }

  if (pattern.tags && pattern.tags.length > 0) {
    md += `\n**Tags**: ${pattern.tags.join(', ')}\n`;
  }

  if (pattern.successRate) {
    md += `**Success Rate**: ${pattern.successRate}\n`;
  }

  return md;
}

/**
 * Initialize all agent memories
 */
export async function initializeAgentMemories(): Promise<void> {
  await memoryToolHandler.initialize();
  console.log('✅ All agent memories initialized');
}

/**
 * Get memory API for specific agent
 */
export function getAgentMemoryAPI(agentId: AgentId): AgentMemoryAPI {
  return new AgentMemoryAPI(agentId);
}
