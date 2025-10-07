/**
 * Test Fixture: Cross-File Configuration Drift
 * Scenario: Detect configuration values that are inconsistent across files
 * Expected Issues: configuration-drift, hardcoded-endpoints
 * Target Agents: enhanced-marcus, enhanced-maria
 */

// File 1: config.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// File 2: services.ts (in same content for testing)
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // Different from config!
});

// File 3: constants.ts (in same content for testing)
export const DEFAULT_API_URL = 'https://api.production.com'; // Yet another different URL!
