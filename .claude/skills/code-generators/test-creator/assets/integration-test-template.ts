import { {{SERVICE_1}}, {{SERVICE_2}} } from '@/{{MODULE_PATH}}';

describe('{{FEATURE}} - Integration Tests', () => {
  let {{SERVICE_1_VAR}}: {{SERVICE_1}};
  let {{SERVICE_2_VAR}}: {{SERVICE_2}};

  beforeAll(async () => {
    // Setup test environment
    {{SERVICE_1_VAR}} = new {{SERVICE_1}}();
    {{SERVICE_2_VAR}} = new {{SERVICE_2}}();
    await {{SETUP_CODE}};
  });

  afterAll(async () => {
    // Cleanup
    await {{CLEANUP_CODE}};
  });

  describe('{{WORKFLOW_1}}', () => {
    it('should {{INTEGRATION_TEST_1_DESC}}', async () => {
      // Arrange
      const {{INPUT}} = {{INPUT_VALUE}};

      // Act - Step 1
      const {{RESULT_1}} = await {{SERVICE_1_VAR}}.{{METHOD_1}}({{INPUT}});

      // Act - Step 2
      const {{RESULT_2}} = await {{SERVICE_2_VAR}}.{{METHOD_2}}({{RESULT_1}});

      // Assert
      expect({{RESULT_2}}).toBeDefined();
      expect({{RESULT_2}}.{{PROPERTY}}).toBe({{EXPECTED}});
    });
  });
});
