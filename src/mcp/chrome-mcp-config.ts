/**
 * Chrome MCP Configuration
 * Production-ready browser automation configuration
 */

export interface ChromeMCPConfig {
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  devtools: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  timeout: number;
  sessionTimeout: number;
  baseURL?: string;
}

export interface AccessibilityReport {
  violations: {
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    nodes: { html: string; target: string[] }[];
  }[];
  passes: number;
  score: number;  // 0-100
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  tti: number;  // Time to Interactive
  tbt: number;  // Total Blocking Time
  cls: number;  // Cumulative Layout Shift
  score: number;  // 0-100 (Lighthouse-style)
}

export const DEFAULT_CHROME_MCP_CONFIG: ChromeMCPConfig = {
  browserType: 'chromium',
  headless: process.env.CHROME_MCP_HEADLESS === 'true',
  devtools: process.env.CHROME_MCP_DEVTOOLS === 'true',
  slowMo: parseInt(process.env.CHROME_MCP_SLOW_MO || '0'),
  viewport: { width: 1920, height: 1080 },
  timeout: parseInt(process.env.CHROME_MCP_TIMEOUT || '30000'),
  sessionTimeout: parseInt(process.env.CHROME_MCP_SESSION_TIMEOUT || '300000'),
  baseURL: process.env.CHROME_MCP_BASE_URL || 'http://localhost:3000'
};
