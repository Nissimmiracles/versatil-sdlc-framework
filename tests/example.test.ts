/**
 * Example Test - Created to test proactive agent activation
 * If Maria-QA proactive mode works, she should activate automatically
 */

describe('Example Test Suite', () => {
  it('should demonstrate basic test structure', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should test string operations', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
  });

  it('should validate boolean logic', () => {
    const isTrue = true;
    const isFalse = false;

    expect(isTrue).toBe(true);
    expect(isFalse).toBe(false);
  });
});

describe('Async Operations', () => {
  it('should handle promises', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});