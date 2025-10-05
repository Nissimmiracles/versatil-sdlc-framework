#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Enhanced OPERA Test
 * ES Module version - Run with: node test-enhanced-opera.js
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        VERSATIL Enhanced OPERA Integration Test                 ║
║                   Version 1.2.0                                ║
╚═══════════════════════════════════════════════════════════════╝

This test demonstrates the enhanced features of VERSATIL v1.2.0.

For a working demonstration, please run:

✅ node test-enhanced-opera-working.cjs    (Full test suite)
✅ node working-demo.cjs                   (Interactive demo)
✅ node quick-test.cjs                     (60-second demo)

The original test file is being updated for ES modules.
`);

// Inform user about the working alternatives
console.log('\n💡 Running the working test suite...\n');

import { spawn } from 'child_process';

const child = spawn('node', ['test-enhanced-opera-working.cjs'], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\nTest exited with code ${code}`);
  }
});
