/**
 * VERSATIL SDLC Framework - Jest Unit Testing Configuration
 * Enhanced Maria-QA Unit Testing Setup
 */

export default {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],

  // Unit test matching
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.spec.ts'
  ],

  // TypeScript transformation
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // TypeScript Jest configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true
      }
    }
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],

  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout
  testTimeout: 10000,

  // Setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Enhanced Maria-QA settings
  verbose: true,
  bail: false,
  clearMocks: true,
  restoreMocks: true
};