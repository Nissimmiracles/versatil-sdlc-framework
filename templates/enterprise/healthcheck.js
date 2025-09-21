#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Health Check Script
 * Enterprise deployment health monitoring for Enhanced BMAD agents
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class HealthChecker {
  constructor() {
    this.checks = [];
    this.timeout = 5000; // 5 seconds
  }

  // Add health check
  addCheck(name, checkFunction) {
    this.checks.push({ name, check: checkFunction });
  }

  // Run all health checks
  async runChecks() {
    const results = [];
    let allHealthy = true;

    for (const { name, check } of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          check(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.timeout)
          )
        ]);

        const duration = Date.now() - startTime;
        results.push({
          name,
          status: 'healthy',
          duration,
          details: result
        });
      } catch (error) {
        allHealthy = false;
        results.push({
          name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    return { healthy: allHealthy, checks: results };
  }
}

// Initialize health checker
const healthChecker = new HealthChecker();

// Application Health Check
healthChecker.addCheck('application', async () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'running', port: 3000 });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
});

// File System Health Check
healthChecker.addCheck('filesystem', async () => {
  const testFile = path.join('/tmp', 'health-check-' + Date.now());

  return new Promise((resolve, reject) => {
    fs.writeFile(testFile, 'health-check', (err) => {
      if (err) return reject(err);

      fs.unlink(testFile, (unlinkErr) => {
        if (unlinkErr) console.warn('Could not delete test file:', unlinkErr.message);
        resolve({ writable: true });
      });
    });
  });
});

// Memory Health Check
healthChecker.addCheck('memory', async () => {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  if (usagePercent > 90) {
    throw new Error(`High memory usage: ${usagePercent}%`);
  }

  return {
    total: `${totalMB}MB`,
    used: `${usedMB}MB`,
    usage: `${usagePercent}%`
  };
});

// Enhanced BMAD Agents Health Check
healthChecker.addCheck('bmad-agents', async () => {
  const agentDataPath = path.join('/app/.versatil', 'analytics', 'metrics.json');

  if (!fs.existsSync(agentDataPath)) {
    return { status: 'no-metrics', message: 'No agent metrics found' };
  }

  const stats = fs.statSync(agentDataPath);
  const lastModified = Date.now() - stats.mtime.getTime();

  // Check if metrics are recent (within last hour)
  if (lastModified > 3600000) {
    throw new Error(`Agent metrics stale: ${Math.round(lastModified / 60000)} minutes old`);
  }

  return {
    status: 'active',
    lastUpdate: stats.mtime.toISOString()
  };
});

// Configuration Health Check
healthChecker.addCheck('configuration', async () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'ENHANCED_AGENTS_ENABLED',
    'PERFORMANCE_MONITORING'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    environment: process.env.NODE_ENV,
    agentsEnabled: process.env.ENHANCED_AGENTS_ENABLED === 'true',
    monitoringEnabled: process.env.PERFORMANCE_MONITORING === 'true'
  };
});

// MCP Integration Health Check
healthChecker.addCheck('mcp-integration', async () => {
  const mcpPort = process.env.MCP_SERVER_PORT || 3001;

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: mcpPort,
      path: '/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'running', port: mcpPort });
      } else {
        // MCP server not responding is not critical
        resolve({ status: 'unavailable', port: mcpPort });
      }
    });

    req.on('error', () => {
      // MCP server not responding is not critical
      resolve({ status: 'unavailable', port: mcpPort });
    });

    req.on('timeout', () => {
      resolve({ status: 'timeout', port: mcpPort });
    });

    req.end();
  });
});

// Main health check execution
async function main() {
  console.log('🔍 VERSATIL Health Check Starting...');

  try {
    const result = await healthChecker.runChecks();

    console.log('\n📊 Health Check Results:');
    console.log('========================');

    result.checks.forEach(check => {
      const status = check.status === 'healthy' ? '✅' : '❌';
      const duration = check.duration ? ` (${check.duration}ms)` : '';
      console.log(`${status} ${check.name}${duration}`);

      if (check.details) {
        console.log(`   ${JSON.stringify(check.details)}`);
      }

      if (check.error) {
        console.log(`   Error: ${check.error}`);
      }
    });

    console.log(`\n🎯 Overall Status: ${result.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);

    // Exit with appropriate code
    process.exit(result.healthy ? 0 : 1);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Health check terminated');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Health check interrupted');
  process.exit(0);
});

// Run health check if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, healthChecker };