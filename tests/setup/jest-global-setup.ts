/**
 * VERSATIL SDLC Framework - Jest Global Setup
 * Enhanced Maria-QA Unit Testing Initialization
 */

// Extend global type without breaking Jest
declare global {
  // eslint-disable-next-line no-var
  var bmadJestConfig: any;
}

// Required for TypeScript to treat this as a module
export {};

export default async function jestGlobalSetup() {
  console.log('🧪 VERSATIL SDLC Framework - Starting Jest Global Setup');
  console.log('👩‍🔬 Enhanced Maria-QA Unit Testing Initialization');

  // Set global test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['JEST_WORKER_ID'] = process.env['JEST_WORKER_ID'] || '1';

  // BMAD methodology configuration
  (global as any).bmadJestConfig = {
    agent: 'Enhanced Maria-QA',
    framework: 'VERSATIL SDLC',
    testType: 'unit',
    startTime: Date.now(),
    qualityGates: {
      coverage: {
        threshold: 80,
        enforced: true
      },
      performance: {
        maxTestTime: 15000,
        enforced: true
      }
    }
  };

  // Enhanced testing capabilities
  console.log('🎯 BMAD Unit Testing Standards:');
  console.log('   📊 Coverage Threshold: 80%+');
  console.log('   ⏱️  Max Test Time: 15s');
  console.log('   🔧 Hybrid Jest + Playwright Integration');

  console.log('✅ Jest Global Setup Complete');
}