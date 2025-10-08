/**
 * Maria-QA Integration Example
 * Demonstrates how Maria-QA agent can use frontend audit tools
 */

import { frontendAudit } from '../../src/services/frontend/frontendAudit.service';
import { uiUxMeasurementService } from '../../src/services/frontend/uiUxMeasurement.service';

interface QualityGateResult {
  decision: 'PASS' | 'FAIL' | 'CONCERNS' | 'WAIVED';
  score: number;
  reason: string;
  criticalIssues: any[];
  recommendations: any[];
  componentCompliance?: number;
}

/**
 * Maria-QA Automated Frontend Review
 */
async function mariaFrontendReview(): Promise<QualityGateResult> {
  console.log('🤖 Maria-QA: Starting automated frontend review...\n');

  // Step 1: Run comprehensive audit
  console.log('Step 1/3: Running comprehensive UI/UX audit...');
  const auditReport = await frontendAudit.performComprehensiveAudit();
  console.log(`✓ Audit completed. Overall score: ${auditReport.overall_score}/100\n`);

  // Step 2: Assess component compliance
  console.log('Step 2/3: Assessing component compliance...');
  const components = await uiUxMeasurementService.assessComponentCompliance();
  const lowCompliance = components.filter(c => c.shadowComplianceScore < 70).length;
  console.log(`✓ ${components.length} components assessed. ${lowCompliance} need improvement\n`);

  // Step 3: Generate assessment report
  console.log('Step 3/3: Generating comprehensive assessment...');
  const fullReport = await uiUxMeasurementService.generateAssessmentReport();
  console.log(`✓ Assessment complete. System score: ${fullReport.overallScore.toFixed(1)}/100\n`);

  // Maria's Quality Gate Decision Logic
  console.log('=== MARIA-QA QUALITY GATE EVALUATION ===\n');

  // Check for critical blockers
  const criticalBlockers = auditReport.critical_issues.filter(
    issue => issue.severity === 'critical'
  );

  if (criticalBlockers.length > 0) {
    console.log(`❌ DECISION: FAIL`);
    console.log(`Reason: ${criticalBlockers.length} critical blocker(s) found`);
    console.log('\nCritical Blockers:');
    criticalBlockers.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.title} (${issue.location.file_path})`);
    });

    return {
      decision: 'FAIL',
      score: auditReport.overall_score,
      reason: `${criticalBlockers.length} critical blocker(s) must be fixed before deployment`,
      criticalIssues: criticalBlockers,
      recommendations: auditReport.improvement_recommendations.slice(0, 5)
    };
  }

  // Check overall score threshold
  if (auditReport.overall_score < 70) {
    console.log(`❌ DECISION: FAIL`);
    console.log(`Reason: Overall score ${auditReport.overall_score}/100 is below threshold (70)`);

    return {
      decision: 'FAIL',
      score: auditReport.overall_score,
      reason: `Frontend quality score ${auditReport.overall_score}/100 is below acceptable threshold`,
      criticalIssues: auditReport.critical_issues,
      recommendations: auditReport.improvement_recommendations.slice(0, 10)
    };
  }

  // Check for concerning issues
  const highSeverityIssues = auditReport.critical_issues.filter(
    issue => issue.severity === 'high'
  );

  if (highSeverityIssues.length > 0 || lowCompliance > 5) {
    console.log(`⚠️  DECISION: CONCERNS`);
    console.log(`Reason: ${highSeverityIssues.length} high-severity issue(s), ${lowCompliance} low-compliance component(s)`);
    console.log('\nHigh-Severity Issues:');
    highSeverityIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.title}`);
    });
    console.log(`\nLow-Compliance Components: ${lowCompliance}`);
    console.log('\nRecommendation: Address these issues in next sprint');

    return {
      decision: 'CONCERNS',
      score: auditReport.overall_score,
      reason: `Deployment approved with monitoring. ${highSeverityIssues.length} high-severity issues and ${lowCompliance} low-compliance components should be addressed`,
      criticalIssues: highSeverityIssues,
      recommendations: auditReport.improvement_recommendations.slice(0, 5),
      componentCompliance: lowCompliance
    };
  }

  // Check specific category thresholds
  const categoryThresholds = {
    accessibility: 85,
    performance: 80,
    visual_design: 75
  };

  const failedCategories: string[] = [];

  if (auditReport.categories.accessibility.score < categoryThresholds.accessibility) {
    failedCategories.push(`Accessibility: ${auditReport.categories.accessibility.score}% (threshold: ${categoryThresholds.accessibility}%)`);
  }
  if (auditReport.categories.performance.score < categoryThresholds.performance) {
    failedCategories.push(`Performance: ${auditReport.categories.performance.score}% (threshold: ${categoryThresholds.performance}%)`);
  }
  if (auditReport.categories.visual_design.score < categoryThresholds.visual_design) {
    failedCategories.push(`Visual Design: ${auditReport.categories.visual_design.score}% (threshold: ${categoryThresholds.visual_design}%)`);
  }

  if (failedCategories.length > 0) {
    console.log(`⚠️  DECISION: CONCERNS`);
    console.log(`Reason: ${failedCategories.length} category threshold(s) not met`);
    console.log('\nCategories Below Threshold:');
    failedCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
    });

    return {
      decision: 'CONCERNS',
      score: auditReport.overall_score,
      reason: `Some categories below threshold but overall quality acceptable`,
      criticalIssues: [],
      recommendations: auditReport.improvement_recommendations.slice(0, 3)
    };
  }

  // All checks passed
  console.log(`✅ DECISION: PASS`);
  console.log(`Score: ${auditReport.overall_score}/100`);
  console.log(`\nAll quality gates passed:`);
  console.log(`  ✓ No critical blockers`);
  console.log(`  ✓ Overall score above threshold`);
  console.log(`  ✓ Category thresholds met`);
  console.log(`  ✓ Component compliance acceptable`);

  return {
    decision: 'PASS',
    score: auditReport.overall_score,
    reason: 'All frontend quality gates passed',
    criticalIssues: [],
    recommendations: auditReport.improvement_recommendations.slice(0, 3)
  };
}

