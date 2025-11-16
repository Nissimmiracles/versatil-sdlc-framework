/**
 * IP-based Access Control for VERSATIL MCP Documentation Tools
 *
 * Provides IP whitelist/blacklist functionality:
 * - IP whitelist (allow-only mode)
 * - IP blacklist (block specific IPs)
 * - CIDR range support
 * - Multiple access control modes
 * - Integration with SecurityLogger
 *
 * Part of Phase 4.3: IP-based Access Control
 */

import { promises as fs } from 'fs';
import path from 'path';
import { SecurityLogger } from './docs-security-logger.js';

/**
 * Access control modes
 */
export enum AccessControlMode {
  WHITELIST_ONLY = 'whitelist_only',
  BLACKLIST_ONLY = 'blacklist_only',
  MIXED = 'mixed',
}

/**
 * IP rule type
 */
export enum IPRuleType {
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist',
}

/**
 * IP rule interface
 */
export interface IPRule {
  ip: string;
  type: IPRuleType;
  reason?: string;
  addedAt: Date;
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  matchedRule?: IPRule;
}

/**
 * IP Access Control options
 */
export interface IPAccessControlOptions {
  mode?: AccessControlMode;
  rulesFile?: string;
  securityLogger?: SecurityLogger;
  autoSave?: boolean;
}

/**
 * IP Access Control
 */
export class IPAccessControl {
  private mode: AccessControlMode;
  private whitelist: Set<string>;
  private blacklist: Set<string>;
  private cidrRanges: Map<IPRuleType, string[]>;
  private rules: Map<string, IPRule>;
  private rulesFile: string;
  private securityLogger?: SecurityLogger;
  private autoSave: boolean;
  private isInitialized: boolean = false;

  constructor(options: IPAccessControlOptions = {}) {
    this.mode = options.mode || AccessControlMode.BLACKLIST_ONLY;
    this.whitelist = new Set();
    this.blacklist = new Set();
    this.cidrRanges = new Map();
    this.cidrRanges.set(IPRuleType.WHITELIST, []);
    this.cidrRanges.set(IPRuleType.BLACKLIST, []);
    this.rules = new Map();
    this.rulesFile = options.rulesFile || path.join(
      process.cwd(),
      '.versatil',
      'ip-rules.json'
    );
    this.securityLogger = options.securityLogger;
    this.autoSave = options.autoSave !== false;
  }

  /**
   * Initialize IP access control
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load rules from file if it exists
    try {
      await this.loadRules();
    } catch (error) {
      // File doesn't exist yet, start with empty rules
    }

    this.isInitialized = true;
  }

  /**
   * Check if an IP is allowed access
   */
  async checkAccess(ip: string, user?: string): Promise<AccessCheckResult> {
    await this.ensureInitialized();

    const normalizedIP = this.normalizeIP(ip);
    let result: AccessCheckResult;

    switch (this.mode) {
      case AccessControlMode.WHITELIST_ONLY:
        result = this.checkWhitelistOnly(normalizedIP);
        break;

      case AccessControlMode.BLACKLIST_ONLY:
        result = this.checkBlacklistOnly(normalizedIP);
        break;

      case AccessControlMode.MIXED:
        result = this.checkMixed(normalizedIP);
        break;

      default:
        result = {
          allowed: true,
          reason: 'No access control configured',
        };
    }

    // Log access decision
    if (this.securityLogger) {
      if (result.allowed) {
        await this.securityLogger.logAccessGranted(ip, user);
      } else {
        await this.securityLogger.logAccessDenied(ip, result.reason, user);
      }
    }

    return result;
  }

