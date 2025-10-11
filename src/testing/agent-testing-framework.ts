/**
 * VERSATIL SDLC Framework - Comprehensive Agent Testing Framework
 *
 * Tests all enhanced OPERA agents against the configuration validation scenarios
 * identified in the Enhanced Maria analysis, including the VERSSAI Brain Route Bug
 * and other cross-file consistency issues.
 */

import { BaseAgent, AgentActivationContext, ValidationResults } from '../agents/core/base-agent.js';
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  testType: 'configuration' | 'navigation' | 'integration' | 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  mockContent: string;
  filePath: string;
  expectedIssues: string[];
  expectedRecommendations: string[];
  targetAgents: string[];
}

export interface TestResult {
  scenario: string;
  agent: string;
  passed: boolean;
  issues: string[];
  recommendations: string[];
  score: number;
  executionTime: number;
  errors: string[];
}

export class AgentTestingFramework {
  private testScenarios: TestScenario[] = [];
  private testResults: TestResult[] = [];
  private agentRegistry: AgentRegistry;

  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
    // Scenarios will be loaded lazily on first test run
  }

  /**
   * Load test fixture from file system
   */
  private async loadFixture(fixtureName: string): Promise<string> {
    try {
      const fixturePath = join(process.cwd(), 'tests', 'fixtures', 'code-samples', fixtureName);
      return await readFile(fixturePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load fixture: ${fixtureName}`, error);
      throw error;
    }
  }

  private async initializeTestScenarios(): Promise<void> {
    // Based on the Enhanced Maria analysis, these are the key scenarios that should be caught

    // 1. VERSSAI Brain Route Bug - The original problem that Maria missed
    this.testScenarios.push({
      id: 'verssai-brain-route-bug',
      name: 'VERSSAI Brain Route Debug Code Detection',
      description: 'Detect debugging wrapper code in production routes that caused the original issue',
      testType: 'configuration',
      severity: 'critical',
      mockContent: await this.loadFixture('react-debug-route.tsx'),
      filePath: 'src/App.tsx',
      expectedIssues: [
        'debugging-code',
        'hardcoded-debug-styles',
        'route-definition-inconsistency'
      ],
      expectedRecommendations: [
        'critical-fix',
        'navigation-consistency'
      ],
      targetAgents: ['enhanced-maria', 'enhanced-james']
    });

    // 2. Menu Item → Route Mapping Validation
    this.testScenarios.push({
      id: 'menu-route-mapping-mismatch',
      name: 'Menu Item Route Mapping Validation',
      description: 'Detect mismatches between navigation menu items and actual route definitions',
      testType: 'navigation',
      severity: 'high',
      mockContent: await this.loadFixture('menu-route-mismatch.tsx'),
      filePath: 'src/navigation/NavigationConfig.tsx',
      expectedIssues: [
        'navigation-route-mismatch',
        'missing-route-component'
      ],
      expectedRecommendations: [
        'navigation-consistency'
      ],
      targetAgents: ['enhanced-james', 'enhanced-maria']
    });

    // 3. Profile Context Navigation Consistency
    this.testScenarios.push({
      id: 'profile-context-navigation',
      name: 'Profile Context Navigation Consistency',
      description: 'Validate profile context state consistency with navigation permissions',
      testType: 'integration',
      severity: 'high',
      mockContent: await this.loadFixture('profile-context-nav.tsx'),
      filePath: 'src/context/ProfileContext.tsx',
      expectedIssues: [
        'profile-context-inconsistency',
        'missing-navigation-guards'
      ],
      expectedRecommendations: [
        'navigation-consistency'
      ],
      targetAgents: ['enhanced-james', 'enhanced-maria']
    });

    // 4. Configuration Drift Detection
    this.testScenarios.push({
      id: 'configuration-drift',
      name: 'Cross-File Configuration Drift',
      description: 'Detect configuration values that are inconsistent across files',
      testType: 'configuration',
      severity: 'medium',
      mockContent: await this.loadFixture('config-drift.ts'),
      filePath: 'src/config/config.ts',
      expectedIssues: [
        'configuration-drift',
        'hardcoded-endpoints'
      ],
      expectedRecommendations: [
        'configuration-management'
      ],
      targetAgents: ['enhanced-marcus', 'enhanced-maria']
    });

    // 5. Dead Code in Route Definitions
    this.testScenarios.push({
      id: 'dead-code-routes',
      name: 'Dead Code in Route Definitions',
      description: 'Detect unused route definitions and imports',
      testType: 'configuration',
      severity: 'medium',
      mockContent: await this.loadFixture('dead-code-routes.tsx'),
      filePath: 'src/routes/AppRoutes.tsx',
      expectedIssues: [
        'dead-code'
      ],
      expectedRecommendations: [
        'code-cleanup'
      ],
      targetAgents: ['enhanced-maria', 'enhanced-james']
    });

    // 6. Integration Testing Gaps
    this.testScenarios.push({
      id: 'integration-testing-gaps',
      name: 'Missing Integration Tests for Navigation Flow',
      description: 'Detect missing integration tests for critical navigation flows',
      testType: 'integration',
      severity: 'medium',
      mockContent: await this.loadFixture('integration-test-gaps.test.tsx'),
      filePath: 'src/__tests__/Navigation.test.tsx',
      expectedIssues: [
        'integration-gap'
      ],
      expectedRecommendations: [
        'testing'
      ],
      targetAgents: ['enhanced-maria']
    });

    // 7. API-Frontend Integration Inconsistency
    this.testScenarios.push({
      id: 'api-frontend-integration',
      name: 'API-Frontend Contract Mismatch',
      description: 'Detect mismatches between frontend expectations and backend API contracts',
      testType: 'integration',
      severity: 'high',
      mockContent: await this.loadFixture('api-contract-mismatch.ts'),
      filePath: 'src/services/UserService.ts',
      expectedIssues: [
        'api-parameter-naming-inconsistency',
        'missing-api-types'
      ],
      expectedRecommendations: [
        'api-integration-improvement'
      ],
      targetAgents: ['enhanced-marcus', 'enhanced-maria']
    });

    // 8. Security Configuration Issues
    this.testScenarios.push({
      id: 'security-config-issues',
      name: 'Security Configuration Vulnerabilities',
      description: 'Detect security issues in configuration and API setup',
      testType: 'security',
      severity: 'critical',
      mockContent: await this.loadFixture('security-config-issues.ts'),
      filePath: 'src/config/ApiConfig.ts',
      expectedIssues: [
        'insecure-api-patterns',
        'configuration-security-issues',
        'security-risk'
      ],
      expectedRecommendations: [
        'security-hardening'
      ],
      targetAgents: ['security-sam', 'enhanced-marcus', 'enhanced-maria']
    });

    console.log(`🧪 Initialized ${this.testScenarios.length} test scenarios`);
  }

  /**
   * Run all tests against all applicable agents
   */
  public async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Running comprehensive agent testing framework...');

    // Initialize test scenarios (lazy loading with real fixtures)
    if (this.testScenarios.length === 0) {
      await this.initializeTestScenarios();
      console.log(`🧪 Loaded ${this.testScenarios.length} test scenarios from fixtures`);
    }

    this.testResults = [];

    for (const scenario of this.testScenarios) {
      console.log(`\n📋 Testing scenario: ${scenario.name}`);

      for (const agentId of scenario.targetAgents) {
        const result = await this.runSingleTest(scenario, agentId);
        this.testResults.push(result);

        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${agentId}: ${result.score}% (${result.executionTime}ms)`);

        if (!result.passed) {
          console.log(`      Missing: ${result.errors.join(', ')}`);
        }
      }
    }

    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Run a single test scenario against a specific agent
   */
  private async runSingleTest(scenario: TestScenario, agentId: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const agent = this.agentRegistry.getAgent(agentId);
      if (!agent) {
        return {
          scenario: scenario.id,
          agent: agentId,
          passed: false,
          issues: [],
          recommendations: [],
          score: 0,
          executionTime: Date.now() - startTime,
          errors: [`Agent ${agentId} not found`]
        };
      }

      // Create activation context
      const context: AgentActivationContext = {
        filePath: scenario.filePath,
        content: scenario.mockContent,
        userRequest: `Test scenario: ${scenario.description}`,
        contextClarity: 'clear',
        emergency: scenario.severity === 'critical'
      };

      // Activate agent
      const response = await agent.activate(context);

      // Extract issues and recommendations from response
      const detectedIssues = this.extractIssuesFromResponse(response);
      const detectedRecommendations = this.extractRecommendationsFromResponse(response);

      // Check if expected issues were detected
      const missedIssues = scenario.expectedIssues.filter(expected =>
        !detectedIssues.some(detected => detected.includes(expected))
      );

      const missedRecommendations = scenario.expectedRecommendations.filter(expected =>
        !detectedRecommendations.some(detected => detected.includes(expected))
      );

      // Calculate score
      const expectedTotal = scenario.expectedIssues.length + scenario.expectedRecommendations.length;
      const detectedTotal = (scenario.expectedIssues.length - missedIssues.length) +
                           (scenario.expectedRecommendations.length - missedRecommendations.length);
      const score = expectedTotal > 0 ? Math.round((detectedTotal / expectedTotal) * 100) : 100;

      const passed = missedIssues.length === 0 && missedRecommendations.length === 0;

      return {
        scenario: scenario.id,
        agent: agentId,
        passed,
        issues: detectedIssues,
        recommendations: detectedRecommendations,
        score,
        executionTime: Date.now() - startTime,
        errors: [...missedIssues.map(i => `Missing issue: ${i}`),
                ...missedRecommendations.map(r => `Missing recommendation: ${r}`)]
      };

    } catch (error) {
      return {
        scenario: scenario.id,
        agent: agentId,
        passed: false,
        issues: [],
        recommendations: [],
        score: 0,
        executionTime: Date.now() - startTime,
        errors: [`Test execution failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  private extractIssuesFromResponse(response: any): string[] {
    const issues: string[] = [];

    // Extract from message content
    if (response.message && typeof response.message === 'string') {
      const issueMatches = response.message.match(/\*\*([^*]+)\*\*/g);
      if (issueMatches) {
        issues.push(...issueMatches.map((match: string) => match.replace(/\*\*/g, '')));
      }
    }

    // Extract from suggestions
    if (response.suggestions && Array.isArray(response.suggestions)) {
      response.suggestions.forEach((suggestion: any) => {
        if (suggestion.type) {
          issues.push(suggestion.type);
        }
      });
    }

    return issues;
  }

  private extractRecommendationsFromResponse(response: any): string[] {
    const recommendations: string[] = [];

    if (response.suggestions && Array.isArray(response.suggestions)) {
      response.suggestions.forEach((suggestion: any) => {
        if (suggestion.type) {
          recommendations.push(suggestion.type);
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('\n📊 Enhanced OPERA Agent Testing Report');
    console.log('='.repeat(80));

    // Overall statistics
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const overallPassRate = Math.round((passedTests / totalTests) * 100);

    console.log(`\n🎯 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${overallPassRate}%)`);
    console.log(`   Failed: ${totalTests - passedTests}`);

    // Results by agent
    console.log(`\n🤖 Results by Agent:`);
    const agentStats = this.getAgentStatistics();
    Object.entries(agentStats).forEach(([agent, stats]) => {
      const passRate = Math.round((stats.passed / stats.total) * 100);
      const avgScore = Math.round(stats.totalScore / stats.total);
      console.log(`   ${agent}: ${stats.passed}/${stats.total} (${passRate}%) - Avg Score: ${avgScore}%`);
    });

    // Results by scenario type
    console.log(`\n📋 Results by Scenario Type:`);
    const typeStats = this.getScenarioTypeStatistics();
    Object.entries(typeStats).forEach(([type, stats]) => {
      const passRate = Math.round((stats.passed / stats.total) * 100);
      console.log(`   ${type}: ${stats.passed}/${stats.total} (${passRate}%)`);
    });

    // Critical failures
    const criticalFailures = this.testResults.filter(r =>
      !r.passed && this.testScenarios.find(s => s.id === r.scenario)?.severity === 'critical'
    );

    if (criticalFailures.length > 0) {
      console.log(`\n🚨 Critical Failures:`);
      criticalFailures.forEach(failure => {
        const scenario = this.testScenarios.find(s => s.id === failure.scenario);
        console.log(`   ❌ ${failure.agent}: ${scenario?.name}`);
        failure.errors.forEach(error => console.log(`      - ${error}`));
      });
    }

    // Performance metrics
    const avgExecutionTime = Math.round(
      this.testResults.reduce((sum, r) => sum + r.executionTime, 0) / totalTests
    );
    console.log(`\n⚡ Performance: Average execution time: ${avgExecutionTime}ms`);

    console.log('\n' + '='.repeat(80));

    // Recommendations for improvement
    if (overallPassRate < 100) {
      console.log('\n💡 Recommendations for Improvement:');

      if (overallPassRate < 80) {
        console.log('   🔴 URGENT: Overall pass rate below 80% - review agent implementations');
      }

      Object.entries(agentStats).forEach(([agent, stats]) => {
        const passRate = (stats.passed / stats.total) * 100;
        if (passRate < 90) {
          console.log(`   ⚠️  ${agent}: Pass rate ${Math.round(passRate)}% - needs enhancement`);
        }
      });

      if (criticalFailures.length > 0) {
        console.log('   🚨 Address critical scenario failures immediately');
      }
    } else {
      console.log('\n✅ All tests passed! Enhanced OPERA agents are working correctly.');
    }
  }

  private getAgentStatistics() {
    const stats: Record<string, { total: number; passed: number; totalScore: number }> = {};

    this.testResults.forEach(result => {
      if (!stats[result.agent]) {
        stats[result.agent] = { total: 0, passed: 0, totalScore: 0 };
      }
      const agentStats = stats[result.agent]!;
      agentStats.total++;
      if (result.passed) agentStats.passed++;
      agentStats.totalScore += result.score;
    });

    return stats;
  }

  private getScenarioTypeStatistics() {
    const stats: Record<string, { total: number; passed: number }> = {};

    this.testResults.forEach(result => {
      const scenario = this.testScenarios.find(s => s.id === result.scenario);
      const type = scenario?.testType || 'unknown';

      if (!stats[type]) {
        stats[type] = { total: 0, passed: 0 };
      }
      stats[type].total++;
      if (result.passed) stats[type].passed++;
    });

    return stats;
  }

  /**
   * Run tests for a specific scenario
   */
  public async runScenarioTests(scenarioId: string): Promise<TestResult[]> {
    // Initialize test scenarios if not already loaded
    if (this.testScenarios.length === 0) {
      await this.initializeTestScenarios();
    }

    const scenario = this.testScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    console.log(`🧪 Running tests for scenario: ${scenario.name}`);

    const results: TestResult[] = [];
    for (const agentId of scenario.targetAgents) {
      const result = await this.runSingleTest(scenario, agentId);
      results.push(result);
    }

    return results;
  }

  /**
   * Get all test scenarios (async to support lazy loading)
   */
  public async getTestScenarios(): Promise<TestScenario[]> {
    if (this.testScenarios.length === 0) {
      await this.initializeTestScenarios();
    }
    return [...this.testScenarios];
  }

  /**
   * Get test results
   */
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }
}

// Export singleton instance - lazy initialization
let _instance: AgentTestingFramework | null = null;
export function getAgentTestingFramework(agentRegistry: AgentRegistry): AgentTestingFramework {
  if (!_instance) {
    _instance = new AgentTestingFramework(agentRegistry);
  }
  return _instance;
}