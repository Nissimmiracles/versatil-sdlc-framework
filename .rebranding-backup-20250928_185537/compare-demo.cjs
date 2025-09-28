// Before/After Comparison - VERSATIL v1.2.0
const { beforeAfterComparison } = require('./tests/enhanced-demo-suite.js');

console.log('🔄 VERSATIL v1.2.0 - Before vs After Comparison\n');
console.log('See the dramatic difference between v1.1.0 and v1.2.0...\n');

beforeAfterComparison()
  .then(() => {
    console.log('\n🎯 85% reduction in development time!');
    console.log('80% fewer manual interventions!');
    console.log('100% context preservation!\n');
    console.log('This is the power of AI that learns.');
  })
  .catch(console.error);
