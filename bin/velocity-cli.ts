#!/usr/bin/env node

/**
 * VERSATIL Framework - VELOCITY Workflow CLI
 *
 * Command-line interface to the VELOCITY Workflow Orchestrator.
 * Implements the 5-phase Compounding Engineering cycle:
 * Plan → Assess → Delegate → Work → Codify
 *
 * Usage:
 *   velocity plan <target>         # Phase 1: Create plan with templates
 *   velocity assess [--auto]       # Phase 2: Validate readiness
 *   velocity delegate <pattern>    # Phase 3: Distribute work to agents
 *   velocity work [--monitor]      # Phase 4: Execute implementation
 *   velocity codify [--auto]       # Phase 5: Extract learnings
 *   velocity status                # Show current workflow state
 *   velocity history               # Show completed workflows
 *
 * Examples:
 *   velocity plan "Add user authentication"
 *   velocity assess --auto
 *   velocity work --monitor --update src/components/LoginForm.tsx
 *   velocity codify --auto
 */

import { VelocityWorkflowOrchestrator } from '../dist/workflows/velocity-workflow-orchestrator.js';
import type { VelocityWorkflowConfig, PhaseExecutionResult, WorkflowContext } from '../dist/workflows/velocity-workflow-orchestrator.js';
import { VelocityOrchestratorImpl } from '../dist/workflows/velocity-orchestrator-impl.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const STATE_DIR = path.join(process.env.HOME || '', '.versatil', 'state');
const CURRENT_WORKFLOW_FILE = path.join(STATE_DIR, 'current-workflow.json');
const WORKFLOW_HISTORY_FILE = path.join(STATE_DIR, 'workflow-history.jsonl');

interface WorkflowState {
  workflowId: string;
  target: string;
  currentPhase: string;
  startTime: number;
  phases: Record<string, PhaseState>;
  context: WorkflowContext;
  config: VelocityWorkflowConfig;
}

interface PhaseState {
  completed: boolean;
  startTime?: number;
  endTime?: number;
  duration?: number;
  outputs?: any;
  errors?: string[];
  warnings?: string[];
}

/**
 * Ensure state directory exists
 */
function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Load current workflow state
 */
