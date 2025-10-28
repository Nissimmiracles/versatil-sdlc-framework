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
/**
 * Access control modes
 */
export var AccessControlMode;
(function (AccessControlMode) {
    AccessControlMode["WHITELIST_ONLY"] = "whitelist_only";
    AccessControlMode["BLACKLIST_ONLY"] = "blacklist_only";
    AccessControlMode["MIXED"] = "mixed";
})(AccessControlMode || (AccessControlMode = {}));
/**
 * IP rule type
 */
export var IPRuleType;
(function (IPRuleType) {
    IPRuleType["WHITELIST"] = "whitelist";
    IPRuleType["BLACKLIST"] = "blacklist";
})(IPRuleType || (IPRuleType = {}));
/**
 * IP Access Control
 */
export class IPAccessControl {
    constructor(options = {}) {
        this.isInitialized = false;
        this.mode = options.mode || AccessControlMode.BLACKLIST_ONLY;
        this.whitelist = new Set();
        this.blacklist = new Set();
        this.cidrRanges = new Map();
        this.cidrRanges.set(IPRuleType.WHITELIST, []);
        this.cidrRanges.set(IPRuleType.BLACKLIST, []);
        this.rules = new Map();
        this.rulesFile = options.rulesFile || path.join(process.cwd(), '.versatil', 'ip-rules.json');
        this.securityLogger = options.securityLogger;
        this.autoSave = options.autoSave !== false;
    }
    /**
     * Initialize IP access control
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        // Load rules from file if it exists
        try {
            await this.loadRules();
        }
        catch (error) {
            // File doesn't exist yet, start with empty rules
        }
        this.isInitialized = true;
    }
    /**
     * Check if an IP is allowed access
     */
    async checkAccess(ip, user) {
        await this.ensureInitialized();
        const normalizedIP = this.normalizeIP(ip);
        let result;
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
            }
            else {
                await this.securityLogger.logAccessDenied(ip, result.reason, user);
            }
        }
        return result;
    }
    /**
     * Add IP to whitelist
     */
    async addToWhitelist(ip, reason) {
        await this.ensureInitialized();
        const normalizedIP = this.normalizeIP(ip);
        if (this.isCIDR(normalizedIP)) {
            this.cidrRanges.get(IPRuleType.WHITELIST).push(normalizedIP);
        }
        else {
            this.whitelist.add(normalizedIP);
        }
        const rule = {
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
    async addToBlacklist(ip, reason) {
        await this.ensureInitialized();
        const normalizedIP = this.normalizeIP(ip);
        if (this.isCIDR(normalizedIP)) {
            this.cidrRanges.get(IPRuleType.BLACKLIST).push(normalizedIP);
        }
        else {
            this.blacklist.add(normalizedIP);
        }
        const rule = {
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
    async removeFromWhitelist(ip) {
        await this.ensureInitialized();
        const normalizedIP = this.normalizeIP(ip);
        const removed = this.whitelist.delete(normalizedIP);
        if (!removed) {
            // Check CIDR ranges
            const ranges = this.cidrRanges.get(IPRuleType.WHITELIST);
            const index = ranges.indexOf(normalizedIP);
            if (index !== -1) {
                ranges.splice(index, 1);
                this.rules.delete(normalizedIP);
                if (this.autoSave) {
                    await this.saveRules();
                }
                return true;
            }
        }
        else {
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
    async removeFromBlacklist(ip) {
        await this.ensureInitialized();
        const normalizedIP = this.normalizeIP(ip);
        const removed = this.blacklist.delete(normalizedIP);
        if (!removed) {
            // Check CIDR ranges
            const ranges = this.cidrRanges.get(IPRuleType.BLACKLIST);
            const index = ranges.indexOf(normalizedIP);
            if (index !== -1) {
                ranges.splice(index, 1);
                this.rules.delete(normalizedIP);
                if (this.autoSave) {
                    await this.saveRules();
                }
                return true;
            }
        }
        else {
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
    async clearRules() {
        await this.ensureInitialized();
        this.whitelist.clear();
        this.blacklist.clear();
        this.cidrRanges.get(IPRuleType.WHITELIST).length = 0;
        this.cidrRanges.get(IPRuleType.BLACKLIST).length = 0;
        this.rules.clear();
        if (this.autoSave) {
            await this.saveRules();
        }
    }
    /**
     * Get all rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Get access control mode
     */
    getMode() {
        return this.mode;
    }
    /**
     * Set access control mode
     */
    async setMode(mode) {
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
            whitelistCount: this.whitelist.size + this.cidrRanges.get(IPRuleType.WHITELIST).length,
            blacklistCount: this.blacklist.size + this.cidrRanges.get(IPRuleType.BLACKLIST).length,
            totalRules: this.rules.size,
        };
    }
    /**
     * Private: Ensure initialized
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }
    /**
     * Private: Check whitelist-only mode
     */
    checkWhitelistOnly(ip) {
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
    checkBlacklistOnly(ip) {
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
    checkMixed(ip) {
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
    isInWhitelist(ip) {
        if (this.whitelist.has(ip)) {
            return true;
        }
        // Check CIDR ranges
        const ranges = this.cidrRanges.get(IPRuleType.WHITELIST);
        return ranges.some(range => this.ipInCIDR(ip, range));
    }
    /**
     * Private: Check if IP is in blacklist
     */
    isInBlacklist(ip) {
        if (this.blacklist.has(ip)) {
            return true;
        }
        // Check CIDR ranges
        const ranges = this.cidrRanges.get(IPRuleType.BLACKLIST);
        return ranges.some(range => this.ipInCIDR(ip, range));
    }
    /**
     * Private: Check if IP is in CIDR range
     */
    ipInCIDR(ip, cidr) {
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
    ipToNumber(ip) {
        const parts = ip.split('.');
        return parts.reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
    }
    /**
     * Private: Check if string is CIDR notation
     */
    isCIDR(ip) {
        return ip.includes('/');
    }
    /**
     * Private: Normalize IP address
     */
    normalizeIP(ip) {
        return ip.trim();
    }
    /**
     * Private: Load rules from file
     */
    async loadRules() {
        const content = await fs.readFile(this.rulesFile, 'utf-8');
        const data = JSON.parse(content);
        this.mode = data.mode || AccessControlMode.BLACKLIST_ONLY;
        if (data.rules) {
            data.rules.forEach((rule) => {
                rule.addedAt = new Date(rule.addedAt);
                this.rules.set(rule.ip, rule);
                if (this.isCIDR(rule.ip)) {
                    this.cidrRanges.get(rule.type).push(rule.ip);
                }
                else {
                    if (rule.type === IPRuleType.WHITELIST) {
                        this.whitelist.add(rule.ip);
                    }
                    else {
                        this.blacklist.add(rule.ip);
                    }
                }
            });
        }
    }
    /**
     * Private: Save rules to file
     */
    async saveRules() {
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
export function isValidIP(ip) {
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
//# sourceMappingURL=docs-ip-access-control.js.map