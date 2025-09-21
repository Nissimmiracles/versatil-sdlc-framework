import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VERSATIL_ENV = 'testing';

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Global timeout for async operations
jest.setTimeout(30000);

// Mock MCP tools for testing (optional dependency)
try {
  jest.mock('@anthropic-ai/mcp-sdk', () => ({
    createTool: jest.fn(),
    invokeTool: jest.fn(),
  }));
} catch (error) {
  // MCP SDK not available in test environment
}

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
}));

// Mock chokidar file watcher
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

export {};