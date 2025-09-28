/**
 * VERSATIL SDLC Framework - BMAD UI/UX Testing Flywheel E2E Test
 * Validates the operational UI/UX testing flywheel implementation
 */

import { test, expect } from '@playwright/test';

test.describe('BMAD UI/UX Testing Flywheel', () => {
  test('should demonstrate operational testing flywheel capabilities', async ({ page }) => {
    await page.goto('/');

    // Verify the framework is running with operational flywheel
    await expect(page.locator('text=Framework Quality Dashboard')).toBeVisible();
    await expect(page.locator('text=BMAD Methodology Status')).toBeVisible();
    await expect(page.locator('text=Agent Specialization: Working')).toBeVisible();
    await expect(page.locator('text=Real-time Testing: Active')).toBeVisible();
  });

  test('should display comprehensive framework status', async ({ page }) => {
    const response = await page.request.get('/api/framework/status');
    expect(response.ok()).toBeTruthy();

    const statusData = await response.json();
    expect(statusData.realityScore).toBe(70);
    expect(statusData.capabilities.agentActivation.status).toBe('working');
    expect(statusData.capabilities.mcpIntegration.status).toBe('working');
  });

  test('should show operational agent system', async ({ page }) => {
    await page.goto('/');

    // Verify all Enhanced BMAD agents are operational
    await expect(page.locator('text=Enhanced Maria-QA: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced James: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced Marcus: Active')).toBeVisible();

    // Verify MCP integration is working
    await expect(page.locator('text=Chrome MCP: Connected')).toBeVisible();
  });

  test('should validate BMAD context for testing flywheel', async ({ page }) => {
    await page.goto('/');

    // Verify BMAD context includes quality gates
    const bmadContext = await page.evaluate(() => (window as any).bmadContext);
    expect(bmadContext.framework).toBe('VERSATIL SDLC');
    expect(bmadContext.qualityGates.performance).toBe(true);
    expect(bmadContext.qualityGates.accessibility).toBe(true);
    expect(bmadContext.qualityGates.security).toBe(true);
    expect(bmadContext.qualityGates.visual).toBe(true);
  });

  test('should demonstrate honest framework assessment', async ({ page }) => {
    await page.goto('/');

    // Framework provides honest assessment
    await expect(page.locator('text=70/100')).toBeVisible();
    await expect(page.locator('text=Honest Assessment')).toBeVisible();
    await expect(page.locator('text=CLI Operations: 40% functional')).toBeVisible();
    await expect(page.locator('text=Agent System: 85% functional')).toBeVisible();
    await expect(page.locator('text=MCP Integration: 90% functional')).toBeVisible();
  });
});