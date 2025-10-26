/**
 * Three-Tier Handoff Helper
 *
 * Simplifies creating and managing three-tier architecture handoffs:
 * Alex-BA → (Dana-Database + Marcus-Backend + James-Frontend)
 *
 * This is the most common VERSATIL workflow for full-stack features.
 */

import {
  AgentHandoffContract,
  ThreeTierHandoffContract,
  WorkItem,
  MemorySnapshot,
  ContractBuilder
} from './agent-handoff-contract.js';
import { ContractValidator, validateContract } from './contract-validator.js';
import { getGlobalContractTracker } from './contract-tracker.js';

/**
 * Feature requirements for three-tier handoff
 */
export interface FeatureRequirements {
  /**
   * Feature name
   */
  name: string;

  /**
   * Feature description
   */
  description: string;

  /**
   * User stories
   */
  userStories: string[];

  /**
   * Business goals
   */
  goals?: string[];

  /**
   * Technical constraints
   */
  constraints?: string[];
}

/**
 * API endpoint definition
 */
export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  authentication?: boolean;
}

/**
 * Database table definition
 */
export interface DatabaseTable {
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
}

/**
 * UI component definition
 */
export interface UIComponent {
  name: string;
  type: 'page' | 'component' | 'hook' | 'util';
  description: string;
  props?: Record<string, any>;
}

/**
 * Three-tier handoff builder
 */
export class ThreeTierHandoffBuilder {
  private requirements: FeatureRequirements;
  private endpoints: APIEndpoint[] = [];
  private tables: DatabaseTable[] = [];
  private components: UIComponent[] = [];
  private memorySnapshot?: MemorySnapshot;

  constructor(requirements: FeatureRequirements) {
    this.requirements = requirements;
  }

  /**
   * Add API endpoint
   */
  addEndpoint(endpoint: APIEndpoint): this {
    this.endpoints.push(endpoint);
    return this;
  }

  /**
   * Add database table
   */
  addTable(table: DatabaseTable): this {
    this.tables.push(table);
    return this;
  }

  /**
   * Add UI component
   */
  addComponent(component: UIComponent): this {
    this.components.push(component);
    return this;
  }

  /**
   * Set memory snapshot
   */
  setMemorySnapshot(snapshot: MemorySnapshot): this {
    this.memorySnapshot = snapshot;
    return this;
  }

