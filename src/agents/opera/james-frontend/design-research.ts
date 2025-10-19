/**
 * James-Frontend Design Research Module
 *
 * Provides design intelligence through ethical web scraping:
 * - Extract design systems (colors, fonts, spacing)
 * - Analyze component patterns (buttons, cards, forms)
 * - Benchmark accessibility (WCAG compliance)
 * - Compare performance (load times, bundle sizes)
 *
 * Uses Playwright Stealth for 92% bot detection bypass.
 */

import { designScraper, type DesignResearchReport } from '../../../mcp/design-scraper.js';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';

export interface DesignResearchOptions {
  saveReport?: boolean;
  outputFormat?: 'json' | 'markdown' | 'both';
  includeDesignSystem?: boolean;
  includeComponents?: boolean;
  includeAccessibility?: boolean;
  includePerformance?: boolean;
}

export class JamesDesignResearch {
  private reportsDir: string;

  constructor() {
    this.reportsDir = path.join(homedir(), '.versatil', 'design-research');
  }

  /**
   * Research competitor/inspiration site for design patterns
   *
   * @param url - URL to research
   * @param options - Research configuration
   * @returns Design research report
   */
  async research(url: string, options: DesignResearchOptions = {}): Promise<DesignResearchReport> {
    const {
      saveReport = true,
      outputFormat = 'both',
      includeDesignSystem = true,
      includeComponents = true,
      includeAccessibility = true,
      includePerformance = true
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎨 JAMES (Frontend Agent): Design Research Mode`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\nTarget: ${url}`);
    console.log(`Analysis: ${[
      includeDesignSystem && 'Design System',
      includeComponents && 'Components',
      includeAccessibility && 'Accessibility',
      includePerformance && 'Performance'
    ].filter(Boolean).join(', ')}`);
    console.log(`\n🕵️ Stealth Mode: Enabled (92% bot detection bypass)`);
    console.log(`⏱️ Rate Limiting: 2 seconds between requests (ethical)\n`);

    try {
      // Execute design research
      const report = await designScraper.researchDesign(url, {
        includeDesignSystem,
        includeComponents,
        includeAccessibility,
        includePerformance
      });

      // Save report if requested
      if (saveReport) {
        await this.saveReport(report, outputFormat);
      }

      // Display summary
      this.displaySummary(report);

      return report;

    } catch (error: any) {
      console.error(`\n❌ Design research failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Quick design system extraction
   */
  async extractDesignSystem(url: string): Promise<any> {
    console.log(`\n🎨 JAMES: Extracting design system from ${url}...\n`);

    const result = await designScraper.extractDesignSystem(url);

    if (result.success) {
      const designSystem = result.data?.designSystem;
      console.log(`✅ Design System Extracted:`);
      console.log(`   Primary Colors: ${designSystem.colors.primary.join(', ')}`);
      console.log(`   Font Families: ${designSystem.typography.fontFamilies.join(', ')}`);
      console.log(`   Layout: ${designSystem.layout.gridSystem} (max ${designSystem.layout.maxWidth})\n`);

      return designSystem;
    } else {
      console.error(`❌ Extraction failed: ${result.error}\n`);
      throw new Error(result.error);
    }
  }

  /**
   * Quick component analysis
   */
  async analyzeComponents(url: string): Promise<any> {
    console.log(`\n🧩 JAMES: Analyzing components from ${url}...\n`);

    const result = await designScraper.analyzeComponents(url);

    if (result.success) {
      const components = result.data?.components;
      console.log(`✅ Components Analyzed:`);

      for (const [type, data] of Object.entries(components)) {
        if (data && (data as any).count) {
          console.log(`   ${type}: ${(data as any).count} found (accessible: ${(data as any).accessibility?.hasAriaLabel ? '✅' : '⚠️'})`);
        }
      }
      console.log('');

      return components;
    } else {
      console.error(`❌ Analysis failed: ${result.error}\n`);
      throw new Error(result.error);
    }
  }

  /**
   * Quick accessibility check
   */
  async checkAccessibility(url: string): Promise<any> {
    console.log(`\n♿ JAMES: Checking accessibility for ${url}...\n`);

    const result = await designScraper.checkAccessibility(url);

    if (result.success) {
      const data = result.data?.accessibilityData;
      const score = result.data?.score;

      console.log(`✅ Accessibility Score: ${score}/100`);
      console.log(`   Buttons with labels: ${data.summary.buttonsWithAriaLabel}/${data.summary.totalButtons}`);
      console.log(`   Images with alt text: ${data.summary.imagesWithAlt}/${data.summary.totalImages}`);
      console.log(`   Landmarks: ${data.summary.hasLandmarks ? '✅ Present' : '⚠️ Missing'}`);
      console.log(`   Skip link: ${data.summary.hasSkipLink ? '✅ Present' : '⚠️ Missing'}\n`);

      return data;
    } else {
      console.error(`❌ Check failed: ${result.error}\n`);
      throw new Error(result.error);
    }
  }

  /**
   * Quick performance benchmark
   */
  async benchmarkPerformance(url: string): Promise<any> {
    console.log(`\n⚡ JAMES: Benchmarking performance for ${url}...\n`);

    const result = await designScraper.benchmarkPerformance(url);

    if (result.success) {
      const benchmark = result.data?.benchmark;

      console.log(`✅ Performance Metrics:`);
      console.log(`   Load Time: ${benchmark.loadTime.toFixed(0)}ms`);
      console.log(`   DOM Content Loaded: ${benchmark.domContentLoaded.toFixed(0)}ms`);
      console.log(`   First Contentful Paint: ${benchmark.firstContentfulPaint.toFixed(0)}ms`);
      console.log(`   Bundle Size: ${benchmark.bundleSize.total}KB (JS: ${benchmark.bundleSize.js}KB, CSS: ${benchmark.bundleSize.css}KB)`);
      console.log(`   Requests: ${benchmark.requests.total} total, ${benchmark.requests.failed} failed\n`);

      return benchmark;
    } else {
      console.error(`❌ Benchmark failed: ${result.error}\n`);
      throw new Error(result.error);
    }
  }

  /**
   * Save design research report
   */
  private async saveReport(report: DesignResearchReport, format: 'json' | 'markdown' | 'both') {
    try {
      // Ensure reports directory exists
      await fs.mkdir(this.reportsDir, { recursive: true });

      // Generate filename
      const hostname = new URL(report.url).hostname.replace(/\./g, '-');
      const timestamp = report.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const baseFilename = `${hostname}_${timestamp}`;

      // Save JSON
      if (format === 'json' || format === 'both') {
        const jsonPath = path.join(this.reportsDir, `${baseFilename}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
        console.log(`📄 Report saved: ${jsonPath}`);
      }

      // Save Markdown
      if (format === 'markdown' || format === 'both') {
        const markdownPath = path.join(this.reportsDir, `${baseFilename}.md`);
        const markdown = designScraper.formatReportAsMarkdown(report);
        await fs.writeFile(markdownPath, markdown);
        console.log(`📄 Report saved: ${markdownPath}`);
      }

    } catch (error: any) {
      console.error(`⚠️ Failed to save report: ${error.message}`);
    }
  }

