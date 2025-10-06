import { chromium, FullConfig } from '@playwright/test';
import VERSATILTestServer from '../fixtures/test-server.js';

/**
 * VERSATIL SDLC Framework - Global Test Setup
 * Enhanced Maria-QA Configuration with Chrome MCP Integration
 */

let testServer: VERSATILTestServer;

async function globalSetup(config: FullConfig) {
  console.log('🚀 VERSATIL SDLC Framework - Starting Enhanced Maria-QA Test Setup');

  // Start VERSATIL test server
  console.log('🧪 Starting VERSATIL Test Server...');
  testServer = new VERSATILTestServer(3000);
  await testServer.start();

  // Store server instance globally for teardown
  (global as any).testServer = testServer;

  // Chrome MCP Server Initialization
  console.log('🔧 Initializing Chrome MCP Server...');

  // Create browser instance for global setup
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
  });

  try {
    // Performance baseline setup
    console.log('📊 Setting up performance baselines...');
    const context = await browser.newContext();
    const page = await context.newPage();

    // Setup performance monitoring
    await page.addInitScript(() => {
      // Chrome MCP performance tracking initialization
      window.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            (window as any).navigationTiming = entry;
          }
        }
      });
      window.performanceObserver.observe({ entryTypes: ['navigation'] });
    });

    // Visual regression baseline setup
    console.log('📸 Preparing visual regression baselines...');
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000', {
      waitUntil: 'networkidle'
    });

    // Accessibility setup
    console.log('♿ Configuring accessibility testing...');
    await page.addInitScript(() => {
      // Inject axe-core for accessibility testing
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/axe-core@4.8.2/axe.min.js';
      document.head.appendChild(script);
    });

    // Security headers validation setup
    console.log('🔒 Setting up security validation...');
    const response = await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000');
    const securityHeaders = response?.headers() || {};

    // Store security baseline
    (global as any).securityBaseline = {
      'content-security-policy': securityHeaders['content-security-policy'],
      'x-frame-options': securityHeaders['x-frame-options'],
      'x-content-type-options': securityHeaders['x-content-type-options'],
      'referrer-policy': securityHeaders['referrer-policy']
    };

    await context.close();

    // OPERA methodology setup
    console.log('🎯 Initializing OPERA Agent Integration...');
    (global as any).operaConfig = {
      mariaQA: {
        qualityGates: {
          visualRegression: { threshold: 0.1 },
          performance: { budget: { fcp: 1500, lcp: 2500 } },
          accessibility: { standard: 'WCAG21AA' },
          security: { minScore: 90 }
        }
      },
      contextPreservation: {
        enabled: true,
        autoSave: true
      }
    };

    console.log('✅ Enhanced Maria-QA Global Setup Complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;