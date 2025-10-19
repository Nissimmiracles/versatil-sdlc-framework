/**
 * Tests for VERSATIL MCP Documentation IP Access Control
 * Phase 4.3: IP-based Access Control
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  IPAccessControl,
  AccessControlMode,
  IPRuleType,
  isValidIP,
} from '../../src/mcp/docs-ip-access-control.js';
import { SecurityLogger } from '../../src/mcp/docs-security-logger.js';

describe('IPAccessControl', () => {
  let accessControl: IPAccessControl;
  let testRulesFile: string;

  beforeEach(async () => {
    testRulesFile = path.join(
      process.cwd(),
      '.versatil',
      'test-ip-rules.json'
    );

    accessControl = new IPAccessControl({
      rulesFile: testRulesFile,
      autoSave: false, // Disable auto-save for faster tests
    });

    await accessControl.initialize();
  });

  afterEach(async () => {
    // Clean up test rules file
    try {
      await fs.unlink(testRulesFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('whitelist mode', () => {
    beforeEach(async () => {
      await accessControl.setMode(AccessControlMode.WHITELIST_ONLY);
    });

    it('should allow whitelisted IPs', async () => {
      await accessControl.addToWhitelist('192.168.1.100', 'Test IP');

      const result = await accessControl.checkAccess('192.168.1.100');

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('whitelisted');
    });

    it('should block non-whitelisted IPs', async () => {
      await accessControl.addToWhitelist('192.168.1.100');

      const result = await accessControl.checkAccess('192.168.1.101');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in whitelist');
    });
  });

  describe('blacklist mode', () => {
    beforeEach(async () => {
      await accessControl.setMode(AccessControlMode.BLACKLIST_ONLY);
    });

    it('should block blacklisted IPs', async () => {
      await accessControl.addToBlacklist('10.0.0.1', 'Suspicious activity');

      const result = await accessControl.checkAccess('10.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blacklisted');
    });

    it('should allow non-blacklisted IPs', async () => {
      await accessControl.addToBlacklist('10.0.0.1');

      const result = await accessControl.checkAccess('10.0.0.2');

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('not in blacklist');
    });
  });

  describe('CIDR range support', () => {
    it('should match IPs in CIDR range', async () => {
      await accessControl.setMode(AccessControlMode.WHITELIST_ONLY);
      await accessControl.addToWhitelist('192.168.1.0/24', 'Office network');

      const result1 = await accessControl.checkAccess('192.168.1.1');
      const result2 = await accessControl.checkAccess('192.168.1.100');
      const result3 = await accessControl.checkAccess('192.168.1.255');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should reject IPs outside CIDR range', async () => {
      await accessControl.setMode(AccessControlMode.WHITELIST_ONLY);
      await accessControl.addToWhitelist('192.168.1.0/24');

      const result1 = await accessControl.checkAccess('192.168.2.1');
      const result2 = await accessControl.checkAccess('10.0.0.1');

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(false);
    });
  });

  describe('mixed mode', () => {
    beforeEach(async () => {
      await accessControl.setMode(AccessControlMode.MIXED);
    });

    it('should prioritize whitelist over blacklist', async () => {
      await accessControl.addToWhitelist('192.168.1.100');
      await accessControl.addToBlacklist('192.168.1.100'); // Also blacklisted

      const result = await accessControl.checkAccess('192.168.1.100');

      // Whitelist has priority
      expect(result.allowed).toBe(true);
    });

    it('should block blacklisted IPs not in whitelist', async () => {
      await accessControl.addToWhitelist('192.168.1.100');
      await accessControl.addToBlacklist('192.168.1.101');

      const result = await accessControl.checkAccess('192.168.1.101');

      expect(result.allowed).toBe(false);
    });

    it('should default deny in mixed mode', async () => {
      await accessControl.addToWhitelist('192.168.1.100');

      const result = await accessControl.checkAccess('192.168.1.200');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in whitelist');
    });
  });

  describe('rule management', () => {
    it('should add and remove whitelist rules', async () => {
      await accessControl.addToWhitelist('192.168.1.100');

      expect(accessControl.getStatistics().whitelistCount).toBe(1);

      const removed = await accessControl.removeFromWhitelist('192.168.1.100');

      expect(removed).toBe(true);
      expect(accessControl.getStatistics().whitelistCount).toBe(0);
    });

    it('should add and remove blacklist rules', async () => {
      await accessControl.addToBlacklist('10.0.0.1');

      expect(accessControl.getStatistics().blacklistCount).toBe(1);

      const removed = await accessControl.removeFromBlacklist('10.0.0.1');

      expect(removed).toBe(true);
      expect(accessControl.getStatistics().blacklistCount).toBe(0);
    });

    it('should clear all rules', async () => {
      await accessControl.addToWhitelist('192.168.1.100');
      await accessControl.addToBlacklist('10.0.0.1');

      expect(accessControl.getStatistics().totalRules).toBe(2);

      await accessControl.clearRules();

      expect(accessControl.getStatistics().totalRules).toBe(0);
      expect(accessControl.getStatistics().whitelistCount).toBe(0);
      expect(accessControl.getStatistics().blacklistCount).toBe(0);
    });

    it('should get all rules', async () => {
      await accessControl.addToWhitelist('192.168.1.100', 'Office IP');
      await accessControl.addToBlacklist('10.0.0.1', 'Blocked attacker');

      const rules = accessControl.getRules();

      expect(rules).toHaveLength(2);
      expect(rules[0]).toHaveProperty('ip');
      expect(rules[0]).toHaveProperty('type');
      expect(rules[0]).toHaveProperty('reason');
      expect(rules[0]).toHaveProperty('addedAt');
    });
  });

  describe('security logger integration', () => {
    it('should log access decisions', async () => {
      const logger = new SecurityLogger({
        logDir: path.join(process.cwd(), '.versatil', 'test-security-logs-ip'),
      });

      await logger.initialize();

      const accessControlWithLogger = new IPAccessControl({
        rulesFile: testRulesFile,
        securityLogger: logger,
        mode: AccessControlMode.WHITELIST_ONLY,
      });

      await accessControlWithLogger.initialize();
      await accessControlWithLogger.addToWhitelist('192.168.1.100');

      // Allowed access
      await accessControlWithLogger.checkAccess('192.168.1.100', 'user123');

      // Denied access
      await accessControlWithLogger.checkAccess('10.0.0.1', 'attacker');

      const logs = await logger.queryLogs();

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some(log => log.details.path === '192.168.1.100')).toBe(true);
      expect(logs.some(log => log.details.path === '10.0.0.1')).toBe(true);

      await logger.clearLogs();
    });
  });

  describe('statistics', () => {
    it('should provide accurate statistics', async () => {
      await accessControl.addToWhitelist('192.168.1.100');
      await accessControl.addToWhitelist('192.168.1.0/24');
      await accessControl.addToBlacklist('10.0.0.1');

      const stats = accessControl.getStatistics();

      expect(stats.whitelistCount).toBe(2);
      expect(stats.blacklistCount).toBe(1);
      expect(stats.totalRules).toBe(3);
      expect(stats.mode).toBe(AccessControlMode.BLACKLIST_ONLY); // Default
    });
  });

  describe('persistence', () => {
    it('should save and load rules', async () => {
      const ac1 = new IPAccessControl({
        rulesFile: testRulesFile,
        autoSave: true,
      });

      await ac1.initialize();
      await ac1.addToWhitelist('192.168.1.100', 'Test IP');
      await ac1.setMode(AccessControlMode.WHITELIST_ONLY);

      // Create new instance and load rules
      const ac2 = new IPAccessControl({
        rulesFile: testRulesFile,
      });

      await ac2.initialize();

      expect(ac2.getStatistics().whitelistCount).toBe(1);
      expect(ac2.getMode()).toBe(AccessControlMode.WHITELIST_ONLY);

      const result = await ac2.checkAccess('192.168.1.100');
      expect(result.allowed).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  describe('isValidIP', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('10.0.0.1')).toBe(true);
      expect(isValidIP('255.255.255.255')).toBe(true);
      expect(isValidIP('0.0.0.0')).toBe(true);
    });

    it('should validate CIDR notation', () => {
      expect(isValidIP('192.168.1.0/24')).toBe(true);
      expect(isValidIP('10.0.0.0/8')).toBe(true);
      expect(isValidIP('172.16.0.0/12')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('192.168.1.1.1')).toBe(false);
      expect(isValidIP('abc.def.ghi.jkl')).toBe(false);
      expect(isValidIP('not-an-ip')).toBe(false);
    });
  });
});
