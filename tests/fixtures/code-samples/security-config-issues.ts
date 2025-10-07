/**
 * Test Fixture: Security Configuration Vulnerabilities
 * Scenario: Detect security issues in configuration and API setup
 * Expected Issues: insecure-api-patterns, configuration-security-issues, security-risk
 * Target Agents: security-sam, enhanced-marcus, enhanced-maria
 */

// Hardcoded API key - security risk
const API_KEY = 'sk-test-fake-key-for-testing-only';

// Insecure API configuration
const apiConfig = {
  baseURL: 'http://localhost:3000', // Not HTTPS
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${API_KEY}`, // Hardcoded secret
    'X-API-Key': 'another-hardcoded-key'
  }
};

// Missing input validation
const processUserInput = (input) => {
  document.innerHTML = input; // XSS vulnerability
  eval(input); // Code injection vulnerability
};
