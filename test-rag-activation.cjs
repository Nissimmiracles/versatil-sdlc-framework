#!/usr/bin/env node

/**
 * Test RAG Activation System
 * Tests keyword detection and pattern loading
 */

const fs = require('fs');
const path = require('path');

// Test cases
const testCases = [
  {
    question: "How do I implement hooks?",
    expectedPatterns: ['native-sdk-integration-v6.6.0.json'],
    keywords: ['hooks']
  },
  {
    question: "How does verification work?",
    expectedPatterns: ['victor-verifier-anti-hallucination.json'],
    keywords: ['verification']
  },
  {
    question: "What are the security coverage requirements?",
    expectedPatterns: ['assessment-engine-v6.6.0.json'],
    keywords: ['security', 'coverage']
  },
  {
    question: "How do I implement verification hooks?",
    expectedPatterns: ['native-sdk-integration-v6.6.0.json', 'victor-verifier-anti-hallucination.json'],
    keywords: ['hooks', 'verification']
  },
  {
    question: "How does CODIFY compounding learning work?",
    expectedPatterns: ['session-codify-compounding.json'],
    keywords: ['codify', 'compounding', 'learning']
  }
];

// Keyword mapping (same as in before-prompt.ts)
const KEYWORD_MAP = {
  'hook|hooks|sdk|native|settings\\.json|posttooluse|subagent.*stop|stop.*hook|userpromptsub':
    'native-sdk-integration-v6.6.0.json',
  'verification|verifier|verify|hallucination|anti.*hallucination|victor|cove|chain.*of.*verification|proof.*log|confidence.*scor':
    'victor-verifier-anti-hallucination.json',
  'assessment|assess|quality.*audit|pattern.*detection|security.*scan|coverage.*requirement|semgrep|lighthouse|axe.*core':
    'assessment-engine-v6.6.0.json',
  'codify|learning|compounding|session.*end|claude\\.md|automatic.*learning|stop.*hook.*learning':
    'session-codify-compounding.json',
  'marketplace|repository.*org|cleanup|archive|plugin.*metadata|\\.claude.*plugin':
    'marketplace-repository-organization.json'
};

function detectMatchingPatterns(userMessage) {
  const messageLower = userMessage.toLowerCase();
  const matchedFiles = [];

  for (const [keywords, patternFile] of Object.entries(KEYWORD_MAP)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(messageLower)) {
      matchedFiles.push(patternFile);
    }
  }

  return Array.from(new Set(matchedFiles));
}

function loadPattern(filename) {
  try {
    const patternPath = path.join(__dirname, '.versatil', 'learning', 'patterns', filename);

    if (!fs.existsSync(patternPath)) {
      return null;
    }

    const content = fs.readFileSync(patternPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Run tests
console.log('🧪 Testing RAG Auto-Activation System\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase.question}"`);
  console.log('-'.repeat(60));

  // Detect patterns
  const matchedFiles = detectMatchingPatterns(testCase.question);

  console.log(`Keywords detected: ${testCase.keywords.join(', ')}`);
  console.log(`Patterns matched: ${matchedFiles.length}`);

  if (matchedFiles.length > 0) {
    matchedFiles.forEach(file => console.log(`  - ${file}`));
  }

  // Load patterns
  const patterns = [];
  for (const filename of matchedFiles) {
    const pattern = loadPattern(filename);
    if (pattern) {
      patterns.push(pattern);
      console.log(`✅ Loaded: ${pattern.name}`);
      console.log(`   Success Rate: ${(pattern.metrics.successRate * 100).toFixed(0)}%`);
      if (pattern.metrics.effortHours) {
        console.log(`   Effort: ${pattern.metrics.effortHours}h (estimated ${pattern.metrics.estimatedHours}h)`);
      }
    }
  }

  // Verify expected patterns
  const expectedCount = testCase.expectedPatterns.length;
  const actualCount = matchedFiles.length;

  if (actualCount === expectedCount) {
    console.log(`\n✅ PASS: Matched ${actualCount} pattern(s) as expected`);
    passed++;
  } else {
    console.log(`\n❌ FAIL: Expected ${expectedCount} pattern(s), got ${actualCount}`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(0)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! RAG activation is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Check keyword mappings.');
}

process.exit(failed === 0 ? 0 : 1);
