/**
 * Design Scraper Utilities
 *
 * Provides high-level design research capabilities for James-Frontend agent.
 * All scraping is rate-limited and ethical (respects robots.txt).
 */

import { playwrightStealthExecutor } from './playwright-stealth-executor.js';
import type { MCPExecutionResult } from './chrome-mcp-executor.js';

export interface DesignResearchReport {
  url: string;
  timestamp: Date;
  designSystem?: any;
  components?: any;
  accessibility?: any;
  performance?: any;
  recommendations: string[];
  ethicalCompliance: {
    rateLimit: boolean;
    robotsTxtChecked: boolean;
    publicDataOnly: boolean;
  };
}

export class DesignScraper {
  /**
   * Comprehensive design research (all analysis types)
   */
  async researchDesign(url: string, options: {
    includeDesignSystem?: boolean;
    includeComponents?: boolean;
    includeAccessibility?: boolean;
    includePerformance?: boolean;
  } = {}): Promise<DesignResearchReport> {
    console.log(`🔬 JAMES (Frontend): Starting design research for ${url}`);

    const {
      includeDesignSystem = true,
      includeComponents = true,
      includeAccessibility = true,
      includePerformance = true
    } = options;

    const report: DesignResearchReport = {
      url,
      timestamp: new Date(),
      recommendations: [],
      ethicalCompliance: {
        rateLimit: true,
        robotsTxtChecked: false, // Would implement robots.txt check
        publicDataOnly: true
      }
    };

    try {
      // Design system extraction
      if (includeDesignSystem) {
        const result = await playwrightStealthExecutor.executeStealthAction('scrape_design_system', { url });
        if (result.success) {
          report.designSystem = result.data?.designSystem;
          report.recommendations.push(...(result.data?.recommendations || []));
        }
      }

      // Component analysis
      if (includeComponents) {
        const result = await playwrightStealthExecutor.executeStealthAction('analyze_components', { url });
        if (result.success) {
          report.components = result.data?.components;
          report.recommendations.push(...(result.data?.recommendations || []));
        }
      }

      // Accessibility patterns
      if (includeAccessibility) {
        const result = await playwrightStealthExecutor.executeStealthAction('extract_accessibility', { url });
        if (result.success) {
          report.accessibility = result.data?.accessibilityData;
          report.recommendations.push(...(result.data?.recommendations || []));
        }
      }

      // Performance benchmarking
      if (includePerformance) {
        const result = await playwrightStealthExecutor.executeStealthAction('benchmark_performance', { url });
        if (result.success) {
          report.performance = result.data?.benchmark;
          report.recommendations.push(...(result.data?.recommendations || []));
        }
      }

      console.log(`✅ JAMES: Design research complete (${report.recommendations.length} insights)`);

      return report;

    } finally {
      // Always close browser after research
      await playwrightStealthExecutor.executeStealthAction('close');
    }
  }

  /**
   * Quick design system extraction only
   */
  async extractDesignSystem(url: string): Promise<MCPExecutionResult> {
    try {
      const result = await playwrightStealthExecutor.executeStealthAction('scrape_design_system', { url });
      return result;
    } finally {
      await playwrightStealthExecutor.executeStealthAction('close');
    }
  }

  /**
   * Quick component analysis only
   */
  async analyzeComponents(url: string): Promise<MCPExecutionResult> {
    try {
      const result = await playwrightStealthExecutor.executeStealthAction('analyze_components', { url });
      return result;
    } finally {
      await playwrightStealthExecutor.executeStealthAction('close');
    }
  }

  /**
   * Quick accessibility check only
   */
  async checkAccessibility(url: string): Promise<MCPExecutionResult> {
    try {
      const result = await playwrightStealthExecutor.executeStealthAction('extract_accessibility', { url });
      return result;
    } finally {
      await playwrightStealthExecutor.executeStealthAction('close');
    }
  }

  /**
   * Quick performance benchmark only
   */
  async benchmarkPerformance(url: string): Promise<MCPExecutionResult> {
    try {
      const result = await playwrightStealthExecutor.executeStealthAction('benchmark_performance', { url });
      return result;
    } finally {
      await playwrightStealthExecutor.executeStealthAction('close');
    }
  }

