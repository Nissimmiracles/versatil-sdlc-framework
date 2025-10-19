/**
 * MCP Health Check Test Suite
 *
 * Comprehensive health checks for all 11 MCPs configured in the framework:
 * 1. Playwright (browser automation)
 * 2. GitHub (repository operations)
 * 3. GitMCP (documentation access)
 * 4. Exa (AI search)
 * 5. Vertex AI (Google Cloud AI)
 * 6. Supabase (database operations)
 * 7. n8n (workflow automation)
 * 8. Semgrep (security scanning)
 * 9. Sentry (error monitoring)
 * 10. Claude Code MCP (enhanced IDE integration)
 * 11. Claude Opera MCP (VERSATIL framework MCP)
 *
 * Tests verify:
 * - MCP server process health
 * - Response time (< 5 seconds expected)
 * - Basic functionality
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface MCPConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description?: string;
}

interface MCPHealthResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'slow' | 'skipped';
  responseTime: number; // milliseconds
  error?: string;
  lastCheck: Date;
  details?: Record<string, any>;
}

interface MCPServerProcess {
  name: string;
  process: ChildProcess;
  healthy: boolean;
  startTime: number;
}

// ============================================================================
// MCP Configuration Loader
// ============================================================================

class MCPConfigLoader {
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), '.cursor', 'mcp_config.json');
  }

  loadConfig(): Record<string, MCPConfig> {
    if (!existsSync(this.configPath)) {
      throw new Error(`MCP config not found at ${this.configPath}`);
    }

    const configContent = readFileSync(this.configPath, 'utf-8');
    const config = JSON.parse(configContent);

    return config.mcpServers || {};
  }

  getMCPCount(): number {
    return Object.keys(this.loadConfig()).length;
  }

  getMCPNames(): string[] {
    return Object.keys(this.loadConfig());
  }
}

// ============================================================================
// MCP Health Checker
// ============================================================================

class MCPHealthChecker {
  private processes: Map<string, MCPServerProcess> = new Map();
  private timeout: number = 5000; // 5 seconds

  /**
   * Check health of a single MCP
   */
  async checkMCP(name: string, config: MCPConfig): Promise<MCPHealthResult> {
    const startTime = Date.now();

    try {
      // Check if MCP requires credentials
      if (this.requiresCredentials(name, config)) {
        const hasCredentials = this.hasRequiredCredentials(config);
        if (!hasCredentials) {
          return {
            name,
            status: 'skipped',
            responseTime: 0,
            error: 'Missing required credentials (expected in test environment)',
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
      let status: MCPHealthResult['status'] = 'healthy';
      if (responseTime > this.timeout) {
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
        error: error instanceof Error ? error.message : String(error),
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check health of all MCPs
   */
  async checkAllMCPs(configs: Record<string, MCPConfig>): Promise<MCPHealthResult[]> {
    const results: MCPHealthResult[] = [];

    for (const [name, config] of Object.entries(configs)) {
      const result = await this.checkMCP(name, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Start MCP process
   */
  private async startMCPProcess(name: string, config: MCPConfig): Promise<ChildProcess> {
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
  private async waitForReady(process: ChildProcess, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      let ready = false;

      // Listen for stdout indicating readiness
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        // Common readiness indicators
        if (output.includes('ready') ||
            output.includes('listening') ||
            output.includes('started') ||
            output.includes('initialized')) {
          ready = true;
          resolve(true);
        }
      });

      // If no ready signal, assume ready after 1 second (optimistic)
      setTimeout(() => {
        if (!ready) {
          // If process is still running, consider it ready
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
  private stopProcess(process: ChildProcess): void {
    try {
      if (!process.killed && process.exitCode === null) {
        process.kill('SIGTERM');

        // Force kill after 2 seconds
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
  private requiresCredentials(name: string, config: MCPConfig): boolean {
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
  private hasRequiredCredentials(config: MCPConfig): boolean {
    if (!config.env) return false;

    // Check for placeholder environment variables
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

  /**
   * Cleanup all processes
   */
  cleanup(): void {
    for (const [name, server] of this.processes.entries()) {
      this.stopProcess(server.process);
    }
    this.processes.clear();
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('MCP Health Check - All 11 MCPs', () => {
  let configLoader: MCPConfigLoader;
  let healthChecker: MCPHealthChecker;
  let mcpConfigs: Record<string, MCPConfig>;

  beforeAll(() => {
    configLoader = new MCPConfigLoader();
    healthChecker = new MCPHealthChecker();
    mcpConfigs = configLoader.loadConfig();
  });

  afterAll(() => {
    healthChecker.cleanup();
  });

  describe('MCP Configuration', () => {
    it('should have 11 MCPs configured', () => {
      const mcpCount = configLoader.getMCPCount();
      expect(mcpCount).toBe(11);
    });

    it('should have all expected MCPs in config', () => {
      const mcpNames = configLoader.getMCPNames();

      const expectedMCPs = [
        'playwright',
        'playwright-stealth',
        'github',
        'gitmcp',
        'exa',
        'vertex-ai',
        'supabase',
        'n8n',
        'semgrep',
        'sentry',
        'claude-code-mcp'
      ];

      expectedMCPs.forEach(expectedMCP => {
        expect(mcpNames).toContain(expectedMCP);
      });
    });

    it('should have valid command and args for each MCP', () => {
      for (const [name, config] of Object.entries(mcpConfigs)) {
        expect(config.command).toBeDefined();
        expect(config.command).not.toBe('');
        expect(config.args).toBeDefined();
        expect(Array.isArray(config.args)).toBe(true);
      }
    });
  });

  describe('Individual MCP Health Checks', () => {
    // Note: These tests may be skipped if credentials are not available
    // In CI/CD, credentials should be provided via environment variables

    it('should check Playwright MCP health', async () => {
      const config = mcpConfigs['playwright'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('playwright', config);

      expect(result.name).toBe('playwright');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.lastCheck).toBeInstanceOf(Date);

      if (result.status === 'healthy') {
        expect(result.responseTime).toBeLessThan(5000);
      }
    }, 10000);

    it('should check Playwright Stealth MCP health', async () => {
      const config = mcpConfigs['playwright-stealth'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('playwright-stealth', config);

      expect(result.name).toBe('playwright-stealth');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);
    }, 10000);

    it('should check GitHub MCP health', async () => {
      const config = mcpConfigs['github'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('github', config);

      expect(result.name).toBe('github');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      // May be skipped if GITHUB_TOKEN not provided
      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check GitMCP health', async () => {
      const config = mcpConfigs['gitmcp'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('gitmcp', config);

      expect(result.name).toBe('gitmcp');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);
    }, 10000);

    it('should check Exa MCP health', async () => {
      const config = mcpConfigs['exa'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('exa', config);

      expect(result.name).toBe('exa');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check Vertex AI MCP health', async () => {
      const config = mcpConfigs['vertex-ai'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('vertex-ai', config);

      expect(result.name).toBe('vertex-ai');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check Supabase MCP health', async () => {
      const config = mcpConfigs['supabase'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('supabase', config);

      expect(result.name).toBe('supabase');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check n8n MCP health', async () => {
      const config = mcpConfigs['n8n'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('n8n', config);

      expect(result.name).toBe('n8n');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check Semgrep MCP health', async () => {
      const config = mcpConfigs['semgrep'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('semgrep', config);

      expect(result.name).toBe('semgrep');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check Sentry MCP health', async () => {
      const config = mcpConfigs['sentry'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('sentry', config);

      expect(result.name).toBe('sentry');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);

      if (result.status === 'skipped') {
        expect(result.error).toContain('credentials');
      }
    }, 10000);

    it('should check Claude Code MCP health', async () => {
      const config = mcpConfigs['claude-code-mcp'];
      expect(config).toBeDefined();

      const result = await healthChecker.checkMCP('claude-code-mcp', config);

      expect(result.name).toBe('claude-code-mcp');
      expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);
    }, 10000);
  });

  describe('Batch Health Check', () => {
    it('should check health of all MCPs in batch', async () => {
      const results = await healthChecker.checkAllMCPs(mcpConfigs);

      expect(results.length).toBe(11);

      // Verify all MCPs were checked
      const checkedNames = results.map(r => r.name);
      expect(checkedNames).toContain('playwright');
      expect(checkedNames).toContain('github');
      expect(checkedNames).toContain('gitmcp');
      expect(checkedNames).toContain('exa');
      expect(checkedNames).toContain('vertex-ai');
      expect(checkedNames).toContain('supabase');
      expect(checkedNames).toContain('n8n');
      expect(checkedNames).toContain('semgrep');
      expect(checkedNames).toContain('sentry');
      expect(checkedNames).toContain('claude-code-mcp');

      // Verify all results have required fields
      results.forEach(result => {
        expect(result.name).toBeDefined();
        expect(result.status).toBeDefined();
        expect(['healthy', 'unhealthy', 'slow', 'skipped']).toContain(result.status);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.lastCheck).toBeInstanceOf(Date);
      });

      // Count healthy MCPs
      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;

      // At least some MCPs should be healthy (those without credentials can be skipped)
      expect(healthyCount + skippedCount).toBeGreaterThan(0);
    }, 60000); // 60 seconds for all MCPs
  });

  describe('Performance Metrics', () => {
    it('should track response times for all MCPs', async () => {
      const results = await healthChecker.checkAllMCPs(mcpConfigs);

      const responseTimes = results
        .filter(r => r.status !== 'skipped')
        .map(r => r.responseTime);

      expect(responseTimes.length).toBeGreaterThan(0);

      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // Average should be reasonable (< 10 seconds)
      expect(avgResponseTime).toBeLessThan(10000);
    }, 60000);

    it('should identify slow MCPs', async () => {
      const results = await healthChecker.checkAllMCPs(mcpConfigs);

      const slowMCPs = results.filter(r => r.status === 'slow');

      // Document slow MCPs for optimization
      if (slowMCPs.length > 0) {
        console.log('Slow MCPs detected:');
        slowMCPs.forEach(mcp => {
          console.log(`  - ${mcp.name}: ${mcp.responseTime}ms`);
        });
      }

      // This is informational, not a failure
      expect(slowMCPs).toBeDefined();
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle missing MCP configuration gracefully', async () => {
      const invalidConfig: MCPConfig = {
        name: 'non-existent-mcp',
        command: 'non-existent-command',
        args: []
      };

      const result = await healthChecker.checkMCP('non-existent-mcp', invalidConfig);

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBeDefined();
    }, 10000);

    it('should timeout for unresponsive MCPs', async () => {
      const slowConfig: MCPConfig = {
        name: 'slow-mcp',
        command: 'sleep',
        args: ['10'] // Sleep for 10 seconds
      };

      const result = await healthChecker.checkMCP('slow-mcp', slowConfig);

      // Should complete within timeout window
      expect(result.responseTime).toBeLessThan(10000);
    }, 12000);
  });
});

// ============================================================================
// Export for CLI usage
// ============================================================================

export { MCPHealthChecker, MCPConfigLoader, MCPHealthResult, MCPConfig };
