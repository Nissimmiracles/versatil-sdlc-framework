/** Real Express routes with offline monitoring and isolated filesystem fixtures. */
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
jest.mock('../src/analytics/performance-monitor', () => ({ PerformanceMonitor: jest.fn().mockImplementation(() => ({ start: jest.fn(), getPrometheusMetrics: () => 'fixture_metric 1' })) }));
// Exercise the real app through a bounded loopback HTTP listener, without an undeclared supertest dependency.
function request(app: any) {
  return { get(url: string) { return { async expect(status: number) {
    const listener = http.createServer(app);
    await new Promise<void>(resolve => listener.listen(0, '127.0.0.1', resolve));
    try {
      const port = (listener.address() as any).port;
      const response = await new Promise<any>((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port, path: url }, incoming => {
          let text = ''; incoming.setEncoding('utf8'); incoming.on('data', chunk => { text += chunk; });
          incoming.on('end', () => { let body; try { body = JSON.parse(text); } catch { body = {}; } resolve({ status: incoming.statusCode, headers: incoming.headers, text, body }); });
        }).on('error', reject);
      });
      expect(response.status).toBe(status); return response;
    } finally { await new Promise<void>(resolve => listener.close(() => resolve())); }
  } }; } };
}
let mockTempRoot: string;
jest.mock('node:os', () => ({ ...jest.requireActual('node:os'), tmpdir: () => mockTempRoot }));
let root: string;
let app: any;
let priorEnv: Record<string, string | undefined>;
let listeners: Map<string, Function[]>;
function load() { jest.resetModules(); return require('../src/server').app; }
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'server-routes-'));
  mockTempRoot = root;
  fs.mkdirSync(path.join(root, '.versatil', 'analytics'), { recursive: true });
  fs.writeFileSync(path.join(root, '.versatil', 'analytics', 'metrics.json'), JSON.stringify({ timestamp: 'fixture', agents: ['fixture-agent'] }));
  listeners = new Map(['SIGTERM', 'SIGINT'].map(signal => [signal, process.listeners(signal)]));
  priorEnv = { ENHANCED_AGENTS_ENABLED: process.env.ENHANCED_AGENTS_ENABLED, PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING, PORT: process.env.PORT };
  process.env.ENHANCED_AGENTS_ENABLED = 'true'; process.env.PERFORMANCE_MONITORING = 'true'; process.env.PORT = '3000';
  jest.spyOn(process, 'cwd').mockReturnValue(root);
  jest.spyOn(process, 'memoryUsage').mockReturnValue({ rss: 1000, heapTotal: 1000, heapUsed: 500, external: 0, arrayBuffers: 0 });
  const listen = http.Server.prototype.listen;
  jest.spyOn(http.Server.prototype, 'listen').mockImplementation(function(this: http.Server, ...args: any[]) {
    // Suppress the production startup port; supertest may use an ephemeral loopback listener.
    if (args[0] === '3000' || args[0] === 3000) return this;
    return listen.apply(this, args as any);
  } as any);
  app = load();
});
afterEach(() => {
  for (const [signal, before] of listeners) for (const listener of process.listeners(signal)) if (!before.includes(listener)) process.removeListener(signal, listener as any);
  for (const [key, value] of Object.entries(priorEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  jest.restoreAllMocks(); fs.rmSync(root, { recursive: true, force: true });
});
describe('Current server routes', () => {
  it('returns health metadata and process memory without manufacturing agent health', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toMatchObject({ status: 'healthy', timestamp: expect.any(String), uptime: expect.any(Number), memory: { heapUsed: 500 }, enhancedAgents: true, performanceMonitoring: true });
  });
  it('is ready when filesystem, memory, and recent agent metrics pass', async () => {
    const response = await request(app).get('/ready').expect(200);
    expect(response.body.checks).toMatchObject({ filesystem: { status: 'ok' }, memory: { status: 'ok' }, operaAgents: { status: 'ok' } });
  });
  it('probes the native temporary directory and removes the health probe', async () => {
    const write = jest.spyOn(require('fs'), 'writeFileSync');
    const unlink = jest.spyOn(require('fs'), 'unlinkSync');
    const result = (await request(app).get('/ready').expect(200)).body;
    expect(result.checks.filesystem.status).toBe('ok');
    const probe = write.mock.calls.find(call => path.basename(String(call[0])).startsWith('health-check-'));
    expect(probe).toBeDefined();
    expect(path.dirname(String(probe![0]))).toBe(root);
    expect(unlink).toHaveBeenCalledWith(probe![0]);
    expect(fs.existsSync(String(probe![0]))).toBe(false);
  });
  it('reports an unwritable temporary directory as unready on every platform', async () => {
    const write = fs.writeFileSync;
    const denial = Object.assign(new Error('Fixture temporary directory permission denied'), { code: 'EACCES' });
    jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(((file: fs.PathOrFileDescriptor, ...args: any[]) => {
      if (path.dirname(String(file)) === root && path.basename(String(file)).startsWith('health-check-')) throw denial;
      return (write as any)(file, ...args);
    }) as any);
    const result = (await request(app).get('/ready').expect(503)).body;
    expect(result.checks.filesystem).toEqual({ status: 'error', message: denial.message });
    expect(result.checks.operaAgents.status).toBe('ok');
    expect(result.checks.memory.status).toBe('ok');
  });
  it('is unready when agent metrics are missing', async () => {
    fs.unlinkSync(path.join(root, '.versatil', 'analytics', 'metrics.json'));
    expect((await request(app).get('/ready').expect(503)).body.checks.operaAgents.status).toBe('warning');
  });
  it('is unready when metrics are stale', async () => {
    const file = path.join(root, '.versatil', 'analytics', 'metrics.json'); fs.utimesSync(file, new Date(0), new Date(0));
    expect((await request(app).get('/ready').expect(503)).body.checks.operaAgents.status).toBe('stale');
  });
  it('is unready under high memory usage', async () => {
    jest.mocked(process.memoryUsage).mockReturnValue({ rss: 1000, heapTotal: 1000, heapUsed: 950, external: 0, arrayBuffers: 0 });
    expect((await request(app).get('/ready').expect(503)).body.checks.memory.status).toBe('warning');
  });
  it('serves explicit monitor metrics', async () => {
    const response = await request(app).get('/metrics').expect(200);
    expect(response.headers['content-type']).toContain('text/plain'); expect(response.text).toBe('fixture_metric 1');
  });
  it('serves stored analytics data', async () => {
    expect((await request(app).get('/analytics').expect(200)).body).toEqual({ timestamp: 'fixture', agents: ['fixture-agent'] });
  });
  it('returns an error for malformed stored analytics', async () => {
    fs.writeFileSync(path.join(root, '.versatil', 'analytics', 'metrics.json'), '{');
    expect((await request(app).get('/analytics').expect(500)).body.error).toBe('Failed to read analytics data');
  });
  it('returns not found when analytics is absent', async () => {
    fs.unlinkSync(path.join(root, '.versatil', 'analytics', 'metrics.json'));
    expect((await request(app).get('/analytics').expect(404)).body.error).toBe('Analytics data not found');
  });
  it('distinguishes active logs from unknown agent status', async () => {
    fs.mkdirSync(path.join(root, '.versatil', 'logs'), { recursive: true });
    fs.writeFileSync(path.join(root, '.versatil', 'logs', 'enhanced-maria.log'), 'fixture');
    const result = (await request(app).get('/agents/status').expect(200)).body;
    expect(result.enhancedMaria.status).toBe('active'); expect(result.enhancedJames.status).toBe('unknown');
  });
  it('gates metrics and analytics when monitoring is disabled', async () => {
    process.env.PERFORMANCE_MONITORING = 'false'; app = load();
    expect((await request(app).get('/metrics').expect(404)).body.error).toBe('Metrics disabled');
    expect((await request(app).get('/analytics').expect(404)).body.error).toBe('Analytics disabled');
  });
  it('gates agent status when enhanced agents are disabled', async () => {
    process.env.ENHANCED_AGENTS_ENABLED = 'false'; app = load();
    expect((await request(app).get('/agents/status').expect(404)).body.error).toBe('Enhanced agents disabled');
  });
  it('returns an explicit 404 for unsupported routes', async () => {
    expect((await request(app).get('/health/detailed').expect(404)).body).toMatchObject({ error: 'Not found', path: '/health/detailed' });
  });
});
