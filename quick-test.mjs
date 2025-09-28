// Quick SimulationQA test
import { VERSATILMCPServer } from './dist/mcp-server.js';

console.log('Testing MCP Server SimulationQA integration...');

const server = new VERSATILMCPServer();
console.log('✅ MCP Server created with SimulationQA');

// Test if SimulationQA is accessible
if (server.simulationQA) {
    console.log('✅ SimulationQA agent accessible in MCP server');
} else {
    console.log('❌ SimulationQA agent not accessible');
}

console.log('Test complete.');