/**
 * Generate Maria's Quality Gate Report
 */
async function generateQualityGateReport(result: QualityGateResult) {
  console.log('\n=== MARIA-QA QUALITY GATE REPORT ===\n');
  console.log(`Decision: ${result.decision}`);
  console.log(`Score: ${result.score}/100`);
  console.log(`Reason: ${result.reason}\n`);

  if (result.criticalIssues.length > 0) {
    console.log(`Critical Issues (${result.criticalIssues.length}):`);
    result.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity}] ${issue.title}`);
      if (issue.auto_fixable) {
        console.log(`     Auto-fixable: Yes ✓`);
      }
    });
    console.log('');
  }

  if (result.recommendations.length > 0) {
    console.log(`Top Recommendations (${result.recommendations.length}):`);
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`     Effort: ${rec.implementation_effort} | Impact: ${rec.expected_impact}`);
    });
    console.log('');
  }

  if (result.componentCompliance !== undefined) {
    console.log(`Components Needing Improvement: ${result.componentCompliance}`);
  }

  // Next actions based on decision
  console.log('=== NEXT ACTIONS ===');
  switch (result.decision) {
    case 'PASS':
      console.log('✓ Approved for deployment');
      console.log('✓ Monitor production metrics');
      console.log('✓ Continue iterative improvements');
      break;

    case 'CONCERNS':
      console.log('⚠ Approved for deployment with monitoring');
      console.log('⚠ Create tickets for identified issues');
      console.log('⚠ Schedule improvement work for next sprint');
      console.log('⚠ Set up additional monitoring alerts');
      break;

    case 'FAIL':
      console.log('❌ Deployment BLOCKED');
      console.log('❌ Fix critical issues before retry');
      console.log('❌ Re-run quality gate after fixes');
      console.log('❌ Consider emergency hotfix if critical');
      break;

    case 'WAIVED':
      console.log('⚠ Quality gate waived by product owner');
      console.log('⚠ Document waiver reason and risk assessment');
      console.log('⚠ Plan remediation work');
      break;
  }
}

// Run Maria's automated review
mariaFrontendReview()
  .then(async (result) => {
    await generateQualityGateReport(result);

    console.log('\n✓ Maria-QA frontend review completed');

    // Exit code based on decision
    if (result.decision === 'FAIL') {
      process.exit(1); // Fail CI/CD pipeline
    } else {
      process.exit(0); // Pass CI/CD pipeline
    }
  })
  .catch((error) => {
    console.error('❌ Maria-QA review failed:', error);
    process.exit(1);
  });
