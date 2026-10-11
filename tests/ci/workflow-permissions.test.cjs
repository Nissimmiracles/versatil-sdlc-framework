const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const root = process.env.WORKFLOW_CONFIG_ROOT || path.resolve(__dirname, '../..');
const read = name => yaml.load(fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8'));
test('RAG contribution workflow and embedded comment script parse without executing', () => {
  const workflow = read('rag-contribution.yml');
  const step = workflow.jobs['contribute-patterns'].steps.find(step => step.uses === 'actions/github-script@v7');
  assert.doesNotThrow(() => new (require('node:vm').Script)(step.with.script));
  assert.deepEqual(Object.keys(workflow.on), ['push']);
});
test('MCP callers delegate only the read permissions required by the reusable job', () => {
  const required = read('mcp-health-check.yml').jobs['health-check'].permissions;
  assert.deepEqual(required, { contents: 'read', actions: 'read' });
  for (const file of ['ci.yml', 'quality-gates.yml']) {
    const workflow = read(file), caller = workflow.jobs['mcp-health'];
    assert.equal(caller.uses, './.github/workflows/mcp-health-check.yml');
    assert.deepEqual(caller.permissions, required, file);
    assert.equal(workflow.permissions, undefined, 'do not widen every job');
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (name !== 'mcp-health') assert.equal(job.permissions?.actions, undefined, name);
    }
  }
});
