import { defineConfig, devices } from '@playwright/test';

/**
 * VERSATIL SDLC Framework - Hybrid Playwright + Chrome MCP Configuration
 *
 * This configuration enables:
 * - Chrome MCP integration for browser testing
 * - OPERA methodology compliance
 * - Enhanced Maria-QA testing capabilities
 * - Visual regression testing
 * - Performance monitoring
 * - Accessibility auditing
 * - Security testing
 */

export default defineConfig({
  // Test configuration
  testDir: './tests',
  testMatch: [
    '**/tests/e2e/**/*.{ts,js}'
  ],

  // Global test settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30 * 1000,

  // Test reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
    // Percy visual regression reporter (only in CI or when PERCY_TOKEN is set)
    ...(process.env.CI || process.env.PERCY_TOKEN ? [['@percy/playwright']] : [])
  ],

  // Global test setup and teardown
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',

  // Use options
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Browser context options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Chrome MCP specific settings
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },

    // Performance and accessibility
    ignoreHTTPSErrors: true,
    permissions: ['notifications'],
    colorScheme: 'light',

    // OPERA methodology - Enhanced Maria settings
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,

    // Chrome MCP integration
    launchOptions: {
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Chrome MCP specific flags
        '--enable-chrome-browser-cloud-management',
        '--enable-logging',
        '--log-level=0'
      ],
      slowMo: process.env.PLAYWRIGHT_SLOW_MO ? parseInt(process.env.PLAYWRIGHT_SLOW_MO) : 0
    }
  },

  // Project configurations for different testing scenarios
  projects: [
    // Chrome Desktop - Primary testing environment
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: [
        '**/tests/e2e/**/*.{ts,js}'
      ]
    },

    // Context Validation - User flow testing with real-time error capture
    {
      name: 'context-validation',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Console error capture
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-logging',
            '--log-level=0'
          ]
        }
      },
      testMatch: [
        '**/tests/e2e/context-validation/**/*.{ts,js,spec.ts}'
      ]
    },

    // Chrome Mobile - Mobile testing
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5']
      },
      testMatch: [
        '**/mobile/**/*.{test,spec}.{ts,js}',
        '**/*.mobile.{ts,js}'
      ]
    },

    // Chrome Tablet - Tablet testing
    {
      name: 'chromium-tablet',
      use: {
        ...devices['iPad Pro']
      },
      testMatch: [
        '**/tablet/**/*.{test,spec}.{ts,js}',
        '**/*.tablet.{ts,js}'
      ]
    },

    // Visual Regression Testing (Percy)
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        // Percy-specific settings
        contextOptions: {
          // Reduce flakiness for visual testing
          reducedMotion: 'reduce',
          forcedColors: 'none'
        }
      },
      testMatch: [
        '**/visual/**/*.{test,spec}.{ts,js}',
        '**/*.visual.{ts,js}'
      ],
      // Run visual tests sequentially to avoid Percy concurrency issues
      fullyParallel: false,
      retries: process.env.CI ? 1 : 0 // Fewer retries for visual tests
    },

    // Performance Testing
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome']
      },
      testMatch: [
        '**/performance/**/*.{test,spec}.{ts,js}',
        '**/*.performance.{ts,js}'
      ]
    },

    // Accessibility Testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome']
      },
      testMatch: [
        '**/accessibility/**/*.{test,spec}.{ts,js}',
        '**/*.a11y.{ts,js}'
      ]
    },

    // Security Testing
    {
      name: 'security',
      use: {
        ...devices['Desktop Chrome']
      },
      testMatch: [
        '**/security/**/*.{test,spec}.{ts,js}',
        '**/*.security.{ts,js}'
      ]
    },

    // Integration Testing - Maria-QA specific
    {
      name: 'integration',
      use: {
        ...devices['Desktop Chrome'],
        // Enhanced settings for integration testing
        actionTimeout: 15 * 1000,
        navigationTimeout: 45 * 1000
      },
      testMatch: [
        '**/integration/**/*.{test,spec}.{ts,js}',
        '**/e2e/**/*.{test,spec}.{ts,js}'
      ]
    }
  ],

  // Web server configuration - disabled since we use global setup
  // webServer: process.env.CI ? undefined : {
  //   command: 'npm run dev',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000
  // },

  // Output directory
  outputDir: 'test-results/',

  // Expect configuration
  expect: {
    // Visual comparison settings
    threshold: 0.1,
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'strict'
    },
    toMatchSnapshot: {
      threshold: 0.2
    }
  },

  // Metadata for Chrome MCP integration
  metadata: {
    framework: 'VERSATIL SDLC',
    agent: 'Maria-QA',
    version: '1.0.0',
    chromeMCP: true,
    operaCompliant: true
  }
});