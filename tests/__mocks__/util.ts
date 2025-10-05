/**
 * Mock for util module
 * Handles promisify to return our mockExecAsync for child_process.exec
 */

const actualUtil = jest.requireActual('util');

export const promisify = (fn: any): any => {
  // For child_process.exec, return our promise-based mock
  if (fn.name === 'exec' || fn === require('child_process').exec) {
    const { mockExecAsync } = require('./child_process');
    return mockExecAsync;
  }

  // For everything else, use real promisify
  return actualUtil.promisify(fn);
};

export default {
  ...actualUtil,
  promisify,
};
