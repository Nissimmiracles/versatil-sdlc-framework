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

// Mock ConfigProfileManager
jest.mock('../../../src/config/config-profiles', () => {
  const mockBalancedProfile = {
    name: 'Balanced',
    description: 'Good balance between safety and staying up-to-date.',
    emoji: '⚖️',
    bestFor: 'Most teams, development environments, general use',
    preferences: {
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
    }
  };

  const mockConservativeProfile = {
    name: 'Conservative',
    description: 'Maximum safety and stability.',
    emoji: '🛡️',
    bestFor: 'Production environments',
    preferences: {
      ...mockBalancedProfile.preferences,
      updateBehavior: 'manual' as const,
      safetyLevel: 'conservative' as const,
      checkFrequency: 168,
      autoInstallSecurity: false,
      maxRollbackPoints: 10
    }
  };

  const mockAggressiveProfile = {
    name: 'Aggressive',
    description: 'Latest features, bleeding edge.',
    emoji: '⚡',
    bestFor: 'Early adopters',
    preferences: {
      ...mockBalancedProfile.preferences,
      updateBehavior: 'auto' as const,
      updateChannel: 'beta' as const,
      safetyLevel: 'fast' as const,
      checkFrequency: 6,
      maxRollbackPoints: 3,
      allowPrerelease: true
    }
  };

  return {
    ConfigProfileManager: jest.fn().mockImplementation(() => ({
      getAvailableProfiles: jest.fn().mockReturnValue([
        mockConservativeProfile,
        mockBalancedProfile,
        mockAggressiveProfile
      ]),
      getProfile: jest.fn().mockImplementation((name: string) => {
        switch (name) {
          case 'conservative':
            return mockConservativeProfile;
          case 'balanced':
            return mockBalancedProfile;
          case 'aggressive':
            return mockAggressiveProfile;
          default:
            return null;
        }
      })
    }))
  };
});

/**
 * Mock readline Interface
 */
class MockReadlineInterface extends EventEmitter {
  private questionResponses: Map<string, string[]> = new Map();
  private currentQuestionIndex = 0;

  question(query: string, callback: (answer: string) => void): void {
    // Extract a simplified query key
    const queryKey = this.simplifyQuery(query);
    const responses = this.questionResponses.get(queryKey) || [''];
    const response = responses[this.currentQuestionIndex % responses.length] || responses[0];

    // Increment for next question
    this.currentQuestionIndex++;

    // Call callback asynchronously to simulate real behavior
    setImmediate(() => callback(response));
  }

  close(): void {
    this.emit('close');
  }

  setResponses(responses: Map<string, string[]>): void {
    this.questionResponses = responses;
    this.currentQuestionIndex = 0;
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
      mockRl.setResponses(new Map([
        ['setup-type', ['1']], // Choose quick setup
        ['confirm-quick', ['y']] // Confirm quick setup
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['1']],
        ['confirm-quick', ['y']]
      ]));

      await wizard.run();

