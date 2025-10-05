import { EnhancedMaria } from './dist/agents/enhanced-maria.js';

const maria = new EnhancedMaria();
console.log('✅ Enhanced Maria instantiates');
console.log('Name:', maria.name);
console.log('Specialization:', maria.specialization);

const result = await maria.activate({
  filePath: 'test.js',
  content: 'console.log("test"); debugger;',
  trigger: 'test'
});

console.log('✅ Analysis complete');
console.log('Message:', result.message);
console.log('Suggestions:', result.suggestions.length);
console.log('Context has prompt:', !!result.context.generatedPrompt);
console.log('Context score:', result.context.analysisScore);
console.log('Priority:', result.priority);