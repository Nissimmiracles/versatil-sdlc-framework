import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { UserCoherenceMonitor } from './user-coherence-monitor.js';
const { check, apply } = vi.hoisted(() => ({ check: vi.fn(), apply: vi.fn() }));
vi.mock('../../coherence/user-coherence-check.js', () => ({ getUserCoherenceCheckService: () => ({ performCoherenceCheck: check, applyAutoFixes: apply }) }));
vi.mock('../../utils/logger.js', () => ({ VERSATILLogger: { getInstance: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }) } }));
const root = mkdtempSync(join(tmpdir(), 'guardian-coherence-'));
const state = join(root, '.versatil/state');
const monitor = UserCoherenceMonitor.getInstance(root);
const health = () => ({
  timestamp: new Date().toISOString(), overall_health: 95, status: 'healthy',
  checks: { version: { status: 'up_to_date', behind_by: { major: 0, minor: 0, patch: 0 } } },
  issues: [], auto_fixes_available: []
});

describe('UserCoherenceMonitor project health contract', () => {
  beforeEach(() => {
    rmSync(join(root, '.versatil'), { recursive: true, force: true });
    monitor.configure({ check_interval_hours: 24, notify_on_updates: true, notify_on_issues: true, enable_trend_analysis: true, auto_fix_threshold: 90 });
    check.mockReset().mockResolvedValue(health());
    apply.mockReset().mockResolvedValue({ results: ['✅ fixed'] });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  it('requires a check with missing or corrupt cache', async () => {
    expect(await monitor.isCheckDue()).toBe(true);
    mkdirSync(state, { recursive: true });
    writeFileSync(join(state, 'last-coherence-check.json'), '{broken');
    expect(await monitor.isCheckDue()).toBe(true);
  });
  it('persists a fresh health check and reuses it until due', async () => {
    const result = await monitor.performMonitoring();
    expect(check).toHaveBeenCalledWith(false);
    expect(result.current_health.overall_health).toBe(95);
    expect(result.trends).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(state, 'last-coherence-check.json'), 'utf8'))).toEqual(result.current_health);
    expect(await monitor.isCheckDue()).toBe(false);
    const cached = await monitor.performMonitoring();
    expect(check).toHaveBeenCalledTimes(1);
    expect(cached).toMatchObject({ current_health: result.current_health, notifications: [], auto_remediations_applied: 0 });
  });
  it('runs overdue checks and honors configured notification preferences', async () => {
    mkdirSync(state, { recursive: true });
    writeFileSync(join(state, 'last-coherence-check.json'), JSON.stringify({ ...health(), timestamp: new Date(Date.now() - 25 * 3600000).toISOString() }));
    check.mockResolvedValue({ ...health(), checks: { version: { status: 'patch_available', installed_version: '1.0.0', latest_version: '1.0.1', behind_by: { major: 0, minor: 0, patch: 1 } } } });
    expect(await monitor.isCheckDue()).toBe(true);
    const result = await monitor.performMonitoring();
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toContain('Patch update available');
    monitor.configure({ check_interval_hours: 0, notify_on_updates: false });
    expect((await monitor.performMonitoring()).notifications).toEqual([]);
  });
  it('only applies fixes at configured confidence and counts successful results', async () => {
    const fixes = [{ confidence: 89, description: 'low' }, { confidence: 95, description: 'high' }];
    check.mockResolvedValue({ ...health(), auto_fixes_available: fixes });
    const result = await monitor.performMonitoring();
    expect(apply).toHaveBeenCalledWith([fixes[1]]);
    expect(result.auto_remediations_applied).toBe(1);
  });
  it('propagates check failures and records no fabricated health result', async () => {
    check.mockRejectedValue(new Error('health service unavailable'));
    await expect(monitor.performMonitoring()).rejects.toThrow('health service unavailable');
    expect(await monitor.isCheckDue()).toBe(true);
    expect(apply).not.toHaveBeenCalled();
  });
  it('calculates trend direction and issue counts from stored observations', async () => {
    mkdirSync(state, { recursive: true });
    writeFileSync(join(state, 'coherence-trends.json'), JSON.stringify([60, 90].map((score, i) => ({
      timestamp: new Date(Date.now() - (2 - i) * 3600000).toISOString(), overall_health: score,
      issues_detected: 2, issues_fixed: 1, version_behind_by: 0
    }))));
    expect(await monitor.getHealthTrends()).toMatchObject({ current_health: 90, avg_health_7d: 75, trend: 'improving', issues_resolved_7d: 2, issues_detected_7d: 4 });
  });
});
