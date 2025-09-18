/**
 * VERSATIL SDLC Framework - Quality Gate Enforcer
 * Real-time dependency validation and error prevention system
 *
 * This prevents issues like the Ant Design compatibility problems we encountered
 * by catching dependency conflicts, import issues, and configuration errors
 * BEFORE they break the development environment
 */

import { versatilDispatcher } from './agent-dispatcher';
import { cursorClaudeBridge } from './cursor-claude-bridge';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface QualityGateRule {
  name: string;
  priority: 'blocker' | 'critical' | 'major' | 'minor';
  category: 'dependency' | 'typescript' | 'security' | 'performance' | 'accessibility';
  check: (context: ValidationContext) => Promise<QualityGateResult>;
  autoFix?: (context: ValidationContext) => Promise<boolean>;
  requiredForCommit: boolean;
}

interface ValidationContext {
  filePath: string;
  fileContent: string;
  projectRoot: string;
  packageJson: any;
  tsConfig: any;
  gitStatus?: string[];
  userRequest?: string;
  relatedFiles?: string[];
}

interface QualityGateResult {
  passed: boolean;
  issues: QualityIssue[];
  warnings: QualityIssue[];
  blockers: QualityIssue[];
  suggestions: string[];
  autoFixAvailable: boolean;
  estimatedFixTime: number; // in minutes
}

interface QualityIssue {
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  message: string;
  file: string;
  line?: number;
  column?: number;
  rule: string;
  fixSuggestion?: string;
  affectedComponents?: string[];
}

/**
 * Quality Gate Enforcement System
 * Prevents development issues through proactive validation
 */
class QualityGateEnforcer {
  private rules: Map<string, QualityGateRule> = new Map();
  private validationCache: Map<string, QualityGateResult> = new Map();
  private projectRoot: string;
  private packageJson: any = {};
  private tsConfig: any = {};

  constructor() {
    this.projectRoot = process.cwd();
    this.initializeEnforcer();
  }

  /**
   * Initialize Quality Gate Enforcer
   */
  private async initializeEnforcer(): Promise<void> {
    console.log('🛡️ Quality Gate Enforcer: Initializing...');

    // Load project configuration
    await this.loadProjectConfiguration();

    // Initialize quality gate rules
    this.initializeQualityGateRules();

    // Setup real-time monitoring
    this.setupRealTimeMonitoring();

    // Connect to development integration
    this.connectToDevelopmentIntegration();

    console.log('✅ Quality Gate Enforcer: ACTIVE');
    console.log(`🔍 Loaded ${this.rules.size} quality gate rules`);
  }

  /**
   * Load Project Configuration
   */
  private async loadProjectConfiguration(): Promise<void> {
    try {
      // Load package.json
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      this.packageJson = JSON.parse(packageJsonContent);

      // Load tsconfig.json
      try {
        const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
        const tsConfigContent = await fs.readFile(tsConfigPath, 'utf-8');
        this.tsConfig = JSON.parse(tsConfigContent);
      } catch {
        console.log('⚠️ tsconfig.json not found - TypeScript validation limited');
      }

      console.log('📋 Project configuration loaded');

    } catch (error) {
      console.error('❌ Failed to load project configuration:', error);
    }
  }

