/**
 * VERSATIL SDLC Framework - Jest Global Teardown
 * Enhanced Maria-QA Unit Testing Cleanup
 */

export default async function jestGlobalTeardown() {
  console.log('🧹 VERSATIL SDLC Framework - Starting Jest Global Teardown');

  const operaConfig = (global as any).operaJestConfig;

  if (operaConfig) {
    const duration = Date.now() - operaConfig.startTime;
    console.log('📊 Enhanced Maria-QA Unit Test Summary:');
    console.log(`   ⏱️  Total Duration: ${duration}ms`);
    console.log(`   🎯 Agent: ${operaConfig.agent}`);
    console.log(`   🔧 Framework: ${operaConfig.framework}`);
    console.log(`   📋 Test Type: ${operaConfig.testType}`);

    // Cleanup global configuration
    delete (global as any).operaJestConfig;
  }

  console.log('✅ Jest Global Teardown Complete');
}