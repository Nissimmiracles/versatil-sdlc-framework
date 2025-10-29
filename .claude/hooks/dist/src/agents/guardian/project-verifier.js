"use strict";
/**
 * VERSATIL SDLC Framework - Project Layer Verifier
 *
 * Verifies issues in the Project Layer (application code):
 * - Test coverage (≥80% per Maria-QA standards)
 * - Security vulnerabilities (npm audit, Semgrep)
 * - Code quality (ESLint, Prettier)
 * - Dependencies (outdated packages, CVEs)
 * - Accessibility (WCAG 2.1 AA for frontend)
 * - Performance (bundle size, API response times)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProjectIssue = verifyProjectIssue;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Verify project layer issue using ground truth methods
 */
async function verifyProjectIssue(issue, workingDir) {
    const verifications = [];
    // Extract claims from issue description
    const claims = extractClaims(issue);
    for (const claim of claims) {
        // Test coverage verification
        if (claim.type === 'test-coverage') {
            verifications.push(await verifyTestCoverage(claim, workingDir));
        }
        else if (claim.type === 'test-failure') {
            verifications.push(await verifyTestFailure(claim, workingDir));
        }
        // Security verification
        else if (claim.type === 'security-vulnerability') {
            verifications.push(await verifySecurityVulnerability(claim, workingDir));
        }
        // Code quality verification
        else if (claim.type === 'code-quality') {
            verifications.push(await verifyCodeQuality(claim, workingDir));
        }
        // Dependency verification
        else if (claim.type === 'outdated-dependency') {
            verifications.push(await verifyOutdatedDependencies(claim, workingDir));
        }
        // Accessibility verification
        else if (claim.type === 'accessibility') {
            verifications.push(await verifyAccessibility(claim, workingDir));
        }
        // Performance verification
        else if (claim.type === 'performance') {
            verifications.push(await verifyPerformance(claim, workingDir));
        }
    }
    // Calculate overall confidence
    const avgConfidence = verifications.length > 0
        ? Math.round(verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length)
        : 0;
    // Determine if issue is verified
    const verified = verifications.length > 0 && verifications.every(v => v.verified);
    return {
        issue_id: issue.id || `project-${Date.now()}`,
        layer: 'project',
        verified,
        confidence: avgConfidence,
        verifications,
        recommended_fix: verified ? generateProjectFix(issue, verifications) : undefined
    };
}
/**
 * Extract verifiable claims from issue
 */
function extractClaims(issue) {
    const claims = [];
    const desc = issue.description.toLowerCase();
    const component = issue.component.toLowerCase();
    // Test coverage
    if (desc.includes('coverage') && desc.includes('below')) {
        const percentMatch = desc.match(/(\d+)%/);
        claims.push({
            type: 'test-coverage',
            description: issue.description,
            threshold: percentMatch ? parseInt(percentMatch[1]) : 80
        });
    }
    // Test failures
    if (desc.includes('test') && (desc.includes('fail') || desc.includes('error'))) {
        const fileMatch = desc.match(/(\S+\.test\.\w+)/);
        claims.push({
            type: 'test-failure',
            description: issue.description,
            file: fileMatch?.[1]
        });
    }
    // Security vulnerabilities
    if (desc.includes('vulnerabilit') || desc.includes('cve')) {
        claims.push({
            type: 'security-vulnerability',
            description: issue.description
        });
    }
    // Code quality
    if (desc.includes('eslint') || desc.includes('lint') || desc.includes('quality')) {
        claims.push({
            type: 'code-quality',
            description: issue.description
        });
    }
    // Outdated dependencies
    if (desc.includes('outdated') || desc.includes('dependency')) {
        claims.push({
            type: 'outdated-dependency',
            description: issue.description
        });
    }
    // Accessibility
    if (desc.includes('accessibilit') || desc.includes('wcag') || desc.includes('aria')) {
        claims.push({
            type: 'accessibility',
            description: issue.description
        });
    }
    // Performance
    if (desc.includes('performance') || desc.includes('slow') || desc.includes('bundle')) {
        claims.push({
            type: 'performance',
            description: issue.description
        });
    }
    return claims;
}
/**
 * Verify test coverage claim
 */
