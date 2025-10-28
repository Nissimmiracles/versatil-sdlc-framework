/**
 * VERSATIL Documentation Formatter
 * Formats markdown documentation for MCP response
 */
import { AgentDoc, WorkflowDoc } from './docs-search-engine.js';
export interface CodeBlock {
    language: string;
    code: string;
    lineNumber: number;
}
export interface FormattedSection {
    heading: string;
    level: number;
    content: string;
    codeBlocks: CodeBlock[];
}
export declare class DocsFormatter {
    /**
     * Format markdown for MCP response (remove complex formatting)
     */
    static formatForMCP(markdown: string): string;
    /**
     * Extract code blocks from markdown with error handling
     */
    static extractCodeBlocks(markdown: string): CodeBlock[];
    /**
     * Extract sections from markdown (by headings)
     */
    static extractSections(markdown: string): FormattedSection[];
    /**
     * Format agent documentation for MCP response
     */
    static formatAgentDocs(agentId: string, content: string): AgentDoc;
    /**
     * Format workflow documentation for MCP response
     */
    static formatWorkflowDocs(workflowType: string, content: string): WorkflowDoc;
    /**
     * Extract agent name from content
     */
    private static extractAgentName;
    /**
     * Extract agent role from content
     */
    private static extractAgentRole;
    /**
     * Extract workflow name from content
     */
    private static extractWorkflowName;
    /**
     * Extract description from content (first paragraph)
     */
    private static extractDescription;
    /**
     * Extract list items from content under specific headings
     */
    private static extractList;
    /**
     * Extract file patterns from content
     */
    private static extractFilePatterns;
    /**
     * Extract workflow phases from content
     */
    private static extractWorkflowPhases;
    /**
     * Extract time savings from content
     */
    private static extractTimeSavings;
    /**
     * Format search results for display
     */
    static formatSearchResults(results: any[]): string;
}
