/**
 * VERSATIL SDLC Framework - Jest Global Teardown
 * Enhanced Maria-QA Unit Testing Cleanup
 */

export default async function jestGlobalTeardown() {
  console.log('🧹 VERSATIL SDLC Framework - Starting Jest Global Teardown');

  const bmadConfig = (global as any).bmadJestConfig;

  if (bmadConfig) {
    const duration = Date.now() - bmadConfig.startTime;
    console.log('📊 Enhanced Maria-QA Unit Test Summary:');
    console.log(`   ⏱️  Total Duration: ${duration}ms`);
    console.log(`   🎯 Agent: ${bmadConfig.agent}`);
    console.log(`   🔧 Framework: ${bmadConfig.framework}`);
    console.log(`   📋 Test Type: ${bmadConfig.testType}`);

    // Cleanup global configuration
    delete (global as any).bmadJestConfig;
  }

  console.log('✅ Jest Global Teardown Complete');
}