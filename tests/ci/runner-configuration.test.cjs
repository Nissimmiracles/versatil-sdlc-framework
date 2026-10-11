const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { classifyTestSource, collectRunnerPartition } = require('./runner-partition.cjs');
const root = process.env.RUNNER_CONFIG_ROOT || path.resolve(__dirname, '../..');

// A config-shape contract, not a browser, framework or production execution.
function configShape(filename, env = {}) {
  const absolute = fs.realpathSync(path.join(root, filename));
  // Supply the canonical file URL before CJS transpilation. Actual ESM loading is
  // verified separately by the real runner listings, not by this shape contract.
  const source = fs.readFileSync(absolute, 'utf8').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(absolute).href));
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = createRequire(absolute);
  vm.runInNewContext(code, {
    module, exports: module.exports, __dirname: path.dirname(absolute),
    process: { env },
    require(name) {
      if (name === '@playwright/test') return { defineConfig: x => x, devices: {} };
      if (name === 'vitest/config') return { defineConfig: x => x };
      return localRequire(name);
    },
  }, { filename: absolute });
  return module.exports.default || module.exports;
}

test('runner imports are parsed, not inferred from comments or directory labels', () => {
  assert.equal(classifyTestSource("// import { test } from '@playwright/test';\nimport { test } from 'vitest';", 'tests/e2e/server.test.ts').runner, 'vitest');
  assert.equal(classifyTestSource("import { test } from '@playwright/test';", 'tests/integration/browser.test.ts').runner, 'playwright');
  assert.equal(classifyTestSource("import { test } from 'node:test';", 'tests/ci/contract.test.cjs').runner, 'node');
});

test('mixed APIs and unresolved suites remain explicit', () => {
  assert.deepEqual(classifyTestSource("import { test } from 'vitest'; jest.fn();", 'tests/api.test.ts').conflicts, ['Jest API used by another runner']);
  for (const source of [
    "const jest = { projects: [] }; jest.projects;",
    "import jest from './configuration'; jest.projects;",
    "function inspect(jest) { jest.projects; }",
    "function inspect() { jest.projects; var jest = {}; }",
    "{ const { config: jest } = settings; jest.projects; }",
    "const fixture = 'jest.fn()'; const fixture2 = `jest.fn()`;",
  ]) {
    assert.deepEqual(classifyTestSource(`import { test } from 'vitest'; ${source}`, 'tests/api.test.ts').conflicts, [], source);
  }
  assert.deepEqual(classifyTestSource("import { test } from 'vitest'; { const jest = {}; jest.projects; } jest.fn();", 'tests/api.test.ts').conflicts, ['Jest API used by another runner']);
  assert.deepEqual(classifyTestSource("import { test } from 'vitest'; function local(jest) { jest.projects; } function ambient() { jest.fn(); }", 'tests/api.test.ts').conflicts, ['Jest API used by another runner']);
  assert.equal(classifyTestSource("import { test } from 'vitest'; import { expect } from '@jest/globals';", 'tests/api.test.ts').runner, 'unknown');
  assert.equal(classifyTestSource('unrecognized source', 'tests/api.test.ts').runner, 'unknown');
  assert.equal(classifyTestSource('test content', 'tests/fixtures/live-activation/perf-test.test.ts').runner, 'fixture');
  assert.equal(classifyTestSource("import { test } from 'vitest';", 'tests/fixtures/real.test.ts').runner, 'vitest');
});

test('legacy globals have a recorded convention, distinct from explicit imports', () => {
  assert.equal(classifyTestSource("describe('x', () => {});", 'src/x.test.ts').runner, 'vitest');
  const legacy = classifyTestSource("describe('x', () => {});", 'tests/x.test.ts');
  assert.equal(legacy.runner, 'jest');
  assert.match(legacy.reason, /legacy/);
});

