/**
 * VERSATIL SDLC Framework - Comprehensive Agent Testing Framework
 *
 * Tests all enhanced BMAD agents against the configuration validation scenarios
 * identified in the Enhanced Maria analysis, including the VERSSAI Brain Route Bug
 * and other cross-file consistency issues.
 */

import { BaseAgent, AgentActivationContext, ValidationResults } from '../agents/base-agent.js';
import { AgentRegistry } from '../agents/agent-registry.js';

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
    this.initializeTestScenarios();
  }

  private initializeTestScenarios(): void {
    // Based on the Enhanced Maria analysis, these are the key scenarios that should be caught

    // 1. VERSSAI Brain Route Bug - The original problem that Maria missed
    this.testScenarios.push({
      id: 'verssai-brain-route-bug',
      name: 'VERSSAI Brain Route Debug Code Detection',
      description: 'Detect debugging wrapper code in production routes that caused the original issue',
      testType: 'configuration',
      severity: 'critical',
      mockContent: `
import React from 'react';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/osint-brain" element={
        <div style={{ color: 'purple' }}>🧠 Route Test</div>
      } />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
      `,
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
      mockContent: `
const navigationItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'osint-brain', label: 'OSINT Brain', path: '/osint-brain' },
  { key: 'analytics', label: 'Analytics', path: '/analytics' }
];

// Routes defined elsewhere
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* Missing: /osint-brain route */}
  <Route path="/reports" element={<Reports />} /> {/* Extra route not in menu */}
</Routes>
      `,
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
      mockContent: `
const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

  const handleNavigation = (path) => {
    // Missing context validation
    navigate(path);
  };

  // Profile context doesn't validate navigation permissions
  return (
    <ProfileContext.Provider value={{ profile, handleNavigation }}>
      {children}
    </ProfileContext.Provider>
  );
};
      `,
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
      mockContent: `
// File 1: config.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// File 2: services.ts (in same content for testing)
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // Different from config!
});

// File 3: constants.ts (in same content for testing)
export const DEFAULT_API_URL = 'https://api.production.com'; // Yet another different URL!
      `,
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
      mockContent: `
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './Dashboard.js';
import { Profile } from './Profile.js';
import { UnusedComponent } from './UnusedComponent.js'; // Dead import
import { AnotherUnused } from './AnotherUnused.js'; // Dead import

function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      {/* UnusedComponent and AnotherUnused are imported but never used */}
    </Routes>
  );
}
      `,
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
      mockContent: `
describe('Navigation Tests', () => {
  test('should navigate to dashboard', () => {
    // Basic unit test only
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  // Missing: Integration tests for navigation flows
  // Missing: Tests for profile context navigation
  // Missing: Tests for route-menu consistency
});
      `,
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
      mockContent: `
// Frontend expects this interface
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string; // snake_case
}

// But API endpoint returns this (different naming)
const fetchUserProfile = async (id: string) => {
  const response = await fetch(\`/api/users/\${id}\`);
  const data = await response.json();
  // API returns: { id, name, email, avatarUrl } // camelCase!
  return data as UserProfile; // Type assertion hides the mismatch
};
      `,
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
      mockContent: `
// Hardcoded API key - security risk
const API_KEY = 'sk-test-fake-key-for-testing-only';

// Insecure API configuration
const apiConfig = {
  baseURL: 'http://localhost:3000', // Not HTTPS
  timeout: 30000,
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`, // Hardcoded secret
    'X-API-Key': 'another-hardcoded-key'
  }
};

// Missing input validation
const processUserInput = (input) => {
  document.innerHTML = input; // XSS vulnerability
  eval(input); // Code injection vulnerability
};
      `,
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
    console.log('\n📊 Enhanced BMAD Agent Testing Report');
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
      console.log('\n✅ All tests passed! Enhanced BMAD agents are working correctly.');
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
   * Get all test scenarios
   */
  public getTestScenarios(): TestScenario[] {
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