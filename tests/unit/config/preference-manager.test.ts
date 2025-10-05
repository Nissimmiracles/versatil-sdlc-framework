/**
 * Test Suite: PreferenceManager
 * Tests for v3.0.0 user preference management
 * Target: 90%+ coverage
 */

import { PreferenceManager, UserPreferences } from '../../../src/config/preference-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock fs module
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('PreferenceManager', () => {
  let preferenceManager: PreferenceManager;
  let mockPreferencesFile: string;

  beforeEach(() => {
    jest.clearAllMocks();

    preferenceManager = new PreferenceManager();
    mockPreferencesFile = path.join(os.homedir(), '.versatil', 'preferences.json');

    // Default mocks
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
    mockFs.access.mockRejectedValue(new Error('ENOENT'));
  });

  describe('Scenario 1: Get Default Preferences', () => {
    it('should return defaults when no preferences file exists', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const prefs = await preferenceManager.getPreferences();

      expect(prefs.updateBehavior).toBe('notify');
      expect(prefs.updateChannel).toBe('stable');
      expect(prefs.safetyLevel).toBe('balanced');
      expect(prefs.checkFrequency).toBe(24);
      expect(prefs.maxRollbackPoints).toBe(5);
    });

    it('should return defaults from getDefaultPreferences()', () => {
      const defaults = preferenceManager.getDefaultPreferences();

      expect(defaults.updateBehavior).toBe('notify');
      expect(defaults.rollbackBehavior).toBe('prompt');
      expect(defaults.notificationLevel).toBe('important');
      expect(defaults.enableTelemetry).toBe(true);
      expect(defaults.backupBeforeUpdate).toBe(true);
      expect(defaults.validateAfterUpdate).toBe(true);
    });
  });

  describe('Scenario 2: Save Preferences', () => {
    it('should save preferences successfully', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      await preferenceManager.savePreferences({
        updateBehavior: 'auto',
        checkFrequency: 12
      });

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.versatil'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        mockPreferencesFile,
        expect.stringContaining('"updateBehavior":"auto"')
      );
    });

    it('should merge partial preferences with existing', async () => {
      const existing: UserPreferences = {
        ...preferenceManager.getDefaultPreferences(),
        updateBehavior: 'manual'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existing));

      await preferenceManager.savePreferences({ checkFrequency: 48 });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        mockPreferencesFile,
        expect.stringMatching(/"updateBehavior":"manual"/)
      );
    });

    it('should update lastModified timestamp', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      const beforeSave = new Date();
      await preferenceManager.savePreferences({ updateBehavior: 'auto' });

      const writeCall = mockFs.writeFile.mock.calls[0][1] as string;
      const saved = JSON.parse(writeCall);

      expect(new Date(saved.lastModified).getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });
  });

  describe('Scenario 3: Get/Set Single Preference', () => {
    it('should get specific preference', async () => {
      const mockPrefs: UserPreferences = {
        ...preferenceManager.getDefaultPreferences(),
        updateChannel: 'beta'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPrefs));

      const channel = await preferenceManager.getPreference('updateChannel');

      expect(channel).toBe('beta');
    });

    it('should set specific preference', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      await preferenceManager.setPreference('updateBehavior', 'auto');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        mockPreferencesFile,
        expect.stringContaining('"updateBehavior":"auto"')
      );
    });

    it('should update lastModified when setting preference', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      await preferenceManager.setPreference('checkFrequency', 12);

      const writeCall = mockFs.writeFile.mock.calls[0][1] as string;
      const saved = JSON.parse(writeCall);

      expect(saved.lastModified).toBeDefined();
    });
  });

  describe('Scenario 4: Update Multiple Preferences', () => {
    it('should update multiple preferences at once', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      await preferenceManager.updatePreferences({
        updateBehavior: 'auto',
        updateChannel: 'beta',
        checkFrequency: 6
      });

      const writeCall = mockFs.writeFile.mock.calls[0][1] as string;
      const saved = JSON.parse(writeCall);

      expect(saved.updateBehavior).toBe('auto');
      expect(saved.updateChannel).toBe('beta');
      expect(saved.checkFrequency).toBe(6);
    });
  });

  describe('Scenario 5: Reset to Defaults', () => {
    it('should reset preferences to defaults', async () => {
      await preferenceManager.resetToDefaults();

      const writeCall = mockFs.writeFile.mock.calls[0][1] as string;
      const saved = JSON.parse(writeCall);

      expect(saved.updateBehavior).toBe('notify');
      expect(saved.updateChannel).toBe('stable');
      expect(saved.safetyLevel).toBe('balanced');
    });

    it('should create directory when resetting', async () => {
      await preferenceManager.resetToDefaults();

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.versatil'),
        { recursive: true }
      );
    });
  });

  describe('Scenario 6: Validate Preferences', () => {
    it('should validate correct preferences', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'auto',
        updateChannel: 'stable',
        safetyLevel: 'balanced'
      };

      const result = preferenceManager.validatePreferences(prefs);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid update behavior', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'invalid' as any
      };

      const result = preferenceManager.validatePreferences(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('updateBehavior'))).toBe(true);
    });

    it('should detect invalid update channel', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'experimental' as any
      };

      const result = preferenceManager.validatePreferences(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('updateChannel'))).toBe(true);
    });

    it('should detect invalid check frequency', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: -5
      };

      const result = preferenceManager.validatePreferences(prefs);

      expect(result.valid).toBe(false);
    });

    it('should detect invalid max rollback points', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: -1
      };

      const result = preferenceManager.validatePreferences(prefs);

      expect(result.valid).toBe(false);
    });
  });

  describe('Scenario 7: Get Preferences Summary', () => {
    it('should generate human-readable summary', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(preferenceManager.getDefaultPreferences()));

      const summary = await preferenceManager.getSummary();

      expect(summary).toContain('📦 Updates:');
      expect(summary).toContain('Behavior: notify');
      expect(summary).toContain('Channel: stable');
      expect(summary).toContain('🔄 Rollback:');
      expect(summary).toContain('🔔 Notifications:');
      expect(summary).toContain('📊 Telemetry:');
    });

    it('should show custom preferences in summary', async () => {
      const customPrefs: UserPreferences = {
        ...preferenceManager.getDefaultPreferences(),
        updateBehavior: 'auto',
        updateChannel: 'beta',
        maxRollbackPoints: 10
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(customPrefs));

      const summary = await preferenceManager.getSummary();

      expect(summary).toContain('Behavior: auto');
      expect(summary).toContain('Channel: beta');
      expect(summary).toContain('Max Points: 10');
    });
  });

  describe('Scenario 8: Export/Import Preferences', () => {
    it('should export preferences to file', async () => {
      const mockPrefs = preferenceManager.getDefaultPreferences();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPrefs));

      await preferenceManager.exportPreferences('/tmp/prefs.json');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/tmp/prefs.json',
        expect.stringContaining('updateBehavior')
      );
    });

    it('should import preferences from file', async () => {
      const importedPrefs: UserPreferences = {
        ...preferenceManager.getDefaultPreferences(),
        updateBehavior: 'auto',
        updateChannel: 'beta'
      };

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(importedPrefs)) // Import read
        .mockResolvedValueOnce(JSON.stringify(preferenceManager.getDefaultPreferences())); // Get current prefs

      await preferenceManager.importPreferences('/tmp/prefs.json');

      const writeCall = mockFs.writeFile.mock.calls[0][1] as string;
      const saved = JSON.parse(writeCall);

      expect(saved.updateBehavior).toBe('auto');
      expect(saved.updateChannel).toBe('beta');
    });

    it('should reject invalid imported preferences', async () => {
      const invalidPrefs: Partial<UserPreferences> = {
        updateBehavior: 'invalid' as any
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidPrefs));

      await expect(
        preferenceManager.importPreferences('/tmp/invalid.json')
      ).rejects.toThrow('Invalid preferences');
    });
  });

  describe('Scenario 9: Migrate Preferences', () => {
    it('should migrate old version preferences', async () => {
      const oldPrefs = {
        updateBehavior: 'auto',
        version: '0.9.0' // Old version
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(oldPrefs));

      const prefs = await preferenceManager.getPreferences();

      expect(prefs.version).toBe('1.0.0'); // Migrated to current version
      expect(prefs.updateBehavior).toBe('auto'); // Preserved old setting
      expect(prefs.updateChannel).toBe('stable'); // Default for new field
    });

    it('should not migrate if version matches', async () => {
      const currentPrefs: UserPreferences = {
        ...preferenceManager.getDefaultPreferences(),
        version: '1.0.0'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(currentPrefs));

      const prefs = await preferenceManager.getPreferences();

      expect(prefs.version).toBe('1.0.0');
      // Should not write file (no migration needed)
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 10: Check Setup Wizard Requirement', () => {
    it('should require setup wizard when no preferences exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const shouldRun = await preferenceManager.shouldRunSetupWizard();

      expect(shouldRun).toBe(true);
    });

    it('should not require setup wizard when preferences exist', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const shouldRun = await preferenceManager.shouldRunSetupWizard();

      expect(shouldRun).toBe(false);
    });
  });
});
