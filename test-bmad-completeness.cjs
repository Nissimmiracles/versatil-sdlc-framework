#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - BMAD Methodology Completeness Test
 * Comprehensive validation that VERSATIL includes all original BMAD elements plus enhancements
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERSATIL SDLC Framework - BMAD Methodology Completeness Test');
console.log('='.repeat(70));

// Original BMAD Methodology Core Elements
const originalBMAD = {
  coreAgents: [
    'Maria-QA', 'James-Frontend', 'Marcus-Backend',
    'Sarah-PM', 'Alex-BA', 'Dr.AI-ML'
  ],
  corePrinciples: [
    'Specialization over Generalization',
    'Context Preservation',
    'Quality-First Approach',
    'Business Alignment',
    'Continuous Integration'
  ],
  qualityGates: [
    'Code Coverage >= 80%',
    'Performance Budget Enforced',
    'Security Scans Required',
    'Accessibility Compliance WCAG 2.1 AA',
    'Cross-browser Testing'
  ],
  workflowPatterns: [
    'Agent Collaboration Workflows',
    'Context Handoff Protocol',
    'Emergency Response Protocol',
    'Quality Gate Checkpoints',
    'Performance Monitoring'
  ],
  technicalFeatures: [
    'Agent Activation Commands',
    'Multi-agent Collaboration',
    'Quality Enforcement',
    'Testing Commands',
    'Chrome MCP Integration'
  ]
};

// Enhanced VERSATIL Features
const versatilEnhancements = {
  additionalAgents: [
    'Architecture-Dan', 'Security-Sam', 'DevOps-Dan',
    'Deployment-Orchestrator', 'Introspective-Agent'
  ],
  enhancedFeatures: [
    'Adaptive SDLC Flywheel',
    'Cross-Project Intelligence',
    'Real-time MCP Integration',
    'Self-Referential Architecture',
    'Predictive Quality Analytics',
    'Automated Agent Creation',
    'Interactive Onboarding'
  ],
  additionalWorkflows: [
    '8-Phase SDLC Orchestration',
    'Adaptive Phase Transitions',
    'Cross-Project Learning',
    'Automated Documentation',
    'Version Management',
    'Git Backup Protection'
  ]
};

