/**
 * Mock for child_process module
 * Provides both callback-based exec and promise-based execAsync
 */

import { ChildProcess } from 'child_process';

// Create a shared mock function that can be controlled by tests
export const mockExecAsync = jest.fn();

// Mock callback-based exec
export const exec = jest.fn((cmd: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
  if (callback) {
    // Default callback behavior
    callback(null, { stdout: '', stderr: '' });
  }
  return {} as ChildProcess;
});

// For util.promisify(exec), we export execAsync
export const execAsync = mockExecAsync;

export default {
  exec,
  execAsync,
  spawn: jest.fn(),
  fork: jest.fn(),
  execFile: jest.fn(),
};
