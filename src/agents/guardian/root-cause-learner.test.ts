import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as os from 'os';
import { RootCauseLearner } from './root-cause-learner.js';
import type { HealthCheckResult } from './types.js';
vi.mock('os', async (original) => ({ ...await original<typeof import('os')>(), homedir: vi.fn() }));
vi.mock('./guardian-logger.js', () => ({ GuardianLogger: { getInstance: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) } }));
vi.mock('./guardian-learning-store.js', () => ({ searchGuardianLearnings: vi.fn().mockResolvedValue([]) }));

describe('RootCauseLearner history analysis', () => {
  let home: string;
  let learner: RootCauseLearner;
  const history = (count: number, hoursAgo = 0): HealthCheckResult[] => Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - hoursAgo * 3600000 - (count - i) * 1000).toISOString(),
    overall_health: 50, status: 'degraded', components: {},
    issues: [{ severity: 'high', component: 'build', description: 'Build failed' }]
  }));
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'guardian-learning-'));
    vi.mocked(os.homedir).mockReturnValue(home);
    learner = new RootCauseLearner({ min_occurrences: 3, timespan_hours: 24, enable_rag_lookup: false });
  });
  afterEach(() => rmSync(home, { recursive: true, force: true }));
  it('does not learn from empty, insufficient or expired observations', async () => {
    for (const observations of [[], history(2), history(3, 25)]) {
      expect(await learner.analyzeHealthCheckHistory(observations, '/user/project')).toMatchObject({
        patterns_detected: [], new_patterns: 0, confidence_avg: 0
      });
    }
    expect(learner.getPatterns()).toEqual([]);
    expect(learner.getPattern('missing')).toBeUndefined();
  });
  it('stores recurring evidence as a hypothesis without asserting remediation success', async () => {
    const result = await learner.analyzeHealthCheckHistory(history(3), '/user/project');
    expect(result.new_patterns).toBe(1);
    expect(result.total_occurrences_analyzed).toBe(3);
    const pattern = result.patterns_detected[0];
    expect(pattern.root_cause.primary).toBe('Missing TypeScript compiler or build configuration issue');
    expect(pattern.root_cause.confidence).toBeLessThan(100);
    expect(pattern.root_cause.evidence).toContain('3 occurrences in 24h');
    expect(pattern.remediation).toMatchObject({ success_rate: 0, avg_duration_ms: 0 });
    expect(learner.getPattern(pattern.issue_fingerprint)).toEqual(pattern);
    const stored = readFileSync(join(home, '.versatil/learning/root-causes/patterns.jsonl'), 'utf8');
    expect(JSON.parse(stored.trim())).toEqual(pattern);
  });
  it('reloads stored patterns and updates existing fingerprints', async () => {
    const first = await learner.analyzeHealthCheckHistory(history(3), '/user/project');
    const reloaded = new RootCauseLearner({ enable_rag_lookup: false });
    expect(reloaded.getPatterns()).toHaveLength(1);
    const updated = await reloaded.analyzeHealthCheckHistory(history(3), '/user/project');
    expect(updated).toMatchObject({ new_patterns: 0, updated_patterns: 1 });
    expect(updated.patterns_detected[0].id).toBe(first.patterns_detected[0].id);
  });
});
