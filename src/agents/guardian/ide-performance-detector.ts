/**
 * VERSATIL SDLC Framework - IDE Performance Detector
 *
 * Detects IDE crash risks by analyzing:
 * - IDE type (Cursor, VSCode, JetBrains)
 * - Missing ignore files (.cursorignore, .vscode/settings.json)
 * - Large directory sizes (node_modules, dist, .git)
 * - Available RAM vs indexable size
 *
 * Part of Guardian's proactive IDE optimization system (v7.15.0+)
 *
 * @version 7.15.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type IDEType = 'cursor' | 'vscode' | 'jetbrains' | 'unknown';
export type CrashRisk = 'low' | 'medium' | 'high' | 'critical';

export interface IDECrashRisk {
  ide_type: IDEType;
  crash_risk: CrashRisk;
  confidence: number; // 0-100
  evidence: {
    missing_ignore_files: string[];
    large_directories: Array<{ path: string; size_mb: number }>;
    total_indexable_size_gb: number;
    available_ram_gb: number;
    current_memory_usage_percent: number;
    ide_memory_usage_mb?: number;
  };
  recommendation: string;
  auto_fixable: boolean; // true if confidence ≥90%
  suggested_fixes: string[];
}

export interface DirectorySize {
  path: string;
  size_bytes: number;
  size_mb: number;
  size_gb: number;
}

/**
 * IDE Performance Detector
 * Analyzes IDE crash risk and suggests optimizations
 */
export class IDEPerformanceDetector {
  private static instance: IDEPerformanceDetector;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(projectRoot?: string): IDEPerformanceDetector {
    if (!IDEPerformanceDetector.instance) {
      IDEPerformanceDetector.instance = new IDEPerformanceDetector(projectRoot);
    }
    return IDEPerformanceDetector.instance;
  }

  /**
   * Detect IDE crash risk
   * Returns comprehensive analysis with confidence scoring
   */
  public async detectCrashRisk(): Promise<IDECrashRisk> {
    // Step 1: Detect IDE type
    const ideType = await this.detectIDEType();

    // Step 2: Check for missing ignore files
    const missingFiles = this.checkMissingIgnoreFiles(ideType);

    // Step 3: Calculate large directory sizes
    const largeDirectories = await this.detectLargeDirectories();

    // Step 4: Get system memory info
    const memoryInfo = await this.getSystemMemoryInfo();

    // Step 5: Calculate total indexable size
    const totalIndexableSizeGB = largeDirectories.reduce((sum, dir) => sum + dir.size_mb, 0) / 1024;

    // Step 6: Calculate crash risk
    const crashRisk = this.calculateCrashRisk(
      missingFiles,
      totalIndexableSizeGB,
      memoryInfo.available_ram_gb,
      memoryInfo.current_memory_usage_percent
    );

    // Step 7: Calculate confidence
    const confidence = this.calculateConfidence(
      ideType,
      missingFiles.length,
      largeDirectories.length,
      memoryInfo.available_ram_gb
    );

    // Step 8: Generate recommendation
    const recommendation = this.generateRecommendation(
      ideType,
      crashRisk,
      missingFiles,
      totalIndexableSizeGB
    );

    // Step 9: Suggest fixes
    const suggestedFixes = this.generateSuggestedFixes(ideType, missingFiles, largeDirectories);

    return {
      ide_type: ideType,
      crash_risk: crashRisk,
      confidence,
      evidence: {
        missing_ignore_files: missingFiles,
        large_directories: largeDirectories.map(d => ({ path: d.path, size_mb: d.size_mb })),
        total_indexable_size_gb: totalIndexableSizeGB,
        available_ram_gb: memoryInfo.available_ram_gb,
        current_memory_usage_percent: memoryInfo.current_memory_usage_percent,
        ide_memory_usage_mb: memoryInfo.ide_memory_usage_mb
      },
      recommendation,
      auto_fixable: confidence >= 90 && missingFiles.length > 0,
      suggested_fixes: suggestedFixes
    };
  }

