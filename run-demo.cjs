// Quick test runner for VERSATIL v1.2.0
const { helloAutonomousWorld, autonomousBugFixJourney, beforeAfterComparison } = require('./tests/enhanced-demo-suite.js');

console.log('🚀 VERSATIL v1.2.0 Demo Runner\n');
console.log('Select a demo:');
console.log('1. Hello Autonomous World (Learning Demo)');
console.log('2. Autonomous Bug Fix Journey');
console.log('3. Before vs After Comparison\n');

// Run the first demo by default
console.log('Running: Hello Autonomous World...\n');

helloAutonomousWorld()
  .then(() => {
    console.log('\n✨ Demo complete! The AI has learned and will apply this knowledge to future tasks!');
    console.log('\nTo run other demos, edit run-demo.cjs and change the function call.');
  })
  .catch(console.error);
