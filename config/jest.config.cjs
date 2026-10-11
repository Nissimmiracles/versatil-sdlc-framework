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

const { collectRunnerPartition } = require('../tests/ci/runner-partition.cjs');
const partition = collectRunnerPartition(require('path').resolve(__dirname, '..'));
const integrationPaths = /^(tests\/(integration|agents|update|rag|templates|planning)\/)/;
const jestPaths = paths => paths.map(file => `<rootDir>/${file}`);

module.exports = {
  // Root directory resolution - set to project root, not config dir
  rootDir: require('path').resolve(__dirname, '..'),

  // NO preset - prevents babel-jest from auto-activating (Native SDK requirement)
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Hybrid test matching - Jest handles unit tests, Playwright handles e2e
  // All Jest suites are assigned below, including legacy global-test files.
  testMatch: jestPaths(partition.byRunner.jest),

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

  verbose: process.env.CI ? false : true,
  collectCoverage: process.env.JEST_COVERAGE === 'true',

  // Enhanced resource management for hybrid setup
  maxWorkers: process.env.CI ? 1 : '50%',
  logHeapUsage: true,
  detectOpenHandles: false,  // Disabled to prevent hanging (enable manually for debugging)

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
    {
      ...require('./jest-unit.config.cjs'),
      testMatch: jestPaths(partition.byRunner.jest.filter(file => !file.startsWith('tests/stress/') && !integrationPaths.test(file))),
    },
    {
      displayName: {
        name: 'STRESS',
        color: 'red'
      },
      rootDir: require('path').resolve(__dirname, '..'),
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json',
          isolatedModules: true,
          useESM: false,
          babelConfig: false,
          diagnostics: false
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transformIgnorePatterns: [
        'node_modules/(?!(@modelcontextprotocol)/)'
      ],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/tests/(.*)$': '<rootDir>/tests/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testMatch: jestPaths(partition.byRunner.jest.filter(file => file.startsWith('tests/stress/'))),
      coverageDirectory: '<rootDir>/coverage/stress',
      maxWorkers: process.env.CI ? 1 : '50%',
      detectOpenHandles: false
    },
    {
      displayName: {
        name: 'INTEGRATION',
        color: 'magenta'
      },
      rootDir: require('path').resolve(__dirname, '..'),
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
      testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/integration/helpers/'
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
      testMatch: jestPaths(partition.byRunner.jest.filter(file => integrationPaths.test(file))),
      coverageDirectory: '<rootDir>/coverage/integration',
      maxWorkers: process.env.CI ? 1 : '50%',
      detectOpenHandles: false  // Disable in normal runs (enable manually for debugging)
    }
  ],

  // Enhanced error handling for OPERA methodology
  errorOnDeprecated: true,

  // Global setup for OPERA integration
  globalSetup: '<rootDir>/tests/setup/jest-global-setup.cjs',
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
// Production sources use import.meta.url; preserve it in the legacy CJS runner.
for (const project of module.exports.projects) {
  for (const [, options] of Object.values(project.transform)) {
    options.astTransformers = { before: [require('path').resolve(__dirname, '../tests/setup/jest-import-meta.cjs')] };
  }
}
