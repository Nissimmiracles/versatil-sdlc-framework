/**
 * Conversation Backup Manager
 * Real-time conversation state backup for Claude's native "/resume conversation"
 *
 * @module ConversationBackupManager
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

/**
 * Conversation message structure
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    agentId?: string;
    taskType?: string;
    filesModified?: string[];
    [key: string]: any;
  };
}

/**
 * Conversation state snapshot
 */
export interface ConversationSnapshot {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  context: {
    projectPath: string;
    gitBranch?: string;
    gitCommit?: string;
    workingFiles?: string[];
    activeAgents?: string[];
    linkedDocs?: string[]; // NEW: Links to related docs/plans/roadmaps
    currentSprint?: string; // NEW: Current sprint (e.g., "Sprint 1")
    currentPhase?: string; // NEW: Current phase (e.g., "Day 3-4")
  };
  metadata: {
    messageCount: number;
    duration: number;
    lastAgent?: string;
    tags?: string[];
    linkedRoadmaps?: string[]; // NEW: Linked roadmap files
    linkedPlans?: string[]; // NEW: Linked plan files
    completedTasks?: string[]; // NEW: Tasks completed in this conversation
  };
}

/**
 * Conversation Backup Manager
 *
 * Automatically saves conversation state to disk for seamless resume capability
 * Compatible with Claude's native "/resume conversation" command
 */
export class ConversationBackupManager {
  private backupDir: string;
  private currentConversation: ConversationSnapshot | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds

  constructor(projectPath?: string) {
    // Store backups in ~/.versatil/conversations/
    this.backupDir = join(
      projectPath || process.cwd(),
      '.versatil',
      'conversations'
    );
  }

  /**
   * Initialize conversation backup system
   */
  async initialize(): Promise<void> {
    // Create backup directory
    await fs.mkdir(this.backupDir, { recursive: true });

    // Create index file if doesn't exist
    const indexPath = join(this.backupDir, 'index.json');
    try {
      await fs.access(indexPath);
    } catch {
      await fs.writeFile(indexPath, JSON.stringify({ conversations: [] }, null, 2));
    }

    console.log(`✅ Conversation backup system initialized: ${this.backupDir}`);
  }

  /**
   * Start a new conversation
   */
  async startConversation(title: string, projectPath: string): Promise<string> {
    const conversationId = this.generateConversationId();

    this.currentConversation = {
      id: conversationId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      context: {
        projectPath,
        gitBranch: await this.getCurrentGitBranch(projectPath),
        gitCommit: await this.getCurrentGitCommit(projectPath),
        workingFiles: [],
        activeAgents: []
      },
      metadata: {
        messageCount: 0,
        duration: 0,
        tags: []
      }
    };

    // Save initial state
    await this.saveConversation();

    // Update index
    await this.addToIndex(this.currentConversation);

    // Start auto-save
    this.startAutoSave();

    console.log(`📝 Started conversation: ${conversationId} - "${title}"`);

    return conversationId;
  }