  /**
   * Build the three-tier handoff contract
   */
  async build(): Promise<ThreeTierHandoffContract> {
    // Create base contract using ContractBuilder
    const baseBuilder = new ContractBuilder('alex-ba');

    // Add receivers (Dana, Marcus, James)
    baseBuilder
      .addReceiver('dana-database', 'database')
      .addReceiver('marcus-backend', 'api')
      .addReceiver('james-frontend', 'frontend');

    // Set handoff type to parallel
    baseBuilder.setType('parallel');

    // Create work items for each tier
    const workItems: WorkItem[] = [];

    // Dana's work: Database schema
    if (this.tables.length > 0) {
      workItems.push({
        id: `work-dana-${Date.now()}`,
        type: 'implementation',
        description: `Implement database schema for ${this.requirements.name}`,
        acceptanceCriteria: [
          'All tables created with correct schema',
          'Indexes added for performance',
          'Foreign keys configured',
          'RLS policies implemented',
          'Migration scripts created'
        ],
        estimatedEffort: this.tables.length * 1.5, // 1.5 hours per table
        priority: 'high',
        metadata: {
          tables: this.tables.map(t => t.name)
        }
      });
    }

    // Marcus's work: API implementation
    if (this.endpoints.length > 0) {
      workItems.push({
        id: `work-marcus-${Date.now()}`,
        type: 'implementation',
        description: `Implement API endpoints for ${this.requirements.name}`,
        acceptanceCriteria: [
          'All endpoints implemented',
          'Request/response validation with Zod',
          'Authentication/authorization configured',
          'Error handling implemented',
          'OWASP security compliance',
          'Response time < 200ms',
          'Stress tests generated and passing'
        ],
        estimatedEffort: this.endpoints.length * 2, // 2 hours per endpoint
        priority: 'high',
        dependencies: this.tables.length > 0 ? [`work-dana-${Date.now()}`] : undefined,
        metadata: {
          endpoints: this.endpoints.map(e => `${e.method} ${e.path}`)
        }
      });
    }

    // James's work: UI components
    if (this.components.length > 0) {
      workItems.push({
        id: `work-james-${Date.now()}`,
        type: 'implementation',
        description: `Implement UI components for ${this.requirements.name}`,
        acceptanceCriteria: [
          'All components implemented',
          'Responsive design (mobile, tablet, desktop)',
          'WCAG 2.1 AA accessibility',
          'Component tests with React Testing Library',
          'Integration with API endpoints',
          'Error states handled',
          'Loading states implemented'
        ],
        estimatedEffort: this.components.length * 1.5, // 1.5 hours per component
        priority: 'normal',
        dependencies: this.endpoints.length > 0 ? [`work-marcus-${Date.now()}`] : undefined,
        metadata: {
          components: this.components.map(c => c.name)
        }
      });
    }

    // If no work items created, add a minimal planning work item
    if (workItems.length === 0) {
      workItems.push({
        id: `work-plan-${Date.now()}`,
        type: 'analysis',
        description: `Plan three-tier implementation for ${this.requirements.name}`,
        acceptanceCriteria: [
          'Requirements analyzed',
          'Architecture designed',
          'Technical approach defined'
        ],
        estimatedEffort: 1,
        priority: 'high'
      });
    }

    // Add work items to the base contract
    workItems.forEach(item => baseBuilder.addWorkItem(item));

    // Set expected output
    baseBuilder.setExpectedOutput({
      artifacts: [
        { type: 'code', description: 'Database migration scripts', required: true },
        { type: 'code', description: 'API endpoint implementations', required: true },
        { type: 'code', description: 'UI components', required: true },
        { type: 'tests', description: 'Database tests (RLS policies)', required: true },
        { type: 'tests', description: 'API tests (unit + stress)', required: true },
        { type: 'tests', description: 'Component tests', required: true },
        { type: 'documentation', description: 'API documentation', required: false }
      ],
      qualityGates: [
        { name: 'Test Coverage', description: 'Minimum test coverage', threshold: 80 },
        { name: 'API Response Time', description: 'Maximum API response time', threshold: '200ms' },
        { name: 'Accessibility Score', description: 'WCAG 2.1 AA compliance', threshold: 95 },
        { name: 'Security Scan', description: 'OWASP Top 10 compliance', threshold: 'pass' }
      ],
      expectedDuration: workItems.reduce((sum, item) => sum + (item.estimatedEffort || 0), 0),
      successCriteria: [
        'All three tiers implemented and integrated',
        'End-to-end feature works correctly',
        'All quality gates pass',
        'User stories fulfilled'
      ]
    });

    // Set memory snapshot
    if (this.memorySnapshot) {
      baseBuilder.setMemorySnapshot(this.memorySnapshot);
    } else {
      // Create minimal snapshot
      baseBuilder.setMemorySnapshot({
        agentId: 'alex-ba',
        timestamp: new Date(),
        memoryFiles: {},
        criticalPatterns: [],
        contextSummary: `Three-tier implementation for ${this.requirements.name}`,
        estimatedTokens: 0
      });
    }

    // Set context
    baseBuilder.setContext({
      feature: {
        name: this.requirements.name,
        description: this.requirements.description,
        userStories: this.requirements.userStories
      },
      business: {
        goals: this.requirements.goals,
        constraints: this.requirements.constraints
      },
      technical: {
        apiContract: {
          endpoints: this.endpoints
        },
        databaseSchema: {
          tables: this.tables
        }
      }
    });

    // Set expiration (24 hours)
    baseBuilder.setExpiration(24);

    // Build base contract
    const baseContract = baseBuilder.build();

    // Convert to three-tier contract
    const threeTierContract: ThreeTierHandoffContract = {
      ...baseContract,
      type: 'parallel',
      apiContract: {
        endpoints: this.endpoints,
        sharedTypes: {}
      },
      databaseSchema: {
        tables: this.tables,
        rlsPolicies: this.generateRLSPolicies(this.tables)
      },
      uiRequirements: {
        components: this.components,
        accessibility: 'AA',
        responsive: ['mobile', 'tablet', 'desktop']
      },
      integrationCheckpoints: [
        {
          name: 'Database → API Integration',
          description: 'Connect API to database with real queries',
          participants: ['dana-database', 'marcus-backend'],
          acceptanceCriteria: [
            'API can read from database',
            'API can write to database',
            'RLS policies enforced'
          ]
        },
        {
          name: 'API → Frontend Integration',
          description: 'Connect UI to API endpoints',
          participants: ['marcus-backend', 'james-frontend'],
          acceptanceCriteria: [
            'UI can call API endpoints',
            'Authentication flows work',
            'Error handling works end-to-end'
          ]
        },
        {
          name: 'End-to-End Validation',
          description: 'Full feature validation',
          participants: ['dana-database', 'marcus-backend', 'james-frontend'],
          acceptanceCriteria: [
            'Complete user flow works',
            'Data persists correctly',
            'UI reflects data changes',
            'All quality gates pass'
          ]
        }
      ]
    };

    return threeTierContract;
  }

