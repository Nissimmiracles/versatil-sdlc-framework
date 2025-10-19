/**
 * VERSATIL Memory Tool - Main Export
 *
 * Central export point for all Memory Tool functionality
 */

// Main integration
export {
  memoryToolIntegration,
  MemoryToolIntegration,
  viewMemory,
  createMemory,
  replaceMemory,
  deleteMemory,
  renameMemory,
  insertMemory
} from './memory-tool-integration.js';

// Operations
export {
  memoryToolOperations,
  MemoryToolOperations,
  type MemoryOperation,
  type ViewOperation,
  type CreateOperation,
  type StrReplaceOperation,
  type InsertOperation,
  type DeleteOperation,
  type RenameOperation,
  type MemoryOperationResult,
  type MemoryOperationType
} from './memory-tool-operations.js';

// Handler (low-level)
export {
  memoryToolHandler,
  MemoryToolHandler,
  type MemoryToolOperation,
  type MemoryToolResult,
  type MemoryStats
} from './memory-tool-handler.js';

// Agent memory manager
export {
  agentMemoryManager,
  AgentMemoryManager,
  type PatternMetadata,
  type AgentMemoryStats
} from './agent-memory-manager.js';

// Context editing
export {
  contextEditingManager,
  ContextEditingManager,
  type ContextClearEvent,
  type ContextStats
} from './context-editing-integration.js';

// Configuration
export {
  MEMORY_TOOL_CONFIG,
  AGENT_MEMORY_TEMPLATES,
  getAgentMemoryPath,
  getMemoryFilePath,
  getAllAgentIds,
  type AgentId,
  type MemoryToolConfig,
  type ContextManagementConfig,
  type MemoryTemplate
} from './memory-tool-config.js';

// Statistics tracker
export {
  getGlobalContextTracker,
  ContextStatsTracker,
  type ContextClearEvent as StatsClearEvent,
  type MemoryOperation as StatsMemoryOperation,
  type ContextStatistics,
  type SessionMetrics
} from './context-stats-tracker.js';

// Statistics visualizer
export {
  ContextStatsVisualizer,
  createDashboard,
  createMarkdownReport,
  type VisualizationConfig,
  type ChartData
} from './context-stats-visualizer.js';

// Default export (main integration)
export { memoryToolIntegration as default } from './memory-tool-integration.js';
