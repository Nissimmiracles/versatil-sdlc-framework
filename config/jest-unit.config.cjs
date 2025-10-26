/**
 * VERSATIL SDLC Framework - Jest Unit Test Configuration
 * Enhanced Maria-QA Unit Testing Setup
 *
 * This configuration is specifically for unit tests only.
 * Integration tests are handled separately in jest.config.cjs
 */

module.exports = {
  displayName: {
    name: 'UNIT',
    color: 'cyan'
  },

  // Root directory resolution - set to project root, not config dir
  rootDir: require('path').resolve(__dirname, '..'),

  // NO preset - prevents babel-jest usage (Native SDK requirement)
  testEnvironment: 'node',

  // TypeScript transformation (explicitly defined, NO preset)
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        esModuleInterop: true,
        skipLibCheck: true
      },
      isolatedModules: true,
      useESM: false,
      babelConfig: false,
      diagnostics: {
        warnOnly: true,
        exclude: ['**/*.spec.ts', '**/*.test.ts']
      }
    }],
    '^.+\\.(js|jsx)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        esModuleInterop: true,
        allowJs: true
      },
      isolatedModules: true,
      useESM: false,
      babelConfig: false
    }]
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol)/)'
  ],

  // Unit test matching patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/src/**/*.test.{ts,tsx,js}',
    '<rootDir>/src/**/*.spec.{ts,tsx,js}',
    '<rootDir>/tests/unit/**/*.{ts,tsx,js}',
    '<rootDir>/tests/mcp/**/*.{ts,tsx,js}', // ⭐ MCP documentation tools tests
    // Explicitly exclude e2e and integration tests
    '!**/*.e2e.{ts,tsx,js}',
    '!**/*.playwright.{ts,tsx,js}',
    '!**/*.integration.{ts,tsx,js}',
    '!**/e2e/**',
    '!**/integration/**'
  ],

  // Coverage collection for unit tests only
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.e2e.{ts,tsx}',
    '!src/**/*.playwright.{ts,tsx}',
    '!src/**/*.integration.{ts,tsx}',
    // Exclude test utilities and mocks
    '!src/**/mocks/**',
    '!src/**/stubs/**',
    '!src/**/__tests__/**'
  ],

  // Module name mapper for path aliases
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

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Unit test specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Coverage directory for unit tests
  coverageDirectory: '<rootDir>/coverage/unit',

  // Unit tests should be fast - run in parallel
  maxWorkers: '50%',

  // Cache for faster reruns
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache/unit'
};