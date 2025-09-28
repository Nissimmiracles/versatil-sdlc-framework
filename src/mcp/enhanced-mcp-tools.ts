/**
 * VERSATIL SDLC Framework v1.2.0
 * Enhanced MCP Tools for v1.2.0 Features
 */

import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { enhancedBMAD } from '../bmad/enhanced-bmad-coordinator';
import { vectorMemoryStore } from '../rag/vector-memory-store';
import { ArchonOrchestrator } from '../archon/archon-orchestrator';

export function registerEnhancedMCPTools(server: any, config: any) {
  
  // Enhanced v1.2.0 Tools
  const enhancedTools = [
    // RAG Memory Tools
    {
      name: 'versatil_memory_store',
      description: 'Store knowledge in RAG memory system',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Content to store in memory'
          },
          agentId: {
            type: 'string',
            description: 'Agent that learned this'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for categorization'
          }
        },
        required: ['content', 'agentId']
      }
    },
    
    {
      name: 'versatil_memory_query',
      description: 'Query RAG memory for relevant knowledge',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          agentId: {
            type: 'string',
            description: 'Filter by agent (optional)'
          },
          topK: {
            type: 'number',
            description: 'Number of results (default: 5)'
          }
        },
        required: ['query']
      }
    },

    // Archon Orchestration Tools
    {
      name: 'versatil_archon_goal',
      description: 'Set a development goal for Archon to achieve autonomously',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['feature', 'bug_fix', 'optimization', 'refactor', 'security'],
            description: 'Goal type'
          },
          description: {
            type: 'string',
            description: 'What to achieve'
          },
          priority: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
            description: 'Goal priority'
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraints or requirements'
          },
          deadline: {
            type: 'string',
            description: 'ISO date for deadline (optional)'
          }
        },
        required: ['type', 'description', 'priority']
      }
    },
    
    {
      name: 'versatil_archon_status',
      description: 'Get Archon orchestrator status and active goals',
      inputSchema: {
        type: 'object',
        properties: {
          includeHistory: {
            type: 'boolean',
            description: 'Include completed goals'
          }
        }
      }
    },

    // Enhanced BMAD Tools
    {
      name: 'versatil_bmad_autonomous',
      description: 'Execute BMAD workflow autonomously from requirements',
      inputSchema: {
        type: 'object',
        properties: {
          requirements: {
            type: 'string',
            description: 'Project requirements or user story'
          },
          autonomousMode: {
            type: 'boolean',
            description: 'Full autonomous execution',
            default: false
          },
          projectId: {
            type: 'string',
            description: 'Project identifier'
          }
        },
        required: ['requirements']
      }
    },

    // Learning & Adaptation Tools
    {
      name: 'versatil_learning_insights',
      description: 'Get learning insights and improvement metrics',
      inputSchema: {
        type: 'object',
        properties: {
          timeRange: {
            type: 'string',
            enum: ['today', 'week', 'month', 'all'],
            description: 'Time range for insights'
          },
          metricType: {
            type: 'string',
            enum: ['performance', 'patterns', 'errors', 'all'],
            description: 'Type of insights'
          }
        }
      }
    }
  ];

  // Register enhanced tools with existing tool list
  server.on('list_tools', async () => {
    const existingTools = await server.listTools();
    return {
      tools: [...existingTools.tools, ...enhancedTools]
    };
  });

  // Handle enhanced tool calls
  server.on('call_tool', async (request: any) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      // RAG Memory Operations
      case 'versatil_memory_store':
        return await handleMemoryStore(args);
      
      case 'versatil_memory_query':
        return await handleMemoryQuery(args);
      
      // Archon Operations
      case 'versatil_archon_goal':
        return await handleArchonGoal(args);
      
      case 'versatil_archon_status':
        return await handleArchonStatus(args);
      
      // Enhanced BMAD
      case 'versatil_bmad_autonomous':
        return await handleBMADAutonomous(args);
      
      // Learning Insights
      case 'versatil_learning_insights':
        return await handleLearningInsights(args);
      
      default:
        // Let base handler process
        return null;
    }
  });
}

// Handler implementations
async function handleMemoryStore(args: any) {
  const { content, agentId, tags = [] } = args;
  
  const memoryId = await vectorMemoryStore.storeMemory({
    content,
    metadata: {
      agentId,
      timestamp: Date.now(),
      tags,
      source: 'mcp-tool'
    }
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        memoryId,
        message: 'Knowledge stored successfully',
        agentId,
        tags
      }, null, 2)
    }]
  };
}

async function handleMemoryQuery(args: any) {
  const { query, agentId, topK = 5 } = args;
  
  const results = await vectorMemoryStore.queryMemories({
    query,
    agentId,
    topK
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        query,
        results: results.documents.map(doc => ({
          content: doc.content,
          relevance: doc.metadata.relevanceScore,
          agentId: doc.metadata.agentId,
          timestamp: new Date(doc.metadata.timestamp).toISOString()
        })),
        totalFound: results.documents.length
      }, null, 2)
    }]
  };
}

async function handleArchonGoal(args: any) {
  const goal = {
    id: `goal-${Date.now()}`,
    ...args,
    deadline: args.deadline ? new Date(args.deadline) : undefined
  };
  
  const archon = ArchonOrchestrator.getInstance();
  await archon.addGoal(goal);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        goalId: goal.id,
        status: 'Goal added to Archon queue',
        estimatedCompletion: archon.getEstimatedCompletion(goal.id)
      }, null, 2)
    }]
  };
}

async function handleArchonStatus(args: any) {
  const { includeHistory = false } = args;
  
  const archon = ArchonOrchestrator.getInstance();
  const state = archon.getState();
  
  const status = {
    activeGoals: state.currentGoals,
    executingSteps: state.executionQueue.length,
    completedSteps: state.completedSteps.length,
    performance: state.performance
  };
  
  if (includeHistory) {
    status.completedGoals = state.completedGoals || [];
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(status, null, 2)
    }]
  };
}

async function handleBMADAutonomous(args: any) {
  const { requirements, autonomousMode = false, projectId = `project-${Date.now()}` } = args;
  
  // Set autonomous mode
  enhancedBMAD.setAutonomousMode(autonomousMode);
  
  // Execute BMAD workflow
  await enhancedBMAD.executeBMADWorkflow(projectId, requirements);
  
  // Get results
  const context = await enhancedBMAD.getContext(projectId);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        projectId,
        status: 'Workflow executed',
        autonomousMode,
        phases: context.phase,
        agentsActivated: context.activeAgents,
        memoriesCreated: context.memory.length,
        decisions: context.decisions.length
      }, null, 2)
    }]
  };
}

async function handleLearningInsights(args: any) {
  const { timeRange = 'week', metricType = 'all' } = args;
  
  // Get insights from enhanced BMAD
  const metrics = await enhancedBMAD.getPerformanceMetrics();
  
  const insights = {
    timeRange,
    metricType,
    performance: {
      taskCompletionTime: metrics.averageTaskTime,
      improvementRate: metrics.learningRate,
      errorReduction: metrics.errorReductionRate
    },
    patterns: {
      learned: metrics.patternsLearned,
      applied: metrics.patternsApplied
    },
    predictions: {
      nextWeekProductivity: metrics.projectedProductivity,
      areasForImprovement: metrics.improvementAreas
    }
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(insights, null, 2)
    }]
  };
}

export const enhancedMCPTools = {
  registerEnhancedMCPTools,
  handleMemoryStore,
  handleMemoryQuery,
  handleArchonGoal,
  handleArchonStatus,
  handleBMADAutonomous,
  handleLearningInsights
};
