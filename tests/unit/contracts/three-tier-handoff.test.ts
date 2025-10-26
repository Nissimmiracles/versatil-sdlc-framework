/**
 * Unit Tests: Three-Tier Handoff Helper
 *
 * Coverage Target: 85%+
 *
 * Test Coverage:
 * - ThreeTierHandoffBuilder construction and configuration
 * - API endpoint, database table, UI component addition
 * - Contract building and validation
 * - Work item generation for Dana, Marcus, James
 * - Integration checkpoints creation
 * - RLS policy generation
 * - Effort estimation
 * - Error handling
 */

// Jest globals (describe, it, expect, beforeEach) are available globally
import {
  ThreeTierHandoffBuilder,
  createThreeTierHandoff,
  FeatureRequirements,
  APIEndpoint,
  DatabaseTable,
  UIComponent
} from '../../../src/agents/contracts/three-tier-handoff.js';
import {
  ThreeTierHandoffContract,
  MemorySnapshot
} from '../../../src/agents/contracts/agent-handoff-contract.js';

describe('ThreeTierHandoffBuilder', () => {
  let requirements;
  let builder;

  beforeEach(() => {
    requirements = {
      name: 'User Authentication',
      description: 'Implement secure user login and session management',
      userStories: [
        'As a user, I want to login with email and password',
        'As a user, I want to stay logged in across sessions'
      ],
      goals: ['Secure authentication', 'Good UX'],
      constraints: ['Must use JWT', 'Must be WCAG 2.1 AA compliant']
    };

    builder = new ThreeTierHandoffBuilder(requirements);
  });

  describe('Builder Construction', () => {
    it('should create builder with requirements', () => {
      expect(builder).toBeDefined();
      expect(builder).toBeInstanceOf(ThreeTierHandoffBuilder);
    });

    it('should initialize with empty endpoints, tables, components', async () => {
      const contract = await builder.build();

      // Should have default structure even with no additions
      expect(contract.apiContract).toBeDefined();
      expect(contract.databaseSchema).toBeDefined();
      expect(contract.uiRequirements).toBeDefined();
    });
  });

  describe('Adding API Endpoints', () => {
    it('should add API endpoint', async () => {
      const endpoint = {
        method: 'POST',
        path: '/api/auth/login',
        description: 'User login endpoint'
      };

      builder.addEndpoint(endpoint);
      const contract = await builder.build();

      expect(contract.apiContract.endpoints).toHaveLength(1);
      expect(contract.apiContract.endpoints[0].method).toBe('POST');
      expect(contract.apiContract.endpoints[0].path).toBe('/api/auth/login');
    });

    it('should add multiple endpoints', async () => {
      builder
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Logout'
        })
        .addEndpoint({
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current user'
        });

      const contract = await builder.build();

      expect(contract.apiContract.endpoints).toHaveLength(3);
    });

    it('should support endpoint with request/response schemas', async () => {
      builder.addEndpoint({
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login',
        requestSchema: {
          email: 'string',
          password: 'string'
        },
        responseSchema: {
          token: 'string',
          user: 'object'
        },
        authentication: false
      });

      const contract = await builder.build();

      const endpoint = contract.apiContract.endpoints[0];
      expect(endpoint.requestSchema).toEqual({
        email: 'string',
        password: 'string'
      });
      expect(endpoint.responseSchema).toEqual({
        token: 'string',
        user: 'object'
      });
      expect(endpoint.authentication).toBe(false);
    });

    it('should create work item for Marcus when endpoints added', async () => {
      builder.addEndpoint({
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login'
      });

      const contract = await builder.build();

      const marcusWork = contract.workItems.find(w =>
        w.description.includes('API endpoints')
      );

      expect(marcusWork).toBeDefined();
      expect(marcusWork?.estimatedEffort).toBe(2); // 2 hours per endpoint
      expect(marcusWork?.acceptanceCriteria).toContain('All endpoints implemented');
      expect(marcusWork?.acceptanceCriteria).toContain('OWASP security compliance');
    });
  });

  describe('Adding Database Tables', () => {
    it('should add database table', async () => {
      const table = {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'email', type: 'text', nullable: false, unique: true }
        ]
      };

      builder.addTable(table);
      const contract = await builder.build();

      expect(contract.databaseSchema.tables).toHaveLength(1);
      expect(contract.databaseSchema.tables[0].name).toBe('users');
      expect(contract.databaseSchema.tables[0].columns).toHaveLength(2);
    });

    it('should add multiple tables', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addTable({
          name: 'sessions',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        });

      const contract = await builder.build();

      expect(contract.databaseSchema.tables).toHaveLength(2);
    });

    it('should support table with indexes', async () => {
      builder.addTable({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'email', type: 'text', nullable: false }
        ],
        indexes: [
          { columns: ['email'], unique: true }
        ]
      });

      const contract = await builder.build();

      const table = contract.databaseSchema.tables[0];
      expect(table.indexes).toHaveLength(1);
      expect(table.indexes![0].unique).toBe(true);
    });

    it('should support table with foreign keys', async () => {
      builder.addTable({
        name: 'sessions',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'user_id', type: 'uuid', nullable: false }
        ],
        foreignKeys: [
          {
            column: 'user_id',
            references: 'users.id',
            onDelete: 'CASCADE'
          }
        ]
      });

      const contract = await builder.build();

      const table = contract.databaseSchema.tables[0];
      expect(table.foreignKeys).toHaveLength(1);
      expect(table.foreignKeys![0].onDelete).toBe('CASCADE');
    });

    it('should create work item for Dana when tables added', async () => {
      builder.addTable({
        name: 'users',
        columns: [{ name: 'id', type: 'uuid', nullable: false }]
      });

      const contract = await builder.build();

      const danaWork = contract.workItems.find(w =>
        w.description.includes('database schema')
      );

      expect(danaWork).toBeDefined();
      expect(danaWork?.estimatedEffort).toBe(1.5); // 1.5 hours per table
      expect(danaWork?.acceptanceCriteria).toContain('All tables created with correct schema');
      expect(danaWork?.acceptanceCriteria).toContain('RLS policies implemented');
    });

    it('should generate RLS policies for tables', async () => {
      builder.addTable({
        name: 'users',
        columns: [{ name: 'id', type: 'uuid', nullable: false }]
      });

      const contract = await builder.build();

      expect(contract.databaseSchema.rlsPolicies).toBeDefined();
      expect(contract.databaseSchema.rlsPolicies!.length).toBeGreaterThan(0);

      // Should have policies for SELECT, INSERT, UPDATE, DELETE
      const operations = contract.databaseSchema.rlsPolicies!.map(p => p.operation);
      expect(operations).toContain('SELECT');
      expect(operations).toContain('INSERT');
      expect(operations).toContain('UPDATE');
      expect(operations).toContain('DELETE');
    });

    it('should generate authentication check in RLS policies', async () => {
      builder.addTable({
        name: 'users',
        columns: [{ name: 'id', type: 'uuid', nullable: false }]
      });

      const contract = await builder.build();

      const selectPolicy = contract.databaseSchema.rlsPolicies!.find(
        p => p.table === 'users' && p.operation === 'SELECT'
      );

      expect(selectPolicy?.using).toBe('auth.uid() IS NOT NULL');
    });
  });

  describe('Adding UI Components', () => {
    it('should add UI component', async () => {
      const component = {
        name: 'LoginForm',
        type: 'component',
        description: 'User login form with email and password'
      };

      builder.addComponent(component);
      const contract = await builder.build();

      expect(contract.uiRequirements.components).toHaveLength(1);
      expect(contract.uiRequirements.components[0].name).toBe('LoginForm');
    });

    it('should add multiple components', async () => {
      builder
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        })
        .addComponent({
          name: 'useAuth',
          type: 'hook',
          description: 'Authentication hook'
        })
        .addComponent({
          name: 'LoginPage',
          type: 'page',
          description: 'Login page'
        });

      const contract = await builder.build();

      expect(contract.uiRequirements.components).toHaveLength(3);
    });

    it('should support component with props', async () => {
      builder.addComponent({
        name: 'LoginForm',
        type: 'component',
        description: 'Login form',
        props: {
          onSubmit: 'function',
          loading: 'boolean'
        }
      });

      const contract = await builder.build();

      const component = contract.uiRequirements.components[0];
      expect(component.props).toEqual({
        onSubmit: 'function',
        loading: 'boolean'
      });
    });

    it('should create work item for James when components added', async () => {
      builder.addComponent({
        name: 'LoginForm',
        type: 'component',
        description: 'Login form'
      });

      const contract = await builder.build();

      const jamesWork = contract.workItems.find(w =>
        w.description.includes('UI components')
      );

      expect(jamesWork).toBeDefined();
      expect(jamesWork?.estimatedEffort).toBe(1.5); // 1.5 hours per component
      expect(jamesWork?.acceptanceCriteria).toContain('All components implemented');
      expect(jamesWork?.acceptanceCriteria).toContain('WCAG 2.1 AA accessibility');
    });

    it('should set accessibility requirement to AA', async () => {
      const contract = await builder.build();

      expect(contract.uiRequirements.accessibility).toBe('AA');
    });

    it('should set responsive breakpoints', async () => {
      const contract = await builder.build();

      expect(contract.uiRequirements.responsive).toEqual([
        'mobile',
        'tablet',
        'desktop'
      ]);
    });
  });

  describe('Memory Snapshot', () => {
    it('should create minimal snapshot by default', async () => {
      const contract = await builder.build();

      expect(contract.memorySnapshot).toBeDefined();
      expect(contract.memorySnapshot.agentId).toBe('alex-ba');
      expect(contract.memorySnapshot.contextSummary).toContain('User Authentication');
    });

    it('should use provided memory snapshot', async () => {
      const customSnapshot = {
        agentId: 'alex-ba',
        timestamp: new Date(),
        memoryFiles: {
          'requirements/auth.md': 'Authentication requirements'
        },
        criticalPatterns: [
          {
            category: 'security',
            title: 'JWT pattern',
            content: 'Use httpOnly cookies'
          }
        ],
        contextSummary: 'Custom summary',
        estimatedTokens: 3000
      };

      builder.setMemorySnapshot(customSnapshot);
      const contract = await builder.build();

      expect(contract.memorySnapshot.estimatedTokens).toBe(3000);
      expect(contract.memorySnapshot.contextSummary).toBe('Custom summary');
      expect(contract.memorySnapshot.memoryFiles['requirements/auth.md']).toBe(
        'Authentication requirements'
      );
    });
  });

  describe('Work Item Dependencies', () => {
    it('should make Marcus depend on Dana when both have work', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        });

      const contract = await builder.build();

      const marcusWork = contract.workItems.find(w =>
        w.description.includes('API endpoints')
      );

      expect(marcusWork?.dependencies).toBeDefined();
      expect(marcusWork?.dependencies!.length).toBeGreaterThan(0);
    });

    it('should make James depend on Marcus when both have work', async () => {
      builder
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const contract = await builder.build();

      const jamesWork = contract.workItems.find(w =>
        w.description.includes('UI components')
      );

      expect(jamesWork?.dependencies).toBeDefined();
      expect(jamesWork?.dependencies!.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Checkpoints', () => {
    it('should create integration checkpoints', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const contract = await builder.build();

      expect(contract.integrationCheckpoints).toHaveLength(3);
    });

    it('should create Database → API checkpoint', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        });

      const contract = await builder.build();

      const checkpoint = contract.integrationCheckpoints.find(c =>
        c.name === 'Database → API Integration'
      );

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.participants).toContain('dana-database');
      expect(checkpoint?.participants).toContain('marcus-backend');
    });

    it('should create API → Frontend checkpoint', async () => {
      builder
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const contract = await builder.build();

      const checkpoint = contract.integrationCheckpoints.find(c =>
        c.name === 'API → Frontend Integration'
      );

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.participants).toContain('marcus-backend');
      expect(checkpoint?.participants).toContain('james-frontend');
    });

    it('should create End-to-End checkpoint', async () => {
      const contract = await builder.build();

      const checkpoint = contract.integrationCheckpoints.find(c =>
        c.name === 'End-to-End Validation'
      );

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.participants).toContain('dana-database');
      expect(checkpoint?.participants).toContain('marcus-backend');
      expect(checkpoint?.participants).toContain('james-frontend');
    });
  });

  describe('Contract Building', () => {
    it('should build complete three-tier contract', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const contract = await builder.build();

      expect(contract.type).toBe('parallel');
      expect(contract.receivers).toHaveLength(3);
      expect(contract.workItems.length).toBeGreaterThan(0);
      expect(contract.apiContract).toBeDefined();
      expect(contract.databaseSchema).toBeDefined();
      expect(contract.uiRequirements).toBeDefined();
      expect(contract.integrationCheckpoints).toBeDefined();
    });

    it('should set correct receivers for three-tier', async () => {
      const contract = await builder.build();

      const receiverIds = contract.receivers.map(r => r.agentId);
      expect(receiverIds).toContain('dana-database');
      expect(receiverIds).toContain('marcus-backend');
      expect(receiverIds).toContain('james-frontend');
    });

    it('should set receiver roles', async () => {
      const contract = await builder.build();

      const danaReceiver = contract.receivers.find(r => r.agentId === 'dana-database');
      const marcusReceiver = contract.receivers.find(r => r.agentId === 'marcus-backend');
      const jamesReceiver = contract.receivers.find(r => r.agentId === 'james-frontend');

      expect(danaReceiver?.role).toBe('database');
      expect(marcusReceiver?.role).toBe('api');
      expect(jamesReceiver?.role).toBe('frontend');
    });

    it('should set contract expiration to 24 hours', async () => {
      const contract = await builder.build();

      expect(contract.expiresAt).toBeDefined();

      const now = new Date();
      const expiresAt = new Date(contract.expiresAt!);
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeCloseTo(24, 0);
    });

    it('should include feature context', async () => {
      const contract = await builder.build();

      expect(contract.context.feature?.name).toBe('User Authentication');
      expect(contract.context.feature?.description).toBe(
        'Implement secure user login and session management'
      );
      expect(contract.context.feature?.userStories).toHaveLength(2);
    });

    it('should include business context', async () => {
      const contract = await builder.build();

      expect(contract.context.business?.goals).toEqual(['Secure authentication', 'Good UX']);
      expect(contract.context.business?.constraints).toEqual([
        'Must use JWT',
        'Must be WCAG 2.1 AA compliant'
      ]);
    });

    it('should include technical context', async () => {
      builder.addEndpoint({
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login'
      });

      const contract = await builder.build();

      expect(contract.context.technical?.apiContract).toBeDefined();
      expect(contract.context.technical?.databaseSchema).toBeDefined();
    });
  });

  describe('Build and Validate', () => {
    it('should build and validate contract', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const result = await builder.buildAndValidate();

      expect(result.contract).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.validation.valid).toBe(true);
    });

    it('should throw error if validation fails', async () => {
      // Don't add any components (will fail three-tier validation)
      await expect(builder.buildAndValidate()).rejects.toThrow('Contract validation failed');
    });
  });

  describe('Quick Helper Function', () => {
    it('should create three-tier handoff using helper', async () => {
      const contract = await createThreeTierHandoff(requirements, {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login'
          }
        ],
        tables: [
          {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid', nullable: false }]
          }
        ],
        components: [
          {
            name: 'LoginForm',
            type: 'component',
            description: 'Login form'
          }
        ]
      });

      expect(contract).toBeDefined();
      expect(contract.type).toBe('parallel');
      expect(contract.apiContract.endpoints).toHaveLength(1);
      expect(contract.databaseSchema.tables).toHaveLength(1);
      expect(contract.uiRequirements.components).toHaveLength(1);
    });

    it('should use provided memory snapshot in helper', async () => {
      const customSnapshot = {
        agentId: 'alex-ba',
        timestamp: new Date(),
        memoryFiles: {},
        criticalPatterns: [],
        contextSummary: 'Custom',
        estimatedTokens: 2000
      };

      const contract = await createThreeTierHandoff(requirements, {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login'
          }
        ],
        tables: [
          {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid', nullable: false }]
          }
        ],
        components: [
          {
            name: 'LoginForm',
            type: 'component',
            description: 'Login form'
          }
        ],
        memorySnapshot: customSnapshot
      });

      expect(contract.memorySnapshot.estimatedTokens).toBe(2000);
    });

    it('should throw on validation failure in helper', async () => {
      await expect(
        createThreeTierHandoff(requirements, {
          endpoints: [],
          tables: [],
          components: []
        })
      ).rejects.toThrow('Contract validation failed');
    });
  });

  describe('Effort Estimation', () => {
    it('should calculate total expected duration', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        });

      const contract = await builder.build();

      const totalEffort = contract.workItems.reduce(
        (sum, item) => sum + (item.estimatedEffort || 0),
        0
      );

      expect(contract.expectedOutput.expectedDuration).toBe(totalEffort);
      expect(totalEffort).toBe(5); // 1.5 (Dana) + 2 (Marcus) + 1.5 (James)
    });

    it('should scale effort with number of endpoints', async () => {
      builder
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login'
        })
        .addEndpoint({
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Logout'
        });

      const contract = await builder.build();

      const marcusWork = contract.workItems.find(w =>
        w.description.includes('API endpoints')
      );

      expect(marcusWork?.estimatedEffort).toBe(4); // 2 endpoints * 2 hours
    });

    it('should scale effort with number of tables', async () => {
      builder
        .addTable({
          name: 'users',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        })
        .addTable({
          name: 'sessions',
          columns: [{ name: 'id', type: 'uuid', nullable: false }]
        });

      const contract = await builder.build();

      const danaWork = contract.workItems.find(w =>
        w.description.includes('database schema')
      );

      expect(danaWork?.estimatedEffort).toBe(3); // 2 tables * 1.5 hours
    });

    it('should scale effort with number of components', async () => {
      builder
        .addComponent({
          name: 'LoginForm',
          type: 'component',
          description: 'Login form'
        })
        .addComponent({
          name: 'useAuth',
          type: 'hook',
          description: 'Auth hook'
        });

      const contract = await builder.build();

      const jamesWork = contract.workItems.find(w =>
        w.description.includes('UI components')
      );

      expect(jamesWork?.estimatedEffort).toBe(3); // 2 components * 1.5 hours
    });
  });
});
