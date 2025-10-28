/**
 * VERSATIL Framework - VELOCITY Phase Auto-Detection
 *
 * Automatically detects which VELOCITY workflow phase should be active
 * based on current context (file edits, commands, hooks, etc.)
 *
 * Detection Logic:
 * - Cursor Plan Mode → PLAN phase
 * - /plan command → PLAN phase
 * - File edit + active workflow → WORK phase
 * - Build/test command → ASSESS phase
 * - Session end → CODIFY phase
 * - /delegate command → DELEGATE phase
 *
 * @module workflows/phase-detector
 */
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// PHASE DETECTOR
// ============================================================================
export class VelocityPhaseDetector {
    constructor() {
        this.stateDir = path.join(process.env.HOME || '', '.versatil', 'state');
        this.currentWorkflowFile = path.join(this.stateDir, 'current-workflow.json');
    }
    /**
     * Main detection method - automatically determine current phase
     */
    detect(context) {
        // Check if workflow is active
        const workflowActive = this.isWorkflowActive();
        // Trigger-specific detection
        switch (context.trigger) {
            case 'command':
                return this.detectFromCommand(context, workflowActive);
            case 'fileEdit':
                return this.detectFromFileEdit(context, workflowActive);
            case 'build':
            case 'test':
                return this.detectFromBuildTest(context, workflowActive);
            case 'sessionEnd':
                return this.detectFromSessionEnd(context, workflowActive);
            case 'manual':
                return this.detectManual(context, workflowActive);
            default:
                return {
                    phase: null,
                    confidence: 0,
                    reason: 'Unknown trigger',
                    workflowActive,
                };
        }
    }
    /**
     * Detect phase from command execution
     */
    detectFromCommand(context, workflowActive) {
        const cmd = context.commandName?.toLowerCase() || '';
        // Cursor Plan Mode → PLAN phase
        if (cmd.includes('plan') || cmd.includes('cursor-plan')) {
            return {
                phase: 'Plan',
                confidence: 0.95,
                reason: 'Plan command detected',
                workflowActive,
                suggestedAction: workflowActive
                    ? 'Complete current workflow before starting new plan'
                    : 'Start VELOCITY workflow',
            };
        }
        // /assess command → ASSESS phase
        if (cmd.includes('assess')) {
            return {
                phase: 'Assess',
                confidence: 0.9,
                reason: 'Assess command detected',
                workflowActive,
                suggestedAction: workflowActive
                    ? 'Run quality gates'
                    : 'No active workflow to assess',
            };
        }
        // /delegate command → DELEGATE phase
        if (cmd.includes('delegate')) {
            return {
                phase: 'Delegate',
                confidence: 0.9,
                reason: 'Delegate command detected',
                workflowActive,
                suggestedAction: workflowActive
                    ? 'Distribute work to agents'
                    : 'No active workflow to delegate',
            };
        }
        // /work command → WORK phase
        if (cmd.includes('work')) {
            return {
                phase: 'Work',
                confidence: 0.9,
                reason: 'Work command detected',
                workflowActive,
                suggestedAction: workflowActive
                    ? 'Execute implementation'
                    : 'No active workflow for work phase',
            };
        }
        // /codify or /learn command → CODIFY phase
        if (cmd.includes('codify') || cmd.includes('learn')) {
            return {
                phase: 'Codify',
                confidence: 0.9,
                reason: 'Codify/Learn command detected',
                workflowActive,
                suggestedAction: workflowActive
                    ? 'Extract and store learnings'
                    : 'No active workflow to codify',
            };
        }
        // Unknown command
        return {
            phase: null,
            confidence: 0,
            reason: `Command '${cmd}' not associated with VELOCITY phase`,
            workflowActive,
        };
    }
    /**
     * Detect phase from file edit
     */
    detectFromFileEdit(context, workflowActive) {
        if (!workflowActive) {
            return {
                phase: null,
                confidence: 0,
                reason: 'No active workflow',
                workflowActive: false,
                suggestedAction: 'Start workflow with: velocity plan "<target>"',
            };
        }
        const filePath = context.filePath || '';
        // Special files that might indicate planning
        if (this.isPlanningFile(filePath)) {
            return {
                phase: 'Plan',
                confidence: 0.7,
                reason: 'Editing planning/requirements file',
                workflowActive,
                suggestedAction: 'Update plan documentation',
            };
        }
        // Code files → WORK phase
        if (this.isCodeFile(filePath)) {
            return {
                phase: 'Work',
                confidence: 0.85,
                reason: 'Editing code file during active workflow',
                workflowActive,
                suggestedAction: 'Track file modification in workflow',
            };
        }
        // Default to WORK phase for any file edit during active workflow
        return {
            phase: 'Work',
            confidence: 0.6,
            reason: 'File edit during active workflow',
            workflowActive,
            suggestedAction: 'Track file modification',
        };
    }
    /**
     * Detect phase from build/test commands
     */
    detectFromBuildTest(context, workflowActive) {
        if (!workflowActive) {
            return {
                phase: null,
                confidence: 0,
                reason: 'No active workflow',
                workflowActive: false,
            };
        }
        return {
            phase: 'Assess',
            confidence: 0.9,
            reason: `${context.trigger} command indicates quality assessment`,
            workflowActive,
            suggestedAction: 'Run quality gates (coverage, security, performance)',
        };
    }
    /**
     * Detect phase from session end
     */
    detectFromSessionEnd(context, workflowActive) {
        if (!workflowActive) {
            return {
                phase: null,
                confidence: 0,
                reason: 'No active workflow',
                workflowActive: false,
            };
        }
        return {
            phase: 'Codify',
            confidence: 0.95,
            reason: 'Session ending with active workflow',
            workflowActive,
            suggestedAction: 'Extract learnings and archive workflow',
        };
    }
    /**
     * Manual detection (used when phase is explicitly specified)
     */
    detectManual(context, workflowActive) {
        const phase = context.metadata?.phase;
        if (!phase) {
            return {
                phase: null,
                confidence: 0,
                reason: 'No phase specified in manual detection',
                workflowActive,
            };
        }
        return {
            phase,
            confidence: 1.0,
            reason: 'Manually specified phase',
            workflowActive,
        };
    }
    /**
     * Check if workflow is currently active
     */
    isWorkflowActive() {
        try {
            return fs.existsSync(this.currentWorkflowFile);
        }
        catch {
            return false;
        }
    }
    /**
     * Check if file is a planning/requirements file
     */
    isPlanningFile(filePath) {
        const planningPatterns = [
            /requirements\//i,
            /\.feature$/i,
            /user-stories\//i,
            /\.md$/i, // Markdown (docs, requirements)
            /PLAN\.md$/i,
            /TODO\.md$/i,
            /roadmap/i,
        ];
        return planningPatterns.some(pattern => pattern.test(filePath));
    }
    /**
     * Check if file is a code file
     */
    isCodeFile(filePath) {
        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx',
            '.py', '.java', '.go', '.rb',
            '.vue', '.svelte',
            '.css', '.scss', '.sass',
            '.sql',
        ];
        return codeExtensions.some(ext => filePath.endsWith(ext));
    }
    /**
     * Get recommended next phase based on current phase
     */
    getNextPhase(currentPhase) {
        const phaseSequence = ['Plan', 'Assess', 'Delegate', 'Work', 'Codify'];
        const currentIndex = phaseSequence.indexOf(currentPhase);
        if (currentIndex === -1 || currentIndex === phaseSequence.length - 1) {
            return null; // Unknown phase or last phase
        }
        return phaseSequence[currentIndex + 1];
    }
    /**
     * Check if transition to target phase is valid
     */
    canTransitionTo(currentPhase, targetPhase) {
        // Can always start with Plan
        if (targetPhase === 'Plan') {
            return true;
        }
        // No current phase → must start with Plan
        if (!currentPhase) {
            return false;
        }
        // Can always go to Codify (emergency exit)
        if (targetPhase === 'Codify') {
            return true;
        }
        // Check sequential progression
        const phaseSequence = ['Plan', 'Assess', 'Delegate', 'Work', 'Codify'];
        const currentIndex = phaseSequence.indexOf(currentPhase);
        const targetIndex = phaseSequence.indexOf(targetPhase);
        // Can move forward or backward within reasonable bounds
        const distance = targetIndex - currentIndex;
        return distance >= -1 && distance <= 2; // Allow back 1 step, forward 2 steps
    }
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Quick phase detection from file edit
 */
export function detectPhaseFromFileEdit(filePath) {
    const detector = new VelocityPhaseDetector();
    return detector.detect({
        trigger: 'fileEdit',
        filePath,
    });
}
/**
 * Quick phase detection from command
 */
export function detectPhaseFromCommand(commandName) {
    const detector = new VelocityPhaseDetector();
    return detector.detect({
        trigger: 'command',
        commandName,
    });
}
/**
 * Quick phase detection from build/test
 */
export function detectPhaseFromBuild() {
    const detector = new VelocityPhaseDetector();
    return detector.detect({
        trigger: 'build',
    });
}
/**
 * Quick phase detection from session end
 */
export function detectPhaseFromSessionEnd() {
    const detector = new VelocityPhaseDetector();
    return detector.detect({
        trigger: 'sessionEnd',
    });
}
//# sourceMappingURL=phase-detector.js.map