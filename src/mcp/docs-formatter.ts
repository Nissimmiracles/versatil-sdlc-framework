/**
 * VERSATIL Documentation Formatter
 * Formats markdown documentation for MCP response
 */

import { AgentDoc, WorkflowDoc, WorkflowPhase } from './docs-search-engine.js';

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

export class DocsFormatter {
  /**
   * Format markdown for MCP response (remove complex formatting)
   */
  static formatForMCP(markdown: string): string {
    let formatted = markdown;

    // Remove HTML comments
    formatted = formatted.replace(/<!--[\s\S]*?-->/g, '');

    // Remove excess blank lines (more than 2 consecutive)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Trim leading/trailing whitespace
    formatted = formatted.trim();

    return formatted;
  }

  /**
   * Extract code blocks from markdown with error handling
   */
  static extractCodeBlocks(markdown: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    try {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

      let match;
      while ((match = codeBlockRegex.exec(markdown)) !== null) {
        // Validate match
        if (!match[2]) {
          console.warn('Empty code block found, skipping');
          continue;
        }

        const language = match[1] || 'text';
        let code = match[2].trim();

        // Prevent excessively large code blocks (100KB limit)
        if (code.length > 100000) {
          console.warn(`Code block exceeds 100KB (${code.length} chars), truncating`);
          code = code.substring(0, 100000) + '\n// ... (truncated)';
        }

        // Calculate line number
        const beforeMatch = markdown.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        codeBlocks.push({
          language,
          code,
          lineNumber,
        });
      }
    } catch (error) {
      console.error('Failed to extract code blocks:', error);
      return []; // Return empty array instead of crashing
    }

    return codeBlocks;
  }

