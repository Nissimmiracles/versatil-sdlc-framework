/**
 * Agent Handoff Contract System
 *
 * Ensures reliable agent-to-agent communication with validation,
 * memory snapshots, and state verification.
 *
 * Use Cases:
 * - Three-tier handoffs: Alex-BA → (Dana + Marcus + James)
 * - Sequential handoffs: Marcus → Maria-QA
 * - Complex workflows: Sarah-PM orchestrating multi-agent tasks
 *
 * Philosophy: "Make implicit expectations explicit through contracts"
 */

import { AgentId } from '../../memory/memory-tool-config.js';

/**
 * Contract version for backward compatibility
 */
export const CONTRACT_VERSION = '1.0.0';

/**
 * Handoff types supported
 */
export type HandoffType =
  | 'sequential'      // One agent → one agent (Marcus → Maria)
  | 'parallel'        // One agent → multiple agents (Alex → Dana+Marcus+James)
  | 'aggregation'     // Multiple agents → one agent (Dana+Marcus+James → Maria)
  | 'broadcast'       // One agent → all agents (Sarah → everyone)
  | 'conditional';    // Handoff based on conditions (if error, goto Maria)

/**
 * Priority levels for handoff urgency
 */
export type HandoffPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Handoff status for tracking
 */
export type HandoffStatus =
  | 'pending'         // Contract created, not yet sent
  | 'in_transit'      // Sent to receiving agent(s)
  | 'accepted'        // Receiving agent acknowledged
  | 'rejected'        // Receiving agent rejected (validation failed)
  | 'completed'       // Work finished by receiving agent
  | 'failed'          // Handoff failed (timeout, error, etc.)
  | 'cancelled';      // Handoff cancelled by sender

/**
 * Memory snapshot at handoff point
 */
export interface MemorySnapshot {
  /**
   * Agent that created the snapshot
   */
  agentId: AgentId;

  /**
   * Timestamp of snapshot creation
   */
  timestamp: Date;

  /**
   * Memory files included in snapshot
   * Key: relative path (e.g., "test-patterns.md")
   * Value: file content
   */
  memoryFiles: Record<string, string>;

  /**
   * Critical patterns to preserve
   * Extracted from memory files for quick reference
   */
  criticalPatterns: Array<{
    category: string;
    title: string;
    content: string;
  }>;

  /**
   * Context summary (high-level state)
   */
  contextSummary: string;

  /**
   * Token count in snapshot (for context management)
   */
  estimatedTokens: number;
}

/**
 * Work item to be performed by receiving agent
 */
export interface WorkItem {
  /**
   * Unique identifier for this work item
   */
  id: string;

  /**
   * Type of work (implementation, review, testing, etc.)
   */
  type: 'implementation' | 'review' | 'testing' | 'analysis' | 'documentation' | 'bugfix';

  /**
   * Description of work to be done
   */
  description: string;

  /**
   * Acceptance criteria (how to know it's done)
   */
  acceptanceCriteria: string[];

  /**
   * Files involved in this work
   */
  files?: string[];

  /**
   * Estimated effort (hours)
   */
  estimatedEffort?: number;

  /**
   * Priority of this work item
   */
  priority: HandoffPriority;

  /**
   * Dependencies (other work item IDs that must complete first)
   */
  dependencies?: string[];

  /**
   * Metadata specific to work type
   */
  metadata?: Record<string, any>;
}

/**
 * Expected output from receiving agent
 */
export interface ExpectedOutput {
  /**
   * What artifacts should be produced
   */
  artifacts: Array<{
    type: 'code' | 'tests' | 'documentation' | 'report' | 'data';
    description: string;
    required: boolean;
  }>;

  /**
   * Quality gates that must pass
   */
  qualityGates?: Array<{
    name: string;
    description: string;
    threshold: number | string;
  }>;

  /**
   * Expected completion time (hours)
   */
  expectedDuration?: number;

