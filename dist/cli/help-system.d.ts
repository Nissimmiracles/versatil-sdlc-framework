/**
 * VERSATIL Help System
 *
 * Interactive help system with context-aware suggestions
 * and comprehensive documentation access.
 *
 * Usage:
 * - parseHelpQuery(query): Parse user's help query
 * - getHelpContent(topic): Get help content for specific topic
 * - suggestRelatedTopics(topic): Get related help topics
 * - searchHelp(query): Search across all help content
 */
/**
 * Help topics organized by category
 */
export declare const HELP_TOPICS: {
    core: string[];
    agents: string[];
    subAgents: string[];
    rules: string[];
    workflows: string[];
    tools: string[];
};
/**
 * Help content database (extracted from help.md)
 */
export interface HelpContent {
    topic: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
    relatedTopics: string[];
    examples?: string[];
}
/**
 * Parse user's help query and determine topic
 */
export declare function parseHelpQuery(query: string): {
    topic: string;
    confidence: number;
    suggestions: string[];
};
/**
 * Get help content for a specific topic
 */
export declare function getHelpContent(topic: string): HelpContent | null;
/**
 * Search across all help content
 */
export declare function searchHelp(query: string): HelpContent[];
/**
 * Format help content for display
 */
export declare function formatHelpContent(content: HelpContent): string;
/**
 * Get all available help topics
 */
export declare function getAllTopics(): string[];
/**
 * Get help menu (main help display)
 */
export declare function getHelpMenu(): string;
