import test from 'node:test';
import assert from 'node:assert/strict';
import { allRequestedHealthy, checkChrome, checkGitHub, runHealth } from './mcp-health-check.mjs';

const ok = data => ({ success: true, executionTime: 1, data });
const nav = () => ok({ status: 'navigation_complete' });
const snap = () => ok({ action: 'snapshot_taken', screenshot: 'fixture-base64' });
const closed = () => ok({ action: 'session_closed' });
function chrome(outcomes = {}) {
  const calls = [];
  return { calls, async executeChromeMCP(action, params) {
    calls.push([action, params]);
    const result = outcomes[action] ?? { navigate: nav(), snapshot: snap(), close: closed() }[action];
    if (result instanceof Error) throw result;
    return result;
  } };
}

test('Chrome success navigates, snapshots and closes', async () => {
  const executor = chrome(); await checkChrome(executor);
  assert.deepEqual(executor.calls.map(([a]) => a), ['navigate', 'snapshot', 'close']);
  assert.equal(executor.calls[0][1].url, 'https://example.com');
});
for (const [name, outcomes] of [
  ['navigation failure', { navigate: { success: false, error: 'network' } }],
  ['navigation exception', { navigate: new Error('network') }],
  ['invalid navigation', { navigate: ok({}) }],
  ['snapshot failure', { snapshot: { success: false } }],
  ['snapshot exception', { snapshot: new Error('snapshot') }],
  ['invalid snapshot', { snapshot: ok({ action: 'snapshot_taken' }) }],
  ['cleanup failure', { close: { success: false } }],
  ['cleanup exception', { close: new Error('cleanup') }],
  ['invalid cleanup', { close: ok({}) }],
]) {
  test(`Chrome rejects ${name} and attempts cleanup`, async () => {
    const executor = chrome(outcomes); await assert.rejects(checkChrome(executor));
    assert.equal(executor.calls.at(-1)[0], 'close');
    assert.equal(executor.calls.filter(([a]) => a === 'close').length, 1);
  });
}

test('Chrome cleanup still runs after a non-Error rejection', async () => {
  const calls = [];
  await assert.rejects(checkChrome({ async executeChromeMCP(action) {
    calls.push(action);
    if (action === 'navigate') throw null;
    return closed();
  } }));
  assert.deepEqual(calls, ['navigate', 'close']);
});

test('GitHub uses only supported workflow read for supplied repository', async () => {
  const calls = [];
  await checkGitHub({ async executeGitHubMCP(...args) {
    calls.push(args); return ok({ total: 1, latest_runs: [{ id: 1, status: 'completed', conclusion: 'failure' }] });
  } }, 'owner/repository');
  assert.deepEqual(calls, [['get_workflow_status', { owner: 'owner', repo: 'repository' }]]);
});
test('GitHub permits a valid empty workflow list', async () => {
  await checkGitHub({ executeGitHubMCP: async () => ok({ total: 0, latest_runs: [] }) }, 'owner/repo');
});
for (const result of [undefined, {}, { success: false, error: '401' },
  { success: true, data: { total: 0, latest_runs: [] } }, ok({}),
  ok({ total: 1, latest_runs: [] }), ok({ total: 0, latest_runs: [{}] }),
  ok({ total: 1, latest_runs: [{ id: 1 }] }), ok({ total: -1, latest_runs: [] })]) {
  test(`GitHub rejects malformed/failed envelope ${JSON.stringify(result)}`, async () => {
    await assert.rejects(checkGitHub({ executeGitHubMCP: async () => result }, 'owner/repo'));
  });
}
test('GitHub network exception is not healthy', async () => {
  await assert.rejects(checkGitHub({ executeGitHubMCP: async () => { throw new Error('network'); } }, 'owner/repo'));
});
test('runner configures isolated headless instance', async () => {
  let config;
  await runHealth('chrome', { loadChrome: async () => ({ ChromeMCPExecutor: class {
    constructor(value) { config = value; return chrome(); }
  } }) });
  assert.deepEqual(config, { headless: true, devtools: false });
});
test('runner uses the Actions public endpoint, ignoring inherited enterprise defaults', async () => {
  let config; let params;
  await runHealth('github', {
    env: { GITHUB_TOKEN: 'fixture-token', GITHUB_REPOSITORY: 'test/repo',
      GITHUB_API_URL: 'https://api.github.com', GITHUB_ENTERPRISE_URL: 'https://untrusted.invalid' },
    loadGitHub: async () => ({ GitHubMCPExecutor: class {
      constructor(value) { config = value; }
      async executeGitHubMCP(action, value) {
        assert.equal(action, 'get_workflow_status'); params = value;
        return ok({ total: 0, latest_runs: [] });
      }
    } }),
  });
  assert.deepEqual(config, { auth: { type: 'token', token: 'fixture-token' },
    baseUrl: 'https://api.github.com' });
  assert.deepEqual(params, { owner: 'test', repo: 'repo' });
});
for (const endpoint of [undefined, '', 'http://api.github.com', 'https://github.com',
  'https://api.github.com.evil.invalid', 'https://user@api.github.com',
  'https://api.github.com/', 'https://api.github.com/path', 'https://api.github.com?x=1']) {
  test(`runner refuses missing or unqualified API endpoint ${JSON.stringify(endpoint)}`, async () => {
    await assert.rejects(runHealth('github', {
      env: { GITHUB_TOKEN: 'fixture-token', GITHUB_REPOSITORY: 'test/repo',
        GITHUB_API_URL: endpoint, GITHUB_ENTERPRISE_URL: 'https://api.github.com' },
      loadGitHub: async () => assert.fail('must not load'),
    }), /Expected the public GitHub Actions API URL/);
  });
}
for (const env of [{}, { GITHUB_REPOSITORY: 'x/y' },
  { GITHUB_REPOSITORY: '../a/b', GITHUB_TOKEN: 'fixture' }]) {
  test('runner refuses missing token or invalid repository before loading executor', async () => {
    await assert.rejects(runHealth('github', { env, loadGitHub: async () => assert.fail('must not load') }));
  });
}
test('summary requires every requested supported probe to be true', () => {
  assert.equal(allRequestedHealthy('chrome,github', { chrome: 'true', github: 'true' }), true);
  assert.equal(allRequestedHealthy('github', { github: 'true' }), true);
  for (const requested of ['', 'chrome,', 'vertex-ai', 'chrome,unknown']) {
    assert.equal(allRequestedHealthy(requested, { chrome: 'true', github: 'true' }), false);
  }
  for (const state of [undefined, 'false', 'skipped', 'unknown', 'unverified', true]) {
    assert.equal(allRequestedHealthy('chrome,github', { chrome: 'true', github: state }), false);
  }
});
test('summary runner fails closed for missing evidence', async () => {
  await assert.rejects(runHealth('summary', { env: { MCP_SERVERS: 'chrome,github', CHROME_HEALTHY: 'true' } }));
});
