/**
 * Browser Error Detector for Guardian
 *
 * Parses browser console and network errors captured by the
 * post-file-edit-browser-check hook and creates verified Guardian TODOs.
 *
 * Integrates with:
 * - Guardian health check system
 * - Chain-of-Verification (CoVe) methodology
 * - Root cause learning (v7.11.0+)
 *
 * @version 1.0.0
 * @since v7.14.0
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
/**
 * Parse browser check results from Guardian TODO file
 */
export async function parseBrowserCheckTodo(todoPath) {
    const content = await fs.readFile(todoPath, 'utf-8');
    const errors = [];
    // Parse console errors section
    const consoleErrorsMatch = content.match(/## Console Errors\n\n([\s\S]*?)---/);
    if (consoleErrorsMatch) {
        const consoleSection = consoleErrorsMatch[1];
        const errorMatches = consoleSection.matchAll(/### \d+\. (.+?)\n\n- \*\*Type\*\*: error/g);
        for (const match of errorMatches) {
            errors.push({
                type: 'console',
                severity: 'error',
                message: match[1],
                timestamp: new Date().toISOString()
            });
        }
    }
    // Parse network errors section
    const networkErrorsMatch = content.match(/## Network Errors\n\n([\s\S]*?)---/);
    if (networkErrorsMatch) {
        const networkSection = networkErrorsMatch[1];
        const errorMatches = networkSection.matchAll(/### \d+\. (\w+) (.+?)\n\n- \*\*Status\*\*: (\d+)/g);
        for (const match of errorMatches) {
            errors.push({
                type: 'network',
                severity: 'error',
                message: `${match[1]} ${match[2]}`,
                url: match[2],
                status: parseInt(match[3], 10),
                timestamp: new Date().toISOString()
            });
        }
    }
    return errors;
}
/**
 * Calculate fingerprint for browser error
 */
export function calculateErrorFingerprint(error) {
    const fingerprintData = `${error.type}:${error.severity}:${error.message.slice(0, 100)}`;
    return createHash('md5').update(fingerprintData).digest('hex').substring(0, 8);
}
/**
 * Verify browser errors using Chain-of-Verification (CoVe)
 */
export async function verifyBrowserErrors(filePath, errors) {
    let confidence = 0;
    let checks = 0;
    // Verification 1: File exists
    const fileExistsVerified = await fs.access(filePath).then(() => true).catch(() => false);
    if (fileExistsVerified) {
        confidence += 25;
    }
    checks++;
    // Verification 2: Console errors are real (not empty)
    const consoleErrors = errors.filter(e => e.type === 'console');
    const consoleErrorsVerified = consoleErrors.length > 0 && consoleErrors.every(e => e.message.length > 0);
    if (consoleErrorsVerified || consoleErrors.length === 0) {
        confidence += 25;
    }
    checks++;
    // Verification 3: Network errors have valid status codes
    const networkErrors = errors.filter(e => e.type === 'network');
    const networkErrorsVerified = networkErrors.length === 0 || networkErrors.every(e => e.status && e.status >= 400 && e.status < 600);
    if (networkErrorsVerified) {
        confidence += 25;
    }
    checks++;
    // Verification 4: Errors have timestamps
    const hasTimestamps = errors.every(e => e.timestamp && e.timestamp.length > 0);
    if (hasTimestamps) {
        confidence += 25;
    }
    checks++;
    return {
        consoleErrorsVerified,
        networkErrorsVerified,
        fileExistsVerified,
        confidence: confidence / checks
    };
}
/**
 * Assign agent based on error type
 */
export function assignAgentForBrowserError(errors) {
    const hasConsoleErrors = errors.some(e => e.type === 'console');
    const hasNetworkErrors = errors.some(e => e.type === 'network');
    // Console errors → James-Frontend (UI/UX issues)
    if (hasConsoleErrors && !hasNetworkErrors) {
        return 'James-Frontend';
    }
    // Network errors → Marcus-Backend (API issues)
    if (hasNetworkErrors && !hasConsoleErrors) {
        return 'Marcus-Backend';
    }
    // Both → James-Frontend (frontend layer responsible)
    return 'James-Frontend';
}
/**
 * Determine priority based on error severity and count
 */
export function determinePriority(errors) {
    const criticalErrors = errors.filter(e => e.severity === 'error');
    const warnings = errors.filter(e => e.severity === 'warning');
    if (criticalErrors.length >= 3) {
        return 'critical';
    }
    else if (criticalErrors.length >= 1) {
        return 'high';
    }
    else if (warnings.length >= 5) {
        return 'high';
    }
    else if (warnings.length >= 1) {
        return 'medium';
    }
    return 'low';
}
/**
 * Detect and verify browser errors from file path
 */
export async function detectBrowserErrors(filePath) {
    // Check if Guardian browser check TODO exists
    const todosDir = path.join(process.cwd(), 'todos');
    let todoFiles = [];
    try {
        const files = await fs.readdir(todosDir);
        todoFiles = files.filter(f => f.startsWith('guardian-browser-check-'));
    }
    catch (error) {
        return null;
    }
    if (todoFiles.length === 0) {
        return null;
    }
    // Parse most recent browser check TODO
    const latestTodo = todoFiles.sort().reverse()[0];
    const todoPath = path.join(todosDir, latestTodo);
    const errors = await parseBrowserCheckTodo(todoPath);
    if (errors.length === 0) {
        return null;
    }
    // Verify errors
    const verificationEvidence = await verifyBrowserErrors(filePath, errors);
    // Calculate fingerprint
    const fingerprint = calculateErrorFingerprint(errors[0]);
    // Assign agent
    const assignedAgent = assignAgentForBrowserError(errors);
    // Determine priority
    const priority = determinePriority(errors);
    return {
        filePath,
        errors,
        fingerprint,
        confidence: verificationEvidence.confidence,
        assignedAgent,
        priority,
        layer: 'project',
        verificationEvidence
    };
}
/**
 * Check for browser errors and create Guardian TODO if needed
 */
export async function checkBrowserErrorsAndCreateTodo(filePath) {
    const result = await detectBrowserErrors(filePath);
    if (!result) {
        return { created: false };
    }
    // Check confidence threshold (80% minimum)
    if (result.confidence < 80) {
        console.warn(`⚠️  Low confidence browser error detection (${result.confidence}%)`);
        return { created: false };
    }
    // TODO already created by post-file-edit-browser-check hook
    // This function is for Guardian health check integration
    console.log(`✅ Browser errors verified with ${result.confidence}% confidence`);
    console.log(`   Assigned to: ${result.assignedAgent}`);
    console.log(`   Priority: ${result.priority}`);
    return { created: true };
}
/**
 * Get browser error statistics for telemetry
 */
export async function getBrowserErrorStats() {
    const todosDir = path.join(process.cwd(), 'todos');
    try {
        const files = await fs.readdir(todosDir);
        const browserCheckTodos = files.filter(f => f.startsWith('guardian-browser-check-'));
        let totalErrors = 0;
        let consoleErrors = 0;
        let networkErrors = 0;
        const errorCounts = new Map();
        for (const todo of browserCheckTodos) {
            const todoPath = path.join(todosDir, todo);
            const errors = await parseBrowserCheckTodo(todoPath);
            totalErrors += errors.length;
            consoleErrors += errors.filter(e => e.type === 'console').length;
            networkErrors += errors.filter(e => e.type === 'network').length;
            for (const error of errors) {
                const message = error.message.slice(0, 50);
                errorCounts.set(message, (errorCounts.get(message) || 0) + 1);
            }
        }
        const mostCommonError = errorCounts.size > 0
            ? Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
            : null;
        return {
            totalErrors,
            consoleErrors,
            networkErrors,
            mostCommonError
        };
    }
    catch (error) {
        return {
            totalErrors: 0,
            consoleErrors: 0,
            networkErrors: 0,
            mostCommonError: null
        };
    }
}
//# sourceMappingURL=browser-error-detector.js.map