/**
 * VERSATIL SDLC Framework - Hybrid Jest + Playwright Configuration
 * Enhanced Maria-QA Unit & Integration Testing Setup
 *
 * This configuration enables:
 * - Unit testing with Jest
 * - Integration testing coordination with Playwright
 * - OPERA methodology compliance
 * - Chrome MCP integration support
 */

module.exports = {
  // Root directory resolution
  rootDir: __dirname,

  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Hybrid test matching - Jest handles unit tests, Playwright handles e2e
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
    // Exclude Playwright-specific tests from Jest
    '!**/*.e2e.{ts,js}',
    '!**/*.playwright.{ts,js}',
    '!**/*.mcp.{ts,js}',
    '!**/e2e/**/*',
    '!**/playwright/**/*'
  ],

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      useESM: false,
      babelConfig: false,
      diagnostics: false
    }],
    '^.+\\.(js|jsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      useESM: false,
      babelConfig: false
    }]
  },

  // TypeScript configuration for Jest
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol)/)'
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    // Exclude e2e test files from coverage
    '!src/**/*.e2e.{ts,tsx}',
    '!src/**/*.playwright.{ts,tsx}'
  ],

  coverageDirectory: 'coverage/jest',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  moduleNameMapper: {
    // Handle .js extensions in TypeScript imports (ESM compatibility)
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1'
  },

  testTimeout: 15000, // Increased for OPERA methodology
  verbose: process.env.CI ? false : true,
  collectCoverage: process.env.JEST_COVERAGE === 'true',

  // Enhanced resource management for hybrid setup
  maxWorkers: process.env.CI ? 1 : '50%',
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,

  // Enhanced coverage thresholds for OPERA compliance
  coverageThreshold: {
    global: {
      branches: 80,  // Increased from 50 to 80 for Enhanced Maria-QA standards
      functions: 80, // Increased from 50 to 80
      lines: 80,     // Increased from 50 to 80
      statements: 80 // Increased from 50 to 80
    },
    // Per-module thresholds for critical OPERA components
    'src/agents/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/testing/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Jest projects for different test types
  projects: [
    './jest-unit.config.cjs',
    {
      displayName: {
        name: 'INTEGRATION',
        color: 'magenta'
      },
      rootDir: __dirname,
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json',
          isolatedModules: true,
          useESM: false,
          babelConfig: false,
          diagnostics: false
        }],
        '^.+\\.(js|jsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json',
          isolatedModules: true,
          useESM: false,
          babelConfig: false
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transformIgnorePatterns: [
        'node_modules/(?!(@modelcontextprotocol)/)'
      ],
      moduleNameMapper: {
        // Handle .js extensions in TypeScript imports (ESM compatibility)
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/tests/(.*)$': '<rootDir>/tests/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testMatch: [
        '<rootDir>/tests/integration/**/*.{ts,tsx}',
        '<rootDir>/tests/agents/**/*.{ts,tsx}',
        '<rootDir>/tests/update/**/*.{ts,tsx}',
        // Exclude Playwright integration tests
        '!<rootDir>/tests/integration/**/*.e2e.{ts,tsx}',
        '!<rootDir>/tests/integration/**/*.playwright.{ts,tsx}'
      ],
      coverageDirectory: '<rootDir>/coverage/integration',
      maxWorkers: process.env.CI ? 1 : '50%'
    }
  ],

  // Enhanced error handling for OPERA methodology
  errorOnDeprecated: true,

  // Global setup for OPERA integration
  globalSetup: '<rootDir>/tests/setup/jest-global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/jest-global-teardown.ts',

  // Enhanced reporting for Maria-QA
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/jest-html-report',
      filename: 'report.html',
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'jest-results.xml'
    }]
  ],

  // OPERA methodology metadata
  testEnvironmentOptions: {
    opera: {
      agent: 'Enhanced Maria-QA',
      framework: 'VERSATIL SDLC',
      version: '1.0.0',
      hybridTesting: true,
      playwrightIntegration: true
    }
  }
};