  /**
   * Detect IDE type from running processes
   */
  private async detectIDEType(): Promise<IDEType> {
    try {
      const { stdout } = await execAsync('ps aux | grep -iE "cursor|vscode|idea|webstorm" | grep -v grep');

      if (stdout.includes('Cursor')) {
        return 'cursor';
      } else if (stdout.includes('Code') || stdout.includes('VSCode')) {
        return 'vscode';
      } else if (stdout.includes('idea') || stdout.includes('WebStorm')) {
        return 'jetbrains';
      }

      return 'unknown';
    } catch {
      // No IDE detected or command failed
      return 'unknown';
    }
  }

  /**
   * Check for missing IDE ignore files
   */
  private checkMissingIgnoreFiles(ideType: IDEType): string[] {
    const missingFiles: string[] = [];

    const cursorIgnore = path.join(this.projectRoot, '.cursorignore');
    const vscodeSettings = path.join(this.projectRoot, '.vscode', 'settings.json');
    const ideaGitignore = path.join(this.projectRoot, '.idea', '.gitignore');

    if (ideType === 'cursor' || ideType === 'vscode' || ideType === 'unknown') {
      if (!fs.existsSync(cursorIgnore)) {
        missingFiles.push('.cursorignore');
      }

      if (!fs.existsSync(vscodeSettings)) {
        missingFiles.push('.vscode/settings.json');
      }
    }

    if (ideType === 'jetbrains') {
      if (!fs.existsSync(ideaGitignore)) {
        missingFiles.push('.idea/.gitignore');
      }
    }

    return missingFiles;
  }

  /**
   * Detect large directories that should be ignored
   * Returns directories > 10MB
   */
  private async detectLargeDirectories(): Promise<DirectorySize[]> {
    const largeDirectories: DirectorySize[] = [];
    const checkDirectories = [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      'logs',
      '.versatil/logs',
      '.versatil/rag',
      'tmp',
      'temp'
    ];

    for (const dir of checkDirectories) {
      const fullPath = path.join(this.projectRoot, dir);

      if (!fs.existsSync(fullPath)) {
        continue;
      }

      try {
        const { stdout } = await execAsync(`du -sk "${fullPath}" 2>/dev/null || echo "0"`);
        const sizeKB = parseInt(stdout.trim().split('\t')[0] || '0', 10);
        const sizeBytes = sizeKB * 1024;
        const sizeMB = sizeBytes / (1024 * 1024);

        // Only include directories > 10MB
        if (sizeMB > 10) {
          largeDirectories.push({
            path: dir,
            size_bytes: sizeBytes,
            size_mb: Math.round(sizeMB),
            size_gb: Math.round((sizeBytes / (1024 * 1024 * 1024)) * 100) / 100
          });
        }
      } catch {
        // Skip directories that can't be accessed
      }
    }

    return largeDirectories.sort((a, b) => b.size_bytes - a.size_bytes);
  }

  /**
   * Get system memory information
   */
  private async getSystemMemoryInfo(): Promise<{
    available_ram_gb: number;
    current_memory_usage_percent: number;
    ide_memory_usage_mb?: number;
  }> {
    try {
      // Get total RAM
      const { stdout: totalRamOutput } = await execAsync('sysctl hw.memsize');
      const totalRamBytes = parseInt(totalRamOutput.split(':')[1].trim(), 10);
      const totalRamGB = totalRamBytes / (1024 * 1024 * 1024);

      // Get current memory usage
      const { stdout: memPressure } = await execAsync(
        'ps aux | awk \'{sum+=$4} END {print sum}\''
      );
      const currentMemoryUsagePercent = parseFloat(memPressure.trim()) || 0;

      // Try to get IDE memory usage
      let ideMemoryUsageMB: number | undefined;
      try {
        const { stdout: ideMemory } = await execAsync(
          'ps aux | grep -iE "Cursor|Code|VSCode|idea" | grep -v grep | awk \'{sum+=$6} END {print sum}\''
        );
        const ideMemoryKB = parseFloat(ideMemory.trim()) || 0;
        ideMemoryUsageMB = Math.round(ideMemoryKB / 1024);
      } catch {
        // IDE memory usage unavailable
      }

      return {
        available_ram_gb: Math.round(totalRamGB * 100) / 100,
        current_memory_usage_percent: Math.round(currentMemoryUsagePercent * 10) / 10,
        ide_memory_usage_mb: ideMemoryUsageMB
      };
    } catch {
      // Fallback values if system info unavailable
      return {
        available_ram_gb: 16, // Assume 16GB
        current_memory_usage_percent: 50,
        ide_memory_usage_mb: undefined
      };
    }
  }

