// Maria-QA Test Configuration
module.exports = {
  testTimeout: 30000,
  coverage: {
    threshold: 80,
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  },
  chromeMCP: {
    enabled: true,
    visualTesting: true,
    performanceTesting: true,
    accessibilityTesting: true
  }
};