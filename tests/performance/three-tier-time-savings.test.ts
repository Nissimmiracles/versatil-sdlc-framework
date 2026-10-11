/** Synthetic schedule model. These tests make no measured product time-saving claim. */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ThreeTierHandoffBuilder } from '../../src/agents/contracts/three-tier-handoff.js';

const delays = { dana: 45, marcus: 60, james: 50 };
const work = (duration: number) => new Promise<number>(resolve => setTimeout(() => resolve(duration), duration));
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('Synthetic three-tier scheduling model', () => {
  it.each(Object.entries(delays))('completes %s at its configured synthetic duration', async (_name, duration) => {
    let completed = false;
    const task = work(duration).then(result => { completed = true; return result; });
    await jest.advanceTimersByTimeAsync(duration - 1);
    expect(completed).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(await task).toBe(duration);
  });
  it('starts all tiers before any one finishes and completes at the longest delay', async () => {
    const start = Date.now();
    const completed: number[] = [];
    const tasks = Object.values(delays).map(duration => work(duration).then(result => { completed.push(result); return result; }));
    const workflow = Promise.all(tasks);
    expect(jest.getTimerCount()).toBe(3);
    await jest.advanceTimersByTimeAsync(45);
    expect(completed).toEqual([45]);
    await jest.advanceTimersByTimeAsync(5);
    expect(completed).toEqual([45, 50]);
    await jest.advanceTimersByTimeAsync(10);
    expect(await workflow).toEqual([45, 60, 50]);
    expect(Date.now() - start).toBe(60);
  });
  it('serial execution waits for each synthetic tier and totals all delays', async () => {
    const start = Date.now();
    const completed: number[] = [];
    const workflow = (async () => {
      for (const duration of Object.values(delays)) completed.push(await work(duration));
    })();
    await jest.advanceTimersByTimeAsync(45);
    expect(completed).toEqual([45]);
    await jest.advanceTimersByTimeAsync(60);
    expect(completed).toEqual([45, 60]);
    await jest.advanceTimersByTimeAsync(50);
    await workflow;
    expect(completed).toEqual([45, 60, 50]);
    expect(Date.now() - start).toBe(155);
  });
  it('includes sequential requirements, integration and quality phases in the model', async () => {
    const start = Date.now();
    const workflow = (async () => {
      await work(30);
      await Promise.all(Object.values(delays).map(work));
      await work(15);
      await work(20);
    })();
    await jest.advanceTimersByTimeAsync(125);
    await workflow;
    expect(Date.now() - start).toBe(125);
  });
  it('keeps contract effort estimates distinct from observed runtime', async () => {
    const contract = await new ThreeTierHandoffBuilder({ name: 'Fixture', description: 'Fixture',
      goals: [], constraints: [], userStories: [] })
      .addTable({ name: 'users', columns: [{ name: 'id', type: 'uuid', nullable: false }] })
      .addEndpoint({ method: 'GET', path: '/users', description: 'Users', authentication: true })
      .addComponent({ name: 'Users', type: 'component', description: 'Users' }).build();
    expect(contract.workItems.map(item => item.estimatedEffort)).toEqual([1.5, 2, 1.5]);
    expect(contract.integrationCheckpoints).toHaveLength(3);
  });
});
