import { pathToFileURL } from 'node:url';

function successful(result, label) {
  if (!result || result.success !== true || !Number.isFinite(result.executionTime)
      || result.executionTime < 0 || !result.data || typeof result.data !== 'object') {
    throw new Error(`${label}: unsuccessful or invalid response`);
  }
  return result.data;
}

export async function checkChrome(executor) {
  try {
    const navigation = successful(await executor.executeChromeMCP('navigate', {
      url: 'https://example.com',
    }), 'Chrome navigation');
    if (navigation.status !== 'navigation_complete') throw new Error('Invalid navigation result');
    const snapshot = successful(await executor.executeChromeMCP('snapshot'), 'Chrome snapshot');
    if (snapshot.action !== 'snapshot_taken' || typeof snapshot.screenshot !== 'string'
        || !snapshot.screenshot.length) throw new Error('Invalid snapshot result');
  } finally {
    const closed = successful(await executor.executeChromeMCP('close'), 'Chrome cleanup');
    if (closed.action !== 'session_closed') throw new Error('Invalid cleanup result');
  }
}

export function repositoryParts(repository) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('Expected GITHUB_REPOSITORY owner/repository');
  }
  const [owner, repo] = repository.split('/');
  return { owner, repo };
}

export async function checkGitHub(executor, repository) {
  // This proves a supported read API call, not that the repository workflows pass.
  const data = successful(await executor.executeGitHubMCP(
    'get_workflow_status', repositoryParts(repository),
  ), 'GitHub workflow read');
  if (!Number.isInteger(data.total) || data.total < 0 || !Array.isArray(data.latest_runs)
      || data.latest_runs.length > 5 || data.latest_runs.length > data.total
      || (data.total > 0 && data.latest_runs.length === 0)
      || data.latest_runs.some(run => !run || !Number.isInteger(run.id) || run.id <= 0
        || typeof run.status !== 'string' || !run.status.length)) {
    throw new Error('Invalid GitHub workflow response');
  }
}

export function allRequestedHealthy(requested, statuses) {
  if (typeof requested !== 'string') return false;
  const names = requested.split(',').map(name => name.trim());
  return names.length > 0 && names.every(name => ['chrome', 'github'].includes(name)
    && statuses[name] === 'true');
}

export async function runHealth(kind, {
  env = process.env,
  loadChrome = () => import('../../dist/mcp/chrome-mcp-executor.js'),
  loadGitHub = () => import('../../dist/mcp/github-mcp-executor.js'),
} = {}) {
  if (kind === 'chrome') {
    const { ChromeMCPExecutor } = await loadChrome();
    // Per-CI instance only: interactive defaults in source remain unchanged.
    await checkChrome(new ChromeMCPExecutor({ headless: true, devtools: false }));
  } else if (kind === 'github') {
    const repository = env.GITHUB_REPOSITORY;
    repositoryParts(repository);
    if (typeof env.GITHUB_TOKEN !== 'string' || !env.GITHUB_TOKEN.trim()) {
      throw new Error('Actions read token is required');
    }
    // Actions supplies GITHUB_API_URL. This probe is qualified for public GitHub only.
    // Refuse absent/other endpoints before loading an executor or forwarding its token.
    if (env.GITHUB_API_URL !== 'https://api.github.com') {
      throw new Error('Expected the public GitHub Actions API URL');
    }
    const { GitHubMCPExecutor } = await loadGitHub();
    await checkGitHub(new GitHubMCPExecutor({
      auth: { type: 'token', token: env.GITHUB_TOKEN },
      baseUrl: env.GITHUB_API_URL,
    }), repository);
  } else if (kind === 'summary') {
    if (!allRequestedHealthy(env.MCP_SERVERS, {
      chrome: env.CHROME_HEALTHY, github: env.GITHUB_HEALTHY,
    })) throw new Error('A requested MCP is unhealthy or unverified');
  } else {
    throw new Error('Unsupported health check');
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    await runHealth(process.argv[2]);
    console.log('MCP health check passed');
  } catch {
    // Executor failures may contain remote response details. Never echo credentials.
    console.error('MCP health check failed or unverified');
    process.exitCode = 1;
  }
}
