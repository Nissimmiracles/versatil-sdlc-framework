// Synthetic boundary adapters around the REAL tracked hook source.
// This qualifies source suggestions only, never native Claude agent invocation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const [sourcePath, fixtureRoot] = process.argv.slice(2);
const code = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
}).outputText;
const root = path.resolve(fixtureRoot);
const check = file => {
  if (file === 0) return file;
  const target = path.resolve(String(file));
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error('Fixture I/O boundary exceeded');
  return target;
};
const fixtureFS = {
  readFileSync: (file, ...args) => fs.readFileSync(check(file), ...args),
  existsSync: file => fs.existsSync(check(file)),
  statSync: file => fs.statSync(check(file)),
  writeFileSync: (file, ...args) => fs.writeFileSync(check(file), ...args)
};
const stdout = [], stderr = [];
let reported = false;
const started = performance.now();
const stop = Symbol('fixture hook exit');
const report = code => {
  if (!reported) {
    reported = true;
    process.stdout.write(JSON.stringify({ code, stdout: stdout.join('\n'), stderr: stderr.join('\n'), executionMs: performance.now() - started }));
  }
};
const fixtureRequire = name => {
  if (name === 'fs') return fixtureFS;
  if (name === 'path') return path;
  if (name === 'os') return { homedir: () => path.join(root, '.home') };
  if (name.includes('context-identity')) return { detectContextIdentity: async () => { throw new Error('Synthetic identity unavailable'); } };
  if (name.includes('automation-metrics')) return { getMetricsService: () => new Proxy({}, { get: () => () => {} }) };
  if (name.includes('guardian-')) throw new Error('Guardian execution outside fixture scope');
  throw new Error(`Unexpected fixture import: ${name}`);
};
process.on('unhandledRejection', error => {
  if (error !== stop) { stderr.push(String(error)); report(1); process.exitCode = 1; }
});
try {
  const context = vm.createContext({ require: fixtureRequire, exports: {},
    process: { stdin: { fd: 0 }, cwd: () => root, exit: code => { report(code); throw stop; }, env: { NODE_ENV: 'test' } },
    console: { log: value => stdout.push(String(value)), error: (...values) => stderr.push(values.join(' ')) },
    Date, setTimeout, clearTimeout, Buffer });
  vm.runInContext(code, context, { timeout: 5000 });
} catch (error) {
  if (error !== stop) { stderr.push(String(error)); report(1); process.exitCode = 1; }
}