  /**
   * Build, validate, and track the contract
   */
  async buildAndValidate(): Promise<{
    contract: ThreeTierHandoffContract;
    validation: any;
  }> {
    // Build contract
    const contract = await this.build();

    // Validate contract
    const validator = new ContractValidator({ strictMode: false });
    const validation = validator.validateThreeTier(contract);

    // Track contract creation
    const tracker = getGlobalContractTracker();
    await tracker.trackContractCreated(contract, validation);

    if (!validation.valid) {
      const errorMessages = validation.errors.map((e: any) => e.message).join(', ');
      throw new Error(`Contract validation failed: ${errorMessages}`);
    }

    return { contract, validation };
  }

  /**
   * Generate RLS policies for tables
   */
  private generateRLSPolicies(tables: DatabaseTable[]) {
    return tables.flatMap(table => [
      {
        table: table.name,
        operation: 'SELECT' as const,
        using: 'auth.uid() IS NOT NULL' // Basic: user must be authenticated
      },
      {
        table: table.name,
        operation: 'INSERT' as const,
        using: 'auth.uid() IS NOT NULL'
      },
      {
        table: table.name,
        operation: 'UPDATE' as const,
        using: 'auth.uid() IS NOT NULL'
      },
      {
        table: table.name,
        operation: 'DELETE' as const,
        using: 'auth.uid() IS NOT NULL'
      }
    ]);
  }
}

/**
 * Quick helper to create three-tier handoff
 */
export async function createThreeTierHandoff(
  requirements: FeatureRequirements,
  config: {
    endpoints: APIEndpoint[];
    tables: DatabaseTable[];
    components: UIComponent[];
    memorySnapshot?: MemorySnapshot;
  }
): Promise<ThreeTierHandoffContract> {
  const builder = new ThreeTierHandoffBuilder(requirements);

  config.endpoints.forEach(e => builder.addEndpoint(e));
  config.tables.forEach(t => builder.addTable(t));
  config.components.forEach(c => builder.addComponent(c));

  if (config.memorySnapshot) {
    builder.setMemorySnapshot(config.memorySnapshot);
  }

  const { contract, validation } = await builder.buildAndValidate();

  if (!validation.valid) {
    throw new Error(`Contract validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  return contract;
}