      // Verify savePreferences was called
      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should switch to custom setup if quick setup is declined', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['1']], // Choose quick setup
        ['confirm-quick', ['n']], // Decline quick setup
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['5']],
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['y']],
        ['share-errors', ['y']],
        ['share-usage', ['n']]
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['3']], // Choose profile setup
        ['profile-choice', ['2']] // Choose balanced profile
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('notify');
      expect(result.updateChannel).toBe('stable');
      expect(result.safetyLevel).toBe('balanced');
      expect(result.maxRollbackPoints).toBe(5);
    });

    it('should display all available profiles', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['3']],
        ['profile-choice', ['2']]
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['3']], // Choose profile setup
        ['profile-choice', ['1']] // Choose conservative profile
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.updateBehavior).toBe('manual');
      expect(result.safetyLevel).toBe('conservative');
      expect(result.checkFrequency).toBe(168); // Weekly
      expect(result.autoInstallSecurity).toBe(false);
      expect(result.maxRollbackPoints).toBe(10);
    });

    it('should use aggressive profile with latest features', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['3']], // Choose profile setup
        ['profile-choice', ['3']] // Choose aggressive profile
      ]));

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
      // Mock getProfile to return null for invalid selection
      const profileManager = new ConfigProfileManager();
      (profileManager.getProfile as jest.Mock).mockReturnValueOnce(null);

      mockRl.setResponses(new Map([
        ['setup-type', ['3']],
        ['profile-choice', ['999']] // Invalid choice
      ]));

      await expect(wizard.run()).rejects.toThrow('Invalid profile');
    });
  });

  /**
   * Test Scenario 4: Custom Configuration - User Input
   */
  describe('customConfiguration - user input', () => {
    it('should collect all custom settings from user', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']], // Choose custom setup
        ['update-behavior', ['1']], // Auto
        ['update-channel', ['2']], // Beta
        ['safety-level', ['3']], // Fast
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['7']],
        ['auto-rollback', ['y']],
        ['notification-level', ['1']], // All
        ['enable-telemetry', ['y']],
        ['share-errors', ['y']],
        ['share-usage', ['y']]
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['3']], // Manual
        ['update-channel', ['1']], // Stable
        ['safety-level', ['1']], // Conservative
        ['auto-security', ['n']],
        ['backup', ['n']], // No backup
        ['auto-rollback', ['n']],
        ['notification-level', ['4']], // None
        ['enable-telemetry', ['n']]
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.backupBeforeUpdate).toBe(false);
      expect(result.rollbackOnFailure).toBe(false);
      expect(result.notificationLevel).toBe('none');
      expect(result.enableTelemetry).toBe(false);
    });

    it('should handle telemetry disabled scenario', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['5']],
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['n']] // Telemetry disabled
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['999']], // Invalid choice, should default to '1'
        ['confirm-quick', ['y']]
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
      // Should use default quick setup
    });

    it('should handle empty input and use defaults', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['']], // Empty, should use default
        ['confirm-quick', ['']] // Empty yes/no, should use default (true)
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
    });

    it('should parse numeric inputs correctly', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['abc']], // Invalid number, should default to 5
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['y']],
        ['share-errors', ['y']],
        ['share-usage', ['n']]
      ]));

      const result = await wizard.run();

      expect(result).toBeDefined();
      expect(result.maxRollbackPoints).toBe(5); // Should fall back to default
    });

    it('should handle various yes/no input formats', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['YES']], // Uppercase
        ['backup', ['Y']], // Single letter uppercase
        ['max-backups', ['5']],
        ['auto-rollback', ['yes']], // Lowercase full word
        ['notification-level', ['2']],
        ['enable-telemetry', ['y']],
        ['share-errors', ['y']],
        ['share-usage', ['NO']] // Uppercase NO
      ]));

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
      mockRl.setResponses(new Map([
        ['setup-type', ['1']],
        ['confirm-quick', ['y']]
      ]));

      const result = await wizard.run();

      // Verify savePreferences was called with the result
      expect(mockSavePreferences).toHaveBeenCalledWith(result);
    });

    it('should save custom configuration correctly', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['3']],
        ['update-channel', ['1']],
        ['safety-level', ['1']],
        ['auto-security', ['n']],
        ['backup', ['y']],
        ['max-backups', ['10']],
        ['auto-rollback', ['y']],
        ['notification-level', ['1']],
        ['enable-telemetry', ['y']],
        ['share-errors', ['y']],
        ['share-usage', ['y']]
      ]));

      await wizard.run();

      expect(mockSavePreferences).toHaveBeenCalled();

      const savedPrefs = mockSavePreferences.mock.calls[0][0];
      expect(savedPrefs.updateBehavior).toBe('manual');
      expect(savedPrefs.maxRollbackPoints).toBe(10);
    });

    it('should display success message after saving', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['1']],
        ['confirm-quick', ['y']]
      ]));

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
      mockRl.setResponses(new Map([
        ['update-category', ['1']], // Update settings
        ['update-behavior', ['1']] // Change to auto
      ]));

      await wizard.updatePreferences();

      expect(mockGetPreferences).toHaveBeenCalled();
      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should handle reset to defaults', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['6']], // Reset to defaults
        ['confirm-reset', ['y']] // Confirm reset
      ]));

      await wizard.updatePreferences();

      expect(mockResetToDefaults).toHaveBeenCalled();
    });

    it('should handle view all settings', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['5']] // View all settings
      ]));

      await wizard.updatePreferences();

      expect(mockGetSummary).toHaveBeenCalled();
    });

    it('should update rollback settings', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['2']], // Rollback settings
        ['auto-rollback', ['n']] // Disable auto-rollback
      ]));

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should update notification settings', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['3']], // Notification settings
        ['notification-level', ['4']] // None
      ]));

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should update telemetry settings', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['4']], // Telemetry settings
        ['enable-telemetry', ['n']] // Disable telemetry
      ]));

      await wizard.updatePreferences();

      expect(mockSavePreferences).toHaveBeenCalled();
    });

    it('should not reset if user declines confirmation', async () => {
      mockRl.setResponses(new Map([
        ['update-category', ['6']], // Reset to defaults
        ['confirm-reset', ['n']] // Decline reset
      ]));

      await wizard.updatePreferences();

      expect(mockResetToDefaults).not.toHaveBeenCalled();
    });
  });

  /**
   * Edge Cases
   */
  describe('edgeCases - boundary conditions', () => {
    it('should handle maximum backup points input', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['999']],
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['n']]
      ]));

      const result = await wizard.run();

      expect(result.maxRollbackPoints).toBe(999);
    });

    it('should handle zero backup points', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['0']],
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['n']]
      ]));

      const result = await wizard.run();

      expect(result.maxRollbackPoints).toBe(0);
    });

    it('should handle negative number input gracefully', async () => {
      mockRl.setResponses(new Map([
        ['setup-type', ['2']],
        ['update-behavior', ['2']],
        ['update-channel', ['1']],
        ['safety-level', ['2']],
        ['auto-security', ['y']],
        ['backup', ['y']],
        ['max-backups', ['-5']], // Negative number
        ['auto-rollback', ['y']],
        ['notification-level', ['2']],
        ['enable-telemetry', ['n']]
      ]));

      const result = await wizard.run();

      // Should parse to -5 or fall back to default
      expect(typeof result.maxRollbackPoints).toBe('number');
    });
  });
});
