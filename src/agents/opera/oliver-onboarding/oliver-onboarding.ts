/**
 * VERSATIL OPERA v6.1.0 - Oliver-Onboarding Agent
 *
 * The 7th OPERA Agent - Project Integration Specialist
 *
 * Responsibilities:
 * - Automatic project scanning on install/update
 * - Deep project structure analysis
 * - Gap analysis (missing tests, docs, quality issues)
 * - Smart reorganization suggestions
 * - Agent and rule recommendations
 * - Migration assistance from other frameworks
 * - Quality baseline establishment
 *
 * Auto-Activation Triggers:
 * - npm install @versatil/sdlc-framework (first install)
 * - npm update @versatil/sdlc-framework (framework updates)
 * - package.json changes
 * - versatil onboard (manual command)
 *
 * Icon: 🎯
 *
 * @module OliverOnboarding
 * @version 6.1.0
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../../../utils/logger.js';
import { IntelligentOnboardingSystem, OnboardingProfile, OnboardingResult, ProjectAnalysis } from '../../../onboarding/intelligent-onboarding-system.js';
import { ProjectScanner, ScanResult } from './project-scanner.js';
import { ReorganizationEngine, ReorganizationPlan } from './reorganization-engine.js';
import { MigrationAssistant, MigrationStrategy } from './migration-assistant.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface OliverConfig {
  projectRoot: string;
  vectorStore?: EnhancedVectorMemoryStore;
  autoReorganize: boolean;  // Auto-apply reorganization (vs suggest only)
  autoMigrate: boolean;     // Auto-migrate from detected frameworks
  verboseLogging: boolean;
  skipPatterns: string[];   // Files/dirs to skip during scan
}

export interface OliverScanResult {
  projectAnalysis: ProjectAnalysis;
  scanResult: ScanResult;
  gaps: ProjectGap[];
  recommendations: Recommendation[];
  reorganizationPlan: ReorganizationPlan | null;
  migrationStrategy: MigrationStrategy | null;
  estimatedEffort: EffortEstimate;
}

export interface ProjectGap {
  type: 'testing' | 'documentation' | 'security' | 'performance' | 'accessibility' | 'structure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedFiles: string[];
  suggestion: string;
  autoFixable: boolean;
  estimatedEffort: number;  // Minutes
}

export interface Recommendation {
  category: 'agent' | 'rule' | 'tool' | 'structure' | 'dependency';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  action: string;  // What the user should do
}

export interface EffortEstimate {
  totalMinutes: number;
  breakdown: {
    testing: number;
    documentation: number;
    reorganization: number;
    migration: number;
    configuration: number;
  };
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface ProjectConfig {
  projectId: string;
  name: string;
  version: string;
  type: string;
  language: string;
  framework: string;
  agents: string[];
  rules: number[];
  quality: {
    coverageThreshold: number;
    minQualityScore: number;
    securityScanRequired: boolean;
    accessibilityCompliance: string;
  };
  proactive: {
    enabled: boolean;
    autoActivation: boolean;
    backgroundMonitoring: boolean;
    realTimeValidation: boolean;
  };
  isolation: {
    frameworkHome: string;
    allowedInProject: string[];
    strictMode: boolean;
  };
  recommendations?: Recommendation[];
  gaps?: ProjectGap[];
  createdAt: string;
  updatedAt: string;
  lastScan: string;
  frameworkVersion: string;
}

export class OliverOnboardingAgent extends EventEmitter {
  private logger: VERSATILLogger;
  private config: OliverConfig;
  private onboardingSystem: IntelligentOnboardingSystem;
  private scanner: ProjectScanner;
  private reorganizer: ReorganizationEngine;
  private migrator: MigrationAssistant;
  private vectorStore?: EnhancedVectorMemoryStore;

  // Scan state
  private lastScanResult: OliverScanResult | null = null;
  private isScanning: boolean = false;

  constructor(config: OliverConfig) {
    super();

    this.logger = new VERSATILLogger('Oliver-Onboarding');
    this.config = config;
    this.vectorStore = config.vectorStore;

    // Initialize components
    this.onboardingSystem = new IntelligentOnboardingSystem(config.projectRoot);
    this.scanner = new ProjectScanner(config.projectRoot, config.skipPatterns);
    this.reorganizer = new ReorganizationEngine(config.projectRoot);
    this.migrator = new MigrationAssistant(config.projectRoot);

    this.logger.info('Oliver-Onboarding agent initialized', {
      projectRoot: config.projectRoot,
      autoReorganize: config.autoReorganize,
      autoMigrate: config.autoMigrate
    });
  }

  /**
   * Main entry point: Scan and analyze project
   */
  async scanProject(): Promise<OliverScanResult> {
    if (this.isScanning) {
      throw new Error('Oliver is already scanning a project');
    }

    this.isScanning = true;
    this.logger.info('🎯 Oliver starting comprehensive project scan...');

    try {
      // Phase 1: Project analysis (from existing IntelligentOnboardingSystem)
      this.logger.info('Phase 1/5: Analyzing project structure...');
      const projectAnalysis = await this.onboardingSystem['analyzeProject']();

      // Phase 2: Deep scan (tech stack, dependencies, code quality)
      this.logger.info('Phase 2/5: Deep scanning project...');
      const scanResult = await this.scanner.scan();

      // Phase 3: Gap analysis
      this.logger.info('Phase 3/5: Analyzing gaps and issues...');
      const gaps = await this.analyzeGaps(scanResult);

      // Phase 4: Generate recommendations
      this.logger.info('Phase 4/5: Generating recommendations...');
      const recommendations = await this.generateRecommendations(scanResult, gaps);

      // Phase 5: Create reorganization plan (if needed)
      this.logger.info('Phase 5/5: Creating reorganization plan...');
      const reorganizationPlan = await this.createReorganizationPlan(scanResult, gaps);

      // Phase 6: Detect migration needs
      const migrationStrategy = await this.detectMigrationNeeds(scanResult);

      // Calculate effort estimate
      const estimatedEffort = this.calculateEffortEstimate(gaps, reorganizationPlan, migrationStrategy);

      const result: OliverScanResult = {
        projectAnalysis,
        scanResult,
        gaps,
        recommendations,
        reorganizationPlan,
        migrationStrategy,
        estimatedEffort
      };

      this.lastScanResult = result;

      // Store in RAG for pattern learning
      if (this.vectorStore) {
        await this.storeInRAG(result);
      }

      this.logger.info('✅ Project scan complete', {
        gaps: gaps.length,
        recommendations: recommendations.length,
        effort: `${estimatedEffort.totalMinutes} minutes`
      });

      this.emit('scan-complete', result);
      return result;

    } catch (error) {
      this.logger.error('Project scan failed', { error });
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyze gaps in the project
   */
  private async analyzeGaps(scanResult: ScanResult): Promise<ProjectGap[]> {
    const gaps: ProjectGap[] = [];

    // Gap 1: Missing tests
    if (scanResult.testing.coverage < 80) {
      const untestedFiles = scanResult.testing.untestedFiles || [];
      gaps.push({
        type: 'testing',
        severity: scanResult.testing.coverage < 50 ? 'high' : 'medium',
        description: `Test coverage is ${scanResult.testing.coverage}% (target: 80%)`,
        affectedFiles: untestedFiles,
        suggestion: `Activate Maria-QA to generate ${untestedFiles.length} missing test files`,
        autoFixable: true,
        estimatedEffort: untestedFiles.length * 5  // 5 minutes per test file
      });
    }

    // Gap 2: Missing documentation
    if (scanResult.documentation.completeness < 70) {
      gaps.push({
        type: 'documentation',
        severity: 'medium',
        description: `Documentation completeness: ${scanResult.documentation.completeness}% (target: 70%)`,
        affectedFiles: scanResult.documentation.missingDocs || [],
        suggestion: 'Activate Sarah-PM to generate project documentation',
        autoFixable: true,
        estimatedEffort: 30
      });
    }

    // Gap 3: Security vulnerabilities
    if (scanResult.security.vulnerabilities.length > 0) {
      const criticalVulns = scanResult.security.vulnerabilities.filter(v => v.severity === 'critical');
      gaps.push({
        type: 'security',
        severity: criticalVulns.length > 0 ? 'critical' : 'high',
        description: `${scanResult.security.vulnerabilities.length} security vulnerabilities detected`,
        affectedFiles: scanResult.security.vulnerabilities.map(v => v.package),
        suggestion: 'Run npm audit fix and activate Marcus-Backend for security review',
        autoFixable: false,
        estimatedEffort: scanResult.security.vulnerabilities.length * 10
      });
    }

    // Gap 4: Poor project structure
    if (scanResult.structure.quality < 70) {
      gaps.push({
        type: 'structure',
        severity: 'medium',
        description: 'Project structure does not follow best practices',
        affectedFiles: [],
        suggestion: 'Allow Oliver to reorganize project structure',
        autoFixable: true,
        estimatedEffort: 15
      });
    }

    // Gap 5: Performance issues
    if (scanResult.performance.score < 80) {
      gaps.push({
        type: 'performance',
        severity: 'medium',
        description: `Performance score: ${scanResult.performance.score}/100 (target: 80+)`,
        affectedFiles: scanResult.performance.slowFiles || [],
        suggestion: 'Activate James-Frontend for performance optimization',
        autoFixable: false,
        estimatedEffort: 60
      });
    }

    // Gap 6: Accessibility issues
    if (scanResult.accessibility && scanResult.accessibility.violations.length > 0) {
      gaps.push({
        type: 'accessibility',
        severity: 'medium',
        description: `${scanResult.accessibility.violations.length} accessibility violations detected`,
        affectedFiles: scanResult.accessibility.violations.map(v => v.file),
        suggestion: 'Activate James-Frontend to fix accessibility issues',
        autoFixable: true,
        estimatedEffort: scanResult.accessibility.violations.length * 3
      });
    }

    return gaps;
  }

  /**
   * Generate recommendations based on scan results
   */
  private async generateRecommendations(scanResult: ScanResult, gaps: ProjectGap[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Recommend agents based on tech stack
    const techStack = scanResult.techStack.detected;

    if (techStack.includes('react') || techStack.includes('vue') || techStack.includes('angular')) {
      recommendations.push({
        category: 'agent',
        title: 'Activate James-Frontend',
        description: 'Frontend framework detected - James can help with UI/UX, accessibility, and performance',
        priority: 'high',
        effort: 'low',
        impact: 'Automated UI validation and accessibility checks',
        action: 'Add "james-frontend" to .versatil-project.json agents array'
      });
    }

    if (techStack.includes('express') || techStack.includes('nestjs') || techStack.includes('fastify')) {
      recommendations.push({
        category: 'agent',
        title: 'Activate Marcus-Backend',
        description: 'Backend framework detected - Marcus can handle API security, performance, and testing',
        priority: 'high',
        effort: 'low',
        impact: 'Automated security scans and API stress testing',
        action: 'Add "marcus-backend" to .versatil-project.json agents array'
      });
    }

    if (scanResult.testing.frameworks.length > 0) {
      recommendations.push({
        category: 'agent',
        title: 'Activate Maria-QA',
        description: 'Testing framework detected - Maria can generate tests and ensure quality',
        priority: 'high',
        effort: 'low',
        impact: 'Automated test generation and coverage analysis',
        action: 'Add "maria-qa" to .versatil-project.json agents array'
      });
    }

    // Recommend rules based on project complexity
    if (scanResult.complexity.score > 70) {
      recommendations.push({
        category: 'rule',
        title: 'Enable Parallel Execution (Rule 1)',
        description: 'Complex project detected - parallel execution will speed up development',
        priority: 'medium',
        effort: 'low',
        impact: '3x faster task execution',
        action: 'Add 1 to .versatil-project.json rules array'
      });

      recommendations.push({
        category: 'rule',
        title: 'Enable Stress Testing (Rule 2)',
        description: 'Complex project needs comprehensive testing',
        priority: 'high',
        effort: 'low',
        impact: 'Auto-generated stress tests for all APIs',
        action: 'Add 2 to .versatil-project.json rules array'
      });
    }

    recommendations.push({
      category: 'rule',
      title: 'Enable Daily Audit (Rule 3)',
      description: 'Recommended for all projects to maintain health',
      priority: 'medium',
      effort: 'low',
      impact: 'Daily system health checks and optimization',
      action: 'Add 3 to .versatil-project.json rules array'
    });

    // Recommend tools based on gaps
    if (gaps.some(g => g.type === 'security')) {
      recommendations.push({
        category: 'tool',
        title: 'Enable Semgrep MCP',
        description: 'Security vulnerabilities detected - Semgrep can help identify and fix them',
        priority: 'critical' as any,
        effort: 'low',
        impact: 'Automated security vulnerability scanning',
        action: 'Configure Semgrep MCP in .cursor/mcp_config.json'
      });
    }

    if (gaps.some(g => g.type === 'performance')) {
      recommendations.push({
        category: 'tool',
        title: 'Enable Lighthouse MCP',
        description: 'Performance issues detected - Lighthouse can provide detailed insights',
        priority: 'medium',
        effort: 'low',
        impact: 'Automated performance monitoring',
        action: 'Configure Chrome/Playwright MCP for Lighthouse audits'
      });
    }

    return recommendations;
  }

  /**
   * Create reorganization plan
   */
  private async createReorganizationPlan(scanResult: ScanResult, gaps: ProjectGap[]): Promise<ReorganizationPlan | null> {
    // Only create plan if structure quality is low or user requested reorganization
    if (scanResult.structure.quality >= 70 && !this.config.autoReorganize) {
      return null;
    }

    return await this.reorganizer.createPlan(scanResult);
  }

  /**
   * Detect migration needs
   */
  private async detectMigrationNeeds(scanResult: ScanResult): Promise<MigrationStrategy | null> {
    return await this.migrator.detectMigration(scanResult);
  }

  /**
   * Calculate effort estimate
   */
  private calculateEffortEstimate(
    gaps: ProjectGap[],
    reorganizationPlan: ReorganizationPlan | null,
    migrationStrategy: MigrationStrategy | null
  ): EffortEstimate {
    const breakdown = {
      testing: gaps.filter(g => g.type === 'testing').reduce((sum, g) => sum + g.estimatedEffort, 0),
      documentation: gaps.filter(g => g.type === 'documentation').reduce((sum, g) => sum + g.estimatedEffort, 0),
      reorganization: reorganizationPlan?.estimatedMinutes || 0,
      migration: migrationStrategy?.estimatedMinutes || 0,
      configuration: 10  // Base configuration time
    };

    const totalMinutes = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (totalMinutes > 120) complexity = 'complex';
    else if (totalMinutes > 30) complexity = 'moderate';

    return {
      totalMinutes,
      breakdown,
      complexity
    };
  }

  /**
   * Store scan results in RAG for pattern learning
   */
  private async storeInRAG(result: OliverScanResult): Promise<void> {
    if (!this.vectorStore) return;

    const ragEntry = {
      type: 'onboarding_scan',
      timestamp: Date.now(),
      projectType: result.scanResult.projectType,
      techStack: result.scanResult.techStack.detected,
      complexity: result.estimatedEffort.complexity,
      gaps: result.gaps.map(g => ({ type: g.type, severity: g.severity })),
      recommendations: result.recommendations.map(r => ({
        category: r.category,
        priority: r.priority
      }))
    };

    // Would store in vector store here
    this.logger.debug('Stored scan results in RAG');
  }

  /**
   * Generate .versatil-project.json configuration file
   */
  async generateProjectConfig(): Promise<ProjectConfig> {
    if (!this.lastScanResult) {
      throw new Error('No scan results available. Run scanProject() first.');
    }

    const scan = this.lastScanResult;
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    let packageJson: any = {};

    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(content);
    } catch (error) {
      this.logger.warn('Could not read package.json', { error });
    }

    // Determine which agents to activate
    const agents: string[] = [];
    scan.recommendations
      .filter(r => r.category === 'agent')
      .forEach(r => {
        if (r.title.includes('Maria')) agents.push('maria-qa');
        if (r.title.includes('James')) agents.push('james-frontend');
        if (r.title.includes('Marcus')) agents.push('marcus-backend');
        if (r.title.includes('Sarah')) agents.push('sarah-pm');
        if (r.title.includes('Alex')) agents.push('alex-ba');
        if (r.title.includes('Dr.AI')) agents.push('dr-ai-ml');
      });

    // Always include Oliver for future scans
    if (!agents.includes('oliver-onboarding')) {
      agents.push('oliver-onboarding');
    }

    // Determine which rules to enable
    const rules: number[] = [3, 4];  // Daily audit + onboarding always recommended
    if (scan.estimatedEffort.complexity === 'complex') {
      rules.push(1, 2);  // Parallel execution + stress testing for complex projects
    }

    const config: ProjectConfig = {
      projectId: this.generateProjectId(packageJson.name || 'unknown'),
      name: packageJson.name || 'My Project',
      version: packageJson.version || '1.0.0',
      type: scan.scanResult.projectType,
      language: scan.scanResult.techStack.languages[0] || 'javascript',
      framework: scan.scanResult.techStack.frameworks[0] || 'node',
      agents,
      rules,
      quality: {
        coverageThreshold: 80,
        minQualityScore: 80,
        securityScanRequired: true,
        accessibilityCompliance: 'WCAG 2.1 AA'
      },
      proactive: {
        enabled: true,
        autoActivation: true,
        backgroundMonitoring: true,
        realTimeValidation: true
      },
      isolation: {
        frameworkHome: '~/.versatil/',
        allowedInProject: ['.versatil-project.json'],
        strictMode: true
      },
      recommendations: scan.recommendations,
      gaps: scan.gaps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScan: new Date().toISOString(),
      frameworkVersion: '6.1.0'
    };

    return config;
  }

  /**
   * Save .versatil-project.json to user's project
   */
  async saveProjectConfig(config: ProjectConfig): Promise<void> {
    const configPath = path.join(this.config.projectRoot, '.versatil-project.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    this.logger.info('✅ Saved .versatil-project.json', { path: configPath });
    this.emit('config-saved', config);
  }

  /**
   * Execute reorganization plan
   */
  async applyReorganization(): Promise<void> {
    if (!this.lastScanResult?.reorganizationPlan) {
      throw new Error('No reorganization plan available');
    }

    this.logger.info('Applying reorganization plan...');
    await this.reorganizer.applyPlan(this.lastScanResult.reorganizationPlan);
    this.logger.info('✅ Reorganization complete');
    this.emit('reorganization-complete');
  }

  /**
   * Execute migration strategy
   */
  async applyMigration(): Promise<void> {
    if (!this.lastScanResult?.migrationStrategy) {
      throw new Error('No migration strategy available');
    }

    this.logger.info('Applying migration strategy...');
    await this.migrator.applyStrategy(this.lastScanResult.migrationStrategy);
    this.logger.info('✅ Migration complete');
    this.emit('migration-complete');
  }

  /**
   * Complete onboarding flow (scan → configure → reorganize → migrate)
   */
  async completeOnboarding(): Promise<OnboardingResult> {
    try {
      // Step 1: Scan project
      const scanResult = await this.scanProject();

      // Step 2: Generate config
      const config = await this.generateProjectConfig();

      // Step 3: Save config
      await this.saveProjectConfig(config);

      // Step 4: Apply reorganization (if auto-reorganize enabled)
      if (this.config.autoReorganize && scanResult.reorganizationPlan) {
        await this.applyReorganization();
      }

      // Step 5: Apply migration (if auto-migrate enabled)
      if (this.config.autoMigrate && scanResult.migrationStrategy) {
        await this.applyMigration();
      }

      return {
        success: true,
        message: '🎯 Oliver has successfully configured your project!',
        nextSteps: [
          'Review .versatil-project.json for recommended configuration',
          'Start the proactive daemon: versatil-daemon start',
          'Address gaps: ' + scanResult.gaps.slice(0, 3).map(g => g.description).join(', '),
          'Review recommendations: versatil show recommendations'
        ],
        recommendations: scanResult.recommendations.map(r => `${r.title}: ${r.action}`)
      };

    } catch (error) {
      this.logger.error('Onboarding failed', { error });
      return {
        success: false,
        message: 'Onboarding failed. Please check logs.',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get last scan result
   */
  getLastScanResult(): OliverScanResult | null {
    return this.lastScanResult;
  }

  /**
   * Generate unique project ID
   */
  private generateProjectId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
}
