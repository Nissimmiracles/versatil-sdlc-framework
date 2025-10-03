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

  // Unit test matching patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js}',
    '<rootDir>/src/**/*.test.{ts,tsx,js}',
    '<rootDir>/src/**/*.spec.{ts,tsx,js}',
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

  // Unit test specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Unit tests should be fast - run in parallel
  maxWorkers: '50%',

  // Cache for faster reruns
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache/unit'
};