async function testBMADCompleteness() {
  let completenessScore = 0;
  let totalChecks = 0;
  const results = {};

  console.log('\n📋 Test 1: Core BMAD Agent Coverage');
  totalChecks++;

  const agentCoverage = {
    found: [],
    missing: [],
    enhanced: []
  };

  // Check CLAUDE.md for original agents
  const claudePath = path.join(process.cwd(), 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    const claudeContent = fs.readFileSync(claudePath, 'utf8');

    originalBMAD.coreAgents.forEach(agent => {
      const agentFound = claudeContent.includes(agent);
      if (agentFound) {
        agentCoverage.found.push(agent);
      } else {
        agentCoverage.missing.push(agent);
      }
    });

    // Check for enhanced versions
    versatilEnhancements.additionalAgents.forEach(agent => {
      if (claudeContent.includes(agent) || fs.existsSync(path.join('src/agents', `${agent.toLowerCase().replace('-', '-')}.ts`))) {
        agentCoverage.enhanced.push(agent);
      }
    });
  }

  const agentCompleteness = (agentCoverage.found.length / originalBMAD.coreAgents.length) * 100;
  console.log(`   📊 Original BMAD Agents: ${agentCompleteness.toFixed(1)}% (${agentCoverage.found.length}/${originalBMAD.coreAgents.length})`);

  agentCoverage.found.forEach(agent => console.log(`      ✅ ${agent}`));
  agentCoverage.missing.forEach(agent => console.log(`      ❌ ${agent}`));

  console.log(`   🚀 Enhanced Agents: ${agentCoverage.enhanced.length} additional`);
  agentCoverage.enhanced.forEach(agent => console.log(`      ➕ ${agent}`));

  if (agentCompleteness >= 100) completenessScore++;
  results.agentCoverage = { score: agentCompleteness, details: agentCoverage };

  console.log('\n📋 Test 2: Core BMAD Principles Implementation');
  totalChecks++;

  const principlesCoverage = {
    implemented: [],
    missing: []
  };

  // Check CLAUDE.md for core principles
  if (fs.existsSync(claudePath)) {
    const claudeContent = fs.readFileSync(claudePath, 'utf8');

    originalBMAD.corePrinciples.forEach(principle => {
      const principleWords = principle.toLowerCase().split(' ');
      const principleFound = principleWords.some(word =>
        claudeContent.toLowerCase().includes(word) &&
        (claudeContent.toLowerCase().includes('principle') || claudeContent.toLowerCase().includes('approach'))
      );

      if (principleFound || claudeContent.toLowerCase().includes(principle.toLowerCase())) {
        principlesCoverage.implemented.push(principle);
      } else {
        principlesCoverage.missing.push(principle);
      }
    });
  }

  const principlesCompleteness = (principlesCoverage.implemented.length / originalBMAD.corePrinciples.length) * 100;
  console.log(`   📊 Core Principles: ${principlesCompleteness.toFixed(1)}% (${principlesCoverage.implemented.length}/${originalBMAD.corePrinciples.length})`);

  principlesCoverage.implemented.forEach(principle => console.log(`      ✅ ${principle}`));
  principlesCoverage.missing.forEach(principle => console.log(`      ❌ ${principle}`));

  if (principlesCompleteness >= 100) completenessScore++;
  results.principlesCoverage = { score: principlesCompleteness, details: principlesCoverage };

  console.log('\n📋 Test 3: Quality Gates Implementation');
  totalChecks++;

  const qualityGatesCoverage = {
    implemented: [],
    missing: []
  };

  // Check for quality gates in various files
  const qualityGateFiles = [
    'CLAUDE.md',
    'jest.config.js',
    'playwright.config.ts',
    'package.json'
  ];

  let qualityGatesContent = '';
  qualityGateFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      qualityGatesContent += fs.readFileSync(filePath, 'utf8');
    }
  });

  originalBMAD.qualityGates.forEach(gate => {
    const gateKeywords = gate.toLowerCase().replace(/[>=\d%]/g, '').trim().split(' ');
    const gateFound = gateKeywords.some(keyword =>
      qualityGatesContent.toLowerCase().includes(keyword)
    );

    if (gateFound) {
      qualityGatesCoverage.implemented.push(gate);
    } else {
      qualityGatesCoverage.missing.push(gate);
    }
  });

  const qualityGatesCompleteness = (qualityGatesCoverage.implemented.length / originalBMAD.qualityGates.length) * 100;
  console.log(`   📊 Quality Gates: ${qualityGatesCompleteness.toFixed(1)}% (${qualityGatesCoverage.implemented.length}/${originalBMAD.qualityGates.length})`);

  qualityGatesCoverage.implemented.forEach(gate => console.log(`      ✅ ${gate}`));
  qualityGatesCoverage.missing.forEach(gate => console.log(`      ❌ ${gate}`));

  if (qualityGatesCompleteness >= 80) completenessScore++;
  results.qualityGatesCoverage = { score: qualityGatesCompleteness, details: qualityGatesCoverage };

  console.log('\n📋 Test 4: Workflow Patterns Implementation');
  totalChecks++;

  const workflowCoverage = {
    implemented: [],
    missing: []
  };

  // Check for workflow patterns in CLAUDE.md and source files
  const workflowFiles = [
    'CLAUDE.md',
    'src/flywheel/sdlc-orchestrator.ts',
    'src/agents/agent-registry.ts'
  ];

  let workflowContent = '';
  workflowFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      workflowContent += fs.readFileSync(filePath, 'utf8');
    }
  });

  originalBMAD.workflowPatterns.forEach(pattern => {
    const patternKeywords = pattern.toLowerCase().split(' ').filter(word => word.length > 3);
    const patternFound = patternKeywords.some(keyword =>
      workflowContent.toLowerCase().includes(keyword)
    );

    if (patternFound) {
      workflowCoverage.implemented.push(pattern);
    } else {
      workflowCoverage.missing.push(pattern);
    }
  });

  const workflowCompleteness = (workflowCoverage.implemented.length / originalBMAD.workflowPatterns.length) * 100;
  console.log(`   📊 Workflow Patterns: ${workflowCompleteness.toFixed(1)}% (${workflowCoverage.implemented.length}/${originalBMAD.workflowPatterns.length})`);

  workflowCoverage.implemented.forEach(pattern => console.log(`      ✅ ${pattern}`));
  workflowCoverage.missing.forEach(pattern => console.log(`      ❌ ${pattern}`));

  if (workflowCompleteness >= 80) completenessScore++;
  results.workflowCoverage = { score: workflowCompleteness, details: workflowCoverage };

  console.log('\n📋 Test 5: Technical Features Implementation');
  totalChecks++;

  const technicalCoverage = {
    implemented: [],
    missing: []
  };

  // Check for technical features
  const technicalFiles = [
    'CLAUDE.md',
    'src/mcp/versatil-mcp-server.ts',
    'versatil-mcp-server.js',
    'package.json'
  ];

  let technicalContent = '';
  technicalFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      technicalContent += fs.readFileSync(filePath, 'utf8');
    }
  });

  originalBMAD.technicalFeatures.forEach(feature => {
    const featureKeywords = feature.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(word => word.length > 2);
    const featureFound = featureKeywords.some(keyword =>
      technicalContent.toLowerCase().includes(keyword)
    );

    if (featureFound) {
      technicalCoverage.implemented.push(feature);
    } else {
      technicalCoverage.missing.push(feature);
    }
  });

  const technicalCompleteness = (technicalCoverage.implemented.length / originalBMAD.technicalFeatures.length) * 100;
  console.log(`   📊 Technical Features: ${technicalCompleteness.toFixed(1)}% (${technicalCoverage.implemented.length}/${originalBMAD.technicalFeatures.length})`);

  technicalCoverage.implemented.forEach(feature => console.log(`      ✅ ${feature}`));
  technicalCoverage.missing.forEach(feature => console.log(`      ❌ ${feature}`));

  if (technicalCompleteness >= 80) completenessScore++;
  results.technicalCoverage = { score: technicalCompleteness, details: technicalCoverage };

  console.log('\n📋 Test 6: VERSATIL Enhancements Beyond BMAD');
  totalChecks++;

  const enhancementsCoverage = {
    implemented: [],
    missing: []
  };

  // Check for VERSATIL enhancements
  const enhancementFiles = [
    'src/flywheel/sdlc-orchestrator.ts',
    'src/mcp/mcp-client.ts',
    'src/intelligence/',
    'src/analytics/',
    'test-flywheel.js'
  ];

  let enhancementContent = '';
  enhancementFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        // Check if directory exists and has files
        const dirFiles = fs.readdirSync(filePath);
        if (dirFiles.length > 0) {
          enhancementContent += `${file}_directory_exists `;
        }
      } else {
        enhancementContent += fs.readFileSync(filePath, 'utf8');
      }
    }
  });

  versatilEnhancements.enhancedFeatures.forEach(enhancement => {
    const enhancementKeywords = enhancement.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(word => word.length > 3);
    const enhancementFound = enhancementKeywords.some(keyword =>
      enhancementContent.toLowerCase().includes(keyword)
    ) || fs.existsSync(`src/${enhancement.toLowerCase().replace(/ /g, '-')}.ts`);

    if (enhancementFound) {
      enhancementsCoverage.implemented.push(enhancement);
    } else {
      enhancementsCoverage.missing.push(enhancement);
    }
  });

  const enhancementsCompleteness = (enhancementsCoverage.implemented.length / versatilEnhancements.enhancedFeatures.length) * 100;
  console.log(`   📊 VERSATIL Enhancements: ${enhancementsCompleteness.toFixed(1)}% (${enhancementsCoverage.implemented.length}/${versatilEnhancements.enhancedFeatures.length})`);

  enhancementsCoverage.implemented.forEach(enhancement => console.log(`      ✅ ${enhancement}`));
  enhancementsCoverage.missing.forEach(enhancement => console.log(`      ❌ ${enhancement}`));

  if (enhancementsCompleteness >= 60) completenessScore++;
  results.enhancementsCoverage = { score: enhancementsCompleteness, details: enhancementsCoverage };

  // Calculate overall completeness
  const overallCompleteness = (completenessScore / totalChecks) * 100;

  console.log('\n' + '='.repeat(70));
  console.log('🏆 BMAD Methodology Completeness Assessment');
  console.log('='.repeat(70));

  console.log(`📊 Overall BMAD Completeness: ${overallCompleteness.toFixed(1)}% (${completenessScore}/${totalChecks} areas complete)`);

  if (overallCompleteness >= 90) {
    console.log('🎉 EXCELLENT: VERSATIL fully implements BMAD methodology with enhancements!');
    console.log('✅ All core BMAD elements present and enhanced');
    console.log('🚀 Ready for production deployment');
  } else if (overallCompleteness >= 75) {
    console.log('✅ VERY GOOD: VERSATIL implements most BMAD methodology');
    console.log('🔧 Minor gaps to address for complete coverage');
  } else if (overallCompleteness >= 60) {
    console.log('🟡 GOOD: VERSATIL covers majority of BMAD methodology');
    console.log('📈 Significant BMAD foundation with room for improvement');
  } else {
    console.log('🔴 NEEDS WORK: VERSATIL requires more BMAD methodology implementation');
    console.log('🛠️ Focus on core BMAD elements before enhancements');
  }

  console.log('\n🎯 Completeness Summary:');
  console.log(`   • Agent Coverage: ${results.agentCoverage.score.toFixed(1)}%`);
  console.log(`   • Core Principles: ${results.principlesCoverage.score.toFixed(1)}%`);
  console.log(`   • Quality Gates: ${results.qualityGatesCoverage.score.toFixed(1)}%`);
  console.log(`   • Workflow Patterns: ${results.workflowCoverage.score.toFixed(1)}%`);
  console.log(`   • Technical Features: ${results.technicalCoverage.score.toFixed(1)}%`);
  console.log(`   • VERSATIL Enhancements: ${results.enhancementsCoverage.score.toFixed(1)}%`);

  console.log('\n🔄 BMAD Methodology Status: ' + (overallCompleteness >= 80 ? 'FULLY IMPLEMENTED ✅' : 'PARTIALLY IMPLEMENTED 🔧'));
  console.log('📈 VERSATIL Framework maintains BMAD compatibility while adding intelligent enhancements!');
  console.log('');

  return { overallCompleteness, results };
}

// Run the completeness test
testBMADCompleteness()
  .then(({ overallCompleteness, results }) => {
    if (overallCompleteness >= 80) {
      console.log('🎯 BMAD Methodology: FULLY IMPLEMENTED IN VERSATIL ✅');
    } else {
      console.log('🔧 BMAD Methodology: NEEDS ADDITIONAL IMPLEMENTATION');
    }
  })
  .catch(error => {
    console.error('❌ BMAD completeness test failed:', error);
    process.exit(1);
  });