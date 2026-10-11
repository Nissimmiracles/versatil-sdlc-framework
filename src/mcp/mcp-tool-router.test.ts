/** Contract tests isolate provider execution; no credentials or network are required. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MCPToolRouter, type ToolCallRequest } from './mcp-tool-router.js';

const executors = vi.hoisted(() => {
  const methods = (names: string[]) => Object.fromEntries(names.map(name => [name, vi.fn()]));
  return {
    playwright: methods(['executePlaywrightMCP']),
    chrome: methods(['executeChromeMCP']),
    github: methods(['initialize', 'destroy', 'createIssue', 'listIssues', 'createPullRequest', 'getFile', 'createOrUpdateFile', 'searchCode', 'getRepository', 'listBranches']),
    exa: methods(['initialize', 'destroy', 'search', 'searchPapers', 'searchLinkedIn', 'searchWithContent', 'findSimilar', 'getContents']),
    git: methods(['initialize', 'destroy', 'queryRepository', 'searchFrameworkDocs'])
  };
});
vi.mock('./playwright-mcp-executor.js', () => ({
  PlaywrightMCPExecutor: class {
    executePlaywrightMCP = executors.playwright.executePlaywrightMCP;
  }
}));
vi.mock('./chrome-mcp-executor.js', () => ({ chromeMCPExecutor: executors.chrome }));
vi.mock('./github-mcp-client.js', () => ({ getGitHubMCPClient: () => executors.github }));
vi.mock('./exa-search-mcp-client.js', () => ({ getExaSearchMCPClient: () => executors.exa }));
vi.mock('./gitmcp-executor.js', () => ({ getGitMCPExecutor: () => executors.git }));
vi.mock('./shadcn-mcp-config.js', () => ({ DEFAULT_SHADCN_MCP_CONFIG: { fixture: true } }));

describe('MCPToolRouter implemented contract', () => {
  let router: MCPToolRouter;
  beforeEach(() => {
    vi.resetAllMocks();
    for (const executor of Object.values(executors)) {
      for (const method of Object.values(executor)) {
        method.mockResolvedValue({ success: true, data: 'fixture' });
      }
    }
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    router = new MCPToolRouter();
  });
  afterEach(async () => {
    await router.destroy();
    vi.restoreAllMocks();
  });

  it('initializes providers and emits initialized only after completion', async () => {
    const listener = vi.fn();
    router.on('initialized', listener);
    await router.initialize();
    for (const provider of [executors.github, executors.exa, executors.git]) {
      expect(provider.initialize).toHaveBeenCalledExactlyOnceWith();
    }
    expect(listener).toHaveBeenCalledExactlyOnceWith();
    expect(executors.playwright.executePlaywrightMCP).not.toHaveBeenCalled();
    expect(executors.chrome.executeChromeMCP).not.toHaveBeenCalled();
  });

  it('propagates initialization failure without an initialized event', async () => {
    const failure = new Error('provider unavailable');
    executors.github.initialize.mockRejectedValue(failure);
    const listener = vi.fn();
    router.on('initialized', listener);
    await expect(router.initialize()).rejects.toBe(failure);
    expect(listener).not.toHaveBeenCalled();
  });

  it.each(['Playwright', 'playwright', 'PLAYWRIGHT'])('forwards %s action and parameters', async tool => {
    const params = { selector: '.app' };
    const response = await router.handleToolCall({ tool, action: 'screenshot', params });
    expect(executors.playwright.executePlaywrightMCP).toHaveBeenCalledExactlyOnceWith('screenshot', params);
    expect(response).toMatchObject({ tool, action: 'screenshot', success: true, data: 'fixture' });
  });

  it('lazy loads Chrome and forwards action and parameters', async () => {
    const params = { url: 'https://example.test' };
    expect(await router.handleToolCall({ tool: 'Chrome', action: 'navigate', params })).toMatchObject({ success: true, data: 'fixture' });
    expect(executors.chrome.executeChromeMCP).toHaveBeenCalledExactlyOnceWith('navigate', params);
  });

  const githubCases: [string, string, Record<string, unknown>, unknown[]][] = [
    ['create_issue', 'createIssue', { owner: 'o', repo: 'r', issue: { title: 't' } }, ['o', 'r', { title: 't' }]],
    ['list_issues', 'listIssues', { owner: 'o', repo: 'r', options: { state: 'open' } }, ['o', 'r', { state: 'open' }]],
    ['create_pr', 'createPullRequest', { owner: 'o', repo: 'r', pr: { head: 'branch' } }, ['o', 'r', { head: 'branch' }]],
    ['get_file', 'getFile', { owner: 'o', repo: 'r', path: 'README.md', ref: 'branch' }, ['o', 'r', 'README.md', 'branch']],
    ['update_file', 'createOrUpdateFile', { owner: 'o', repo: 'r', file: { path: 'a' } }, ['o', 'r', { path: 'a' }]],
    ['search_code', 'searchCode', { query: 'q', options: { page: 2 } }, ['q', { page: 2 }]],
    ['get_repo', 'getRepository', { owner: 'o', repo: 'r' }, ['o', 'r']],
    ['list_branches', 'listBranches', { owner: 'o', repo: 'r' }, ['o', 'r']]
  ];
  it.each(githubCases)('dispatches GitHub %s to %s', async (action, method, params, args) => {
    expect(await router.handleToolCall({ tool: 'GitHub', action, params })).toMatchObject({ success: true, data: 'fixture' });
    expect(executors.github[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });

  const exaCases: [string, string, Record<string, unknown>, unknown[]][] = [
    ['search', 'search', { query: 'q', numResults: 2 }, [{ query: 'q', numResults: 2 }]],
    ['search_papers', 'searchPapers', { query: 'q', options: { year: 2025 } }, ['q', { year: 2025 }]],
    ['search_linkedin', 'searchLinkedIn', { query: 'q', options: {} }, ['q', {}]],
    ['search_with_content', 'searchWithContent', { query: 'q', options: {} }, ['q', {}]],
    ['find_similar', 'findSimilar', { url: 'https://example.test', numResults: 2 }, ['https://example.test', 2]],
    ['get_contents', 'getContents', { urls: ['https://example.test'] }, [['https://example.test']]]
  ];
  it.each(exaCases)('dispatches Exa %s to %s', async (action, method, params, args) => {
    expect(await router.handleToolCall({ tool: 'Exa', action, params })).toMatchObject({ success: true, data: 'fixture' });
    expect(executors.exa[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });
  it('supports ExaSearch alias', async () => {
    await router.handleToolCall({ tool: 'ExaSearch', action: 'search', params: { query: 'q' } });
    expect(executors.exa.search).toHaveBeenCalledExactlyOnceWith({ query: 'q' });
  });

  it.each(['GitMCP', 'git'])('supports %s repository routing', async tool => {
    const params = { owner: 'o', repo: 'r', path: 'README.md' };
    expect(await router.handleToolCall({ tool, action: 'query_repo', params })).toMatchObject({ success: true });
    expect(executors.git.queryRepository).toHaveBeenCalledExactlyOnceWith(params);
  });
  it('supports query_repository alias', async () => {
    await router.handleToolCall({ tool: 'GitMCP', action: 'query_repository', params: { owner: 'o', repo: 'r' } });
    expect(executors.git.queryRepository).toHaveBeenCalledExactlyOnceWith({ owner: 'o', repo: 'r', path: undefined });
  });
  it.each(['search_framework_docs', 'search_docs'])('forwards GitMCP %s', async action => {
    await router.handleToolCall({ tool: 'GitMCP', action, params: { framework: 'react', topic: 'hooks' } });
    expect(executors.git.searchFrameworkDocs).toHaveBeenCalledExactlyOnceWith('react', 'hooks');
  });
  it.each(['get_examples', 'get_code_examples'])('extracts GitMCP %s', async action => {
    const examples = [{ title: 'fixture' }];
    executors.git.searchFrameworkDocs.mockResolvedValue({ examples, documentation: 'docs' });
    expect(await router.handleToolCall({ tool: 'GitMCP', action, params: { framework: 'react', topic: 'hooks' } })).toMatchObject({ success: true, data: { examples, framework: 'react', topic: 'hooks' } });
    expect(executors.git.searchFrameworkDocs).toHaveBeenCalledExactlyOnceWith('react', 'hooks');
  });

  it('returns the implemented Shadcn configuration placeholder', async () => {
    expect(await router.handleToolCall({ tool: 'Shadcn', action: 'get_component', params: { componentType: 'button' } })).toMatchObject({
      success: true, data: { componentType: 'button', code: '// Shadcn button component', config: { fixture: true } }
    });
  });

  it.each([
    ['Unknown', 'Unknown MCP tool: Unknown'],
    ['GitHub', 'Unknown GitHub MCP action: invalid'],
    ['Exa', 'Unknown Exa Search MCP action: invalid'],
    ['GitMCP', 'Unknown GitMCP action: invalid'],
    ['Shadcn', 'Unknown Shadcn MCP action: invalid']
  ])('reports unsupported %s calls', async (tool, error) => {
    expect(await router.handleToolCall({ tool, action: 'invalid', params: {} })).toMatchObject({ success: false, error, tool, action: 'invalid' });
  });

  it('preserves explicit provider failures and emits the completion payload', async () => {
    const request: ToolCallRequest = { tool: 'Playwright', action: 'click', params: {}, agentId: 'agent', taskId: 'task' };
    const listener = vi.fn();
    router.on('tool-call-complete', listener);
    executors.playwright.executePlaywrightMCP.mockResolvedValue({ success: false, error: 'disconnected', data: [] });
    const response = await router.handleToolCall(request);
    expect(response).toMatchObject({ success: false, error: 'disconnected', data: [] });
    expect(listener).toHaveBeenCalledExactlyOnceWith({ request, response, agentId: 'agent' });
    expect(router.getStats()).toMatchObject({ totalCalls: 1, successfulCalls: 0, failedCalls: 1 });
    expect(router.getCallHistory()).toEqual([request]);
  });

  it.each([false, 0, '', null])('preserves explicit data %s', async data => {
    executors.playwright.executePlaywrightMCP.mockResolvedValue({ success: true, data });
    expect(await router.handleToolCall({ tool: 'Playwright', action: 'fixture', params: {} })).toMatchObject({ success: true, data });
  });

  it('returns unwrapped provider data when no data field exists', async () => {
    executors.github.getRepository.mockResolvedValue({ name: 'repository' });
    expect(await router.handleToolCall({ tool: 'GitHub', action: 'get_repo', params: {} })).toMatchObject({ success: true, data: { name: 'repository' } });
  });

  it('counts thrown calls, agents, tools and latency alongside successful calls', async () => {
    const failure = new Error('executor failed');
    const listener = vi.fn();
    router.on('tool-call-error', listener);
    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(110).mockReturnValueOnce(200).mockReturnValueOnce(230);
    await router.handleToolCall({ tool: 'Playwright', action: 'fixture', params: {}, agentId: 'agent' });
    executors.playwright.executePlaywrightMCP.mockRejectedValue(failure);
    const request = { tool: 'Playwright', action: 'fixture', params: {}, agentId: 'agent' };
    expect(await router.handleToolCall(request)).toMatchObject({ success: false, error: 'executor failed', executionTime: 30 });
    expect(listener).toHaveBeenCalledExactlyOnceWith({ request, error: failure, agentId: 'agent' });
    expect(router.getStats()).toEqual({ totalCalls: 2, successfulCalls: 1, failedCalls: 1, averageExecutionTime: 20, callsByTool: { Playwright: 2 }, callsByAgent: { agent: 2 } });
    expect(executors.playwright.executePlaywrightMCP).toHaveBeenCalledTimes(2);
  });

  it('returns independent statistics snapshots', async () => {
    await router.handleToolCall({ tool: 'Playwright', action: 'fixture', params: {}, agentId: 'agent' });
    const stats = router.getStats();
    stats.callsByTool.Playwright = 99;
    stats.callsByAgent.agent = 99;
    expect(router.getStats()).toMatchObject({ callsByTool: { Playwright: 1 }, callsByAgent: { agent: 1 } });
  });

  it('caps history at 100 calls and returns the requested tail', async () => {
    for (let i = 0; i < 105; i++) await router.handleToolCall({ tool: 'Playwright', action: 'fixture', params: { i } });
    expect(router.getCallHistory(200)).toHaveLength(100);
    expect(router.getCallHistory(200)[0].params.i).toBe(5);
    expect(router.getCallHistory(2).map(call => call.params.i)).toEqual([103, 104]);
    expect(router.getCallHistory()).toHaveLength(10);
  });

  it('lists configured tools without claiming provider health', () => {
    expect(router.getAvailableTools()).toEqual(['Playwright', 'Chrome', 'GitHub', 'Exa', 'GitMCP', 'Shadcn']);
    expect(router.isToolAvailable('GitHub')).toBe(true);
    expect(router.isToolAvailable('Unknown')).toBe(false);
  });

  it('shutdown destroys providers and removes listeners', async () => {
    router.on('tool-call-complete', vi.fn());
    await router.shutdown();
    for (const provider of [executors.github, executors.exa, executors.git]) expect(provider.destroy).toHaveBeenCalledExactlyOnceWith();
    expect(router.listenerCount('tool-call-complete')).toBe(0);
  });
});
