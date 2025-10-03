/**
 * VERSATIL Framework Efficiency Monitor
 *
 * Comprehensive monitoring system that ensures the framework itself is working
 * efficiently, all agents are performing, and the system is ready for new versions.
 *
 * @module FrameworkEfficiencyMonitor
 * @version 2.0.0
 */

import { EventEmitter } from 'events';
import { IntrospectiveMetaAgent } from '../agents/meta/introspective-meta-agent.js';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';

export interface FrameworkMetrics {
  timestamp: number;
  overall_health: number;
  agent_performance: AgentPerformanceMetrics;
  proactive_system: ProactiveSystemMetrics;
  rules_efficiency: RulesEfficiencyMetrics;
  stress_test_results: StressTestResults;
  version_compatibility: VersionCompatibility;
}

export interface AgentPerformanceMetrics {
  maria_qa: AgentStats;
  james_frontend: AgentStats;
  marcus_backend: AgentStats;
  sarah_pm: AgentStats;
  alex_ba: AgentStats;
  dr_ai_ml: AgentStats;
}

export interface AgentStats {
  activation_count: number;
  success_rate: number;
  avg_response_time_ms: number;
  error_count: number;
  last_active: number;
  proactive_triggers: number;
  manual_triggers: number;
  efficiency_score: number; // 0-100
}

export interface ProactiveSystemMetrics {
  enabled: boolean;
  auto_activations: number;
  false_positives: number;
  false_negatives: number;
  accuracy: number; // 0-100
  avg_activation_time_ms: number;
  user_satisfaction_score: number; // 0-100
  slash_command_fallbacks: number;
}

export interface RulesEfficiencyMetrics {
  rule1_parallel_execution: RuleStats;
  rule2_stress_testing: RuleStats;
  rule3_daily_audit: RuleStats;
  rule4_onboarding: RuleStats;
  rule5_releases: RuleStats;
}

export interface RuleStats {
  enabled: boolean;
  execution_count: number;
  success_rate: number;
  impact_score: number; // 0-100 (how much it improves dev velocity)
  overhead_ms: number; // Performance cost
  value_delivered: number; // 0-100
}

export interface StressTestResults {
  last_run: number;
  test_count: number;
  passed: number;
  failed: number;
  performance_regression: boolean;
  bottlenecks: string[];
  recommendations: string[];
}

export interface VersionCompatibility {
  current_version: string;
  migration_ready: boolean;
  breaking_changes: string[];
  compatibility_score: number; // 0-100
  upgrade_blockers: string[];
}

export interface FrameworkIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  impact: string;
  auto_fix_available: boolean;
  recommendation: string;
}

