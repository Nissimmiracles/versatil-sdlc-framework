/**
 * Basic Frontend Audit Example
 * Demonstrates how to run a comprehensive frontend audit
 */

import { frontendAudit } from '../../src/services/frontend/frontendAudit.service';

async function runBasicAudit() {
  console.log('🎨 Starting Frontend Audit...\n');

  // Run comprehensive audit
  const report = await frontendAudit.performComprehensiveAudit();

  // Display overall results
  console.log('=== AUDIT RESULTS ===');
  console.log(`Overall Score: ${report.overall_score}/100`);
  console.log(`Timestamp: ${report.audit_timestamp}`);
  console.log(`Critical Issues: ${report.critical_issues.length}`);
  console.log(`Recommendations: ${report.improvement_recommendations.length}\n`);

  // Display category scores
  console.log('=== CATEGORY SCORES ===');
  console.log(`Visual Design: ${report.categories.visual_design.score}/100`);
  console.log(`User Experience: ${report.categories.user_experience.score}/100`);
  console.log(`Accessibility: ${report.categories.accessibility.score}/100`);
  console.log(`Performance: ${report.categories.performance.score}/100`);
  console.log(`Responsiveness: ${report.categories.responsiveness.score}/100`);
  console.log(`Component Quality: ${report.categories.component_quality.score}/100\n`);

  // Display critical issues
  if (report.critical_issues.length > 0) {
    console.log('=== CRITICAL ISSUES ===');
    report.critical_issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Location: ${issue.location.file_path}`);
      if (issue.location.component_name) {
        console.log(`   Component: ${issue.location.component_name}`);
      }
      console.log(`   Impact: ${issue.impact}`);
      console.log(`   Auto-fixable: ${issue.auto_fixable ? 'Yes ✓' : 'No'}`);
    });
    console.log('\n');
  }

  // Display top 5 recommendations
  console.log('=== TOP RECOMMENDATIONS ===');
  const topRecs = report.improvement_recommendations.slice(0, 5);
  topRecs.forEach((rec, index) => {
    console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
    console.log(`   Category: ${rec.category}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Implementation Effort: ${rec.implementation_effort}`);
    console.log(`   Expected Impact: ${rec.expected_impact}`);
  });
  console.log('\n');

  // Display automated fixes
  if (report.automated_fixes.length > 0) {
    console.log('=== AUTOMATED FIXES AVAILABLE ===');
    report.automated_fixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.description}`);
      console.log(`   Target: ${fix.target_file}`);
      console.log(`   Type: ${fix.fix_type}`);
      console.log(`   Confidence: ${fix.confidence}%`);
      console.log(`   Preview: ${fix.preview}`);
    });
    console.log('\n');
  }

  // Decision based on score
  if (report.overall_score >= 80) {
    console.log('✅ Frontend quality is EXCELLENT');
  } else if (report.overall_score >= 70) {
    console.log('⚠️  Frontend quality is GOOD but needs improvement');
  } else {
    console.log('❌ Frontend quality needs SIGNIFICANT improvement');
  }

  return report;
}

// Run the audit
runBasicAudit()
  .then((report) => {
    console.log('\n✓ Audit completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
