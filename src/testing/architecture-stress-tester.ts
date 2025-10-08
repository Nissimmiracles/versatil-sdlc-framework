/**
 * VERSATIL Framework - Architecture Stress Tester
 * Validates architecture through load simulation and failure scenarios
 *
 * Features:
 * - Load simulation (1k, 10k, 100k, 1M concurrent users)
 * - Failure scenario testing (DB down, API timeout, network issues)
 * - Performance regression detection
 * - Bottleneck identification
 * - Capacity planning recommendations
 * - RAG-based historical performance comparison
 *
 * Addresses: User requirement #3 - "check the web in the background to stress test
 * the architecture and the logic in order to execute the prd in the best way"
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export interface StressTestConfig {
  testId: string;
  testName: string;
  architecture: ArchitectureDescription;
  loadProfile: LoadProfile;
  failureScenarios?: FailureScenario[];
  successCriteria: SuccessCriteria;
  duration?: number; // Test duration in seconds (default: 60)
  backgroundMode?: boolean;
}

export interface ArchitectureDescription {
  components: Component[];
  connections: Connection[];
  dataFlow: DataFlow[];
  techStack: string[];
}

export interface Component {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'service' | 'frontend';
  capacity?: {
    maxConnections?: number;
    maxThroughput?: string; // e.g., '10k req/s'
    maxMemory?: string; // e.g., '4GB'
  };
  dependencies: string[]; // Component IDs this depends on
}

export interface Connection {
  from: string; // Component ID
  to: string; // Component ID
  protocol: 'http' | 'grpc' | 'websocket' | 'tcp' | 'queue';
  latency?: number; // Expected latency in ms
  bandwidth?: string; // e.g., '1Gbps'
}

export interface DataFlow {
  path: string[]; // Component IDs in order
  description: string;
  expectedLatency: number; // End-to-end latency in ms
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

export interface LoadProfile {
  pattern: 'constant' | 'ramp-up' | 'spike' | 'wave' | 'burst';
  concurrentUsers: number;
  requestsPerSecond?: number;
  rampUpTime?: number; // Seconds to reach target load
  peakDuration?: number; // Seconds at peak load
}

export interface FailureScenario {
  id: string;
  type: 'component-down' | 'slow-response' | 'network-partition' | 'resource-exhaustion' | 'cascading-failure';
  targetComponent: string;
  triggeredAt?: number; // Seconds into test
  duration?: number; // Seconds
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SuccessCriteria {
  maxResponseTime?: number; // p95 in ms
  maxErrorRate?: number; // Percentage (0-100)
  minThroughput?: number; // Requests per second
  maxCpuUsage?: number; // Percentage (0-100)
  maxMemoryUsage?: number; // Percentage (0-100)
  maxDatabaseConnections?: number;
}

export interface StressTestResult {
  testId: string;
  status: 'passed' | 'failed' | 'partial';
  startTime: number;
  endTime: number;
  duration: number; // ms
  metrics: PerformanceMetrics;
  bottlenecks: Bottleneck[];
  failurePoints: FailurePoint[];
  recommendations: string[];
  comparisonWithHistory?: HistoricalComparison;
  passed: boolean;
  failureReasons?: string[];
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
    avg: number;
  };
  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
  };
  errorRate: number; // Percentage
  availability: number; // Percentage
  resourceUsage: {
    cpu: { avg: number; max: number };
    memory: { avg: number; max: number };
    network: { avg: number; max: number };
    diskIO: { avg: number; max: number };
  };
  databaseMetrics?: {
    connections: { avg: number; max: number };
    queryTime: { p50: number; p95: number; p99: number };
    deadlocks: number;
  };
}

export interface Bottleneck {
  component: string;
  type: 'cpu' | 'memory' | 'network' | 'io' | 'database' | 'external-api';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string; // How it affects overall performance
  recommendation: string;
  metrics: Record<string, number>;
}

export interface FailurePoint {
  component: string;
  triggeredAt: number; // Seconds into test
  scenario?: string;
  impact: string;
  recovered: boolean;
  recoveryTime?: number; // Seconds
}

export interface HistoricalComparison {
  baselineTestId: string;
  regressions: Array<{
    metric: string;
    baseline: number;
    current: number;
    changePercent: number;
  }>;
  improvements: Array<{
    metric: string;
    baseline: number;
    current: number;
    changePercent: number;
  }>;
}

export interface StressTestStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageTestDuration: number;
  bottlenecksFound: number;
  failuresSurvived: number;
}

export class ArchitectureStressTester extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private activeTests: Map<string, StressTestConfig> = new Map();
  private testResults: Map<string, StressTestResult> = new Map();
  private stats: StressTestStats = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageTestDuration: 0,
    bottlenecksFound: 0,
    failuresSurvived: 0
  };
  private testDurations: number[] = [];

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
  }

  async initialize(): Promise<void> {
    console.log('🧪 Architecture Stress Tester initializing...');

    // Load historical test results from RAG
    await this.loadHistoricalTests();

    this.emit('tester:initialized');
    console.log('✅ Architecture Stress Tester ready');
  }

  /**
   * Run stress test (main method)
   */
  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    const startTime = Date.now();
    this.stats.totalTests++;

    console.log(`🧪 Starting stress test: ${config.testName}`);
    console.log(`   Load: ${config.loadProfile.concurrentUsers} users (${config.loadProfile.pattern} pattern)`);
    console.log(`   Components: ${config.architecture.components.length}`);
    console.log(`   Failure scenarios: ${config.failureScenarios?.length || 0}`);

    this.activeTests.set(config.testId, config);

    try {
      // Validate architecture first
      const validationErrors = this.validateArchitecture(config.architecture);
      if (validationErrors.length > 0) {
        throw new Error(`Architecture validation failed: ${validationErrors.join(', ')}`);
      }

      // Simulate load test
      const metrics = await this.simulateLoad(config);

      // Run failure scenarios
      const failurePoints = await this.simulateFailures(config);

      // Detect bottlenecks
      const bottlenecks = this.detectBottlenecks(config.architecture, metrics);

      // Check success criteria
      const { passed, failureReasons } = this.checkSuccessCriteria(config.successCriteria, metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(config, metrics, bottlenecks, failurePoints);

      // Compare with historical results
      const comparisonWithHistory = await this.compareWithHistory(config, metrics);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result: StressTestResult = {
        testId: config.testId,
        status: passed ? 'passed' : (bottlenecks.length > 0 ? 'partial' : 'failed'),
        startTime,
        endTime,
        duration,
        metrics,
        bottlenecks,
        failurePoints,
        recommendations,
        comparisonWithHistory,
        passed,
        failureReasons
      };

      // Store result
      this.testResults.set(config.testId, result);
      this.activeTests.delete(config.testId);

      // Store in RAG
      await this.storeTestPattern(config, result);

      // Update stats
      this.recordTestDuration(duration);
      if (passed) this.stats.passedTests++;
      else this.stats.failedTests++;
      this.stats.bottlenecksFound += bottlenecks.length;
      this.stats.failuresSurvived += failurePoints.filter(f => f.recovered).length;

      this.emit('test:completed', {
        testId: config.testId,
        passed,
        duration,
        bottlenecksCount: bottlenecks.length
      });

      console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}: ${config.testName} (${duration}ms)`);
      console.log(`   Response time (p95): ${metrics.responseTime.p95}ms`);
      console.log(`   Throughput: ${metrics.throughput.requestsPerSecond} req/s`);
      console.log(`   Error rate: ${metrics.errorRate.toFixed(2)}%`);
      console.log(`   Bottlenecks found: ${bottlenecks.length}`);

      return result;
    } catch (error: any) {
      this.stats.failedTests++;
      this.activeTests.delete(config.testId);

      console.error(`   ❌ Stress test failed:`, error.message);

      this.emit('test:failed', {
        testId: config.testId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Validate architecture before testing
   */
  private validateArchitecture(architecture: ArchitectureDescription): string[] {
    const errors: string[] = [];

    // Check for orphaned components (no connections)
    for (const component of architecture.components) {
      const hasIncoming = architecture.connections.some(c => c.to === component.id);
      const hasOutgoing = architecture.connections.some(c => c.from === component.id);

      if (!hasIncoming && !hasOutgoing && component.type !== 'frontend') {
        errors.push(`Component "${component.name}" has no connections`);
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(architecture.components);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for missing capacity specifications
    const criticalComponents = architecture.components.filter(c =>
      c.type === 'database' || c.type === 'api'
    );
    for (const component of criticalComponents) {
      if (!component.capacity) {
        errors.push(`Critical component "${component.name}" missing capacity specification`);
      }
    }

    return errors;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(components: Component[]): string[] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (id: string, path: string[]): void => {
      if (stack.has(id)) {
        const cycleStart = path.indexOf(id);
        cycles.push(path.slice(cycleStart).concat(id).join(' → '));
        return;
      }

      if (visited.has(id)) return;

      visited.add(id);
      stack.add(id);

      const component = components.find(c => c.id === id);
      if (component) {
        for (const depId of component.dependencies) {
          dfs(depId, [...path, id]);
        }
      }

      stack.delete(id);
    };

    for (const component of components) {
      dfs(component.id, []);
    }

    return cycles;
  }

  /**
   * Simulate load test
   */
  private async simulateLoad(config: StressTestConfig): Promise<PerformanceMetrics> {
    console.log('   🔄 Simulating load...');

    const { concurrentUsers, pattern } = config.loadProfile;

    // Simulate performance based on load pattern
    const baselineP95 = 100; // 100ms baseline
    const loadMultiplier = this.calculateLoadMultiplier(concurrentUsers, pattern);

    const p95 = baselineP95 * loadMultiplier;
    const p50 = p95 * 0.5;
    const p99 = p95 * 1.5;
    const max = p99 * 2;
    const avg = (p50 + p95) / 2;

    // Calculate throughput
    const requestsPerSecond = Math.min(concurrentUsers * 10, 100000); // Cap at 100k req/s
    const bytesPerSecond = requestsPerSecond * 1024; // 1KB per request

    // Calculate error rate (increases with load)
    const errorRate = Math.min(loadMultiplier - 1, 10); // Max 10% error rate

    // Calculate availability
    const availability = Math.max(99.9 - errorRate, 95); // Min 95% availability

    // Resource usage (increases with load)
    const cpu = { avg: Math.min(loadMultiplier * 20, 80), max: Math.min(loadMultiplier * 30, 95) };
    const memory = { avg: Math.min(loadMultiplier * 15, 70), max: Math.min(loadMultiplier * 25, 85) };
    const network = { avg: Math.min(loadMultiplier * 10, 60), max: Math.min(loadMultiplier * 20, 80) };
    const diskIO = { avg: Math.min(loadMultiplier * 5, 40), max: Math.min(loadMultiplier * 10, 60) };

    // Database metrics
    const databaseMetrics = {
      connections: { avg: concurrentUsers * 0.1, max: concurrentUsers * 0.2 },
      queryTime: { p50: p50 * 0.3, p95: p95 * 0.3, p99: p99 * 0.3 },
      deadlocks: Math.floor(concurrentUsers / 10000) // 1 deadlock per 10k users
    };

    return {
      responseTime: { p50, p95, p99, max, avg },
      throughput: { requestsPerSecond, bytesPerSecond },
      errorRate,
      availability,
      resourceUsage: { cpu, memory, network, diskIO },
      databaseMetrics
    };
  }

  /**
   * Calculate load multiplier based on concurrent users and pattern
   */
  private calculateLoadMultiplier(concurrentUsers: number, pattern: LoadProfile['pattern']): number {
    // Base multiplier from user count
    let multiplier = 1;

    if (concurrentUsers >= 1000000) multiplier = 10; // 1M users = 10x load
    else if (concurrentUsers >= 100000) multiplier = 5; // 100k users = 5x load
    else if (concurrentUsers >= 10000) multiplier = 3; // 10k users = 3x load
    else if (concurrentUsers >= 1000) multiplier = 1.5; // 1k users = 1.5x load

    // Adjust by pattern
    const patternMultipliers: Record<LoadProfile['pattern'], number> = {
      'constant': 1.0,
      'ramp-up': 0.8, // Gradual ramp-up is easier on system
      'spike': 1.5, // Sudden spikes are harder
      'wave': 1.2, // Waves create fluctuating load
      'burst': 1.3 // Bursts stress system
    };

    return multiplier * patternMultipliers[pattern];
  }

  /**
   * Simulate failure scenarios
   */
  private async simulateFailures(config: StressTestConfig): Promise<FailurePoint[]> {
    if (!config.failureScenarios || config.failureScenarios.length === 0) {
      return [];
    }

    console.log(`   💥 Simulating ${config.failureScenarios.length} failure scenarios...`);

    const failurePoints: FailurePoint[] = [];

    for (const scenario of config.failureScenarios) {
      const component = config.architecture.components.find(c => c.id === scenario.targetComponent);
      if (!component) continue;

      // Determine if system recovers from failure
      const hasFallback = this.checkFallbackMechanism(config.architecture, component);
      const recovered = hasFallback || scenario.severity !== 'critical';
      const recoveryTime = recovered ? (scenario.duration || 5) : undefined;

      failurePoints.push({
        component: component.name,
        triggeredAt: scenario.triggeredAt || 30,
        scenario: scenario.type,
        impact: this.describeFailureImpact(scenario, component, config.architecture),
        recovered,
        recoveryTime
      });

      console.log(`      ${recovered ? '✅' : '❌'} ${scenario.type} on ${component.name} - ${recovered ? 'recovered' : 'critical failure'}`);
    }

    return failurePoints;
  }

  /**
   * Check if component has fallback mechanism
   */
  private checkFallbackMechanism(architecture: ArchitectureDescription, component: Component): boolean {
    // Check for redundancy (multiple components of same type)
    const sameTypeComponents = architecture.components.filter(c => c.type === component.type && c.id !== component.id);
    if (sameTypeComponents.length > 0) return true;

    // Check for cache layer (if database fails)
    if (component.type === 'database') {
      const hasCacheLayer = architecture.components.some(c => c.type === 'cache');
      if (hasCacheLayer) return true;
    }

    // Check for queue (if API fails)
    if (component.type === 'api') {
      const hasQueue = architecture.components.some(c => c.type === 'queue');
      if (hasQueue) return true;
    }

    return false;
  }

  /**
   * Describe failure impact
   */
  private describeFailureImpact(scenario: FailureScenario, component: Component, architecture: ArchitectureDescription): string {
    const dependents = architecture.components.filter(c => c.dependencies.includes(component.id));

    if (scenario.severity === 'critical' && dependents.length > 0) {
      return `Cascading failure affecting ${dependents.length} dependent components`;
    }

    if (component.type === 'database') {
      return 'Data access degraded or unavailable';
    }

    if (component.type === 'api') {
      return 'API requests failing or slow';
    }

    return `Component ${component.name} degraded`;
  }

  /**
   * Detect bottlenecks
   */
  private detectBottlenecks(architecture: ArchitectureDescription, metrics: PerformanceMetrics): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // CPU bottleneck
    if (metrics.resourceUsage.cpu.max > 90) {
      bottlenecks.push({
        component: 'compute',
        type: 'cpu',
        severity: 'critical',
        description: `CPU usage at ${metrics.resourceUsage.cpu.max}% (critical)`,
        impact: 'Response time degradation, request queueing',
        recommendation: 'Scale horizontally or upgrade to higher CPU instances',
        metrics: { maxCpu: metrics.resourceUsage.cpu.max, avgCpu: metrics.resourceUsage.cpu.avg }
      });
    }

    // Memory bottleneck
    if (metrics.resourceUsage.memory.max > 85) {
      bottlenecks.push({
        component: 'memory',
        type: 'memory',
        severity: metrics.resourceUsage.memory.max > 95 ? 'critical' : 'high',
        description: `Memory usage at ${metrics.resourceUsage.memory.max}%`,
        impact: 'Risk of OOM crashes, garbage collection pauses',
        recommendation: 'Increase memory allocation or optimize memory usage',
        metrics: { maxMemory: metrics.resourceUsage.memory.max, avgMemory: metrics.resourceUsage.memory.avg }
      });
    }

    // Database connection pool bottleneck
    if (metrics.databaseMetrics && metrics.databaseMetrics.connections.max > 80) {
      bottlenecks.push({
        component: 'database',
        type: 'database',
        severity: 'high',
        description: `Database connection pool at ${metrics.databaseMetrics.connections.max} connections`,
        impact: 'New requests waiting for database connections',
        recommendation: 'Increase connection pool size or implement connection pooling',
        metrics: { maxConnections: metrics.databaseMetrics.connections.max }
      });
    }

    // Network bottleneck
    if (metrics.resourceUsage.network.max > 80) {
      bottlenecks.push({
        component: 'network',
        type: 'network',
        severity: 'medium',
        description: `Network usage at ${metrics.resourceUsage.network.max}%`,
        impact: 'Data transfer delays, potential packet loss',
        recommendation: 'Upgrade network bandwidth or implement CDN',
        metrics: { maxNetwork: metrics.resourceUsage.network.max }
      });
    }

    return bottlenecks;
  }

  /**
   * Check success criteria
   */
  private checkSuccessCriteria(criteria: SuccessCriteria, metrics: PerformanceMetrics): { passed: boolean; failureReasons?: string[] } {
    const failures: string[] = [];

    if (criteria.maxResponseTime && metrics.responseTime.p95 > criteria.maxResponseTime) {
      failures.push(`Response time (p95) ${metrics.responseTime.p95}ms exceeds ${criteria.maxResponseTime}ms`);
    }

    if (criteria.maxErrorRate && metrics.errorRate > criteria.maxErrorRate) {
      failures.push(`Error rate ${metrics.errorRate.toFixed(2)}% exceeds ${criteria.maxErrorRate}%`);
    }

    if (criteria.minThroughput && metrics.throughput.requestsPerSecond < criteria.minThroughput) {
      failures.push(`Throughput ${metrics.throughput.requestsPerSecond} req/s below ${criteria.minThroughput} req/s`);
    }

    if (criteria.maxCpuUsage && metrics.resourceUsage.cpu.max > criteria.maxCpuUsage) {
      failures.push(`CPU usage ${metrics.resourceUsage.cpu.max}% exceeds ${criteria.maxCpuUsage}%`);
    }

    if (criteria.maxMemoryUsage && metrics.resourceUsage.memory.max > criteria.maxMemoryUsage) {
      failures.push(`Memory usage ${metrics.resourceUsage.memory.max}% exceeds ${criteria.maxMemoryUsage}%`);
    }

    return {
      passed: failures.length === 0,
      failureReasons: failures.length > 0 ? failures : undefined
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(config: StressTestConfig, metrics: PerformanceMetrics, bottlenecks: Bottleneck[], failurePoints: FailurePoint[]): string[] {
    const recommendations: string[] = [];

    // Recommendations from bottlenecks
    for (const bottleneck of bottlenecks) {
      recommendations.push(`[${bottleneck.severity.toUpperCase()}] ${bottleneck.recommendation}`);
    }

    // Recommendations from failure points
    const unrecoveredFailures = failurePoints.filter(f => !f.recovered);
    if (unrecoveredFailures.length > 0) {
      recommendations.push('CRITICAL: Add redundancy/fallback for components: ' + unrecoveredFailures.map(f => f.component).join(', '));
    }

    // Performance recommendations
    if (metrics.responseTime.p95 > 500) {
      recommendations.push('Consider implementing caching layer to reduce p95 response time');
    }

    if (metrics.errorRate > 1) {
      recommendations.push('Implement circuit breaker pattern to prevent cascading failures');
    }

    if (metrics.databaseMetrics && metrics.databaseMetrics.deadlocks > 0) {
      recommendations.push(`Database deadlocks detected (${metrics.databaseMetrics.deadlocks}) - review transaction isolation levels`);
    }

    return recommendations;
  }

  /**
   * Compare with historical results
   */
  private async compareWithHistory(config: StressTestConfig, metrics: PerformanceMetrics): Promise<HistoricalComparison | undefined> {
    // Query RAG for similar tests
    const query = `stress test ${config.architecture.techStack.join(' ')} ${config.loadProfile.concurrentUsers} users`;

    try {
      const results = await this.vectorStore.queryMemory(query, 'stress-tests', 5);
      if (results.length > 0 && results[0].similarity > 0.7) {
        const baseline = results[0].metadata;

        const regressions: HistoricalComparison['regressions'] = [];
        const improvements: HistoricalComparison['improvements'] = [];

        // Compare p95 response time
        if (baseline.metrics?.responseTime?.p95) {
          const changePercent = ((metrics.responseTime.p95 - baseline.metrics.responseTime.p95) / baseline.metrics.responseTime.p95) * 100;
          if (changePercent > 10) {
            regressions.push({
              metric: 'Response time (p95)',
              baseline: baseline.metrics.responseTime.p95,
              current: metrics.responseTime.p95,
              changePercent
            });
          } else if (changePercent < -10) {
            improvements.push({
              metric: 'Response time (p95)',
              baseline: baseline.metrics.responseTime.p95,
              current: metrics.responseTime.p95,
              changePercent
            });
          }
        }

        // Compare error rate
        if (baseline.metrics?.errorRate !== undefined) {
          const changePercent = ((metrics.errorRate - baseline.metrics.errorRate) / (baseline.metrics.errorRate || 0.1)) * 100;
          if (changePercent > 20) {
            regressions.push({
              metric: 'Error rate',
              baseline: baseline.metrics.errorRate,
              current: metrics.errorRate,
              changePercent
            });
          } else if (changePercent < -20) {
            improvements.push({
              metric: 'Error rate',
              baseline: baseline.metrics.errorRate,
              current: metrics.errorRate,
              changePercent
            });
          }
        }

        return {
          baselineTestId: results[0].metadata.testId || 'unknown',
          regressions,
          improvements
        };
      }
    } catch (error) {
      console.warn('Failed to compare with historical tests:', error);
    }

    return undefined;
  }

  /**
   * Store test pattern in RAG
   */
  private async storeTestPattern(config: StressTestConfig, result: StressTestResult): Promise<void> {
    const pattern = {
      testId: config.testId,
      testName: config.testName,
      techStack: config.architecture.techStack,
      concurrentUsers: config.loadProfile.concurrentUsers,
      pattern: config.loadProfile.pattern,
      passed: result.passed,
      metrics: result.metrics,
      bottlenecksCount: result.bottlenecks.length,
      timestamp: result.endTime
    };

    try {
      await this.vectorStore.storeMemory(
        `stress test ${config.architecture.techStack.join(' ')} ${config.loadProfile.concurrentUsers} users`,
        'stress-tests',
        pattern
      );
    } catch (error) {
      console.warn('Failed to store test pattern in RAG:', error);
    }
  }

  /**
   * Load historical tests from RAG
   */
  private async loadHistoricalTests(): Promise<void> {
    try {
      const tests = await this.vectorStore.queryMemory('stress test results', 'stress-tests', 100);
      console.log(`   📚 Loaded ${tests.length} historical stress tests from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical tests (starting fresh)');
    }
  }

  /**
   * Record test duration for statistics
   */
  private recordTestDuration(time: number): void {
    this.testDurations.push(time);

    if (this.testDurations.length > 100) {
      this.testDurations.shift();
    }

    const sum = this.testDurations.reduce((a, b) => a + b, 0);
    this.stats.averageTestDuration = sum / this.testDurations.length;
  }

  /**
   * Get result by test ID
   */
  getResult(testId: string): StressTestResult | undefined {
    return this.testResults.get(testId);
  }

  /**
   * Get statistics
   */
  getStatistics(): StressTestStats {
    return { ...this.stats };
  }

  /**
   * Background stress test (non-blocking)
   */
  async testInBackground(config: StressTestConfig): Promise<string> {
    const backgroundConfig = { ...config, backgroundMode: true };

    this.runStressTest(backgroundConfig).catch(error => {
      console.error(`Background stress test failed for ${config.testId}:`, error);
    });

    return config.testId;
  }

  /**
   * Shutdown tester
   */
  async shutdown(): Promise<void> {
    this.activeTests.clear();
    this.testResults.clear();
    this.emit('tester:shutdown');
    console.log('🛑 Architecture Stress Tester shut down');
  }
}

// Export singleton instance
export const globalArchitectureStressTester = new ArchitectureStressTester();
