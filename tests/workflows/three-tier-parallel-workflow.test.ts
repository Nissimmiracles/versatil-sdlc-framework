/** Contract and local database validation. SDK output is a fixture, not provider execution. */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { DanaSDKAgent } from '../../src/agents/opera/dana-database/dana-sdk-agent.js';
import { ThreeTierHandoffBuilder } from '../../src/agents/contracts/three-tier-handoff.js';

jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(), tool: jest.fn(), createSdkMcpServer: jest.fn(),
}));
const requirements = { name: 'Authentication', description: 'User login',
  userStories: ['As a user, I want to login'], goals: ['Protect user data'], constraints: ['RLS'] };
function builder() {
  return new ThreeTierHandoffBuilder(requirements)
    .addTable({ name: 'users', columns: [{ name: 'id', type: 'uuid', nullable: false }] })
    .addEndpoint({ method: 'POST', path: '/api/auth/login', description: 'Login', authentication: false })
    .addComponent({ name: 'LoginForm', type: 'component', description: 'Login form' });
}
beforeEach(() => (query as jest.Mock).mockResolvedValue('Score: 95\nDatabase analysis fixture'));

describe('Three-tier handoff contract', () => {
  it('routes the three named tiers as parallel receivers', async () => {
    const contract = await builder().build();
    expect(contract.type).toBe('parallel');
    expect(contract.receivers).toHaveLength(3);
    expect(JSON.stringify(contract.receivers)).toContain('dana-database');
    expect(JSON.stringify(contract.receivers)).toContain('marcus-backend');
    expect(JSON.stringify(contract.receivers)).toContain('james-frontend');
  });
  it('preserves database, endpoint and component specifications', async () => {
    const contract = await builder().build();
    expect(contract.databaseSchema.tables[0].name).toBe('users');
    expect(contract.apiContract.endpoints[0]).toMatchObject({ method: 'POST', path: '/api/auth/login' });
    expect(contract.uiRequirements.components[0].name).toBe('LoginForm');
  });
  it('generates RLS requirements and accessibility acceptance gates', async () => {
    const contract = await builder().build();
    expect(contract.databaseSchema.rlsPolicies!.length).toBeGreaterThan(0);
    expect(contract.uiRequirements.accessibility).toBe('AA');
    expect(contract.uiRequirements.responsive).toEqual(['mobile', 'tablet', 'desktop']);
  });
  it('generates work items with explicit effort and acceptance criteria', async () => {
    const contract = await builder().build();
    expect(contract.workItems).toHaveLength(3);
    expect(contract.workItems.map(work => work.estimatedEffort)).toEqual([1.5, 2, 1.5]);
    contract.workItems.forEach(work => expect(work.acceptanceCriteria.length).toBeGreaterThan(0));
  });
  it('defines both integration boundaries and final quality validation', async () => {
    const contract = await builder().build();
    expect(contract.integrationCheckpoints.map(checkpoint => checkpoint.participants)).toEqual([
      ['dana-database', 'marcus-backend'], ['marcus-backend', 'james-frontend'],
      ['dana-database', 'marcus-backend', 'james-frontend'],
    ]);
  });
  it('creates a planning work item when no implementation tiers are supplied', async () => {
    const contract = await new ThreeTierHandoffBuilder(requirements).build();
    expect(contract.workItems).toHaveLength(1);
    expect(contract.workItems[0].type).toBe('analysis');
  });
});

describe('Dana with an inert SDK provider', () => {
  it('passes schema context to the SDK boundary and returns local analysis', async () => {
    const agent = new DanaSDKAgent();
    const result = await agent.activate({ filePath: 'migrations/users.sql',
      content: 'CREATE TABLE users (id UUID PRIMARY KEY, email TEXT NOT NULL);' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('CREATE TABLE users'),
      options: expect.objectContaining({ model: 'sonnet' }),
    }));
    expect(result.agentId).toBe('dana-database');
    expect(result.message).toContain('Database analysis fixture');
    expect(result.context.schemaType).toBe('postgresql');
    expect(typeof result.context.databaseHealth).toBe('number');
    expect(result.context.tableCount).toBe(1);
  });
  it('reports missing RLS in a Supabase schema using the real local validator', async () => {
    const agent = new DanaSDKAgent();
    const result = await agent.activate({ filePath: 'supabase/migrations/users.sql',
      content: 'CREATE TABLE users (id UUID PRIMARY KEY);' });
    expect(result.context.requiresRLS).toBe(true);
    expect(result.context.rlsCompliance).toBe(0);
    expect(result.suggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'security', priority: 'critical', message: expect.stringContaining('no RLS policies') }),
    ]));
  });
  it('reports a provider failure without claiming SDK success', async () => {
    (query as jest.Mock).mockRejectedValueOnce(new Error('fixture provider unavailable'));
    const result = await new DanaSDKAgent().activate({ filePath: 'schema.sql', content: '' });
    expect(result.message).toContain('fixture provider unavailable');
    expect(result.context.error).toBe('fixture provider unavailable');
    expect(result.context.executionMethod).toBeUndefined();
  });
});
