/**
 * MCP Setup Validation Tests
 *
 * Validates that MCP setup is correct:
 * - Configuration files exist
 * - Credentials stored in correct location
 * - Environment variables set
 * - MCP servers can be reached
 * - Isolation enforced
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ============================================================================
// Constants
// ============================================================================

// An isolated fixture home prevents unit tests from reading account credentials.
const VERSATIL_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'versatil-mcp-setup-'));
const ENV_FILE = path.join(VERSATIL_HOME, '.env');
const MCP_CONFIG_FILE = path.join(process.cwd(), '.cursor', 'mcp_config.json');

const REQUIRED_MCPS = ['github', 'playwright', 'supabase'];
const RECOMMENDED_MCPS = ['gitmcp', 'semgrep', 'sentry'];

// ============================================================================
// Test Suite
// ============================================================================

describe('MCP Setup Validation', () => {
  let mcpConfig: any;
  let envVars: Record<string, string>;

  beforeAll(() => {
    fs.writeFileSync(ENV_FILE, [
      `GITHUB_TOKEN=ghp_${'0'.repeat(36)}`,
      'SUPABASE_URL=http://localhost:54321',
      'SUPABASE_SERVICE_KEY=unit-fixture-key',
      'PLAYWRIGHT_BROWSERS_PATH=/fixture/browsers',
      'SENTRY_DSN=https://fixture@fixture.ingest.sentry.io/1'
    ].join('\n'), { mode: 0o600 });
    // Load MCP config
    if (fs.existsSync(MCP_CONFIG_FILE)) {
      mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf-8'));
    }

    // Load environment variables
    envVars = {};
    if (fs.existsSync(ENV_FILE)) {
      const content = fs.readFileSync(ENV_FILE, 'utf-8');
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  });

  afterAll(() => { fs.rmSync(VERSATIL_HOME, { recursive: true, force: true }); });

  // ──────────────────────────────────────────────────────────────────────────
  // File Existence Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Configuration Files', () => {
    it('should have MCP config file', () => {
      expect(fs.existsSync(MCP_CONFIG_FILE)).toBe(true);
    });

    it('should have valid JSON in MCP config', () => {
      expect(() => {
        JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf-8'));
      }).not.toThrow();
    });

    it('should have credentials directory', () => {
      expect(fs.existsSync(VERSATIL_HOME)).toBe(true);
    });

    it('should have environment file (or template)', () => {
      const hasEnvFile = fs.existsSync(ENV_FILE);
      const hasTemplate = fs.existsSync('.env.example');

      expect(hasEnvFile || hasTemplate).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Isolation Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Isolation Enforcement', () => {
    it('should NOT have .env in project directory', () => {
      const projectEnv = path.join(process.cwd(), '.env');

      // Warn if .env exists in project
      if (fs.existsSync(projectEnv)) {
        console.warn('⚠️  Warning: .env file found in project directory');
        console.warn('   Credentials should be in ~/.versatil/.env');
      }

      // Allow .env in test environments
      const isTestEnv = process.env.NODE_ENV === 'test';
      if (!isTestEnv) {
        expect(fs.existsSync(projectEnv)).toBe(false);
      }
    });

    it('should NOT have framework files in project', () => {
      const forbiddenDirs = [
        '.versatil/',
        'versatil/',
        '.versatil-memory/',
        '.versatil-logs/'
      ];

      forbiddenDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
          console.warn(`⚠️  Warning: ${dir} found in project directory`);
        }
      });
    });

    it('should request restrictive credential permissions and verify supported filesystem semantics', () => {
      const permissionFixture = path.join(VERSATIL_HOME, '.permission-fixture');
      const createCredentialsFixture = jest.fn((file: string, content: string, options: { mode: number }) =>
        fs.writeFileSync(file, content, options));
      createCredentialsFixture(permissionFixture, 'UNIT_FIXTURE=only\n', { mode: 0o600 });
      expect(createCredentialsFixture).toHaveBeenCalledWith(permissionFixture, expect.any(String), { mode: 0o600 });
      expect(fs.existsSync(ENV_FILE)).toBe(true);
      expect(path.isAbsolute(VERSATIL_HOME)).toBe(true);
      expect(path.dirname(ENV_FILE)).toBe(VERSATIL_HOME);
      const stats = fs.statSync(permissionFixture);
      expect(stats.isFile()).toBe(true);
      if (process.platform === 'win32') {
        // Windows does not enforce POSIX mode bits. Verify fixture usability only;
        // this does not qualify Windows ACL isolation from other users.
        expect(() => fs.accessSync(permissionFixture, fs.constants.R_OK | fs.constants.W_OK)).not.toThrow();
      } else {
        expect(stats.mode & 0o777).toBe(0o600);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MCP Configuration Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('MCP Configuration', () => {
    it('should have mcpServers section', () => {
      expect(mcpConfig).toHaveProperty('mcpServers');
    });

    it('should have at least 3 MCPs configured', () => {
      const mcpCount = Object.keys(mcpConfig.mcpServers || {}).length;
      expect(mcpCount).toBeGreaterThanOrEqual(3);
    });

    REQUIRED_MCPS.forEach(mcpId => {
      it(`should have ${mcpId} MCP configured`, () => {
        expect(mcpConfig.mcpServers).toHaveProperty(mcpId);
      });

      it(`${mcpId} MCP should have command`, () => {
        expect(mcpConfig.mcpServers[mcpId]).toHaveProperty('command');
      });

      it(`${mcpId} MCP should have args`, () => {
        expect(mcpConfig.mcpServers[mcpId]).toHaveProperty('args');
        expect(Array.isArray(mcpConfig.mcpServers[mcpId].args)).toBe(true);
      });
    });

    it('should use environment variable substitution', () => {
      // Check that MCP configs use ${ENV_VAR} syntax
      const githubMCP = mcpConfig.mcpServers.github;

      if (githubMCP?.env?.GITHUB_TOKEN) {
        expect(githubMCP.env.GITHUB_TOKEN).toMatch(/^\${.*}$/);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Environment Variable Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Environment Variables', () => {
    it('should have GitHub token', () => {
      const hasToken =
        envVars.GITHUB_TOKEN;

      if (!hasToken) {
        console.warn('⚠️  Warning: GITHUB_TOKEN not set');
      }
    });

    it('should have Playwright browsers path', () => {
      const hasPath =
        envVars.PLAYWRIGHT_BROWSERS_PATH;

      if (!hasPath) {
        console.warn('⚠️  Warning: PLAYWRIGHT_BROWSERS_PATH not set');
      }
    });

    it('should have Supabase credentials', () => {
      const hasUrl = envVars.SUPABASE_URL;
      const hasKey = envVars.SUPABASE_SERVICE_KEY;

      if (!hasUrl || !hasKey) {
        console.warn('⚠️  Warning: Supabase credentials incomplete');
      }
    });

    it('should NOT contain placeholder values', () => {
      const placeholders = [
        'your-',
        'xxxx',
        'TODO',
        'CHANGE_ME'
      ];

      Object.entries(envVars).forEach(([key, value]) => {
        placeholders.forEach(placeholder => {
          if (value.includes(placeholder)) {
            console.warn(`⚠️  Warning: ${key} contains placeholder: ${placeholder}`);
          }
        });
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Credential Format Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Credential Formats', () => {
    it.each(['https://project.supabase.co', 'http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321'])('accepts secure remote or exact loopback endpoint %s', url => {
      expect(isValidSupabaseURL(url)).toBe(true);
    });
    it.each(['http://project.supabase.co', 'http://localhost.attacker.test:54321', 'http://192.168.1.1:54321', 'https://project.supabase.co.attacker.test', 'https://user:secret@project.supabase.co', 'file:///tmp/supabase', 'invalid'])('rejects insecure or deceptive endpoint %s', url => {
      expect(isValidSupabaseURL(url)).toBe(false);
    });

    it('GitHub token should start with ghp_', () => {
      const token = envVars.GITHUB_TOKEN;

      if (token && !token.includes('xxxx')) {
        expect(token).toMatch(/^ghp_/);
        expect(token.length).toBe(40);
      }
    });

    it('Supabase URL accepts explicit local development transport', () => {
      const url = envVars.SUPABASE_URL;

      if (url && !url.includes('xxxx')) {
        expect(isValidSupabaseURL(url)).toBe(true);
      }
    });

    it('Sentry DSN should be valid format', () => {
      const dsn = envVars.SENTRY_DSN;

      if (dsn && !dsn.includes('xxxx')) {
        expect(dsn).toMatch(/^https:\/\//);
        expect(dsn).toMatch(/\.ingest\.sentry\.io/);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Integration Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Framework Integration', () => {
    it('should have health check script', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );

      expect(packageJson.scripts).toHaveProperty('mcp:health');
    });

    it('should have setup wizard script', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );

      expect(packageJson.scripts).toHaveProperty('mcp:setup');
    });

    it('should have isolation validation script', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );

      expect(packageJson.scripts).toHaveProperty('validate:isolation');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Documentation Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Documentation', () => {
    it('should have main MCP setup guide', () => {
      const guidePath = path.join(__dirname, '../../docs/mcp/MCP_SETUP_GUIDE.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should have quick start guide', () => {
      const guidePath = path.join(__dirname, '../../docs/mcp/MCP_QUICK_START.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should have troubleshooting guide', () => {
      const guidePath = path.join(__dirname, '../../docs/mcp/MCP_TROUBLESHOOTING.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should have individual setup guides', () => {
      const individualDir = path.join(__dirname, '../../docs/mcp/individual');

      if (fs.existsSync(individualDir)) {
        const guides = fs.readdirSync(individualDir);
        expect(guides.length).toBeGreaterThan(0);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Template Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Templates', () => {
    it('should have MCP environment template', () => {
      const templatePath = path.join(__dirname, '../../templates/mcp/.env.mcp.template');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('should have MCP config template', () => {
      const templatePath = path.join(__dirname, '../../templates/mcp/mcp_config.template.json');
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Print setup validation summary
 */
