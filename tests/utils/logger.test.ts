/** Tests the implemented console logger contract, including MCP stderr routing. */
import { VERSATILLogger } from '../../src/utils/logger';

describe('VERSATILLogger console contract', () => {
  let logger: VERSATILLogger;
  let priorMode: string | undefined;
  beforeEach(() => {
    priorMode = process.env.VERSATIL_MCP_MODE;
    delete process.env.VERSATIL_MCP_MODE;
    logger = new VERSATILLogger();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    if (priorMode === undefined) delete process.env.VERSATIL_MCP_MODE;
    else process.env.VERSATIL_MCP_MODE = priorMode;
    jest.restoreAllMocks();
  });
  it('shares a singleton while allowing independent component logger instances', () => {
    expect(VERSATILLogger.getInstance()).toBe(VERSATILLogger.getInstance());
    expect(new VERSATILLogger()).not.toBe(VERSATILLogger.getInstance());
  });
  it.each([
    ['info', 'INFO', 'log'],
    ['debug', 'DEBUG', 'log'],
    ['warn', 'WARN', 'warn'],
    ['warning', 'WARN', 'warn'],
    ['error', 'ERROR', 'error']
  ] as const)('formats %s and uses its console destination', (method, severity, sink) => {
    logger[method]('message');
    expect(console[sink]).toHaveBeenCalledTimes(1);
    expect(console[sink]).toHaveBeenCalledWith(`[VERSATIL] ${severity}: message`);
    for (const other of ['log', 'warn', 'error'] as const) if (other !== sink) expect(console[other]).not.toHaveBeenCalled();
  });
  it('includes structured context exactly once without changing the payload', () => {
    const context = { action: 'activate', nested: { success: false }, items: [1, 'two'], count: 0 };
    logger.info('payload', context);
    expect(console.log).toHaveBeenCalledWith(`[VERSATIL] INFO: payload ${JSON.stringify(context)}`);
    expect(context).toEqual({ action: 'activate', nested: { success: false }, items: [1, 'two'], count: 0 });
  });
  it.each([undefined, null, {}])('omits missing or empty context %j', context => {
    logger.info('empty', context);
    expect(console.log).toHaveBeenCalledWith('[VERSATIL] INFO: empty');
  });
  it('uses constructor component and lets an explicit component override it', () => {
    const componentLogger = new VERSATILLogger('guardian');
    componentLogger.info('default');
    componentLogger.info('override', { attempt: 1 }, 'router');
    expect(console.log).toHaveBeenNthCalledWith(1, '[guardian] INFO: default');
    expect(console.log).toHaveBeenNthCalledWith(2, '[router] INFO: override {"attempt":1}');
  });
  it('formats error details on stderr', () => {
    logger.error('Activation failed', { error: 'backend unavailable', retryable: false }, 'agent');
    expect(console.error).toHaveBeenCalledWith('[agent] ERROR: Activation failed {"error":"backend unavailable","retryable":false}');
    expect(console.log).not.toHaveBeenCalled();
  });
  it('preserves special characters in message and escapes JSON context', () => {
    logger.warn('line1\nline2 "quoted"', { text: 'value\nwith "quotes"' });
    expect(console.warn).toHaveBeenCalledWith('[VERSATIL] WARN: line1\nline2 "quoted" {"text":"value\\nwith \\"quotes\\""}');
  });
  it('propagates serialization errors without emitting a partial line', () => {
    const context: Record<string, unknown> = {};
    context.self = context;
    expect(() => logger.info('circular', context)).toThrow(TypeError);
    expect(console.log).not.toHaveBeenCalled();
  });
  it.each(['info', 'debug', 'warn', 'warning', 'error'] as const)('routes %s exclusively to stderr in MCP mode', method => {
    process.env.VERSATIL_MCP_MODE = 'true';
    logger[method]('protocol-safe', { event: 'fixture' }, 'mcp');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[mcp]'));
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
  it('requires the exact true marker to activate MCP routing', () => {
    process.env.VERSATIL_MCP_MODE = 'false';
    logger.info('normal');
    expect(console.log).toHaveBeenCalledWith('[VERSATIL] INFO: normal');
    expect(console.error).not.toHaveBeenCalled();
  });
});
