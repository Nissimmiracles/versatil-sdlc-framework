import { {{CLASS_NAME}} } from '@/{{MODULE_PATH}}';

describe('{{MODULE}} - {{CLASS_NAME}}', () => {
  let {{INSTANCE_NAME}}: {{CLASS_NAME}};

  beforeEach(() => {
    {{INSTANCE_NAME}} = new {{CLASS_NAME}}();
  });

  describe('{{METHOD_1}}', () => {
    it('should {{TEST_1_DESC}}', async () => {
      // Arrange
      const {{INPUT_VAR}} = {{INPUT_VALUE}};

      // Act
      const result = await {{INSTANCE_NAME}}.{{METHOD_1}}({{INPUT_VAR}});

      // Assert
      expect(result).{{ASSERTION_1}};
      expect(result.{{PROPERTY_1}}).{{ASSERTION_2}};
    });

    it('should handle {{ERROR_CASE_1}}', async () => {
      // Arrange
      const {{INVALID_INPUT}} = {{INVALID_VALUE}};

      // Act & Assert
      await expect({{INSTANCE_NAME}}.{{METHOD_1}}({{INVALID_INPUT}}))
        .rejects
        .toThrow('{{ERROR_MESSAGE}}');
    });
  });

  describe('{{METHOD_2}}', () => {
    it('should {{TEST_2_DESC}}', () => {
      // Arrange
      const {{INPUT_2}} = {{INPUT_2_VALUE}};

      // Act
      const result = {{INSTANCE_NAME}}.{{METHOD_2}}({{INPUT_2}});

      // Assert
      expect(result).toBe({{EXPECTED_2}});
    });
  });
});
