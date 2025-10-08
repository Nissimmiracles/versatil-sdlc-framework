/**
 * VERSATIL Framework - PRD Feasibility Analyzer
 * Orchestrates all intelligence systems to validate PRD feasibility
 *
 * Features:
 * - Integrates mindset context, web research, and stress testing
 * - Validates PRD against project vision and constraints
 * - Checks architecture feasibility via web patterns
 * - Stress tests proposed architecture
 * - Provides go/no-go recommendation with confidence score
 * - Suggests alternatives for infeasible PRDs
 *
 * Addresses: User requirement #3 - "execute the prd in the best way and stay
 * in the mindset context of all the project"
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { MindsetContextEngine } from './mindset-context-engine.js';
import { WebPatternResearcher } from './web-pattern-researcher.js';
import { ArchitectureStressTester } from '../testing/architecture-stress-tester.js';
import type { AlignmentCheck } from './mindset-context-engine.js';
import type { ResearchResult } from './web-pattern-researcher.js';
import type { StressTestResult, ArchitectureDescription } from '../testing/architecture-stress-tester.js';

export interface PRDDocument {
  prdId: string;
  title: string;
  description: string;
  objectives: string[];
  requirements: Requirement[];
  proposedArchitecture?: ArchitectureDescription;
  constraints: string[];
  successCriteria: string[];
  estimatedEffort?: {
    development: number; // Person-days
    testing: number;
    deployment: number;
  };
  techStack?: string[];
}

export interface Requirement {
  id: string;
  type: 'functional' | 'non-functional' | 'security' | 'performance' | 'ux';
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  acceptanceCriteria: string[];
}

export interface FeasibilityAnalysis {
  prdId: string;
  decision: 'go' | 'no-go' | 'conditional';
  confidence: number; // 0-1
  timestamp: number;

  // Analysis components
  mindsetAlignment: AlignmentCheck;
  webResearch: ResearchResult;
  stressTestResult?: StressTestResult;

  // Risk assessment
  risks: Risk[];
  riskScore: number; // 0-10 (0 = low risk, 10 = critical risk)

  // Recommendations
  recommendations: Recommendation[];
  alternatives?: Alternative[];

  // Effort estimates
  estimatedTimeline?: Timeline;
  resourceRequirements?: ResourceRequirements;

  // Summary
  summary: string;
  reasoning: string[];
}

export interface Risk {
  type: 'technical' | 'business' | 'security' | 'performance' | 'operational';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  likelihood: 'very-likely' | 'likely' | 'possible' | 'unlikely';
  impact: string;
  mitigation?: string;
  source: 'mindset' | 'web-research' | 'stress-test' | 'manual';
}

export interface Recommendation {
  type: 'architecture' | 'technology' | 'process' | 'requirement';
  description: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface Alternative {
  description: string;
  advantages: string[];
  disadvantages: string[];
  feasibility: 'high' | 'medium' | 'low';
  estimatedEffort: {
    development: number;
    testing: number;
    deployment: number;
  };
}

export interface Timeline {
  estimatedDuration: number; // Days
  phases: Array<{
    name: string;
    duration: number; // Days
    dependencies?: string[];
  }>;
}

export interface ResourceRequirements {
  developers: number;
  qa: number;
  devops: number;
  infrastructure: string[]; // e.g., ['AWS EC2 instances', 'RDS PostgreSQL']
  estimatedCost?: number; // USD per month
}

export class PRDFeasibilityAnalyzer extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private mindsetEngine: MindsetContextEngine;
  private webResearcher: WebPatternResearcher;
  private stressTester: ArchitectureStressTester;

  private analysisHistory: Map<string, FeasibilityAnalysis> = new Map();

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
    this.mindsetEngine = new MindsetContextEngine(this.vectorStore);
    this.webResearcher = new WebPatternResearcher(this.vectorStore);
    this.stressTester = new ArchitectureStressTester(this.vectorStore);
  }

  async initialize(): Promise<void> {
    console.log('🎯 PRD Feasibility Analyzer initializing...');

    // Initialize all sub-systems
    await Promise.all([
      this.mindsetEngine.initialize(),
      this.webResearcher.initialize(),
      this.stressTester.initialize()
    ]);

    this.emit('analyzer:initialized');
    console.log('✅ PRD Feasibility Analyzer ready');
  }

  /**
   * Analyze PRD feasibility (main method)
   */
  async analyzeFeasibility(prd: PRDDocument): Promise<FeasibilityAnalysis> {
    console.log(`🎯 Analyzing feasibility for PRD: ${prd.title}`);
    console.log(`   Requirements: ${prd.requirements.length}`);
    console.log(`   Objectives: ${prd.objectives.length}`);

    const startTime = Date.now();

    try {
      // STEP 1: Check mindset alignment
      console.log('   🔄 Step 1/3: Checking mindset alignment...');
      const mindsetAlignment = await this.mindsetEngine.checkAlignment(
        `${prd.title}: ${prd.description}`,
        'epic',
        {
          objectives: prd.objectives,
          constraints: prd.constraints,
          techStack: prd.techStack
        }
      );

      console.log(`      ${mindsetAlignment.aligned ? '✅' : '⚠️ '} Mindset alignment: ${mindsetAlignment.aligned ? 'ALIGNED' : 'CONFLICTS DETECTED'} (${(mindsetAlignment.confidence * 100).toFixed(1)}% confidence)`);

      if (mindsetAlignment.autoReject) {
        console.log('      ❌ Auto-rejected due to critical mindset violations');
        return this.createNoGoAnalysis(prd, mindsetAlignment, 'Critical mindset violations');
      }

      // STEP 2: Web research validation
      console.log('   🔄 Step 2/3: Researching architecture patterns...');
      const webResearch = await this.webResearcher.research({
        queryId: `${prd.prdId}-research`,
        type: 'architecture',
        description: prd.description,
        context: {
          techStack: prd.techStack,
          constraints: prd.constraints,
          mindsetAlignment: mindsetAlignment.suggestions.join('; ')
        },
        priority: 'high',
        maxResults: 10,
        backgroundMode: false
      });

      console.log(`      ✅ Found ${webResearch.sources.length} sources, ${webResearch.findings.length} findings`);

      // Check for critical security issues from web research
      const criticalSecurityIssues = webResearch.findings.filter(f =>
        f.type === 'security-issue' && f.severity === 'critical'
      );

      if (criticalSecurityIssues.length > 0) {
        console.log(`      ⚠️  ${criticalSecurityIssues.length} critical security issues found`);
      }

      // STEP 3: Stress test architecture (if provided)
      let stressTestResult: StressTestResult | undefined;

      if (prd.proposedArchitecture) {
        console.log('   🔄 Step 3/3: Stress testing architecture...');
        stressTestResult = await this.stressTester.runStressTest({
          testId: `${prd.prdId}-stress-test`,
          testName: `Stress test for ${prd.title}`,
          architecture: prd.proposedArchitecture,
          loadProfile: {
            pattern: 'ramp-up',
            concurrentUsers: this.estimateConcurrentUsers(prd),
            rampUpTime: 300 // 5 minutes
          },
          successCriteria: this.extractSuccessCriteria(prd),
          duration: 60 // 1 minute test
        });

        console.log(`      ${stressTestResult.passed ? '✅' : '❌'} Stress test: ${stressTestResult.passed ? 'PASSED' : 'FAILED'}`);
        console.log(`      Bottlenecks: ${stressTestResult.bottlenecks.length}`);
      } else {
        console.log('   ⏭️  Step 3/3: No architecture provided - skipping stress test');
      }

      // STEP 4: Risk assessment
      const risks = this.assessRisks(prd, mindsetAlignment, webResearch, stressTestResult);
      const riskScore = this.calculateRiskScore(risks);

      console.log(`   📊 Risk score: ${riskScore.toFixed(1)}/10`);

      // STEP 5: Generate recommendations
      const recommendations = this.generateRecommendations(prd, mindsetAlignment, webResearch, stressTestResult);

      console.log(`   💡 Generated ${recommendations.length} recommendations`);

      // STEP 6: Make decision
      const decision = this.makeDecision(mindsetAlignment, webResearch, stressTestResult, riskScore);
      const confidence = this.calculateConfidence(mindsetAlignment, webResearch, stressTestResult);

      console.log(`   🎯 Decision: ${decision.toUpperCase()} (${(confidence * 100).toFixed(1)}% confidence)`);

      // STEP 7: Generate alternatives (if conditional/no-go)
      const alternatives = (decision !== 'go') ? this.generateAlternatives(prd, mindsetAlignment, webResearch) : undefined;

      // STEP 8: Estimate timeline and resources
      const estimatedTimeline = this.estimateTimeline(prd, risks);
      const resourceRequirements = this.estimateResources(prd);

      // STEP 9: Create analysis result
      const analysis: FeasibilityAnalysis = {
        prdId: prd.prdId,
        decision,
        confidence,
        timestamp: Date.now(),
        mindsetAlignment,
        webResearch,
        stressTestResult,
        risks,
        riskScore,
        recommendations,
        alternatives,
        estimatedTimeline,
        resourceRequirements,
        summary: this.generateSummary(decision, confidence, risks, recommendations),
        reasoning: this.generateReasoning(mindsetAlignment, webResearch, stressTestResult, risks)
      };

      // Store in history and RAG
      this.analysisHistory.set(prd.prdId, analysis);
      await this.storeAnalysisPattern(prd, analysis);

      this.emit('analysis:completed', {
        prdId: prd.prdId,
        decision,
        confidence,
        processingTime: Date.now() - startTime
      });

      console.log(`✅ Feasibility analysis complete (${Date.now() - startTime}ms)`);

      return analysis;
    } catch (error: any) {
      console.error(`❌ Feasibility analysis failed:`, error.message);

      this.emit('analysis:failed', {
        prdId: prd.prdId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Create no-go analysis for auto-rejected PRDs
   */
  private createNoGoAnalysis(prd: PRDDocument, mindsetAlignment: AlignmentCheck, reason: string): FeasibilityAnalysis {
    return {
      prdId: prd.prdId,
      decision: 'no-go',
      confidence: 0.95,
      timestamp: Date.now(),
      mindsetAlignment,
      webResearch: {
        queryId: '',
        sources: [],
        findings: [],
        recommendations: [],
        antiPatterns: [],
        benchmarks: [],
        confidence: 0,
        timestamp: Date.now(),
        processingTime: 0
      },
      risks: mindsetAlignment.conflicts.map(c => ({
        type: 'business',
        severity: c.severity,
        description: c.description,
        likelihood: 'very-likely',
        impact: 'Violates project strategy/vision',
        mitigation: c.suggestedAlternative,
        source: 'mindset'
      })),
      riskScore: 9.5,
      recommendations: mindsetAlignment.suggestions.map(s => ({
        type: 'requirement',
        description: s,
        rationale: 'Aligns with project mindset',
        priority: 'critical'
      })),
      alternatives: this.generateAlternatives(prd, mindsetAlignment, {
        queryId: '',
        sources: [],
        findings: [],
        recommendations: [],
        antiPatterns: [],
        benchmarks: [],
        confidence: 0,
        timestamp: Date.now(),
        processingTime: 0
      }),
      summary: `NO-GO: ${reason}`,
      reasoning: [`Auto-rejected: ${reason}`, ...mindsetAlignment.conflicts.map(c => c.description)]
    };
  }

  /**
   * Estimate concurrent users from PRD
   */
  private estimateConcurrentUsers(prd: PRDDocument): number {
    // Look for scale requirements in non-functional requirements
    const scaleReqs = prd.requirements.filter(r =>
      r.type === 'non-functional' &&
      (r.description.toLowerCase().includes('users') || r.description.toLowerCase().includes('scale'))
    );

    if (scaleReqs.length > 0) {
      const desc = scaleReqs[0].description.toLowerCase();
      if (desc.includes('million') || desc.includes('1m')) return 1000000;
      if (desc.includes('100k')) return 100000;
      if (desc.includes('10k')) return 10000;
    }

    // Default: 10k users
    return 10000;
  }

  /**
   * Extract success criteria for stress test
   */
  private extractSuccessCriteria(prd: PRDDocument): any {
    const perfReqs = prd.requirements.filter(r => r.type === 'performance');

    const criteria: any = {
      maxResponseTime: 200, // Default: 200ms p95
      maxErrorRate: 1, // Default: 1% error rate
      maxCpuUsage: 80, // Default: 80% CPU
      maxMemoryUsage: 80 // Default: 80% memory
    };

    // Parse performance requirements
    for (const req of perfReqs) {
      const desc = req.description.toLowerCase();

      if (desc.includes('latency') || desc.includes('response time')) {
        const match = desc.match(/(\d+)\s*ms/);
        if (match) criteria.maxResponseTime = parseInt(match[1]);
      }

      if (desc.includes('throughput') || desc.includes('req/s')) {
        const match = desc.match(/(\d+)k?\s*req/);
        if (match) criteria.minThroughput = parseInt(match[1]) * (match[0].includes('k') ? 1000 : 1);
      }
    }

    return criteria;
  }

  /**
   * Assess risks from all sources
   */
  private assessRisks(
    prd: PRDDocument,
    mindsetAlignment: AlignmentCheck,
    webResearch: ResearchResult,
    stressTestResult?: StressTestResult
  ): Risk[] {
    const risks: Risk[] = [];

    // Risks from mindset conflicts
    for (const conflict of mindsetAlignment.conflicts) {
      risks.push({
        type: conflict.type === 'strategic' ? 'business' : 'technical',
        severity: conflict.severity,
        description: conflict.description,
        likelihood: 'very-likely',
        impact: 'Violates project constraints or vision',
        mitigation: conflict.suggestedAlternative,
        source: 'mindset'
      });
    }

    // Risks from web research findings
    for (const finding of webResearch.findings) {
      if (finding.type === 'security-issue' || finding.type === 'anti-pattern') {
        risks.push({
          type: finding.type === 'security-issue' ? 'security' : 'technical',
          severity: finding.severity,
          description: finding.description,
          likelihood: 'likely',
          impact: 'Potential production issues',
          mitigation: finding.recommendation,
          source: 'web-research'
        });
      }
    }

    // Risks from stress test
    if (stressTestResult) {
      for (const bottleneck of stressTestResult.bottlenecks) {
        risks.push({
          type: 'performance',
          severity: bottleneck.severity,
          description: bottleneck.description,
          likelihood: 'likely',
          impact: bottleneck.impact,
          mitigation: bottleneck.recommendation,
          source: 'stress-test'
        });
      }

      const unrecoveredFailures = stressTestResult.failurePoints.filter(f => !f.recovered);
      for (const failure of unrecoveredFailures) {
        risks.push({
          type: 'operational',
          severity: 'critical',
          description: `${failure.component} failure is not recoverable`,
          likelihood: 'possible',
          impact: failure.impact,
          mitigation: 'Add redundancy/fallback mechanism',
          source: 'stress-test'
        });
      }
    }

    return risks;
  }

  /**
   * Calculate risk score (0-10)
   */
  private calculateRiskScore(risks: Risk[]): number {
    const weights = {
      critical: 4,
      high: 2,
      medium: 1,
      low: 0.5
    };

    const score = risks.reduce((sum, risk) => sum + weights[risk.severity], 0);

    return Math.min(10, score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    prd: PRDDocument,
    mindsetAlignment: AlignmentCheck,
    webResearch: ResearchResult,
    stressTestResult?: StressTestResult
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommendations from mindset
    for (const suggestion of mindsetAlignment.suggestions) {
      recommendations.push({
        type: 'requirement',
        description: suggestion,
        rationale: 'Aligns with project mindset and constraints',
        priority: 'high'
      });
    }

    // Recommendations from web research
    for (const webRec of webResearch.recommendations) {
      recommendations.push({
        type: webRec.type as any,
        description: webRec.description,
        rationale: webRec.rationale,
        priority: webRec.adoptionDifficulty === 'easy' ? 'high' : 'medium'
      });
    }

    // Recommendations from stress test
    if (stressTestResult) {
      for (const stressRec of stressTestResult.recommendations) {
        const priority = stressRec.includes('CRITICAL') ? 'critical' : 'high';
        recommendations.push({
          type: 'architecture',
          description: stressRec,
          rationale: 'Improves system resilience and performance',
          priority
        });
      }
    }

    return recommendations;
  }

  /**
   * Make go/no-go decision
   */
  private makeDecision(
    mindsetAlignment: AlignmentCheck,
    webResearch: ResearchResult,
    stressTestResult: StressTestResult | undefined,
    riskScore: number
  ): FeasibilityAnalysis['decision'] {
    // Auto no-go if mindset conflicts are critical
    if (!mindsetAlignment.aligned && mindsetAlignment.autoReject) {
      return 'no-go';
    }

    // Auto no-go if critical security issues from web research
    const criticalSecurityIssues = webResearch.findings.filter(f =>
      f.type === 'security-issue' && f.severity === 'critical'
    );
    if (criticalSecurityIssues.length > 0) {
      return 'conditional'; // Can proceed if security issues are mitigated
    }

    // Auto no-go if stress test failed critically
    if (stressTestResult && !stressTestResult.passed && stressTestResult.status === 'failed') {
      return 'conditional'; // Can proceed with architecture changes
    }

    // Decision based on risk score
    if (riskScore >= 8) return 'conditional'; // High risk - needs mitigation
    if (riskScore >= 5) return 'conditional'; // Medium risk - proceed with caution
    return 'go'; // Low risk - good to go
  }

  /**
   * Calculate confidence in decision
   */
  private calculateConfidence(
    mindsetAlignment: AlignmentCheck,
    webResearch: ResearchResult,
    stressTestResult: StressTestResult | undefined
  ): number {
    let confidence = 0.5; // Base

    // Factor in mindset alignment confidence
    confidence += mindsetAlignment.confidence * 0.3;

    // Factor in web research confidence
    confidence += webResearch.confidence * 0.2;

    // Factor in stress test results (if available)
    if (stressTestResult) {
      confidence += 0.2; // Having stress test results increases confidence
    }

    return Math.min(1, confidence);
  }

  /**
   * Generate alternatives for conditional/no-go PRDs
   */
  private generateAlternatives(prd: PRDDocument, mindsetAlignment: AlignmentCheck, webResearch: ResearchResult): Alternative[] {
    const alternatives: Alternative[] = [];

    // Alternative from mindset conflicts
    for (const conflict of mindsetAlignment.conflicts) {
      if (conflict.suggestedAlternative) {
        alternatives.push({
          description: conflict.suggestedAlternative,
          advantages: ['Aligns with project mindset', 'Lower risk'],
          disadvantages: ['May require requirements change'],
          feasibility: 'high',
          estimatedEffort: prd.estimatedEffort || { development: 0, testing: 0, deployment: 0 }
        });
      }
    }

    // Alternatives from web research
    for (const webRec of webResearch.recommendations) {
      if (webRec.type === 'alternative-approach' || webRec.type === 'technology') {
        alternatives.push({
          description: webRec.description,
          advantages: [webRec.rationale],
          disadvantages: webRec.tradeoffs,
          feasibility: webRec.adoptionDifficulty === 'easy' ? 'high' : (webRec.adoptionDifficulty === 'medium' ? 'medium' : 'low'),
          estimatedEffort: prd.estimatedEffort || { development: 0, testing: 0, deployment: 0 }
        });
      }
    }

    return alternatives.slice(0, 3); // Top 3 alternatives
  }

  /**
   * Estimate timeline
   */
  private estimateTimeline(prd: PRDDocument, risks: Risk[]): Timeline {
    const baseEffort = prd.estimatedEffort || { development: 30, testing: 10, deployment: 5 };

    // Add buffer for risks
    const riskBuffer = risks.filter(r => r.severity === 'critical' || r.severity === 'high').length * 5; // 5 days per high/critical risk

    return {
      estimatedDuration: baseEffort.development + baseEffort.testing + baseEffort.deployment + riskBuffer,
      phases: [
        { name: 'Requirements & Design', duration: 5 },
        { name: 'Development', duration: baseEffort.development, dependencies: ['Requirements & Design'] },
        { name: 'Testing', duration: baseEffort.testing, dependencies: ['Development'] },
        { name: 'Deployment', duration: baseEffort.deployment, dependencies: ['Testing'] },
        { name: 'Risk Mitigation', duration: riskBuffer, dependencies: ['Development'] }
      ]
    };
  }

  /**
   * Estimate resources
   */
  private estimateResources(prd: PRDDocument): ResourceRequirements {
    const requirementCount = prd.requirements.length;
    const mustHaveCount = prd.requirements.filter(r => r.priority === 'must-have').length;

    return {
      developers: Math.ceil(mustHaveCount / 5), // 1 dev per 5 must-have requirements
      qa: Math.ceil(requirementCount / 10), // 1 QA per 10 requirements
      devops: 1,
      infrastructure: prd.techStack || ['AWS EC2', 'PostgreSQL', 'Redis'],
      estimatedCost: mustHaveCount * 100 // $100 per must-have requirement per month
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(decision: string, confidence: number, risks: Risk[], recommendations: Recommendation[]): string {
    const decisionText = decision.toUpperCase();
    const confidencePercent = (confidence * 100).toFixed(0);
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const topRecommendations = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length;

    return `${decisionText} (${confidencePercent}% confidence) - ${criticalRisks} critical risks, ${topRecommendations} high-priority recommendations`;
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(
    mindsetAlignment: AlignmentCheck,
    webResearch: ResearchResult,
    stressTestResult: StressTestResult | undefined,
    risks: Risk[]
  ): string[] {
    const reasoning: string[] = [];

    // Mindset reasoning
    if (mindsetAlignment.aligned) {
      reasoning.push('✅ Aligned with project mindset and constraints');
    } else {
      reasoning.push(`⚠️  ${mindsetAlignment.conflicts.length} mindset conflicts detected`);
    }

    // Web research reasoning
    reasoning.push(`🔍 Found ${webResearch.sources.length} relevant sources with ${webResearch.findings.length} findings`);

    if (webResearch.findings.some(f => f.type === 'security-issue' && f.severity === 'critical')) {
      reasoning.push('⚠️  Critical security issues identified in research');
    }

    // Stress test reasoning
    if (stressTestResult) {
      if (stressTestResult.passed) {
        reasoning.push('✅ Architecture passed stress test');
      } else {
        reasoning.push(`❌ Architecture stress test failed: ${stressTestResult.failureReasons?.join(', ')}`);
      }
    }

    // Risk reasoning
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;

    if (criticalRisks > 0) {
      reasoning.push(`⚠️  ${criticalRisks} critical risks require mitigation`);
    }
    if (highRisks > 0) {
      reasoning.push(`⚠️  ${highRisks} high-severity risks identified`);
    }

    return reasoning;
  }

  /**
   * Store analysis pattern in RAG
   */
  private async storeAnalysisPattern(prd: PRDDocument, analysis: FeasibilityAnalysis): Promise<void> {
    const pattern = {
      prdId: prd.prdId,
      title: prd.title,
      decision: analysis.decision,
      confidence: analysis.confidence,
      riskScore: analysis.riskScore,
      techStack: prd.techStack,
      requirementsCount: prd.requirements.length,
      timestamp: analysis.timestamp
    };

    try {
      await this.vectorStore.storeMemory(
        `PRD feasibility: ${prd.title} - ${prd.description}`,
        'prd-feasibility',
        pattern
      );
    } catch (error) {
      console.warn('Failed to store PRD analysis pattern in RAG:', error);
    }
  }

  /**
   * Get analysis by PRD ID
   */
  getAnalysis(prdId: string): FeasibilityAnalysis | undefined {
    return this.analysisHistory.get(prdId);
  }

  /**
   * Shutdown analyzer
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.mindsetEngine.shutdown(),
      this.webResearcher.shutdown(),
      this.stressTester.shutdown()
    ]);

    this.analysisHistory.clear();
    this.emit('analyzer:shutdown');
    console.log('🛑 PRD Feasibility Analyzer shut down');
  }
}

// Export singleton instance
export const globalPRDFeasibilityAnalyzer = new PRDFeasibilityAnalyzer();