async function verifyTestCoverage(claim, workingDir) {
    try {
        // Check if test:coverage script exists
        const packageJsonPath = (0, path_1.join)(workingDir, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            return {
                claim: 'Test coverage below threshold',
                verified: false,
                method: 'package.json check',
                confidence: 100,
                evidence: {
                    error_details: 'No package.json found'
                }
            };
        }
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
        if (!packageJson.scripts?.['test:coverage']) {
            return {
                claim: 'Test coverage below threshold',
                verified: false,
                method: 'package.json check',
                confidence: 70,
                evidence: {
                    error_details: 'No test:coverage script defined'
                }
            };
        }
        // Run coverage and parse JSON output
        const output = (0, child_process_1.execSync)('npm run test:coverage -- --json --outputFile=coverage-summary.json', {
            cwd: workingDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const coveragePath = (0, path_1.join)(workingDir, 'coverage', 'coverage-summary.json');
        if (!(0, fs_1.existsSync)(coveragePath)) {
            return {
                claim: 'Test coverage below threshold',
                verified: false,
                method: 'exec(npm run test:coverage)',
                confidence: 60,
                evidence: {
                    error_details: 'Coverage report not generated'
                }
            };
        }
        const coverageData = JSON.parse((0, fs_1.readFileSync)(coveragePath, 'utf-8'));
        const totalCoverage = coverageData.total?.lines?.pct || 0;
        const threshold = claim.threshold || 80;
        const isBelowThreshold = totalCoverage < threshold;
        return {
            claim: `Test coverage below ${threshold}%`,
            verified: isBelowThreshold,
            method: 'exec(npm run test:coverage) + JSON parse',
            confidence: 100,
            evidence: {
                command: 'npm run test:coverage',
                exit_code: 0,
                metrics: {
                    total_coverage: totalCoverage,
                    threshold,
                    below_threshold: isBelowThreshold
                }
            }
        };
    }
    catch (error) {
        return {
            claim: 'Test coverage below threshold',
            verified: false,
            method: 'exec(npm run test:coverage)',
            confidence: 50,
            evidence: {
                command: 'npm run test:coverage',
                exit_code: error.status || 1,
                error_details: error.message
            }
        };
    }
}
/**
 * Verify test failure claim
 */
async function verifyTestFailure(claim, workingDir) {
    try {
        const testCommand = claim.file
            ? `npm test -- ${claim.file}`
            : 'npm test';
        const output = (0, child_process_1.execSync)(testCommand, {
            cwd: workingDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        // Tests passed
        return {
            claim: `Test failure in ${claim.file || 'test suite'}`,
            verified: false,
            method: 'exec(npm test)',
            confidence: 100,
            evidence: {
                command: testCommand,
                exit_code: 0,
                output: output.slice(-500)
            }
        };
    }
    catch (error) {
        // Tests failed - verify claim
        const testOutput = error.stdout || error.stderr || '';
        const hasFailure = testOutput.includes('FAIL') || testOutput.includes('failed');
        return {
            claim: `Test failure in ${claim.file || 'test suite'}`,
            verified: hasFailure,
            method: 'exec(npm test)',
            confidence: hasFailure ? 100 : 70,
            evidence: {
                command: 'npm test',
                exit_code: error.status || 1,
                output: testOutput.slice(-1000)
            }
        };
    }
}
/**
 * Verify security vulnerability claim
 */
async function verifySecurityVulnerability(claim, workingDir) {
    try {
        const output = (0, child_process_1.execSync)('npm audit --json', {
            cwd: workingDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const auditData = JSON.parse(output);
        const vulnerabilities = auditData.vulnerabilities || {};
        const criticalCount = Object.values(vulnerabilities).filter((v) => v.severity === 'critical').length;
        const highCount = Object.values(vulnerabilities).filter((v) => v.severity === 'high').length;
        const hasVulnerabilities = criticalCount > 0 || highCount > 0;
        return {
            claim: 'Security vulnerabilities present',
            verified: hasVulnerabilities,
            method: 'exec(npm audit --json)',
            confidence: 100,
            evidence: {
                command: 'npm audit --json',
                exit_code: 0,
                metrics: {
                    critical: criticalCount,
                    high: highCount,
                    total: Object.keys(vulnerabilities).length
                }
            }
        };
    }
    catch (error) {
        // npm audit failed or found vulnerabilities
        const auditOutput = error.stdout || '';
        try {
            const auditData = JSON.parse(auditOutput);
            const vulnerabilities = auditData.vulnerabilities || {};
            const criticalCount = Object.values(vulnerabilities).filter((v) => v.severity === 'critical').length;
            const highCount = Object.values(vulnerabilities).filter((v) => v.severity === 'high').length;
            return {
                claim: 'Security vulnerabilities present',
                verified: true,
                method: 'exec(npm audit --json)',
                confidence: 100,
                evidence: {
                    command: 'npm audit --json',
                    exit_code: error.status || 1,
                    metrics: {
                        critical: criticalCount,
                        high: highCount,
                        total: Object.keys(vulnerabilities).length
                    }
                }
            };
        }
        catch (parseError) {
            return {
                claim: 'Security vulnerabilities present',
                verified: false,
                method: 'exec(npm audit --json)',
                confidence: 50,
                evidence: {
                    error_details: 'Could not parse npm audit output'
                }
            };
        }
    }
}
/**
 * Verify code quality claim
 */
async function verifyCodeQuality(claim, workingDir) {
    try {
        // Check if lint script exists
        const packageJsonPath = (0, path_1.join)(workingDir, 'package.json');
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
        if (!packageJson.scripts?.lint) {
            return {
                claim: 'Code quality issues present',
                verified: false,
                method: 'package.json check',
                confidence: 60,
                evidence: {
                    error_details: 'No lint script defined'
                }
            };
        }
        // Run lint
        const output = (0, child_process_1.execSync)('npm run lint', {
            cwd: workingDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        // Lint passed
        return {
            claim: 'Code quality issues present',
            verified: false,
            method: 'exec(npm run lint)',
            confidence: 100,
            evidence: {
                command: 'npm run lint',
                exit_code: 0,
                output: 'Lint passed with no errors'
            }
        };
    }
    catch (error) {
        // Lint failed - issues present
        const lintOutput = error.stdout || error.stderr || '';
        const errorCount = (lintOutput.match(/error/gi) || []).length;
        const warningCount = (lintOutput.match(/warning/gi) || []).length;
        return {
            claim: 'Code quality issues present',
            verified: errorCount > 0,
            method: 'exec(npm run lint)',
            confidence: 100,
            evidence: {
                command: 'npm run lint',
                exit_code: error.status || 1,
                metrics: {
                    errors: errorCount,
                    warnings: warningCount
                },
                output: lintOutput.slice(0, 1000)
            }
        };
    }
}
/**
 * Verify outdated dependencies claim
 */
async function verifyOutdatedDependencies(claim, workingDir) {
    try {
        const output = (0, child_process_1.execSync)('npm outdated --json', {
            cwd: workingDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        // No outdated dependencies
        return {
            claim: 'Outdated dependencies present',
            verified: false,
            method: 'exec(npm outdated --json)',
            confidence: 100,
            evidence: {
                command: 'npm outdated --json',
                exit_code: 0,
                output: 'All dependencies up to date'
            }
        };
    }
    catch (error) {
        // npm outdated returns exit 1 if outdated packages found
        const outdatedOutput = error.stdout || '';
        try {
            const outdatedData = JSON.parse(outdatedOutput);
            const outdatedCount = Object.keys(outdatedData).length;
            return {
                claim: 'Outdated dependencies present',
                verified: outdatedCount > 0,
                method: 'exec(npm outdated --json)',
                confidence: 100,
                evidence: {
                    command: 'npm outdated --json',
                    exit_code: error.status || 1,
                    metrics: {
                        outdated_count: outdatedCount
                    },
                    output: JSON.stringify(outdatedData, null, 2).slice(0, 1000)
                }
            };
        }
        catch (parseError) {
            return {
                claim: 'Outdated dependencies present',
                verified: false,
                method: 'exec(npm outdated --json)',
                confidence: 50,
                evidence: {
                    error_details: 'Could not parse npm outdated output'
                }
            };
        }
    }
}
/**
 * Verify accessibility claim
 * Note: Requires Lighthouse/axe-core to be installed
 */
async function verifyAccessibility(claim, workingDir) {
    // Check if Lighthouse is available
    try {
        (0, child_process_1.execSync)('which lighthouse', { encoding: 'utf-8' });
    }
    catch {
        return {
            claim: 'Accessibility violations present',
            verified: false,
            method: 'lighthouse availability check',
            confidence: 30,
            evidence: {
                error_details: 'Lighthouse not installed - run: npm install -g lighthouse'
            }
        };
    }
    // Note: This would require a running dev server
    // For now, just verify the claim can be checked
    return {
        claim: 'Accessibility violations present',
        verified: false,
        method: 'lighthouse (requires manual setup)',
        confidence: 40,
        evidence: {
            error_details: 'Lighthouse requires running dev server - implement in Phase 2'
        }
    };
}
/**
 * Verify performance claim
 */
async function verifyPerformance(claim, workingDir) {
    // Check if bundle analyzer or similar is available
    // For now, basic check on build output size
    const distPath = (0, path_1.join)(workingDir, 'dist');
    if (!(0, fs_1.existsSync)(distPath)) {
        return {
            claim: 'Performance issues present',
            verified: false,
            method: 'fs.existsSync(dist/)',
            confidence: 60,
            evidence: {
                error_details: 'No dist/ directory - run build first'
            }
        };
    }
    // Note: Full performance verification requires Lighthouse
    return {
        claim: 'Performance issues present',
        verified: false,
        method: 'build output check',
        confidence: 50,
        evidence: {
            error_details: 'Full performance verification requires Lighthouse - implement in Phase 2'
        }
    };
}
/**
 * Generate recommended fix based on verifications
 */
function generateProjectFix(issue, verifications) {
    const verifiedIssues = verifications.filter(v => v.verified);
    if (verifiedIssues.length === 0) {
        return 'Issue could not be verified - may be false positive';
    }
    // Test coverage fix
    if (verifiedIssues.some(v => v.claim.includes('coverage'))) {
        const coverageVerification = verifiedIssues.find(v => v.claim.includes('coverage'));
        const currentCoverage = coverageVerification?.evidence?.metrics?.total_coverage || 0;
        const threshold = coverageVerification?.evidence?.metrics?.threshold || 80;
        return `Add tests to increase coverage from ${currentCoverage}% to ${threshold}%+`;
    }
    // Test failure fix
    if (verifiedIssues.some(v => v.claim.includes('Test failure'))) {
        const testVerification = verifiedIssues.find(v => v.claim.includes('Test failure'));
        return `Fix failing tests:\n${testVerification?.evidence?.output || 'See test output'}`;
    }
    // Security vulnerability fix
    if (verifiedIssues.some(v => v.claim.includes('Security'))) {
        const secVerification = verifiedIssues.find(v => v.claim.includes('Security'));
        const critical = secVerification?.evidence?.metrics?.critical || 0;
        const high = secVerification?.evidence?.metrics?.high || 0;
        return `Run \`npm audit fix\` to fix ${critical} critical + ${high} high vulnerabilities`;
    }
    // Code quality fix
    if (verifiedIssues.some(v => v.claim.includes('quality'))) {
        return 'Run `npm run lint -- --fix` to auto-fix code quality issues';
    }
    // Outdated dependencies fix
    if (verifiedIssues.some(v => v.claim.includes('Outdated'))) {
        const depVerification = verifiedIssues.find(v => v.claim.includes('Outdated'));
        const count = depVerification?.evidence?.metrics?.outdated_count || 0;
        return `Update ${count} outdated dependencies with \`npm update\``;
    }
    return 'See verification evidence for fix details';
}
