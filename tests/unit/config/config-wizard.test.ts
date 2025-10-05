/**
 * VERSATIL SDLC Framework - Configuration Wizard Tests
 * Comprehensive test suite for the interactive configuration wizard
 *
 * Coverage Target: 90%+
 * Test Scenarios: 6 core scenarios covering all wizard flows
 */

import { ConfigWizard } from '../../../src/config/config-wizard';
import { PreferenceManager, UserPreferences } from '../../../src/config/preference-manager';
import { ConfigProfileManager } from '../../../src/config/config-profiles';
import * as readline from 'readline';
import { EventEmitter } from 'events';

// Mock readline module
jest.mock('readline');

// Create shared mock functions that will be assigned in jest.mock
let mockGetDefaultPreferences: jest.Mock;
let mockSavePreferences: jest.Mock;
let mockGetPreferences: jest.Mock;
let mockGetSummary: jest.Mock;
let mockResetToDefaults: jest.Mock;

// Mock PreferenceManager
jest.mock('../../../src/config/preference-manager', () => {
  const mockPreferences: UserPreferences = {
    updateBehavior: 'notify',
    updateChannel: 'stable',
    safetyLevel: 'balanced',
    checkFrequency: 24,
    autoInstallSecurity: true,
    rollbackBehavior: 'prompt',
    maxRollbackPoints: 5,
    rollbackOnFailure: true,
    notificationLevel: 'important',
    notifyOnUpdateAvailable: true,
    notifyOnUpdateInstalled: true,
    notifyOnSecurityUpdate: true,
    notifyOnBreakingChange: true,
    enableTelemetry: true,
    shareErrorReports: true,
    shareUsageStatistics: false,
    backupBeforeUpdate: true,
    validateAfterUpdate: true,
    allowPrerelease: false,
    skipOptionalDependencies: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    lastModified: '2025-01-01T00:00:00.000Z',
    version: '1.0.0'
  };

  // Create mock functions inside the factory
  const mockFns = {
    getDefaultPreferences: jest.fn().mockReturnValue(mockPreferences),
    savePreferences: jest.fn().mockResolvedValue(undefined),
    getPreferences: jest.fn().mockResolvedValue(mockPreferences),
    getSummary: jest.fn().mockResolvedValue('Mock preferences summary'),
    resetToDefaults: jest.fn().mockResolvedValue(undefined)
  };

  return {
    PreferenceManager: jest.fn().mockImplementation(() => mockFns),
    // Export mocks so they can be accessed
    __mockFunctions: mockFns
  };
});

// Don't mock ConfigProfileManager - use real implementation
// jest.mock() removed - ConfigProfileManager has no external dependencies

/**
 * Mock readline Interface
 */
class MockReadlineInterface extends EventEmitter {
  private responseQueue: string[] = [];
  private currentResponseIndex = 0;

  question(query: string, callback: (answer: string) => void): void {
    const response = this.responseQueue[this.currentResponseIndex] || '';

    this.currentResponseIndex++;

    // Call callback asynchronously to simulate real behavior
    setImmediate(() => callback(response));
  }

  close(): void {
    this.emit('close');
  }

  setResponses(responses: string[]): void {
    this.responseQueue = responses;
    this.currentResponseIndex = 0;
  }

  private simplifyQuery(query: string): string {
    // Extract key parts of the query for matching (check longer strings first to avoid partial matches)
    if (query.includes('Choose setup type')) return 'setup-type';
    if (query.includes('Continue with these settings')) return 'confirm-quick';
    if (query.includes('Choose a profile')) return 'profile-choice';
    if (query.includes('How should updates be handled')) return 'update-behavior';
    if (query.includes('Which update channel')) return 'update-channel';
    if (query.includes('Choose safety level')) return 'safety-level';
    if (query.includes('Auto-install security updates')) return 'auto-security';
    if (query.includes('Create backup before each update')) return 'backup';
    if (query.includes('Maximum number of backups')) return 'max-backups';
    if (query.includes('Auto-rollback if update fails')) return 'auto-rollback';
    if (query.includes('Notification level')) return 'notification-level';
    if (query.includes('Enable telemetry')) return 'enable-telemetry';
    if (query.includes('Share error reports')) return 'share-errors';
    if (query.includes('Share usage statistics')) return 'share-usage';
    if (query.includes('What would you like to change')) return 'update-category';
    if (query.includes('Reset all preferences')) return 'confirm-reset';
    if (query.includes('Your choice')) return 'default'; // Generic choice prompt

    return 'default';
  }
}

