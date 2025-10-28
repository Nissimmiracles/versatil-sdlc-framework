/**
 * VERSATIL Help Context Detector
 *
 * Provides context-aware help suggestions based on:
 * - Current file being edited
 * - Recent errors or issues
 * - Active agents
 * - Project state
 *
 * Usage:
 * - detectContext(): Analyze current context
 * - suggestHelpTopics(): Get relevant help topics
 */
/**
 * Context information
 */
export interface Context {
    currentFile?: string;
    fileType?: string;
    recentErrors?: string[];
    activeAgents?: string[];
    frameworkHealth?: number;
    projectState?: {
        hasTests?: boolean;
        hasAPI?: boolean;
        hasFrontend?: boolean;
        hasDatabase?: boolean;
    };
}
/**
 * Help suggestion with reasoning
 */
export interface HelpSuggestion {
    topic: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    command?: string;
}
/**
 * Detect current context
 */
export declare function detectContext(): Context;
/**
 * Suggest help topics based on context
 */
export declare function suggestHelpTopics(context: Context): HelpSuggestion[];
/**
 * Format suggestions for display
 */
export declare function formatSuggestions(suggestions: HelpSuggestion[]): string;
/**
 * Quick context-aware help (main entry point)
 */
export declare function getContextAwareHelp(): string;