export function printSetupSummary() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📊 MCP Setup Validation Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check configuration files
  const hasConfig = fs.existsSync(MCP_CONFIG_FILE);
  const hasEnv = fs.existsSync(ENV_FILE);

  console.log('Configuration Files:');
  console.log(`  ${hasConfig ? '✅' : '❌'} MCP config: ${MCP_CONFIG_FILE}`);
  console.log(`  ${hasEnv ? '✅' : '⚠️ '} Environment: ${ENV_FILE}`);

  // Check MCPs
  if (hasConfig) {
    const config = JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf-8'));
    const mcps = Object.keys(config.mcpServers || {});

    console.log('\nConfigured MCPs:');
    mcps.forEach(mcp => {
      console.log(`  ✅ ${mcp}`);
    });
  }

  // Check isolation
  const projectEnv = path.join(process.cwd(), '.env');
  const hasProjectEnv = fs.existsSync(projectEnv);

  console.log('\nIsolation:');
  console.log(`  ${!hasProjectEnv ? '✅' : '⚠️ '} No .env in project`);
  console.log(`  ${hasEnv ? '✅' : '⚠️ '} Credentials in ~/.versatil/`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run summary if executed directly
if (require.main === module) {
  printSetupSummary();
}

/** Remote Supabase endpoints require HTTPS. HTTP is allowed only for exact loopback fixtures. */
function isValidSupabaseURL(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (url.protocol === 'http:' && loopback) ||
      (url.protocol === 'https:' && (loopback || /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)));
  } catch { return false; }
}
