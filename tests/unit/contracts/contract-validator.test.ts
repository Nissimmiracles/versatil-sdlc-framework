/**
 * Unit Tests: Contract Validator
 *
 * Coverage Target: 90%+ (critical path)
 *
 * Test Coverage:
 * - Schema validation (required fields, types)
 * - Business logic validation (work items, criteria)
 * - Memory snapshot validation
 * - Quality gates validation
 * - Three-tier contract validation
 * - Strict mode behavior
 * - Quality score calculation
 * - Error and warning generation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ContractValidator,
  validateContract,
  ValidationResult,
  ValidationOptions
} from '../../../src/agents/contracts/contract-validator.js';
import {
  AgentHandoffContract,
  ThreeTierHandoffContract,
  ContractBuilder,
  CONTRACT_VERSION
} from '../../../src/agents/contracts/agent-handoff-contract.js';

describe('ContractValidator', () => {
  let validator: ContractValidator;

  beforeEach(() => {
    validator = new ContractValidator();
  });

  describe('Schema Validation', () => {
    it('should validate a complete valid contract', async () => {
      const contract = createValidContract();
      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(90);
    });

    it('should reject contract without contractId', async () => {
      const contract = createValidContract();
      contract.contractId = '' as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'contractId',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject contract without version', async () => {
      const contract = createValidContract();
      contract.version = '' as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'version',
            severity: 'high'
          })
        ])
      );
    });

    it('should warn on version mismatch', async () => {
      const contract = createValidContract();
      contract.version = '0.9.0'; // Different from CONTRACT_VERSION

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'version',
            impact: 'medium'
          })
        ])
      );
    });

    it('should reject contract without sender', async () => {
      const contract = createValidContract();
      contract.sender = {} as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sender.agentId',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject contract without receivers', async () => {
      const contract = createValidContract();
      contract.receivers = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'receivers',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject contract without type', async () => {
      const contract = createValidContract();
      contract.type = undefined as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'type',
            severity: 'high'
          })
        ])
      );
    });

    it('should reject contract without work items', async () => {
      const contract = createValidContract();
      contract.workItems = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject contract without memory snapshot', async () => {
      const contract = createValidContract();
      contract.memorySnapshot = undefined as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot',
            severity: 'high'
          })
        ])
      );
    });
  });

  describe('Business Logic Validation', () => {
    it('should reject work item without id', async () => {
      const contract = createValidContract();
      contract.workItems[0].id = '' as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems[0].id',
            severity: 'high'
          })
        ])
      );
    });

    it('should reject work item without description', async () => {
      const contract = createValidContract();
      contract.workItems[0].description = '';

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems[0].description',
            severity: 'medium'
          })
        ])
      );
    });

    it('should warn on work item without acceptance criteria', async () => {
      const contract = createValidContract();
      contract.workItems[0].acceptanceCriteria = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems[0].acceptanceCriteria',
            impact: 'high'
          })
        ])
      );
    });

    it('should reject circular dependencies', async () => {
      const contract = createValidContract();
      contract.workItems[0].dependencies = [contract.workItems[0].id];

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems[0].dependencies',
            severity: 'medium'
          })
        ])
      );
    });

    it('should warn on missing expected output', async () => {
      const contract = createValidContract();
      contract.expectedOutput = undefined as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput',
            impact: 'high'
          })
        ])
      );
    });

    it('should warn on missing artifacts', async () => {
      const contract = createValidContract();
      contract.expectedOutput.artifacts = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput.artifacts',
            impact: 'medium'
          })
        ])
      );
    });

    it('should warn on missing success criteria', async () => {
      const contract = createValidContract();
      contract.expectedOutput.successCriteria = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput.successCriteria',
            impact: 'high'
          })
        ])
      );
    });

    it('should warn on sequential handoff with multiple receivers', async () => {
      const contract = createValidContract();
      contract.type = 'sequential';
      contract.receivers = [
        { agentId: 'marcus-backend' },
        { agentId: 'james-frontend' }
      ];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'type',
            impact: 'medium'
          })
        ])
      );
    });

    it('should warn on parallel handoff with single receiver', async () => {
      const contract = createValidContract();
      contract.type = 'parallel';
      contract.receivers = [{ agentId: 'marcus-backend' }];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'type',
            impact: 'low'
          })
        ])
      );
    });
  });

  describe('Memory Snapshot Validation', () => {
    it('should reject missing memory snapshot', async () => {
      const contract = createValidContract();
      contract.memorySnapshot = null as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject snapshot without agentId', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.agentId = '' as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.agentId',
            severity: 'high'
          })
        ])
      );
    });

    it('should reject snapshot without timestamp', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.timestamp = null as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.timestamp',
            severity: 'medium'
          })
        ])
      );
    });

    it('should warn on empty context summary', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.contextSummary = '';

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.contextSummary',
            impact: 'high'
          })
        ])
      );
    });

    it('should warn on empty memory files', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.memoryFiles = {};

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.memoryFiles',
            impact: 'medium'
          })
        ])
      );
    });

    it('should warn on empty critical patterns', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.criticalPatterns = [];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.criticalPatterns',
            impact: 'medium'
          })
        ])
      );
    });

    it('should warn on zero token estimate', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.estimatedTokens = 0;

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.estimatedTokens',
            impact: 'low'
          })
        ])
      );
    });

    it('should warn on large snapshot', async () => {
      const contract = createValidContract();
      contract.memorySnapshot.estimatedTokens = 60000;

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'memorySnapshot.estimatedTokens',
            impact: 'medium'
          })
        ])
      );
    });
  });

  describe('Quality Gates Validation', () => {
    it('should warn on missing quality gates', async () => {
      const contract = createValidContract();
      contract.expectedOutput.qualityGates = undefined;

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput.qualityGates',
            impact: 'high'
          })
        ])
      );
    });

    it('should reject quality gate without name', async () => {
      const contract = createValidContract();
      contract.expectedOutput.qualityGates = [
        { name: '', description: 'Test coverage', threshold: 80 }
      ];

      const result = await validator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput.qualityGates[0].name',
            severity: 'medium'
          })
        ])
      );
    });

    it('should warn on quality gate without threshold', async () => {
      const contract = createValidContract();
      contract.expectedOutput.qualityGates = [
        { name: 'Coverage', description: 'Test coverage', threshold: undefined as any }
      ];

      const result = await validator.validateBeforeSend(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expectedOutput.qualityGates[0].threshold',
            impact: 'high'
          })
        ])
      );
    });
  });

  describe('Three-Tier Contract Validation', () => {
    it('should validate complete three-tier contract', () => {
      const contract = createValidThreeTierContract();
      const result = validator.validateThreeTier(contract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject three-tier contract without API endpoints', () => {
      const contract = createValidThreeTierContract();
      contract.apiContract.endpoints = [];

      const result = validator.validateThreeTier(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'apiContract.endpoints',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject three-tier contract without database tables', () => {
      const contract = createValidThreeTierContract();
      contract.databaseSchema.tables = [];

      const result = validator.validateThreeTier(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'databaseSchema.tables',
            severity: 'critical'
          })
        ])
      );
    });

    it('should reject three-tier contract without UI components', () => {
      const contract = createValidThreeTierContract();
      contract.uiRequirements.components = [];

      const result = validator.validateThreeTier(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'uiRequirements.components',
            severity: 'critical'
          })
        ])
      );
    });

    it('should warn on missing required agents', () => {
      const contract = createValidThreeTierContract();
      contract.receivers = [
        { agentId: 'marcus-backend', role: 'api' },
        { agentId: 'james-frontend', role: 'frontend' }
        // Missing dana-database
      ];

      const result = validator.validateThreeTier(contract);

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'receivers',
            impact: 'high'
          })
        ])
      );
    });
  });

  describe('Validation After Receive', () => {
    it('should reject expired contract', async () => {
      const contract = createValidContract();
      contract.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      const result = await validator.validateAfterReceive(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expiresAt',
            severity: 'critical'
          })
        ])
      );
    });

    it('should accept non-expired contract', async () => {
      const contract = createValidContract();
      contract.expiresAt = new Date(Date.now() + 3600000); // Expires in 1 hour

      const result = await validator.validateAfterReceive(contract);

      expect(result.valid).toBe(true);
    });

    it('should accept contract without expiration', async () => {
      const contract = createValidContract();
      contract.expiresAt = undefined;

      const result = await validator.validateAfterReceive(contract);

      expect(result.valid).toBe(true);
    });
  });

  describe('Strict Mode', () => {
    it('should convert warnings to errors in strict mode', async () => {
      const strictValidator = new ContractValidator({ strictMode: true });
      const contract = createValidContract();
      contract.workItems[0].acceptanceCriteria = []; // This normally generates warning

      const result = await strictValidator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'workItems[0].acceptanceCriteria'
          })
        ])
      );
      expect(result.warnings).toHaveLength(0);
    });

    it('should enforce minimum quality score in strict mode', async () => {
      const strictValidator = new ContractValidator({
        strictMode: true,
        minQualityScore: 90
      });

      const contract = createValidContract();
      // Add multiple issues to lower score
      contract.workItems[0].acceptanceCriteria = [];
      contract.expectedOutput.artifacts = [];
      contract.memorySnapshot.memoryFiles = {};

      const result = await strictValidator.validateBeforeSend(contract);

      expect(result.valid).toBe(false);
      expect(result.score).toBeLessThan(90);
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate perfect score for valid contract', async () => {
      const contract = createValidContract();
      const result = await validator.validateBeforeSend(contract);

      expect(result.score).toBe(100);
    });

    it('should deduct points for errors', async () => {
      const contract = createValidContract();
      contract.contractId = '' as any; // Critical error (-15)
      contract.version = '' as any; // High error (-15)

      const result = await validator.validateBeforeSend(contract);

      expect(result.score).toBeLessThanOrEqual(70);
    });

    it('should deduct points for warnings', async () => {
      const contract = createValidContract();
      contract.workItems[0].acceptanceCriteria = []; // Warning (-5)
      contract.memorySnapshot.memoryFiles = {}; // Warning (-4)

      const result = await validator.validateBeforeSend(contract);

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThan(85);
    });

    it('should clamp score between 0 and 100', async () => {
      const contract = createValidContract();
      // Add many errors to push score below 0
      contract.contractId = '' as any;
      contract.version = '' as any;
      contract.sender = {} as any;
      contract.receivers = [];
      contract.type = undefined as any;
      contract.workItems = [];
      contract.memorySnapshot = null as any;

      const result = await validator.validateBeforeSend(contract);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Validation Options', () => {
    it('should skip schema validation when disabled', async () => {
      const customValidator = new ContractValidator({ validateSchema: false });
      const contract = createValidContract();
      contract.contractId = '' as any; // Would normally fail schema validation

      const result = await customValidator.validateBeforeSend(contract);

      // Should not have schema validation errors
      const schemaErrors = result.errors.filter(e => e.field === 'contractId');
      expect(schemaErrors).toHaveLength(0);
    });

    it('should skip business validation when disabled', async () => {
      const customValidator = new ContractValidator({ validateBusiness: false });
      const contract = createValidContract();
      contract.workItems[0].acceptanceCriteria = []; // Would normally generate warning

      const result = await customValidator.validateBeforeSend(contract);

      // Should not have business validation warnings
      const businessWarnings = result.warnings.filter(
        w => w.field === 'workItems[0].acceptanceCriteria'
      );
      expect(businessWarnings).toHaveLength(0);
    });

    it('should skip memory validation when disabled', async () => {
      const customValidator = new ContractValidator({ validateMemory: false });
      const contract = createValidContract();
      contract.memorySnapshot.agentId = '' as any; // Would normally fail

      const result = await customValidator.validateBeforeSend(contract);

      // Should not have memory validation errors
      const memoryErrors = result.errors.filter(e => e.field.startsWith('memorySnapshot'));
      expect(memoryErrors).toHaveLength(0);
    });

    it('should skip quality validation when disabled', async () => {
      const customValidator = new ContractValidator({ validateQuality: false });
      const contract = createValidContract();
      contract.expectedOutput.qualityGates = [
        { name: '', description: 'Test', threshold: 80 }
      ]; // Would normally fail

      const result = await customValidator.validateBeforeSend(contract);

      // Should not have quality validation errors
      const qualityErrors = result.errors.filter(e => e.field.startsWith('expectedOutput.qualityGates'));
      expect(qualityErrors).toHaveLength(0);
    });
  });

  describe('Quick Validation Helper', () => {
    it('should validate contract using helper function', async () => {
      const contract = createValidContract();
      const result = await validateContract(contract);

      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should accept options in helper function', async () => {
      const contract = createValidContract();
      contract.workItems[0].acceptanceCriteria = [];

      const result = await validateContract(contract, { strictMode: true });

      expect(result.valid).toBe(false);
    });
  });
});

// Helper functions

function createValidContract(): AgentHandoffContract {
  const builder = new ContractBuilder('alex-ba');

  builder
    .addReceiver('marcus-backend', 'api')
    .setType('sequential')
    .setPriority('normal')
    .addWorkItem({
      id: 'work-1',
      type: 'implementation',
      description: 'Implement user authentication API',
      acceptanceCriteria: [
        'POST /api/auth/login endpoint created',
        'JWT token generation implemented',
        'Password hashing with bcrypt'
      ],
      priority: 'high'
    })
    .setExpectedOutput({
      artifacts: [
        { type: 'code', description: 'API endpoints', required: true },
        { type: 'tests', description: 'Unit tests', required: true }
      ],
      qualityGates: [
        { name: 'Test Coverage', description: 'Minimum coverage', threshold: 80 }
      ],
      successCriteria: [
        'All endpoints working',
        'Tests passing',
        'Security scan clean'
      ]
    })
    .setMemorySnapshot({
      agentId: 'alex-ba',
      timestamp: new Date(),
      memoryFiles: {
        'requirements/auth.md': 'User authentication requirements'
      },
      criticalPatterns: [
        {
          category: 'security',
          title: 'JWT authentication pattern',
          content: 'Use httpOnly cookies for tokens'
        }
      ],
      contextSummary: 'Implementing user authentication system',
      estimatedTokens: 5000
    })
    .setContext({
      feature: {
        name: 'User Authentication',
        description: 'Secure user login and session management'
      }
    })
    .setExpiration(24);

  return builder.build();
}

function createValidThreeTierContract(): ThreeTierHandoffContract {
  const baseContract = createValidContract();

  return {
    ...baseContract,
    type: 'parallel',
    receivers: [
      { agentId: 'dana-database', role: 'database' },
      { agentId: 'marcus-backend', role: 'api' },
      { agentId: 'james-frontend', role: 'frontend' }
    ],
    apiContract: {
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'User login',
          authentication: false
        }
      ],
      sharedTypes: {}
    },
    databaseSchema: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid', nullable: false },
            { name: 'email', type: 'text', nullable: false, unique: true },
            { name: 'password_hash', type: 'text', nullable: false }
          ]
        }
      ],
      rlsPolicies: [
        {
          table: 'users',
          operation: 'SELECT',
          using: 'auth.uid() = id'
        }
      ]
    },
    uiRequirements: {
      components: [
        {
          name: 'LoginForm',
          type: 'component',
          description: 'User login form'
        }
      ],
      accessibility: 'AA',
      responsive: ['mobile', 'tablet', 'desktop']
    },
    integrationCheckpoints: [
      {
        name: 'Database → API Integration',
        description: 'Connect API to database',
        participants: ['dana-database', 'marcus-backend'],
        acceptanceCriteria: ['API can query database']
      }
    ]
  };
}