  /**
   * Extract sections from markdown (by headings)
   */
  static extractSections(markdown: string): FormattedSection[] {
    const sections: FormattedSection[] = [];
    const lines = markdown.split('\n');

    let currentSection: FormattedSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();

        currentSection = {
          heading,
          level,
          content: '',
          codeBlocks: [],
        };
      } else if (currentSection) {
        // Add line to current section content
        currentSection.content += line + '\n';
      }
    }

    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Extract code blocks for each section
    sections.forEach(section => {
      section.codeBlocks = this.extractCodeBlocks(section.content);
      section.content = section.content.trim();
    });

    return sections;
  }

  /**
   * Format agent documentation for MCP response
   */
  static formatAgentDocs(agentId: string, content: string): AgentDoc {
    const sections = this.extractSections(content);

    // Extract agent information from content
    const doc: AgentDoc = {
      agentId,
      name: this.extractAgentName(content, agentId),
      role: this.extractAgentRole(content),
      capabilities: this.extractList(content, ['Capabilities', 'Features', 'What']),
      triggers: this.extractList(content, ['Auto-Activates', 'Triggers', 'Activation']),
      filePatterns: this.extractFilePatterns(content),
      examples: this.extractCodeBlocks(content).map(block => block.code),
      integration: this.extractList(content, ['Integration', 'Works with', 'Collaborates']),
    };

    return doc;
  }

  /**
   * Format workflow documentation for MCP response
   */
  static formatWorkflowDocs(workflowType: string, content: string): WorkflowDoc {
    const sections = this.extractSections(content);

    const doc: WorkflowDoc = {
      workflowType,
      name: this.extractWorkflowName(content, workflowType),
      description: this.extractDescription(content),
      phases: this.extractWorkflowPhases(content),
      timeSavings: this.extractTimeSavings(content),
      examples: this.extractCodeBlocks(content).map(block => block.code),
    };

    return doc;
  }

  /**
   * Extract agent name from content
   */
  private static extractAgentName(content: string, agentId: string): string {
    // Try to find heading with agent name
    const headingMatch = content.match(/^#{1,4}\s+([^-\n]+)\s*-\s*(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Fallback: Convert agentId to readable name
    return agentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract agent role from content
   */
  private static extractAgentRole(content: string): string {
    // Try to find "Role:" section
    const roleMatch = content.match(/\*\*Role\*\*:?\s*(.+)/i);
    if (roleMatch) {
      return roleMatch[1].trim();
    }

    // Try to find heading with role (e.g., "Agent Name - Role")
    const headingMatch = content.match(/^#{1,4}\s+[^-\n]+-\s*(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    return 'OPERA Agent';
  }

  /**
   * Extract workflow name from content
   */
  private static extractWorkflowName(content: string, workflowType: string): string {
    // Try to find H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback: Convert workflowType to readable name
    return workflowType.toUpperCase() + ' Workflow';
  }

  /**
   * Extract description from content (first paragraph)
   */
  private static extractDescription(content: string): string {
    // Find first paragraph after any heading
    const paragraphs = content.split(/\n\n+/);

    for (const para of paragraphs) {
      // Skip headings, code blocks, and lists
      if (
        !para.startsWith('#') &&
        !para.startsWith('```') &&
        !para.startsWith('-') &&
        !para.startsWith('*') &&
        !para.startsWith('|') &&
        para.trim().length > 20
      ) {
        return para.trim().split('\n')[0]; // First line of paragraph
      }
    }

    return '';
  }

  /**
   * Extract list items from content under specific headings
   */
  private static extractList(content: string, headingKeywords: string[]): string[] {
    const items: string[] = [];

    for (const keyword of headingKeywords) {
      // Find heading containing keyword
      const regex = new RegExp(`^#{1,6}\\s+.*${keyword}.*$`, 'mi');
      const match = content.match(regex);

      if (match) {
        // Find content after heading
        const startIndex = content.indexOf(match[0]) + match[0].length;
        const remainingContent = content.substring(startIndex);

        // Extract list items until next heading or double newline
        const listItems = remainingContent
          .split('\n')
          .slice(0, 20) // Look at next 20 lines max
          .filter(line => line.match(/^\s*[-*]\s+/))
          .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
          .filter(item => item.length > 0);

        items.push(...listItems);

        if (items.length > 0) {
          break; // Found items, stop searching
        }
      }
    }

    return items;
  }

  /**
   * Extract file patterns from content
   */
  private static extractFilePatterns(content: string): string[] {
    const patterns: string[] = [];

    // Look for patterns in backticks (e.g., `*.test.*`, `*.tsx`)
    const backtickPatterns = content.matchAll(/`([*\w.-]+\.\w+|\*\*\/[*\w.-]+)`/g);
    for (const match of backtickPatterns) {
      patterns.push(match[1]);
    }

    // Look for patterns in "Auto-Activates On" or "Triggers" sections
    const activateMatch = content.match(/Auto-Activates? On:?\s*\n([\s\S]*?)(?=\n#{1,6}|\n\n)/i);
    if (activateMatch) {
      const section = activateMatch[1];
      const filePatterns = section.matchAll(/`([*\w.-]+\.\w+|\*\*\/[*\w.-]+)`/g);
      for (const match of filePatterns) {
        patterns.push(match[1]);
      }
    }

    // Remove duplicates
    return Array.from(new Set(patterns));
  }

  /**
   * Extract workflow phases from content
   */
  private static extractWorkflowPhases(content: string): WorkflowPhase[] {
    const phases: WorkflowPhase[] = [];

    // Look for phase sections (Phase 1, Phase 2, etc.)
    const phaseRegex = /^#{2,4}\s+Phase\s+\d+:?\s+(.+?)(?:\s*\(([^)]+)\))?$/gim;
    const lines = content.split('\n');

    let match;
    while ((match = phaseRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const duration = match[2] || '';

      // Find content after phase heading
      const startIndex = content.indexOf(match[0]) + match[0].length;
      const remainingContent = content.substring(startIndex);

      // Extract activities (list items) until next phase or major heading
      const activities = remainingContent
        .split('\n')
        .slice(0, 30) // Look at next 30 lines max
        .filter(line => !line.match(/^#{2,4}\s+Phase/)) // Stop at next phase
        .filter(line => line.match(/^\s*[-*✓]\s+/))
        .map(line => line.replace(/^\s*[-*✓]\s+/, '').trim())
        .filter(item => item.length > 0);

      // Extract agents mentioned (look for agent names)
      const agentNames = [
        'Alex-BA', 'Dana-Database', 'Dana', 'Marcus-Backend', 'Marcus',
        'James-Frontend', 'James', 'Maria-QA', 'Maria', 'Sarah-PM', 'Sarah',
        'Dr.AI-ML', 'Dr.AI', 'Oliver-MCP', 'Oliver'
      ];

      const agents: string[] = [];
      const phaseContent = remainingContent.split(/\n#{2,4}\s+/)[0]; // Content until next heading

      for (const agentName of agentNames) {
        if (phaseContent.includes(agentName)) {
          // Normalize to agent ID
          const agentId = agentName
            .toLowerCase()
            .replace(/[.\s]/g, '-')
            .replace('dr-ai-ml', 'dr-ai-ml')
            .replace('maria-qa', 'maria-qa')
            .replace('alex-ba', 'alex-ba')
            .replace('sarah-pm', 'sarah-pm')
            .replace('oliver-mcp', 'oliver-mcp');

          if (!agents.includes(agentId)) {
            agents.push(agentId);
          }
        }
      }

      phases.push({
        name,
        duration,
        agents,
        activities: activities.slice(0, 10), // Max 10 activities per phase
      });
    }

    return phases;
  }

  /**
   * Extract time savings from content
   */
  private static extractTimeSavings(content: string): string {
    // Look for patterns like "43% faster", "95 minutes saved", "2.5 hours vs 3.8 hours"
    const patterns = [
      /(\d+%)\s+(?:faster|time\s+sav(?:ed|ings?))/i,
      /(?:sav(?:ed|es?|ings?))\s+(\d+\s+(?:minutes?|hours?|days?))/i,
      /(\d+(?:\.\d+)?\s+(?:minutes?|hours?))\s+vs\.?\s+(\d+(?:\.\d+)?\s+(?:minutes?|hours?))/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return '';
  }

  /**
   * Format search results for display
   */
  static formatSearchResults(results: any[]): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    let output = `Found ${results.length} result(s):\n\n`;

    results.forEach((result, index) => {
      output += `${index + 1}. ${result.document.title}\n`;
      output += `   Path: ${result.document.relativePath}\n`;
      output += `   Category: ${result.document.category}\n`;
      output += `   Relevance: ${result.relevanceScore}\n`;
      output += `   Excerpt:\n`;
      output += `   ${result.excerpt.split('\n').join('\n   ')}\n\n`;
    });

    return output;
  }
}
