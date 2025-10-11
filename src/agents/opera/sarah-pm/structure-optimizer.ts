/**
 * Structure Optimizer for Sarah-PM
 *
 * Generates and executes repository reorganization plans based on analysis results.
 * Provides safe file migrations with preview, approval workflow, and rollback capability.
 *
 * @module sarah-pm/structure-optimizer
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, dirname, relative, basename } from 'path';
import type { AnalysisResult, RepositoryIssue } from './repository-analyzer.js';

/**
 * Configuration for Structure Optimizer
 */
export interface OptimizerConfig {
  /**
   * Require user approval before executing migrations
   * @default true
   */
  requireApproval?: boolean;

  /**
   * Create backup before executing migrations
   * @default true
   */
  createBackup?: boolean;

  /**
   * Directory for backup files
   * @default '.versatil-backups'
   */
  backupDir?: string;

  /**
   * Generate executable bash scripts for migrations
   * @default true
   */
  generateScripts?: boolean;

  /**
   * Directory for migration scripts
   * @default 'scripts/migrations'
   */
  scriptDir?: string;

  /**
   * Dry run mode (preview only, no actual changes)
   * @default false
   */
  dryRun?: boolean;

  /**
   * Auto-fix safe issues without approval
   * @default false
   */
  autoFixSafe?: boolean;
}

/**
 * File migration operation
 */
export interface MigrationOperation {
  type: 'move' | 'create_dir' | 'delete' | 'rename';
  source?: string;
  destination?: string;
  reason: string;
  safety: 'safe' | 'requires-approval' | 'destructive';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Migration plan for repository reorganization
 */
export interface MigrationPlan {
  projectPath: string;
  createdAt: Date;
  operations: MigrationOperation[];
  summary: {
    totalOperations: number;
    safeOperations: number;
    requiresApproval: number;
    destructiveOperations: number;
  };
  estimatedImpact: {
    filesAffected: number;
    directoriesCreated: number;
    directoriesRemoved: number;
  };
  scriptPath?: string;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  success: boolean;
  executedOperations: number;
  failedOperations: number;
  skippedOperations: number;
  errors: Array<{ operation: MigrationOperation; error: string }>;
  backupPath?: string;
  rollbackAvailable: boolean;
}

/**
 * Structure Optimizer - Repository Reorganization Engine
 */
export class StructureOptimizer extends EventEmitter {
  private config: Required<OptimizerConfig>;

  constructor(config: OptimizerConfig = {}) {
    super();
    this.config = {
      requireApproval: config.requireApproval ?? true,
      createBackup: config.createBackup ?? true,
      backupDir: config.backupDir ?? '.versatil-backups',
      generateScripts: config.generateScripts ?? true,
      scriptDir: config.scriptDir ?? 'scripts/migrations',
      dryRun: config.dryRun ?? false,
      autoFixSafe: config.autoFixSafe ?? false
    };
  }

  /**
   * Generate migration plan from analysis results
   */
  async generatePlan(analysisResult: AnalysisResult): Promise<MigrationPlan> {
    this.emit('plan:started', { projectPath: analysisResult.projectPath });

    const operations: MigrationOperation[] = [];

    // Process each issue and generate operations
    for (const issue of analysisResult.issues) {
      const ops = await this.generateOperationsForIssue(issue, analysisResult.projectPath);
      operations.push(...ops);
    }

    // Sort operations by priority and safety
    operations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const safetyOrder = { safe: 0, 'requires-approval': 1, destructive: 2 };

      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return safetyOrder[a.safety] - safetyOrder[b.safety];
    });

    // Calculate summary
    const summary = {
      totalOperations: operations.length,
      safeOperations: operations.filter(op => op.safety === 'safe').length,
      requiresApproval: operations.filter(op => op.safety === 'requires-approval').length,
      destructiveOperations: operations.filter(op => op.safety === 'destructive').length
    };