  /**
   * Success criteria
   */
  successCriteria: string[];
}

/**
 * Agent Handoff Contract
 *
 * Formal contract between sending and receiving agents
 */
export interface AgentHandoffContract {
  /**
   * Contract metadata
   */
  contractId: string;
  version: string;
  createdAt: Date;
  expiresAt?: Date;

  /**
   * Handoff participants
   */
  sender: {
    agentId: AgentId;
    sessionId?: string;
  };

  receivers: Array<{
    agentId: AgentId;
    sessionId?: string;
    role?: string; // e.g., "database", "api", "frontend"
  }>;

  /**
   * Handoff configuration
   */
  type: HandoffType;
  priority: HandoffPriority;
  status: HandoffStatus;

  /**
   * Work to be performed
   */
  workItems: WorkItem[];

  /**
   * Expected outputs
   */
  expectedOutput: ExpectedOutput;

  /**
   * Memory snapshot from sender
   */
  memorySnapshot: MemorySnapshot;

  /**
   * Context provided to receivers
   */
  context: {
    /**
     * Project context (tech stack, conventions, etc.)
     */
    project?: {
      name?: string;
      techStack?: string[];
      conventions?: string[];
    };

    /**
     * Feature context (what we're building)
     */
    feature?: {
      name: string;
      description: string;
      userStories?: string[];
    };

    /**
     * Technical context (API contracts, schemas, etc.)
     */
    technical?: {
      apiContract?: Record<string, any>;
      databaseSchema?: Record<string, any>;
      dependencies?: string[];
    };

    /**
     * Business context (why we're building this)
     */
    business?: {
      goals?: string[];
      constraints?: string[];
      stakeholders?: string[];
    };
  };

  /**
   * Communication preferences
   */
  communication?: {
    /**
     * How should receivers report progress?
     */
    progressReporting?: 'none' | 'milestones' | 'frequent';

    /**
     * How should receivers ask questions?
     */
    questionHandling?: 'block' | 'assume' | 'escalate';

    /**
     * Preferred update frequency (minutes)
     */
    updateFrequency?: number;
  };

  /**
   * Validation rules
   */
  validation?: {
    /**
     * Required fields that must be present
     */
    requiredFields?: string[];

    /**
     * Custom validation functions (serialized)
     */
    customValidators?: Array<{
      name: string;
      rule: string; // Serialized function
      errorMessage: string;
    }>;
  };

  /**
   * Actual results (filled by receiving agents)
   */
  results?: {
    /**
     * Agent that completed the work
     */
    completedBy?: AgentId;

    /**
     * Completion timestamp
     */
    completedAt?: Date;

    /**
     * Actual artifacts produced
     */
    artifacts?: Array<{
      type: string;
      path: string;
      description: string;
    }>;

    /**
     * Quality gate results
     */
    qualityResults?: Array<{
      gate: string;
      passed: boolean;
      actualValue: number | string;
      threshold: number | string;
    }>;

    /**
     * Actual effort spent (hours)
     */
    actualEffort?: number;

    /**
     * Issues encountered
     */
    issues?: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      resolution?: string;
    }>;

    /**
     * Notes from receiving agent
     */
    notes?: string;
  };

  /**
   * Metadata for tracking and analytics
   */
  metadata?: {
    /**
     * Tags for categorization
     */
    tags?: string[];

    /**
     * Custom metadata
     */
    custom?: Record<string, any>;
  };
}

/**
 * Three-tier handoff contract (Alex-BA → Dana + Marcus + James)
 *
 * Specialized contract for full-stack feature development
 */
export interface ThreeTierHandoffContract extends AgentHandoffContract {
  type: 'parallel';

  /**
   * API contract shared between all tiers
   */
  apiContract: {
    /**
     * Endpoints with request/response schemas
     */
    endpoints: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      path: string;
      description: string;
      requestSchema?: Record<string, any>;
      responseSchema?: Record<string, any>;
      authentication?: boolean;
    }>;