  /**
   * Add message to current conversation
   */
  async addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation. Call startConversation() first.');
    }

    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      metadata
    };

    this.currentConversation.messages.push(message);
    this.currentConversation.updatedAt = Date.now();
    this.currentConversation.metadata.messageCount++;
    this.currentConversation.metadata.duration =
      Date.now() - this.currentConversation.createdAt;

    // Update last agent if present
    if (metadata?.agentId) {
      this.currentConversation.metadata.lastAgent = metadata.agentId;

      // Track active agents
      if (!this.currentConversation.context.activeAgents?.includes(metadata.agentId)) {
        this.currentConversation.context.activeAgents?.push(metadata.agentId);
      }
    }

    // Save immediately on user messages or every 10 assistant messages
    if (role === 'user' || this.currentConversation.metadata.messageCount % 10 === 0) {
      await this.saveConversation();
    }
  }

  /**
   * Save current conversation to disk
   */
  async saveConversation(): Promise<void> {
    if (!this.currentConversation) {
      return;
    }

    const filePath = this.getConversationPath(this.currentConversation.id);

    await fs.writeFile(
      filePath,
      JSON.stringify(this.currentConversation, null, 2),
      'utf-8'
    );

    console.log(`💾 Conversation saved: ${this.currentConversation.id} (${this.currentConversation.metadata.messageCount} messages)`);
  }

  /**
   * Load conversation by ID
   */
  async loadConversation(conversationId: string): Promise<ConversationSnapshot> {
    const filePath = this.getConversationPath(conversationId);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      this.currentConversation = JSON.parse(data);

      console.log(`📂 Conversation loaded: ${conversationId} - "${this.currentConversation?.title}"`);

      return this.currentConversation!;
    } catch (error: any) {
      throw new Error(`Failed to load conversation ${conversationId}: ${error.message}`);
    }
  }

  /**
   * Resume conversation (for Claude's /resume command)
   */
  async resumeConversation(conversationId: string): Promise<ConversationSnapshot> {
    const conversation = await this.loadConversation(conversationId);

    // Restart auto-save
    this.startAutoSave();

    console.log(`🔄 Conversation resumed: ${conversationId}`);
    console.log(`   Messages: ${conversation.metadata.messageCount}`);
    console.log(`   Duration: ${this.formatDuration(conversation.metadata.duration)}`);
    console.log(`   Last agent: ${conversation.metadata.lastAgent || 'N/A'}`);

    return conversation;
  }

  /**
   * End current conversation
   */
  async endConversation(): Promise<void> {
    if (!this.currentConversation) {
      return;
    }

    // Final save
    await this.saveConversation();

    // Stop auto-save
    this.stopAutoSave();

    console.log(`✅ Conversation ended: ${this.currentConversation.id}`);
    console.log(`   Total messages: ${this.currentConversation.metadata.messageCount}`);
    console.log(`   Duration: ${this.formatDuration(this.currentConversation.metadata.duration)}`);

    this.currentConversation = null;
  }

  /**
   * List all conversations
   */
  async listConversations(): Promise<ConversationSnapshot[]> {
    const indexPath = join(this.backupDir, 'index.json');

    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(data);
      return index.conversations || [];
    } catch {
      return [];
    }
  }

  /**
   * Search conversations by title or content
   */
  async searchConversations(query: string): Promise<ConversationSnapshot[]> {
    const conversations = await this.listConversations();
    const lowerQuery = query.toLowerCase();

    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export conversation to markdown for documentation
   */
  async exportToMarkdown(conversationId: string): Promise<string> {
    const conversation = await this.loadConversation(conversationId);

    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Created**: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    markdown += `**Duration**: ${this.formatDuration(conversation.metadata.duration)}\n`;
    markdown += `**Messages**: ${conversation.metadata.messageCount}\n`;
    markdown += `**Project**: ${conversation.context.projectPath}\n\n`;

    markdown += `---\n\n`;

    for (const message of conversation.messages) {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const role = message.role.toUpperCase();

      markdown += `## [${timestamp}] ${role}\n\n`;

      if (message.metadata?.agentId) {
        markdown += `**Agent**: ${message.metadata.agentId}\n\n`;
      }

      markdown += `${message.content}\n\n`;

      if (message.metadata?.filesModified && message.metadata.filesModified.length > 0) {
        markdown += `**Files Modified**: ${message.metadata.filesModified.join(', ')}\n\n`;
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * Link documentation files to current conversation
   */
  async linkDocuments(docs: string[]): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    if (!this.currentConversation.context.linkedDocs) {
      this.currentConversation.context.linkedDocs = [];
    }

    for (const doc of docs) {
      if (!this.currentConversation.context.linkedDocs.includes(doc)) {
        this.currentConversation.context.linkedDocs.push(doc);
      }
    }

    await this.saveConversation();

    console.log(`📎 Linked ${docs.length} document(s) to conversation`);
  }

  /**
   * Link roadmaps and plans to metadata
   */
  async linkPlansAndRoadmaps(roadmaps: string[], plans: string[]): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    this.currentConversation.metadata.linkedRoadmaps = roadmaps;
    this.currentConversation.metadata.linkedPlans = plans;

    await this.saveConversation();

    console.log(`🗺️  Linked ${roadmaps.length} roadmap(s) and ${plans.length} plan(s)`);
  }

  /**
   * Set current sprint and phase
   */
  async setSprintAndPhase(sprint: string, phase?: string): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    this.currentConversation.context.currentSprint = sprint;
    if (phase) {
      this.currentConversation.context.currentPhase = phase;
    }

    await this.saveConversation();

    console.log(`📅 Set sprint: ${sprint}${phase ? `, phase: ${phase}` : ''}`);
  }

  /**
   * Add completed task
   */
  async addCompletedTask(task: string): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    if (!this.currentConversation.metadata.completedTasks) {
      this.currentConversation.metadata.completedTasks = [];
    }

    this.currentConversation.metadata.completedTasks.push(task);

    await this.saveConversation();

    console.log(`✅ Task completed: ${task}`);
  }

  /**
   * Generate Claude-compatible resume context (ENHANCED with docs/plans/roadmaps)
   */
  async generateResumeContext(conversationId: string): Promise<string> {
    const conversation = await this.loadConversation(conversationId);

    // Get last 10 messages for context
    const recentMessages = conversation.messages.slice(-10);

    let context = `# Resume Conversation: ${conversation.title}\n\n`;

    context += `## Project Context\n\n`;
    context += `- **Project**: ${conversation.context.projectPath}\n`;
    context += `- **Branch**: ${conversation.context.gitBranch || 'N/A'}\n`;
    context += `- **Commit**: ${conversation.context.gitCommit || 'N/A'}\n`;

    if (conversation.context.currentSprint) {
      context += `- **Sprint**: ${conversation.context.currentSprint}\n`;
    }
    if (conversation.context.currentPhase) {
      context += `- **Phase**: ${conversation.context.currentPhase}\n`;
    }

    context += `- **Active Agents**: ${conversation.context.activeAgents?.join(', ') || 'None'}\n`;
    context += `- **Total Messages**: ${conversation.metadata.messageCount}\n`;
    context += `- **Duration**: ${this.formatDuration(conversation.metadata.duration)}\n\n`;

    // Linked Documents Section
    if (conversation.context.linkedDocs && conversation.context.linkedDocs.length > 0) {
      context += `## Linked Documents\n\n`;
      for (const doc of conversation.context.linkedDocs) {
        context += `- ${doc}\n`;

        // Try to read first 200 chars of doc
        try {
          const docContent = await fs.readFile(doc, 'utf-8');
          const preview = docContent.substring(0, 200).replace(/\n/g, ' ');
          context += `  > ${preview}...\n`;
        } catch {
          context += `  > (Unable to read file)\n`;
        }
      }
      context += `\n`;
    }

    // Linked Roadmaps & Plans
    if (conversation.metadata.linkedRoadmaps && conversation.metadata.linkedRoadmaps.length > 0) {
      context += `## Linked Roadmaps\n\n`;
      for (const roadmap of conversation.metadata.linkedRoadmaps) {
        context += `- ${roadmap}\n`;
      }
      context += `\n`;
    }

    if (conversation.metadata.linkedPlans && conversation.metadata.linkedPlans.length > 0) {
      context += `## Linked Plans\n\n`;
      for (const plan of conversation.metadata.linkedPlans) {
        context += `- ${plan}\n`;
      }
      context += `\n`;
    }

    // Completed Tasks
    if (conversation.metadata.completedTasks && conversation.metadata.completedTasks.length > 0) {
      context += `## Completed Tasks\n\n`;
      for (const task of conversation.metadata.completedTasks) {
        context += `- ✅ ${task}\n`;
      }
      context += `\n`;
    }

    // Recent Messages
    context += `## Recent Messages (Last 10)\n\n`;

    for (const message of recentMessages) {
      const time = new Date(message.timestamp).toLocaleTimeString();
      const preview = message.content.substring(0, 300);
      context += `**[${time}] ${message.role}**: ${preview}${message.content.length > 300 ? '...' : ''}\n\n`;

      if (message.metadata?.filesModified && message.metadata.filesModified.length > 0) {
        context += `  📝 Files modified: ${message.metadata.filesModified.slice(0, 5).join(', ')}\n\n`;
      }
    }

    context += `---\n\n`;
    context += `## Continue from here...\n\n`;
    context += `Use the above context to resume this conversation. All linked documents, roadmaps, and plans are available for reference.\n`;

    return context;
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      return;
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.currentConversation) {
        await this.saveConversation();
      }
    }, this.AUTO_SAVE_INTERVAL);

    console.log(`⏰ Auto-save enabled (every ${this.AUTO_SAVE_INTERVAL / 1000}s)`);
  }

  /**
   * Stop auto-save interval
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log(`⏸️  Auto-save disabled`);
    }
  }

  /**
   * Add conversation to index
   */
  private async addToIndex(conversation: ConversationSnapshot): Promise<void> {
    const indexPath = join(this.backupDir, 'index.json');

    let index: { conversations: any[] };
    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(data);
    } catch {
      index = { conversations: [] };
    }

    // Add or update
    const existingIndex = index.conversations.findIndex(c => c.id === conversation.id);
    if (existingIndex >= 0) {
      index.conversations[existingIndex] = conversation;
    } else {
      index.conversations.push(conversation);
    }

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `conv-${timestamp}-${random}`;
  }

  /**
   * Get conversation file path
   */
  private getConversationPath(conversationId: string): string {
    return join(this.backupDir, `${conversationId}.json`);
  }

  /**
   * Get current git branch
   */
  private async getCurrentGitBranch(projectPath: string): Promise<string | undefined> {
    try {
      const branch = execSync('git branch --show-current', {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim();
      return branch || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current git commit
   */
  private async getCurrentGitCommit(projectPath: string): Promise<string | undefined> {
    try {
      const commit = execSync('git rev-parse --short HEAD', {
        cwd: projectPath,
        encoding: 'utf-8'
      }).trim();
      return commit || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get current conversation
   */
  getCurrentConversation(): ConversationSnapshot | null {
    return this.currentConversation;
  }

  /**
   * Cleanup old conversations (keep last N)
   */
  async cleanupOldConversations(keepCount: number = 50): Promise<number> {
    const conversations = await this.listConversations();

    if (conversations.length <= keepCount) {
      return 0;
    }

    // Sort by creation date (oldest first)
    conversations.sort((a, b) => a.createdAt - b.createdAt);

    // Delete oldest
    const toDelete = conversations.slice(0, conversations.length - keepCount);
    let deletedCount = 0;

    for (const conv of toDelete) {
      try {
        const filePath = this.getConversationPath(conv.id);
        await fs.unlink(filePath);
        deletedCount++;
      } catch (error: any) {
        console.warn(`Failed to delete conversation ${conv.id}: ${error.message}`);
      }
    }

    // Update index
    const indexPath = join(this.backupDir, 'index.json');
    const remainingConversations = conversations.slice(conversations.length - keepCount);
    await fs.writeFile(
      indexPath,
      JSON.stringify({ conversations: remainingConversations }, null, 2)
    );

    console.log(`🗑️  Cleaned up ${deletedCount} old conversations`);

    return deletedCount;
  }
}

// Singleton instance
let conversationBackupManager: ConversationBackupManager | null = null;

/**
 * Get or create conversation backup manager instance
 */
export function getConversationBackupManager(projectPath?: string): ConversationBackupManager {
  if (!conversationBackupManager) {
    conversationBackupManager = new ConversationBackupManager(projectPath);
  }
  return conversationBackupManager;
}
