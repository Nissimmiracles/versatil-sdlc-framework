#!/usr/bin/env node

/**
 * VERSATIL v1.2.0 Demo Runner
 * ES Module wrapper for the demos
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const demos = {
  '1': { file: 'working-demo.cjs', name: 'Working Demo' },
  '2': { file: 'introspective-test.cjs', name: 'Introspective Test' },
  '3': { file: 'test-enhanced-opera.js', name: 'Enhanced OPERA Test' }
};

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              VERSATIL v1.2.0 - Demo Runner                     ║
╚═══════════════════════════════════════════════════════════════╝

Select a demo to run:

1. Working Demo - See learning, bug fixes, transformations
2. Introspective Test - Framework self-testing
3. Enhanced OPERA Test - Original enhanced test

Enter your choice (1-3): `);

process.stdin.once('data', (data) => {
  const choice = data.toString().trim();
  const demo = demos[choice];
  
  if (demo) {
    console.clear();
    console.log(`\nRunning ${demo.name}...\n`);
    
    const child = spawn('node', [join(__dirname, demo.file)], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\nDemo exited with code ${code}`);
      }
    });
  } else {
    console.log('\nInvalid choice. Please run again and select 1-3.');
    process.exit(0);
  }
});