    /**
     * Shared types/models
     */
    sharedTypes?: Record<string, any>;
  };

  /**
   * Database schema for data tier
   */
  databaseSchema: {
    /**
     * Tables to create/modify
     */
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable?: boolean;
        unique?: boolean;
        default?: any;
      }>;
      indexes?: Array<{
        columns: string[];
        unique?: boolean;
      }>;
      foreignKeys?: Array<{
        column: string;
        references: string;
        onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
      }>;
    }>;

    /**
     * RLS policies for security
     */
    rlsPolicies?: Array<{
      table: string;
      operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
      using: string; // SQL condition
    }>;
  };

  /**
   * UI requirements for presentation tier
   */
  uiRequirements: {
    /**
     * Components to build
     */
    components: Array<{
      name: string;
      type: 'page' | 'component' | 'hook' | 'util';
      description: string;
      props?: Record<string, any>;
    }>;

    /**
     * Accessibility requirements (WCAG level)
     */
    accessibility: 'A' | 'AA' | 'AAA';

    /**
     * Responsive breakpoints
     */
    responsive?: string[];

    /**
     * Design system/theme
     */
    designSystem?: string;
  };

  /**
   * Integration checkpoints
   */
  integrationCheckpoints: Array<{
    name: string;
    description: string;
    participants: AgentId[];
    acceptanceCriteria: string[];
  }>;
}

/**
 * Contract builder for easier contract creation
 */
export class ContractBuilder {
  private contract: Partial<AgentHandoffContract>;

  constructor(sender: AgentId) {
    this.contract = {
      contractId: this.generateId(),
      version: CONTRACT_VERSION,
      createdAt: new Date(),
      sender: { agentId: sender },
      receivers: [],
      workItems: [],
      type: 'sequential',
      priority: 'normal',
      status: 'pending',
      expectedOutput: {
        artifacts: [],
        successCriteria: []
      },
      memorySnapshot: {
        agentId: sender,
        timestamp: new Date(),
        memoryFiles: {},
        criticalPatterns: [],
        contextSummary: '',
        estimatedTokens: 0
      }
    };
  }

  /**
   * Add a receiver to the contract
   */
  addReceiver(agentId: AgentId, role?: string): this {
    this.contract.receivers!.push({ agentId, role });
    return this;
  }

  /**
   * Set handoff type
   */
  setType(type: HandoffType): this {
    this.contract.type = type;
    return this;
  }

  /**
   * Set priority
   */
  setPriority(priority: HandoffPriority): this {
    this.contract.priority = priority;
    return this;
  }

  /**
   * Add work item
   */
  addWorkItem(workItem: WorkItem): this {
    this.contract.workItems!.push(workItem);
    return this;
  }

  /**
   * Set expected output
   */
  setExpectedOutput(output: ExpectedOutput): this {
    this.contract.expectedOutput = output;
    return this;
  }

  /**
   * Add memory snapshot
   */
  setMemorySnapshot(snapshot: MemorySnapshot): this {
    this.contract.memorySnapshot = snapshot;
    return this;
  }

  /**
   * Set context
   */
  setContext(context: AgentHandoffContract['context']): this {
    this.contract.context = context;
    return this;
  }

  /**
   * Set expiration time
   */
  setExpiration(hours: number): this {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    this.contract.expiresAt = expiresAt;
    return this;
  }

  /**
   * Build the final contract
   */
  build(): AgentHandoffContract {
    if (!this.contract.receivers || this.contract.receivers.length === 0) {
      throw new Error('Contract must have at least one receiver');
    }

    if (!this.contract.workItems || this.contract.workItems.length === 0) {
      throw new Error('Contract must have at least one work item');
    }

    return this.contract as AgentHandoffContract;
  }

  /**
   * Generate unique contract ID
   */
  private generateId(): string {
    return `contract-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