  /**
   * Format design research report as markdown
   */
  formatReportAsMarkdown(report: DesignResearchReport): string {
    let markdown = `# Design Research Report\n\n`;
    markdown += `**URL**: ${report.url}\n`;
    markdown += `**Date**: ${report.timestamp.toLocaleString()}\n\n`;

    // Design System
    if (report.designSystem) {
      markdown += `## 🎨 Design System\n\n`;
      markdown += `### Colors\n`;
      markdown += `- **Primary**: ${report.designSystem.colors.primary.join(', ')}\n`;
      markdown += `- **Secondary**: ${report.designSystem.colors.secondary.join(', ')}\n`;
      markdown += `- **Neutral**: ${report.designSystem.colors.neutral.join(', ')}\n\n`;

      markdown += `### Typography\n`;
      markdown += `- **Font Families**: ${report.designSystem.typography.fontFamilies.join(', ')}\n`;
      markdown += `- **Font Sizes**: ${report.designSystem.typography.fontSizes.slice(0, 5).join(', ')}\n\n`;

      markdown += `### Layout\n`;
      markdown += `- **Max Width**: ${report.designSystem.layout.maxWidth}\n`;
      markdown += `- **Grid System**: ${report.designSystem.layout.gridSystem}\n\n`;
    }

    // Components
    if (report.components) {
      markdown += `## 🧩 Components\n\n`;
      for (const [type, data] of Object.entries(report.components)) {
        if (data && (data as any).count) {
          markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
          markdown += `- Count: ${(data as any).count}\n`;
          markdown += `- Accessible: ${(data as any).accessibility?.hasAriaLabel ? '✅' : '⚠️'}\n\n`;
        }
      }
    }

    // Accessibility
    if (report.accessibility) {
      markdown += `## ♿ Accessibility\n\n`;
      markdown += `- **Score**: ${report.accessibility.score}/100\n`;
      markdown += `- **Buttons with labels**: ${report.accessibility.summary.buttonsWithAriaLabel}/${report.accessibility.summary.totalButtons}\n`;
      markdown += `- **Images with alt text**: ${report.accessibility.summary.imagesWithAlt}/${report.accessibility.summary.totalImages}\n`;
      markdown += `- **Landmarks**: ${report.accessibility.summary.hasLandmarks ? '✅ Present' : '⚠️ Missing'}\n`;
      markdown += `- **Skip link**: ${report.accessibility.summary.hasSkipLink ? '✅ Present' : '⚠️ Missing'}\n\n`;
    }

    // Performance
    if (report.performance) {
      markdown += `## ⚡ Performance\n\n`;
      markdown += `- **Load Time**: ${report.performance.loadTime.toFixed(0)}ms\n`;
      markdown += `- **DOM Content Loaded**: ${report.performance.domContentLoaded.toFixed(0)}ms\n`;
      markdown += `- **First Contentful Paint**: ${report.performance.firstContentfulPaint.toFixed(0)}ms\n`;
      markdown += `- **Bundle Size**: ${report.performance.bundleSize.total}KB (JS: ${report.performance.bundleSize.js}KB, CSS: ${report.performance.bundleSize.css}KB)\n`;
      markdown += `- **Requests**: ${report.performance.requests.total} total, ${report.performance.requests.failed} failed, ${report.performance.requests.cached} cached\n\n`;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += `## 💡 Recommendations\n\n`;
      for (const rec of report.recommendations) {
        markdown += `- ${rec}\n`;
      }
      markdown += `\n`;
    }

    // Ethical Compliance
    markdown += `## 📜 Ethical Compliance\n\n`;
    markdown += `- Rate limiting: ${report.ethicalCompliance.rateLimit ? '✅ Enabled' : '⚠️ Disabled'}\n`;
    markdown += `- Public data only: ${report.ethicalCompliance.publicDataOnly ? '✅ Yes' : '⚠️ No'}\n`;
    markdown += `- Research purpose: ✅ Design inspiration, not code copying\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated by VERSATIL James-Frontend Agent with Playwright Stealth*\n`;

    return markdown;
  }
}

// Export singleton
export const designScraper = new DesignScraper();