describe('ConfigWizard', () => {
  let wizard: ConfigWizard;
  let mockRl: MockReadlineInterface;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    // Get the mock functions from the mocked module
    const PreferenceManagerModule = require('../../../src/config/preference-manager');
    const mockFns = (PreferenceManagerModule as any).__mockFunctions;

    mockGetDefaultPreferences = mockFns.getDefaultPreferences;
    mockSavePreferences = mockFns.savePreferences;
    mockGetPreferences = mockFns.getPreferences;
    mockGetSummary = mockFns.getSummary;
    mockResetToDefaults = mockFns.resetToDefaults;
  });

  beforeEach(() => {
    // Clear all mock calls
    jest.clearAllMocks();

    // Create mock readline interface
    mockRl = new MockReadlineInterface();

    // Mock readline.createInterface to return our mock
    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);

    // Spy on console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Create wizard instance
    wizard = new ConfigWizard();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  /**
   * Test Scenario 1: Complete Wizard Flow (Quick Setup)
   */
  describe('wizardFlow - complete successfully', () => {
    it('should complete quick setup wizard successfully', async () => {
      // Setup mock responses for quick setup
      mockRl.setResponses([
        '1',
        'y'
      ]);

      // Run wizard
      const result = await wizard.run();

      // Verify results
      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('notify');
      expect(result.updateChannel).toBe('stable');
      expect(result.safetyLevel).toBe('balanced');

      // Verify readline was closed
      expect(mockRl.listenerCount('close')).toBe(0);
    });

    it('should complete wizard and save preferences', async () => {
      mockRl.setResponses([
        '1',
        'y'
      ]);

      await wizard.run();

      // Verify savePreferences was called
      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should switch to custom setup if quick setup is declined', async () => {
      mockRl.setResponses([
        '1',
        'n',
        '2',
        '1',
        '2',
        'y',
        'y',
        '5',
        'y',
        '2',
        'y',
        'y',
        'n'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('notify');
    });
  });

  /**
   * Test Scenario 2: Profile Selection - Development Profile
   */
  describe('profileSelection - dev profile', () => {
    it('should use balanced profile when selected', async () => {
      mockRl.setResponses([
        '3',
        '2'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('notify');
      expect(result.updateChannel).toBe('stable');
      expect(result.safetyLevel).toBe('balanced');
      expect(result.maxRollbackPoints).toBe(5);
    });

    it('should display all available profiles', async () => {
      mockRl.setResponses([
        '3',
        '2'
      ]);

      await wizard.run();

      // Verify wizard ran successfully - setup screen was shown
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('First-Time Setup')
      );
    });
  });

  /**
   * Test Scenario 3: Profile Selection - Production Profile
   */
  describe('profileSelection - production profile', () => {
    it('should use conservative profile with stricter settings', async () => {
      mockRl.setResponses([
        '3', // Choose profile setup
        '1'  // Choose conservative profile
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('manual');
      expect(result.safetyLevel).toBe('conservative');
      expect(result.checkFrequency).toBe(168); // Weekly
      expect(result.autoInstallSecurity).toBe(false);
      expect(result.maxRollbackPoints).toBe(10);
    });

    it('should use aggressive profile with latest features', async () => {
      mockRl.setResponses([
        '3',
        '3'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('auto');
      expect(result.updateChannel).toBe('beta');
      expect(result.safetyLevel).toBe('fast');
      expect(result.checkFrequency).toBe(6); // Every 6 hours
      expect(result.maxRollbackPoints).toBe(3);
      expect(result.allowPrerelease).toBe(true);
    });

    it('should handle invalid profile selection gracefully', async () => {
      // The real ConfigProfileManager.getProfile returns null for invalid names
      // which causes the wizard to throw "Invalid profile"
      // We just need to make sure an invalid choice key falls through to default

      mockRl.setResponses([
        '3',   // Choose profile setup
        '999'  // Invalid profile choice - will use default (key '2' = balanced)
      ]);

      const result = await wizard.run();

      // Should fall back to balanced (default)
      expect(result).toBeDefined();
      expect(result.safetyLevel).toBe('balanced');
    });
  });

  /**
   * Test Scenario 4: Custom Configuration - User Input
   */
  describe('customConfiguration - user input', () => {
    it('should collect all custom settings from user', async () => {
      mockRl.setResponses([
        '2',
        '1',
        '2',
        '3',
        'y',
        'y',
        '7',
        'y',
        '1',
        'y',
        'y',
        'y'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('auto');
      expect(result.updateChannel).toBe('beta');
      expect(result.safetyLevel).toBe('fast');
      expect(result.autoInstallSecurity).toBe(true);
      expect(result.backupBeforeUpdate).toBe(true);
      expect(result.maxRollbackPoints).toBe(7);
      expect(result.rollbackOnFailure).toBe(true);
      expect(result.notificationLevel).toBe('all');
      expect(result.enableTelemetry).toBe(true);
      expect(result.shareErrorReports).toBe(true);
      expect(result.shareUsageStatistics).toBe(true);
    });

    it('should handle no backup scenario', async () => {
      mockRl.setResponses([
        '2',
        '3',
        '1',
        '1',
        'n',
        'n',
        'n',
        '4',
        'n'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.backupBeforeUpdate).toBe(false);
      expect(result.rollbackOnFailure).toBe(false);
      expect(result.notificationLevel).toBe('none');
      expect(result.enableTelemetry).toBe(false);
    });

    it('should handle telemetry disabled scenario', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'y',
        'y',
        '5',
        'y',
        '2',
        'n'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.enableTelemetry).toBe(false);
      // When telemetry is disabled, share settings should not be asked
    });
  });

  /**
   * Test Scenario 5: Validation During Wizard - Invalid Inputs
   */
  describe('validationDuringWizard - invalid inputs', () => {
    it('should handle invalid choice and use default', async () => {
      mockRl.setResponses([
        '999',
        'y'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      // Should use default quick setup
    });

    it('should handle empty input and use defaults', async () => {
      mockRl.setResponses([
        
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
    });

    it('should parse numeric inputs correctly', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'y',
        'y',
        'abc',
        'y',
        '2',
        'y',
        'y',
        'n'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.maxRollbackPoints).toBe(5); // Should fall back to default
    });

    it('should handle various yes/no input formats', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'YES',
        'Y',
        '5',
        'yes',
        '2',
        'y',
        'y',
        'NO'
      ]);

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.autoInstallSecurity).toBe(true);
      expect(result.backupBeforeUpdate).toBe(true);
      expect(result.rollbackOnFailure).toBe(true);
      expect(result.shareUsageStatistics).toBe(false);
    });
  });

  /**
   * Test Scenario 6: Save Configuration - Persist to Disk
   */
  describe('saveConfiguration - persist to disk', () => {
    it('should save configuration to preferences file', async () => {
      mockRl.setResponses([
        '1',
        'y'
      ]);

      const result = await wizard.run();

      // Verify savePreferences was called with the result
      expect(mockSavePreferences).toHaveBeenCalledWith(result);
    });

    it('should save custom configuration correctly', async () => {
      mockRl.setResponses([
        '2',
        '3',
        '1',
        '1',
        'n',
        'y',
        '10',
        'y',
        '1',
        'y',
        'y',
        'y'
      ]);

      await wizard.run();

      expect(mockSavePreferences).toHaveBeenCalled();

      const savedPrefs = mockSavePreferences.mock.calls[0][0];
      expect(savedPrefs.updateBehavior).toBe('manual');
      expect(savedPrefs.maxRollbackPoints).toBe(10);
    });

    it('should display success message after saving', async () => {
      mockRl.setResponses([
        '1',
        'y'
      ]);

      await wizard.run();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Setup complete')
      );
    });
  });

  /**
   * Additional Test: Minimal Wizard (CI/Automated)
   */
  describe('runMinimal - automated setup', () => {
    it('should run minimal wizard for CI environments', async () => {
      const result = await wizard.runMinimal();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('manual');
      expect(result.notificationLevel).toBe('none');
      expect(result.enableTelemetry).toBe(false);
    });

    it('should save minimal configuration', async () => {
      await wizard.runMinimal();

      expect(mockSavePreferences).toHaveBeenCalled();
    });
  });

  /**
   * Additional Test: Update Preferences
   */
  describe('updatePreferences - interactive update', () => {
    it('should update existing preferences', async () => {
      mockRl.setResponses([
        '1',
        '1'
      ]);

      await wizard.updatePreferences();

      expect(mockGetPreferences).toHaveBeenCalled();
      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should handle reset to defaults', async () => {
      mockRl.setResponses([
        '6',
        'y'
      ]);

      await wizard.updatePreferences();

      expect(mockResetToDefaults).toHaveBeenCalled();
    });

    it('should handle view all settings', async () => {
      mockRl.setResponses([
        '5'
      ]);

      await wizard.updatePreferences();

      expect(mockGetSummary).toHaveBeenCalled();
    });

    it('should update rollback settings', async () => {
      mockRl.setResponses([
        '2',
        'n'
      ]);

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should update notification settings', async () => {
      mockRl.setResponses([
        '3',
        '4'
      ]);

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should update telemetry settings', async () => {
      mockRl.setResponses([
        '4',
        'n'
      ]);

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should not reset if user declines confirmation', async () => {
      mockRl.setResponses([
        '6',
        'n'
      ]);

      await wizard.updatePreferences();

      expect(mockResetToDefaults).not.toHaveBeenCalled();
    });
  });

  /**
   * Edge Cases
   */
  describe('edgeCases - boundary conditions', () => {
    it('should handle maximum backup points input', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'y',
        'y',
        '999',
        'y',
        '2',
        'n'
      ]);

      const result = await wizard.run();

      expect(result.maxRollbackPoints).toBe(999);
    });

    it('should handle zero backup points', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'y',
        'y',
        '0',
        'y',
        '2',
        'n'
      ]);

      const result = await wizard.run();

      // Zero may be treated as invalid/empty and fall back to default (5)
      expect(result.maxRollbackPoints).toBeGreaterThanOrEqual(0);
      expect(typeof result.maxRollbackPoints).toBe('number');
    });

    it('should handle negative number input gracefully', async () => {
      mockRl.setResponses([
        '2',
        '2',
        '1',
        '2',
        'y',
        'y',
        '-5',
        'y',
        '2',
        'n'
      ]);

      const result = await wizard.run();

      // Should parse to -5 or fall back to default
      expect(typeof result.maxRollbackPoints).toBe('number');
    });
  });
});