  /**
   * Add IP to whitelist
   */
  async addToWhitelist(ip: string, reason?: string): Promise<void> {
    await this.ensureInitialized();

    const normalizedIP = this.normalizeIP(ip);

    if (this.isCIDR(normalizedIP)) {
      this.cidrRanges.get(IPRuleType.WHITELIST)!.push(normalizedIP);
    } else {
      this.whitelist.add(normalizedIP);
    }

    const rule: IPRule = {
      ip: normalizedIP,
      type: IPRuleType.WHITELIST,
      reason,
      addedAt: new Date(),
    };

    this.rules.set(normalizedIP, rule);

    if (this.autoSave) {
      await this.saveRules();
    }
  }

  /**
   * Add IP to blacklist
   */
  async addToBlacklist(ip: string, reason?: string): Promise<void> {
    await this.ensureInitialized();

    const normalizedIP = this.normalizeIP(ip);

    if (this.isCIDR(normalizedIP)) {
      this.cidrRanges.get(IPRuleType.BLACKLIST)!.push(normalizedIP);
    } else {
      this.blacklist.add(normalizedIP);
    }

    const rule: IPRule = {
      ip: normalizedIP,
      type: IPRuleType.BLACKLIST,
      reason,
      addedAt: new Date(),
    };

    this.rules.set(normalizedIP, rule);

    if (this.autoSave) {
      await this.saveRules();
    }
  }

  /**
   * Remove IP from whitelist
   */
  async removeFromWhitelist(ip: string): Promise<boolean> {
    await this.ensureInitialized();

    const normalizedIP = this.normalizeIP(ip);
    const removed = this.whitelist.delete(normalizedIP);

    if (!removed) {
      // Check CIDR ranges
      const ranges = this.cidrRanges.get(IPRuleType.WHITELIST)!;
      const index = ranges.indexOf(normalizedIP);
      if (index !== -1) {
        ranges.splice(index, 1);
        this.rules.delete(normalizedIP);
        if (this.autoSave) {
          await this.saveRules();
        }
        return true;
      }
    } else {
      this.rules.delete(normalizedIP);
      if (this.autoSave) {
        await this.saveRules();
      }
    }

    return removed;
  }

  /**
   * Remove IP from blacklist
   */
  async removeFromBlacklist(ip: string): Promise<boolean> {
    await this.ensureInitialized();

    const normalizedIP = this.normalizeIP(ip);
    const removed = this.blacklist.delete(normalizedIP);

    if (!removed) {
      // Check CIDR ranges
      const ranges = this.cidrRanges.get(IPRuleType.BLACKLIST)!;
      const index = ranges.indexOf(normalizedIP);
      if (index !== -1) {
        ranges.splice(index, 1);
        this.rules.delete(normalizedIP);
        if (this.autoSave) {
          await this.saveRules();
        }
        return true;
      }
    } else {
      this.rules.delete(normalizedIP);
      if (this.autoSave) {
        await this.saveRules();
      }
    }

    return removed;
  }

  /**
   * Clear all rules
   */
  async clearRules(): Promise<void> {
    await this.ensureInitialized();

    this.whitelist.clear();
    this.blacklist.clear();
    this.cidrRanges.get(IPRuleType.WHITELIST)!.length = 0;
    this.cidrRanges.get(IPRuleType.BLACKLIST)!.length = 0;
    this.rules.clear();

    if (this.autoSave) {
      await this.saveRules();
    }
  }

  /**
   * Get all rules
   */
  getRules(): IPRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get access control mode
   */
  getMode(): AccessControlMode {
    return this.mode;
  }

  /**
   * Set access control mode
   */
  async setMode(mode: AccessControlMode): Promise<void> {
    this.mode = mode;
    if (this.autoSave) {
      await this.saveRules();
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      mode: this.mode,
      whitelistCount: this.whitelist.size + this.cidrRanges.get(IPRuleType.WHITELIST)!.length,
      blacklistCount: this.blacklist.size + this.cidrRanges.get(IPRuleType.BLACKLIST)!.length,
      totalRules: this.rules.size,
    };
  }

