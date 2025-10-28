/**
 * Conversation Backup Manager
 * Real-time conversation state backup for Claude's native "/resume conversation"
 *
 * @module ConversationBackupManager
 * @version 1.0.0
 */
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
        linkedDocs?: string[];
        currentSprint?: string;
        currentPhase?: string;
    };
    metadata: {
        messageCount: number;
        duration: number;
        lastAgent?: string;
        tags?: string[];
        linkedRoadmaps?: string[];
        linkedPlans?: string[];
        completedTasks?: string[];
    };
}
/**
 * Conversation Backup Manager
 *
 * Automatically saves conversation state to disk for seamless resume capability
 * Compatible with Claude's native "/resume conversation" command
 */
export declare class ConversationBackupManager {
    private backupDir;
    private currentConversation;
    private autoSaveInterval;
    private readonly AUTO_SAVE_INTERVAL;
    constructor(projectPath?: string);
    /**
     * Initialize conversation backup system
     */
    initialize(): Promise<void>;
    /**
     * Start a new conversation
     */
    startConversation(title: string, projectPath: string): Promise<string>;
    /**
     * Add message to current conversation
     */
    addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Save current conversation to disk
     */
    saveConversation(): Promise<void>;
    /**
     * Load conversation by ID
     */
    loadConversation(conversationId: string): Promise<ConversationSnapshot>;
    /**
     * Resume conversation (for Claude's /resume command)
     */
    resumeConversation(conversationId: string): Promise<ConversationSnapshot>;
    /**
     * End current conversation
     */
    endConversation(): Promise<void>;
    /**
     * List all conversations
     */
    listConversations(): Promise<ConversationSnapshot[]>;
    /**
     * Search conversations by title or content
     */
    searchConversations(query: string): Promise<ConversationSnapshot[]>;
    /**
     * Export conversation to markdown for documentation
     */
    exportToMarkdown(conversationId: string): Promise<string>;
    /**
     * Link documentation files to current conversation
     */
    linkDocuments(docs: string[]): Promise<void>;
    /**
     * Link roadmaps and plans to metadata
     */
    linkPlansAndRoadmaps(roadmaps: string[], plans: string[]): Promise<void>;
    /**
     * Set current sprint and phase
     */
    setSprintAndPhase(sprint: string, phase?: string): Promise<void>;
    /**
     * Add completed task
     */
    addCompletedTask(task: string): Promise<void>;
    /**
     * Generate Claude-compatible resume context (ENHANCED with docs/plans/roadmaps)
     */
    generateResumeContext(conversationId: string): Promise<string>;
    /**
     * Start auto-save interval
     */
    private startAutoSave;
    /**
     * Stop auto-save interval
     */
    private stopAutoSave;
    /**
     * Add conversation to index
     */
    private addToIndex;
    /**
     * Generate unique conversation ID
     */
    private generateConversationId;
    /**
     * Get conversation file path
     */
    private getConversationPath;
    /**
     * Get current git branch
     */
    private getCurrentGitBranch;
    /**
     * Get current git commit
     */
    private getCurrentGitCommit;
    /**
     * Format duration in human-readable format
     */
    private formatDuration;
    /**
     * Get current conversation
     */
    getCurrentConversation(): ConversationSnapshot | null;
    /**
     * Cleanup old conversations (keep last N)
     */
    cleanupOldConversations(keepCount?: number): Promise<number>;
}
/**
 * Get or create conversation backup manager instance
 */
export declare function getConversationBackupManager(projectPath?: string): ConversationBackupManager;