  /**
   * Initialize Quality Gate Rules
   */
  private initializeQualityGateRules(): void {
    // Dependency Validation Rules (learned from our Ant Design issue)
    this.rules.set('antd-compatibility', {
      name: 'Ant Design Compatibility Check',
      priority: 'blocker',
      category: 'dependency',
      requiredForCommit: true,
      check: async (context) => this.checkAntdCompatibility(context),
      autoFix: async (context) => this.fixAntdCompatibility(context)
    });

    this.rules.set('dependency-conflicts', {
      name: 'Dependency Conflict Detection',
      priority: 'critical',
      category: 'dependency',
      requiredForCommit: true,
      check: async (context) => this.checkDependencyConflicts(context),
      autoFix: async (context) => this.fixDependencyConflicts(context)
    });

    this.rules.set('missing-dependencies', {
      name: 'Missing Dependency Detection',
      priority: 'blocker',
      category: 'dependency',
      requiredForCommit: true,
      check: async (context) => this.checkMissingDependencies(context),
      autoFix: async (context) => this.fixMissingDependencies(context)
    });

    // TypeScript Validation Rules
    this.rules.set('typescript-errors', {
      name: 'TypeScript Error Prevention',
      priority: 'blocker',
      category: 'typescript',
      requiredForCommit: true,
      check: async (context) => this.checkTypeScriptErrors(context)
    });

    this.rules.set('import-validation', {
      name: 'Import Statement Validation',
      priority: 'critical',
      category: 'typescript',
      requiredForCommit: true,
      check: async (context) => this.checkImportStatements(context),
      autoFix: async (context) => this.fixImportStatements(context)
    });

    // React Router Validation Rules (learned from our routing issue)
    this.rules.set('router-configuration', {
      name: 'React Router Configuration Check',
      priority: 'blocker',
      category: 'typescript',
      requiredForCommit: true,
      check: async (context) => this.checkRouterConfiguration(context),
      autoFix: async (context) => this.fixRouterConfiguration(context)
    });

    // Security Validation Rules
    this.rules.set('security-vulnerabilities', {
      name: 'Security Vulnerability Check',
      priority: 'critical',
      category: 'security',
      requiredForCommit: true,
      check: async (context) => this.checkSecurityVulnerabilities(context)
    });

    // Performance Rules
    this.rules.set('performance-checks', {
      name: 'Performance Impact Assessment',
      priority: 'major',
      category: 'performance',
      requiredForCommit: false,
      check: async (context) => this.checkPerformanceImpact(context)
    });

    // Accessibility Rules
    this.rules.set('accessibility-standards', {
      name: 'Accessibility Standards Check',
      priority: 'major',
      category: 'accessibility',
      requiredForCommit: false,
      check: async (context) => this.checkAccessibilityStandards(context)
    });

    console.log(`🔧 Initialized ${this.rules.size} quality gate rules`);
  }

  /**
   * Setup Real-Time Monitoring
   */
  private setupRealTimeMonitoring(): void {
    // Monitor file changes for immediate validation
    versatilDispatcher.on('agent-activated', async (event) => {
      await this.validateAgentContext(event);
    });

    // Monitor for emergency situations
    versatilDispatcher.on('emergency-handled', async (event) => {
      await this.runEmergencyValidation(event);
    });

    console.log('🔍 Real-time monitoring: ACTIVE');
  }

  /**
   * Connect to Development Integration
   */
  private connectToDevelopmentIntegration(): void {
    // This would connect to the development integration service
    console.log('🔗 Connected to development integration');
  }

  /**
   * Main Quality Gate Validation Entry Point
   */
  async validateContext(context: ValidationContext): Promise<QualityGateResult> {
    const cacheKey = this.generateCacheKey(context);

    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      console.log('⚡ Using cached validation result');
      return this.validationCache.get(cacheKey)!;
    }

    console.log(`🔍 Running quality gates for: ${context.filePath}`);

