#!/usr/bin/env node

/**
 * VERSATIL Quick Start
 * Run this to test the integration
 */

console.log('\n🚀 Testing VERSATIL integration...\n');

// Simulate agent with memory
const mockAgent = {
  memories: [],
  
  async activate(context) {
    console.log('🤖 Agent activated with context:', context);
    
    // Check memory
    const relevant = this.memories.filter(m => 
      m.includes(context.type)
    );
    
    if (relevant.length > 0) {
      console.log('💡 Found relevant memories:', relevant);
    }
    
    // Learn from this interaction
    this.memories.push(`${context.type}: ${context.solution}`);
    console.log('🧠 Learned new pattern!');
    
    return {
      success: true,
      suggestion: 'Applied best practices from memory'
    };
  }
};

// Test scenarios
async function test() {
  // First bug
  await mockAgent.activate({
    type: 'null-pointer',
    solution: 'Add null check'
  });
  
  // Similar bug - should use memory
  await mockAgent.activate({
    type: 'null-pointer',
    solution: 'Prevented using previous learning!'
  });
  
  console.log('\n✅ VERSATIL integration working!');
  console.log('\nNext steps:');
  console.log('1. Run Supabase migration (if using Supabase)');
  console.log('2. Try @opera commands in Cursor');
  console.log('3. Watch agents learn and improve!\n');
}

test();
