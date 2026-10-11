/** Implemented learning records, false-positive patterns and preference adaptations.
 * Success grouping/suggestion analysis remain source stubs; no model/provider executes here.
 */
import { AdaptiveLearningEngine, UserInteraction } from '../../src/intelligence/adaptive-learning';
import * as fs from 'fs';

jest.mock('../../src/utils/logger', () => ({ VERSATILLogger: jest.fn(() => ({ info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() })) }));
jest.mock('fs', () => {
  const files = new Map<string, string>();
  return { existsSync: jest.fn((file: string) => files.has(file)), mkdirSync: jest.fn(),
    readFileSync: jest.fn((file: string) => files.get(file)),
    writeFileSync: jest.fn((file: string, content: string) => files.set(file, content)), resetFixture: () => files.clear() };
});

describe('AdaptiveLearningEngine current contract', () => {
  let engine: AdaptiveLearningEngine;
  const interaction = (id = 'sample', agentId = 'maria'): UserInteraction => ({ id, agentId,
    timestamp: Date.now(), actionType: 'activation', context: { fileType: 'ts', projectType: 'fixture' },
    outcome: { problemSolved: true, userSatisfaction: 5, agentAccuracy: 0.95 } });
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-02-01T00:00:00Z') });
    (fs as any).resetFixture();
    engine = new AdaptiveLearningEngine();
  });
  afterEach(() => { engine.stopLearning(); jest.clearAllTimers(); jest.useRealTimers(); });

  it('starts disabled and exposes empty implemented insights', () => {
    expect(engine.getLearningInsights()).toMatchObject({ totalInteractions: 0, patternsDiscovered: 0,
      adaptationsProposed: 0, adaptationsApplied: 0, recentLearnings: [] });
  });
  it('does not record or persist while learning is disabled', () => {
    const event = jest.fn(); engine.on('interaction', event);
    engine.recordInteraction(interaction());
    expect(engine.getLearningInsights().totalInteractions).toBe(0);
    expect(event).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
  it('records enabled interactions with exact payload and virtual persistence', () => {
    engine.startLearning(); const event = jest.fn(); engine.on('interaction', event);
    const input = interaction(); engine.recordInteraction(input);
    expect(event).toHaveBeenCalledWith(input);
    expect(engine.getLearningInsights().totalInteractions).toBe(1);
    expect(JSON.parse((fs.writeFileSync as jest.Mock).mock.calls.at(-1)![1]).maria).toEqual([input]);
  });
  it('isolates recorded interactions between agents', () => {
    engine.startLearning(); engine.recordInteraction(interaction('a')); engine.recordInteraction(interaction('b', 'james'));
    expect(engine['interactions'].get('maria')).toHaveLength(1);
    expect(engine['interactions'].get('james')).toHaveLength(1);
  });
  it('does not duplicate timers or handlers on repeated start', () => {
    engine.startLearning(); engine.startLearning();
    expect(jest.getTimerCount()).toBe(1);
    expect(engine.listenerCount('interaction')).toBe(1);
    expect(engine.listenerCount('pattern_discovered')).toBe(1);
  });
  it('clears the analysis timer and its own listeners when stopped', () => {
    const observer = jest.fn(); engine.on('interaction', observer);
    engine.startLearning(); engine.stopLearning();
    expect(jest.getTimerCount()).toBe(0);
    expect(engine.listeners('interaction')).toEqual([observer]);
    expect(engine.listenerCount('pattern_discovered')).toBe(0);
    engine.recordInteraction(interaction());
    expect(observer).not.toHaveBeenCalled();
  });
  it('restarts without accumulating analysis schedules or listeners', () => {
    engine.startLearning(); engine.stopLearning(); engine.startLearning();
    expect(jest.getTimerCount()).toBe(1);
    expect(engine.listenerCount('interaction')).toBe(1);
    expect(engine.listenerCount('pattern_discovered')).toBe(1);
  });
  it('does not analyze insufficient interactions into patterns', async () => {
    engine.startLearning(); engine.recordInteraction(interaction());
    await engine['analyzePatterns']();
    expect(engine.getLearningInsights().patternsDiscovered).toBe(0);
  });
  it('does not advertise success-pattern grouping while that source helper is unimplemented', async () => {
    engine.startLearning(); for (let i = 0; i < 12; i++) engine.recordInteraction(interaction(`s-${i}`));
    await engine['analyzePatterns']();
    expect(engine.getLearningInsights().patternsDiscovered).toBe(0);
  });
  it('discovers implemented false-positive patterns and emits their actual payload', async () => {
    engine.startLearning(); const event = jest.fn(); engine.on('pattern_discovered', event);
    for (let i = 0; i < 12; i++) engine.recordInteraction({ ...interaction(`f-${i}`),
      context: { fileType: 'ts', issue: { type: 'fixture', severity: 'low', wasAccurate: false, userVerified: true } },
      outcome: { problemSolved: false, userSatisfaction: 2 } });
    await engine['analyzePatterns']();
    expect(event).toHaveBeenCalledTimes(1);
    expect(event.mock.calls[0][0]).toMatchObject({ agentId: 'maria', pattern: 'False positive detection pattern', usageCount: 12, successRate: 0 });
    expect(engine.getLearningInsights().patternsDiscovered).toBe(1);
  });
  it('generates no adaptation without supported preference input', async () => {
    expect(await engine['generateAdaptations']('maria', [], {})).toEqual([]);
  });
  it('generates the implemented preference adaptation with exact agent and changes', async () => {
    expect(await engine['generateAdaptations']('maria', [], { preferredSeverityLevel: 'high', alertPreferences: ['security'] })).toEqual([
      expect.objectContaining({ agentId: 'maria', adaptationType: 'priority_weighting', changes: { adjustSeverityWeights: 'high', personalizeAlerts: ['security'] }, confidence: 0.9 })
    ]);
  });
  it('emits a proposed adaptation and bounds retained proposals per agent', () => {
    const event = jest.fn(); engine.on('adaptation_proposed', event);
    for (let i = 0; i < 6; i++) engine['proposeAdaptation']('maria', { agentId: 'maria', adaptationType: 'priority_weighting', changes: { fixture: i }, confidence: 0.5 + i / 10, expectedImprovement: 0.1 });
    expect(event).toHaveBeenCalledTimes(6);
    expect(engine.getLearningInsights().adaptationsProposed).toBe(5);
    expect(engine['adaptations'].get('maria')![0].changes.fixture).toBe(1);
  });
});
