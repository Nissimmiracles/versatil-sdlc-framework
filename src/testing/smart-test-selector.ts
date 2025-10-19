/**
 * Smart Test Selector
 * Selects only affected tests based on git diff and dependency analysis
 *
 * Version: 1.0.0
 * Purpose: Reduce test execution time by 60-80% through intelligent test selection
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { TestType } from './test-trigger-matrix.js';

const execAsync = promisify(exec);

export interface TestSelection {
  direct: string[];      // Direct test files for changed code
  indirect: string[];    // Integration/E2E tests affected by changes
  all: string[];         // Combined list
  estimatedDuration: number; // milliseconds
  reasoning: string[];   // Why these tests were selected
}

export interface DependencyGraph {
  [filePath: string]: {
    imports: string[];       // Files this file imports
    importedBy: string[];    // Files that import this file
    testFiles: string[];     // Test files for this file
  };
}

export class SmartTestSelector {
  private projectRoot: string;
  private dependencyGraph: DependencyGraph = {};
  private testFilePatterns = [
    /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    /\/__tests__\//
  ];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Select tests to run based on changed files
   */
  async selectTests(
    changedFiles: string[],
    testTypes: TestType[],
    options: {
      includeIndirect?: boolean;
      maxTests?: number;
      fullSuiteThreshold?: number;
    } = {}
  ): Promise<TestSelection> {
    const {
      includeIndirect = true,
      maxTests = 50,
      fullSuiteThreshold = 20
    } = options;

    const reasoning: string[] = [];

    // If too many files changed, run full suite
    if (changedFiles.length >= fullSuiteThreshold) {
      reasoning.push(
        `Running full test suite: ${changedFiles.length} files changed (>= ${fullSuiteThreshold} threshold)`
      );
      return {
        direct: [],
        indirect: [],
        all: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
        estimatedDuration: 600000, // 10 minutes for full suite
        reasoning
      };
    }

    // Build dependency graph if not already built
    if (Object.keys(this.dependencyGraph).length === 0) {
      reasoning.push('Building dependency graph...');
      await this.buildDependencyGraph();
    }

    const directTests = new Set<string>();
    const indirectTests = new Set<string>();

    // Find direct test files
    for (const file of changedFiles) {
      const filePath = this.normalizeFilePath(file);

      // Is this file itself a test?
      if (this.isTestFile(filePath)) {
        directTests.add(filePath);
        reasoning.push(`Direct: ${filePath} (test file was modified)`);
        continue;
      }

      // Find direct test files for this source file
      const testFile = await this.findTestFile(filePath);
      if (testFile && existsSync(testFile)) {
        directTests.add(testFile);
        reasoning.push(`Direct: ${testFile} (tests ${filePath})`);
      }

      // Find tests in dependency graph
      const graphEntry = this.dependencyGraph[filePath];
      if (graphEntry?.testFiles) {
        graphEntry.testFiles.forEach(test => {
          directTests.add(test);
          reasoning.push(`Direct: ${test} (imports ${filePath})`);
        });
      }

      // Find indirect tests if enabled
      if (includeIndirect) {
        const indirectTestFiles = await this.findIndirectTests(filePath);
        indirectTestFiles.forEach(test => {
          if (!directTests.has(test)) {
            indirectTests.add(test);
            reasoning.push(`Indirect: ${test} (depends on ${filePath})`);
          }
        });
      }
    }

    // Convert to arrays
    const direct = Array.from(directTests);
    const indirect = Array.from(indirectTests);
    const all = [...direct, ...indirect];

    // Limit number of tests if needed
    if (all.length > maxTests) {
      reasoning.push(
        `Limiting tests to ${maxTests} (found ${all.length}). Consider running full suite.`
      );
      all.splice(maxTests);
    }

    // Estimate duration (assume 2 seconds per test on average)
    const estimatedDuration = all.length * 2000;

    reasoning.push(
      `Total tests selected: ${all.length} (${direct.length} direct + ${indirect.length} indirect)`
    );
    reasoning.push(`Estimated duration: ${(estimatedDuration / 1000).toFixed(1)}s`);

    return {
      direct,
      indirect,
      all,
      estimatedDuration,
      reasoning
    };
  }

  /**
   * Get changed files from git diff
   */
  async getChangedFiles(sinceCommit?: string): Promise<string[]> {
    try {
      const command = sinceCommit
        ? `git diff --name-only ${sinceCommit}`
        : 'git diff --name-only HEAD';

      const { stdout } = await execAsync(command, {
        cwd: this.projectRoot
      });

      return stdout
        .split('\n')
        .filter(Boolean)
        .map(file => join(this.projectRoot, file));
    } catch (error) {
      console.error('[SmartTestSelector] Error getting changed files:', error);
      return [];
    }
  }

  /**
   * Build dependency graph for the project
   */
  private async buildDependencyGraph(): Promise<void> {
    try {
      // Get all source files
      const { stdout } = await execAsync(
        'find src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)',
        { cwd: this.projectRoot }
      );

      const files = stdout.split('\n').filter(Boolean);

      // Analyze each file
      for (const file of files) {
        const filePath = join(this.projectRoot, file);
        await this.analyzeFile(filePath);
      }

      // Build reverse dependencies (importedBy)
      this.buildReverseReferences();
    } catch (error) {
      console.error('[SmartTestSelector] Error building dependency graph:', error);
    }
  }

  /**
   * Analyze a file and extract imports
   */
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const imports = this.extractImports(content, filePath);

      const isTest = this.isTestFile(filePath);

      // Initialize graph entry if not exists
      if (!this.dependencyGraph[filePath]) {
        this.dependencyGraph[filePath] = {
          imports: [],
          importedBy: [],
          testFiles: []
        };
      }

      this.dependencyGraph[filePath].imports = imports;

      // If this is a test file, add it to tested files' testFiles array
      if (isTest) {
        const testedFile = this.getTestedFile(filePath);
        if (testedFile && this.dependencyGraph[testedFile]) {
          this.dependencyGraph[testedFile].testFiles.push(filePath);
        }

        // Also add to all imported files' testFiles
        imports.forEach(importedFile => {
          if (this.dependencyGraph[importedFile]) {
            this.dependencyGraph[importedFile].testFiles.push(filePath);
          }
        });
      }
    } catch (error) {
      // Silently skip files that can't be read
    }
  }

  /**
   * Extract import statements from file content
   */
  private extractImports(content: string, filePath: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

    let match;

    // ES6 imports
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = this.resolveImportPath(match[1], filePath);
      if (importPath) {
        imports.push(importPath);
      }
    }

    // CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = this.resolveImportPath(match[1], filePath);
      if (importPath) {
        imports.push(importPath);
      }
    }

    return imports;
  }

  /**
   * Resolve relative import path to absolute path
   */
  private resolveImportPath(importStr: string, fromFile: string): string | null {
    // Skip node_modules imports
    if (!importStr.startsWith('.') && !importStr.startsWith('/')) {
      return null;
    }

    const fromDir = dirname(fromFile);
    let resolvedPath = join(fromDir, importStr);

    // Try adding extensions if file doesn't exist
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }

    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    return null;
  }

  /**
   * Build reverse references (importedBy) in dependency graph
   */
  private buildReverseReferences(): void {
    for (const [filePath, entry] of Object.entries(this.dependencyGraph)) {
      entry.imports.forEach(importedFile => {
        if (this.dependencyGraph[importedFile]) {
          this.dependencyGraph[importedFile].importedBy.push(filePath);
        }
      });
    }
  }

  /**
   * Find test file for a source file
   */
  private async findTestFile(sourceFile: string): Promise<string | null> {
    const baseName = sourceFile.replace(/\.(ts|tsx|js|jsx)$/, '');
    const dir = dirname(sourceFile);

    // Common test file patterns
    const patterns = [
      `${baseName}.test.ts`,
      `${baseName}.test.tsx`,
      `${baseName}.spec.ts`,
      `${baseName}.spec.tsx`,
      join(dir, '__tests__', `${relative(dir, baseName)}.test.ts`),
      join(dir, '__tests__', `${relative(dir, baseName)}.test.tsx`)
    ];

    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Find indirect tests affected by a file change
   */
  private async findIndirectTests(sourceFile: string): Promise<string[]> {
    const indirectTests = new Set<string>();
    const visited = new Set<string>();

    const traverse = (filePath: string, depth: number = 0) => {
      // Limit depth to prevent infinite loops and excessive searches
      if (depth > 3 || visited.has(filePath)) {
        return;
      }

      visited.add(filePath);

      const entry = this.dependencyGraph[filePath];
      if (!entry) {
        return;
      }

      // Add test files of files that import this file
      entry.importedBy.forEach(importingFile => {
        const importingEntry = this.dependencyGraph[importingFile];
        if (importingEntry?.testFiles) {
          importingEntry.testFiles.forEach(test => indirectTests.add(test));
        }

        // Recursively traverse
        traverse(importingFile, depth + 1);
      });
    };

    traverse(sourceFile);

    return Array.from(indirectTests);
  }

  /**
   * Check if a file is a test file
   */
  private isTestFile(filePath: string): boolean {
    return this.testFilePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Get source file being tested by a test file
   */
  private getTestedFile(testFile: string): string | null {
    // Remove test suffix and __tests__ directory
    let sourceFile = testFile
      .replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '.ts')
      .replace(/\/__tests__\//, '/');

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (const ext of extensions) {
      const pathWithExt = sourceFile.replace(/\.(ts|tsx|js|jsx)$/, ext);
      if (existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    return null;
  }

  /**
   * Normalize file path (relative to project root)
   */
  private normalizeFilePath(filePath: string): string {
    if (filePath.startsWith(this.projectRoot)) {
      return filePath;
    }
    return join(this.projectRoot, filePath);
  }

  /**
   * Clear dependency graph cache (call after major file changes)
   */
  clearCache(): void {
    this.dependencyGraph = {};
  }
}

export default SmartTestSelector;