function loadWorkflowState(): WorkflowState | null {
  try {
    if (!fs.existsSync(CURRENT_WORKFLOW_FILE)) {
      return null;
    }

    const data = fs.readFileSync(CURRENT_WORKFLOW_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('⚠️  Failed to load workflow state:', error);
    return null;
  }
}

/**
 * Save current workflow state
 */
function saveWorkflowState(state: WorkflowState): void {
  ensureStateDir();

  try {
    fs.writeFileSync(CURRENT_WORKFLOW_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('⚠️  Failed to save workflow state:', error);
  }
}

/**
 * Archive completed workflow to history
 */
function archiveWorkflow(state: WorkflowState): void {
  ensureStateDir();

  try {
    const historyEntry = {
      ...state,
      completedAt: Date.now(),
    };

    fs.appendFileSync(
      WORKFLOW_HISTORY_FILE,
      JSON.stringify(historyEntry) + '\n',
      'utf-8'
    );

    // Remove current workflow file
    if (fs.existsSync(CURRENT_WORKFLOW_FILE)) {
      fs.unlinkSync(CURRENT_WORKFLOW_FILE);
    }
  } catch (error) {
    console.error('⚠️  Failed to archive workflow:', error);
  }
}

/**
 * Load workflow history
 */
function loadWorkflowHistory(limit: number = 10): WorkflowState[] {
  try {
    if (!fs.existsSync(WORKFLOW_HISTORY_FILE)) {
      return [];
    }

    const data = fs.readFileSync(WORKFLOW_HISTORY_FILE, 'utf-8');
    const lines = data.split('\n').filter(Boolean);

    return lines
      .slice(-limit) // Last N entries
      .map(line => JSON.parse(line))
      .reverse(); // Most recent first
  } catch (error) {
    console.error('⚠️  Failed to load workflow history:', error);
    return [];
  }
}

// ============================================================================
// ORCHESTRATOR WRAPPER
// ============================================================================

class VelocityCLI {
  private orchestrator: VelocityWorkflowOrchestrator;
  private impl: VelocityOrchestratorImpl;

  constructor() {
    this.orchestrator = new VelocityWorkflowOrchestrator();
    this.impl = new VelocityOrchestratorImpl();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for workflow events
   */
  private setupEventListeners(): void {
    this.orchestrator.on('workflowStarted', (event) => {
      console.log(`\n🚀 Workflow started: ${event.target}`);
      console.log(`   ID: ${event.workflowId}`);
      console.log(`   Time: ${new Date(event.timestamp).toLocaleString()}\n`);
    });

    this.orchestrator.on('phaseCompleted', (event) => {
      const { result } = event;
      const emoji = this.getPhaseEmoji(result.phase);

      console.log(`\n${emoji} Phase ${result.phase} complete`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);

      if (result.warnings && result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
      }

      if (result.nextPhase) {
        console.log(`   → Next: ${result.nextPhase}\n`);
      }
    });

    this.orchestrator.on('workflowCompleted', (event) => {
      console.log(`\n✅ Workflow completed!`);
      console.log(`   Total time: ${(event.totalDuration / 1000 / 60).toFixed(1)} minutes`);
      console.log(`   Patterns learned: ${event.patternsLearned || 0}\n`);
    });
  }

  /**
   * Get emoji for phase
   */
  private getPhaseEmoji(phase: string): string {
    const emojis: Record<string, string> = {
      Plan: '📋',
      Assess: '🔍',
      Delegate: '👥',
      Work: '⚙️',
      Codify: '📚',
    };

    return emojis[phase] || '🔄';
  }

  /**
   * Phase 1: Plan
   */
  async plan(target: string, options: any = {}): Promise<void> {
    console.log(`📋 Starting PLAN phase for: "${target}"\n`);

    const config: VelocityWorkflowConfig = {
      workflowId: '', // Will be generated by orchestrator
      target,
      autoTransition: options.auto !== false,
      requireApprovalPerPhase: options.approval || false,
      continuousMonitoring: true,
      qualityGateLevel: options.quality || 'normal',
      maxExecutionHours: 24,
      codifyToRAG: true,
    };

    const workflowId = await this.orchestrator.startWorkflow(config);

    // Execute real PLAN phase implementation
    const planResult = await this.impl.invokePlanCommand(target);

    // Create initial state with plan data
    const state: WorkflowState = {
      workflowId,
      target,
      currentPhase: 'Plan',
      startTime: Date.now(),
      phases: {
        Plan: {
          completed: true,
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          outputs: planResult,
        },
      },
      context: {
        target,
        plan: planResult,
      },
      config,
    };

    saveWorkflowState(state);

    console.log(`✅ Workflow created: ${workflowId}`);
    console.log(`   State saved to: ${CURRENT_WORKFLOW_FILE}`);
    console.log(`\n📊 PLAN Results:`);
    console.log(`   Todos: ${planResult.todos.length}`);
    console.log(`   Estimated Hours: ${planResult.estimates.total.toFixed(1)}`);
    console.log(`   Templates Used: ${planResult.templates.length}`);
    if (planResult.historicalContext.length > 0) {
      console.log(`   Historical Context: ${planResult.historicalContext.length} similar features found`);
    }
    console.log();
  }

  /**
   * Phase 2: Assess
   */
  async assess(options: any = {}): Promise<void> {
    const state = loadWorkflowState();

    if (!state) {
      console.error('❌ No active workflow. Run `velocity plan <target>` first.\n');
      process.exit(1);
    }

    console.log(`🔍 Starting ASSESS phase for: "${state.target}"\n`);

    const startTime = Date.now();

    // Execute real ASSESS phase implementation
    const assessResult = await this.impl.invokeAssessCommand(state.target);

    const duration = Date.now() - startTime;

    // Update state
    state.phases.Assess = {
      completed: assessResult.readiness === 'ready',
      startTime,
      endTime: Date.now(),
      duration,
      outputs: assessResult,
    };

    state.context.assessment = assessResult;
    state.currentPhase = assessResult.readiness === 'ready' ? 'Delegate' : 'Assess';
    saveWorkflowState(state);

    console.log(`\n📊 ASSESS Results:`);
    console.log(`   Health Score: ${assessResult.health}%`);
    console.log(`   Readiness: ${assessResult.readiness}`);
    console.log(`   Blockers: ${assessResult.blockers.length}`);
    console.log(`   Warnings: ${assessResult.warnings.length}`);
    console.log();

    if (assessResult.readiness === 'blocked') {
      console.error('❌ Assessment failed. Fix blockers before proceeding.\n');
      process.exit(1);
    }
  }

  /**
   * Phase 3: Delegate
   */
  async delegate(pattern: string, options: any = {}): Promise<void> {
    const state = loadWorkflowState();

    if (!state) {
      console.error('❌ No active workflow. Run `velocity plan <target>` first.\n');
      process.exit(1);
    }

    console.log(`👥 Starting DELEGATE phase: "${pattern}"\n`);

    const startTime = Date.now();

    // Get todos from plan phase
    const todos = state.context.plan?.todos || [];

    // Execute real DELEGATE phase implementation
    const delegateResult = await this.impl.invokeDelegateCommand(todos);

    const duration = Date.now() - startTime;

    // Update state
    state.phases.Delegate = {
      completed: true,
      startTime,
      endTime: Date.now(),
      duration,
      outputs: delegateResult,
    };

    state.context.delegation = delegateResult;
    state.currentPhase = 'Work';
    saveWorkflowState(state);

    console.log(`\n📊 DELEGATE Results:`);
    console.log(`   Agent Assignments: ${delegateResult.assignments.size}`);
    console.log(`   Parallel Groups: ${delegateResult.parallelGroups.length}`);
    console.log(`   Dependencies: ${delegateResult.dependencies.size}`);
    console.log(`\n   Agents:`);
    for (const [agent, todoIds] of delegateResult.assignments) {
      console.log(`      ${agent}: ${todoIds.length} todos`);
    }
    console.log();
  }

  /**
   * Phase 4: Work
   */
  async work(options: any = {}): Promise<void> {
    const state = loadWorkflowState();

    if (!state) {
      console.error('❌ No active workflow. Run `velocity plan <target>` first.\n');
      process.exit(1);
    }

    console.log(`⚙️  Starting WORK phase for: "${state.target}"\n`);

    // If --update flag, just update progress (called from hooks)
    if (options.update) {
      console.log(`   📝 File updated: ${options.update}`);

      if (!state.context.work) {
        state.context.work = {
          completedTodos: [],
          actualDuration: 0,
          testsAdded: 0,
          filesModified: [],
        };
      }

      if (!state.context.work.filesModified.includes(options.update)) {
        state.context.work.filesModified.push(options.update);
      }

      saveWorkflowState(state);
      return;
    }

    // Full work phase execution
    const result = await this.orchestrator.executeWork(state.workflowId, state.context);

    // Update state
    state.phases.Work = {
      completed: result.success,
      startTime: Date.now() - result.duration,
      endTime: Date.now(),
      duration: result.duration,
      outputs: result.outputs,
      errors: result.errors,
      warnings: result.warnings,
    };

    state.currentPhase = result.nextPhase || 'Work';
    saveWorkflowState(state);

    if (!result.success) {
      console.error('❌ Work phase failed. Check errors above.\n');
      process.exit(1);
    }
  }

  /**
   * Phase 5: Codify
   */
  async codify(options: any = {}): Promise<void> {
    const state = loadWorkflowState();

    if (!state) {
      console.log('ℹ️  No active workflow to codify.\n');
      return;
    }

    console.log(`📚 Starting CODIFY phase for: "${state.target}"\n`);

    const startTime = Date.now();

    // Execute real CODIFY phase implementation
    const codifyResult = await this.impl.invokeLearnCommand(state.context);

    const duration = Date.now() - startTime;

    // Update state
    state.phases.Codify = {
      completed: true,
      startTime,
      endTime: Date.now(),
      duration,
      outputs: codifyResult,
    };

    state.context.learnings = codifyResult;
    state.currentPhase = 'Completed';

    console.log(`\n📊 CODIFY Results:`);
    console.log(`   Patterns Learned: ${codifyResult.patterns}`);
    console.log(`   Effort Accuracy: ${codifyResult.effortAccuracy}`);
    console.log(`   Lessons Learned: ${codifyResult.lessonsLearned.length}`);
    console.log(`   RAG Stored: ${codifyResult.ragStored ? 'Yes' : 'No'}`);
    console.log();

    // Archive completed workflow
    archiveWorkflow(state);
    console.log(`✅ Workflow completed and archived!\n`);
  }

  /**
   * Show workflow status
   */
  async status(): Promise<void> {
    const state = loadWorkflowState();

    if (!state) {
      console.log('ℹ️  No active workflow.\n');
      console.log('   Start one with: velocity plan "<target>"\n');
      return;
    }

    console.log(`\n📊 Workflow Status\n`);
    console.log(`   Target: ${state.target}`);
    console.log(`   ID: ${state.workflowId}`);
    console.log(`   Current Phase: ${state.currentPhase}`);
    console.log(`   Started: ${new Date(state.startTime).toLocaleString()}\n`);

    console.log(`   Phases:`);
    const phaseOrder = ['Plan', 'Assess', 'Delegate', 'Work', 'Codify'];

    for (const phase of phaseOrder) {
      const phaseState = state.phases[phase];

      if (!phaseState) {
        console.log(`      ${phase}: ⏸️  Pending`);
        continue;
      }

      if (phaseState.completed) {
        const duration = phaseState.duration ? `(${(phaseState.duration / 1000).toFixed(1)}s)` : '';
        console.log(`      ${phase}: ✅ Complete ${duration}`);
      } else {
        console.log(`      ${phase}: 🔄 In Progress`);
      }

      if (phaseState.warnings && phaseState.warnings.length > 0) {
        console.log(`         ⚠️  ${phaseState.warnings.length} warnings`);
      }

      if (phaseState.errors && phaseState.errors.length > 0) {
        console.log(`         ❌ ${phaseState.errors.length} errors`);
      }
    }

    // Show work progress if available
    if (state.context.work) {
      console.log(`\n   Progress:`);
      console.log(`      Files modified: ${state.context.work.filesModified.length}`);
      console.log(`      Tests added: ${state.context.work.testsAdded}`);
    }

    console.log();
  }

  /**
   * Show workflow history
   */
  async history(limit: number = 10): Promise<void> {
    const history = loadWorkflowHistory(limit);

    if (history.length === 0) {
      console.log('ℹ️  No completed workflows.\n');
      return;
    }

    console.log(`\n📜 Workflow History (last ${limit})\n`);

    for (const workflow of history) {
      const duration = (workflow as any).completedAt - workflow.startTime;
      const completedPhases = Object.values(workflow.phases).filter(p => p.completed).length;

      console.log(`   ${workflow.target}`);
      console.log(`      ID: ${workflow.workflowId}`);
      console.log(`      Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
      console.log(`      Phases: ${completedPhases}/5`);
      console.log(`      Completed: ${new Date((workflow as any).completedAt).toLocaleString()}`);
      console.log();
    }
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
VERSATIL VELOCITY Workflow CLI

Usage:
  velocity <command> [options]

Commands:
  plan <target>         Create plan for feature (Phase 1)
  assess                Validate readiness (Phase 2)
  delegate <pattern>    Distribute work to agents (Phase 3)
  work                  Execute implementation (Phase 4)
  codify                Extract learnings (Phase 5)
  status                Show current workflow state
  history [limit]       Show completed workflows

Options:
  --auto                Auto-transition between phases
  --monitor             Continuous monitoring during Work phase
  --update <file>       Update work progress (called from hooks)
  --json                Output JSON format
  --help, -h            Show this help

Examples:
  velocity plan "Add user authentication"
  velocity assess --auto
  velocity work --monitor
  velocity codify --auto
  velocity status
  velocity history 5
    `);
    process.exit(0);
  }

  const command = args[0];
  const cli = new VelocityCLI();

  try {
    switch (command) {
      case 'plan':
        if (!args[1]) {
          console.error('❌ Target required: velocity plan "<target>"\n');
          process.exit(1);
        }
        await cli.plan(args[1], { auto: args.includes('--auto') });
        break;

      case 'assess':
        await cli.assess({ auto: args.includes('--auto') });
        break;

      case 'delegate':
        if (!args[1]) {
          console.error('❌ Pattern required: velocity delegate "<pattern>"\n');
          process.exit(1);
        }
        await cli.delegate(args[1]);
        break;

      case 'work':
        const updateIndex = args.indexOf('--update');
        const updateFile = updateIndex >= 0 ? args[updateIndex + 1] : undefined;

        await cli.work({
          monitor: args.includes('--monitor'),
          update: updateFile,
        });
        break;

      case 'codify':
        await cli.codify({ auto: args.includes('--auto') });
        break;

      case 'status':
        await cli.status();
        break;

      case 'history':
        const limit = parseInt(args[1]) || 10;
        await cli.history(limit);
        break;

      default:
        console.error(`❌ Unknown command: ${command}\n`);
        console.error('   Run `velocity --help` for usage.\n');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