  /**
   * Private: Ensure initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Private: Check whitelist-only mode
   */
  private checkWhitelistOnly(ip: string): AccessCheckResult {
    if (this.isInWhitelist(ip)) {
      return {
        allowed: true,
        reason: 'IP is whitelisted',
        matchedRule: this.rules.get(ip),
      };
    }

    return {
      allowed: false,
      reason: 'IP not in whitelist',
    };
  }

  /**
   * Private: Check blacklist-only mode
   */
  private checkBlacklistOnly(ip: string): AccessCheckResult {
    if (this.isInBlacklist(ip)) {
      return {
        allowed: false,
        reason: 'IP is blacklisted',
        matchedRule: this.rules.get(ip),
      };
    }

    return {
      allowed: true,
      reason: 'IP not in blacklist',
    };
  }

  /**
   * Private: Check mixed mode
   */
  private checkMixed(ip: string): AccessCheckResult {
    // Whitelist has priority
    if (this.isInWhitelist(ip)) {
      return {
        allowed: true,
        reason: 'IP is whitelisted',
        matchedRule: this.rules.get(ip),
      };
    }

    // Then check blacklist
    if (this.isInBlacklist(ip)) {
      return {
        allowed: false,
        reason: 'IP is blacklisted',
        matchedRule: this.rules.get(ip),
      };
    }

    // Default deny in mixed mode
    return {
      allowed: false,
      reason: 'IP not in whitelist (mixed mode)',
    };
  }

  /**
   * Private: Check if IP is in whitelist
   */
  private isInWhitelist(ip: string): boolean {
    if (this.whitelist.has(ip)) {
      return true;
    }

    // Check CIDR ranges
    const ranges = this.cidrRanges.get(IPRuleType.WHITELIST)!;
    return ranges.some(range => this.ipInCIDR(ip, range));
  }

  /**
   * Private: Check if IP is in blacklist
   */
  private isInBlacklist(ip: string): boolean {
    if (this.blacklist.has(ip)) {
      return true;
    }

    // Check CIDR ranges
    const ranges = this.cidrRanges.get(IPRuleType.BLACKLIST)!;
    return ranges.some(range => this.ipInCIDR(ip, range));
  }

  /**
   * Private: Check if IP is in CIDR range
   */
  private ipInCIDR(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    const mask = bits ? parseInt(bits, 10) : 32;

    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);
    const maskNum = -1 << (32 - mask);

    return (ipNum & maskNum) === (rangeNum & maskNum);
  }

  /**
   * Private: Convert IP to number
   */
  private ipToNumber(ip: string): number {
    const parts = ip.split('.');
    return parts.reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
  }

  /**
   * Private: Check if string is CIDR notation
   */
  private isCIDR(ip: string): boolean {
    return ip.includes('/');
  }

  /**
   * Private: Normalize IP address
   */
  private normalizeIP(ip: string): string {
    return ip.trim();
  }

  /**
   * Private: Load rules from file
   */
  private async loadRules(): Promise<void> {
    const content = await fs.readFile(this.rulesFile, 'utf-8');
    const data = JSON.parse(content);

    this.mode = data.mode || AccessControlMode.BLACKLIST_ONLY;

    if (data.rules) {
      data.rules.forEach((rule: any) => {
        rule.addedAt = new Date(rule.addedAt);
        this.rules.set(rule.ip, rule);

        if (this.isCIDR(rule.ip)) {
          this.cidrRanges.get(rule.type)!.push(rule.ip);
        } else {
          if (rule.type === IPRuleType.WHITELIST) {
            this.whitelist.add(rule.ip);
          } else {
            this.blacklist.add(rule.ip);
          }
        }
      });
    }
  }

  /**
   * Private: Save rules to file
   */
  private async saveRules(): Promise<void> {
    const data = {
      mode: this.mode,
      rules: Array.from(this.rules.values()),
    };

    const dir = path.dirname(this.rulesFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.rulesFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}

/**
 * Helper to validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

  if (!ipv4Regex.test(ip)) {
    return false;
  }

  const [address] = ip.split('/');
  const parts = address.split('.');

  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}