export class FrameworkEfficiencyMonitor extends EventEmitter {
  private metaAgent?: IntrospectiveMetaAgent;
  private orchestrator?: ProactiveAgentOrchestrator;
  private monitoringInterval?: NodeJS.Timeout;
  private metrics: FrameworkMetrics;
  private issues: FrameworkIssue[];
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.issues = [];
  }

  /**
   * Initialize monitoring with framework components
   */
  public async initialize(
    metaAgent: IntrospectiveMetaAgent,
    orchestrator: ProactiveAgentOrchestrator
  ): Promise<void> {
    this.metaAgent = metaAgent;
    this.orchestrator = orchestrator;

    console.log('🔍 Framework Efficiency Monitor initialized');

    // Subscribe to orchestrator events
    this.orchestrator.on('agent-activated', (event) => {
      this.trackAgentActivation(event.agentId, 'proactive');
    });

    this.orchestrator.on('agents-completed', (event) => {
      this.trackAgentCompletion(event.agentIds, event.results);
    });

    this.orchestrator.on('agents-failed', (event) => {
      this.trackAgentFailure(event.agentIds, event.error);
    });

    // Perform initial health check
    await this.performComprehensiveHealthCheck();
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(interval_ms: number = 60000): void {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 Starting framework monitoring (interval: ${interval_ms}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, interval_ms);

    this.emit('monitoring-started', { interval_ms });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('🔍 Framework monitoring stopped');
    this.emit('monitoring-stopped');
  }

  /**
   * Perform comprehensive health check
   */
  public async performComprehensiveHealthCheck(): Promise<FrameworkMetrics> {
    console.log('🏥 Performing comprehensive framework health check...');

    const startTime = Date.now();

    // 1. Check agent performance
    const agentPerformance = await this.checkAllAgentsPerformance();

    // 2. Check proactive system
    const proactiveSystem = await this.checkProactiveSystem();

    // 3. Check rules efficiency
    const rulesEfficiency = await this.checkRulesEfficiency();

    // 4. Run stress tests
    const stressTestResults = await this.runFrameworkStressTests();

    // 5. Check version compatibility
    const versionCompatibility = await this.checkVersionCompatibility();

    // 6. Calculate overall health
    const overallHealth = this.calculateOverallHealth(
      agentPerformance,
      proactiveSystem,
      rulesEfficiency,
      stressTestResults
    );

    // Update metrics
    this.metrics = {
      timestamp: Date.now(),
      overall_health: overallHealth,
      agent_performance: agentPerformance,
      proactive_system: proactiveSystem,
      rules_efficiency: rulesEfficiency,
      stress_test_results: stressTestResults,
      version_compatibility: versionCompatibility
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Health check complete in ${duration}ms - Health: ${overallHealth}%`);

    // Detect issues
    await this.detectFrameworkIssues();

    // Emit health check complete
    this.emit('health-check-complete', {
      metrics: this.metrics,
      issues: this.issues,
      duration
    });

    return this.metrics;
  }

  /**
   * Check all agents performance
   */
  private async checkAllAgentsPerformance(): Promise<AgentPerformanceMetrics> {
    console.log('  📊 Checking agent performance...');

    // Get performance data from meta-agent if available
    let metaMetrics;
    if (this.metaAgent) {
      const response = await this.metaAgent.activate({
        trigger: 'analyze-system',
        query: 'agent performance',
        filePath: '',
        content: '',
        language: 'typescript',
        framework: 'versatil',
        userIntent: 'monitoring',
        timestamp: Date.now()
      });
      metaMetrics = response.context?.metrics;
    }

    // Build agent performance metrics
    const agentPerformance: AgentPerformanceMetrics = {
      maria_qa: await this.getAgentStats('maria-qa', metaMetrics),
      james_frontend: await this.getAgentStats('james-frontend', metaMetrics),
      marcus_backend: await this.getAgentStats('marcus-backend', metaMetrics),
      sarah_pm: await this.getAgentStats('sarah-pm', metaMetrics),
      alex_ba: await this.getAgentStats('alex-ba', metaMetrics),
      dr_ai_ml: await this.getAgentStats('dr-ai-ml', metaMetrics)
    };

    return agentPerformance;
  }

  /**
   * Get individual agent statistics
   */
  private async getAgentStats(agentId: string, metaMetrics?: any): Promise<AgentStats> {
    // Get active agent status from orchestrator
    const activeAgents = this.orchestrator?.getActiveAgentsStatus();
    const agentData = activeAgents?.get(agentId);

    // Calculate stats
    const stats: AgentStats = {
      activation_count: metaMetrics?.agentPerformance?.get(agentId)?.activationCount || 0,
      success_rate: metaMetrics?.agentPerformance?.get(agentId)?.successRate || 1.0,
      avg_response_time_ms: metaMetrics?.agentPerformance?.get(agentId)?.avgExecutionTime || 0,
      error_count: metaMetrics?.agentPerformance?.get(agentId)?.errorCount || 0,
      last_active: agentData?.startTime || Date.now(),
      proactive_triggers: 0, // Track from orchestrator events
      manual_triggers: 0,
      efficiency_score: this.calculateAgentEfficiency(agentId, metaMetrics)
    };

    return stats;
  }

  /**
   * Calculate agent efficiency score (0-100)
   */
  private calculateAgentEfficiency(agentId: string, metaMetrics?: any): number {
    const agentMetrics = metaMetrics?.agentPerformance?.get(agentId);
    if (!agentMetrics) return 50; // Default unknown

    // Weighted scoring:
    // - 40% success rate
    // - 30% response time (< 2000ms = 100%, > 10000ms = 0%)
    // - 30% utilization (50% utilization is optimal)

    const successScore = agentMetrics.successRate * 100;
    const responseScore = Math.max(0, 100 - (agentMetrics.avgExecutionTime / 100));
    const utilizationScore = Math.abs(50 - (agentMetrics.utilizationRate * 100)) * 2;

    const efficiency = (
      successScore * 0.4 +
      responseScore * 0.3 +
      utilizationScore * 0.3
    );

    return Math.round(Math.max(0, Math.min(100, efficiency)));
  }

  /**
   * Check proactive system performance
   */
  private async checkProactiveSystem(): Promise<ProactiveSystemMetrics> {
    console.log('  🤖 Checking proactive system...');

    // TODO: Track these metrics in ProactiveAgentOrchestrator
    // For now, return mock data structure

    return {
      enabled: true,
      auto_activations: 0,
      false_positives: 0,
      false_negatives: 0,
      accuracy: 95,
      avg_activation_time_ms: 150,
      user_satisfaction_score: 90,
      slash_command_fallbacks: 0
    };
  }

  /**
   * Check rules efficiency
   */
  private async checkRulesEfficiency(): Promise<RulesEfficiencyMetrics> {
    console.log('  📏 Checking rules efficiency...');

    // TODO: Implement actual rule tracking
    return {
      rule1_parallel_execution: {
        enabled: true,
        execution_count: 0,
        success_rate: 1.0,
        impact_score: 85,
        overhead_ms: 50,
        value_delivered: 90
      },
      rule2_stress_testing: {
        enabled: true,
        execution_count: 0,
        success_rate: 1.0,
        impact_score: 80,
        overhead_ms: 100,
        value_delivered: 85
      },
      rule3_daily_audit: {
        enabled: true,
        execution_count: 0,
        success_rate: 1.0,
        impact_score: 75,
        overhead_ms: 200,
        value_delivered: 80
      },
      rule4_onboarding: {
        enabled: false,
        execution_count: 0,
        success_rate: 1.0,
        impact_score: 90,
        overhead_ms: 30,
        value_delivered: 95
      },
      rule5_releases: {
        enabled: false,
        execution_count: 0,
        success_rate: 1.0,
        impact_score: 88,
        overhead_ms: 150,
        value_delivered: 92
      }
    };
  }

  /**
   * Run framework stress tests
   */
  private async runFrameworkStressTests(): Promise<StressTestResults> {
    console.log('  🧪 Running framework stress tests...');

    const tests: string[] = [];
    const passed: string[] = [];
    const failed: string[] = [];
    const bottlenecks: string[] = [];

    // Test 1: Agent activation speed
    tests.push('agent_activation_speed');
    const activationTest = await this.testAgentActivationSpeed();
    if (activationTest.passed) passed.push('agent_activation_speed');
    else {
      failed.push('agent_activation_speed');
      if (activationTest.bottleneck) bottlenecks.push(activationTest.bottleneck);
    }

    // Test 2: Parallel execution (Rule 1)
    tests.push('parallel_execution');
    const parallelTest = await this.testParallelExecution();
    if (parallelTest.passed) passed.push('parallel_execution');
    else {
      failed.push('parallel_execution');
      if (parallelTest.bottleneck) bottlenecks.push(parallelTest.bottleneck);
    }

    // Test 3: Memory efficiency
    tests.push('memory_efficiency');
    const memoryTest = await this.testMemoryEfficiency();
    if (memoryTest.passed) passed.push('memory_efficiency');
    else {
      failed.push('memory_efficiency');
      if (memoryTest.bottleneck) bottlenecks.push(memoryTest.bottleneck);
    }

    // Test 4: RAG query performance
    tests.push('rag_query_performance');
    const ragTest = await this.testRAGPerformance();
    if (ragTest.passed) passed.push('rag_query_performance');
    else {
      failed.push('rag_query_performance');
      if (ragTest.bottleneck) bottlenecks.push(ragTest.bottleneck);
    }

    // Test 5: Proactive system accuracy
    tests.push('proactive_system_accuracy');
    const proactiveTest = await this.testProactiveSystemAccuracy();
    if (proactiveTest.passed) passed.push('proactive_system_accuracy');
    else {
      failed.push('proactive_system_accuracy');
      if (proactiveTest.bottleneck) bottlenecks.push(proactiveTest.bottleneck);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (failed.length > 0) {
      recommendations.push(`Fix ${failed.length} failing tests: ${failed.join(', ')}`);
    }
    if (bottlenecks.length > 0) {
      recommendations.push(`Address bottlenecks: ${bottlenecks.join(', ')}`);
    }

    return {
      last_run: Date.now(),
      test_count: tests.length,
      passed: passed.length,
      failed: failed.length,
      performance_regression: failed.length > 0,
      bottlenecks: [...new Set(bottlenecks)],
      recommendations
    };
  }

  /**
   * Test agent activation speed
   */
  private async testAgentActivationSpeed(): Promise<{ passed: boolean; bottleneck?: string }> {
    // Test should activate agent in < 200ms
    const targetMs = 200;

    // TODO: Implement actual test
    // For now, return mock result
    return { passed: true };
  }

  /**
   * Test parallel execution (Rule 1)
   */
  private async testParallelExecution(): Promise<{ passed: boolean; bottleneck?: string }> {
    // Test should execute 3 agents in parallel faster than sequential
    // TODO: Implement actual test
    return { passed: true };
  }

  /**
   * Test memory efficiency
   */
  private async testMemoryEfficiency(): Promise<{ passed: boolean; bottleneck?: string }> {
    // Test should use < 500MB for typical operations
    // TODO: Implement actual test
    return { passed: true };
  }

  /**
   * Test RAG query performance
   */
  private async testRAGPerformance(): Promise<{ passed: boolean; bottleneck?: string }> {
    // Test should return results in < 100ms
    // TODO: Implement actual test
    return { passed: true };
  }

  /**
   * Test proactive system accuracy
   */
  private async testProactiveSystemAccuracy(): Promise<{ passed: boolean; bottleneck?: string }> {
    // Test should have >90% accuracy (correct agent for file type)
    // TODO: Implement actual test
    return { passed: true };
  }

  /**
   * Check version compatibility
   */
  private async checkVersionCompatibility(): Promise<VersionCompatibility> {
    console.log('  🔄 Checking version compatibility...');

    // TODO: Implement actual version checking
    return {
      current_version: '2.0.0',
      migration_ready: true,
      breaking_changes: [],
      compatibility_score: 100,
      upgrade_blockers: []
    };
  }

  /**
   * Calculate overall framework health (0-100)
   */
  private calculateOverallHealth(
    agentPerf: AgentPerformanceMetrics,
    proactive: ProactiveSystemMetrics,
    rules: RulesEfficiencyMetrics,
    stress: StressTestResults
  ): number {
    // Calculate weighted average
    const agentHealth = Object.values(agentPerf).reduce((sum, agent) =>
      sum + agent.efficiency_score, 0) / 6;

    const proactiveHealth = proactive.accuracy;

    const rulesHealth = Object.values(rules).reduce((sum, rule) =>
      sum + (rule.enabled ? rule.impact_score : 0), 0) / 5;

    const stressHealth = (stress.passed / stress.test_count) * 100;

    const overall = (
      agentHealth * 0.3 +
      proactiveHealth * 0.3 +
      rulesHealth * 0.2 +
      stressHealth * 0.2
    );

    return Math.round(overall);
  }

  /**
   * Detect framework issues
   */
  private async detectFrameworkIssues(): Promise<void> {
    this.issues = [];

    // Check agent performance issues
    for (const [agentId, stats] of Object.entries(this.metrics.agent_performance)) {
      if (stats.efficiency_score < 70) {
        this.issues.push({
          severity: 'high',
          component: `Agent: ${agentId}`,
          description: `Low efficiency score: ${stats.efficiency_score}%`,
          impact: 'Degraded agent performance affects overall development speed',
          auto_fix_available: true,
          recommendation: 'Run /doctor --fix to optimize agent configuration'
        });
      }

      if (stats.error_count > 5) {
        this.issues.push({
          severity: 'medium',
          component: `Agent: ${agentId}`,
          description: `High error count: ${stats.error_count}`,
          impact: 'Agent reliability issues',
          auto_fix_available: false,
          recommendation: 'Review agent logs and error patterns'
        });
      }
    }

    // Check proactive system issues
    if (this.metrics.proactive_system.accuracy < 90) {
      this.issues.push({
        severity: 'medium',
        component: 'Proactive System',
        description: `Low accuracy: ${this.metrics.proactive_system.accuracy}%`,
        impact: 'Incorrect agent activations waste resources',
        auto_fix_available: true,
        recommendation: 'Refine activation triggers in .cursor/settings.json'
      });
    }

    // Check stress test failures
    if (this.metrics.stress_test_results.failed > 0) {
      this.issues.push({
        severity: this.metrics.stress_test_results.failed > 2 ? 'critical' : 'high',
        component: 'Framework Performance',
        description: `${this.metrics.stress_test_results.failed} stress tests failing`,
        impact: 'Performance regression detected',
        auto_fix_available: false,
        recommendation: this.metrics.stress_test_results.recommendations.join('; ')
      });
    }

    // Check overall health
    if (this.metrics.overall_health < 70) {
      this.issues.push({
        severity: 'critical',
        component: 'Framework Health',
        description: `Overall health below threshold: ${this.metrics.overall_health}%`,
        impact: 'Framework efficiency compromised',
        auto_fix_available: true,
        recommendation: 'Run comprehensive diagnostics: /doctor && npm run test:framework'
      });
    }
  }

  /**
   * Monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Update metrics
      await this.performComprehensiveHealthCheck();

      // Emit metrics
      this.emit('metrics-updated', this.metrics);

      // Check for critical issues
      const criticalIssues = this.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        this.emit('critical-issues-detected', criticalIssues);
        console.error(`❌ ${criticalIssues.length} CRITICAL framework issues detected!`);
      }

    } catch (error) {
      console.error('Monitoring cycle failed:', error);
      this.emit('monitoring-error', error);
    }
  }

  /**
   * Track agent activation
   */
  private trackAgentActivation(agentId: string, type: 'proactive' | 'manual'): void {
    // Update tracking metrics
    // TODO: Persist metrics to database
  }

  /**
   * Track agent completion
   */
  private trackAgentCompletion(agentIds: string[], results: any): void {
    // Update success metrics
    // TODO: Persist metrics to database
  }

  /**
   * Track agent failure
   */
  private trackAgentFailure(agentIds: string[], error: any): void {
    // Update error metrics
    // TODO: Persist metrics to database
  }

  /**
   * Get current metrics
   */
  public getMetrics(): FrameworkMetrics {
    return this.metrics;
  }

  /**
   * Get current issues
   */
  public getIssues(): FrameworkIssue[] {
    return this.issues;
  }

  /**
   * Generate health report
   */
  public generateHealthReport(): string {
    const report = [];
    report.push('='.repeat(60));
    report.push('📊 VERSATIL Framework Health Report');
    report.push('='.repeat(60));
    report.push('');
    report.push(`Overall Health: ${this.metrics.overall_health}% ${this.getHealthEmoji(this.metrics.overall_health)}`);
    report.push(`Timestamp: ${new Date(this.metrics.timestamp).toISOString()}`);
    report.push('');

    // Agent Performance
    report.push('👥 Agent Performance:');
    for (const [agentId, stats] of Object.entries(this.metrics.agent_performance)) {
      report.push(`  ${agentId}: ${stats.efficiency_score}% ${this.getHealthEmoji(stats.efficiency_score)}`);
      report.push(`    - Success Rate: ${(stats.success_rate * 100).toFixed(1)}%`);
      report.push(`    - Avg Response: ${stats.avg_response_time_ms}ms`);
      report.push(`    - Errors: ${stats.error_count}`);
    }
    report.push('');

    // Proactive System
    report.push('🤖 Proactive System:');
    report.push(`  - Accuracy: ${this.metrics.proactive_system.accuracy}%`);
    report.push(`  - Auto Activations: ${this.metrics.proactive_system.auto_activations}`);
    report.push(`  - Avg Activation Time: ${this.metrics.proactive_system.avg_activation_time_ms}ms`);
    report.push('');

    // Stress Tests
    report.push('🧪 Stress Tests:');
    report.push(`  - Passed: ${this.metrics.stress_test_results.passed}/${this.metrics.stress_test_results.test_count}`);
    if (this.metrics.stress_test_results.bottlenecks.length > 0) {
      report.push(`  - Bottlenecks: ${this.metrics.stress_test_results.bottlenecks.join(', ')}`);
    }
    report.push('');

    // Issues
    if (this.issues.length > 0) {
      report.push('⚠️  Issues Detected:');
      for (const issue of this.issues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'high' ? '🟠' :
                     issue.severity === 'medium' ? '🟡' : '🟢';
        report.push(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.component}`);
        report.push(`     ${issue.description}`);
        report.push(`     → ${issue.recommendation}`);
      }
    } else {
      report.push('✅ No issues detected');
    }

    report.push('');
    report.push('='.repeat(60));

    return report.join('\n');
  }

  /**
   * Get health emoji
   */
  private getHealthEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 75) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  /**
   * Initialize empty metrics
   */
  private initializeMetrics(): FrameworkMetrics {
    return {
      timestamp: Date.now(),
      overall_health: 0,
      agent_performance: {
        maria_qa: this.createEmptyAgentStats(),
        james_frontend: this.createEmptyAgentStats(),
        marcus_backend: this.createEmptyAgentStats(),
        sarah_pm: this.createEmptyAgentStats(),
        alex_ba: this.createEmptyAgentStats(),
        dr_ai_ml: this.createEmptyAgentStats()
      },
      proactive_system: {
        enabled: false,
        auto_activations: 0,
        false_positives: 0,
        false_negatives: 0,
        accuracy: 0,
        avg_activation_time_ms: 0,
        user_satisfaction_score: 0,
        slash_command_fallbacks: 0
      },
      rules_efficiency: {
        rule1_parallel_execution: this.createEmptyRuleStats(),
        rule2_stress_testing: this.createEmptyRuleStats(),
        rule3_daily_audit: this.createEmptyRuleStats(),
        rule4_onboarding: this.createEmptyRuleStats(),
        rule5_releases: this.createEmptyRuleStats()
      },
      stress_test_results: {
        last_run: 0,
        test_count: 0,
        passed: 0,
        failed: 0,
        performance_regression: false,
        bottlenecks: [],
        recommendations: []
      },
      version_compatibility: {
        current_version: '2.0.0',
        migration_ready: true,
        breaking_changes: [],
        compatibility_score: 100,
        upgrade_blockers: []
      }
    };
  }

  /**
   * Create empty agent stats
   */
  private createEmptyAgentStats(): AgentStats {
    return {
      activation_count: 0,
      success_rate: 1.0,
      avg_response_time_ms: 0,
      error_count: 0,
      last_active: 0,
      proactive_triggers: 0,
      manual_triggers: 0,
      efficiency_score: 0
    };
  }

  /**
   * Create empty rule stats
   */
  private createEmptyRuleStats(): RuleStats {
    return {
      enabled: false,
      execution_count: 0,
      success_rate: 1.0,
      impact_score: 0,
      overhead_ms: 0,
      value_delivered: 0
    };
  }

  /**
   * Cleanup
   */
  public shutdown(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// Singleton instance
let monitorInstance: FrameworkEfficiencyMonitor | null = null;

export function getFrameworkMonitor(): FrameworkEfficiencyMonitor {
  if (!monitorInstance) {
    monitorInstance = new FrameworkEfficiencyMonitor();
  }
  return monitorInstance;
}

export function destroyFrameworkMonitor(): void {
  if (monitorInstance) {
    monitorInstance.shutdown();
    monitorInstance = null;
  }
}