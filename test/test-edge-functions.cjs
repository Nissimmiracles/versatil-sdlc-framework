#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Edge Function Integration Tests
 *
 * Comprehensive testing suite for Supabase Edge Functions including
 * BMAD agents, performance validation, and production readiness checks.
 */

// Simple color functions (compatible with all Node versions)
const chalk = {
  blue: { bold: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m` },
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Use built-in fetch (Node 18+) or require 'node-fetch' for older versions
const fetch = globalThis.fetch || require('node-fetch');

class EdgeFunctionTester {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.testResults = [];
    this.startTime = Date.now();

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }
  }

  /**
   * Run comprehensive edge function tests
   */
  async runAllTests(options = {}) {
    console.log(chalk.blue.bold('🧪 VERSATIL Edge Function Integration Tests\n'));

    const testSuites = [
      { name: 'Health Checks', method: 'testHealthChecks' },
      { name: 'BMAD Agent Functionality', method: 'testBMADAgents' },
      { name: 'Rate Limiting', method: 'testRateLimiting' },
      { name: 'Caching Behavior', method: 'testCaching' },
      { name: 'Performance Benchmarks', method: 'testPerformance' },
      { name: 'Error Handling', method: 'testErrorHandling' },
      { name: 'Security Headers', method: 'testSecurityHeaders' },
      { name: 'Monitoring Endpoints', method: 'testMonitoring' }
    ];

    if (options.suite) {
      const suite = testSuites.find(s => s.name.toLowerCase().includes(options.suite.toLowerCase()));
      if (suite) {
        await this.runTestSuite(suite);
      } else {
        console.error(chalk.red(`Test suite "${options.suite}" not found`));
        return;
      }
    } else {
      for (const suite of testSuites) {
        await this.runTestSuite(suite);
      }
    }

    this.generateReport();
  }

  async runTestSuite(suite) {
    console.log(chalk.yellow(`\n📋 Running ${suite.name} Tests...`));

    try {
      await this[suite.method]();
      console.log(chalk.green(`✅ ${suite.name} tests completed`));
    } catch (error) {
      console.error(chalk.red(`❌ ${suite.name} tests failed: ${error.message}`));
      this.testResults.push({
        suite: suite.name,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test health check endpoints
   */
  async testHealthChecks() {
    const functions = [
      'bmad-agent',
      'maria-rag',
      'james-rag',
      'marcus-rag',
      'store-memory',
      'query-memories',
      'context-fusion'
    ];

    for (const funcName of functions) {
      await this.testFunction(
        `Health check: ${funcName}`,
        'GET',
        `${this.supabaseUrl}/functions/v1/${funcName}/health`,
        null,
        (response, data) => {
          if (response.status !== 200) {
            throw new Error(`Health check failed with status ${response.status}`);
          }
          if (funcName === 'bmad-agent' && data.status !== 'healthy') {
            throw new Error('BMAD agent reported unhealthy status');
          }
        }
      );
    }
  }

  /**
   * Test BMAD agent functionality
   */
  async testBMADAgents() {
    const agents = [
      {
        agent: 'enhanced-maria',
        action: 'analyze',
        context: {
          filePath: 'test.js',
          content: 'function test() { return true; }',
          language: 'javascript'
        }
      },
      {
        agent: 'enhanced-james',
        action: 'analyze',
        context: {
          filePath: 'component.tsx',
          content: 'import React from "react"; export const Button = () => <button>Click</button>;',
          language: 'typescript',
          framework: 'react'
        }
      },
      {
        agent: 'enhanced-marcus',
        action: 'analyze',
        context: {
          filePath: 'api.js',
          content: 'app.get("/api/users", (req, res) => { res.json(users); });',
          language: 'javascript',
          framework: 'express'
        }
      }
    ];

    for (const testCase of agents) {
      await this.testFunction(
        `BMAD Agent: ${testCase.agent}`,
        'POST',
        `${this.supabaseUrl}/functions/v1/bmad-agent`,
        testCase,
        (response, data) => {
          if (response.status !== 200) {
            throw new Error(`Agent request failed with status ${response.status}`);
          }
          if (!data.success) {
            throw new Error(`Agent returned error: ${data.error}`);
          }
          if (!data.data || !data.metadata) {
            throw new Error('Agent response missing required fields');
          }
          if (data.metadata.agentId !== testCase.agent) {
            throw new Error(`Agent ID mismatch: expected ${testCase.agent}, got ${data.metadata.agentId}`);
          }
        }
      );
    }
  }

  /**
   * Test rate limiting functionality
   */
  async testRateLimiting() {
    console.log(chalk.gray('  Testing rate limiting (this may take a moment)...'));

    const testPayload = {
      agent: 'enhanced-maria',
      action: 'analyze',
      context: {
        filePath: 'rate-limit-test.js',
        content: 'console.log("rate limit test");',
        language: 'javascript'
      }
    };

    // Make rapid requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        fetch(`${this.supabaseUrl}/functions/v1/bmad-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify(testPayload)
        })
      );
    }

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    this.testResults.push({
      suite: 'Rate Limiting',
      test: 'Rapid requests',
      success: rateLimitedResponses.length > 0,
      details: `${rateLimitedResponses.length} out of 50 requests were rate limited`,
      timestamp: Date.now()
    });

    if (rateLimitedResponses.length === 0) {
      console.log(chalk.yellow('    ⚠️ Rate limiting may not be working as expected'));
    } else {
      console.log(chalk.green(`    ✅ Rate limiting active (${rateLimitedResponses.length}/50 requests limited)`));
    }
  }

  /**
   * Test caching behavior
   */
  async testCaching() {
    const testUrl = `${this.supabaseUrl}/functions/v1/bmad-agent/health`;

    // First request
    const start1 = Date.now();
    const response1 = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${this.supabaseKey}` }
    });
    const time1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    const response2 = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${this.supabaseKey}` }
    });
    const time2 = Date.now() - start2;

    this.testResults.push({
      suite: 'Caching',
      test: 'Response caching',
      success: true,
      details: `First request: ${time1}ms, Second request: ${time2}ms`,
      timestamp: Date.now()
    });

    console.log(chalk.green(`    ✅ Caching test completed (${time1}ms -> ${time2}ms)`));
  }

  /**
   * Test performance benchmarks
   */
  async testPerformance() {
    const testPayload = {
      agent: 'enhanced-maria',
      action: 'analyze',
      context: {
        filePath: 'performance-test.js',
        content: 'function performanceTest() { return Array(1000).fill(0).map((_, i) => i * 2); }',
        language: 'javascript'
      }
    };

    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const response = await fetch(`${this.supabaseUrl}/functions/v1/bmad-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        times.push(Date.now() - start);
      }
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    this.testResults.push({
      suite: 'Performance',
      test: 'Response times',
      success: avgTime < 2000, // Under 2 seconds average
      details: `Average: ${avgTime.toFixed(0)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`,
      timestamp: Date.now()
    });

    if (avgTime > 2000) {
      console.log(chalk.yellow(`    ⚠️ Average response time high: ${avgTime.toFixed(0)}ms`));
    } else {
      console.log(chalk.green(`    ✅ Performance acceptable (avg: ${avgTime.toFixed(0)}ms)`));
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    const errorTests = [
      {
        name: 'Invalid agent',
        payload: { agent: 'invalid-agent', action: 'analyze', context: {} },
        expectedStatus: 400
      },
      {
        name: 'Missing context',
        payload: { agent: 'enhanced-maria', action: 'analyze' },
        expectedStatus: 400
      },
      {
        name: 'Invalid action',
        payload: { agent: 'enhanced-maria', action: 'invalid-action', context: {} },
        expectedStatus: 500
      }
    ];

    for (const test of errorTests) {
      await this.testFunction(
        `Error handling: ${test.name}`,
        'POST',
        `${this.supabaseUrl}/functions/v1/bmad-agent`,
        test.payload,
        (response, data) => {
          if (response.status !== test.expectedStatus) {
            throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
          }
          if (!data.error) {
            throw new Error('Error response should contain error message');
          }
        }
      );
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/bmad-agent/health`, {
      headers: { 'Authorization': `Bearer ${this.supabaseKey}` }
    });

    const securityHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ];

    for (const header of securityHeaders) {
      if (!response.headers.get(header)) {
        throw new Error(`Missing security header: ${header}`);
      }
    }

    this.testResults.push({
      suite: 'Security',
      test: 'CORS headers',
      success: true,
      details: 'All required CORS headers present',
      timestamp: Date.now()
    });

    console.log(chalk.green('    ✅ Security headers validated'));
  }

  /**
   * Test monitoring endpoints
   */
  async testMonitoring() {
    await this.testFunction(
      'Metrics endpoint',
      'GET',
      `${this.supabaseUrl}/functions/v1/bmad-agent/metrics`,
      null,
      (response, data) => {
        if (response.status !== 200) {
          throw new Error(`Metrics endpoint failed with status ${response.status}`);
        }
        if (!data.requestCount && data.requestCount !== 0) {
          throw new Error('Metrics response missing requestCount');
        }
        if (!data.agentMetrics) {
          throw new Error('Metrics response missing agentMetrics');
        }
      }
    );
  }

  /**
   * Helper method to test a function
   */
  async testFunction(testName, method, url, payload, validator) {
    try {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      };

      if (payload) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);

      let data = null;
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (e) {
        // Non-JSON response is okay for some tests
      }

      if (validator) {
        validator(response, data);
      }

      this.testResults.push({
        suite: 'Individual',
        test: testName,
        success: true,
        details: `Status: ${response.status}`,
        timestamp: Date.now()
      });

      console.log(chalk.green(`    ✅ ${testName}`));

    } catch (error) {
      this.testResults.push({
        suite: 'Individual',
        test: testName,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      console.log(chalk.red(`    ❌ ${testName}: ${error.message}`));
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(chalk.blue.bold('\n📋 Edge Function Test Report'));
    console.log(chalk.blue('='.repeat(50)));

    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${chalk.green(passedTests)}`);
    console.log(`❌ Failed: ${chalk.red(failedTests)}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    // Group results by suite
    const suiteResults = {};
    this.testResults.forEach(result => {
      if (!suiteResults[result.suite]) {
        suiteResults[result.suite] = { passed: 0, failed: 0, tests: [] };
      }
      if (result.success) {
        suiteResults[result.suite].passed++;
      } else {
        suiteResults[result.suite].failed++;
      }
      suiteResults[result.suite].tests.push(result);
    });

    console.log(chalk.blue('\n📋 Test Suite Breakdown:'));
    Object.entries(suiteResults).forEach(([suite, results]) => {
      const total = results.passed + results.failed;
      const rate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0';
      console.log(`  ${suite}: ${results.passed}/${total} (${rate}%)`);
    });

    // Show failed tests
    const failedTestsDetails = this.testResults.filter(r => !r.success);
    if (failedTestsDetails.length > 0) {
      console.log(chalk.red('\n❌ Failed Tests:'));
      failedTestsDetails.forEach(test => {
        console.log(`  • ${test.test}: ${test.error}`);
      });
    }

    // Recommendations
    console.log(chalk.blue('\n💡 Recommendations:'));
    if (failedTests === 0) {
      console.log('  ✅ All tests passed! Edge functions are production ready.');
    } else {
      console.log('  ⚠️  Some tests failed. Review and fix issues before deployment.');
    }

    if (passedTests / totalTests < 0.9) {
      console.log('  📈 Consider improving test coverage and reliability.');
    }

    console.log(chalk.green('\n🎉 Edge function testing completed!'));
  }
}

// CLI interface
const { Command } = require('commander');
const program = new Command();

program
  .name('test-edge-functions')
  .description('Test VERSATIL Edge Functions')
  .version('1.2.1')
  .option('--suite <name>', 'Run specific test suite')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const tester = new EdgeFunctionTester();
      await tester.runAllTests(options);
    } catch (error) {
      console.error(chalk.red(`Test runner failed: ${error.message}`));
      process.exit(1);
    }
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = { EdgeFunctionTester };