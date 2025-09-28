const fs = require('fs');

const files = [
  'src/agents/introspective/enhanced-introspective-agent.ts',
  'src/bmad/enhanced-bmad-coordinator.ts',
  'src/enhanced-server.ts',
  'src/mcp/archon-mcp.ts',
  'src/mcp/enhanced-mcp-tools.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Undo the wrapper
    content = content.replace(
      /await \(async \(\) => { const result = await vectorMemoryStore\.queryMemories\(arguments\[0\]\); return { documents: result }; }\)\(\)/g,
      'await vectorMemoryStore.queryMemories(arguments[0])'
    );
    fs.writeFileSync(file, content);
  }
});

console.log('✓ Undone wrapper changes');
