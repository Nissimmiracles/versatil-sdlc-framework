/**
 * Component Compliance Example
 * Demonstrates how to measure component compliance with design system standards
 */

import { uiUxMeasurementService } from '../../src/services/frontend/uiUxMeasurement.service';

async function measureComponentCompliance() {
  console.log('📊 Measuring Component Compliance...\n');

  // Assess all components
  const components = await uiUxMeasurementService.assessComponentCompliance();

  console.log(`=== COMPONENT COMPLIANCE SUMMARY ===`);
  console.log(`Total Components: ${components.length}`);

  // Calculate statistics
  const avgShadcnCompliance = components.reduce((sum, c) => sum + c.shadowComplianceScore, 0) / components.length;
  const avgAccessibility = components.reduce((sum, c) => sum + c.accessibilityScore, 0) / components.length;
  const avgPerformance = components.reduce((sum, c) => sum + c.performanceScore, 0) / components.length;
  const avgResponsive = components.reduce((sum, c) => sum + c.responsiveDesignScore, 0) / components.length;

  console.log(`Average Shadcn Compliance: ${avgShadcnCompliance.toFixed(1)}%`);
  console.log(`Average Accessibility: ${avgAccessibility.toFixed(1)}%`);
  console.log(`Average Performance: ${avgPerformance.toFixed(1)}%`);
  console.log(`Average Responsive Design: ${avgResponsive.toFixed(1)}%\n`);

  // Group by design system adoption
  const adoptionGroups = {
    shadcn: components.filter(c => c.designSystemAdoption === 'shadcn'),
    antd: components.filter(c => c.designSystemAdoption === 'antd'),
    mixed: components.filter(c => c.designSystemAdoption === 'mixed'),
    legacy: components.filter(c => c.designSystemAdoption === 'legacy')
  };

  console.log('=== DESIGN SYSTEM ADOPTION ===');
  console.log(`Shadcn Components: ${adoptionGroups.shadcn.length} (${(adoptionGroups.shadcn.length / components.length * 100).toFixed(1)}%)`);
  console.log(`Ant Design Components: ${adoptionGroups.antd.length} (${(adoptionGroups.antd.length / components.length * 100).toFixed(1)}%)`);
  console.log(`Mixed Components: ${adoptionGroups.mixed.length} (${(adoptionGroups.mixed.length / components.length * 100).toFixed(1)}%)`);
  console.log(`Legacy Components: ${adoptionGroups.legacy.length} (${(adoptionGroups.legacy.length / components.length * 100).toFixed(1)}%)\n`);

  // Identify components needing improvement
  const lowCompliance = components.filter(c => c.shadowComplianceScore < 70);
  const lowAccessibility = components.filter(c => c.accessibilityScore < 80);
  const lowPerformance = components.filter(c => c.performanceScore < 75);

  if (lowCompliance.length > 0) {
    console.log('=== COMPONENTS NEEDING IMPROVEMENT ===');
    console.log(`\nLow Shadcn Compliance (${lowCompliance.length}):`);
    lowCompliance.slice(0, 10).forEach(c => {
      console.log(`  - ${c.componentName}: ${c.shadowComplianceScore}% (${c.filePath})`);
    });
  }

  if (lowAccessibility.length > 0) {
    console.log(`\nLow Accessibility (${lowAccessibility.length}):`);
    lowAccessibility.slice(0, 10).forEach(c => {
      console.log(`  - ${c.componentName}: ${c.accessibilityScore}% (${c.filePath})`);
    });
  }

  if (lowPerformance.length > 0) {
    console.log(`\nLow Performance (${lowPerformance.length}):`);
    lowPerformance.slice(0, 10).forEach(c => {
      console.log(`  - ${c.componentName}: ${c.performanceScore}% (${c.filePath})`);
    });
  }

  // Display issues
  const componentsWithIssues = components.filter(c => c.issuesFound.length > 0);
  if (componentsWithIssues.length > 0) {
    console.log(`\n=== COMPONENTS WITH ISSUES (${componentsWithIssues.length}) ===`);
    componentsWithIssues.slice(0, 10).forEach(c => {
      console.log(`\n${c.componentName}:`);
      c.issuesFound.forEach(issue => {
        console.log(`  ⚠ ${issue}`);
      });
    });
  }

  // Generate health report
  console.log('\n=== DESIGN SYSTEM HEALTH REPORT ===');
  const report = await uiUxMeasurementService.generateAssessmentReport();
  const health = report.designSystemHealth;

  console.log(`Total Components: ${health.totalComponents}`);
  console.log(`Shadcn Adoption Rate: ${health.shadcnAdoptionRate.toFixed(1)}%`);
  console.log(`Ant Design Legacy: ${health.antdLegacyCount} components`);
  console.log(`Consistency Index: ${health.consistencyIndex.toFixed(1)}%`);
  console.log(`Accessibility Compliance: ${health.accessibilityCompliance.toFixed(1)}%`);
  console.log(`Performance Budget Compliance: ${health.performanceBudgetCompliance.toFixed(1)}%`);

  // Recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  // Critical issues
  if (report.criticalIssues.length > 0) {
    console.log('\n=== CRITICAL ISSUES ===');
    report.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  return report;
}

// Run the compliance measurement
measureComponentCompliance()
  .then((report) => {
    console.log(`\n✓ Compliance assessment completed`);
    console.log(`Overall System Score: ${report.overallScore.toFixed(1)}/100`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Compliance measurement failed:', error);
    process.exit(1);
  });
