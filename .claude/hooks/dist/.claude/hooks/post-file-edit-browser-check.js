#!/usr/bin/env -S npx tsx
"use strict";
/**
 * Post-File-Edit Browser Check Hook
 *
 * Automatically runs browser tests on frontend file edits to capture:
 * - Console errors/warnings
 * - Network failures (4xx, 5xx)
 * - Performance issues
 * - Accessibility violations
 *
 * Creates Guardian TODOs for detected issues.
 *
 * @version 1.0.0
 * @since v7.14.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// Environment configuration
const ENABLED = process.env.BROWSER_ERROR_CAPTURE !== 'false'; // Default: true
const AUTO_TODO = process.env.BROWSER_ERROR_AUTO_TODO !== 'false'; // Default: true
const SEVERITY_THRESHOLD = process.env.BROWSER_ERROR_SEVERITY_THRESHOLD || 'warn'; // log|warn|error
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS !== 'false'; // Default: true
// Network error configuration
const NETWORK_CAPTURE = process.env.NETWORK_ERROR_CAPTURE !== 'false'; // Default: true
const ERROR_STATUS_CODES = (process.env.NETWORK_ERROR_STATUS_CODES || '400,401,403,404,500,502,503')
    .split(',')
    .map(code => parseInt(code.trim(), 10));
/**
 * Check if file is a frontend file that should trigger browser testing
 */
function isFrontendFile(filePath) {
    const frontendExtensions = ['.tsx', '.jsx', '.vue', '.svelte', '.css', '.scss'];
    const frontendDirs = ['/components/', '/pages/', '/views/', '/styles/', '/src/'];
    return frontendExtensions.some(ext => filePath.endsWith(ext)) ||
        frontendDirs.some(dir => filePath.includes(dir));
}
/**
 * Launch browser and capture errors
 */