  /**
   * Display research summary
   */
  private displaySummary(report: DesignResearchReport) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Design Research Complete`);
    console.log(`${'='.repeat(60)}\n`);

    // Design System
    if (report.designSystem) {
      console.log(`🎨 Design System:`);
      console.log(`   Colors: ${report.designSystem.colors.primary.length} primary, ${report.designSystem.colors.secondary.length} secondary`);
      console.log(`   Fonts: ${report.designSystem.typography.fontFamilies.length} families`);
      console.log(`   Layout: ${report.designSystem.layout.gridSystem}\n`);
    }

    // Components
    if (report.components) {
      const componentTypes = Object.keys(report.components).filter(k => report.components[k]);
      console.log(`🧩 Components: ${componentTypes.length} types analyzed\n`);
    }

    // Accessibility
    if (report.accessibility) {
      console.log(`♿ Accessibility: ${report.accessibility.score}/100 score\n`);
    }

    // Performance
    if (report.performance) {
      console.log(`⚡ Performance:`);
      console.log(`   Load Time: ${report.performance.loadTime.toFixed(0)}ms`);
      console.log(`   Bundle Size: ${report.performance.bundleSize.total}KB\n`);
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`💡 Key Insights (${report.recommendations.length}):`);
      report.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('');
    }

    console.log(`📂 Reports saved to: ${this.reportsDir}\n`);
  }

  /**
   * List all saved research reports
   */
  async listReports(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.reportsDir);
      return files.filter(f => f.endsWith('.json') || f.endsWith('.md'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Load a saved report
   */
  async loadReport(filename: string): Promise<DesignResearchReport | null> {
    try {
      const filePath = path.join(this.reportsDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      if (filename.endsWith('.json')) {
        return JSON.parse(content);
      } else {
        return null; // Markdown files need custom parsing
      }
    } catch (error) {
      return null;
    }
  }
}

// Export singleton
export const jamesDesignResearch = new JamesDesignResearch();

// Export convenience functions for slash commands
export async function researchDesign(url: string, options?: DesignResearchOptions) {
  return jamesDesignResearch.research(url, options);
}

export async function extractDesignSystem(url: string) {
  return jamesDesignResearch.extractDesignSystem(url);
}

export async function analyzeComponents(url: string) {
  return jamesDesignResearch.analyzeComponents(url);
}

export async function checkAccessibility(url: string) {
  return jamesDesignResearch.checkAccessibility(url);
}

export async function benchmarkPerformance(url: string) {
  return jamesDesignResearch.benchmarkPerformance(url);
}
