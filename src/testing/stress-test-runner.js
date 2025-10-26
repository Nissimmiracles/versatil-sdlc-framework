#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Stress Test Runner
 * Auto-triggered by afterFileEdit hook when API files change
 *
 * Purpose:
 * - Detect API endpoint changes from file modifications
 * - Run targeted stress tests for affected endpoints only
 * - Report results to statusline/logs
 * - Block file save if critical failures detected (configurable)
 *
 * Integration: Called by ~/.versatil/hooks/afterFileEdit.sh
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  timeout: 120000, // 2 minutes max for stress tests
  blockOnFailure: false, // Don't block file save by default
  logPath: process.env.HOME + '/.versatil/logs/stress-test-runner.log',
  statusPath: process.env.HOME + '/.versatil/status/stress-test-status.json',
  minTestDuration: 5000, // Minimum 5 seconds per test
  maxTestDuration: 300000, // Maximum 5 minutes per test
};

/**
 * Main entry point
 */
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    logError('No file path provided');
    process.exit(1);
  }

  logInfo(`Stress test runner triggered for: ${filePath}`);

  try {
    // Step 1: Detect if file contains API endpoints
    const endpoints = await detectAPIEndpoints(filePath);

    if (endpoints.length === 0) {
      logInfo('No API endpoints detected in file - skipping stress tests');
      process.exit(0);
    }

    logInfo(`Detected ${endpoints.length} API endpoint(s): ${endpoints.map(e => e.method + ' ' + e.path).join(', ')}`);

    // Step 2: Find or generate stress tests for these endpoints
    const stressTests = await findStressTestsForEndpoints(endpoints);

    if (stressTests.length === 0) {
      logWarn('No existing stress tests found - generating new tests');
      const generated = await generateStressTests(endpoints, filePath);
      stressTests.push(...generated);
    }

    // Step 3: Run stress tests
    const results = await runStressTests(stressTests);

    // Step 4: Report results
    await reportResults(results, filePath);

    // Step 5: Exit based on results
    const hasCriticalFailures = results.some(r => r.status === 'failed' && r.severity === 'critical');

    if (hasCriticalFailures && CONFIG.blockOnFailure) {
      logError('Critical stress test failures detected - blocking file save');
      process.exit(1);
    }

    logInfo('Stress test execution completed successfully');
    process.exit(0);

  } catch (error) {
    logError(`Stress test runner failed: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  }
}

/**
 * Detect API endpoints from file content
 */
async function detectAPIEndpoints(filePath) {
  const endpoints = [];

  if (!existsSync(filePath)) {
    logWarn(`File does not exist: ${filePath}`);
    return endpoints;
  }

  const content = readFileSync(filePath, 'utf-8');
  const fileName = basename(filePath);

  // Pattern 1: Express.js routes (app.get, app.post, router.get, etc.)
  const expressPatterns = [
    /(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  ];

  // Pattern 2: Fastify routes
  const fastifyPatterns = [
    /fastify\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  ];

  // Pattern 3: NestJS decorators
  const nestjsPatterns = [
    /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
  ];

  // Pattern 4: Next.js API routes (infer from file path)
  if (filePath.includes('/api/') || filePath.includes('/pages/api/')) {
    const routePath = inferNextJSRoute(filePath);
    endpoints.push({
      method: 'GET', // Default, Next.js supports all methods in handler
      path: routePath,
      file: filePath,
      framework: 'nextjs'
    });
    endpoints.push({
      method: 'POST',
      path: routePath,
      file: filePath,
      framework: 'nextjs'
    });
  }

  // Apply all patterns
  const allPatterns = [...expressPatterns, ...fastifyPatterns, ...nestjsPatterns];

  for (const pattern of allPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file: filePath,
        framework: detectFramework(pattern)
      });
    }
  }

  return endpoints;
}

/**
 * Infer Next.js API route from file path
 */
function inferNextJSRoute(filePath) {
  const apiIndex = filePath.indexOf('/api/');
  if (apiIndex === -1) return '/api/unknown';

  const routePart = filePath.substring(apiIndex);
  return routePart
    .replace(/\.(ts|js|tsx|jsx)$/, '')
    .replace(/\/index$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1'); // Convert [id] to :id
}

/**
 * Detect framework from regex pattern
 */
function detectFramework(pattern) {
  const patternStr = pattern.toString();
  if (patternStr.includes('fastify')) return 'fastify';
  if (patternStr.includes('@')) return 'nestjs';
  return 'express';
}

/**
 * Find existing stress tests for endpoints
 */
async function findStressTestsForEndpoints(endpoints) {
  const stressTests = [];
  const stressTestDir = resolve(__dirname, '../../../tests/stress');

  if (!existsSync(stressTestDir)) {
    logWarn(`Stress test directory not found: ${stressTestDir}`);
    return stressTests;
  }

  // Simple heuristic: Look for files matching endpoint paths
  for (const endpoint of endpoints) {
    const testName = endpoint.path
      .replace(/^\/api\//, '')
      .replace(/\//g, '-')
      .replace(/:/g, '')
      .toLowerCase();

    const possibleTestFiles = [
      `${stressTestDir}/${testName}.stress.test.ts`,
      `${stressTestDir}/${testName}.stress.test.js`,
      `${stressTestDir}/${endpoint.method.toLowerCase()}-${testName}.stress.test.ts`,
      `${stressTestDir}/${endpoint.method.toLowerCase()}-${testName}.stress.test.js`,
    ];

    for (const testFile of possibleTestFiles) {
      if (existsSync(testFile)) {
        stressTests.push({
          endpoint,
          testFile,
          type: 'existing'
        });
        break;
      }
    }
  }

  return stressTests;
}

/**
 * Generate stress tests for endpoints using AutomatedStressTestGenerator
 */
async function generateStressTests(endpoints, sourceFile) {
  const generatedTests = [];

  logInfo('Generating stress tests using AutomatedStressTestGenerator...');

  try {
    // Dynamically import the stress test generator
    const { AutomatedStressTestGenerator } = await import('./automated-stress-test-generator.js');
    const generator = new AutomatedStressTestGenerator();

    for (const endpoint of endpoints) {
      const target = {
        type: 'api_endpoint',
        endpoint: `${endpoint.method} ${endpoint.path}`,
        component: basename(sourceFile, '.ts')
      };

      // Generate tests
      const configs = await generator.generateStressTests(target);

      // Save to temp location for execution
      for (const config of configs) {
        const testFile = `/tmp/versatil-stress-test-${Date.now()}-${config.id}.json`;
        writeFileSync(testFile, JSON.stringify(config, null, 2));

        generatedTests.push({
          endpoint,
          testFile,
          config,
          type: 'generated'
        });
      }
    }

    logInfo(`Generated ${generatedTests.length} stress test configurations`);

  } catch (error) {
    logError(`Failed to generate stress tests: ${error.message}`);
  }

  return generatedTests;
}

/**
 * Run stress tests
 */
async function runStressTests(stressTests) {
  const results = [];

  for (const test of stressTests) {
    logInfo(`Running stress test: ${test.testFile}`);

    const startTime = Date.now();
    let status = 'passed';
    let error = null;
    let metrics = null;

    try {
      if (test.type === 'existing') {
        // Run existing Jest/Playwright test
        const output = execSync(
          `npm run test:stress -- --testPathPatterns="${test.testFile}"`,
          {
            cwd: resolve(__dirname, '../../..'),
            timeout: CONFIG.timeout,
            encoding: 'utf-8'
          }
        );

        metrics = parseJestOutput(output);

      } else if (test.type === 'generated') {
        // Execute generated stress test using AutomatedStressTestGenerator
        const { AutomatedStressTestGenerator } = await import('./automated-stress-test-generator.js');
        const generator = new AutomatedStressTestGenerator();

        const testResults = await generator.executeStressTests([test.config.id]);
        const result = testResults.get(test.config.id);

        status = result.status === 'passed' ? 'passed' : 'failed';
        metrics = result.metrics;
      }

    } catch (err) {
      status = 'failed';
      error = err.message;
      logError(`Stress test failed: ${err.message}`);
    }

    const duration = Date.now() - startTime;

    results.push({
      endpoint: test.endpoint,
      testFile: test.testFile,
      status,
      duration,
      metrics,
      error,
      severity: determineSeverity(metrics, status),
      timestamp: new Date().toISOString()
    });
  }

  return results;
}

/**
 * Parse Jest output to extract metrics
 */
function parseJestOutput(output) {
  // Simple parsing - extract test results
  const passed = (output.match(/✓/g) || []).length;
  const failed = (output.match(/✗/g) || []).length;

  return {
    totalTests: passed + failed,
    passedTests: passed,
    failedTests: failed,
    passRate: passed / (passed + failed) * 100
  };
}

/**
 * Determine severity of test result
 */
function determineSeverity(metrics, status) {
  if (status === 'failed') {
    if (metrics && metrics.errorRate > 20) return 'critical';
    if (metrics && metrics.errorRate > 10) return 'high';
    return 'medium';
  }

  if (metrics && metrics.errorRate > 5) return 'warning';
  return 'info';
}

/**
 * Report results to statusline and logs
 */
async function reportResults(results, filePath) {
  const summary = {
    filePath,
    totalTests: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    timestamp: new Date().toISOString(),
    results
  };

  // Write to status file for statusline consumption
  writeFileSync(CONFIG.statusPath, JSON.stringify(summary, null, 2));

  // Log summary
  logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo('Stress Test Execution Summary');
  logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logInfo(`File: ${filePath}`);
  logInfo(`Total Tests: ${summary.totalTests}`);
  logInfo(`Passed: ${summary.passed}`);
  logInfo(`Failed: ${summary.failed}`);

  for (const result of results) {
    const icon = result.status === 'passed' ? '✅' : '❌';
    logInfo(`${icon} ${result.endpoint.method} ${result.endpoint.path} - ${result.status} (${result.duration}ms)`);

    if (result.metrics) {
      logInfo(`   Response Time: ${result.metrics.averageResponseTime || 'N/A'}ms`);
      logInfo(`   Error Rate: ${result.metrics.errorRate || 0}%`);
    }
  }

  logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Logging utilities
 */
function logInfo(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [INFO] ${message}`;
  console.log(logMessage);
  appendToLog(logMessage);
}

function logWarn(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [WARN] ${message}`;
  console.warn(logMessage);
  appendToLog(logMessage);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [ERROR] ${message}`;
  console.error(logMessage);
  appendToLog(logMessage);
}

function appendToLog(message) {
  try {
    const logDir = dirname(CONFIG.logPath);
    execSync(`mkdir -p "${logDir}"`);
    execSync(`echo '${message.replace(/'/g, "'\\''")}' >> "${CONFIG.logPath}"`);
  } catch (error) {
    // Ignore log write failures
  }
}

// Run main function
main().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});
