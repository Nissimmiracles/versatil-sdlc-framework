/**
 * VERSATIL SDLC Framework - Coding Style Detector
 *
 * Auto-detects user coding style from git commits and existing code
 * Part of Layer 3 (User/Team Context) - Task 8
 *
 * Features:
 * - Analyze indentation patterns
 * - Detect naming conventions
 * - Identify comment patterns
 * - Auto-populate UserCodingPreferences
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { UserCodingPreferences } from './user-context-manager.js';

const execAsync = promisify(exec);

// ==================== INTERFACES ====================

export interface CodeAnalysisResult {
  confidence: number; // 0-1
  samples: number;
  detectedPreferences: Partial<UserCodingPreferences>;
  analysis: {
    indentation: { tabs: number; spaces2: number; spaces4: number };
    naming: { camel: number; snake: number; pascal: number };
    quotes: { single: number; double: number; backticks: number };
    semicolons: { present: number; absent: number };
  };
}

// ==================== CODING STYLE DETECTOR ====================

export class CodingStyleDetector {
  /**
   * Analyze user's git commits to detect coding style
   */
  async analyzeGitHistory(repoPath: string, userId?: string, maxCommits: number = 100): Promise<CodeAnalysisResult> {
    const result: CodeAnalysisResult = {
      confidence: 0,
      samples: 0,
      detectedPreferences: {},
      analysis: {
        indentation: { tabs: 0, spaces2: 0, spaces4: 0 },
        naming: { camel: 0, snake: 0, pascal: 0 },
        quotes: { single: 0, double: 0, backticks: 0 },
        semicolons: { present: 0, absent: 0 }
      }
    };

    try {
      // Get recent commits (optionally filter by user)
      const authorFilter = userId ? `--author="${userId}"` : '';
      const { stdout } = await execAsync(
        `cd "${repoPath}" && git log ${authorFilter} --pretty=format:"%H" --max-count=${maxCommits}`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      );

      const commits = stdout.trim().split('\n').filter(Boolean);

      for (const commitHash of commits) {
        try {
          // Get files changed in commit
          const { stdout: filesOutput } = await execAsync(
            `cd "${repoPath}" && git diff-tree --no-commit-id --name-only -r ${commitHash}`
          );

          const files = filesOutput.trim().split('\n').filter(f => this.isCodeFile(f));

          for (const file of files) {
            try {
              // Get file diff
              const { stdout: diffOutput } = await execAsync(
                `cd "${repoPath}" && git show ${commitHash}:${file}`
              );

              this.analyzeCode(diffOutput, result);
              result.samples++;
            } catch {
              // File might not exist or be binary
              continue;
            }
          }
        } catch {
          // Skip commits that error
          continue;
        }
      }

      // Calculate preferences from analysis
      result.detectedPreferences = this.calculatePreferences(result.analysis);
      result.confidence = this.calculateConfidence(result.samples, result.analysis);

      console.log(`✅ Analyzed ${result.samples} code samples from ${commits.length} commits`);
      console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);

    } catch (error: any) {
      console.warn(`⚠️ Failed to analyze git history: ${error.message}`);
    }

    return result;
  }

  /**
   * Analyze code files in a directory
   */
  async analyzeDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): Promise<CodeAnalysisResult> {
    const result: CodeAnalysisResult = {
      confidence: 0,
      samples: 0,
      detectedPreferences: {},
      analysis: {
        indentation: { tabs: 0, spaces2: 0, spaces4: 0 },
        naming: { camel: 0, snake: 0, pascal: 0 },
        quotes: { single: 0, double: 0, backticks: 0 },
        semicolons: { present: 0, absent: 0 }
      }
    };

    try {
      const files = await this.findCodeFiles(dirPath, extensions);

      for (const file of files.slice(0, 100)) { // Limit to 100 files
        try {
          const code = await fs.readFile(file, 'utf-8');
          this.analyzeCode(code, result);
          result.samples++;
        } catch {
          continue;
        }
      }

      result.detectedPreferences = this.calculatePreferences(result.analysis);
      result.confidence = this.calculateConfidence(result.samples, result.analysis);

      console.log(`✅ Analyzed ${result.samples} code files in ${dirPath}`);
      console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);

    } catch (error: any) {
      console.warn(`⚠️ Failed to analyze directory: ${error.message}`);
    }

    return result;
  }

  /**
   * Analyze single code snippet
   */
  analyzeCode(code: string, result: CodeAnalysisResult): void {
    const lines = code.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      if (line.trim().length === 0 || line.trim().startsWith('//')) {
        continue;
      }

      // Detect indentation
      const leadingWhitespace = line.match(/^(\s+)/);
      if (leadingWhitespace) {
        const spaces = leadingWhitespace[1];
        if (spaces.includes('\t')) {
          result.analysis.indentation.tabs++;
        } else if (spaces.length === 2) {
          result.analysis.indentation.spaces2++;
        } else if (spaces.length === 4) {
          result.analysis.indentation.spaces4++;
        }
      }

      // Detect naming conventions
      const identifiers = line.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      if (identifiers) {
        for (const id of identifiers) {
          if (id.match(/^[a-z]+[A-Z]/)) {
            result.analysis.naming.camel++; // camelCase
          } else if (id.match(/_/)) {
            result.analysis.naming.snake++; // snake_case
          } else if (id.match(/^[A-Z][a-z]/)) {
            result.analysis.naming.pascal++; // PascalCase
          }
        }
      }

      // Detect quotes
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      const backticks = (line.match(/`/g) || []).length;

      result.analysis.quotes.single += singleQuotes;
      result.analysis.quotes.double += doubleQuotes;
      result.analysis.quotes.backticks += backticks;

      // Detect semicolons
      if (line.trim().endsWith(';')) {
        result.analysis.semicolons.present++;
      } else if (line.trim().length > 0 && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        result.analysis.semicolons.absent++;
      }
    }
  }

  /**
   * Calculate preferences from analysis
   */
  private calculatePreferences(analysis: CodeAnalysisResult['analysis']): Partial<UserCodingPreferences> {
    const prefs: Partial<UserCodingPreferences> = {};

    // Indentation
    const { tabs, spaces2, spaces4 } = analysis.indentation;
    if (tabs > spaces2 && tabs > spaces4) {
      prefs.indentation = 'tabs';
      prefs.indentSize = 1;
    } else if (spaces2 > spaces4) {
      prefs.indentation = 'spaces';
      prefs.indentSize = 2;
    } else {
      prefs.indentation = 'spaces';
      prefs.indentSize = 4;
    }

    // Naming (variables/functions)
    const { camel, snake, pascal } = analysis.naming;
    if (camel > snake && camel > pascal) {
      prefs.naming = {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_CASE',
        files: 'kebab-case'
      };
    } else if (snake > camel && snake > pascal) {
      prefs.naming = {
        variables: 'snake_case',
        functions: 'snake_case',
        classes: 'PascalCase',
        constants: 'UPPER_CASE',
        files: 'snake_case'
      };
    }

    // Quotes
    const { single, double, backticks } = analysis.quotes;
    if (single > double && single > backticks) {
      prefs.quotes = 'single';
    } else if (backticks > single && backticks > double) {
      prefs.quotes = 'backticks';
    } else {
      prefs.quotes = 'double';
    }

    // Semicolons
    const { present, absent } = analysis.semicolons;
    if (present > absent * 2) {
      prefs.semicolons = 'always';
    } else if (absent > present * 2) {
      prefs.semicolons = 'never';
    } else {
      prefs.semicolons = 'auto';
    }

    return prefs;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(samples: number, analysis: CodeAnalysisResult['analysis']): number {
    if (samples < 5) return 0.3; // Low confidence with few samples
    if (samples < 10) return 0.5;
    if (samples < 20) return 0.7;

    // Check consistency in preferences
    let consistencyScore = 0;
    let checks = 0;

    // Indentation consistency
    const totalIndent = analysis.indentation.tabs + analysis.indentation.spaces2 + analysis.indentation.spaces4;
    if (totalIndent > 0) {
      const maxIndent = Math.max(analysis.indentation.tabs, analysis.indentation.spaces2, analysis.indentation.spaces4);
      consistencyScore += maxIndent / totalIndent;
      checks++;
    }

    // Naming consistency
    const totalNaming = analysis.naming.camel + analysis.naming.snake + analysis.naming.pascal;
    if (totalNaming > 0) {
      const maxNaming = Math.max(analysis.naming.camel, analysis.naming.snake, analysis.naming.pascal);
      consistencyScore += maxNaming / totalNaming;
      checks++;
    }

    // Quotes consistency
    const totalQuotes = analysis.quotes.single + analysis.quotes.double + analysis.quotes.backticks;
    if (totalQuotes > 0) {
      const maxQuotes = Math.max(analysis.quotes.single, analysis.quotes.double, analysis.quotes.backticks);
      consistencyScore += maxQuotes / totalQuotes;
      checks++;
    }

    const avgConsistency = checks > 0 ? consistencyScore / checks : 0.5;

    // Combine sample count confidence with consistency
    const baseConfidence = Math.min(samples / 50, 0.9); // Max 0.9 from samples
    return (baseConfidence * 0.5) + (avgConsistency * 0.5);
  }

  /**
   * Find code files in directory recursively
   */
  private async findCodeFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip node_modules, .git, etc.
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findCodeFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }

    return files;
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.vue', '.svelte'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }
}

// Export singleton instance
export const codingStyleDetector = new CodingStyleDetector();

// Helper function for import in node
import { join } from 'path';
