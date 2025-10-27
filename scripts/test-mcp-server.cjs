#!/usr/bin/env node

/**
 * Test MCP Server - Quick Health Check
 * Tests if the MCP server starts quickly and responds to health checks
 */

const { spawn } = require('child_process');
const path = require('path');

const VERSATIL_BIN = path.join(__dirname, '../bin/versatil-mcp.js');
const VERSATIL_ROOT = path.join(__dirname, '..');
const TEST_TIMEOUT = 15000; // 15 seconds max

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   🧪 MCP Server Quick Test   🧪                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`📍 Binary: ${VERSATIL_BIN}`);
console.log(`📁 Project: ${VERSATIL_ROOT}`);
console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms\n`);

const startTime = Date.now();

// Spawn MCP server
const server = spawn('node', [VERSATIL_BIN, VERSATIL_ROOT], {
  env: {
    ...process.env,
    VERSATIL_PROJECT_PATH: VERSATIL_ROOT,
    VERSATIL_MCP_MODE: 'true',
    NODE_ENV: 'production'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';
let testPassed = false;

// Set timeout
const timeout = setTimeout(() => {
  if (!testPassed) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ TEST FAILED: Server did not respond within ${TEST_TIMEOUT}ms`);
    console.error(`⏱️  Elapsed: ${elapsed}ms`);
    console.error(`\n📋 Output so far:\n${output}`);
    if (errorOutput) {
      console.error(`\n⚠️  Errors:\n${errorOutput}`);
    }
    server.kill('SIGKILL');
    process.exit(1);
  }
}, TEST_TIMEOUT);

// Capture stdout
server.stdout.on('data', (data) => {
  output += data.toString();

  // Check for successful initialization
  if (output.includes('MCP Server connected') || output.includes('stdio transport')) {
    const elapsed = Date.now() - startTime;
    console.log(`✅ SERVER STARTED SUCCESSFULLY`);
    console.log(`⏱️  Startup time: ${elapsed}ms`);
    console.log(`\n📋 Server output:\n${output}`);

    testPassed = true;
    clearTimeout(timeout);

    // Give server a moment to stabilize
    setTimeout(() => {
      server.kill('SIGTERM');
      console.log(`\n🎉 TEST PASSED - Server is working!\n`);
      process.exit(0);
    }, 1000);
  }
});

// Capture stderr
server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

// Handle process exit
server.on('exit', (code, signal) => {
  if (!testPassed) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ TEST FAILED: Server exited prematurely`);
    console.error(`⏱️  Elapsed: ${elapsed}ms`);
    console.error(`🔢 Exit code: ${code}`);
    console.error(`🔔 Signal: ${signal}`);
    console.error(`\n📋 Output:\n${output}`);
    if (errorOutput) {
      console.error(`\n⚠️  Errors:\n${errorOutput}`);
    }
    clearTimeout(timeout);
    process.exit(1);
  }
});

// Handle errors
server.on('error', (err) => {
  console.error(`\n❌ TEST FAILED: ${err.message}`);
  clearTimeout(timeout);
  process.exit(1);
});