test('partition retains every discovered suite and fixture in exactly one bucket', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-partition-'));
  try {
    for (const [file, source] of [
      ['src/v.test.ts', "import { test } from 'vitest';"],
      ['tests/j.test.ts', "jest.fn();"],
      ['tests/browser.spec.ts', "import { test } from '@playwright/test';"],
      ['tests/unresolved.test.ts', 'unrecognized source'],
      ['tests/integration/test-sdk.ts', 'unrecognized source'],
      ['tests/fixtures/input.test.ts', 'test content'],
    ]) {
      const target = path.join(dir, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, source);
    }
    const partition = collectRunnerPartition(dir);
    const flattened = Object.values(partition.byRunner).flat();
    assert.equal(flattened.length, 6);
    assert.equal(new Set(flattened).size, 6);
    assert.deepEqual(partition.unknown, ['tests/integration/test-sdk.ts', 'tests/unresolved.test.ts']);
    assert.deepEqual(partition.byRunner.fixture, ['tests/fixtures/input.test.ts']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CI and Percy token never register the snapshot SDK as a Playwright reporter', () => {
  for (const env of [{}, { CI: 'true' }, { PERCY_TOKEN: 'fixture-only-not-a-token' }]) {
    const config = configShape('config/playwright.config.ts', env);
    assert(!config.reporter.some(([name]) => name === '@percy/playwright'));
    assert.equal(config.forbidOnly, !!env.CI);
    assert.equal(config.retries, env.CI ? 2 : 0);
  }
});

test('runner configs preserve all executable partitions without cross-collection', () => {
  const partition = collectRunnerPartition(root);
  const vitest = configShape('vitest.config.ts');
  const playwright = configShape('config/playwright.config.ts');
  const playwrightAlias = configShape('playwright.config.ts');
  assert.deepEqual(JSON.parse(JSON.stringify(playwrightAlias)), JSON.parse(JSON.stringify(playwright)));
  assert.equal(playwright.testDir, path.resolve(root, 'tests'));
  assert.equal(playwright.globalSetup, path.resolve(root, 'tests/setup/global-setup.ts'));
  assert.equal(playwright.globalTeardown, path.resolve(root, 'tests/setup/global-teardown.ts'));
  const browserFiles = partition.byRunner.playwright.map(file => path.resolve(root, file));
  const primaryBrowser = playwright.projects.find(project => project.name === 'chromium-desktop');
  assert.equal(primaryBrowser.testDir, path.resolve(root));
  for (const matches of [playwright.testMatch, primaryBrowser.testMatch]) {
    for (const file of browserFiles) assert(matches.includes(file), file);
    assert(matches.includes('**/tests/e2e/**/*.{ts,js}'));
  }
  const jest = createRequire(path.join(root, 'package.json'))('./config/jest.config.cjs');
  const discoveredJest = createRequire(path.join(root, 'package.json'))('./jest.config.cjs');
  assert.equal(discoveredJest, jest);
  assert(jest.projects.some(project => project.displayName?.name === 'UNIT'));
  assert.deepEqual(vitest.test.include, partition.byRunner.vitest);
  assert.deepEqual(JSON.parse(JSON.stringify(vitest.test.coverage.thresholds)), { statements: 80, branches: 80, functions: 80, lines: 80 });
  const jestFiles = jest.projects.flatMap(project => project.testMatch.map(file => file.replace('<rootDir>/', '')));
  assert.deepEqual([...jestFiles].sort(), [...partition.byRunner.jest].sort());
  assert.equal(new Set(jestFiles).size, jestFiles.length);
  for (const entry of partition.entries) {
    const ignored = playwright.testIgnore.includes(path.resolve(root, entry.path));
    assert.equal(ignored, entry.runner !== 'playwright', entry.path);
  }
});

test('workflow dispatch is explicit and keeps Percy SDK/CLI and existing triggers', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/PNPM_WORKFLOW_TEMPLATE.yml'), 'utf8');
  assert.match(workflow, /push:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /runner-partition\.cjs --check/);
  assert.match(workflow, /vitest run --config vitest\.config\.ts/);
  assert.match(workflow, /jest --config config\/jest\.config\.cjs/);
  assert.match(workflow, /playwright test --config playwright\.config\.ts/);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert(pkg.devDependencies['@percy/playwright']);
  assert.match(pkg.scripts['test:visual:percy'], /percy exec/);
});

test('integration workflow dispatch agrees with the runner partition for every matrix suite', () => {
  const yaml = require('js-yaml');
  const workflow = yaml.load(fs.readFileSync(path.join(root, '.github/workflows/test.yml'), 'utf8'));
  const job = workflow.jobs['test-integration'];
  const partition = collectRunnerPartition(root);
  const vitestStep = job.steps.find(step => step.run?.startsWith('pnpm vitest run tests/integration/'));
  const jestStep = job.steps.find(step => step.run?.includes('--runTestsByPath tests/integration/introspective-integration.test.ts'));
  assert.equal(vitestStep.if, "matrix.suite != 'introspective-integration'");
  assert.equal(jestStep.if, "matrix.suite == 'introspective-integration'");
  assert.match(jestStep.run, /--config config\/jest\.config\.cjs --selectProjects INTEGRATION/);
  for (const suite of job.strategy.matrix.suite) {
    const file = `tests/integration/${suite}.test.ts`;
    const runner = suite === 'introspective-integration' ? 'jest' : 'vitest';
    assert(partition.byRunner[runner].includes(file), `${file} must run under ${runner}`);
  }
});

test('Jest CJS transformation preserves source import.meta URLs and local filename bindings', () => {
  const transform = require('../setup/jest-import-meta.cjs');
  const filename = path.join(os.tmpdir(), 'path with spaces', 'source.ts');
  const source = "const {fileURLToPath} = require('node:url'); const __filename = fileURLToPath(import.meta.url); const __dirname = require('node:path').dirname(__filename); module.exports = {url: import.meta.url, filename: __filename, directory: __dirname};";
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {module: ts.ModuleKind.CommonJS},
    transformers: {before: [transform.factory({configSet: {compilerModule: ts}})]},
  }).outputText;
  const module = {exports: {}};
  vm.runInNewContext(output, {module, exports: module.exports, require, __filename: 'wrapper.cjs', __dirname: 'wrapper'});
  assert.equal(module.exports.url, pathToFileURL(filename).href);
  assert.equal(module.exports.filename, filename);
  assert.equal(module.exports.directory, path.dirname(filename));
});
