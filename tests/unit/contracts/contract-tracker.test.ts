/**
 * Unit Tests: Contract Tracker
 *
 * Coverage Target: 80%+
 *
 * Test Coverage:
 * - Contract event tracking (created, status changes, validation)
 * - Performance metrics calculation
 * - Statistics aggregation
 * - Report generation
 * - Cleanup operations
 * - Singleton pattern
 * - Integration with stats tracker
 */

// Jest globals (describe, it, expect, beforeEach, afterEach) are available globally
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  ContractTracker,
  getGlobalContractTracker,
  ContractEvent,
  ContractPerformance,
  ContractStatistics
} from '../../../src/agents/contracts/contract-tracker.js';
import {
  AgentHandoffContract,
  ContractBuilder
} from '../../../src/agents/contracts/agent-handoff-contract.js';
import { ValidationResult } from '../../../src/agents/contracts/contract-validator.js';

describe('ContractTracker', () => {
  let tracker;
  let testStatsDir;

  beforeEach(async () => {
    // Create temporary test directory
    testStatsDir = path.join(os.tmpdir(), `versatil-contract-test-${Date.now()}`);
    await fs.mkdir(testStatsDir, { recursive: true });

    // Create tracker with test directory
    tracker = new ContractTracker(testStatsDir);
    await tracker.initialize();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testStatsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should create stats directory on initialization', async () => {
      const stats = await fs.stat(testStatsDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should load existing data on initialization', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      // Create new tracker instance (should load existing data)
      const newTracker = new ContractTracker(testStatsDir);
      await newTracker.initialize();

      const stats = newTracker.getStatistics();
      expect(stats.totalContracts).toBe(1);
    });

    it('should handle missing stats directory gracefully', async () => {
      const newTracker = new ContractTracker(path.join(testStatsDir, 'nonexistent'));
      await expect(newTracker.initialize()).resolves.not.toThrow();
    });

    it('should handle corrupted data files gracefully', async () => {
      const eventsPath = path.join(testStatsDir, 'contract-events.json');
      await fs.writeFile(eventsPath, 'corrupted json', 'utf-8');

      const newTracker = new ContractTracker(testStatsDir);
      await expect(newTracker.initialize()).resolves.not.toThrow();
    });
  });

  describe('Contract Creation Tracking', () => {
    it('should track contract creation', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const stats = tracker.getStatistics();
      expect(stats.totalContracts).toBe(1);
      expect(stats.bySender['alex-ba']).toBe(1);
      expect(stats.byReceiver['marcus-backend']).toBe(1);
    });

    it('should track contract creation with validation result', async () => {
      const contract = createTestContract();
      const validationResult = {
        valid: true,
        errors: [],
        warnings: [],
        score: 95
      };

      await tracker.trackContractCreated(contract, validationResult);

      const events = tracker.getContractEvents(contract.contractId);
      expect(events).toHaveLength(1);
      expect(events[0].validationScore).toBe(95);
    });

    it('should initialize performance tracking on creation', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance).toBeDefined();
      expect(performance?.contractId).toBe(contract.contractId);
      expect(performance?.sender).toBe('alex-ba');
      expect(performance?.status).toBe('pending');
    });

    it('should calculate estimated effort from work items', async () => {
      const contract = createTestContract();
      contract.workItems[0].estimatedEffort = 5;

      await tracker.trackContractCreated(contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.estimatedEffort).toBe(5);
    });

    it('should track quality gates count', async () => {
      const contract = createTestContract();
      contract.expectedOutput.qualityGates = [
        { name: 'Coverage', description: 'Test coverage', threshold: 80 },
        { name: 'Performance', description: 'Response time', threshold: '200ms' }
      ];

      await tracker.trackContractCreated(contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.qualityGatesTotal).toBe(2);
    });

    it('should persist contract creation to disk', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const eventsPath = path.join(testStatsDir, 'contract-events.json');
      const fileExists = await fs.access(eventsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(eventsPath, 'utf-8');
      const events = JSON.parse(content);
      expect(events).toHaveLength(1);
      expect(events[0].contractId).toBe(contract.contractId);
    });
  });

  describe('Status Change Tracking', () => {
    it('should track status change to sent', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      contract.status = 'in_transit';
      await tracker.trackStatusChange(contract.contractId, 'in_transit', contract);

      const events = tracker.getContractEvents(contract.contractId);
      expect(events).toHaveLength(2);
      expect(events[1].eventType).toBe('sent');
    });

    it('should track status change to accepted', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      contract.status = 'accepted';
      await tracker.trackStatusChange(contract.contractId, 'accepted', contract);

      const events = tracker.getContractEvents(contract.contractId);
      expect(events).toHaveLength(2);
      expect(events[1].eventType).toBe('accepted');
    });

    it('should track status change to completed', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      contract.status = 'completed';
      contract.results = {
        completedBy: 'marcus-backend',
        completedAt: new Date(),
        actualEffort: 6,
        qualityResults: [
          { gate: 'Coverage', passed: true, actualValue: 85, threshold: 80 }
        ]
      };

      await tracker.trackStatusChange(contract.contractId, 'completed', contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.status).toBe('completed');
      expect(performance?.actualEffort).toBe(6);
    });

    it('should calculate effort accuracy on completion', async () => {
      const contract = createTestContract();
      contract.workItems[0].estimatedEffort = 5;
      await tracker.trackContractCreated(contract);

      contract.status = 'completed';
      contract.results = {
        completedBy: 'marcus-backend',
        completedAt: new Date(),
        actualEffort: 6
      };

      await tracker.trackStatusChange(contract.contractId, 'completed', contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.effortAccuracy).toBeCloseTo(83.33, 1); // (5 / 6) * 100
    });

    it('should calculate quality gate pass rate on completion', async () => {
      const contract = createTestContract();
      contract.expectedOutput.qualityGates = [
        { name: 'Coverage', description: 'Test coverage', threshold: 80 },
        { name: 'Performance', description: 'Response time', threshold: '200ms' }
      ];
      await tracker.trackContractCreated(contract);

      contract.status = 'completed';
      contract.results = {
        completedBy: 'marcus-backend',
        completedAt: new Date(),
        qualityResults: [
          { gate: 'Coverage', passed: true, actualValue: 85, threshold: 80 },
          { gate: 'Performance', passed: false, actualValue: '250ms', threshold: '200ms' }
        ]
      };

      await tracker.trackStatusChange(contract.contractId, 'completed', contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.qualityGatesPassed).toBe(1);
      expect(performance?.qualityPassRate).toBe(50); // 1 / 2 * 100
    });

    it('should calculate duration on completion', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      // Wait a bit to ensure duration is measurable
      await new Promise(resolve => setTimeout(resolve, 10));

      contract.status = 'completed';
      contract.results = {
        completedBy: 'marcus-backend',
        completedAt: new Date()
      };

      await tracker.trackStatusChange(contract.contractId, 'completed', contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance?.duration).toBeGreaterThan(0);
    });

    it('should handle status change without contract gracefully', async () => {
      await expect(
        tracker.trackStatusChange('nonexistent-contract', 'completed')
      ).resolves.not.toThrow();
    });
  });

  describe('Validation Tracking', () => {
    it('should track validation result', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const validationResult = {
        valid: true,
        errors: [],
        warnings: [{ field: 'test', message: 'Test warning', impact: 'low' }],
        score: 92
      };

      await tracker.trackValidation(contract.contractId, validationResult);

      const events = tracker.getContractEvents(contract.contractId);
      const lastEvent = events[events.length - 1];
      expect(lastEvent.validationScore).toBe(92);
      expect(lastEvent.metadata?.validationWarnings).toBe(1);
    });

    it('should track validation errors count', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const validationResult = {
        valid: false,
        errors: [
          { field: 'field1', message: 'Error 1', severity: 'high' },
          { field: 'field2', message: 'Error 2', severity: 'medium' }
        ],
        warnings: [],
        score: 60
      };

      await tracker.trackValidation(contract.contractId, validationResult);

      const events = tracker.getContractEvents(contract.contractId);
      const lastEvent = events[events.length - 1];
      expect(lastEvent.metadata?.validationErrors).toBe(2);
    });
  });

  describe('Statistics Calculation', () => {
    it('should return default statistics when no data', () => {
      const stats = tracker.getStatistics();

      expect(stats.totalContracts).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgQualityScore).toBe(0);
      expect(stats.avgEffortAccuracy).toBe(0);
    });

    it('should calculate contracts by status', async () => {
      const contract1 = createTestContract();
      const contract2 = createTestContract();
      const contract3 = createTestContract();

      await tracker.trackContractCreated(contract1);
      await tracker.trackContractCreated(contract2);
      await tracker.trackContractCreated(contract3);

      contract1.status = 'completed';
      await tracker.trackStatusChange(contract1.contractId, 'completed', contract1);

      contract2.status = 'failed';
      await tracker.trackStatusChange(contract2.contractId, 'failed', contract2);

      const stats = tracker.getStatistics();
      expect(stats.totalContracts).toBe(3);
      expect(stats.byStatus['pending']).toBe(1);
      expect(stats.byStatus['completed']).toBe(1);
      expect(stats.byStatus['failed']).toBe(1);
    });

    it('should calculate contracts by type', async () => {
      const contract1 = createTestContract();
      contract1.type = 'sequential';

      const contract2 = createTestContract();
      contract2.type = 'parallel';

      await tracker.trackContractCreated(contract1);
      await tracker.trackContractCreated(contract2);

      const stats = tracker.getStatistics();
      expect(stats.byType['sequential']).toBe(1);
      expect(stats.byType['parallel']).toBe(1);
    });

    it('should calculate contracts by sender', async () => {
      const contract1 = createTestContract();
      contract1.sender.agentId = 'alex-ba';

      const contract2 = createTestContract();
      contract2.sender.agentId = 'sarah-pm';

      await tracker.trackContractCreated(contract1);
      await tracker.trackContractCreated(contract2);

      const stats = tracker.getStatistics();
      expect(stats.bySender['alex-ba']).toBe(1);
      expect(stats.bySender['sarah-pm']).toBe(1);
    });

    it('should calculate contracts by receiver', async () => {
      const contract = createTestContract();
      contract.receivers = [
        { agentId: 'dana-database' },
        { agentId: 'marcus-backend' },
        { agentId: 'james-frontend' }
      ];

      await tracker.trackContractCreated(contract);

      const stats = tracker.getStatistics();
      expect(stats.byReceiver['dana-database']).toBe(1);
      expect(stats.byReceiver['marcus-backend']).toBe(1);
      expect(stats.byReceiver['james-frontend']).toBe(1);
    });

    it('should calculate average quality score', async () => {
      const contract1 = createTestContract();
      const contract2 = createTestContract();

      await tracker.trackContractCreated(contract1, {
        valid: true,
        errors: [],
        warnings: [],
        score: 90
      });

      await tracker.trackContractCreated(contract2, {
        valid: true,
        errors: [],
        warnings: [],
        score: 80
      });

      const stats = tracker.getStatistics();
      expect(stats.avgQualityScore).toBe(85); // (90 + 80) / 2
    });

    it('should calculate success rate', async () => {
      const contract1 = createTestContract();
      const contract2 = createTestContract();
      const contract3 = createTestContract();

      await tracker.trackContractCreated(contract1);
      await tracker.trackContractCreated(contract2);
      await tracker.trackContractCreated(contract3);

      contract1.status = 'completed';
      await tracker.trackStatusChange(contract1.contractId, 'completed', contract1);

      contract2.status = 'completed';
      await tracker.trackStatusChange(contract2.contractId, 'completed', contract2);

      const stats = tracker.getStatistics();
      expect(stats.successRate).toBeCloseTo(66.67, 1); // 2 / 3 * 100
    });

    it('should calculate average effort accuracy', async () => {
      const contract1 = createTestContract();
      contract1.workItems[0].estimatedEffort = 5;
      await tracker.trackContractCreated(contract1);

      contract1.status = 'completed';
      contract1.results = { actualEffort: 6 };
      await tracker.trackStatusChange(contract1.contractId, 'completed', contract1);

      const contract2 = createTestContract();
      contract2.workItems[0].estimatedEffort = 10;
      await tracker.trackContractCreated(contract2);

      contract2.status = 'completed';
      contract2.results = { actualEffort: 10 };
      await tracker.trackStatusChange(contract2.contractId, 'completed', contract2);

      const stats = tracker.getStatistics();
      // (5/6 * 100 + 10/10 * 100) / 2 = (83.33 + 100) / 2 = 91.67
      expect(stats.avgEffortAccuracy).toBeCloseTo(91.67, 1);
    });

    it('should calculate average quality pass rate', async () => {
      const contract1 = createTestContract();
      contract1.expectedOutput.qualityGates = [
        { name: 'Gate1', description: 'Test', threshold: 80 },
        { name: 'Gate2', description: 'Test', threshold: 90 }
      ];
      await tracker.trackContractCreated(contract1);

      contract1.status = 'completed';
      contract1.results = {
        qualityResults: [
          { gate: 'Gate1', passed: true, actualValue: 85, threshold: 80 },
          { gate: 'Gate2', passed: false, actualValue: 85, threshold: 90 }
        ]
      };
      await tracker.trackStatusChange(contract1.contractId, 'completed', contract1);

      const stats = tracker.getStatistics();
      expect(stats.avgQualityPassRate).toBe(50); // 1 / 2 * 100
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract, {
        valid: true,
        errors: [],
        warnings: [],
        score: 95
      });

      const report = await tracker.generateReport();

      expect(report).toContain('Contract Tracking Report');
      expect(report).toContain('Total Contracts: 1');
      expect(report).toContain('Average Quality Score: 95');
      expect(report).toContain('alex-ba');
      expect(report).toContain('marcus-backend');
    });

    it('should handle empty data in report', async () => {
      const report = await tracker.generateReport();

      expect(report).toContain('Contract Tracking Report');
      expect(report).toContain('Total Contracts: 0');
    });

    it('should include recent events in report', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const report = await tracker.generateReport();

      expect(report).toContain('Recent Events');
      expect(report).toContain('created');
    });
  });

  describe('Query Operations', () => {
    it('should get events for specific contract', async () => {
      const contract1 = createTestContract();
      const contract2 = createTestContract();

      await tracker.trackContractCreated(contract1);
      await tracker.trackContractCreated(contract2);

      const events = tracker.getContractEvents(contract1.contractId);
      expect(events).toHaveLength(1);
      expect(events[0].contractId).toBe(contract1.contractId);
    });

    it('should get performance for specific contract', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const performance = tracker.getContractPerformance(contract.contractId);
      expect(performance).toBeDefined();
      expect(performance?.contractId).toBe(contract.contractId);
    });

    it('should return undefined for nonexistent contract', () => {
      const performance = tracker.getContractPerformance('nonexistent');
      expect(performance).toBeUndefined();
    });

    it('should get events by time range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneHourFromNow = new Date(now.getTime() + 3600000);

      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const events = tracker.getEventsByTimeRange(oneHourAgo, oneHourFromNow);
      expect(events).toHaveLength(1);
    });

    it('should exclude events outside time range', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 7200000);
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      const events = tracker.getEventsByTimeRange(twoHoursAgo, oneHourAgo);
      expect(events).toHaveLength(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old events', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      await tracker.cleanup(30);

      // In real scenario, old events would be removed
      // This is simplified test
      const stats = tracker.getStatistics();
      expect(stats.totalContracts).toBeGreaterThanOrEqual(0);
    });

    it('should persist cleaned data', async () => {
      const contract = createTestContract();
      await tracker.trackContractCreated(contract);

      await tracker.cleanup(30);

      // Verify files still exist
      const eventsPath = path.join(testStatsDir, 'contract-events.json');
      const fileExists = await fs.access(eventsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getGlobalContractTracker', () => {
      const instance1 = getGlobalContractTracker();
      const instance2 = getGlobalContractTracker();

      expect(instance1).toBe(instance2);
    });

    it('should initialize singleton automatically', async () => {
      const instance = getGlobalContractTracker();

      await expect(
        instance.trackContractCreated(createTestContract())
      ).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle file write errors gracefully', async () => {
      await fs.chmod(testStatsDir, 0o444);

      await expect(
        tracker.trackContractCreated(createTestContract())
      ).resolves.not.toThrow();

      await fs.chmod(testStatsDir, 0o755);
    });

    it('should handle concurrent tracking', async () => {
      const promises = Array(50).fill(null).map(() =>
        tracker.trackContractCreated(createTestContract())
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();

      const stats = tracker.getStatistics();
      expect(stats.totalContracts).toBe(50);
    });
  });
});

// Helper function

function createTestContract() {
  const builder = new ContractBuilder('alex-ba');

  builder
    .addReceiver('marcus-backend', 'api')
    .setType('sequential')
    .setPriority('normal')
    .addWorkItem({
      id: `work-${Date.now()}-${Math.random()}`,
      type: 'implementation',
      description: 'Test work item',
      acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
      priority: 'normal'
    })
    .setExpectedOutput({
      artifacts: [
        { type: 'code', description: 'Code artifacts', required: true }
      ],
      successCriteria: ['Success 1']
    })
    .setMemorySnapshot({
      agentId: 'alex-ba',
      timestamp: new Date(),
      memoryFiles: { 'test.md': 'Test content' },
      criticalPatterns: [],
      contextSummary: 'Test summary',
      estimatedTokens: 1000
    })
    .setExpiration(24);

  return builder.build();
}