  /**
   * Calculate crash risk based on evidence
   */
  private calculateCrashRisk(
    missingFiles: string[],
    totalIndexableSizeGB: number,
    availableRamGB: number,
    currentMemoryUsagePercent: number
  ): CrashRisk {
    // Critical: Missing ignore files + indexable size > 50% RAM + high memory usage
    if (
      missingFiles.length > 0 &&
      totalIndexableSizeGB > availableRamGB * 0.5 &&
      currentMemoryUsagePercent > 70
    ) {
      return 'critical';
    }

    // High: Missing ignore files + indexable size > 30% RAM
    if (missingFiles.length > 0 && totalIndexableSizeGB > availableRamGB * 0.3) {
      return 'high';
    }

    // Medium: Missing ignore files + indexable size > 10% RAM
    if (missingFiles.length > 0 && totalIndexableSizeGB > availableRamGB * 0.1) {
      return 'medium';
    }

    // Low: No missing files or small indexable size
    return 'low';
  }

  /**
   * Calculate confidence in crash risk detection
   */
  private calculateConfidence(
    ideType: IDEType,
    missingFilesCount: number,
    largeDirectoriesCount: number,
    availableRamGB: number
  ): number {
    let confidence = 0;

    // IDE type detected: +30
    if (ideType !== 'unknown') {
      confidence += 30;
    }

    // Missing ignore files: +40
    if (missingFilesCount > 0) {
      confidence += 40;
    }

    // Large directories detected: +20
    if (largeDirectoriesCount > 0) {
      confidence += 20;
    }

    // System memory info available: +10
    if (availableRamGB > 0) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Generate recommendation message
   */
  private generateRecommendation(
    ideType: IDEType,
    crashRisk: CrashRisk,
    missingFiles: string[],
    totalIndexableSizeGB: number
  ): string {
    if (crashRisk === 'critical') {
      return `Critical IDE crash risk detected! ${totalIndexableSizeGB.toFixed(1)}GB of indexable files without ignore patterns. ` +
        `Create ${missingFiles.join(' and ')} immediately to prevent crashes.`;
    }

    if (crashRisk === 'high') {
      return `High IDE crash risk detected. ${totalIndexableSizeGB.toFixed(1)}GB of indexable files detected. ` +
        `Create ${missingFiles.join(' and ')} to improve IDE performance.`;
    }

    if (crashRisk === 'medium') {
      return `Moderate IDE performance impact detected. ${totalIndexableSizeGB.toFixed(1)}GB of indexable files. ` +
        `Consider creating ${missingFiles.join(' and ')} for better performance.`;
    }

    return `IDE performance looks good. ${totalIndexableSizeGB.toFixed(1)}GB indexable, but ignore files are configured.`;
  }

  /**
   * Generate suggested fixes
   */
  private generateSuggestedFixes(
    ideType: IDEType,
    missingFiles: string[],
    largeDirectories: DirectorySize[]
  ): string[] {
    const fixes: string[] = [];

    if (missingFiles.includes('.cursorignore')) {
      fixes.push('Create .cursorignore to exclude large directories from indexing');
    }

    if (missingFiles.includes('.vscode/settings.json')) {
      fixes.push('Create .vscode/settings.json with optimized file watching and TypeScript settings');
    }

    if (missingFiles.includes('.idea/.gitignore')) {
      fixes.push('Create .idea/.gitignore to exclude build artifacts from JetBrains indexing');
    }

    if (largeDirectories.some(d => d.path === 'node_modules' && d.size_gb > 2)) {
      fixes.push('Consider pruning unused dependencies - node_modules is unusually large');
    }

    if (largeDirectories.some(d => d.path === '.git' && d.size_mb > 100)) {
      fixes.push('Consider running git gc to optimize .git directory size');
    }

    if (fixes.length === 0) {
      fixes.push('No immediate fixes needed - IDE configuration looks optimal');
    }

    return fixes;
  }
}
