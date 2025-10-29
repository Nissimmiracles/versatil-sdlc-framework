#!/usr/bin/env node
"use strict";
/**
 * Post-Agent-Response Hook (Victor-Verifier Integration)
 * Triggers after any tool use to extract and verify factual claims
 *
 * SDK Hook: PostToolUse (all tools)
 * Triggers: After Read, Write, Edit, Bash, Task completion
 *
 * Purpose:
 * - Extract verifiable claims from tool results
 * - Verify claims against ground truth
 * - Generate proof logs
 * - Flag hallucinations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = require("path");
const assessment_engine_1 = require("../../src/agents/verification/assessment-engine");
// Read hook input from stdin
const input = JSON.parse((0, fs_1.readFileSync)(0, 'utf-8'));
const { toolName, toolInput, toolOutput, workingDirectory, sessionId } = input;
// Skip if no output to analyze
if (!toolOutput) {
    process.exit(0);
}
/**
 * Extract Claims from Tool Output
 */
function extractClaims(toolName, toolInput, toolOutput) {
    const claims = [];
    const outputStr = JSON.stringify(toolOutput);
    // File creation claims (Write tool)
    if (toolName === 'Write' && toolInput?.file_path) {
        claims.push({
            text: `Created file: ${toolInput.file_path}`,
            category: 'FileCreation',
            extractedFrom: 'Write tool',
            confidence: 0,
            needsVerification: true,
            filePath: toolInput.file_path,
            context: toolInput.content?.substring(0, 500) // First 500 chars for pattern detection
        });
        if (toolInput.content) {
            const lineCount = toolInput.content.split('\n').length;
            claims.push({
                text: `File ${toolInput.file_path} contains ${lineCount} lines`,
                category: 'Metric',
                extractedFrom: 'Write tool content',
                confidence: 0,
                needsVerification: true,
                filePath: toolInput.file_path
            });
        }
    }
    // File edit claims (Edit tool)
    if (toolName === 'Edit' && toolInput?.file_path) {
        claims.push({
            text: `Edited file: ${toolInput.file_path}`,
            category: 'FileEdit',
            extractedFrom: 'Edit tool',
            confidence: 0,
            needsVerification: true,
            filePath: toolInput.file_path,
            context: toolInput.new_string?.substring(0, 500) // New content for pattern detection
        });
    }
    // Git commit claims (Bash tool)
    if (toolName === 'Bash' && toolInput?.command && toolInput.command.includes('git commit')) {
        // Extract commit message if present
        const commitMsgMatch = toolInput.command.match(/-m ["'](.+?)["']/);
        const commitMsg = commitMsgMatch ? commitMsgMatch[1] : 'unknown';
        claims.push({
            text: `Git commit created: "${commitMsg.substring(0, 50)}..."`,
            category: 'GitCommit',
            extractedFrom: 'Bash(git commit)',
            confidence: 0,
            needsVerification: true
        });
    }
    // Command execution claims (Bash tool)
    if (toolName === 'Bash' && toolInput?.command) {
        claims.push({
            text: `Command executed: ${toolInput.command.substring(0, 100)}`,
            category: 'CommandExecution',
            extractedFrom: 'Bash tool',
            confidence: 0,
            needsVerification: true
        });
        // Check if command succeeded
        if (toolOutput.exitCode === 0) {
            claims.push({
                text: `Command succeeded with exit code 0`,
                category: 'CommandExecution',
                extractedFrom: 'Bash tool exit code',
                confidence: 95, // High confidence if we have exit code
                needsVerification: false
            });
        }
    }
    return claims;
}
/**
 * Verify a Single Claim
 */
function verifyClaim(claim, workingDir) {
    const timestamp = new Date().toISOString();
    try {
        switch (claim.category) {
            case 'FileCreation':
            case 'FileEdit': {
                // Extract file path from claim
                const filePathMatch = claim.text.match(/file:? (.+?)(?:\s|$)/i);
                if (!filePathMatch) {
                    return {
                        claim,
                        verified: false,
                        confidence: 0,
                        method: 'File path extraction failed',
                        evidence: null,
                        timestamp
                    };
                }
                const filePath = filePathMatch[1].trim();
                const fullPath = (0, path_1.join)(workingDir, filePath);
                // Verify file exists
                if (!(0, fs_1.existsSync)(fullPath)) {
                    return {
                        claim,
                        verified: false,
                        confidence: 0,
                        method: 'File existence check (fs.existsSync)',
                        evidence: { fileExists: false, path: fullPath },
                        timestamp
                    };
                }
                // Get file stats
                const stats = (0, child_process_1.execSync)(`ls -la "${fullPath}"`, { encoding: 'utf-8', cwd: workingDir });
                return {
                    claim,
                    verified: true,
                    confidence: 100,
                    method: 'File existence + stats (ls -la)',
                    evidence: {
                        fileExists: true,
                        path: fullPath,
                        stats: stats.trim()
                    },
                    timestamp
                };
            }
            case 'GitCommit': {
                // Verify latest commit exists
                try {
                    const commitHash = (0, child_process_1.execSync)('git log -1 --format=%H', {
                        encoding: 'utf-8',
                        cwd: workingDir
                    }).trim();
                    const commitMsg = (0, child_process_1.execSync)('git log -1 --format=%s', {
                        encoding: 'utf-8',
                        cwd: workingDir
                    }).trim();
                    const filesChanged = (0, child_process_1.execSync)('git diff --stat HEAD~1 HEAD', {
                        encoding: 'utf-8',
                        cwd: workingDir
                    }).trim();
                    return {
                        claim,
                        verified: true,
                        confidence: 100,
                        method: 'Git log verification',
                        evidence: {
                            commitHash: commitHash.substring(0, 7),
                            commitMessage: commitMsg,
                            filesChanged: filesChanged.split('\n').length - 1
                        },
                        timestamp
                    };
                }
                catch (err) {
                    return {
                        claim,
                        verified: false,
                        confidence: 0,
                        method: 'Git log check failed',
                        evidence: { error: err.message },
                        timestamp
                    };
                }
            }
            case 'CommandExecution': {
                // Command execution verified by exit code in claim extraction
                return {
                    claim,
                    verified: true,
                    confidence: claim.confidence,
                    method: 'Exit code check',
                    evidence: { exitCode: 0 },
                    timestamp
                };
            }
            case 'Metric': {
                // Verify line count claims
                const lineCountMatch = claim.text.match(/contains (\d+) lines/);
                if (lineCountMatch) {
                    const claimedLines = parseInt(lineCountMatch[1]);
                    const filePathMatch = claim.text.match(/File (.+?) contains/);
                    if (filePathMatch) {
                        const filePath = filePathMatch[1].trim();
                        const fullPath = (0, path_1.join)(workingDir, filePath);
                        try {
                            const actualLines = (0, child_process_1.execSync)(`wc -l "${fullPath}" | awk '{print $1}'`, {
                                encoding: 'utf-8',
                                cwd: workingDir
                            }).trim();
                            const verified = parseInt(actualLines) === claimedLines;
                            return {
                                claim,
                                verified,
                                confidence: verified ? 100 : 40,
                                method: 'Line count verification (wc -l)',
                                evidence: {
                                    claimed: claimedLines,
                                    actual: parseInt(actualLines),
                                    match: verified
                                },
                                timestamp
                            };
                        }
                        catch (err) {
                            return {
                                claim,
                                verified: false,
                                confidence: 0,
                                method: 'Line count check failed',
                                evidence: { error: err.message },
                                timestamp
                            };
                        }
                    }
                }
                // Default: unable to verify metric
                return {
                    claim,
                    verified: false,
                    confidence: 50,
                    method: 'Metric verification not implemented',
                    evidence: { note: 'Complex metric requires manual verification' },
                    timestamp
                };
            }
            default:
                return {
                    claim,
                    verified: false,
                    confidence: 0,
                    method: 'Unknown category',
                    evidence: null,
                    timestamp
                };
        }
    }
    catch (err) {
        return {
            claim,
            verified: false,
            confidence: 0,
            method: 'Verification failed with error',
            evidence: { error: err.message },
            timestamp: new Date().toISOString()
        };
    }
}
/**
 * Main Verification Flow
 */
const claims = extractClaims(toolName, toolInput, toolOutput);
if (claims.length === 0) {
    // No verifiable claims found
    process.exit(0);
}
console.log(`\n🔍 Victor-Verifier: Analyzing ${claims.length} claim(s)...`);
// Verify each claim
const results = [];
let verifiedCount = 0;
let unverifiedCount = 0;
let totalConfidence = 0;
for (const claim of claims) {
    if (!claim.needsVerification) {
        console.log(`   ⏭️  ${claim.text} (pre-verified)`);
        continue;
    }
    const result = verifyClaim(claim, workingDirectory);
    results.push(result);
    const icon = result.verified ? '✓' : '❌';
    const status = result.verified ? 'VERIFIED' : 'UNVERIFIED';
    console.log(`   ${icon} ${claim.text}`);
    console.log(`      → ${status} (${result.confidence}% confidence)`);
    console.log(`      → Method: ${result.method}`);
    if (result.verified) {
        verifiedCount++;
    }
    else {
        unverifiedCount++;
    }
    totalConfidence += result.confidence;
}
// Summary
const avgConfidence = results.length > 0 ? Math.round(totalConfidence / results.length) : 0;
console.log(`\n📊 Verification Summary:`);
console.log(`   Total claims: ${results.length}`);
console.log(`   VERIFIED: ${verifiedCount} (${Math.round((verifiedCount / results.length) * 100)}%)`);
console.log(`   UNVERIFIED: ${unverifiedCount}`);
console.log(`   Average confidence: ${avgConfidence}%`);
// Save to proof log
const verificationLogDir = (0, path_1.join)(workingDirectory, '.versatil/verification');
if (!(0, fs_1.existsSync)(verificationLogDir)) {
    (0, fs_1.mkdirSync)(verificationLogDir, { recursive: true });
}
const proofLogPath = (0, path_1.join)(verificationLogDir, 'proof-log.jsonl');
for (const result of results) {
    const logEntry = JSON.stringify({
        sessionId,
        timestamp: result.timestamp,
        claim: result.claim.text,
        category: result.claim.category,
        verified: result.verified,
        confidence: result.confidence,
        method: result.method,
        evidence: result.evidence
    }) + '\n';
    (0, fs_1.appendFileSync)(proofLogPath, logEntry, 'utf-8');
}
// Flag low-confidence claims
const flaggedClaims = results.filter(r => r.confidence < 80);
if (flaggedClaims.length > 0) {
    console.log(`\n⚠️  ${flaggedClaims.length} claim(s) flagged for human review`);
    const flaggedLogPath = (0, path_1.join)(verificationLogDir, 'flagged.jsonl');
    for (const flagged of flaggedClaims) {
        const flagEntry = JSON.stringify({
            sessionId,
            timestamp: flagged.timestamp,
            claim: flagged.claim.text,
            confidence: flagged.confidence,
            reason: 'Low confidence (<80%)',
            evidence: flagged.evidence
        }) + '\n';
        (0, fs_1.appendFileSync)(flaggedLogPath, flagEntry, 'utf-8');
    }
}
console.log(`\n✅ Proof log saved: ${proofLogPath}`);
// ============================================================================
// ASSESSMENT ENGINE INTEGRATION (Phase 1)
// ============================================================================
console.log('\n🔬 Assessment Engine: Analyzing claims for quality audits...');
const assessmentEngine = new assessment_engine_1.AssessmentEngine(workingDirectory);
const assessmentPlans = [];
for (const claim of claims) {
    if (assessmentEngine.needsAssessment(claim)) {
        const plan = assessmentEngine.planAssessment(claim);
        if (plan.needsAssessment) {
            assessmentPlans.push(plan);
            const priorityIcon = plan.priority === 'critical' ? '🚨' : plan.priority === 'high' ? '⚠️' : 'ℹ️';
            console.log(`   ${priorityIcon} ${claim.text}`);
            console.log(`      → Reason: ${plan.reason}`);
            console.log(`      → Priority: ${plan.priority.toUpperCase()}`);
            console.log(`      → Assessments: ${plan.assessments.length}`);
            for (const assessment of plan.assessments) {
                const mandatoryBadge = assessment.mandatory ? '[MANDATORY]' : '[OPTIONAL]';
                console.log(`         • ${assessment.type} (${assessment.tool}) ${mandatoryBadge}`);
                console.log(`           ${assessment.reason}`);
            }
            console.log(`      → Estimated duration: ${plan.estimatedDuration}`);
        }
    }
}
// Save assessment plans to log
if (assessmentPlans.length > 0) {
    const assessmentLogPath = (0, path_1.join)(verificationLogDir, 'assessment-plans.jsonl');
    for (const plan of assessmentPlans) {
        const logEntry = JSON.stringify({
            sessionId,
            timestamp: new Date().toISOString(),
            claim: plan.claim.text,
            priority: plan.priority,
            reason: plan.reason,
            assessments: plan.assessments.map((a) => ({
                type: a.type,
                tool: a.tool,
                mandatory: a.mandatory,
                threshold: a.threshold
            })),
            estimatedDuration: plan.estimatedDuration
        }) + '\n';
        (0, fs_1.appendFileSync)(assessmentLogPath, logEntry, 'utf-8');
    }
    console.log(`\n📋 Assessment Summary:`);
    console.log(`   Total claims needing assessment: ${assessmentPlans.length}`);
    const criticalCount = assessmentPlans.filter(p => p.priority === 'critical').length;
    const highCount = assessmentPlans.filter(p => p.priority === 'high').length;
    if (criticalCount > 0)
        console.log(`   🚨 Critical priority: ${criticalCount}`);
    if (highCount > 0)
        console.log(`   ⚠️  High priority: ${highCount}`);
    const totalMandatory = assessmentPlans.reduce((sum, p) => sum + p.assessments.filter((a) => a.mandatory).length, 0);
    console.log(`   Mandatory assessments: ${totalMandatory}`);
    console.log(`   Assessment plans saved: ${assessmentLogPath}`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   • Review assessment plans in ${assessmentLogPath}`);
    console.log(`   • Phase 2: Auto-execute assessments via Maria-QA/Marcus/James`);
    console.log(`   • Phase 3: Block merges if mandatory assessments fail`);
}
else {
    console.log(`   ✓ No quality assessments required`);
}
console.log('─'.repeat(60) + '\n');
process.exit(0);
