#!/usr/bin/env node

/**
 * MCP Health Check CLI Tool
 *
 * Command-line tool to check health of all 11 MCPs configured in the framework.
 *
 * Usage:
 *   npm run mcp:health
 *   node scripts/mcp-health-check.cjs
 *   node scripts/mcp-health-check.cjs --verbose
 *   node scripts/mcp-health-check.cjs --watch
 *
 * Exit Codes:
 *   0 - All MCPs healthy
 *   1 - Some MCPs unhealthy
 *   2 - Critical error
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG_PATH = path.join(process.cwd(), '.cursor', 'mcp_config.json');
const TIMEOUT = 5000; // 5 seconds
const SLOW_THRESHOLD = 3000; // 3 seconds

// ============================================================================
// ANSI Colors
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// ============================================================================
// Utility Functions
// ============================================================================

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStatus(status, message) {
  const statusColors = {
    'healthy': 'green',
    'unhealthy': 'red',
    'slow': 'yellow',
    'skipped': 'cyan'
  };

  const statusIcons = {
    'healthy': '✅',
    'unhealthy': '❌',
    'slow': '⚠️ ',
    'skipped': '⏭️ '
  };

  const color = statusColors[status] || 'white';
  const icon = statusIcons[status] || '•';

  log(`${icon} ${message}`, color);
}

function formatTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

function drawLine(char = '━', length = 80) {
  log(char.repeat(length), 'dim');
}

function drawHeader(title) {
  drawLine();
  log(`  ${title}`, 'bright');
  drawLine();
  console.log();
}

// ============================================================================
// MCP Configuration Loader
// ============================================================================

class MCPConfigLoader {
  loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`MCP config not found at ${CONFIG_PATH}`);
    }

    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    return config.mcpServers || {};
  }

  getMCPCount() {
    return Object.keys(this.loadConfig()).length;
  }

  getMCPNames() {
    return Object.keys(this.loadConfig());
  }
}

// ============================================================================
// MCP Health Checker
// ============================================================================

class MCPHealthChecker {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || TIMEOUT;
  }

  /**
   * Check health of a single MCP
   */
  async checkMCP(name, config) {
    const startTime = Date.now();

    try {
      if (this.verbose) {
        log(`\nChecking ${name}...`, 'dim');
        log(`  Command: ${config.command} ${config.args.join(' ')}`, 'dim');
      }

      // Check if MCP requires credentials
      if (this.requiresCredentials(name, config)) {
        const hasCredentials = this.hasRequiredCredentials(config);
        if (!hasCredentials) {
          if (this.verbose) {
            log(`  Missing credentials (expected in test environment)`, 'dim');
          }
          return {
            name,
            status: 'skipped',
            responseTime: 0,
            error: 'Missing required credentials',
            lastCheck: new Date()
          };
        }
      }

      // Attempt to start MCP process
      const process = await this.startMCPProcess(name, config);

      // Wait for process to be ready
      const healthy = await this.waitForReady(process, this.timeout);

      const responseTime = Date.now() - startTime;

      // Cleanup process
      this.stopProcess(process);

      // Determine status
      let status = 'healthy';
      if (responseTime > SLOW_THRESHOLD) {
        status = 'slow';
      }

      return {
        name,
        status: healthy ? status : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          command: config.command,
          args: config.args,
          description: config.description
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check health of all MCPs
   */
  async checkAllMCPs(configs) {
    const results = [];

    for (const [name, config] of Object.entries(configs)) {
      const result = await this.checkMCP(name, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Start MCP process
   */
  async startMCPProcess(name, config) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...config.env };

      const proc = spawn(config.command, config.args, {
        env,
        stdio: 'pipe',
        shell: false
      });

      let started = false;

      proc.on('spawn', () => {
        started = true;
        resolve(proc);
      });

      proc.on('error', (error) => {
        if (!started) {
          reject(new Error(`Failed to start ${name}: ${error.message}`));
        }
      });

      // Timeout for spawn
      setTimeout(() => {
        if (!started) {
          proc.kill();
          reject(new Error(`Timeout starting ${name}`));
        }
      }, 3000);
    });
  }

  /**
   * Wait for MCP to be ready
   */
  async waitForReady(process, timeout) {
    return new Promise((resolve) => {
      let ready = false;

      // Listen for stdout indicating readiness
      if (process.stdout) {
        process.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('ready') ||
              output.includes('listening') ||
              output.includes('started') ||
              output.includes('initialized')) {
            ready = true;
            resolve(true);
          }
        });
      }

      // If no ready signal, assume ready after 1 second
      setTimeout(() => {
        if (!ready) {
          if (!process.killed && process.exitCode === null) {
            ready = true;
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }, 1000);

      // Timeout
      setTimeout(() => {
        if (!ready) {
          resolve(false);
        }
      }, timeout);

      // Handle process exit
      process.on('exit', (code) => {
        if (!ready && code !== 0) {
          resolve(false);
        }
      });
    });
  }

  /**
   * Stop MCP process
   */
  stopProcess(process) {
    try {
      if (!process.killed && process.exitCode === null) {
        process.kill('SIGTERM');

        setTimeout(() => {
          if (!process.killed && process.exitCode === null) {
            process.kill('SIGKILL');
          }
        }, 2000);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Check if MCP requires credentials
   */
  requiresCredentials(name, config) {
    const requiresAuth = [
      'github',
      'exa',
      'vertex-ai',
      'supabase',
      'n8n',
      'semgrep',
      'sentry'
    ];
    return requiresAuth.includes(name);
  }

  /**
   * Check if required credentials are available
   */
  hasRequiredCredentials(config) {
    if (!config.env) return false;

    for (const [key, value] of Object.entries(config.env)) {
      if (value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        if (!process.env[envVar]) {
          return false;
        }
      }
    }

    return true;
  }
}

// ============================================================================
// Report Generator
// ============================================================================

class HealthReportGenerator {
  generateReport(results) {
    drawHeader('📊 MCP Health Check');

    // Summary statistics
    const total = results.length;
    const healthy = results.filter(r => r.status === 'healthy').length;
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    const slow = results.filter(r => r.status === 'slow').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    log(`Total MCPs: ${total}`, 'bright');
    logStatus('healthy', `Healthy: ${healthy}`);
    logStatus('unhealthy', `Unhealthy: ${unhealthy}`);
    logStatus('slow', `Slow: ${slow}`);
    logStatus('skipped', `Skipped: ${skipped}`);
    console.log();

    // Individual MCP results
    drawLine('─');
    log('| MCP                  | Status      | Response Time | Last Check       |', 'bright');
    drawLine('─');

    results.forEach(result => {
      const name = result.name.padEnd(20);
      const status = this.formatStatus(result.status).padEnd(11);
      const time = formatTime(result.responseTime).padEnd(13);
      const lastCheck = result.lastCheck.toLocaleTimeString();

      console.log(`| ${name} | ${status} | ${time} | ${lastCheck} |`);
    });

    drawLine('─');
    console.log();

    // Error details
    const errored = results.filter(r => r.error);
    if (errored.length > 0) {
      log('⚠️  Errors:', 'yellow');
      console.log();
      errored.forEach(result => {
        log(`  ${result.name}:`, 'red');
        log(`    ${result.error}`, 'dim');
      });
      console.log();
    }

    // Performance metrics
    const activeResults = results.filter(r => r.status !== 'skipped');
    if (activeResults.length > 0) {
      const avgResponseTime = activeResults.reduce((sum, r) => sum + r.responseTime, 0) / activeResults.length;

      log('Performance Metrics:', 'bright');
      log(`  Average Response Time: ${formatTime(avgResponseTime)}`, 'dim');
      console.log();
    }

    // Overall status
    drawLine();
    if (unhealthy === 0 && slow === 0) {
      log('✅ All MCPs healthy!', 'green');
    } else if (unhealthy > 0) {
      log(`❌ ${unhealthy} MCP${unhealthy > 1 ? 's' : ''} unhealthy`, 'red');
    } else {
      log(`⚠️  ${slow} MCP${slow > 1 ? 's' : ''} slow`, 'yellow');
    }
    drawLine();
  }

  formatStatus(status) {
    const statusMap = {
      'healthy': '✅ Healthy',
      'unhealthy': '❌ Down',
      'slow': '⚠️  Slow',
      'skipped': '⏭️  Skipped'
    };
    return statusMap[status] || status;
  }
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const watch = args.includes('--watch') || args.includes('-w');

  try {
    // Load configuration
    const configLoader = new MCPConfigLoader();
    const mcpConfigs = configLoader.loadConfig();

    log(`\nVERSATIL Framework - MCP Health Check\n`, 'bright');
    log(`Checking ${configLoader.getMCPCount()} MCPs...\n`, 'dim');

    // Run health check
    const healthChecker = new MCPHealthChecker({ verbose });
    const results = await healthChecker.checkAllMCPs(mcpConfigs);

    // Generate report
    const reportGenerator = new HealthReportGenerator();
    reportGenerator.generateReport(results);

    // Watch mode
    if (watch) {
      log('\nWatch mode enabled. Checking every 60 seconds...', 'cyan');
      log('Press Ctrl+C to exit.\n', 'dim');

      setInterval(async () => {
        console.clear();
        const newResults = await healthChecker.checkAllMCPs(mcpConfigs);
        reportGenerator.generateReport(newResults);
      }, 60000);
    }

    // Exit code
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    process.exit(unhealthy > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    if (verbose) {
      console.error(error);
    }
    process.exit(2);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { MCPHealthChecker, MCPConfigLoader, HealthReportGenerator };