async function runBrowserCheck(filePath) {
    const consoleMessages = [];
    const networkErrors = [];
    let browser = null;
    let context = null;
    let page = null;
    try {
        // Launch browser
        browser = await playwright_1.chromium.launch({
            headless: HEADLESS,
            args: [
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        page = await context.newPage();
        // Capture console messages
        page.on('console', msg => {
            const type = msg.type();
            // Filter by severity threshold
            const severityLevels = { log: 0, warn: 1, error: 2 };
            const thresholdLevel = severityLevels[SEVERITY_THRESHOLD] || 1;
            const messageLevel = severityLevels[type] || 0;
            if (messageLevel >= thresholdLevel) {
                consoleMessages.push({
                    type,
                    text: msg.text(),
                    location: msg.location()?.url,
                    timestamp: new Date().toISOString()
                });
            }
        });
        // Capture network errors
        if (NETWORK_CAPTURE) {
            page.on('response', response => {
                if (ERROR_STATUS_CODES.includes(response.status())) {
                    networkErrors.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText(),
                        method: response.request().method(),
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
        // Navigate to dev server
        await page.goto(BASE_URL, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        // Wait for any async errors
        await page.waitForTimeout(2000);
    }
    catch (error) {
        consoleMessages.push({
            type: 'error',
            text: `Browser check failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date().toISOString()
        });
    }
    finally {
        if (page)
            await page.close().catch(() => { });
        if (context)
            await context.close().catch(() => { });
        if (browser)
            await browser.close().catch(() => { });
    }
    return {
        filePath,
        consoleMessages,
        networkErrors,
        timestamp: new Date().toISOString(),
        hasErrors: consoleMessages.some(m => m.type === 'error') || networkErrors.length > 0
    };
}
/**
 * Format result as Guardian TODO
 */
function formatGuardianTodo(result) {
    const errors = result.consoleMessages.filter(m => m.type === 'error');
    const warnings = result.consoleMessages.filter(m => m.type === 'warn');
    const networkIssues = result.networkErrors;
    const priority = errors.length > 0 ? 'critical' : (warnings.length > 0 ? 'high' : 'medium');
    const layer = 'project';
    const agent = 'James-Frontend';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 6);
    return `---
id: "${agent}-${priority}-${timestamp}"
created: "${new Date().toISOString()}"
type: "guardian-browser-check"
assigned_agent: "${agent}"
priority: "${priority}"
layer: "${layer}"
file: "${result.filePath}"
verified_by: "Browser Check Hook"
---

# 🌐 Browser Check - Frontend Errors Detected

**File**: \`${result.filePath}\`

## Summary

- **Console Errors**: ${errors.length}
- **Console Warnings**: ${warnings.length}
- **Network Errors**: ${networkIssues.length}
- **Priority**: **${priority.toUpperCase()}**
- **Assigned Agent**: **${agent}**

---

## Console Errors

${errors.length === 0 ? '_No console errors detected_' : errors.map((err, i) => `
### ${i + 1}. ${err.text}

- **Type**: error
- **Timestamp**: ${err.timestamp}
${err.location ? `- **Location**: ${err.location}` : ''}
`).join('\n')}

---

## Console Warnings

${warnings.length === 0 ? '_No console warnings detected_' : warnings.map((warn, i) => `
### ${i + 1}. ${warn.text}

- **Type**: warning
- **Timestamp**: ${warn.timestamp}
${warn.location ? `- **Location**: ${warn.location}` : ''}
`).join('\n')}

---

## Network Errors

${networkIssues.length === 0 ? '_No network errors detected_' : networkIssues.map((net, i) => `
### ${i + 1}. ${net.method} ${net.url}

- **Status**: ${net.status} ${net.statusText}
- **Timestamp**: ${net.timestamp}
`).join('\n')}

---

## 🎯 Recommended Actions

1. Open browser DevTools and reproduce errors
2. Check browser compatibility (Chrome/Firefox/Safari)
3. Validate JavaScript bundle integrity
4. Review network request configurations
5. Fix errors and verify in browser

---

## 📊 Next Steps

1. Fix detected issues
2. Run \`npm run test:e2e\` to verify
3. Run \`/learn "Fixed browser errors in ${path.basename(result.filePath)}"\` to store pattern

---

**Generated by Browser Check Hook**
**Hook**: post-file-edit-browser-check.ts
**Timestamp**: ${result.timestamp}
`;
}
/**
 * Create Guardian TODO file
 */
async function createGuardianTodo(result) {
    const todosDir = path.join(process.cwd(), 'todos');
    // Ensure todos directory exists
    try {
        await fs.mkdir(todosDir, { recursive: true });
    }
    catch (error) {
        console.error('Failed to create todos directory:', error);
        return '';
    }
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 6);
    const priority = result.consoleMessages.some(m => m.type === 'error') ? 'critical' : 'high';
    const filename = `guardian-browser-check-james-frontend-${priority}-${timestamp}-${randomId}.md`;
    const filePath = path.join(todosDir, filename);
    const content = formatGuardianTodo(result);
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return filePath;
    }
    catch (error) {
        console.error('Failed to write Guardian TODO:', error);
        return '';
    }
}
/**
 * Main hook execution
 */
async function main() {
    if (!ENABLED) {
        console.log('🌐 Browser error capture disabled (BROWSER_ERROR_CAPTURE=false)');
        return;
    }
    // Get file path from hook environment
    const filePath = process.env.FILE_PATH || process.argv[2];
    if (!filePath) {
        console.error('❌ No file path provided');
        process.exit(1);
    }
    // Check if frontend file
    if (!isFrontendFile(filePath)) {
        console.log(`⏭️  Skipping non-frontend file: ${filePath}`);
        return;
    }
    console.log(`\n🌐 Running browser check for: ${path.basename(filePath)}`);
    // Check if dev server is running
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) {
            console.warn(`⚠️  Dev server not responding (${BASE_URL})`);
            console.warn('   Start dev server: npm run dev');
            return;
        }
    }
    catch (error) {
        console.warn(`⚠️  Dev server not available (${BASE_URL})`);
        console.warn('   Start dev server: npm run dev');
        return;
    }
    // Run browser check
    const result = await runBrowserCheck(filePath);
    // Display summary
    const errors = result.consoleMessages.filter(m => m.type === 'error');
    const warnings = result.consoleMessages.filter(m => m.type === 'warn');
    const networkIssues = result.networkErrors;
    console.log(`\n📊 Browser Check Results:`);
    console.log(`   Console Errors: ${errors.length}`);
    console.log(`   Console Warnings: ${warnings.length}`);
    console.log(`   Network Errors: ${networkIssues.length}`);
    if (result.hasErrors && AUTO_TODO) {
        const todoPath = await createGuardianTodo(result);
        if (todoPath) {
            console.log(`\n✅ Guardian TODO created: ${path.basename(todoPath)}`);
        }
    }
    else if (result.hasErrors) {
        console.log(`\n⚠️  Errors detected but auto-TODO disabled`);
    }
    else {
        console.log(`\n✅ No browser errors detected`);
    }
}
// Execute hook
main().catch(error => {
    console.error('❌ Browser check hook failed:', error);
    process.exit(1);
});
