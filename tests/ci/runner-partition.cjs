// Shared collection policy. It classifies source, never executes test modules.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function classifyTestSource(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const imports = new Set();
  // Resolve lexical bindings before inspecting uses, including declarations after a use.
  // A local config object named jest is not the ambient Jest runtime API.
  const jestBindings = new Set();
  function isScope(node) {
    return ts.isSourceFile(node) || ts.isFunctionLike(node) || ts.isBlock(node) ||
      ts.isCaseBlock(node) || ts.isCatchClause(node) || ts.isForStatement(node) ||
      ts.isForInStatement(node) || ts.isForOfStatement(node) ||
      ts.isClassDeclaration(node) || ts.isClassExpression(node);
  }
  function enclosingScope(node, functionOnly = false) {
    while (node) {
      if (functionOnly ? ts.isSourceFile(node) || ts.isFunctionLike(node) : isScope(node)) return node;
      node = node.parent;
    }
    return tree;
  }
  function bind(name, scope) {
    if (!name) return;
    if (ts.isIdentifier(name)) {
      if (name.text === 'jest') jestBindings.add(scope);
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) if (ts.isBindingElement(element)) bind(element.name, scope);
    }
  }
  function collectBindings(node) {
    if (ts.isVariableDeclaration(node)) {
      const list = node.parent;
      const functionOnly = ts.isVariableDeclarationList(list) && !(list.flags & ts.NodeFlags.BlockScoped);
      bind(node.name, enclosingScope(node.parent, functionOnly));
    } else if (ts.isParameter(node)) bind(node.name, enclosingScope(node.parent, true));
    else if (ts.isImportClause(node) || ts.isImportSpecifier(node) || ts.isNamespaceImport(node)) bind(node.name, tree);
    else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)) bind(node.name, enclosingScope(node.parent));
    else if (ts.isFunctionExpression(node) || ts.isClassExpression(node)) bind(node.name, node);
    ts.forEachChild(node, collectBindings);
  }
  function hasLocalJest(node) {
    for (let scope = node.parent; scope; scope = scope.parent) {
      if (isScope(scope) && jestBindings.has(scope)) return true;
    }
    return false;
  }
  collectBindings(tree);
  let jestApi = false;
  let testCalls = false;
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.add(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'require' && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) imports.add(node.arguments[0].text);
      if (['describe', 'it', 'test'].includes(node.expression.text)) testCalls = true;
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'jest' && !hasLocalJest(node)) jestApi = true;
    ts.forEachChild(node, visit);
  }
  visit(tree);
  const explicit = [
    ['playwright', '@playwright/test'], ['vitest', 'vitest'],
    ['jest', '@jest/globals'], ['node', 'node:test'],
  ].filter(([, name]) => imports.has(name)).map(([runner]) => runner);
  if (explicit.length > 1) return { runner: 'unknown', reason: 'multiple runner imports', conflicts: explicit };
  if (explicit.length === 1) return {
    runner: explicit[0], reason: 'explicit runner import',
    conflicts: jestApi && explicit[0] !== 'jest' ? ['Jest API used by another runner'] : [],
  };
  if (filename.startsWith('tests/fixtures/')) {
    return { runner: 'fixture', reason: 'test input fixture without an explicit runner', conflicts: [] };
  }
  if (jestApi) return { runner: 'jest', reason: 'Jest API', conflicts: [] };
  if (testCalls) return {
    runner: filename.startsWith('src/') ? 'vitest' : 'jest',
    reason: 'legacy global-test convention: src=Vitest, tests=Jest', conflicts: [],
  };
  return { runner: 'unknown', reason: 'no runner import or recognized test declaration', conflicts: [] };
}

function collectRunnerPartition(root) {
  const entries = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && (
        /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name) ||
        (file.includes(`${path.sep}__tests__${path.sep}`) && /\.[jt]sx?$/.test(entry.name)) ||
        (path.relative(root, dir).split(path.sep).join('/') === 'tests/integration' && /^test-.*\.tsx?$/.test(entry.name))
      )) {
        const relative = path.relative(root, file).split(path.sep).join('/');
        entries.push({ path: relative, ...classifyTestSource(fs.readFileSync(file, 'utf8'), relative) });
      }
    }
  }
  walk(path.join(root, 'src'));
  walk(path.join(root, 'tests'));
  const byRunner = Object.fromEntries(['vitest', 'jest', 'playwright', 'node', 'fixture', 'unknown'].map(runner => [runner, entries.filter(e => e.runner === runner).map(e => e.path)]));
  return { entries, byRunner, conflicts: entries.filter(e => e.conflicts.length), unknown: byRunner.unknown };
}

module.exports = { classifyTestSource, collectRunnerPartition };

if (require.main === module) {
  const result = collectRunnerPartition(path.resolve(__dirname, '../..'));
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--check') && (result.conflicts.length || result.unknown.length)) process.exitCode = 1;
}
