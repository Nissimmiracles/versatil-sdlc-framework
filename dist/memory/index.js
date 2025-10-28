/**
 * VERSATIL Memory Tool - Main Export
 *
 * Central export point for all Memory Tool functionality
 */
// Main integration
export { memoryToolIntegration, MemoryToolIntegration, viewMemory, createMemory, replaceMemory, deleteMemory, renameMemory, insertMemory } from './memory-tool-integration.js';
// Operations
export { memoryToolOperations, MemoryToolOperations } from './memory-tool-operations.js';
// Handler (low-level)
export { memoryToolHandler, MemoryToolHandler } from './memory-tool-handler.js';
// Agent memory manager
export { agentMemoryManager, AgentMemoryManager } from './agent-memory-manager.js';
// Context editing
export { contextEditingManager, ContextEditingManager } from './context-editing-integration.js';
// Configuration
export { MEMORY_TOOL_CONFIG, AGENT_MEMORY_TEMPLATES, getAgentMemoryPath, getMemoryFilePath, getAllAgentIds } from './memory-tool-config.js';
// Statistics tracker
export { getGlobalContextTracker, ContextStatsTracker } from './context-stats-tracker.js';
// Statistics visualizer
export { ContextStatsVisualizer, createDashboard, createMarkdownReport } from './context-stats-visualizer.js';
// Default export (main integration)
export { memoryToolIntegration as default } from './memory-tool-integration.js';
//# sourceMappingURL=index.js.map