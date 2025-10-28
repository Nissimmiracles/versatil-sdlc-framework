#!/usr/bin/env node
/**
 * Quick SimulationQA Stress Test - Lightweight CLI Version
 *
 * Bypasses heavy file analysis to provide immediate SimulationQA validation
 * without hanging on complex filesystem operations.
 */
declare function runQuickStressTest(): Promise<void>;
interface DetectedIssue {
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    autofix?: string;
}
/**
 * Agnostic Issue Detection System
 * Detects issues without relying on specific file formats or extensions
 */
declare function runAgnosticDetection(): Promise<DetectedIssue[]>;
export { runQuickStressTest, runAgnosticDetection };