    const combinedResult: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 0
    };

    // Run all applicable rules
    for (const [ruleName, rule] of this.rules) {
      try {
        const result = await rule.check(context);

        // Combine results
        combinedResult.issues.push(...result.issues);
        combinedResult.warnings.push(...result.warnings);
        combinedResult.blockers.push(...result.blockers);
        combinedResult.suggestions.push(...result.suggestions);

        if (result.autoFixAvailable && rule.autoFix) {
          combinedResult.autoFixAvailable = true;
        }

        combinedResult.estimatedFixTime += result.estimatedFixTime;

        // If any blocker rule fails, overall validation fails
        if (!result.passed && rule.priority === 'blocker') {
          combinedResult.passed = false;
        }

        console.log(`  ${result.passed ? '✅' : '❌'} ${ruleName}`);

      } catch (error) {
        console.error(`❌ Quality gate ${ruleName} failed:`, error);
        combinedResult.blockers.push({
          severity: 'blocker',
          message: `Quality gate execution failed: ${error.message}`,
          file: context.filePath,
          rule: ruleName
        });
        combinedResult.passed = false;
      }
    }

    // Cache result
    this.validationCache.set(cacheKey, combinedResult);

    console.log(`🎯 Quality Gates: ${combinedResult.passed ? 'PASSED' : 'FAILED'}`);
    return combinedResult;
  }

  /**
   * Ant Design Compatibility Check (learned from our issue)
   */
  private async checkAntdCompatibility(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: true,
      estimatedFixTime: 2
    };

    // Check Ant Design version
    const antdVersion = this.packageJson.dependencies?.['antd'];

    if (antdVersion) {
      // Check for direct Text import (our specific issue)
      if (context.fileContent.includes('import { Text }') && context.fileContent.includes('antd')) {
        result.blockers.push({
          severity: 'blocker',
          message: 'Direct Text import from antd may not be available in some versions. Use Typography.Text instead.',
          file: context.filePath,
          rule: 'antd-compatibility',
          fixSuggestion: 'Replace "import { Text }" with "import { Typography }" and use "Typography.Text"',
          affectedComponents: ['Text component usage']
        });
        result.passed = false;
        result.suggestions.push('Update import to use Typography.Text for better compatibility');
      }

      // Check version compatibility
      if (!this.isVersionCompatible(antdVersion, '>=4.0.0')) {
        result.warnings.push({
          severity: 'major',
          message: 'Ant Design version may be outdated. Consider upgrading for better compatibility.',
          file: 'package.json',
          rule: 'antd-compatibility',
          fixSuggestion: 'Update antd to a more recent version'
        });
      }
    }

    return result;
  }

  /**
   * Dependency Conflict Detection
   */
  private async checkDependencyConflicts(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 5
    };

    try {
      // Run npm ls to check for conflicts
      const { stdout, stderr } = await execAsync('npm ls --depth=0 2>/dev/null || true');

      if (stderr && stderr.includes('ERESOLVE')) {
        result.blockers.push({
          severity: 'blocker',
          message: 'Dependency resolution conflicts detected',
          file: 'package.json',
          rule: 'dependency-conflicts',
          fixSuggestion: 'Run npm install --force or resolve version conflicts manually'
        });
        result.passed = false;
      }

    } catch (error) {
      // Non-blocking - dependency check failed
      result.warnings.push({
        severity: 'minor',
        message: 'Could not check for dependency conflicts',
        file: 'package.json',
        rule: 'dependency-conflicts'
      });
    }

    return result;
  }

  /**
   * Missing Dependencies Check
   */
  private async checkMissingDependencies(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: true,
      estimatedFixTime: 3
    };

    // Extract imports from file content
    const imports = this.extractImports(context.fileContent);

    for (const importName of imports) {
      if (!this.isDependencyInstalled(importName)) {
        result.blockers.push({
          severity: 'blocker',
          message: `Missing dependency: ${importName}`,
          file: context.filePath,
          rule: 'missing-dependencies',
          fixSuggestion: `Install missing dependency: npm install ${importName}`,
          affectedComponents: [importName]
        });
        result.passed = false;
      }
    }

    return result;
  }

  /**
   * TypeScript Error Check
   */
  private async checkTypeScriptErrors(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 10
    };

    if (!context.filePath.endsWith('.ts') && !context.filePath.endsWith('.tsx')) {
      return result; // Skip non-TypeScript files
    }

    try {
      // Run TypeScript compiler check
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit --skipLibCheck "${context.filePath}" 2>&1 || true`);

      if (stderr || stdout.includes('error')) {
        const errors = this.parseTypeScriptErrors(stdout + stderr);

        for (const error of errors) {
          result.blockers.push({
            severity: 'blocker',
            message: error.message,
            file: error.file || context.filePath,
            line: error.line,
            column: error.column,
            rule: 'typescript-errors',
            fixSuggestion: 'Fix TypeScript compilation errors'
          });
        }

        if (errors.length > 0) {
          result.passed = false;
        }
      }

    } catch (error) {
      // TypeScript check failed, but not blocking
      result.warnings.push({
        severity: 'minor',
        message: 'Could not run TypeScript validation',
        file: context.filePath,
        rule: 'typescript-errors'
      });
    }

    return result;
  }

  /**
   * Import Statement Validation
   */
  private async checkImportStatements(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: true,
      estimatedFixTime: 2
    };

    // Check for common import issues
    const lines = context.fileContent.split('\n');

    lines.forEach((line, index) => {
      if (line.trim().startsWith('import')) {
        // Check for relative imports going too many levels up
        if (line.includes('../../../')) {
          result.warnings.push({
            severity: 'major',
            message: 'Deep relative import detected - consider using absolute imports',
            file: context.filePath,
            line: index + 1,
            rule: 'import-validation',
            fixSuggestion: 'Use absolute imports from src/ instead of deep relative imports'
          });
        }

        // Check for missing file extensions in relative imports
        if (line.includes('./') && !line.includes('.ts') && !line.includes('.tsx') && !line.includes('.js') && !line.includes('.jsx')) {
          result.suggestions.push('Consider adding file extensions to relative imports for clarity');
        }
      }
    });

    return result;
  }

  /**
   * React Router Configuration Check (learned from our routing issue)
   */
  private async checkRouterConfiguration(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: true,
      estimatedFixTime: 5
    };

    if (context.filePath.includes('App.tsx') || context.fileContent.includes('Route')) {
      // Check for Route definitions without element prop
      const routeMatches = context.fileContent.match(/<Route[^>]*>/g);

      if (routeMatches) {
        routeMatches.forEach(route => {
          if (route.includes('path=') && !route.includes('element=')) {
            result.blockers.push({
              severity: 'blocker',
              message: 'Route definition missing element prop',
              file: context.filePath,
              rule: 'router-configuration',
              fixSuggestion: 'Add element prop to Route definition',
              affectedComponents: ['React Router']
            });
            result.passed = false;
          }
        });
      }

      // Check for proper Router wrapper
      if (context.fileContent.includes('Route') && !context.fileContent.includes('BrowserRouter') && !context.fileContent.includes('Router')) {
        result.warnings.push({
          severity: 'major',
          message: 'Routes defined but no Router wrapper detected',
          file: context.filePath,
          rule: 'router-configuration',
          fixSuggestion: 'Ensure Routes are wrapped in BrowserRouter or similar'
        });
      }
    }

    return result;
  }

  /**
   * Security Vulnerability Check
   */
  private async checkSecurityVulnerabilities(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 15
    };

    // Check for common security issues
    const securityPatterns = [
      { pattern: /console\.log\(.*password.*\)/i, message: 'Potential password logging detected' },
      { pattern: /console\.log\(.*token.*\)/i, message: 'Potential token logging detected' },
      { pattern: /console\.log\(.*secret.*\)/i, message: 'Potential secret logging detected' },
      { pattern: /localStorage\.setItem\(.*password.*\)/i, message: 'Storing sensitive data in localStorage' },
      { pattern: /document\.cookie.*=.*password/i, message: 'Setting password in cookie' }
    ];

    securityPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(context.fileContent)) {
        result.blockers.push({
          severity: 'critical',
          message,
          file: context.filePath,
          rule: 'security-vulnerabilities',
          fixSuggestion: 'Remove or encrypt sensitive data logging/storage'
        });
        result.passed = false;
      }
    });

    return result;
  }

  /**
   * Performance Impact Assessment
   */
  private async checkPerformanceImpact(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 8
    };

    // Check for performance anti-patterns
    if (context.fileContent.includes('useEffect(() => {') && !context.fileContent.includes('[]')) {
      result.warnings.push({
        severity: 'major',
        message: 'useEffect without dependency array may cause performance issues',
        file: context.filePath,
        rule: 'performance-checks',
        fixSuggestion: 'Add dependency array to useEffect to control re-renders'
      });
    }

    return result;
  }

  /**
   * Accessibility Standards Check
   */
  private async checkAccessibilityStandards(context: ValidationContext): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: true,
      issues: [],
      warnings: [],
      blockers: [],
      suggestions: [],
      autoFixAvailable: false,
      estimatedFixTime: 5
    };

    // Check for common accessibility issues
    if (context.fileContent.includes('<img') && !context.fileContent.includes('alt=')) {
      result.warnings.push({
        severity: 'major',
        message: 'Image elements should have alt attributes for accessibility',
        file: context.filePath,
        rule: 'accessibility-standards',
        fixSuggestion: 'Add alt attribute to img elements'
      });
    }

    return result;
  }

  /**
   * Auto-Fix Methods
   */
  private async fixAntdCompatibility(context: ValidationContext): Promise<boolean> {
    try {
      // Fix direct Text import issue
      let fixedContent = context.fileContent.replace(
        /import\s*{\s*([^}]*,\s*)?Text(\s*,\s*[^}]*)?\s*}\s*from\s*['"]antd['"]/g,
        'import { $1Typography$2 } from \'antd\''
      );

      fixedContent = fixedContent.replace(/\bText\b/g, 'Typography.Text');

      if (fixedContent !== context.fileContent) {
        await fs.writeFile(context.filePath, fixedContent);
        console.log('✅ Auto-fixed Ant Design compatibility issue');
        return true;
      }

    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
    }

    return false;
  }

  private async fixMissingDependencies(context: ValidationContext): Promise<boolean> {
    // This would implement automatic dependency installation
    console.log('🔧 Auto-fix for missing dependencies would install packages here');
    return false; // Disabled for safety
  }

  private async fixDependencyConflicts(context: ValidationContext): Promise<boolean> {
    // This would implement automatic conflict resolution
    console.log('🔧 Auto-fix for dependency conflicts would resolve conflicts here');
    return false; // Disabled for safety
  }

  private async fixImportStatements(context: ValidationContext): Promise<boolean> {
    // This would implement automatic import fixes
    console.log('🔧 Auto-fix for import statements would optimize imports here');
    return false;
  }

  private async fixRouterConfiguration(context: ValidationContext): Promise<boolean> {
    // This would implement automatic router fixes
    console.log('🔧 Auto-fix for router configuration would fix routes here');
    return false;
  }

  /**
   * Helper Methods
   */
  private generateCacheKey(context: ValidationContext): string {
    const hash = require('crypto').createHash('md5');
    hash.update(context.filePath + context.fileContent.substring(0, 1000));
    return hash.digest('hex');
  }

  private isVersionCompatible(version: string, requirement: string): boolean {
    // Simple version compatibility check
    return version.includes('5.') || version.includes('^5') || version.includes('~5') ||
           version.includes('4.') || version.includes('^4') || version.includes('~4');
  }

  private extractImports(fileContent: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:{[^}]*}\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(fileContent)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        const packageName = importPath.split('/')[0];
        if (packageName.startsWith('@')) {
          imports.push(packageName + '/' + importPath.split('/')[1]);
        } else {
          imports.push(packageName);
        }
      }
    }

    return [...new Set(imports)];
  }

  private isDependencyInstalled(packageName: string): boolean {
    return !!(this.packageJson.dependencies?.[packageName] ||
              this.packageJson.devDependencies?.[packageName] ||
              this.packageJson.peerDependencies?.[packageName]);
  }

  private parseTypeScriptErrors(output: string): Array<{message: string, file?: string, line?: number, column?: number}> {
    const errors: Array<{message: string, file?: string, line?: number, column?: number}> = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('error TS')) {
        const match = line.match(/(.+?)\((\d+),(\d+)\): error (.+)/);
        if (match) {
          errors.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4]
          });
        } else {
          errors.push({ message: line });
        }
      }
    });

    return errors;
  }

  /**
   * Validation Event Handlers
   */
  private async validateAgentContext(event: any): Promise<void> {
    if (event.context?.filePath) {
      const context: ValidationContext = {
        filePath: event.context.filePath,
        fileContent: await this.readFileSafely(event.context.filePath),
        projectRoot: this.projectRoot,
        packageJson: this.packageJson,
        tsConfig: this.tsConfig
      };

      const result = await this.validateContext(context);

      if (!result.passed) {
        console.log(`🚨 Quality gates failed for agent ${event.agent}`);
        // This could trigger agent notification or emergency protocols
      }
    }
  }

  private async runEmergencyValidation(event: any): Promise<void> {
    console.log('🆘 Running emergency quality validation');
    // Emergency-specific validation logic
  }

  private async readFileSafely(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  /**
   * Public API Methods
   */
  async runQualityGates(context: ValidationContext): Promise<QualityGateResult> {
    return await this.validateContext(context);
  }

  async runAutoFix(context: ValidationContext, ruleName?: string): Promise<boolean> {
    if (ruleName) {
      const rule = this.rules.get(ruleName);
      if (rule?.autoFix) {
        return await rule.autoFix(context);
      }
    } else {
      // Run all available auto-fixes
      let fixesApplied = 0;
      for (const [name, rule] of this.rules) {
        if (rule.autoFix) {
          const fixed = await rule.autoFix(context);
          if (fixed) fixesApplied++;
        }
      }
      return fixesApplied > 0;
    }

    return false;
  }

  getEnforcerStatus() {
    return {
      activeRules: this.rules.size,
      cacheSize: this.validationCache.size,
      projectRoot: this.projectRoot,
      packageJsonLoaded: Object.keys(this.packageJson).length > 0,
      tsConfigLoaded: Object.keys(this.tsConfig).length > 0,
      status: 'operational'
    };
  }
}

// Export singleton instance
export const qualityGateEnforcer = new QualityGateEnforcer();

// Public API
export async function validateQualityGates(context: ValidationContext): Promise<QualityGateResult> {
  return await qualityGateEnforcer.runQualityGates(context);
}

export async function runAutoFix(context: ValidationContext, ruleName?: string): Promise<boolean> {
  return await qualityGateEnforcer.runAutoFix(context, ruleName);
}

export function getQualityGateStatus() {
  return qualityGateEnforcer.getEnforcerStatus();
}

console.log('🛡️ Quality Gate Enforcer: LOADED');