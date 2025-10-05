/**
 * Test Suite: ConfigValidator
 * Tests for v3.0.0 configuration validation and sanitization
 * Target: 90%+ coverage
 */

import { ConfigValidator, ValidationResult } from '../../../src/config/config-validator';
import { UserPreferences } from '../../../src/config/preference-manager';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('Scenario 1: Validate Update Behavior', () => {
    it('should accept valid update behaviors', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'auto'
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(true);
      expect(result.errors.filter(e => e.field === 'updateBehavior')).toHaveLength(0);
    });

    it('should reject invalid update behavior', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'invalid' as any
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'updateBehavior')).toBe(true);
    });

    it('should accept all valid update behaviors', () => {
      const behaviors: any[] = ['auto', 'notify', 'manual'];

      behaviors.forEach(behavior => {
        const result = validator.validate({ updateBehavior: behavior });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Scenario 2: Validate Update Channel', () => {
    it('should accept valid update channels', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'stable'
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid update channel', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'experimental' as any
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'updateChannel')).toBe(true);
    });
  });

  describe('Scenario 3: Validate Safety Level', () => {
    it('should accept valid safety levels', () => {
      const levels: any[] = ['conservative', 'balanced', 'fast'];

      levels.forEach(level => {
        const result = validator.validate({ safetyLevel: level });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid safety level', () => {
      const prefs: Partial<UserPreferences> = {
        safetyLevel: 'slow' as any
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
    });
  });

  describe('Scenario 4: Validate Check Frequency', () => {
    it('should accept valid check frequency', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: 24
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(true);
    });

    it('should reject negative check frequency', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: -5
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'checkFrequency')).toBe(true);
    });

    it('should warn about very frequent checks', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: 0.5 // 30 minutes
      };

      const result = validator.validate(prefs);

      expect(result.errors.some(e => e.field === 'checkFrequency' && e.severity === 'warning')).toBe(true);
    });

    it('should accept zero check frequency (disabled)', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: 0
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(true);
    });
  });

  describe('Scenario 5: Validate Rollback Behavior', () => {
    it('should accept valid rollback behaviors', () => {
      const behaviors: any[] = ['auto', 'prompt', 'manual'];

      behaviors.forEach(behavior => {
        const result = validator.validate({ rollbackBehavior: behavior });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid rollback behavior', () => {
      const prefs: Partial<UserPreferences> = {
        rollbackBehavior: 'never' as any
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
    });
  });

  describe('Scenario 6: Validate Max Rollback Points', () => {
    it('should accept valid max rollback points', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: 5
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(true);
    });

    it('should reject negative max rollback points', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: -1
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
    });

    it('should warn when max rollback points is zero', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: 0
      };

      const result = validator.validate(prefs);

      expect(result.errors.some(e => e.field === 'maxRollbackPoints' && e.severity === 'warning')).toBe(true);
    });

    it('should warn when max rollback points is very high', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: 25
      };

      const result = validator.validate(prefs);

      expect(result.errors.some(e => e.field === 'maxRollbackPoints' && e.severity === 'warning')).toBe(true);
    });
  });

  describe('Scenario 7: Check Logical Consistency', () => {
    it('should warn about auto updates without rollback', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'auto',
        rollbackOnFailure: false
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'updateBehavior')).toBe(true);
    });

    it('should warn about alpha channel with conservative safety', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'alpha',
        safetyLevel: 'conservative'
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'updateChannel')).toBe(true);
    });

    it('should warn about auto updates without backups', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'auto',
        backupBeforeUpdate: false
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'backupBeforeUpdate')).toBe(true);
    });

    it('should warn about skipping validation', () => {
      const prefs: Partial<UserPreferences> = {
        validateAfterUpdate: false
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'validateAfterUpdate')).toBe(true);
    });

    it('should warn about manual updates with frequent checks', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'manual',
        checkFrequency: 1 // Every hour
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'checkFrequency')).toBe(true);
    });

    it('should warn about auto updates with no notifications', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'auto',
        notificationLevel: 'none'
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'notificationLevel')).toBe(true);
    });

    it('should warn about prerelease on stable channel', () => {
      const prefs: Partial<UserPreferences> = {
        allowPrerelease: true,
        updateChannel: 'stable'
      };

      const result = validator.validate(prefs);

      expect(result.warnings.some(w => w.field === 'allowPrerelease')).toBe(true);
    });
  });

  describe('Scenario 8: Generate Suggestions', () => {
    it('should suggest for unstable channels', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'alpha'
      };

      const result = validator.validate(prefs);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.toLowerCase().includes('rollback'))).toBe(true);
    });

    it('should suggest when telemetry is disabled', () => {
      const prefs: Partial<UserPreferences> = {
        enableTelemetry: false
      };

      const result = validator.validate(prefs);

      expect(result.suggestions.some(s => s.includes('Telemetry'))).toBe(true);
    });

    it('should suggest security auto-install', () => {
      const prefs: Partial<UserPreferences> = {
        autoInstallSecurity: false
      };

      const result = validator.validate(prefs);

      expect(result.suggestions.some(s => s.includes('security'))).toBe(true);
    });

    it('should suggest for fast safety level', () => {
      const prefs: Partial<UserPreferences> = {
        safetyLevel: 'fast'
      };

      const result = validator.validate(prefs);

      expect(result.suggestions.some(s => s.includes('backup'))).toBe(true);
    });
  });

  describe('Scenario 9: Sanitize Preferences', () => {
    it('should sanitize invalid update behavior to default', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'invalid' as any
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.updateBehavior).toBe('notify');
    });

    it('should sanitize invalid update channel to stable', () => {
      const prefs: Partial<UserPreferences> = {
        updateChannel: 'experimental' as any
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.updateChannel).toBe('stable');
    });

    it('should sanitize negative check frequency to zero', () => {
      const prefs: Partial<UserPreferences> = {
        checkFrequency: -10
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.checkFrequency).toBe(0);
    });

    it('should cap max rollback points at 50', () => {
      const prefs: Partial<UserPreferences> = {
        maxRollbackPoints: 100
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.maxRollbackPoints).toBe(50);
    });

    it('should sanitize invalid safety level to balanced', () => {
      const prefs: Partial<UserPreferences> = {
        safetyLevel: 'turbo' as any
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.safetyLevel).toBe('balanced');
    });

    it('should sanitize invalid rollback behavior to prompt', () => {
      const prefs: Partial<UserPreferences> = {
        rollbackBehavior: 'never' as any
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.rollbackBehavior).toBe('prompt');
    });
  });

  describe('Scenario 10: Generate Validation Report', () => {
    it('should generate report with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { field: 'updateBehavior', message: 'Invalid value', severity: 'error' },
          { field: 'checkFrequency', message: 'Must be >= 0', severity: 'error' }
        ],
        warnings: [],
        suggestions: []
      };

      const report = validator.generateReport(result);

      expect(report).toContain('❌ Configuration has errors');
      expect(report).toContain('updateBehavior');
      expect(report).toContain('checkFrequency');
    });

    it('should generate report with warnings', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          { field: 'updateBehavior', message: 'Risky configuration', recommendation: 'Enable rollback' }
        ],
        suggestions: []
      };

      const report = validator.generateReport(result);

      expect(report).toContain('⚠️');
      expect(report).toContain('Risky configuration');
      expect(report).toContain('Enable rollback');
    });

    it('should generate report with suggestions', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: ['Consider enabling telemetry', 'Increase maxRollbackPoints']
      };

      const report = validator.generateReport(result);

      expect(report).toContain('💡');
      expect(report).toContain('Consider enabling telemetry');
      expect(report).toContain('Increase maxRollbackPoints');
    });

    it('should show success when valid', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      const report = validator.generateReport(result);

      expect(report).toContain('✅ Configuration is valid');
    });
  });

  describe('Scenario 11: Validate and Sanitize Combined', () => {
    it('should validate and sanitize in one operation', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'invalid' as any,
        checkFrequency: -5,
        maxRollbackPoints: 100
      };

      const { valid, sanitized, report } = validator.validateAndSanitize(prefs);

      expect(valid).toBe(false); // Original was invalid
      expect(sanitized.updateBehavior).toBe('notify'); // Sanitized
      expect(sanitized.checkFrequency).toBe(0); // Sanitized
      expect(sanitized.maxRollbackPoints).toBe(50); // Capped
      expect(report).toContain('Configuration');
    });

    it('should return valid report for good preferences', () => {
      const prefs: Partial<UserPreferences> = {
        updateBehavior: 'notify',
        updateChannel: 'stable',
        safetyLevel: 'balanced',
        checkFrequency: 24,
        maxRollbackPoints: 5
      };

      const { valid, sanitized, report } = validator.validateAndSanitize(prefs);

      expect(valid).toBe(true);
      expect(sanitized.updateBehavior).toBe('notify');
      expect(report).toContain('✅');
    });
  });

  describe('Scenario 12: Validate Notification Level', () => {
    it('should accept valid notification levels', () => {
      const levels: any[] = ['all', 'important', 'critical', 'none'];

      levels.forEach(level => {
        const result = validator.validate({ notificationLevel: level });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid notification level', () => {
      const prefs: Partial<UserPreferences> = {
        notificationLevel: 'verbose' as any
      };

      const result = validator.validate(prefs);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'notificationLevel')).toBe(true);
    });

    it('should sanitize invalid notification level to important', () => {
      const prefs: Partial<UserPreferences> = {
        notificationLevel: 'debug' as any
      };

      const sanitized = validator.sanitize(prefs);

      expect(sanitized.notificationLevel).toBe('important');
    });
  });
});