    // Calculate estimated impact
    const estimatedImpact = {
      filesAffected: operations.filter(op => op.type === 'move' || op.type === 'rename').length,
      directoriesCreated: operations.filter(op => op.type === 'create_dir').length,
      directoriesRemoved: operations.filter(op => op.type === 'delete').length
    };

    const plan: MigrationPlan = {
      projectPath: analysisResult.projectPath,
      createdAt: new Date(),
      operations,
      summary,
      estimatedImpact
    };

    // Generate migration script if enabled
    if (this.config.generateScripts) {
      plan.scriptPath = await this.generateMigrationScript(plan);
    }

    this.emit('plan:generated', plan);
    return plan;
  }

  /**
   * Generate migration operations for a specific issue
   */
  private async generateOperationsForIssue(
    issue: RepositoryIssue,
    projectPath: string
  ): Promise<MigrationOperation[]> {
    const operations: MigrationOperation[] = [];

    // Map category and recommendation to operations
    switch (issue.category) {
      case 'missing':
        // Create missing directories based on recommendation
        const createMatch = issue.recommendation.match(/Create (.+?) directory/);
        if (createMatch) {
          operations.push({
            type: 'create_dir',
            destination: join(projectPath, createMatch[1]),
            reason: issue.description,
            safety: 'safe',
            priority: issue.severity === 'P0' ? 'high' : 'medium'
          });
        }
        break;

      case 'organization':
        // Move misplaced files based on recommendation
        if (issue.files && issue.files.length > 0) {
          const moveMatch = issue.recommendation.match(/Move to (.+)/);
          if (moveMatch) {
            for (const file of issue.files) {
              operations.push({
                type: 'move',
                source: join(projectPath, file),
                destination: join(projectPath, moveMatch[1], basename(file)),
                reason: issue.description,
                safety: 'requires-approval',
                priority: issue.severity === 'P0' ? 'high' : 'low'
              });
            }
          }
        }
        break;

      case 'cleanup':
        // Delete files based on recommendation
        if (issue.files && issue.files.length > 0) {
          for (const file of issue.files) {
            if (file.includes('node_modules') || file.includes('.DS_Store') ||
                file.includes('dist/') || file.includes('build/')) {
              operations.push({
                type: 'delete',
                source: join(projectPath, file),
                reason: issue.description,
                safety: 'safe', // Safe to delete build artifacts
                priority: 'low'
              });
            }
          }
        }
        break;

      case 'structure':
      case 'security':
        // These typically require manual intervention
        // We'll generate a note in the migration plan but no automatic operations
        break;
    }

    return operations;
  }

  /**
   * Generate executable bash script for migration
   */
  private async generateMigrationScript(plan: MigrationPlan): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scriptDir = join(plan.projectPath, this.config.scriptDir);
    const scriptPath = join(scriptDir, `migrate-${timestamp}.sh`);

    // Ensure script directory exists
    await fs.mkdir(scriptDir, { recursive: true });

    // Generate script content
    let scriptContent = `#!/bin/bash
# Repository Structure Migration Script
# Generated: ${new Date().toISOString()}
# Total Operations: ${plan.operations.length}

set -e  # Exit on error

# Color output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo -e "\${GREEN}Starting repository migration...\${NC}"
echo "Total operations: ${plan.operations.length}"
echo ""

`;

    // Add backup creation
    if (this.config.createBackup) {
      scriptContent += `# Create backup
BACKUP_DIR="${this.config.backupDir}/backup-${timestamp}"
echo -e "\${YELLOW}Creating backup at \$BACKUP_DIR...\${NC}"
mkdir -p "\$BACKUP_DIR"

`;
    }

    // Add each operation
    let opIndex = 1;
    for (const op of plan.operations) {
      scriptContent += `# Operation ${opIndex}: ${op.type} - ${op.safety}\n`;
      scriptContent += `echo -e "\${YELLOW}[${opIndex}/${plan.operations.length}] ${op.reason}\${NC}"\n`;

      switch (op.type) {
        case 'create_dir':
          scriptContent += `mkdir -p "${op.destination}"\n`;
          break;

        case 'move':
          if (this.config.createBackup && op.source) {
            scriptContent += `# Backup source file\n`;
            scriptContent += `cp -r "${op.source}" "\$BACKUP_DIR/$(basename "${op.source}")" 2>/dev/null || true\n`;
          }
          scriptContent += `# Ensure destination directory exists\n`;
          scriptContent += `mkdir -p "$(dirname "${op.destination}")"\n`;
          scriptContent += `# Move file\n`;
          scriptContent += `mv "${op.source}" "${op.destination}"\n`;
          break;

        case 'rename':
          if (this.config.createBackup && op.source) {
            scriptContent += `cp -r "${op.source}" "\$BACKUP_DIR/$(basename "${op.source}")" 2>/dev/null || true\n`;
          }
          scriptContent += `mv "${op.source}" "${op.destination}"\n`;
          break;

        case 'delete':
          if (this.config.createBackup && op.source) {
            scriptContent += `cp -r "${op.source}" "\$BACKUP_DIR/$(basename "${op.source}")" 2>/dev/null || true\n`;
          }
          scriptContent += `rm -rf "${op.source}"\n`;
          break;
      }

      scriptContent += `\n`;
      opIndex++;
    }

    scriptContent += `echo -e "\${GREEN}Migration completed successfully!\${NC}"
echo ""
echo "Operations executed: ${plan.operations.length}"
`;

    if (this.config.createBackup) {
      scriptContent += `echo "Backup available at: \$BACKUP_DIR"
echo "To rollback, run: bash scripts/migrations/rollback-${timestamp}.sh"
`;
    }

    scriptContent += `\nexit 0\n`;

    // Write script file
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });

    // Generate rollback script if backup is enabled
    if (this.config.createBackup) {
      await this.generateRollbackScript(plan, timestamp);
    }

    this.emit('script:generated', { scriptPath, operations: plan.operations.length });
    return scriptPath;
  }

  /**
   * Generate rollback script
   */
  private async generateRollbackScript(plan: MigrationPlan, timestamp: string): Promise<void> {
    const scriptDir = join(plan.projectPath, this.config.scriptDir);
    const rollbackPath = join(scriptDir, `rollback-${timestamp}.sh`);

    let scriptContent = `#!/bin/bash
# Rollback Script for Migration ${timestamp}
# Generated: ${new Date().toISOString()}

set -e

BACKUP_DIR="${this.config.backupDir}/backup-${timestamp}"

if [ ! -d "\$BACKUP_DIR" ]; then
  echo "Error: Backup directory not found at \$BACKUP_DIR"
  exit 1
fi

echo "Rolling back migration..."
echo "Restoring from: \$BACKUP_DIR"

# Restore all files from backup
cp -r "\$BACKUP_DIR"/* ./

echo "Rollback completed successfully!"
exit 0
`;

    await fs.writeFile(rollbackPath, scriptContent, { mode: 0o755 });
  }

  /**
   * Execute migration plan
   */
  async executePlan(plan: MigrationPlan): Promise<MigrationResult> {
    this.emit('execution:started', { plan });

    const result: MigrationResult = {
      success: false,
      executedOperations: 0,
      failedOperations: 0,
      skippedOperations: 0,
      errors: [],
      rollbackAvailable: this.config.createBackup
    };

    // Create backup if enabled
    if (this.config.createBackup && !this.config.dryRun) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      result.backupPath = join(plan.projectPath, this.config.backupDir, `backup-${timestamp}`);
      await fs.mkdir(result.backupPath, { recursive: true });
      this.emit('backup:created', { path: result.backupPath });
    }

    // Execute each operation
    for (const operation of plan.operations) {
      // Check if operation requires approval
      if (this.config.requireApproval && operation.safety !== 'safe') {
        // In real implementation, this would prompt user for approval
        // For now, we skip operations requiring approval in automated mode
        result.skippedOperations++;
        this.emit('operation:skipped', { operation, reason: 'requires-approval' });
        continue;
      }

      // Skip destructive operations unless explicitly allowed
      if (operation.safety === 'destructive' && !this.config.autoFixSafe) {
        result.skippedOperations++;
        this.emit('operation:skipped', { operation, reason: 'destructive' });
        continue;
      }

      // Dry run mode - just log what would happen
      if (this.config.dryRun) {
        this.emit('operation:dry-run', { operation });
        result.executedOperations++;
        continue;
      }

      // Execute operation
      try {
        await this.executeOperation(operation, result.backupPath);
        result.executedOperations++;
        this.emit('operation:success', { operation });
      } catch (error: any) {
        result.failedOperations++;
        result.errors.push({ operation, error: error.message });
        this.emit('operation:failed', { operation, error: error.message });
      }
    }

    result.success = result.failedOperations === 0;
    this.emit('execution:completed', { result });
    return result;
  }

  /**
   * Execute a single migration operation
   */
  private async executeOperation(operation: MigrationOperation, backupPath?: string): Promise<void> {
    switch (operation.type) {
      case 'create_dir':
        if (operation.destination) {
          await fs.mkdir(operation.destination, { recursive: true });
        }
        break;

      case 'move':
      case 'rename':
        if (operation.source && operation.destination) {
          // Backup source if backup path provided
          if (backupPath) {
            const backupFile = join(backupPath, basename(operation.source));
            await fs.copyFile(operation.source, backupFile);
          }

          // Ensure destination directory exists
          await fs.mkdir(dirname(operation.destination), { recursive: true });

          // Move file
          await fs.rename(operation.source, operation.destination);
        }
        break;

      case 'delete':
        if (operation.source) {
          // Backup before delete if backup path provided
          if (backupPath) {
            const backupFile = join(backupPath, basename(operation.source));
            try {
              await fs.copyFile(operation.source, backupFile);
            } catch (err) {
              // Source might be a directory, try recursive copy
              await fs.cp(operation.source, backupFile, { recursive: true });
            }
          }

          // Delete file/directory
          await fs.rm(operation.source, { recursive: true, force: true });
        }
        break;
    }
  }

  /**
   * Preview migration plan (formatted output)
   */
  formatPlanPreview(plan: MigrationPlan): string {
    let output = `
📋 Migration Plan Preview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: ${plan.projectPath}
Generated: ${plan.createdAt.toISOString()}

📊 Summary:
  • Total Operations: ${plan.summary.totalOperations}
  • Safe Operations: ${plan.summary.safeOperations}
  • Requires Approval: ${plan.summary.requiresApproval}
  • Destructive Operations: ${plan.summary.destructiveOperations}

📈 Estimated Impact:
  • Files Affected: ${plan.estimatedImpact.filesAffected}
  • Directories Created: ${plan.estimatedImpact.directoriesCreated}
  • Directories Removed: ${plan.estimatedImpact.directoriesRemoved}

🔧 Operations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    let opNum = 1;
    for (const op of plan.operations) {
      const safetyIcon = op.safety === 'safe' ? '✅' : op.safety === 'destructive' ? '🚨' : '⚠️';
      const priorityIcon = op.priority === 'high' ? '🔴' : op.priority === 'medium' ? '🟡' : '🟢';

      output += `${opNum}. [${op.type.toUpperCase()}] ${safetyIcon} ${priorityIcon}\n`;
      output += `   Reason: ${op.reason}\n`;

      if (op.source) {
        output += `   From: ${relative(plan.projectPath, op.source)}\n`;
      }
      if (op.destination) {
        output += `   To: ${relative(plan.projectPath, op.destination)}\n`;
      }

      output += `\n`;
      opNum++;
    }

    if (plan.scriptPath) {
      output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Migration Script: ${relative(plan.projectPath, plan.scriptPath)}
   Run with: bash ${relative(plan.projectPath, plan.scriptPath)}
`;
    }

    return output;
  }
}
