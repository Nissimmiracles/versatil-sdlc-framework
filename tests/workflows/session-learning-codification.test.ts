/**
 * Tests for Session Learning Codification Workflow
 *
 * Tests the complete workflow: Analyze → Extract → Codify → Report
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSessionAnalyzer } from '../../src/workflows/session-analyzer.js';
import { createLearningExtractor } from '../../src/workflows/learning-extractor.js';
import { createLearningCodifier } from '../../src/workflows/learning-codifier.js';
import { createSessionReportGenerator } from '../../src/workflows/session-report-generator.js';
import { StorageDestination } from '../../src/rag/sanitization-policy.js';
import type { SessionSummary } from '../../src/tracking/session-manager.js';

const fixture = vi.hoisted(() => ({
  home: `/tmp/versatil-session-${process.pid}-${Math.random().toString(36).slice(2)}`,
  store: vi.fn(), memory: vi.fn(), execute: vi.fn()
}));
vi.mock('os', async original => ({ ...await original<typeof import('os')>(), homedir: () => fixture.home }));
vi.mock('child_process', () => ({ exec: Object.assign(vi.fn(), { [Symbol.for('nodejs.util.promisify.custom')]: fixture.execute }) }));
vi.mock('../../src/config/supabase-config.js', () => ({ supabaseConfig: { getAgentConfig: () => ({}) } }));
vi.mock('../../src/lib/supabase-vector-store.js', () => ({ SupabaseVectorStore: class {} }));
vi.mock('../../src/rag/rag-router.js', () => ({ RAGRouter: { getInstance: () => ({ storePattern: fixture.store }) } }));
vi.mock('../../src/memory/memory-tool-handler.js', () => ({ memoryToolHandler: { execute: fixture.memory } }));
vi.mock('../../src/utils/logger.js', () => ({ VERSATILLogger: class { info() {} warn() {} error() {} debug() {} } }));
import { promises as fs } from 'fs';

describe('Session Learning Codification Workflow', () => {
  let mockSessionSummary: SessionSummary;

  beforeEach(() => {
    fixture.store.mockReset().mockResolvedValue('fixture-pattern-id');
    fixture.memory.mockReset().mockResolvedValue({ success: true });
    fixture.execute.mockReset().mockImplementation(async (command: string) => ({ stdout: command.includes('branch --show-current') ? 'fixture-branch' : '', stderr: '' }));
    mockSessionSummary = {
      sessionId: 'test-session-001',
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      duration: 3600000,
      agentActivations: 4,
      tasksCompleted: 4,
      tasksFailed: 0,
      totalTimeSaved: 104,
      averageQuality: 89.5,
      impactScore: 7.1,
      agentBreakdown: {
        'maria-qa': {
          activations: 2,
          successRate: 1,
          avgDuration: 240000,
          timeSaved: 58
        },
        'james-frontend': {
          activations: 1,
          successRate: 1,
          avgDuration: 150000,
          timeSaved: 17.5
        },
        'marcus-backend': {
          activations: 1,
          successRate: 1,
          avgDuration: 90000,
          timeSaved: 28.5
        }
      },
      date: '2025-10-19',
      productivity: {
        timeSaved: 104,
        productivityGain: 50,
        efficiency: 100
      },
      topPatterns: [
        'React Testing Library patterns',
        'API security best practices',
        'Component optimization techniques'
      ],
      recommendations: [
        'Excellent session! You\'re using VERSATIL effectively'
      ]
    };
  });

  afterEach(async () => {
    await fs.rm(fixture.home, { recursive: true, force: true });
  });

  describe('SessionAnalyzer', () => {
    it('should analyze session and extract code changes', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      expect(analysis).toBeDefined();
      expect(analysis.sessionId).toBe(mockSessionSummary.date);
      expect(analysis.productivity.timeSaved).toBe(104);
      expect(analysis.agentPerformance).toHaveLength(3);
    });

    it('should calculate agent performance correctly', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const mariaQA = analysis.agentPerformance.find(a => a.agentId === 'maria-qa');
      expect(mariaQA).toBeDefined();
      expect(mariaQA?.activations).toBe(2);
      expect(mariaQA?.timeSaved).toBe(58);
      expect(mariaQA?.effectiveness).toBe('medium'); // 58 / 2 = 29 minutes per activation
    });

    it('should identify patterns from successful work', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      expect(analysis.patterns.successful).toBeDefined();
      expect(analysis.patterns.successful.length).toBeGreaterThan(0);
    });

    it('should extract git metadata', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      expect(analysis.metadata).toBeDefined();
      expect(analysis.metadata.branch).toBe('fixture-branch');
    });
  });

  describe('LearningExtractor', () => {
    it('should extract learnings from analysis', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings).toBeDefined();
      expect(learnings.sessionId).toBe(mockSessionSummary.date);
      expect(learnings.overallEffectiveness).toBeGreaterThan(0);
      expect(learnings.compoundingScore).toBeGreaterThan(0);
    });

    it('should extract code patterns from changes', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings.codePatterns).toBeDefined();
      expect(Array.isArray(learnings.codePatterns)).toBe(true);
    });

    it('should generate warnings for issues', async () => {
      const lowQualitySession = {
        ...mockSessionSummary,
        averageQuality: 65 // Below 70% threshold
      };

      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(lowQualitySession);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings.warnings).toBeDefined();
      const qualityWarning = learnings.warnings.find(w => w.category === 'quality');
      expect(qualityWarning).toBeDefined();
    });

    it('should generate lessons learned', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings.lessons).toBeDefined();
      expect(learnings.lessons.length).toBeGreaterThan(0);
    });

    it('should calculate compounding score correctly', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings.compoundingScore).toBeGreaterThanOrEqual(0);
      expect(learnings.compoundingScore).toBeLessThanOrEqual(100);
    });

    it('should create agent insights', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      expect(learnings.agentInsights).toBeDefined();
      expect(learnings.agentInsights.length).toBe(3);

      const mariaInsight = learnings.agentInsights.find(i => i.agentId === 'maria-qa');
      expect(mariaInsight).toBeDefined();
      expect(mariaInsight?.effectiveness).toBe('medium');
    });
  });

  describe('LearningCodifier', () => {
    it('should codify learnings to RAG (mocked)', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      learnings.codePatterns.push({ category: 'test', language: 'typescript', pattern: 'Testing fixture', description: 'Unit testing assertions', codeSnippet: 'expect(value).toBe(true)', effectiveness: 90, tags: ['testing'], usageContext: 'fixture', recommendations: 'Test both outcomes' });

      const codifier = createLearningCodifier();
      const result = await codifier.codifyLearnings(learnings);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.patternsStored).toBe(1);
      expect(result.privatePatternsStored).toBe(1);
      expect(result.agentMemoriesUpdated).toBe(4);
      expect(fixture.memory).toHaveBeenCalledTimes(4);
      expect(result.ragEntriesCreated).toBe(result.patternsStored + result.lessonsStored);
    });

    it('reports zero successful writes when isolated backends reject them', async () => {
      fixture.store.mockRejectedValue(new Error('isolated backend unavailable'));
      fixture.memory.mockResolvedValue({ success: false });
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      learnings.codePatterns.push({ category: 'test', language: 'typescript', pattern: 'Testing fixture', description: 'Unit testing assertions', codeSnippet: 'expect(value).toBe(true)', effectiveness: 90, tags: ['testing'], usageContext: 'fixture', recommendations: 'Test both outcomes' });

      for (const destination of [StorageDestination.PRIVATE_ONLY, StorageDestination.BOTH, StorageDestination.PUBLIC_ONLY]) {
        const result = await createLearningCodifier().codifyLearnings(learnings, destination);
        expect(result).toMatchObject({ patternsStored: 0, lessonsStored: 0, agentMemoriesUpdated: 0, ragEntriesCreated: 0 });
      }
      expect(fixture.store).toHaveBeenCalled();
    });
  });

  describe('SessionReportGenerator', () => {
    it('should generate complete report', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      const codifier = createLearningCodifier();
      const codificationResult = await codifier.codifyLearnings(learnings);

      const reportGen = createSessionReportGenerator();
      const report = await reportGen.generateReport(analysis, learnings, codificationResult);

      expect(report).toBeDefined();
      expect(report.sessionId).toBe(mockSessionSummary.date);
      expect(report.markdown).toBeDefined();
      expect(report.brief).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should include all required sections in markdown report', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      const codifier = createLearningCodifier();
      const codificationResult = await codifier.codifyLearnings(learnings);

      const reportGen = createSessionReportGenerator();
      const report = await reportGen.generateReport(analysis, learnings, codificationResult);

      expect(report.markdown).toContain('# VERSATIL Session Report');
      expect(report.markdown).toContain('## Executive Summary');
      expect(report.markdown).toContain('## Performance Metrics');
      expect(report.markdown).toContain('## Lessons Learned');
      expect(report.markdown).toContain('## Recommendations');
    });

    it('should generate brief summary for terminal', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      const codifier = createLearningCodifier();
      const codificationResult = await codifier.codifyLearnings(learnings);

      const reportGen = createSessionReportGenerator();
      const report = await reportGen.generateReport(analysis, learnings, codificationResult);

      expect(report.brief).toContain('Session Summary');
      expect(report.brief).toContain('Time Saved: 104 minutes');
      expect(report.brief).toContain('Quality Score');
    });

    it('should create summary with top patterns and recommendations', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      const codifier = createLearningCodifier();
      const codificationResult = await codifier.codifyLearnings(learnings);

      const reportGen = createSessionReportGenerator();
      const report = await reportGen.generateReport(analysis, learnings, codificationResult);

      expect(report.summary).toBeDefined();
      expect(report.summary.timeSaved).toBe(104);
      expect(report.summary.qualityScore).toBe(89.5);
      expect(report.summary.topPatterns).toBeDefined();
      expect(report.summary.recommendations).toBeDefined();
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should execute complete workflow end-to-end', async () => {
      // Step 1: Analyze
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);
      expect(analysis).toBeDefined();

      // Step 2: Extract
      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);
      expect(learnings).toBeDefined();
      expect(learnings.compoundingScore).toBeGreaterThan(0);

      // Step 3: Codify
      const codifier = createLearningCodifier();
      const codificationResult = await codifier.codifyLearnings(learnings);
      expect(codificationResult).toBeDefined();

      // Step 4: Report
      const reportGen = createSessionReportGenerator();
      const report = await reportGen.generateReport(analysis, learnings, codificationResult);
      expect(report).toBeDefined();
      expect(report.markdown.length).toBeGreaterThan(0);
    });

    it('should demonstrate compounding effect', async () => {
      const analyzer = createSessionAnalyzer();
      const analysis = await analyzer.analyzeSession(mockSessionSummary);

      const extractor = createLearningExtractor();
      const learnings = await extractor.extractLearnings(analysis);

      // Verify compounding score translates to future speed increase
      const futureSpeedIncrease = learnings.compoundingScore * 0.4;
      expect(futureSpeedIncrease).toBeGreaterThan(0);
      expect(futureSpeedIncrease).toBeLessThanOrEqual(40); // Max 40% from single session
    });
  });
});

describe('CLI Tools', () => {
  describe('codify-session-learnings.cjs', () => {
    it('should be executable script', async () => {
      const { existsSync } = await import('fs');
      const scriptPath = './scripts/codify-session-learnings.cjs';
      expect(existsSync(scriptPath)).toBe(true);
    });
  });

  describe('view-session-learnings.cjs', () => {
    it('should be executable script', async () => {
      const { existsSync } = await import('fs');
      const scriptPath = './scripts/view-session-learnings.cjs';
      expect(existsSync(scriptPath)).toBe(true);
    });
  });
});
